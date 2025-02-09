---
title: "Lane Detection"
date: 2022-12-10
tags: ["deep-learning","vision","camera","cnn","ros"]
---

## Abstract

To drive a vehicle in the center of the lane, we can exploit information from the GPS, expected these position are accurate without error combined to an updated maps. Another way to drive the vehicle is to dectect the lane, and create the target control from this information.
First methods for the detection has been to use, classic image processing solution, means geometric approach. This solution is really fast because, it doesn't need high power computation

{{< subfigure images="/images/lane-detection/vs_simple.jpg,/images/lane-detection/vs_curve.jpg,/images/lane-detection/vs_complexe.jpg,/images/lane-detection/vs_without_mark.jpg" captions="Case Simple, Case Curve, Case Complexe, Case Without Mark" >}}