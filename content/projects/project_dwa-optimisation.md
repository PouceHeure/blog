---
title: "Optimization of the Dynamic Window Approach (DWA)"
date: 2021-12-10
tags: ["planning", "optimization", "ROS", "gradient-descent"]
image: /images/dwa-optimization/thumbnail.png
description: "Gradient descent formulation applied to the Dynamic Window Approach for improved convergence and trajectory quality."
---

## Overview

The Dynamic Window Approach (DWA) is a reactive planning strategy used in mobile robotics. At each control cycle, it samples admissible velocity pairs $(v, \omega)$ and evaluates them using an objective function. The velocity that maximizes the score is selected.

However, the original DWA has two main drawbacks:
- It uses **discretized sampling**, which limits precision
- The **evaluation loop** is computationally expensive

To address this, we reformulate DWA using **convex objective functions** and **gradient descent optimization**.

This work was published at **IEEJ SAMCON 2022**, {{< cite GradientHPousseur >}}.

{{< youtube code="JagUA0hf360" width="800" caption="Video demo (Gazebo simulation)" >}}

{{< youtube code="b1y7jF_VcuU" width="800" caption="Video demo turtlebot (case 1)." >}}

{{< youtube code="SK9dPbqG0fc" width="800" caption="Video demo turtlebot (case 2)." >}}

{{< youtube code="TMXqmAW_N_o" width="800" caption="Video demo (SCANeR + visual servoing)." >}}

## From Sampling to Optimization

### Convex Cost Structure

Instead of computing a score over discrete velocities, we define a continuous, differentiable **cost function**:

{{< equation >}}
\mathcal{L}(v, \omega) = \lambda_1 \cdot \mathcal{C}_{goal} + \lambda_2 \cdot \mathcal{C}_{obstacle} + \lambda_3 \cdot \mathcal{C}_{speed}
{{< /equation >}}

Where:

- $\mathcal{C}_{goal}$: cost of misalignment with the goal or lane
- $\mathcal{C}_{obstacle}$: penalty for proximity to obstacles
- $\mathcal{C}_{speed}$: preference for high velocity

Each term is made convex to support gradient-based optimization.

### Goal Alignment Term

We define a quadratic distance to the visual goal point (e.g., from a visual servoing controller):

{{< equation >}}
\mathcal{C}_{goal} = (x_{pred} - x_{target})^2 + (y_{pred} - y_{target})^2
{{< /equation >}}

This guides the robot toward the desired path center or trajectory.

### Obstacle Avoidance Term

We penalize proximity to obstacles using a convex inverse-distance model:

{{< equation >}}
\mathcal{C}_{obstacle} = \sum_{i=1}^{N} \frac{1}{\|p_{pred} - p_i\|^2 + \epsilon}
{{< /equation >}}

Where $p_i$ is the $i$-th obstacle point, and $\epsilon$ avoids division by zero.

### Speed Regularization Term

We apply a smooth penalty on low velocities to encourage motion:

{{< equation >}}
\mathcal{C}_{speed} = (v_{max} - v)^2
{{< /equation >}}

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

- Classical DWA showed oscillations and sometimes missed narrow passages
- Optimized DWA achieved smoother trajectories and faster convergence

### SCANeR Testing

In SCANeR studio, we validated the optimizer in autonomous driving scenarios:

- Camera extracted the lane center via visual features
- DWA optimizer computed reactive velocities toward the visual target
- Results showed high robustness to visual noise and tighter control

<!-- ## Conclusion

We introduced a **gradient-based formulation of the DWA**, replacing brute-force sampling with continuous optimization. This approach enables:

- Real-time optimization of $(v, \omega)$
- Easier integration with other subsystems (e.g., vision)
- Convex, tunable cost design

It opens possibilities for vision-guided local planning and reduces reliance on hand-tuned sampling grids. -->

## References

{{< bibliography >}}
