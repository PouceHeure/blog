---
title: "Autonomous Vehicle Control"
date: 2024-12-10
tags: ["control", "autosys", "ROS2"]
pinned: true
description: Lateral and longitudinal control applied to a real autonomous vehicle. Connected to a navigation layer.
image: "/images/autosys-control/webcam_onboard.png"
---

## Overview

This module handles low-level control for a real autonomous vehicle, converting trajectory and velocity targets into **steering angles** and **motor torques**.

The control stack is divided into two main parts:

- **Lateral control**: Keeps the vehicle aligned with the planned trajectory.
- **Longitudinal control**: Ensures appropriate acceleration/deceleration and speed tracking.

{{< figure src="/images/autosys-control/control_interfaces_inputs.png" caption="Inputs and outputs of the control layer: planned trajectory and speed command converted to motor torque and steering angle." width="500">}}

## Control Architecture

The control pipeline receives high-level planning outputs and transforms them through the following stages:

- Pre-processing: signal filtering, trajectory sampling
- Target generation: position and speed references
- Actuation control: PID-based control laws (or similar)

{{< figure src="/images/autosys-control/global_view.png" caption="Main components of the vehicle control architecture." width="800">}}

## Speed Profile Shaping

### Motivation

A naive speed transition can generate uncomfortable or unrealistic driving. To improve smoothness, we define **custom speed profiles** ahead of critical zones (e.g. stop lines, curves).

Two approaches are compared:

- **Linear deceleration**:
  {{< equation >}}
  \dot{v}(d) = \text{const.}
  {{< /equation >}}

- **Elliptical deceleration** (more human-like):
  {{< equation >}}
  v(d) = v_{\text{max}} \cdot \sqrt{1 - \left( \frac{d}{d_{\text{stop}}} \right)^2}
  {{< /equation >}}

Their derivatives:
{{< equation >}}
\frac{\partial v}{\partial d}\Big|_{\text{linear}} = \text{const}, \quad
\frac{\partial v}{\partial d}\Big|_{\text{ellipse}} = - \frac{v_{\text{max}} \cdot d}{d_{\text{stop}}^2 \cdot \sqrt{1 - \left(\frac{d}{d_{\text{stop}}}\right)^2}}
{{< /equation >}}

{{< figure src="/images/autosys-control/plot_speed_profile.png" caption="Comparison between linear and elliptical speed profiles and their derivatives." width="700">}}

### Profile Fusion

The final target speed along the curvilinear path is computed as:

1. At each path point $d$, combine all constraints (signal zones, max speed, etc.)
2. Use elliptical profile deceleration toward each signal constraint
3. Final speed is the **minimum** of all constraints at each point:

{{< equation >}}
v_{\text{target}}(d) = \min \big( v_{\text{signal}}(d),\ v_{\text{max}},\ v_{\text{curve}}(d),\ \dots \big)
{{< /equation >}}

This ensures safety and smooth adaptation to dynamic conditions.

## Implementation Notes

The controller is implemented in ROS2 and integrated into the full autonomous navigation stack. Filtering (moving average, saturation) is used to limit noise in both trajectory and command signals. The system is compatible with multiple platforms and modular across vehicle types.

## Applications

- Used in both **simulated (Gazebo)** and **real-world** tests
- Adapted for electric vehicles with **in-wheel motors**
- Handles both structured environments (with traffic signs) and unstructured areas

## References

{{< bibliography >}}
