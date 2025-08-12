---
title: "Lane Detection"
date: 2022-01-10
tags: [autonomous_vehicle, ai_ml, robotics_autonomy, ros, sensing_perception]
codelang: ["python"]
image: /images/lane-detection/detection-result.png
description: Lane detection from camera images using a deep-learning autoencoder.
---

## Abstract

Lane detection is an essential function for autonomous vehicles. While GPS and HD maps offer accurate localization under optimal conditions, vision-based detection provides an important backup, especially in areas with weak GNSS signals or outdated maps.  

This system implements a deep-learning lane detection pipeline using a convolutional autoencoder, designed to identify and segment multiple lane boundaries in various road conditions using only front-facing camera images.

The approach integrates image preprocessing, deep-learning inference, optional temporal tracking, and curve fitting to generate stable and clean lane boundaries. It has been tested in real-world driving and in simulators such as Carla and Scaner.

{{< youtube code="-KzQhDS5PkY" width="800" caption="Video demo of lane detection running online." >}}

Example detections:  

{{< figure src="/images/lane-detection/example-global.gif" caption="Lane detection output" width="700">}}  
{{< figure src="/images/lane-detection/example-global-seg.gif" caption="Lane detection + segmentation (demo 1)" width="700">}}  
{{< figure src="/images/lane-detection/example-global-seg-2.gif" caption="Lane detection + segmentation (demo 2)" width="700">}}  

## Deep Learning Architecture

### Global Pipeline

The system is organized into several modules:  
- Autoencoder: Produces binary lane masks from camera input.  
- Tracker (optional): A ConvLSTM-based temporal model for improved frame-to-frame stability.  
- Lane Regression: Fits polynomial curves to lane masks.  
- Post-processing: Removes outliers and can generate drivable region segmentation.  

{{< figure src="/images/lane-detection/schema-global-pipeline.png" caption="Global lane detection pipeline" width="800">}}  
{{< figure src="/images/lane-detection/schema-input-output.png" caption="Input/output shapes for the model" width="500">}}  

### Autoencoder Design

The convolutional autoencoder performs lane segmentation by encoding spatial information and decoding it into four binary masks: left border, left middle, right middle, and right border.  

Each block contains convolution layers, batch normalization, and ReLU activation. The decoder upsamples using transpose convolutions to restore the original resolution.  

{{< figure src="/images/lane-detection/models.png" caption="Autoencoder for lane detection: convolutional and upsampling layers producing four segmentation masks." width="600">}}  

## Tracking Module (Optional)

The ConvLSTM tracker improves predictions by considering the previous N frames, reducing noise and bridging gaps. Training includes noise-augmented data for robustness.  

{{< figure src="/images/lane-detection/schema-tracking-explication.png" caption="Tracking module explanation" width="800">}}  
{{< figure src="/images/lane-detection/schema-convlstm-channels.png" caption="ConvLSTM tracking architecture" width="800">}}  
{{< figure src="/images/lane-detection/example-tracker-prediction.png" caption="Tracker mask prediction from previous frames" width="500">}}  
{{< figure src="/images/lane-detection/example-tracker-raw-prediction.gif" caption="Tracker raw prediction animation" width="500">}}  
{{< figure src="/images/lane-detection/example-tracker-improve.gif" caption="Tracker improving lane mask prediction" width="500">}}  

## Post-processing and Lane Regression

After mask prediction, RANSAC polynomial regression fits curves to each lane boundary, rejecting outliers for consistent results.  

{{< figure src="/images/lane-detection/schema-regression-colors.png" caption="Lane boundary regression pipeline" width="800">}}  

{{< figure src="/images/lane-detection/detection-result.png" caption="Post-processing steps: raw detection, curve fitting, and optional drivable region segmentation." width="700">}}  

## Visual Results

The model performs well with occlusions, worn markings, curves, and lighting variations.  

{{< subfigure images="/images/lane-detection/vs_simple.jpg,/images/lane-detection/vs_curve.jpg,/images/lane-detection/vs_complexe.jpg,/images/lane-detection/vs_without_mark.jpg" captions="Case: Simple, Case: Curve, Case: Complex Markings, Case: Missing Markings" >}}  

Real-world example:  
{{< figure src="/images/lane-detection/example-real.gif" caption="Real-world lane detection" width="500">}}  

Simulator examples:  
Carla  
{{< figure src="/images/lane-detection/example-carla.gif" caption="Simulator: Carla" width="500">}}  
Scaner  
{{< figure src="/images/lane-detection/example-scaner.gif" caption="Simulator: Scaner" width="500">}}  

## Integration with Visual Servoing

After lane detection, a local path reference is computed.  
A visual servoing controller adjusts linear velocity $v$ and angular velocity $w$ to minimize deviation from the detected lane centerline.  

{{< refer href="/projects/project_visual-control/" project="Visual Control Project">}}  

## Dataset

The model is trained on the [CuLane dataset](https://xingangpan.github.io/projects/CULane.html), converted into binary masks using a custom preprocessing script.
