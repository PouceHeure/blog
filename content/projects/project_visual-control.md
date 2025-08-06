---
title: "Visual Control Applied To Autonomous Vehicle"
date: 2023-02-01
tags: [ai_ml, control_optimization, robotics_autonomy, sensing_perception]
# pinned: true
description: "Control a vehicle using only camera images by linking lane features to vehicle speed and orientation."
image: "/images/visual-control/situation_img.png"
---

## Abstract

This project focuses on **Visual Servoing**, a control strategy that links image feature variations to robot velocities. Applied to autonomous vehicles, this approach allows lane-keeping purely from camera input, without GPS or map dependency. It integrates lane detection using deep learning and transforms the output into features used in a control law that centers the vehicle in the lane.

The system was validated on simulated and real data, showing robust behavior in diverse road scenarios.

{{< youtube code="VPxDvUqFA-o" width="800" caption="Video demo, visual control pipeline on real data, from the camera to steering wheel angle." >}}

## Visual Servoing Concepts

Visual Servoing (VS) refers to the use of visual information, typically from a camera, to control the motion of a robot. The control law is derived from the error between a current image feature $s$ and a desired one $s^*$:

{{< equation >}}
e(t) = s(t) - s^*
{{< /equation >}}

The relationship between the change in feature and the robot velocity $u_c$ is modeled by the interaction matrix $L_s$:

{{< equation >}}
\dot{s}(t) = L_s u_c
{{< /equation >}}

To ensure convergence, we apply exponential decay to the error:

{{< equation >}}
\dot{e}(t) = -\lambda L_s^+ e(t)
{{< /equation >}}

Where $L_s^+$ is the Moore–Penrose pseudo-inverse of $L_s$.

## Feature Extraction from Camera Image

The visual servoing controller relies on three geometric features computed from the lane detection in the image:

- $X$: lateral offset between the image center and a selected target point on the lane  
- $Y$: vertical position (depth proxy) of the point in the image  
- $\Theta$: angular deviation between the lane direction and the vertical image axis  

These features are extracted in the image frame and used as input for control.

### Selection of Target Point

We assume the detected lane provides a centerline defined as a curve in image space. A single **target point** is selected at a fixed vertical distance from the bottom of the image (typically 3/4 of the image height), denoted $v_t$.

The horizontal position of this point is obtained by evaluating the lane curve at $v_t$:

{{< equation >}}
u_t = f(v_t)
{{< /equation >}}

Where $f$ is the polynomial fitted to the detected centerline.

### Computation of X and Y

The coordinates $(u_t, v_t)$ are image pixel coordinates. We normalize them relative to the optical center $(c_x, c_y)$ and focal lengths $(f_x, f_y)$:

{{< equation >}}
X = \frac{u_t - c_x}{f_x}, \quad Y = \frac{v_t - c_y}{f_y}
{{< /equation >}}

$X$ corresponds to the lateral displacement in the image, and $Y$ is a proxy for depth.

### Estimation of Theta

To compute the orientation of the lane at the target point, we calculate the tangent to the fitted curve:

{{< equation >}}
\Theta = \arctan\left( \frac{df}{dv}(v_t) \right)
{{< /equation >}}

This angle represents the deviation between the lane direction and the vertical axis of the image.

### Final Feature Vector

The visual features used in control are then assembled as:

{{< equation >}}
s = [X, Y, \Theta]^T
{{< /equation >}}

This vector $s$ is compared to a desired reference $s^*$ to compute the control error.

{{< figure src="/images/visual-control/148.png" caption="Visual Servoing features extracted from real image: centerline and tangent estimation. Target point is sampled along the lane and used to define visual features." width="600">}}

## Lane Detection via Deep Learning

{{< refer href="/projects/project_lane-detection/" project="Lane Detection">}}


The first step in feature extraction is robust lane detection. Instead of relying on geometric models, which are brittle in poor lighting or degraded markings, we use a convolutional autoencoder trained on the CULane dataset.

The model produces binary segmentation maps for lane positions, which are then used to compute the path to follow.

{{< figure src="/images/lane-detection/models.png" caption="Autoencoder-based lane detection architecture used for generating binary masks of lane boundaries." width="600">}}

## From Feature to Control

### Velocity Computation

Given the extracted features $s = [X, Y, \Theta]$, the control goal is to minimize the error $e = s - s^*$. The control output $u_r = [v, w]^T$ includes linear and angular velocity commands.

