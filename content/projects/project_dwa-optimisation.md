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
- It uses **discretized sampling**, which limits precision
- The **evaluation loop** is computationally expensive

To address this, we reformulate DWA using **convex objective functions** and **gradient descent optimization**.

This work was published at **IEEJ SAMCON 2022**, {{< cite GradientHPousseur >}}.

{{< youtube code="JagUA0hf360" width="800" caption="Video demo (Gazebo simulation)" label="test-gazebo">}}

{{< youtube code="b1y7jF_VcuU" width="800" caption="Video demo turtlebot (case 1)."  label="test-turtlebot-1" >}}

{{< youtube code="SK9dPbqG0fc" width="800" caption="Video demo turtlebot (case 2)." label="test-turtlebot-2" >}}

{{< youtube code="TMXqmAW_N_o" width="800" caption="Video demo (SCANeR + visual servoing)." label="test-scaner">}}

## From Sampling to Optimization

### Convex Cost Structure

Instead of computing a score over discrete velocities, we define a continuous, differentiable **cost function**:

{{< equation >}}
\mathcal{L}(v, \omega) = \lambda_1 \cdot \mathcal{C}_{goal} + \lambda_2 \cdot \mathcal{C}_{distance} + \lambda_3 \cdot \mathcal{C}_{speed}
{{< /equation >}}

Where:

- $\mathcal{C}_{goal}$: cost of misalignment with the target direction (defined by the visual goal)
- $\mathcal{C}_{distance}$: angular penalty for proximity to obstacles (derived from LiDAR-based safe zones)
- $\mathcal{C}_{speed}$: penalty for low forward velocity

Each term is made **convex** and **differentiable** to support gradient-based optimization.

### Goal Alignment Term

We define a quadratic distance to the visual goal point (e.g., from a visual servoing controller):

{{< equation >}}
\mathcal{C}_{goal} = (x_{pred} - x_{target})^2 + (y_{pred} - y_{target})^2
{{< /equation >}}

This guides the robot toward the desired path center or trajectory.

### Obstacle Distance Loss Term

Instead of using raw inverse-distance penalties, we extract **safe angular zones** from LiDAR data and define an **optimal avoidance angle** ($\theta^*_{\text{final}}$) closest to the robot's current orientation. 


{{< subfigure images="/images_origin/dwa-optimization/clear_zone_explication_01.png,/images_origin/dwa-optimization/clear_zone_explication_02.png" captions="Safe zone from lidar perception., Safe zone explications." width="600">}}


The obstacle distance loss penalizes deviation from this optimal safe direction:

{{< equation >}}
\mathcal{C}_{distance} = \frac{1}{2} \left( \omega - \frac{\theta^*_{\text{final}}}{dt} \right)^2
{{< /equation >}}

Where:
- $\omega$ is the angular velocity being optimized
- $\theta^*_{\text{final}}$ is the closest safe angle derived from sensor data and robot geometry
- $dt$ is the control time horizon

This formulation ensures smooth and efficient obstacle avoidance using continuous optimization, inspired by Vector Field Histogram techniques.

### Speed Regularization Term

We apply a smooth penalty on low velocities to encourage motion:

{{< equation >}}
\mathcal{C}_{speed} = (v_{max} - v)^2
{{< /equation >}}

This helps maintain forward progress and avoids stagnation.


## Gradient-Based Optimization

The velocity command is obtained via:

{{< equation >}}
(v^*, \omega^*) = \arg\min_{v, \omega} \mathcal{L}(v, \omega)
{{< /equation >}}

Gradient descent is used to iteratively update $(v, \omega)$ toward the minimum:

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

This approach removes the need for discrete sampling and allows finer convergence toward optimal commands.

## Integration with Visual Servoing

In SCANeR tests, we integrated this optimizer with a **visual servoing controller**, which provides a dynamic centerline (from camera input). The goal term $\mathcal{C}_{goal}$ uses the visual reference as its target, aligning the vehicle with image-based lanes.

This fusion allows:
- DWA to remain reactive
- Visual Servoing to inject high-level guidance
- Optimization to converge more smoothly

{{< figure src="/images/dwa-optimization/scenario_example.png" caption="Gradient-based DWA combined with visual control. Target extracted from camera image." width="600">}}

## Simulation Results

### Gazebo Testing

Initial validation was conducted in Gazebo with static obstacles and a known goal.

Demo: {{< videoref label="test-gazebo" >}}.

### Turtlebot Tesing

Similar to Gazebot test, but perform on real robots.

Demo: {{< videoref label="test-turtlebot-1" >}}, {{< videoref label="test-turtlebot-2" >}}.

### SCANeR Testing

In SCANeR studio, we validated the optimizer in autonomous driving scenarios:

- Camera extracted the lane center via visual features
- DWA optimizer computed reactive velocities toward the visual target
- Results showed high robustness to visual noise and tighter control

Demo: {{< videoref label="test-scaner" >}}.

<!-- ## Conclusion

We introduced a **gradient-based formulation of the DWA**, replacing brute-force sampling with continuous optimization. This approach enables:

- Real-time optimization of $(v, \omega)$
- Easier integration with other subsystems (e.g., vision)
- Convex, tunable cost design

It opens possibilities for vision-guided local planning and reduces reliance on hand-tuned sampling grids. -->

## References

{{< bibliography >}}
