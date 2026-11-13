---
title: "Xenomai: What It Is and How It Differs from Other Real-Time OSes"
date: 2026-11-12
description: "A map of the ways to get real-time behavior (tuned Linux, PREEMPT_RT, RTOSes, co-kernels), the limit of each one, and where Xenomai and its dual-kernel approach fit."
tags: ["real-time", "linux", "xenomai"]
series: ""
---

You write a control loop that must run every millisecond. On a standard Linux, it works most of the time, then once in a while one iteration arrives 5 ms late because the kernel was busy with something else. On a desk it does not matter. On a robot or an EtherCAT bus, it is a fault.

Many solutions exist to fix this, and they do not fix the same problem. This post first draws the **map of the solutions** and what separates a general-purpose OS from a real-time one. Then it looks at the **limit of each solution**, and uses these limits to explain what **Xenomai** is and why it exists.

The post assumes that you know what a thread, a scheduler and an interrupt are. It does not cover how to install Xenomai.

## What "real-time" means

Real-time does not mean "fast". It means **predictable**: a task must finish before its deadline, **every time**. What matters is not the average latency but the **worst case** (the maximum *jitter*).

| | Soft real-time | Hard real-time |
| --- | --- | --- |
| A missed deadline | Degrades quality (video frame dropped) | Is a failure (robot, drive, safety function) |
| What you measure | Average and percentiles | **Maximum** latency |
| Example | Audio, video, UI | Motor control, EtherCAT cycle, safety |

Two numbers are used to describe a system:

- **Latency**: the time between an event (a timer tick, an interrupt) and the moment the code that reacts to it starts running.
- **Jitter**: the variation of this latency from one cycle to the next. A control loop is hurt by the jitter much more than by a constant delay.

## Why a normal OS is not real-time

A general-purpose OS (Linux, Windows, macOS) is designed for **throughput and fairness**: all processes should progress, and the machine should do as much work as possible. A real-time OS is designed for a **bounded worst case**: the most urgent task must run now, whatever the rest is doing.

The difference shows in a few precise places:

| Mechanism | General-purpose OS | Real-time OS |
| --- | --- | --- |
| Scheduler | Fair share between tasks, priorities are hints | Strict priorities: the highest-priority ready task always runs |
| Kernel preemption | Parts of the kernel cannot be interrupted, for an unbounded time | The kernel is preemptible, or its non-preemptible sections are short and bounded |
| Interrupts | A handler can run long and delay everything | Handlers are short, or deferred to schedulable threads |
| Locks | A low-priority task holding a lock can block a high-priority one (*priority inversion*) | Priority inheritance: the lock holder is boosted while it blocks someone more urgent |
| Memory | Paging and swap: any access can trigger a disk read | Memory locked in RAM, allocated beforehand |
| Timers | Coarse, may be coalesced to save power | Precise, one-shot, high resolution |
| Documentation | Average behavior | Worst-case execution times |

A standard Linux kernel has all of these weaknesses: long non-preemptible sections, interrupt handlers that run for a long time, locks without bounded waiting, page faults. Each one is rare, but the worst case is what a hard real-time system has to survive.

## The map of solutions

Everything below is a different answer to the same question: *where does the real-time code run, and what protects it from the rest of the system?*

{{< mermaid caption="The main ways to get real-time behavior, from the most integrated to the most separated." >}}
%%{init: {"flowchart": {"rankSpacing": 24, "nodeSpacing": 20, "padding": 5}}}%%
flowchart LR
  A["<b>1. Tuned standard Linux</b><br/>same kernel, better settings"]
  B["<b>2. PREEMPT_RT</b><br/>Linux made preemptible"]
  C["<b>3. Co-kernel</b><br/>real-time core under Linux<br/>(Xenomai, RTAI)"]
  D["<b>4. Dedicated RTOS</b><br/>FreeRTOS, Zephyr,<br/>QNX, VxWorks"]
  E["<b>5. Separate hardware</b><br/>microcontroller, PRU, FPGA"]
  A --> B --> C --> D --> E
  classDef run fill:#FFEFC2,stroke:#E5D28A,color:#6B4A00
  class C run
{{< /mermaid >}}

Moving to the right, the real-time part gets **more isolated** from the general-purpose system, and **less integrated** with it.

### 1. Standard Linux, tuned