We relate the time derivative of the features to the robot velocity using:

{{< equation >}}
\dot{s} = L_s(X, Y, \Theta) C_{TR} u_r
{{< /equation >}}

Where $C_{TR}$ is the transformation matrix between robot and camera frames.

### Control Law

Two control configurations are used depending on the desired feature. 
Depending of the situation: if the vehicle it's to far of the lane, the feature point it's over than the image bottom, so the vehicle has to adapt the control (**column controller**) to reach the vehicle. Other situation the feature point keeps the image bottom, then the vehicle needs to keep the lane, the vehicle uses the **row controller**.

**Row controller** for $s^* = [0, Y, 0]$:

{{< equation >}}
w = -B_{row}^+ \left( 
\begin{bmatrix}
K_X e_X \\
K_\Theta e_\Theta
\end{bmatrix} + A_{row} v_d
\right)
{{< /equation >}}

**Column controller** for $s^* = [X, 0, \pm \frac{\pi}{4}]$:

{{< equation >}}
w = -B_{col}^+ \left( 
\begin{bmatrix}
K_Y e_Y \\
K_\Theta e_\Theta
\end{bmatrix} + A_{col} v_d
\right)
{{< /equation >}}

Where $v_d$ is the desired forward velocity and the matrices $A$ and $B$ are derived from the interaction matrix and transformation.

## Control in Real-Time

The computed velocities are sent to the vehicle's motion controller. The system runs in real time and does not depend on external GPS or map input, making it highly portable and robust in unmapped environments.

{{< youtube code="UZjCYTLoMOw" width="800" caption="Demonstration of Visual Servoing Lane Following on test track" >}}

## Integration into the Dynamic Window Approach (DWA)

{{< refer href="/projects/project_dwa-optimisation/" project="Optimization of The Dynamic Window Approach (DWA)">}}

The Visual Servoing framework can be integrated into a classical Dynamic Window Approach (DWA) by modifying the objective function. Rather than relying solely on geometric terms like heading angle or distance to a local goal, we use the **Visual Servoing error** as part of the scoring function.

### Goal Function

Each motion command candidate $(v, w)$ generated by the DWA is evaluated not only for obstacle avoidance and kinematic feasibility, but also based on how well it aligns the robot with the desired image-based features.

{{< equation >}}
J_{vs}(v, w) = \| s(v, w) - s^* \|
{{< /equation >}}

This VS-based cost is added to the standard DWA cost terms:

{{< equation >}}
J_{\text{total}} = \alpha J_{\text{obs}} + \beta J_{\text{vel}} + \gamma J_{vs}
{{< /equation >}}

Where:

- $J_{\text{obs}}$ evaluates obstacle clearance  
- $J_{\text{vel}}$ encourages high velocity  
- $J_{vs}$ penalizes deviation from visual servoing objectives  
- $\alpha$, $\beta$, $\gamma$ are tunable gains

### Obstacle Function

As explain in the project [OPTIMIZATION OF THE DYNAMIC WINDOW APPROACH (DWA)](/projects/project_dwa-optimisation/), the function avoidance obstacle need to know a safety angle to reach. 

The followings figure explain, how compute this angle. This angle needs to respect some constraints: 
- avoid to hit obstacle;
- avoid to be to close of the obstacle;
- going in navigable zone.

The last constraints it's really important to include in the computation, without this constraint the vehicle can reach out of the road.

{{< subfigure images="/images/visual-control/function_obstacle.png,/images/visual-control/limitation_space.png" captions="Obstacle avoidance obstacle explained.,Limitation space from perception." >}}

### Results

By integrating $J_{vs}$, the DWA selects trajectories that are not only dynamically valid and safe, but also visually consistent with the lane-following goal defined by the Visual Servoing framework.

{{< youtube code="TMXqmAW_N_o" width="800" caption="Demonstration of DWA + Visual Servoing in simulation." >}}

<!-- ## Conclusion

This system demonstrates how vision-only lane-keeping can be achieved with modern deep-learning and visual servoing control theory. It offers high adaptability without requiring external localization or mapping infrastructure.

Applications include:

- Urban driving  
- Low-cost autonomous platforms  
- Redundant perception systems in autonomous stacks -->

<!-- ## References

{{< bibliography >}} -->
