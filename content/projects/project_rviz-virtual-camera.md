---
title: "RViz2 - Virtual Camera"
date: 2025-05-01
tags: [core_technologies, ros2]
codelang: ["cpp"]
image: "/images/rviz-virtual-camera/rviz_virtual_camera.png"
description: "RViz2 plugin to publish virtual camera views as ROS 2 image topics for simulation, testing, and visualization."
---

## Overview

RViz2 is a visualization tool in ROS 2 commonly used for inspecting and debugging robot data streams. It can display camera feeds, markers, and 3D data, but it does not natively provide the ability to **publish** its rendered views as image topics, especially from fixed or custom virtual viewpoints.

This gap makes it harder to:
* Capture consistent, high-quality views for later review
* Generate reproducible datasets for testing
* Stream synthetic camera perspectives over a network

{{< youtube code="1-QI8J1kdfM" width="800" caption="Demo: Example output from a virtual camera." label="virtual-camera-demo">}}

Demo: {{< videoref label="virtual-camera-demo" >}}.

## Motivation

Having a way to capture a defined rendered perspective is useful in several contexts:
* Producing dataset frames from simulation
* Debugging and tuning perception algorithms
* Recording reproducible visualizations
* Preparing visual content for reports and demonstrations

Without such a feature, users often rely on manual screen recording or external capture software, which can be less precise and less reproducible.

## Implementation

A **custom RViz2 plugin** was developed to add a virtual camera directly into the RViz rendering pipeline.  
This virtual camera functions as a ROS 2 image publisher, continuously providing images from a configurable point of view.

{{< figure src="/images/rviz-virtual-camera/rviz_virtual_camera.png" caption="Left: RViz2 main view. Right: rqt_image_view showing the virtual camera output." width="500" label="rviz-camera-output">}}

The {{< figref "rviz-camera-output" >}} allows recording and analyzing rendered perspectives without manual screen capture or the need to replicate the viewpoint.

## Features

The virtual camera supports the following configurable parameters:

* **Camera Name** – Used for topic naming and identification
* **Attached Frame** – TF frame to which the camera is linked (e.g., `/map`, `/base_link`)
* **Field of View** – Horizontal field of view in degrees
* **Clipping Planes** – Near and far clip distances
* **Background Color** – Adjustable to match the scene or remove distractions
* **Image Resolution** – Width and height of the output image

These settings can be changed during runtime in RViz. The plugin can be included in existing RViz configurations or launch files for automated workflows.

{{< figure src="/images/rviz-virtual-camera/config.png" caption="Configuration panel of the virtual camera plugin." width="300" label="rviz-camera-config">}}
