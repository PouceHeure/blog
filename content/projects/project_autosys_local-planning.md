---
title: "Autonomous Vehicle Planning"
date: 2024-12-10
tags: ["planning", "navigation", "autosys", "ROS2"]
# pinned: true
description: Local planning applied to real autonomous vehicles, combining global route planning, local path adjustment, and dynamic control profile.
image: "/images/local-planning/rviz_planning.png"
---

## Demonstration 

{{< youtube code="wnQpdtmPgv0" width="800" caption="Demo video, slalom test." >}}

{{< youtube code="As44QMtXXiw" width="800" caption="Demo video, curve test." >}}


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


## Integrated Planning Stack

The system allows closed-loop autonomous operation by chaining:

1. Target reception → global route
2. Obstacle analysis → adjusted path
3. Velocity assignment → dynamic feasibility
4. ROS2 interface → command execution

{{< figure src="/images/local-planning/global-view.png" caption="High-level planning loop integrating route, path, and motion generation" width="750">}}

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

The speed profile of a vehicle depends on various factors, including:
- Road elements (e.g., stop signs, traffic lights, speed bumps);
- Obstacles on the road (e.g., vehicles, pedestrians).

### Speed Profile: Signal

To combine these different pieces of information, we introduce the concept of a **speed signal profile**. This profile is represented as a step (or square) signal showing the **maximum allowed speed** at each point along the trajectory (x-axis: distance, y-axis: maximum speed).

This format is practical because it requires only the key change points to be defined. The speed is assumed constant between two points.

{{< figure src="/images/local-planning/signal-example.png" caption="TODO" width="300">}}

The figure above shows an example of a speed signal. It is defined as:

```bash
distance [m]:    72.0  | 75.0
speed [m/s] :     5.0  |  0.0
```

This means the speed is 5.0 m/s until 75.0 meters, where it drops to 0.0 m/s.

### Speed Profile: Combined Signals

An advantage of this method is that multiple signals can be **combined**. To do this, simply take the **minimum** of all the signals at each point, ensuring that the resulting profile does not exceed any constraint.

The figures below illustrate a situation involving two road elements: a speed bump and a stop sign. Each element has its own speed signal.  
- For the **speed bump**, the signal is lower, requiring the vehicle to slow down (around \( v \approx 1.8\,\text{m/s} \)).
- For the **stop sign**, the signal forces a complete stop (\( v = 0\,\text{m/s} \)).

{{< figure src="/images/local-planning/road-elements.png" caption="Road elements matched to trajectory positions." width="800">}}

{{< figure src="/images/local-planning/signals-combined-example.png" caption="Combined speed signal based on road elements." width="800">}}


### Speed Profile: Curvatures

Refer to [Profile Fusion](/projects/project_autosys_control/#profile-fusion) section of the control project. 

### Speed Profile: Demonstration

{{< youtube code="Eek62N0eyNI" width="800" caption="Road elements signal final." >}}


<!-- ## Conclusion

This work provides an efficient and modular **planning stack** for autonomous vehicles, from topological goal computation to real-time local obstacle avoidance.

Key benefits:

- Modularity via ROS2
- Reactive obstacle-aware local planner
- Velocity generation based on constraints
- Real-world deployment on an autonomous car platform -->

## References

{{< bibliography >}}
