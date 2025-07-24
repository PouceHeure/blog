---
title: "Multi-Robot ROS Architecture for UGV/UAV Coordination"
date: 2022-12-10
tags: ["ROS", "multi-robots", "autosys"]
---

As part of a research internship project, I developed a ROS architecture to coordinate drones and ground robots (UGVs). This architecture was designed to handle heterogeneous robots by implementing a generic layer that interfaces with the hardware-specific components of each platform.

The system consists of drones communicating via TCP and ground robots running ROS, all coordinated by a central master PC.