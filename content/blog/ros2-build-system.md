---
title: "How ROS 2 Builds and Links Packages: Inside colcon, ament and CMake"
date: 2026-11-08
description: "What really happens between `colcon build` and a running node: package discovery, build ordering, CMake targets, the ament index and the Linux dynamic loader."
tags: ["ros2", "tooling"]
series: ""
draft: false
---

When you run `colcon build` in a ROS 2 workspace, how does ROS know which packages to build first, where to find their dependencies, and how to link everything together?

The short answer is that ROS 2 has no compiler, linker or build system of its own. It coordinates existing tools, and a workspace build relies on **three separate mechanisms**:

- **colcon** reads the `package.xml` files and decides in which order packages are built.
- **CMake** reads the `CMakeLists.txt` files and decides what is compiled and what is linked to what.
- **The ament index and the shell environment** decide where installed packages and libraries are found when you run something.

Each one has its own data and its own failure messages. You have probably met them, and they look alike even though each comes from a different mechanism:

{{< callout title="Error cheat sheet" >}}
- `Could not find a package configuration file`: **colcon and `CMAKE_PREFIX_PATH`.** The dependency is not declared in `package.xml`, or its package was not built and sourced before yours.
- `undefined reference`: **CMake and the linker.** The header was found but the library was never linked, usually a missing `target_link_libraries`.
- `Package 'x' not found`: **the ament index.** The workspace is not sourced in this terminal, so `AMENT_PREFIX_PATH` does not contain it.
- `error while loading shared libraries`: **the dynamic loader.** The program built and linked fine, but the library's directory is not in `LD_LIBRARY_PATH` at runtime.
{{< /callout >}}

This post follows a build from `package.xml` to a running executable, one mechanism at a time, and shows where each message comes from. It assumes you already use `colcon build` and have written a `CMakeLists.txt`.

## Two packages and one function

Two packages are used all along. `robot_math` builds a shared library with one function, `robot_controller` builds an executable that calls it.

```text
ros2_ws/src/
├── robot_math/
│   ├── package.xml
│   ├── CMakeLists.txt
│   ├── include/robot_math/clamp.hpp
│   └── src/clamp.cpp
└── robot_controller/
    ├── package.xml
    ├── CMakeLists.txt
    └── src/main.cpp
```

```cpp
// robot_math/include/robot_math/clamp.hpp
#pragma once
namespace robot_math { double clamp(double v, double lo, double hi); }
```

```cpp
// robot_controller/src/main.cpp
#include <iostream>
#include "robot_math/clamp.hpp"

int main() { std::cout << robot_math::clamp(12.0, 0.0, 10.0) << "\n"; }
```

The terminal outputs in the next sections come from a real build of this layout, done with plain CMake and the install layout that `ament_cmake` produces. ament adds metadata and environment files on top, but the compile, link and load steps are identical. Paths are shortened to `/tmp/exp`.

The thread of the post is two questions. How does ROS 2 know it must build `robot_math` before `robot_controller`? And once both are built, how does the executable find the library at runtime?

## colcon decides the order before anything is compiled

The first thing `colcon build` does is walk the workspace and ask a set of identification extensions whether each directory is a package. For ROS packages, the extension reads `package.xml` and takes the package name, the declared build type and the dependencies. `robot_controller` declares its dependency on `robot_math` like this:

```xml
<buildtool_depend>ament_cmake</buildtool_depend>
<depend>robot_math</depend>

<export>
  <build_type>ament_cmake</build_type>
</export>
```

The `<export><build_type>` tag tells colcon which build task to use. The `<depend>` tag is a shortcut for three kinds of dependency: build, build export and execution.

This declaration **links nothing**. No include path, no library and no compiler flag comes from `package.xml`. Its purpose is to feed colcon's dependency graph (and tools such as `rosdep`), and from that graph colcon computes a **topological order**: a package is built only after everything it depends on, inside the workspace, has been built and installed.

```bash
colcon list --topological-order --names-only
# robot_math
# robot_controller
colcon graph
```

{{< mermaid caption="From <code>package.xml</code> files to a build order." >}}
%%{init: {"flowchart": {"rankSpacing": 24, "nodeSpacing": 20, "padding": 5}}}%%
flowchart TB
  A["robot_math<br/>package.xml"] --> G["colcon<br/>dependency graph"]
  B["robot_controller<br/>depend: robot_math"] --> G
  G --> S1["1. build and install<br/>robot_math"]
  S1 --> S2["2. build and install<br/>robot_controller"]
{{< /mermaid >}}

