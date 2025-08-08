---
title: "Lane Detection"
date: 2022-01-10
tags: [ai_ml, robotics_autonomy, ros, sensing_perception]
image: /images/lane-detection/detection-result.png
description: Lane detection from camera image based on deep-learning model (autoencoder).
---

## Abstract

Lane detection is a fundamental task for autonomous vehicles. While localization using GPS and HD maps is precise under ideal conditions, vision-based lane detection provides a critical redundancy, especially where GNSS signals are noisy or maps are outdated.
This system implements a deep learning lane detection pipeline using a convolutional autoencoder, capable of identifying and segmenting multiple lane boundaries under varied road conditions. It uses only front-facing camera images.

The pipeline combines image preprocessing, deep-learning inference, optional temporal tracking, and robust curve fitting to produce clean, reliable lane lines. It has been validated in both real-world driving and simulator environments such as Carla and Scaner.

{{< youtube code="-KzQhDS5PkY" width="800" caption="Video demo of lane detection running 'online'." >}}

Example detections:

{{< figure src="/images/lane-detection/example-global.gif" caption="Lane detection output" width="700">}}
{{< figure src="/images/lane-detection/example-global-seg.gif" caption="Lane detection + Create segmentation (demo 1)" width="700">}}
{{< figure src="/images/lane-detection/example-global-seg-2.gif" caption="Lane detection + Create segmentation (demo 2)" width="700">}}

## Deep Learning Architecture

### Global Pipeline

The system is composed of multiple modules:
- Autoencoder: Generates binary lane masks from the camera image.
- Tracker (optional): ConvLSTM-based temporal model to improve stability across frames.
- Lane Regression: Fits polynomial curves to detected lane masks.
- Post-processing: Filters outliers and optionally produces drivable region segmentation.

{{< figure src="/images/lane-detection/schema-global-pipeline.png" caption="Global lane detection pipeline" width="800">}}
{{< figure src="/images/lane-detection/schema-input-output.png" caption="Input/output shapes for the model" width="500">}}

### Autoencoder Design

A convolutional autoencoder is used for lane segmentation.
The encoder compresses spatial information from the image, while the decoder reconstructs four separate binary masks representing lane boundaries (left border, left middle, right middle, right border).

Each block in the architecture includes convolution layers, batch normalization, and ReLU activations. The decoder uses transpose convolutions to upsample back to the original resolution.

{{< figure src="/images/lane-detection/models.png" caption="Lane detection model architecture: a symmetric autoencoder composed of convolutional and upsampling layers. The output is four segmentation masks for the expected lanes." width="600">}}

## Tracking Module (Optional)

A ConvLSTM tracker can refine predictions by considering the previous N frames, filling gaps and smoothing noise.
It is trained with noise-augmented data to increase robustness.

{{< figure src="/images/lane-detection/schema-tracking-explication.png" caption="Tracking module explanation" width="800">}}
{{< figure src="/images/lane-detection/schema-convlstm-channels.png" caption="ConvLSTM tracking architecture" width="800">}}
{{< figure src="/images/lane-detection/example-tracker-prediction.png" caption="Tracker mask prediction from previous frames" width="500">}}
{{< figure src="/images/lane-detection/example-tracker-raw-prediction.gif" caption="Tracker raw prediction animation" width="500">}}
{{< figure src="/images/lane-detection/example-tracker-improve.gif" caption="Tracker improving lane mask prediction" width="500">}}

## Post-processing and Lane Regression

After mask prediction, RANSAC polynomial regression is applied to fit curves for each lane boundary, filtering out outliers and producing consistent lane shapes.

{{< figure src="/images/lane-detection/schema-regression-colors.png" caption="Lane boundary regression pipeline" width="800">}}

{{< figure src="/images/lane-detection/detection-result.png" caption="Post-processing steps for lane detection. From top to bottom: raw line detection, curve fitting, and optional segmentation into drivable regions." width="700">}}

## Visual Results

The model is robust to occlusions, faded markings, curves, and lighting changes.
Below are examples in varied scenarios:

{{< subfigure images="/images/lane-detection/vs_simple.jpg,/images/lane-detection/vs_curve.jpg,/images/lane-detection/vs_complexe.jpg,/images/lane-detection/vs_without_mark.jpg" captions="Case: Simple, Case: Curve, Case: Complex Markings, Case: Missing Markings" >}}

Real-world example:
{{< figure src="/images/lane-detection/example-real.gif" caption="Real-world lane detection" width="500">}}

Simulator examples:
Carla
{{< figure src="/images/lane-detection/example-carla.gif" caption="Simulator: Carla" width="500">}}
Scaner
{{< figure src="/images/lane-detection/example-scaner.gif" caption="Simulator: Scaner" width="500">}}

## Integration with Visual Servoing

Once the lane is detected, a local path reference is computed.
Using a visual servoing controller, the vehicle aligns with the detected centerline by adjusting linear (v) and angular (w) velocities to minimize camera-to-lane deviation.

{{< refer href="/projects/project_visual-control/" project="VISUAL CONTROL APPLIED TO AUTONOMOUS VEHICLE">}}


## Dataset

The model is trained on the CuLane dataset (https://xingangpan.github.io/projects/CULane.html), transformed into binary lane masks using a custom preprocessing script.
