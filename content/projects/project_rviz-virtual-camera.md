---
title: "RViz2 - Virtual Camera"
date: 2025-05-01
tags: [core_technologies, ros2]
codelang: ["cpp"]
image: "images/rviz-virtual-camera/rviz_virtual_camera.png"
description: "RViz2 plugin to publish virtual camera views as ROS 2 image topics for simulation, testing, and visualization."
---

## Demonstration

{{< youtube code="1-QI8J1kdfM" width="800" caption="Demo: Example output from a virtual camera." label="virtual-camera-demo">}}

The following demontration, {{< videoref label="virtual-camera-demo" >}}, shows the video created from a virtual camera. The virtual camera is attached to a frame, fixed to vehicle.

## Motivation

At first, I recorded the screen during experiments, but this was not a good solution because:
- process it's more complex to setup,
- it uses too many resources,
- the video quality is low,
- I must keep the window and RViz view in the same place.

...I need a better solution.

## Idea

RViz2 is a visualization tool in ROS 2 commonly used for inspecting and debugging robot data streams. It can display camera feeds, markers, and 3D data, but it does not natively provide the ability to **publish** its rendered views as image topics, especially from fixed or custom virtual viewpoints.
The idea it's to develop a Rviz2 plugin allowing to get the render image, created by RViZ2.

{{< figure src="/images/rviz-virtual-camera/diagram_idea.png" caption="Diagram Idea" width="600" label="rviz-virtual-camera_diagram_idea" >}}

As shown by the {{< figref rviz-virtual-camera_diagram_idea >}}, the idea it's to publish the render image over ROS2 topic and record the image using rosbag.

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
