---
title: "Autonomous Vehicle: Teleop"
date: 2025-11-10
tags: [autonomous_vehicle, control_optimization, robotics_autonomy, ros2]
description: Longitudinal control by teleop.
image: "images/teleop/thumbnail.png"
big: true
---

## Demonstration

{{< youtube code="wK4yOg2SyBs" width="800" caption="Teleoperation Demo." label="video-demo-teleop">}}
This video {{< videoref label="video-demo-teleop" >}} illustrates the longitudinal control of the car via teleoperation.
- Example of speed saturation: 0:07 – 0:16 (limited by lateral acceleration)
- Example of braking: 1:20

## Overview

Control the vehicle’s longitudinal speed using the joystick. This project should take into account the desired speed from the teleoperator while keeping the vehicle safe. The vehicle must adjust the desired speed according to the maximum acceptable (safe) speed.

## Explanation

### Joystick Input To Signal

The joystick provides an input value between –1 and +1. The idea is to remap this value to a range between 0 and the maximum speed (a parameter), and then generate a square-wave signal.  
This square signal is then used by the Motion Manager as one of its input signals.

{{< refer href="/projects/project_autosys_local-planning/#motion-profile-generation" project="Navigation Project" section="Motion Profile Generation" >}}

{{< refer href="/projects/project_autosys_control/#profile-fusion" project="Control Project" section="Profile Fusion" >}}

The joystick can be read directly by the `joy` node from the *joy* package, which publishes the state of the joystick over a topic. A converter node transforms this state into a velocity signal, which is then consumed by the Motion Manager.

```
Joy Node  -topic->  Converter To Signal  -topic->  Motion Manager
```

{{< youtube code="eF1Tazql7R8" width="800" caption="Teleop to signal variation." label="video-teleop-to-signal">}}

The {{< videoref label="video-teleop-to-signal" >}} represents the signal variation sent to the motion behavior.
The signal is visible on the screen, drawn in red. The height of the signal is variating depending of the teleop position.

### Speed Limitation Control

Thus, the joystick controls the vehicle by limiting the maximum speed rather than commanding acceleration directly. This makes it possible to fuse the human operator’s intention with the vehicle’s acceptable (safe) motion constraints (obstacle, road rules & lateral accelaration maximal).



### Others Features

The joystick can also control the turn signals and the horn of the vehicle.
