---
title: "Drone Control with ROS"
date: 2019-02-01
tags: [control_optimization, core_technologies, robotics_autonomy, ros]
codelang: ["cpp"]
image: images/drone-control/thumbnail.png
description: "Control of a Parrot drone using ROS."
---

## Overview

This project was part of a final-year master's program and involved developing a drone capable of autonomously flying over a predefined area.  
The work was split into two main parts: **path planning** and **control**.  
My responsibility was to control a Parrot Bebop drone using **ROS**, leveraging an existing ROS package that communicates with Parrot's SDK.

{{< youtube code="8RcVpDUoFJc" width="800" caption="Drone control demonstration." label="demo-drone">}}

## Additional Features

- **Controller Watchdog**: Added a manual override system allowing the operator to take full control of the drone if the autonomous system fails.  
- **Package Improvements**: Updated the original ROS package to support extra SDK functions from the manufacturer ([GitHub Pull Request](https://github.com/AutonomyLab/bebop_autonomy/pull/189)), enabling advanced control through the drone’s built-in features.