The same kernel, with real-time scheduling (`SCHED_FIFO`) and some configuration: locked memory (`mlockall`), a dedicated CPU core (`isolcpus`, `nohz_full`), a fixed CPU frequency, no power saving. This is soft real-time at best, and often enough for a loop at 100 Hz or less.

### 2. `PREEMPT_RT`

A set of changes that makes almost the whole Linux kernel preemptible: spinlocks become sleeping locks with priority inheritance, interrupt handlers run as threads that have a priority, and timers are high resolution. Real-time tasks stay **normal Linux threads**. The patch set has been merged into the mainline kernel (Linux 6.12), where it is a configuration option.

### 3. Co-kernel (dual-kernel)

A **second, small real-time kernel runs next to Linux** on the same CPU, and takes priority over it. Linux becomes the lowest-priority task of the real-time core. Real-time code is scheduled by the co-kernel, not by Linux. The two main projects are **Xenomai** and **RTAI**.

### 4. Dedicated RTOS

An operating system designed to be real-time from the start, which replaces Linux instead of living next to it. There are two families:

- **Microcontroller RTOS**: FreeRTOS, Zephyr, RTEMS. Small, run on chips with kilobytes of memory, often without an MMU.
- **Commercial RTOS**: QNX (a microkernel), VxWorks. Run on application processors, with POSIX interfaces and safety certification options.

### 5. Separate hardware

The real-time part is not on the same CPU at all: a **microcontroller** next to the main computer, a **PRU** (programmable real-time unit) or a **Cortex-M core** inside the same SoC, or an **FPGA**. The isolation is physical.

## The limit of each solution

Each approach solves a problem and leaves another one. This is what makes room for the next one on the map.

| Solution | What it gives | Its limit |
| --- | --- | --- |
| **Tuned Linux** | Nothing to install, full ecosystem | No guarantee. The worst case is set by the kernel, which is unbounded in some paths |
| **`PREEMPT_RT`** | Real-time on a mainline kernel, full ecosystem, normal tools | The guarantee depends on the **whole kernel**: one badly written driver, or a long hardware stall (SMI, cache contention), breaks the worst case. Latency stays in the tens of µs, and is hard to *prove* |
| **Microcontroller RTOS** | Very low and very predictable latency | A tiny system: no Linux, no ROS, no rich network stack, no file system, no GUI. Not made for heavy computation |
| **Commercial RTOS** | Real-time and certification, vendor support | License cost, closed ecosystem, porting effort, dependence on a vendor |
| **Separate hardware** | Total isolation | Two systems to build, connect and synchronize. More hardware, more cost, more firmware |

Seen from the other side, what is missing is a solution that gives **both**:

- a **hard real-time guarantee that does not depend on Linux** (so that a driver or a user process cannot break it);
- the **Linux ecosystem on the same machine** (ROS, network, tools, drivers) with no second computer.

`PREEMPT_RT` has the ecosystem but a guarantee tied to the whole kernel. A dedicated RTOS has the guarantee but not the ecosystem. Separate hardware has both but doubles the system. This is exactly the position of the co-kernel approach, and of Xenomai.

## What Xenomai is

Xenomai is a **real-time framework for Linux**. Its goal is to run hard real-time tasks next to a normal Linux system, on the same machine.

Since version 3, it comes in two modes:

- **Cobalt**: the *dual-kernel* mode. A small real-time kernel runs next to Linux. This is the historical and most characteristic mode of Xenomai.
- **Mercury**: a mode that runs on top of a standard Linux kernel, usually patched with `PREEMPT_RT`. Xenomai then only provides its APIs, and the real-time quality is the one of the underlying kernel.

When people say "Xenomai", they mostly mean **Cobalt**.

## How Cobalt works: two kernels, one machine

The idea of a dual-kernel is to not try to make Linux real-time, but to **put something above it**.

{{< mermaid caption="Dual-kernel architecture: the real-time core has priority over Linux, for interrupts and for scheduling." >}}
%%{init: {"flowchart": {"rankSpacing": 24, "nodeSpacing": 20, "padding": 5}}}%%
flowchart TB
  HW["Hardware: CPU, timers, interrupts"]
  IP["Interrupt pipeline (I-pipe / Dovetail)"]
  CO["Cobalt core<br/>real-time scheduler"]
  LX["Linux kernel<br/>normal scheduler"]
  RT["Real-time tasks<br/>(Xenomai threads)"]
  NR["Normal processes"]
  HW --> IP
  IP --> CO
  IP --> LX
  CO --> RT
  LX --> NR
  classDef run fill:#FFEFC2,stroke:#E5D28A,color:#6B4A00
  class CO,RT run
{{< /mermaid >}}

