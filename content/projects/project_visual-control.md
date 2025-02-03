---
title: "Visual Control Applied To Autonomous Vehicle"
date: 2025-02-01T18:36:30+01:00
tags: ["AI", "machine-learning", "robotic"]
---

## Abstract

As part of my research, I implemented a control method called Visual Servoing, which aims to control a robot by establishing a relationship between the rate of change of a feature (point, line, etc.) in the image and the robot's velocity. This allows, in our case, the vehicle to be centered within the lane.
The first step involves lane detection. Several methods exist, either geometric or deep learning-based. Deep learning provides a more robust approach in specific cases (poor weather conditions, absence of white lane markings, etc.). I opted for this method by designing and training an autoencoder (CNN).
Once the lanes are detected, a feature in our case, a point must be extracted, representing a point on the trajectory to follow in the image frame.
Finally, a control loop applying the principles of Visual Servoing can be implemented.

## Visual Servoing Feature

The first step of the visual servoing, is to detect the feature in the image frame.
In the case of the autonomous driving, the feature should to reflet the way to keep the lane.

### Lane Detection

### Features

{{< figure src="/images/visual-control/148.png" caption="Visual Servoing features on real application." width="500">}}
