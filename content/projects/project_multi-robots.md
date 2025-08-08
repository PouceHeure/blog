---
title: "Multi-Robot ROS Architecture for UGV/UAV Coordination"
date: 2022-08-10
tags: [robotics_autonomy, ros]
codelang: ["cpp","python"]
image: /images/multi-robots/thumbnail.png
description: "Modular ROS architecture enabling coordinated task execution between drones and ground robots using TCP."
article: /articles/article_cooperative-architecture/
---

As part of a research internship, I designed and implemented a modular ROS architecture to support cooperative navigation between heterogeneous autonomous vehicles, specifically drones (UAVs) and ground robots (UGVs). The goal was to build a scalable multi-robot system capable of dynamic task allocation and coordinated execution across different hardware platforms.

The system leverages a unified communication protocol, distributed ROS nodes, and a flexible namespace structure to manage multiple robots from a central ROS master.

{{< youtube code="BZMFS-EkR4M" width="800" caption="Video demo, multi robots cooperation." >}}



## Core Architecture

### Overview

The architecture consists of three primary components:

1. **Central ROS Master (PC)**  
   Hosts coordination logic and global launchers. Acts as the core scheduler and monitor.

2. **UGVs (ROS-based robots)**  
   Each UGV runs a set of common and robot-specific ROS nodes to handle navigation, teleoperation, and TCP communication.

3. **Drones (TCP-based clients)**  
   Lightweight platforms that communicate with UGVs via TCP. Each drone exchanges structured task data and state updates with a specific ground robot.

### Robot Architecture

The ROS Robot architecture is defined in two parts: 
- common part, common for every UGV robot;
- specefic part, depending of the UGV hardware, control architecture;

The following figure represents the ROS architecture developed for this project.

{{< figure src="/images/multi-robots/robot_architecture.png" caption="Robot ROS architecture." width="800">}}

#### Robot-Specific Packages

Located in the `robots/` directory, these packages contain hardware-specific configurations and interfaces per robot type (e.g., Turtlebot, Jetracer).


### Communication Model

Drones and UGVs exchange data over TCP through a **dual-channel architecture**:

- **Drone to UGV**:  
  The drone acts as a client and sends mission-related data, including target coordinates and task instructions.

- **UGV to Drone**:  
  The UGV operates a TCP server to provide real-time status and connection information (such as IP and port) back to the drone.

This bi-directional communication enables dynamic tasking, status reporting, and reliable coordination between airborne and ground agents.



### Trame Management

Trame (data packet) handling is consistent across robots and includes:

- **Trame Content**  
  Defines the structure of exchanged messages, such as tasks, targets, and statuses.

- **Trame Distribution**  
  Assigns messages individually to each robot, ensuring task segregation in multi-robot scenarios.

- **Trame Sequence**  
  Ensures ordered delivery and execution, supporting safe and predictable behavior.


{{< figure src="/images/multi-robots/trame_sequence.png" caption="Trame sequence scheme." width="500">}}



## Namespace and Multi-Robot Configuration

Each robot runs under a dedicated namespace (e.g. `/turtlebot/robot`), which isolates its ROS topics and services from others. This structure is critical for running multiple identical robots simultaneously.

ROS networking follows the standard [Multiple Machines Tutorial](http://wiki.ros.org/ROS/Tutorials/MultipleMachines), with the PC as the master and robots as remote clients. IP and environment variables (`ROS_MASTER_URI`, `ROS_IP`) must be configured on each device.