Three elements make it work:

1. **An interrupt pipeline.** A patch of the Linux kernel (the *I-pipe*, replaced in recent versions by *Dovetail*) delivers each hardware interrupt **first to the real-time core**, and only afterwards to Linux. Linux can no longer block interrupts for long: for the real-time core, it is just one low-priority "task".
2. **A second scheduler.** Cobalt has its own scheduler, with priorities above everything Linux does. A real-time thread preempts Linux, including inside the kernel.
3. **Real-time threads that are also Linux threads.** A Xenomai thread is created as a normal Linux thread, then it is *promoted* to the real-time domain.

This is what answers the limit of `PREEMPT_RT`: the real-time path does not go through the Linux kernel any more, so a slow Linux driver or a busy Linux process cannot delay it.

### Primary mode and secondary mode

This last point is the one that matters most in practice. A Xenomai thread lives in one of two modes:

| Mode | Scheduled by | Latency | What the thread can call |
| --- | --- | --- | --- |
| **Primary** (real-time) | Cobalt | Bounded, low | Only Xenomai real-time services |
| **Secondary** (Linux) | Linux | Not bounded | Any Linux system call |

When a real-time thread calls a standard Linux service (for example `printf`, a file read, `malloc` that triggers a page fault), Xenomai **migrates it to secondary mode** so that Linux can handle the call. The call works, but the thread has left the real-time domain and lost its guarantee for that moment. This migration is called a **mode switch**.

{{< callout title="The classic Xenomai mistake" >}}
A real-time loop that calls a Linux service on each iteration silently falls back to secondary mode, and the worst-case latency goes back to the one of Linux. Xenomai can warn about it with a signal (`SIGDEBUG`) when a thread switches mode. This is the first thing to check when the latency is not what you expected.
{{< /callout >}}

For the same reason, memory must be locked (`mlockall`) and allocated before the loop starts, so that no page fault happens in the real-time path.

### Mode switches: what they are and what causes them

A mode switch moves **the same thread** from one scheduler to the other. It is not a copy and not a second thread. Two names are used, one for each direction:

| Direction | Name | When it happens |
| --- | --- | --- |
| Primary → secondary | **Relax** | The thread does something only Linux can handle |
| Secondary → primary | **Harden** | The thread calls a Xenomai service again. It is **automatic** |

The second line is why the problem is silent. A loop that calls `printf` at each iteration is relaxed by the `printf`, then hardened again by its next Xenomai call (for example a `clock_nanosleep`), and so on. The program works and shows no error, only its latency is wrong.

While in secondary mode, the thread is scheduled by Linux, so its worst-case latency is no longer bounded. Coming back to primary mode also needs a moment when Linux accepts to give the CPU back, which is not instantaneous either.

#### Functions that take a thread out of the real-time domain

A call causes a switch **when it really reaches the Linux kernel** (a system call, a page fault, a lock that must wait). The table lists the usual ones, by family. It is not exhaustive, and the rule is the same for all of them: if the function is not a Xenomai service, assume that it can relax the thread.

| Family | Functions | Why |
| --- | --- | --- |
| **Console and C streams** | `printf`, `fprintf`, `puts`, `perror`, `fflush`, `fopen`, `fwrite`, `std::cout`, `std::cerr` | They end in a `write` system call, and the stream has its own lock |
| **Files and Linux descriptors** | `open`, `close`, `read`, `write`, `ioctl`, `fsync`, `stat`, `unlink` on files, pipes or Linux devices | Linux system calls |
| **Memory** | `malloc`, `free`, `calloc`, `new`, `delete` (when they ask the kernel for memory or take a lock), `mmap`, `munmap`, `brk` | Memory requests go to the kernel. A first access to a new page also triggers a page fault |
| **Linux sockets** | `socket(AF_INET, ...)`, `send`, `recv`, `sendto`, `recvfrom`, `connect`, `accept`, `select`, `poll`, `epoll_wait` | Linux network stack. Only RTIPC and RTnet sockets are real-time |
| **Linux synchronization** | Mutexes and condition variables that are not the ones of Cobalt, `futex`, and in many cases the C++ `std::mutex`, `std::condition_variable` and `std::thread` | They use Linux system calls instead of the Cobalt ones, unless the program is linked with Xenomai's POSIX wrapping |
| **Processes and threads** | `fork`, `exec*`, `system`, `popen`, `dlopen`, `pthread_create` of a non-Xenomai thread | Heavy Linux operations |
| **Signals** | Receiving a Linux signal, `kill`, `raise`, `sigwait`, `signal` handlers | Signals are handled by Linux |
| **Logging** | `syslog`, loggers that write to a file or to the console | Same as files and streams |
| **Hardware access from user space** | `/dev/i2c-*`, `/dev/spidev*`, serial ports (`termios`), sysfs GPIO, SocketCAN, USB | Linux drivers. The real-time equivalent is an RTDM driver |
| **Middleware** | Publishing or subscribing with ROS 2 (DDS), gRPC, MQTT clients | They use sockets, memory allocation and Linux threads |
| **Debugging** | A breakpoint in `gdb`, `ptrace`, `strace` | The debugger stops the thread through Linux |

