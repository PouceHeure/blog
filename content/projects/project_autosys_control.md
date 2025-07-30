---
title: "Autonomous Vehicle Control"
date: 2024-12-10
tags: ["control", "autosys", "ROS2"]
# pinned: true
description: Lateral and longitudinal control applied to a real autonomous vehicle. Connected to a navigation layer.
image: "/images/autosys-control/webcam_onboard.png"
---

## Demonstration 

{{< youtube code="1FJVICEZgao" width="500" caption="Demo video, planning & control." >}}

## Overview

This module defines the **low-level control** system responsible for translating navigation commands into actuator signals (steering and torque). The system is fully integrated with a ROS2-based autonomous stack and was deployed and tested on a **real electric vehicle with in-wheel motors**.

{{< figure src="/images/autosys-control/control_interfaces_inputs.png" caption="Interfaces between planning and control modules." width="500">}}

## Control Structure

The controller is divided into:

- **Lateral control**: Aligns the vehicle to a reference trajectory using steering input.
- **Longitudinal control**: Tracks a target speed while respecting deceleration/acceleration constraints.

Both control loops are refreshed at a high frequency and tuned for real-time execution on embedded systems.

{{< figure src="/images/autosys-control/global_view.png" caption="Block diagram of the full control pipeline." width="800">}}

## Longitudinal Control

The target velocity is tracked using a classical **PID controller**:

{{< equation >}}
u(t) = K_p \cdot e(t) + K_i \cdot \int_0^t e(\tau)\, d\tau + K_d \cdot \frac{de(t)}{dt}
{{< /equation >}}

Where:

- $u(t)$ is the torque or throttle command,
- $e(t) = v_{\text{ref}}(t) - v(t)$ is the velocity error,
- $K_p$, $K_i$, $K_d$ are proportional, integral, and derivative gains.

The controller is tuned for smooth convergence and fast response, with clamping on acceleration and deceleration for comfort.

## Speed Profile Design

### Motivation

In scenarios such as approaching a stop line or crossing zones, it's essential to **smoothly reduce velocity**. Sharp deceleration leads to passenger discomfort and controller overshoot. To shape the desired speed, two profiles were compared.

### Linear Profile

Defined by a constant deceleration rate:

{{< equation >}}
v(d) = v_0 - \dot{v} \cdot d
{{< /equation >}}

Where:

- $v(d)$ is the target speed at distance $d$,
- $v_0$ is the initial velocity,
- $\dot{v}$ is the (negative) deceleration rate.

### Elliptical Profile

More human-like behavior is achieved with:

{{< equation >}}
v(d) = v_{\text{max}} \cdot \sqrt{1 - \left( \frac{d}{d_{\text{stop}}} \right)^2}
{{< /equation >}}

Its derivative is:

{{< equation >}}
\frac{\partial v}{\partial d} = -\frac{v_{\text{max}} \cdot d}{d_{\text{stop}}^2 \cdot \sqrt{1 - \left( \frac{d}{d_{\text{stop}}} \right)^2}}
{{< /equation >}}

{{< figure src="/images/autosys-control/plot_speed_profile.png" caption="Comparison of linear and elliptical speed profiles." width="700">}}

### Profile Fusion

The final speed reference is:

{{< equation >}}
v_{\text{target}}(d) = \min \left( v_{\text{signal}}(d),\ v_{\text{curve}}(d),\ v_{\text{limit}} \right)
{{< /equation >}}

## Lateral Control

The lateral controller computes a desired **steering angle** that minimizes both the lateral displacement and heading error with respect to the reference trajectory. The control law is based on a **nonlinear feedback formulation**, combining geometric and kinematic terms:

{{< equation >}}
\theta_{\text{wheel}} = \alpha_1 \cdot \frac{L}{v^2 + D} \cdot (-e_{\text{lat}}) 
+ \alpha_2 \cdot \frac{L}{v + D} \cdot e_{\text{heading}} 
+ \alpha_3 \cdot L \cdot \kappa
{{< /equation >}}

Where:

- $e_{\text{lat}}$: lateral deviation between vehicle and path
- $e_{\text{heading}}$: orientation error between vehicle heading and path tangent
- $L$: vehicle wheelbase
- $v$: vehicle forward speed
- $\kappa$: curvature of the reference path
- $\alpha_1$, $\alpha_2$, $\alpha_3$: control gains
- $D$: damping factor to avoid division by zero at low speeds

The final steering angle is computed by scaling the wheel angle through a gain $K$:

{{< equation >}}
\theta_{\text{steering}} = K \cdot \theta_{\text{wheel}}
{{< /equation >}}

This formulation ensures:

- Increased sensitivity to lateral error at low speeds
- Stability across a wide range of velocities
- Better tracking on curved paths due to explicit curvature term

The controller was deployed on a real electric AV with precise trajectory tracking in varied urban and testing scenarios.


## Real Vehicle Deployment

All tests were conducted on a **real electric vehicle** equipped with:

- Front camera (for perception),
- RTK-GPS and IMU (for localization),
- ROS2-based onboard PC running the full autonomy stack.

The controller was directly interfaced with in-wheel motor torque requests and front steering actuator.

Use cases tested:

- Urban navigation with stop lines, curves, and replanning
- Parking and pull-out scenarios with lateral constraints
- Speed adaptation to environmental constraints

## Summary

- **PID control** ensures accurate velocity tracking
- **Geometric Pure Pursuit** provides stable lateral guidance
- **Speed profiles** are generated from contextual constraints
- **ROS2 integration** enables modularity and real-time execution
- **All tests performed on a full-scale electric AV**

## References

{{< bibliography >}}
