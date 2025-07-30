---
title: "Autonomous Vehicle Planning"
date: 2024-12-10
tags: ["planning", "navigation", "autosys", "ROS2"]
# pinned: true
description: Local planning applied to real autonomous vehicles, combining global route planning, local path adjustment, and dynamic control profile.
image: "/images/local-planning/rviz_planning.png"
---

## Demonstration 

{{< youtube code="wnQpdtmPgv0" width="500" caption="Demo video, slalom test." >}}

{{< youtube code="As44QMtXXiw" width="500" caption="Demo video, curve test." >}}


## Overview

This project implements the core planning functionalities for autonomous driving. It is structured around a navigation stack that transforms a target position into a safe and efficient motion trajectory using environmental context and map information.

The process is divided into three stages:

- **Global route computation**: find a feasible route on the road network
- **Local path generation**: adjust trajectory to avoid obstacles
- **Motion profile optimization**: generate smooth and feasible velocities along the path

{{< figure src="/images/local-planning/global-goal.png" caption="Mission structure from global target to real motion control" width="600">}}

## Navigation Stack Architecture

The architecture follows a modular structure in ROS2. Each node is responsible for one step of the planning pipeline:

- **Route Server**: computes the topological path
- **Path Planner**: modifies the route to avoid obstacles
- **Motion Generator**: assigns a feasible velocity profile
- **Controller**: executes the commands

{{< figure src="/images/local-planning/nodes.png" caption="Modular design of the local planner stack with key processing stages" width="700">}}

## Global Route Planning

### Responsibilities

The Route Server node is in charge of computing the route from the current vehicle position $A$ to the goal $B$, using algorithms like Dijkstra or A*. The process includes:

- Matching the vehicle's current position on the HD map  
- Matching the target goal  
- Planning the shortest or safest path $\mathcal{P}(A, B)$  
- Exposing a ROS2 service to compute routes for a queue of goals $\{B_1, B_2, \dots\}$

{{< figure src="/images/local-planning/route_rviz.png" caption="Route computed on topological map displayed in RViz" width="500">}}

## Path Planning

### Problem

Even if a global route exists, dynamic obstacles may obstruct the reference trajectory. A local path must therefore be adapted in real-time to maintain safety.

{{< figure src="/images/local-planning/path-idea.png" caption="Path replanning principle: local obstacle avoidance while following global route" width="600">}}

### Local Path Planner

This module scans the global path and determines whether obstacles intersect it. When an obstacle is detected, the system computes:

- The **longitudinal distance** $s$ at which the obstacle interferes
- The **required lateral shift** $q(s)$ needed to avoid the obstacle

The planner then outputs a new trajectory by adjusting the centerline accordingly.

{{< figure src="/images/local-planning/path.png" caption="Local path shift to avoid obstacle, expressed as lateral displacement along the Frenet frame" width="700">}}

This part builds upon research from {{< cite LocalASaid >}}. The animation below illustrates a Python-based implementation used to evaluate the solution and help design a suitable architecture for integration into our navigation stack. The original method from the article has been modified to fit the specific requirements of our system.

{{< figure src="/images/local-planning/simu.gif" caption="Python simulation of the planning loop, based on the referenced method." width="800">}}


## Motion Profile Generation

Once a safe and smooth path is obtained, the next step is to compute a time-parameterized velocity profile.

This includes:

- Satisfying kinematic constraints
- Ensuring jerk and acceleration limits
- Respecting comfort and anticipation rules

A velocity curve $v(s)$ is computed along the shifted path.

## Integrated Planning Stack

The system allows closed-loop autonomous operation by chaining:

1. Target reception → global route
2. Obstacle analysis → adjusted path
3. Velocity assignment → dynamic feasibility
4. ROS2 interface → command execution

{{< figure src="/images/local-planning/global-view.png" caption="High-level planning loop integrating route, path, and motion generation" width="750">}}

## Conclusion

This work provides an efficient and modular **planning stack** for autonomous vehicles, from topological goal computation to real-time local obstacle avoidance.

Key benefits:

- Modularity via ROS2
- Reactive obstacle-aware local planner
- Velocity generation based on constraints
- Real-world deployment on an autonomous car platform

## References

{{< bibliography >}}