A few notes on this table:

- **`malloc` does not always switch.** If the heap already has the memory and no lock must wait, there is no system call. But you cannot know it in advance, which is why a real-time loop must not allocate. Allocate everything at start-up, and lock the memory.
- **C++ exceptions** allocate memory and unwind the stack, so throwing one in the loop should be avoided.
- **A page fault** is not a function call: it comes from touching memory that is not yet in RAM. Large arrays on the stack are a classic case.

#### What stays in the real-time domain

The same families have a real-time equivalent, provided by Cobalt:

| Need | Real-time equivalent |
| --- | --- |
| Periodic wake-up | `clock_nanosleep` (with `TIMER_ABSTIME`), `timer_create` |
| Reading the time | `clock_gettime` |
| Mutex, condition variable, semaphore | `pthread_mutex_*`, `pthread_cond_*`, `sem_*` of Cobalt |
| Message queue between RT threads | `mq_*`, or IDDP and BUFP (see below) |
| Talking to a Linux process | XDDP (see below) |
| Talking to hardware | An **RTDM driver** (`open`, `read`, `write`, `ioctl` on an RTDM device) |

For these functions to be the Xenomai ones, the program has to be compiled and linked with the flags given by `xeno-config --posix --cflags` and `--ldflags`. They redirect the POSIX calls (`pthread_*`, `sem_*`, `clock_*`...) to Cobalt. Without them, the same code runs on the Linux versions and every call can relax the thread.

#### Counting the switches: the MSW column

Switches can be watched without changing the code. The file `/proc/xenomai/sched/stat` lists the Xenomai threads and some counters:

| Column | Definition | What it is used for |
| --- | --- | --- |
| `CPU` | Number of the core on which the thread runs or is pinned | Check that a real-time thread is on the planned core (for example an isolated one) |
| `PID` | Linux identifier of the thread (its TID) | Link the thread with `top`, `ps` or `gdb` |
| `MSW` | **Mode SWitch**: number of times the thread went to secondary mode since its creation | **The most important one.** If it grows while the loop runs, something in the loop leaves the real-time domain |
| `CSW` | **Context SWitch**: number of times Cobalt gave the CPU to this thread | A measure of activity. A loop at 1 kHz should see `CSW` grow by about 1000 per second |
| `XSC` | **Xenomai SysCalls**: number of calls to Cobalt services made by the thread | Shows that the thread really uses Xenomai. An `XSC` of 0 on a thread meant to be real-time is suspect |
| `PF` | **Page Faults**: number of page faults of the thread | A growing value points to memory that is not locked or not pre-faulted (`mlockall`, arrays on the stack) |
| `STAT` | Internal state of the thread, as **hexadecimal bits** (ready, sleeping, waiting, in secondary mode...) | Mostly for fine debugging. It is read with the documentation of the version |
| `%CPU` | Share of CPU time used by the thread over the recent period | Spot a thread that uses too much (a loop with no sleep) |
| `NAME` | Name of the thread (the one given with `pthread_setname_np`) | Recognize your threads. Give them clear names |

The file also contains one `[ROOT/n]` line per core. It is **Linux itself**, seen by Cobalt as one more thread, with the lowest priority. Interrupt lines also appear.

Read the `MSW` of the real-time thread while the loop runs:

```bash
cat /proc/xenomai/sched/stat
```

A small number that does not change after start-up comes from the initialization and is not a problem. A number that **keeps growing** means that something in the loop leaves the real-time domain. The `PF` column tells if the cause is a page fault. The exact columns can change with the Xenomai version, so check the header of the file on your system.

