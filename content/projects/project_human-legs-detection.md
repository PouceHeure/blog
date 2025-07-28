---
title: "Leg Detection Using a 2D LiDAR"
date: 2020-12-10
tags: ["deep-learning","lidar","ROS"]
description: Leg detection based on RNN classification.
---

Github Repo: [https://github.com/PouceHeure/ros_detection_legs](https://github.com/PouceHeure/ros_detection_legs)

This was a personal project aimed at developing a model capable of detecting human legs using a single-layer (2D) LiDAR.

Recurrent Neural Networks (RNNs) are typically applied to temporally ordered data. In this project, I explored the use of an RNN on spatially ordered sequences, by feeding the LiDAR scan data to the network in the same spatial order and leveraging this structure for learning.

I developed the entire pipeline for this project:

- Data acquisition 
- Development of a custom labeling tool 
- Manual data labeling 
- Model design and implementation 
- Model training 
- Visualization tool for results rendering

{{< youtube code="KcfxU6_UrOo" width="500" caption="video demo">}}

