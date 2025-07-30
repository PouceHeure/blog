---
title: "ROS2 - Dashboard Framework"
date: 2025-05-01
tags: ["UI", "ROS2", "Visualization", "Dashboard"]
image: /images/dashboard/dashboard_3.png
description: "Dashboard information builder."
---


## Overview

In robotics and system development, having a clean and flexible interface for visualizing system states, sensor data, and real-time metrics is essential. This project introduces a lightweight **dashboard framework** built specifically for **ROS 2**, enabling rapid dashboard development using simple configuration files.


{{< youtube code="p0qqfZNxj6I" width="500" caption="Demo video, dashboard over video." >}}

## Motivation

While tools like RViz2 or rqt provide some visualization, they often lack flexibility for custom UI layouts, post-processing needs, or presentation-level visual dashboards. This framework was created to:

- Rapidly prototype custom UI dashboards for ROS 2 nodes
- Support both **live systems** and **offline analysis** via ROS bag files
- Enable video export for presentations or analysis

## Approach

The dashboard layout is defined using a **YAML configuration file**, similar in philosophy to UI design in tools like Qt Designer, but tailored to ROS 2 environments.

This YAML-based system allows the user to:
- Declare widgets and their properties
- Define the ROS 2 topics to listen to
- Customize appearance and data bindings
- Choose between rendering on a solid color or an image stream background

This approach eliminates boilerplate UI code while allowing highly customized dashboards.

## Widget Support

The following widget types are currently supported:

- **Slider** : adjustable input linked to a ROS topic or parameter
- **Label** : dynamic text or numeric display
- **Map** : static or live image-based background with overlaid data
- **Circle** : basic geometry for markers or indicators
- **Plot** : real-time data graphing from numeric topics

Widgets are composable and layout is determined via configuration, not hardcoded UI logic.

## Usage Modes

This dashboard can operate in two main modes:

### Online Mode

Connected directly to a live ROS 2 system:
- Visualize sensor data and system state in real-time
- Interact with running nodes (e.g., adjust sliders or monitor values)

### Offline Mode

Load and replay dashboards from a recorded ROS 2 bag file:
- Great for **post-analysis**, testing, and debug reviews
- Reconstruct system behavior over time in a clean UI
- Export visuals to static images or video

## Video Export

The dashboard framework includes optional functionality to export visualizations as a **video**, with or without transparency. This enables integration into broader presentations, overlays, or post-production workflows.

## Examples

Below are several dashboard examples showing different configurations and visual styles:

{{< subfigure images="/images/dashboard/dashboard_2.png,/images/dashboard/dashboard_4.png" captions="Dashboard example with Rviz image., Dashboard example with camera image." >}}