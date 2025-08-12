---
title: "Optimization of the Dynamic Window Approach (DWA)"
date: 2021-12-10
tags: [ground_robot, control_optimization, planning_navigation, ros]
codelang: ["python"]
image: /images/dwa-optimization/thumbnail.png
description: "Gradient descent formulation applied to the Dynamic Window Approach for improved convergence and trajectory quality."
article: /articles/article_gradient-descent/
---

## Overview

The Dynamic Window Approach (DWA) is a reactive motion planning method used in mobile robotics. At each control cycle, it samples admissible velocity pairs $(v, \omega)$ and evaluates them using an objective function, selecting the pair with the highest score.

The original method presents two main issues:  
- **Discrete sampling**, which limits precision  
- **High computational cost** in evaluation loops  

These limitations can be addressed by defining a **convex, differentiable objective function** and applying **gradient descent** for continuous optimization.

This work was presented at **IEEJ SAMCON 2022**, {{< cite GradientHPousseur >}}.

{{< youtube code="JagUA0hf360" width="800" caption="Video demo (Gazebo simulation)" label="test-gazebo">}}

{{< youtube code="b1y7jF_VcuU" width="800" caption="Video demo turtlebot (case 1)."  label="test-turtlebot-1" >}}

{{< youtube code="SK9dPbqG0fc" width="800" caption="Video demo turtlebot (case 2)." label="test-turtlebot-2" >}}

{{< youtube code="TMXqmAW_N_o" width="800" caption="Video demo (SCANeR + visual servoing)." label="test-scaner">}}

## From Sampling to Continuous Optimization

### Convex Cost Function

Instead of scoring discrete samples, the cost is defined as:

{{< equation >}}
\mathcal{L}(v, \omega) = \lambda_1 \cdot \mathcal{C}_{goal} + \lambda_2 \cdot \mathcal{C}_{distance} + \lambda_3 \cdot \mathcal{C}_{speed}
{{< /equation >}}

Where:  
- $\mathcal{C}_{\text{goal}}$: cost for deviation from target direction
- $\mathcal{C}_{distance}$: angular penalty for proximity to obstacles  
- $\mathcal{C}_{speed}$: penalty for low forward velocity  

All terms are **convex** and **differentiable**, enabling gradient-based optimization.

### Goal Alignment Term

The target point is obtained from a high-level controller (e.g., visual servoing). The quadratic distance between predicted and target positions is used:

{{< equation >}}
\mathcal{C}_{goal} = (x_{pred} - x_{target})^2 + (y_{pred} - y_{target})^2
{{< /equation >}}

This term encourages convergence to the desired trajectory.

### Obstacle Distance Term

LiDAR data is processed to extract **safe angular zones**. The closest safe direction $\theta^*_{\text{final}}$ to the robot’s current heading is identified.

{{< subfigure images="/images/dwa-optimization/clear_zone_explication_01.png,/images/dwa-optimization/clear_zone_explication_02.png" captions="Safe zone from LiDAR perception., Safe zone explanations." width="600">}}

The cost penalizes deviation from this safe orientation:

{{< equation >}}
\mathcal{C}_{distance} = \frac{1}{2} \left( \omega - \frac{\theta^*_{\text{final}}}{dt} \right)^2
{{< /equation >}}

Where:  
- $\omega$: angular velocity  
- $\theta^*_{\text{final}}$: optimal safe angle  
- $dt$: control time horizon  

This method provides obstacle avoidance, similar in principle to Vector Field Histogram strategies.

### Speed Regularization Term

A penalty on low velocities maintains motion:

{{< equation >}}
\mathcal{C}_{speed} = (v_{max} - v)^2
{{< /equation >}}

This prevents the robot from slowing unnecessarily.

## Gradient Descent Optimization

The optimal control is:

{{< equation >}}
(v^*, \omega^*) = \arg\min_{v, \omega} \mathcal{L}(v, \omega)
{{< /equation >}}

Gradient descent updates are applied as:

{{< equation >}}
\begin{bmatrix}
v \\
\omega
\end{bmatrix}
\leftarrow
\begin{bmatrix}
v \\
\omega
\end{bmatrix}
 - \eta \cdot \nabla \mathcal{L}(v, \omega)
{{< /equation >}}

Where $\eta$ is the learning rate.  
This continuous approach avoids discretization limits and improves convergence precision.

## Integration with Visual Servoing

In SCANeR experiments, the optimizer was integrated with a visual servoing module that extracts a centerline from camera input. The $\mathcal{C}_{goal}$ term uses this visual reference as the target, ensuring alignment with detected lanes.

{{< refer href="/projects/project_visual-control/" project="Visual Control Project" >}}

## Simulation and Real Tests

### Gazebo Simulation

Tested with static obstacles and known goals.  

{{< figure src="/images/dwa-optimization/scenario_example.png" caption="Gradient-based DWA combined with visual control. Target extracted from camera image." width="600" label="dwa_scenario_example" >}}

The {{< figref dwa_scenario_example >}} shows the path of the robot after applying the DWA optimization approch. In this test, the robot has to reach position over an unknown map.

Demo: {{< videoref label="test-gazebo" >}}.

### Turtlebot Experiments

Validated on real robots in indoor scenarios.  

Demo: {{< videoref label="test-turtlebot-1" >}}, {{< videoref label="test-turtlebot-2" >}}.

This [demonstration](/projects/project_multi-robots/#multi-robots-demo) uses also this DWA optimization.


### SCANeR Scenarios

Evaluated in autonomous driving simulations:  
- Lane center extracted from camera images  
- Optimizer computed $(v, \omega)$ toward the visual target  
- Demonstrated robustness to perception noise  

Demo: {{< videoref label="test-scaner" >}}.

## References

{{< bibliography >}}
