---
title: "Pouco2000 - Customizable Physical Interface for ROS Robots"
date: 2020-06-15
tags: ["ROS", "arduino", "debugging"]
description: Modular physical control panel for interacting with ROS-based robots, with full Arduino and ROS integration.
image: /images/pouco2000/desk_crop.png
---


## Overview

GitHub Repo: [https://github.com/PouceHeure/pouco2000](https://github.com/PouceHeure/pouco2000)  

**Pouco2000** is a C++-based personal project that provides a full-stack solution for building a **physical control panel** to interact with ROS-based robots.

The system includes:

- A modular **Arduino library** for defining hardware inputs/outputs
- ROS packages for **serial communication**, **message extraction**, and **parameter introspection**
- Utilities for visual monitoring and live debugging

{{< youtube code="f1S2iDkwEEM" width="800" caption="Video demo, hardware and software test." >}}

## Motivation

Debugging and interacting with a robot via only terminal commands or software interfaces can be slow and impractical especially in field conditions.

**Pouco2000** was designed to enable the use of **physical components** (buttons, knobs, switches, displays) for controlling and debugging robotic systems in real-time.

This hardware-software stack allows developers to:

- Trigger actions using switches or buttons
- Adjust parameters using knobs or sliders
- Monitor feedback using LEDs or console tools
- Deploy in both **local** and **remote ROS configurations**

The following figure shows an example of desk created for the project, the wood has been sliced with laser machine, and then assembled to created the box.
{{< figure src="/images/pouco2000/desk.jpeg" caption="Pouco2000 Desk" width="700">}}

This figure shows the electronic board prototypes, for the first creation, I used 2 arduino boards showing no limitation, allowing to add several micro-controller, managing several inputs.
{{< figure src="/images/pouco2000/electronic_crop.png" caption="Electronic boards test" width="500">}}


## System Architecture

### High-Level Diagram

{{< figure src="https://raw.githubusercontent.com/PouceHeure/pouco2000/master/.doc/diagram/output/pouco2000_general_concept.png" caption="General system architecture of Pouco2000" width="500">}}

### Structure

The ROS-side is organized into two meta-packages:

- **pouco2000_src**
  - `pouco2000_ros`: main communication layer
  - `pouco2000_msgs`: custom messages
  - `pouco2000_tools`: utility libraries for extracting and filtering input
- **pouco2000_examples**
  - `pouco2000_popup`, `pouco2000_demo`, `pouco2000_gazebo`: usage examples


## ROS Side

### `pouco2000_ros`

This is the **core communication package** that aggregates data from the microcontroller and republishes it in a structured message.

**Main libraries:**

- `pouco2000`: contains the Controller class definition
- `pouco2000_debug`: provides logging and visualization helpers
- `pouco2000_introspection`: publishes filtered subsets of the message
- `pouco2000_monitor`: allows terminal-based live monitoring

#### Nodes

- **`controller_node`**  
  Subscribes to microcontroller input and publishes `pouco2000::Controller` messages.

- **`monitor_node`**  
  Displays parsed message content in the terminal.

### `pouco2000_ros_tools`

Provides reusable **C++ extractors** for accessing parts of the controller message.

| Field               |  Method          | Purpose                       |
| ------------------- |  --------------- | ----------------------------- |
| Buttons             |  `is_push()`     | Checks if button is pressed   |
| SwitchOnOff         |  `is_on()`       | Checks if switch is ON        |
| SwitchMode          |  `is_mode(mode)` | Checks active mode for switch |


## Arduino Side

The `pouco2000_ard` library abstracts hardware elements and communicates over serial using `rosserial`.

<!-- {{< figure src="https://raw.githubusercontent.com/PouceHeure/pouco2000/master/.doc/diagram/output/pouco2000_arduino_layer.png" caption="Arduino abstraction layer with ROS integration" width="500">}} -->

Typical usage involves:

- Declaring pin arrays
- Creating handle objects for each field
- Initializing in `setup()`, updating in `loop()`

Typedefs simplify code:

```cpp
typedef Handle<Button, Buttons::_data_type, Buttons> HandleButtons;
```

Arduino examples are provided and visible in the Arduino IDE (`File > Examples > pouco2000_ard`).

## Message Format

The central message type used is `pouco2000::Controller`:

```bash
Header header
bool[] buttons
bool[] switchs_on_off
uint8[] switchs_mode
float32[] potentiometers_circle
float32[] potentiometers_slider
```


## Example Configurations

### Remote Setup (multi-machine)

{{< figure src="https://raw.githubusercontent.com/PouceHeure/pouco2000/master/.doc/diagram/output/pouco2000_configuration_slave.png" caption="Remote configuration using a Raspberry Pi as ROS slave" width="500">}}

### Local Setup (direct USB, serial)

{{< figure src="https://raw.githubusercontent.com/PouceHeure/pouco2000/master/.doc/diagram/output/pouco2000_configuration_master.png" caption="Local configuration connected directly to a ROS master" width="500">}}


## Monitor Tool

Launch controller:

```bash
roslaunch pouco2000_ros release.launch
```

Launch monitor (optional):

```bash
roslaunch pouco2000_ros monitor.launch
```


## Documentation

The package includes Doxygen documentation generated via CMake:

```bash
catkin build
```

Docs will be located in each package’s `doc/` folder.

