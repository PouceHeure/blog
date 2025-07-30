---
title: "Drone Control with ROS"
date: 2019-02-01
tags: ["control", "SDK", "ROS","drone"]
image: /images/drone-control/thumbnail.png
description: "Controlling a Parrot drone using ROS"
---

## Context

As part of my final year project, we were tasked with developing a drone capable of autonomously flying over a designated area.  
The project was divided into two main components: **path planning** and **control**.  
My role was to control a Parrot Bebop drone using **ROS**. To achieve this, we used an existing ROS package that interfaces with Parrot's SDK.

{{< youtube code="8RcVpDUoFJc" width="500" caption="Drone control demo." >}}

## Additional Developments

- **Controller Watchdog**: Implemented a manual controller watchdog system that allows the user to take full manual control of the drone in case of system failure.
- **Package Enhancement**: Modified the original package to interface with additional SDK features provided by the manufacturer ([GitHub Pull Request](https://github.com/AutonomyLab/bebop_autonomy/pull/189)), enabling more advanced control using the drone's internal capabilities.