Dependencies that are not in the workspace, such as `rclcpp`, are ignored for ordering. They are expected to come from an underlay like `/opt/ros/<distro>`, which you source before building.

A forgotten `<depend>` is a classic trap. Without it colcon sees two unrelated packages, builds them in parallel and in no guaranteed order, and `robot_controller` may start before `robot_math` is installed. It often seems to work anyway, because an earlier build left `install/robot_math` in a sourced environment, and then it fails on a clean machine or in CI with `Could not find a package configuration file provided by "robot_math"`.

Once the order is known, colcon still does not compile anything. It plans the work and delegates it to a **build task**, selected by the package's build type. For an `ament_cmake` package the task runs CMake three times over: configure, build, install. Each package gets its own directories:

```text
ros2_ws/
├── build/robot_math/            # CMake build tree and object files
├── install/robot_math/          # what other packages and the runtime use
├── install/setup.bash           # the script you source
└── log/latest_build/robot_math/ # command.log lists the exact commands
```

Before building `robot_controller`, colcon prepares an environment that contains the install prefix of each package it **declared** a dependency on, using small hook scripts that every package installs. That is how `install/robot_math` ends up in `CMAKE_PREFIX_PATH`, the variable CMake searches to find packages. It is also why the order from the previous section matters: the prefix has to exist before `robot_controller` asks for it.

## What CMake does with your code

CMake does not compile anything either. It reads `CMakeLists.txt`, builds a graph of **targets** (libraries and executables) with their properties, such as sources, include directories and link dependencies, and generates build files for Make or Ninja. The real commands for `controller_node` look like this:

```text
c++ -isystem /tmp/exp/install/robot_math/include/robot_math \
    -o CMakeFiles/controller_node.dir/src/main.cpp.o -c src/main.cpp

c++ CMakeFiles/controller_node.dir/src/main.cpp.o -o controller_node \
    -Wl,-rpath,/tmp/exp/install/robot_math/lib: \
    /tmp/exp/install/robot_math/lib/librobot_math.so
```

The first command compiles one `.cpp` file. The preprocessor replaces `#include "robot_math/clamp.hpp"` by the content of the header, found through `-isystem`, and the compiler turns the result into an object file, `main.cpp.o`. If the include directory is missing, this is where it fails, with `fatal error: robot_math/clamp.hpp: No such file or directory`.

All the compiler knows about `clamp` is its **prototype**: the name and three `double` parameters, which is enough to check the call and to generate the code that prepares it. It does not know where the function lives, so it leaves a hole in the object file, labelled with the function's name:

```bash
nm -C main.cpp.o | grep clamp
#                  U robot_math::clamp(double, double, double)
```

`U` means undefined: this object file needs the symbol and does not provide it. That is why the compilation succeeds even if `librobot_math.so` does not exist yet, and why every `.cpp` can be compiled separately and in parallel.

The second command is the link. The linker takes `main.cpp.o` and `librobot_math.so` and checks that every missing symbol is defined somewhere:

```bash
nm -DC --defined-only librobot_math.so | grep clamp
# 00000000000010f9 T robot_math::clamp(double, double, double)
```

`T` means the library defines the symbol. If the library is missing from the link, the compilation has succeeded and the link fails with the classic message:

