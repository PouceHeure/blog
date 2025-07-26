---
title: "Lane Detection"
date: 2022-12-10
tags: ["deep-learning","camera","ROS", "autosys"]
image: /images/lane-detection/vs_complexe.jpg
description: Lane detection from camera image based on deep-learning model (autoencoder).
---

## Abstract

To drive a vehicle in the center of the lane, we can use information from GPS, assuming that the positioning is accurate and free of errors, combined with up-to-date maps. Another approach is to detect the lane and generate the target control based on this information.

The first methods for lane detection relied on classic image processing techniques, primarily geometric approaches. This solution is very fast since it does not require high computational power. With the evolution of deep learning, new models have been developed to perform lane detection. This new approach allows detection in a wider range of situations and improves accuracy. For example, lane detection can now be applied in challenging conditions such as bad weather, missing lane markings, or low contrast environments.

## Results

{{< subfigure images="/images/lane-detection/vs_simple.jpg,/images/lane-detection/vs_curve.jpg,/images/lane-detection/vs_complexe.jpg,/images/lane-detection/vs_without_mark.jpg" captions="Case Simple, Case Curve, Case Complexe, Case Without Mark" >}}

