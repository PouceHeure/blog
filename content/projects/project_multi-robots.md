---
title: "Multi-Robot ROS Architecture for UGV/UAV Coordination"
date: 2022-08-10
tags: [ground_robot, aerial_robot, robotics_autonomy, ros, multi_agent_systems]
codelang: ["cpp","python"]
image: images/multi-robots/thumbnail.png
description: "Modular ROS architecture enabling coordinated task execution between drones and ground robots using TCP."
article: /articles/article_cooperative-architecture/
---

## Context

As part of a research internship project, a modular ROS architecture was designed to enable cooperative navigation between heterogeneous autonomous vehicles: drones (UAVs) and ground robots (UGVs).  
The contribution focused on supporting the development and implementation of this system, which aimed to be scalable, with dynamic task allocation and coordinated execution across different hardware platforms.

The architecture uses a unified communication protocol, distributed ROS nodes, and a namespace layout allowing multiple robots to be managed from a central ROS master.

{{< youtube code="BZMFS-EkR4M" width="800" caption="Video demo: multi-robot cooperation." label="multi-robots-demo" >}}

In the following {{< videoref label="multi-robots-demo" >}}, the drone scans the area above the robots. It detects the ArUco markers designating the target positions, and the robots then move to these positions.

## Core Architecture

### Overview

The system is organized around three main components:

1. **Central ROS Master (PC)**  
   Hosts coordination logic and global launchers. Acts as scheduler and monitor.

2. **UGVs (ROS-based robots)**  
   Each UGV runs both common and robot-specific ROS nodes for navigation, teleoperation, and TCP communication.

3. **Drones (TCP clients)**  
   Lightweight platforms communicating with UGVs via TCP. Each drone exchanges structured task data and state updates with a specific ground robot.

### Robot Architecture

The ROS robot stack is split into two layers:
* common modules shared by all UGVs
* specific modules tied to the hardware and control architecture of each UGV

{{< figure src="/images/multi-robots/robot_architecture.png" caption="Robot ROS architecture." label="multi-robots_robot_architecture" width="800">}}

The {{< figref "multi-robots_robot_architecture" >}} shows the ROS nodes and interfaces used in the project.

#### Robot-Specific Packages

These are located in the `robots/` directory and provide hardware interfaces and configurations for each robot type (e.g., Turtlebot, Jetracer).

### Communication Model

Drones and UGVs exchange data over TCP through a dual-channel setup:

* **Drone → UGV**  
  The drone acts as a client and sends mission data such as target coordinates and task instructions.

* **UGV → Drone**  
  The UGV hosts a TCP server to publish status and connection details (IP and port) back to the drone.

This bidirectional link supports dynamic tasking, status reporting, and reliable coordination between airborne and ground agents.

### Trame Management

Data packets (“trames”) follow a consistent management process across robots:

* **Trame Content**  
  Defines the structure for tasks, targets, and status messages.

* **Trame Distribution**  
  Sends messages to individual robots, ensuring isolated task execution in multi-robot scenarios.

* **Trame Sequence**  
  Preserves ordering to ensure predictable and safe execution.

{{< figure src="/images/multi-robots/trame_sequence.png" caption="Trame (data packet) sequence." label="trame-sequence" width="500">}}

The {{< figref "trame-sequence" >}} illustrates the packet flow and ordering in task execution.

## Namespace and Multi-Robot Configuration

Each robot operates under a dedicated namespace (for example, `/turtlebot/robot`) to keep topics and services isolated. This setup is essential for running multiple identical robots in parallel.

ROS networking follows the Multiple Machines configuration, with the PC as master and robots as remote clients. Each device must be configured with the appropriate `ROS_MASTER_URI` and `ROS_IP` values for the network.