The rule that comes out of this: the critical loop only calls Xenomai services. Everything slow (logs, files, network, ROS) is done by another thread, and the data is passed to it with XDDP.

### Why mode switches are an argument for Xenomai

The mode switch can look like a weakness: a thread that makes a wrong call loses its guarantee. It is in fact one of the strongest ideas of the co-kernel approach.

Cobalt does not try to judge whether a thread "risks causing a problem". It applies one simple rule: **it only runs what it can bound**. Its own services are bounded. A Linux system call is not. As soon as a thread asks for something only Linux can handle, Cobalt does not run it in the real-time domain, and hands the thread over to Linux. The thread is not punished, it is **transferred**.

Three consequences:

- **The faulty thread leaves, the system does not drift.** In secondary mode, the thread is scheduled by Linux, with the guarantees of Linux. It no longer uses time in Cobalt, and the other Cobalt threads run before it and never wait for it. A thread that misbehaves loses **its own** guarantee, and does not contaminate the others.
- **The boundary is enforced by the system.** With `PREEMPT_RT`, a `printf` or a ROS call in the critical loop is accepted silently, and the thread stays "real-time" in name. With Xenomai, the same call moves the thread out of the real-time domain, and leaves a trace (`MSW`).
- **It is not definitive.** The thread comes back to primary mode (*harden*) as soon as it calls a Xenomai service again, so the situation corrects itself once the faulty call is out of the loop.

In short: **the co-kernel protects the real-time domain by refusing to run in it what it cannot bound. The faulty thread is the one that leaves, not the system that drifts.** For an application that mixes a control loop and non-real-time software such as ROS, this is a strong reason to choose it: the split of responsibilities between real-time and non-real-time threads is not only a convention to respect, it is enforced.

### APIs: "skins" and POSIX

Xenomai started as a way to **port applications written for other RTOSes** to Linux. It therefore exposes several APIs, historically called *skins*: native, VxWorks, pSOS, and mainly **POSIX**. In Xenomai 3, the POSIX interface is the main one, and the code looks like normal pthread code, but linked against the Xenomai libraries.

For drivers, Xenomai provides **RTDM** (Real-Time Driver Model), a framework to write drivers that can be used from the real-time domain (CAN, serial port, network, GPIO). A Linux driver cannot be used in the primary mode as is.

### Communicating without leaving the real-time domain: XDDP, IDDP and BUFP

A real-time loop usually has to exchange data with something else: send measurements to a logger, receive a command from another program, share a state with another real-time thread. The usual Linux tools (`pipe()`, Unix sockets, files) are Linux system calls, so using them from a real-time thread **forces a switch to secondary mode**.

Xenomai therefore provides its own communication channels, called **RTIPC**. They use a dedicated socket family (`AF_RTIPC`) with three protocols:

| Protocol | Name | Between | Style |
| --- | --- | --- | --- |
| **XDDP** | Cross-Domain Datagram Protocol | A real-time thread and a **normal Linux process** | Datagrams (messages), both directions |
| **IDDP** | Intra-Domain Datagram Protocol | **Two real-time threads** | Datagrams (messages) |
| **BUFP** | Buffer Protocol | **Two real-time threads** | Byte stream in a fixed-size buffer |

{{< mermaid caption="Which channel for which pair: RTIPC keeps the real-time side in primary mode." >}}
%%{init: {"flowchart": {"rankSpacing": 24, "nodeSpacing": 20, "padding": 5}}}%%
flowchart LR
  subgraph RTD["Real-time domain (Cobalt)"]
    T1["RT thread A"]
    T2["RT thread B"]
  end
  subgraph LXD["Linux domain"]
    P["Normal process<br/>(logger, GUI, ROS node)"]
  end
  T1 <-->|"IDDP / BUFP"| T2
  T1 <-->|"XDDP"| P
  classDef run fill:#FFEFC2,stroke:#E5D28A,color:#6B4A00
  class T1,T2 run
{{< /mermaid >}}

**XDDP** is the one called "pipe" in practice, because the Linux side sees it as a **character device**, `/dev/rtp<N>`, where `N` is the port number chosen on the real-time side. The Linux process uses plain `open`, `read` and `write` on it, with no Xenomai library. Only the real-time side uses the RTIPC socket, so it stays in primary mode.

