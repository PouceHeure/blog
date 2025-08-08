---
title: "Optimization of the Dynamic Window Approach (DWA)"
date: 2021-12-10
tags: [control_optimization, planning_navigation, ros]
codelang: ["python"]
image: /images/dwa-optimization/thumbnail.png
description: "Gradient descent formulation applied to the Dynamic Window Approach for improved convergence and trajectory quality."
article: /articles/article_gradient-descent/
---

## Overview

The Dynamic Window Approach (DWA) is a reactive planning strategy used in mobile robotics. At each control cycle, it samples admissible velocity pairs $(v, \omega)$ and evaluates them using an objective function. The velocity that maximizes the score is selected.

However, the original DWA has two main drawbacks:
- **Discretized sampling**, which limits precision  
- **Computationally expensive** evaluation loops  

To address these limitations, DWA can be reformulated using **convex objective functions** and **gradient descent optimization**.

This work was published at **IEEJ SAMCON 2022**, {{< cite GradientHPousseur >}}.

{{< youtube code="JagUA0hf360" width="800" caption="Video demo (Gazebo simulation)" label="test-gazebo">}}

{{< youtube code="b1y7jF_VcuU" width="800" caption="Video demo turtlebot (case 1)."  label="test-turtlebot-1" >}}

{{< youtube code="SK9dPbqG0fc" width="800" caption="Video demo turtlebot (case 2)." label="test-turtlebot-2" >}}

{{< youtube code="TMXqmAW_N_o" width="800" caption="Video demo (SCANeR + visual servoing)." label="test-scaner">}}

## From Sampling to Optimization

### Convex Cost Structure

Instead of computing a score over discrete velocities, a continuous, differentiable **cost function** is defined:

{{< equation >}}
\mathcal{L}(v, \omega) = \lambda_1 \cdot \mathcal{C}_{goal} + \lambda_2 \cdot \mathcal{C}_{distance} + \lambda_3 \cdot \mathcal{C}_{speed}
{{< /equation >}}

Where:  
- $\mathcal{C}_{goal}$: cost of misalignment with the target direction (defined by the visual goal)  
- $\mathcal{C}_{distance}$: angular penalty for proximity to obstacles (derived from LiDAR-based safe zones)  
- $\mathcal{C}_{speed}$: penalty for low forward velocity  

Each term is constructed to be **convex** and **differentiable**, supporting gradient-based optimization.

### Goal Alignment Term

A quadratic distance to the visual goal point (e.g., from a visual servoing controller) is used:

{{< equation >}}
\mathcal{C}_{goal} = (x_{pred} - x_{target})^2 + (y_{pred} - y_{target})^2
{{< /equation >}}

This term guides the robot toward the desired path center or trajectory.

### Obstacle Distance Loss Term

Rather than applying raw inverse-distance penalties, **safe angular zones** are extracted from LiDAR data, and an **optimal avoidance angle** ($\theta^*_{\text{final}}$) closest to the robot's current orientation is determined.

{{< subfigure images="/images_origin/dwa-optimization/clear_zone_explication_01.png,/images_origin/dwa-optimization/clear_zone_explication_02.png" captions="Safe zone from lidar perception., Safe zone explanations." width="600">}}

The obstacle distance loss penalizes deviation from this optimal safe direction:

{{< equation >}}
\mathcal{C}_{distance} = \frac{1}{2} \left( \omega - \frac{\theta^*_{\text{final}}}{dt} \right)^2
{{< /equation >}}

Where:  
- $\omega$: angular velocity being optimized  
- $\theta^*_{\text{final}}$: closest safe angle from sensor data and robot geometry  
- $dt$: control time horizon  

This formulation provides smooth and efficient obstacle avoidance using continuous optimization, inspired by Vector Field Histogram methods.

### Speed Regularization Term

A smooth penalty on low velocities is applied to encourage motion:

{{< equation >}}
\mathcal{C}_{speed} = (v_{max} - v)^2
{{< /equation >}}

This maintains forward progress and prevents stagnation.

## Gradient-Based Optimization

The optimal velocity command is obtained as:

{{< equation >}}
(v^*, \omega^*) = \arg\min_{v, \omega} \mathcal{L}(v, \omega)
{{< /equation >}}

Gradient descent iteratively updates $(v, \omega)$ toward the minimum:

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

This approach removes the need for discrete sampling and enables fine convergence toward optimal commands.

## Integration with Visual Servoing

In SCANeR tests, this optimizer was integrated with a **visual servoing controller** providing a dynamic centerline from camera input. The goal term $\mathcal{C}_{goal}$ uses the visual reference as its target, aligning the vehicle with image-based lanes.

This integration allows:  
- DWA to remain reactive  
- Visual Servoing to supply high-level guidance  
- Optimization to converge smoothly  

{{< figure src="/images/dwa-optimization/scenario_example.png" caption="Gradient-based DWA combined with visual control. Target extracted from camera image." width="600">}}

## Simulation Results

### Gazebo Testing

Validation was conducted in Gazebo with static obstacles and a known goal.  

Demo: {{< videoref label="test-gazebo" >}}.

### Turtlebot Testing

Similar validation was performed on physical robots.  

Demo: {{< videoref label="test-turtlebot-1" >}}, {{< videoref label="test-turtlebot-2" >}}.

### SCANeR Testing

In SCANeR Studio, the optimizer was evaluated in autonomous driving scenarios:  
- Lane center extracted via visual features from camera input  
- DWA optimizer computed reactive velocities toward the visual target  
- Results demonstrated robustness to visual noise and tighter control  

Demo: {{< videoref label="test-scaner" >}}.

## References

{{< bibliography >}}
