---
title: "Lane Detection"
date: 2022-12-10
tags: ["deep-learning", "camera", "ROS", "autosys"]
image: /images/lane-detection/detection-result.png
description: Lane detection from camera image based on deep-learning model (autoencoder).
---

## Abstract

Lane detection is a fundamental task for autonomous vehicles. While localization using GPS and HD maps is precise under ideal conditions, visual-based lane detection provides a critical redundancy, especially where GNSS signals are noisy or maps are outdated. This project implements a deep learning lane detection pipeline using a convolutional autoencoder, capable of identifying and segmenting multiple lane boundaries under varied road conditions.

## Introduction to Lane Estimation

Accurate lane perception allows the vehicle to infer its relative position in the road and anticipate curves or road limits. Visual lane detection is a perception-first method, relying only on the camera image and its geometric projection.

In the following image, we show a simulated driving scene where visual lane boundaries are estimated and projected in real time onto the road.

{{< figure src="/images/lane-detection/detection_curve.PNG" caption="Example of projected lane estimations in a simulated environment. Each colored line corresponds to a detected or inferred boundary." width="600">}}

## Deep Learning Architecture

### Autoencoder Design

We use a convolutional autoencoder to perform lane segmentation. The encoder compresses spatial information from the image while the decoder reconstructs four separate masks representing left and right boundaries (inner and outer for each side).

Each block in the architecture includes convolution layers, batch normalization, and ReLU activations. The decoder uses transpose convolutions to upsample back to the original resolution.

{{< figure src="/images/lane-detection/models.png" caption="Lane detection model architecture: a symmetric autoencoder composed of convolutional and upsampling layers. The output is four segmentation masks for the expected lanes." width="600">}}

### Output Structure

The network predicts four binary images. Each one corresponds to a potential lane line such as left border, left middle, right middle, and right border. These images are then processed further to extract geometrical information.

## Post-processing and Lane Regression

### From Segmentation to Curves

After generating binary masks for each lane, a post-processing stage uses RANSAC polynomial regression to fit curves to each lane. This step removes outliers and produces clean continuous lines for use in planning and control.

In the example below, the three main stages are visualized: raw line detection from network output, polynomial regression of each detected line, and region segmentation using fitted lanes.

{{< figure src="/images/lane-detection/detection-result.png" caption="Post-processing steps for lane detection. From top to bottom: raw line detection, curve fitting, and final segmentation into drivable regions." width="700">}}

## Visual Results

We evaluated the model on several test scenarios taken from urban and highway environments. The model proved robust to occlusion, faded lines, and curves.

{{< subfigure images="/images/lane-detection/vs_simple.jpg,/images/lane-detection/vs_curve.jpg,/images/lane-detection/vs_complexe.jpg,/images/lane-detection/vs_without_mark.jpg" captions="Case: Simple, Case: Curve, Case: Complex Markings, Case: Missing Markings" >}}

The system is able to detect lane lines accurately even when markings are partially missing or distorted by lighting conditions.

## Integration with Visual Servoing

Once the lane is detected, the vehicle can compute a local path reference. Using a visual servoing controller, we derive a control law to align the vehicle with the detected centerline. This approach works especially well in structured environments like highways or test tracks.

The control inputs $(v, w)$ (linear and angular velocity) are calculated by minimizing the distance between the camera's forward direction and the lane center trajectory.

## Conclusion and Outlook

This lane detection system combines deep learning, robust geometric fitting, and real-time camera input to provide an end-to-end vision-based perception solution. Future enhancements could include incorporating temporal filtering using LSTMs or optical flow, adapting to multi-lane or lane-change scenarios, and extending to 3D environments with stereo vision or LiDAR fusion.