```c
/* Real-time side: send a message to the Linux process */
#include <sys/socket.h>
#include <rtdm/ipc.h>

int s = socket(AF_RTIPC, SOCK_DGRAM, IPCPROTO_XDDP);

struct sockaddr_ipc addr = {
    .sipc_family = AF_RTIPC,
    .sipc_port   = 0,            /* appears as /dev/rtp0 */
};
bind(s, (struct sockaddr *)&addr, sizeof(addr));

sendto(s, &sample, sizeof(sample), 0, NULL, 0);
```

```c
/* Linux side: a normal program reads the messages */
int fd = open("/dev/rtp0", O_RDONLY);
read(fd, &sample, sizeof(sample));
```

**IDDP** works between two real-time threads, in the same process or in different ones. A thread binds a port, the other one sends datagrams to this port with `sendto()`. It is the equivalent of a UDP socket kept inside the real-time domain.

```c
/* Receiver: bind port 12, then wait for messages */
int s = socket(AF_RTIPC, SOCK_DGRAM, IPCPROTO_IDDP);
struct sockaddr_ipc local = { .sipc_family = AF_RTIPC, .sipc_port = 12 };
bind(s, (struct sockaddr *)&local, sizeof(local));
recvfrom(s, &msg, sizeof(msg), 0, NULL, NULL);

/* Sender: send to port 12 */
int c = socket(AF_RTIPC, SOCK_DGRAM, IPCPROTO_IDDP);
struct sockaddr_ipc peer = { .sipc_family = AF_RTIPC, .sipc_port = 12 };
sendto(c, &msg, sizeof(msg), 0, (struct sockaddr *)&peer, sizeof(peer));
```

**BUFP** is the stream version: bytes are written in a ring buffer of a fixed size, and the reader takes them as they come, with no message boundary. Its size is set with a socket option before the `bind()`.

Some points to know before using them:

- **Memory is limited and fixed.** Messages of XDDP and IDDP are stored in a pool whose size can be set with a socket option (`XDDP_POOLSZ`, `IDDP_POOLSZ`). If the reader is too slow and the pool is full, the sender gets an error, or blocks, depending on the mode. Size it for the worst case, not the average.
- **Datagrams keep their boundaries**, a `read` returns one message. BUFP does not: it is a stream.
- **Port numbers are chosen by you.** Two programs that use the same port for the same protocol conflict. An XDDP port can also be given a *label* (`XDDP_LABEL`), which creates a named entry in the registry instead of a number to remember.
- **The Linux side is not real-time.** If the Linux process is slow, the XDDP pool fills up on the real-time side. The real-time thread should handle this error (drop a message, keep the latest value) instead of waiting.
- **Other options exist** inside the real-time domain: Cobalt also provides POSIX message queues and semaphores for threads of the same domain. RTIPC is mainly useful for the real-time ↔ Linux link and for the datagram style.

This is also the mechanism used to move data **out** of a loop safely: the loop only writes into an XDDP socket (fast, bounded), and a Linux thread does the slow part (writing a file, sending to the network, publishing a ROS 2 message).

## The limits of Xenomai

The co-kernel approach has a price, and it is the reason why `PREEMPT_RT` became the default choice for many projects:

- **A patched kernel.** The interrupt pipeline is a patch that follows the Linux kernel versions. Supported versions lag behind the mainline, and a new kernel feature or hardware may not be available yet.
- **Two worlds to keep in mind.** Code that must be real-time uses Xenomai services and RTDM drivers. Everything else uses Linux. A mistake (a mode switch) is silent unless you look for it.
- **Drivers.** A Linux driver is not usable from the real-time domain. A device without an RTDM driver stays on the Linux side.
- **Shared hardware.** The isolation is a software one. The two kernels still share the CPU caches, the memory bus and the firmware (SMIs), which can add latency that no kernel can remove. Careful hardware selection and configuration remain necessary.
- **Maintenance.** The community is smaller than the one of the mainline kernel, and the integration effort is yours.

## Comparison with the other options, side by side

### Xenomai versus PREEMPT_RT

