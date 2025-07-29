---
title: "Friction Camera Detection"
date: 2022-11-10
tags: ["image-processing","camera"]
description: Road friction estimation based on camera.
image: /images/road-friction/thumbnail.png
---

{{< youtube code="mbmAByTlTSU" width="500" caption="Video demo" >}}

As part of a European project, I carried out a two-month research mission in Japan at the University of Tokyo.

The objective was to estimate the road friction coefficient using only a camera. In this approach, the camera detects surface variations, similar to an occupancy grid. A grip-type grid is continuously updated by combining these detections with the robot's position, obtained from GPS and a Kalman filter.

This research led to the publication of a paper at the IEEE AIM 2023 conference (USA).