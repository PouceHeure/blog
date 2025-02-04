---
title: "Human Driving Prediction"
date: 2022-12-10
tags: ["AI", "machine-learning", "robotics", "camera-vision", "ROS", "RNN", "CNN", "deep-learning"]
---

## Abstract

We developed a multimodal deep learning model capable of predicting human driving behavior. This model was trained on a dataset specifically recorded for this project.  

➡️ **[Scientific Publication](/articles/human-driving-prediction/)**  

## Introduction

A driving intention is defined as a sequence of vehicle states. We denote the driving intention, $I$, as follows:  

{{< equation >}}
I = \{x_0, x_1, ..., x_n\}
{{< /equation >}}

where $(x_i) = (v_i, w_i)$ represents the state of the vehicle. In this project, the state is defined by its linear velocity ($v_i$) and angular velocity ($w_i$).  

The objective of this project is to define a predictive model, $H_\Theta$, such that:  

{{< equation >}}
H_\Theta(X) = \{\hat{y}_{t+1},...,\hat{y}_{t+k}\}
{{< /equation >}}

where $\Theta$ represents the model parameters, $X$ is the input vector at time $t$, and $\hat{y}\_{t+i}$ denotes the predicted state of the vehicle, defined by its linear and angular velocities: $(v_{t+i}, w_{t+i})$.  

We defined, $dt$ the time between 2 consecutive data.

## Data and Model  

### Input Model \& Data

To defined the input data, it's necessary to define which information is essential for the human driving prediction.
These data can be divied into 3...

Due to sensor limitation, in this project we use, $dt = 100ms$, representing the minimum frequency of sensors ($10 Hz$).

In our case, we didn't need to label the data, because the predicted data is the velocity of the vehicle in the futur, so we can exploit the next velocities series as output model. 

### Multi-Modal Model Definition  

## Results

### Prediction  
### Sensitivity Analysis  