```text
main.cpp:(.text+0x25): undefined reference to `robot_math::clamp(double, double, double)'
```

{{< mermaid caption="The compiler sees the declaration, the linker sees the definition." >}}
%%{init: {"flowchart": {"rankSpacing": 24, "nodeSpacing": 20, "padding": 5}}}%%
flowchart TB
  H["clamp.hpp<br/>declaration only"] --> C["compiler<br/>main.cpp.o"]
  M["main.cpp"] --> C
  C --> L["linker<br/>resolves clamp"]
  S["librobot_math.so<br/>defines clamp"] --> L
  L --> E["controller_node"]
{{< /mermaid >}}

Three kinds of file are involved, and they are easy to mix up:

| File | Made by | What it is |
| --- | --- | --- |
| Object file (`.o`) | The compiler, one per `.cpp` | Not loadable, still has holes (`readelf -h` says `REL`) |
| Shared library (`.so`) | The linker, from several `.o` | Symbols resolved and published (`DYN`), loaded into the process at startup |
| Static library (`.a`) | An archive of `.o` files | Its code is copied into the executable at link time |

With a shared library the linker copies nothing: it checks that the symbol exists and records that the executable will need `librobot_math.so` at startup.

In `CMakeLists.txt`, two commands are involved, and they are often written side by side:

```cmake
find_package(robot_math REQUIRED)
target_link_libraries(controller_node PUBLIC robot_math::robot_math)
```

`find_package` and `target_link_libraries` do two different jobs:

- `find_package` searches `CMAKE_PREFIX_PATH` for `robot_mathConfig.cmake` and runs it. This **creates** the imported target `robot_math::robot_math`, but nothing is linked yet.
- `target_link_libraries` **uses** it. The target carries its include directory and the path of its `.so` as properties, and linking against it adds both the `-isystem` flag and the library to the commands above.

The keyword (`PUBLIC`, `PRIVATE`, `INTERFACE`) states whether the dependency is also passed on to whoever links against `controller_node`.

{{< callout title="Why not just add the include path by hand?" >}}
`include_directories(../robot_math/include)` makes the compilation pass, but it bypasses the target. Three things go wrong:

- CMake no longer knows that `controller_node` depends on `robot_math`: the library is not linked and its own dependencies (Eigen, say) are not found.
- The path is tied to your source layout, so it breaks once installed or built elsewhere.
- It can hide a missing `<depend>`, since it works as long as an old build is lying around.

The imported target carries the header, the library and its dependencies together. For a library that exports nothing, prefer a `pkg_check_modules(... IMPORTED_TARGET ...)` target or a small `Find<Name>.cmake` over a global path, and scope any manual path to one target with `target_include_directories`.
{{< /callout >}}

{{< callout title="What if the function body is in the header?" >}}
A non-`inline` function defined in a header is compiled into every `.cpp` that includes it, and the link fails with `multiple definition`: a function may be defined only once in the whole program.

With `inline`, identical definitions are allowed. The compiler emits each copy as a **weak symbol** (`W` in `nm`), and the linker keeps the first one it meets and discards the others. It does not check that the copies are identical: in a test with two files defining `f()` as `1` and `2`, linking them in one order printed `1 1`, in the other `2 2`, without any warning. And the code then lives inside the programs that use it: no `.so` is needed, and changing it means recompiling them.
{{< /callout >}}

## What ament adds on top of CMake

CMake can already build, install and export targets. What it has no idea about are the conventions that make a directory a ROS 2 package: a name registered in an index, a `package.xml` installed next to the files, environment scripts for the shell, and a standard way to export targets and their dependencies. The ament macros fill that gap. This is `robot_math/CMakeLists.txt`:

```cmake
cmake_minimum_required(VERSION 3.16)
project(robot_math)
find_package(ament_cmake REQUIRED)

add_library(robot_math SHARED src/clamp.cpp)
target_include_directories(robot_math PUBLIC
  $<BUILD_INTERFACE:${CMAKE_CURRENT_SOURCE_DIR}/include>
  $<INSTALL_INTERFACE:include/${PROJECT_NAME}>)

install(DIRECTORY include/ DESTINATION include/${PROJECT_NAME})
install(TARGETS robot_math EXPORT export_robot_math
  LIBRARY DESTINATION lib ARCHIVE DESTINATION lib RUNTIME DESTINATION bin)

ament_export_targets(export_robot_math HAS_LIBRARY_TARGET)
ament_package()
```

And this is `robot_controller/CMakeLists.txt`:

```cmake
cmake_minimum_required(VERSION 3.16)
project(robot_controller)
find_package(ament_cmake REQUIRED)
find_package(robot_math REQUIRED)

add_executable(controller_node src/main.cpp)
target_link_libraries(controller_node PUBLIC robot_math::robot_math)

