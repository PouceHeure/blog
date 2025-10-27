---
title: "Autonomous Vehicle: Planning"
date: 2024-12-10
tags: [autonomous_vehicle, planning_navigation, robotics_autonomy, ros2]
codelang: ["cpp"]
# pinned: true
description: Local planning applied to real autonomous vehicles, combining global route planning, local path adjustment, and dynamic control profile.
image: "images/local-planning/rviz_planning.png"
---

## Demonstration 

{{< youtube code="wnQpdtmPgv0" width="800" caption="Demo video, slalom test." >}}

{{< youtube code="As44QMtXXiw" width="800" caption="Demo video, curve test." >}}

## Overview

As part of a collaborative autonomous driving project, I contributed to the implementation of the core planning functionalities for autonomous driving.  
The navigation stack transforms a target position into a safe and efficient motion trajectory using environmental context and map information.

The process is divided into three stages:

- **Global route computation**: finding a feasible route on the road network  
- **Local path generation**: adjusting the trajectory to avoid obstacles  
- **Motion profile optimization**: generating smooth and feasible velocities along the path  

{{< figure src="/images/local-planning/global-goal.png" caption="Navigation stack I/O."  width="600">}}

## Navigation Stack Architecture

The architecture follows a modular structure in ROS2. Each node is responsible for a specific step in the planning pipeline:

- **Route Server**: computes the topological path  
- **Path Planner + Path Adapter**: modifies the route to avoid obstacles  
- **Motion Manager**: assigns a feasible velocity profile  
- **Controller**: executes the commands  

{{< figure src="/images/local-planning/nodes.png" caption="Nodes and relations of the stack, including data exchange details." width="700">}}

## Global Route Planning

### Responsibilities

The Route Server node computes the route from the current vehicle position $A$ to the goal $B$, using algorithms such as Dijkstra or A*. The process includes:

- Matching the vehicle's current position on the HD map  
- Matching the target goal  
- Planning the shortest or safest path $\mathcal{P}(A, B)$  
- Providing a ROS2 service to compute routes for a queue of goals $\{B_1, B_2, \dots\}$  

{{< figure src="/images/local-planning/route_rviz.png" caption="Route computed on topological map displayed in RViz" width="500">}}

## Integrated Planning Stack

Closed-loop autonomous operation is achieved by chaining:

1. Target reception → global route  
2. Obstacle analysis → adjusted path  
3. Velocity assignment → dynamic feasibility  
4. ROS2 interface → command execution  

{{< figure src="/images/local-planning/global-view.png" caption="High-level planning loop integrating route, path, and motion generation" width="750">}}

## Path Planning

### Problem

Even when a global route exists, dynamic obstacles may obstruct the reference trajectory. A local path must be adapted in real time to maintain safety.

{{< figure src="/images/local-planning/path-idea.png" caption="Path replanning principle: local obstacle avoidance while following global route" width="600">}}

### Local Path Planner

This module scans the global path to determine whether obstacles intersect it. When an obstacle is detected, the system computes:

- The **longitudinal distance** $s$ at which the obstacle interferes  
- The **required lateral shift** $q(s)$ needed to avoid the obstacle  

The planner then outputs a new trajectory by adjusting the centerline accordingly.

{{< figure src="/images/local-planning/path.png" caption="Local path shift to avoid obstacle, expressed as lateral displacement along the Frenet frame" width="700">}}

The design is based on research from {{< cite LocalASaid >}}. The animation below illustrates a Python-based simulation used to evaluate the solution and guide the design of an architecture suitable for integration into the navigation stack. The method from the original reference has been adapted to meet specific system requirements.

{{< figure src="/images/local-planning/simu.gif" caption="Python simulation of the planning loop, based on the referenced method." width="800">}}

### Interpolation

To define a smooth trajectory in the plane, the path is represented using **curvilinear interpolation**, where $x(d)$ and $y(d)$ are interpolated independently as functions of the **arc length parameter** $d$.

Cubic splines are commonly used for this purpose, ensuring continuity of position, first derivative (tangent), and second derivative (curvature). The path is thus defined by:

{{< equation >}}
\gamma(d) = \begin{pmatrix} x(d) \\ y(d) \end{pmatrix}
{{< /equation >}}

Where:  
- $d$: curvilinear abscissa (arc length) along the path  
- $x(d)$, $y(d)$: smooth spline interpolations based on reference waypoints  

This approach enables the evaluation of geometric quantities such as direction and curvature at any point along the trajectory.

## Motion Profile Generation

The speed profile of a vehicle depends on various factors, including:  
- Road elements (e.g., stop signs, traffic lights, speed bumps)  
- Obstacles on the road (e.g., vehicles, pedestrians)  

### Speed Profile: Signal

To combine these different inputs, a **speed signal profile** is used. This is represented as a step signal indicating the **maximum allowed speed** at each point along the trajectory (x-axis: distance, y-axis: maximum speed).

This representation is efficient because only the key change points are defined, with the speed assumed constant between two points.

{{< figure src="/images/local-planning/signal-example.png" caption="Signal Example" width="300">}}

Example:

```bash
distance [m]:    72.0  | 75.0
speed [m/s] :     5.0  |  0.0
```

This specifies a speed of 5.0 m/s until 75.0 meters, where it drops to 0.0 m/s.

### Speed Profile: Road Element Handler

Each **road element** is associated with a **handler**.  
The purpose of the handler is to define the **Finite State Machine (FSM)** of that element.  
Each **state** of the element specifies a corresponding **speed signal**.

Example: STOP Element

A **STOP** element defines three states:

| **State** | **Description** | **Signal** |
|------------|----------------|-------------|
| **LOCK** | The stop is active. <br/> The signal remains **UP** until the vehicle reaches the stop, then becomes **0**. | `UP → 0` |
| **WAIT** | The vehicle has reached the stop and is waiting for permission to start. | `0` |
| **FREE** | The vehicle has passed the stop. | `UP` |


#### State Transitions

##### Automatic Transitions
Some transitions occur **automatically**.  
For example:

```
LOCK → WAIT
```

This happens once the vehicle reaches the stop position and its speed equals **0**.  
The vehicle performs this transition autonomously.


##### Permission-Based Transitions
Other transitions require **explicit permission**.  
For example:

```
WAIT → FREE
```

This transition requires authorization from the **motion manager**, ensuring the **decision layer** has confirmed it is safe for the vehicle to proceed.


### Speed Profile: Combined Signals

Multiple signals can be combined by taking the **minimum** at each point, ensuring compliance with all constraints.

The example below shows two road elements: a speed bump and a stop sign.  
- The **speed bump** requires slowing to approximately $ v \approx 1.8\ \text{m/s} $.  
- The **stop sign** requires a complete stop ($ v = 0\ \text{m/s} $).  

{{< figure src="/images/local-planning/road-elements.png" caption="Road elements matched to trajectory positions." width="800">}}

{{< figure src="/images/local-planning/signals-combined-example.png" caption="Combined speed signal based on road elements." width="800">}}

### Speed Profile: Curvatures

{{< refer href="/projects/project_autosys_control/#profile-fusion" project="Control Project" section="Profile Fusion" >}}

### Speed Profile: Demonstration

{{< youtube code="QCiN3yqT5E8" width="800" caption="Autonomous vehicle control adapted to road elements." >}}

## References

{{< bibliography >}}
