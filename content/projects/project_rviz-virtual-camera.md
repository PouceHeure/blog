---
title: "RVIZ2 - Virtual Camera"
date: 2025-05-01
tags: ["ROS2", "RVIZ2"]
image: "/images/rviz-virtual-camera/rviz_virtual_camera.png"
---

## Motivation

RViz is a powerful tool for data introspection in ROS, allowing visualization of information published on various topics. By default, it supports displaying images and overlaying elements on them. However, it does not provide a built-in way to publish a specific point of view as a topic.

## Solution

To overcome this limitation, I developed a solution that enables saving rendered images from a fixed viewpoint, making it possible to replay and reconstruct videos without needing to record the screen directly.

The core idea is to integrate a virtual camera that publishes images rendered from its own perspective. This was achieved by developing a custom **RViz2 plugin**.

{{< figure src="/images/rviz-virtual-camera/rviz_virtual_camera.png" caption="Screenshort example, left 'rviz', right 'rqt_image'." width="500">}}

The plugin includes several configurable parameters to simplify integration:

- **Camera Name**
- **Frame Name** (specifying the frame to which the camera is attached)
- **Field of View**
- **Clip distance**
- **Background color**
- **Render size**