install(TARGETS controller_node DESTINATION lib/${PROJECT_NAME})
ament_package()
```

Four ament macros turn this into a ROS 2 package, and each one answers a different question:

| Macro | What it does | Without it |
| --- | --- | --- |
| `ament_export_targets()` | Exports the targets, so `find_package(robot_math)` can recreate `robot_math::robot_math` | Consumers cannot find the target |
| `ament_export_dependencies()` | Records the packages consumers must find too (`Eigen3`, if your public headers include it) | Consumers get a missing include or a link error |
| `ament_package()` | Installs `robot_mathConfig.cmake`, a copy of `package.xml`, the environment hooks and the index markers | The package is invisible to `find_package` and to ROS tools |
| `ament_target_dependencies()` | Old shortcut, deprecated since Kilted in favour of `target_link_libraries()` | Nothing, use the imported target instead |

Two details are worth keeping in mind. `ament_package()` must be the last call in the file. And the `HAS_LIBRARY_TARGET` argument of `ament_export_targets()` registers the hook that adds the package's `lib` directory to the library search path, which is what makes the last section of this post work.

After the build, the install tree of `robot_math` looks like this:

```text
install/robot_math/
├── include/robot_math/robot_math/clamp.hpp
├── lib/librobot_math.so
└── share/
    ├── ament_index/resource_index/packages/robot_math
    └── robot_math/
        ├── cmake/robot_mathConfig.cmake     # entry point of find_package
        ├── package.xml
        └── local_setup.bash, hook/ ...      # environment scripts
```

`find_package(robot_math)` in `robot_controller` tries `<prefix>/share/<name>*/cmake/<name>Config.cmake` for every prefix in `CMAKE_PREFIX_PATH`, which is how it finds `share/robot_math/cmake/robot_mathConfig.cmake` in `install/robot_math`. That file defines the imported target, with its include directory and the path of `librobot_math.so` as properties. The flags seen in the previous section were read from exactly these properties.

`find_package()` finds packages at build time, for CMake. At runtime the tools do not run CMake: `ros2 run`, launch files and `get_package_share_directory()` ask a simpler question, where is the package installed? The answer comes from the **ament resource index**, a set of marker files that `ament_package()` writes into the install tree:

```text
install/robot_math/share/ament_index/resource_index/
├── packages/robot_math                  # empty file: "this prefix contains robot_math"
├── package_run_dependencies/robot_math  # its run dependencies
└── parent_prefix_path/robot_math        # prefixes it was built on top of
```

The `packages` marker is usually an empty file: its existence is the information. The lookup uses the variable `AMENT_PREFIX_PATH`, a list of install prefixes that `source install/setup.bash` extends. For each prefix, the code checks whether `<prefix>/share/ament_index/resource_index/packages/<name>` exists, and the first hit wins.

```python
from ament_index_python.packages import get_package_share_directory

get_package_share_directory("robot_math")
# '/home/me/ros2_ws/install/robot_math/share/robot_math'
```

The call is cheap because nothing is scanned or parsed: it does a handful of file-existence checks. If the terminal was not sourced, `AMENT_PREFIX_PATH` does not contain your workspace, and `ros2 run robot_controller controller_node` answers `Package 'robot_controller' not found`. `ros2 pkg prefix robot_controller` shows what the index sees.

Once the prefix is known, `ros2 run` looks for the executable in `lib/robot_controller/`, which is why the `CMakeLists.txt` installs the target with `DESTINATION lib/${PROJECT_NAME}`.

There are therefore two independent discovery mechanisms, filled from the same install prefixes but used by different tools:

| | CMake discovery | ROS 2 discovery |
| --- | --- | --- |
| Used by | `find_package()` at build time | `ros2 run`, launch files, `get_package_share_directory()` |
| Looks in | `CMAKE_PREFIX_PATH` | `AMENT_PREFIX_PATH` |
| Looks for | `<name>Config.cmake` | `resource_index/packages/<name>` |
| Gives | Imported targets and variables | A prefix and a share directory |

## Starting the program: who finds the library?

With the environment sourced, `ros2 run` finds the package and executes `lib/robot_controller/controller_node`. ROS is now out of the picture: what starts the program is the Linux kernel and its dynamic loader, `ld.so`. The executable does not contain the path of the library, only its **name**, in the `DT_NEEDED` entries of the ELF file:

```bash
readelf -d install/robot_controller/lib/robot_controller/controller_node | grep -E 'NEEDED|RPATH|RUNPATH'
#  (NEEDED)   Shared library: [librobot_math.so]
#  (NEEDED)   Shared library: [libstdc++.so.6]
#  (NEEDED)   Shared library: [libc.so.6]
```

For each name, the loader looks in a fixed list of places, in this order: the `DT_RPATH` of the executable (only if there is no `DT_RUNPATH`), the `LD_LIBRARY_PATH` environment variable, the `DT_RUNPATH` of the executable, the cache `/etc/ld.so.cache` built by `ldconfig`, and finally the default system directories such as `/lib` and `/usr/lib`. That last step is why `libc` and `libstdc++` are found without any setup, and why `librobot_math.so` is not: `install/robot_math/lib` is in none of these places.

The executable from the **build tree** has a `RUNPATH`. CMake adds it so that you can run the program straight after building:

```bash
readelf -d build/robot_controller/controller_node | grep RUNPATH
#  (RUNPATH)  Library runpath: [/tmp/exp/install/robot_math/lib:]
```

The one from the **install tree** has none, because CMake clears the build paths when it installs. In a fresh terminal the library is not found, and putting the prefix in `LD_LIBRARY_PATH` fixes it:

```bash
ldd install/robot_controller/lib/robot_controller/controller_node | grep robot_math
#  librobot_math.so => not found
# (running it fails with: error while loading shared libraries: librobot_math.so)