| | Xenomai (Cobalt) | `PREEMPT_RT` |
| --- | --- | --- |
| Principle | A second kernel next to Linux | Linux made fully preemptible |
| Real-time tasks are | Xenomai threads (primary mode) | **Normal Linux threads** (`SCHED_FIFO`) |
| APIs | Xenomai POSIX / RTDM | Standard Linux (POSIX, all drivers and libraries) |
| Latency, worst case | Very low, and isolated from Linux load | Low, but depends on the whole kernel and on its drivers |
| A bug in a Linux driver | Does not affect the real-time core | Can affect the real-time behavior |
| Kernel support | Needs a patched kernel, version-dependent | Mainline kernel |
| Tools and ecosystem | Specific (RTDM, Xenomai libraries) | Everything that works on Linux |
| Maintenance cost | Higher | Lower |

Xenomai **isolates** the real-time part from Linux, which gives a strong guarantee but a heavier integration. `PREEMPT_RT` **integrates** real-time into Linux, which is easier to use but gives a guarantee that depends on the quality of the whole kernel.

### Xenomai versus RTAI

RTAI is the other historical co-kernel project, and is older than Xenomai. The two share the same idea (a real-time core under Linux, with an interrupt pipeline) and a common origin. The main differences are on the programming side: Xenomai puts the real-time threads inside the Linux process model (with the primary and secondary modes), and offers a POSIX API, whereas RTAI is closer to a low-level kernel module approach. Xenomai has seen more active development in recent years.

### Xenomai versus microcontroller RTOSes (FreeRTOS, Zephyr)

| | Xenomai | FreeRTOS / Zephyr |
| --- | --- | --- |
| Target | Application processor (ARM, x86), with Linux | Microcontroller, no MMU in many cases |
| Linux next to it | Yes | No |
| Memory | Megabytes to gigabytes | Kilobytes |
| Latency | Microseconds (tens of µs typical) | Microseconds or less, often better |
| Features | Network, files, GUI, ROS, etc. via Linux | Minimal, you add what you need |

They solve a different problem. A microcontroller RTOS is the choice for a dedicated device (a motor driver, a sensor board). Xenomai is the choice when real-time control and a rich software environment must share the same computer. A common robotic architecture combines both: microcontrollers for the lowest-level loops, and a Linux machine (with Xenomai or `PREEMPT_RT`) for the higher-level real-time control.

### Xenomai versus commercial RTOSes (QNX, VxWorks)

| | Xenomai | QNX / VxWorks |
| --- | --- | --- |
| Architecture | Linux + real-time core | Native RTOS (QNX is a microkernel) |
| License | Open source (GPL / LGPL) | Commercial |
| Safety certification | No | Available |
| Software ecosystem | Linux ecosystem | Their own, plus POSIX compatibility |
| Support | Community | Vendor |

Xenomai gives hard real-time without license cost, and the whole Linux ecosystem. It does not give the certification or the vendor support that some industries require.

## Summary

| Need | Reasonable choice |
| --- | --- |
| A few milliseconds of jitter is acceptable | Standard Linux, tuned |
| Tight real-time on Linux, easiest integration | `PREEMPT_RT` |
| Tightest latency, isolated from Linux, or code ported from another RTOS | Xenomai (Cobalt) |
| Dedicated low-power device | FreeRTOS or Zephyr |
| Safety certification required | QNX or VxWorks (or another certified RTOS) |
| Total isolation, simple deterministic hardware loop | Separate microcontroller, PRU or FPGA |

Xenomai is not "better" or "worse" than the others: it is a trade between **isolation of the real-time part** and **integration with Linux**. With `PREEMPT_RT` now in the mainline kernel, the default choice has moved there, and Xenomai is chosen when its stronger guarantees are worth the extra work.

One argument stands out for a robot that mixes a control loop and non-real-time software such as ROS: with Xenomai, a thread that calls something it cannot bound is moved out of the real-time domain, so a mistake in one thread does not degrade the others, and the mode switch counter shows where it happened. With `PREEMPT_RT`, the same mistake is silent.

## To check before publishing

Points that deserve a check or a personal touch (to remove once done):

- Current Xenomai version and the Linux kernel versions supported by Dovetail (the support is version-dependent).
- Real latency numbers: measuring `cyclictest` (`PREEMPT_RT`) against `latency` (Xenomai) on your own hardware would be more convincing than general figures.
- A link with your own use case (for example an EtherCAT master with a fixed cycle, as in the [EtherCAT state machine post](/blog/ethercat-state-machine/)).

To go further, the [Xenomai project](https://xenomai.org/) documents both modes and the APIs, and the [Real-Time Linux wiki](https://wiki.linuxfoundation.org/realtime/start) covers `PREEMPT_RT`.