LD_LIBRARY_PATH=/tmp/exp/install/robot_math/lib ./controller_node
# 10
```

That is exactly what `source install/setup.bash` does for you. Each package installs a hook that adds its `lib` directory to `LD_LIBRARY_PATH` (the one registered by `HAS_LIBRARY_TARGET`), and `setup.bash` runs them all. A ROS 2 workspace relies on the **environment** to find shared libraries, not on paths written inside the binaries. This explains a classic symptom: a node that runs in your sourced terminal and fails from a `systemd` service, a Docker `CMD` or an IDE launcher. The binary is fine, the environment is not.

{{< callout title="Why not write the path in the binary?" >}}
It would work on one machine with a workspace that never moves, and CMake can do it (`CMAKE_INSTALL_RPATH_USE_LINK_PATH`, or a relative `$ORIGIN/...` path). ROS 2 does not, for two reasons:

- An absolute path breaks as soon as the install is copied (a Docker image, a robot, a build farm). The environment survives, since `install/setup.bash` works out its own location.
- You have to source the workspace anyway, for `ros2 run`, the index and plugins, so `LD_LIBRARY_PATH` costs nothing extra.

It is a design choice, not a technical limit.
{{< /callout >}}

## What breaks where

The whole chain, from the workspace to a running process:

{{< mermaid caption="The chain from the workspace to a running process." >}}
%%{init: {"flowchart": {"rankSpacing": 24, "nodeSpacing": 20, "padding": 5}}}%%
flowchart TB
  A["colcon<br/>package.xml files<br/>dependency graph, build order"] --> B["CMake<br/>find_package, targets<br/>compile and link"]
  B --> C["install tree<br/>lib/, share/pkg/cmake<br/>share/ament_index"]
  C --> D["runtime<br/>ros2 run: AMENT_PREFIX_PATH<br/>ld.so: LD_LIBRARY_PATH"]
  classDef run fill:#FFEFC2,stroke:#E5D28A,color:#6B4A00
  class D run
{{< /mermaid >}}

The three mechanisms are not derived from one another. `package.xml` gives colcon an order and links nothing. CMake targets give the compiler and linker their instructions and know nothing about the index. The index and the environment answer questions at runtime and never look at your sources. When something breaks, the note at the top tells you which mechanism to blame, and this is the first command to run:

| Message | First thing to run |
| --- | --- |
| `Could not find a package configuration file` | `colcon graph`, then check the `<depend>` in `package.xml` |
| `undefined reference` | Look for the library in `target_link_libraries` |
| `Package 'x' not found` | `ros2 pkg prefix x`, after sourcing the workspace |
| `error while loading shared libraries` | `ldd` on the executable, then `echo $LD_LIBRARY_PATH` |

To go further, the [colcon documentation](https://colcon.readthedocs.io/) describes the discovery and build task extensions, the [ament_cmake documentation](https://docs.ros.org/en/rolling/How-To-Guides/Ament-CMake-Documentation.html) covers the macros used here, and the [CMake `find_package` reference](https://cmake.org/cmake/help/latest/command/find_package.html) lists every place searched for configuration files.
