---
title: "Human Driving Prediction"
date: 2022-12-10
tags: ["AI", "machine-learning", "robotics", "camera-vision", "ROS", "RNN", "CNN", "deep-learning"]
---

## Abstract

We developed a multimodal deep learning model capable of predicting human driving behavior. This model was trained on a dataset specifically recorded for this project.

➡️ **[Scientific Publication](/articles/human-driving-prediction/)**

## Introduction

Driving intention is defined as a sequence of vehicle states. We represent the driving intention, $I$, as follows:

{{< equation >}}
I = \{x_0, x_1, ..., x_n\}
{{< /equation >}}

where $(x_i) = (v_i, w_i)$ represents the vehicle's state. In this project, the state is defined by its linear velocity ($v_i$) and angular velocity ($w_i$).

{{< figure src="/images/human-prediction/scheme-human_profile_prediction.drawio.png" caption="Goal of the project." width="500">}}

The objective of this project is to develop a predictive model, $H_\Theta$, such that:

{{< equation >}}
H_\Theta(X) = \{\hat{y}_{t+1},...,\hat{y}_{t+k}\}
{{< /equation >}}

where $\Theta$ represents the model parameters, $X$ is the input vector at time $t$, and $\hat{y}\_{t+i}$ denotes the predicted state of the vehicle, defined by its linear and angular velocities: $(v_{t+i}, w_{t+i})$.

We define $dt$ as the time interval between two consecutive data points.

## Data and Model  

### Data Categories

To define the input data, it is essential to determine which information is necessary for human driving prediction. These data are categorized into three types:
- **Vehicle state**, including the vehicle's dynamic properties such as velocities and accelerations.
- **Environment state**, representing environmental data such as maps and Lidar information.
- **Control state**, encompassing vehicle control inputs like steering wheel angle and pedal positions.

{{< figure src="/images/human-prediction/scheme-data.drawio.png" caption="Data input." width="500">}}

### Data Situations

Driving behavior varies based on different driving scenarios such as highways, city streets, and roundabouts. To ensure robust model inference across different situations, we created a dedicated dataset covering diverse driving environments.

{{< figure src="/images/human-prediction/scheme-dataset_diversification.drawio.png" caption="Scenarios Categories." width="500">}}

### Temporal Data

In this project, data labeling was unnecessary as the predicted values consist of future vehicle velocities. Instead, we used the next velocity series as the model output.

Due to sensor constraints, the time interval between two acquisitions is set to $dt = 100ms$, which corresponds to the minimum sensor frequency ($10 Hz$).

### Multi-Modal Model Definition  

The model is divided into two main components. The **input model** compresses input data into a lower-dimensional vector, which can serve as a latent representation. The outputs are then concatenated in the **final model**, a recurrent neural network.

{{< figure src="/images/human-prediction/scheme-data_unbalance_old.drawio.png" caption="Handling unbalanced data representation." width="500">}}


This approach was chosen to address data imbalance issues, particularly in handling large inputs such as maps and Lidar data. By processing these inputs separately, we allow the model to focus on extracting the most relevant features for inference.

{{< figure src="/images/human-prediction/scheme-models_architecture.drawio.png" caption="Overall model architecture, including input and final model." width="800">}}

## Results

{{< subfigure images="/images/human-prediction/projection-prediction-test-1-lane.drawio.png,/images/human-prediction/projection-prediction-test-2-lane.drawio.png,/images/human-prediction/projection-prediction-test-city.drawio.png,/images/human-prediction/projection-prediction-test-roundabout.drawio.png" captions="Test 1 Lane, Test 2 Lanes, Test City, Test Rouandbout" >}}


{{< subfigure images="/images/human-prediction/results_mean.png,/images/human-prediction/table_results.png" captions="Test 1 Lane, Test 2 Lanes, Test City, Test Rouandbout" >}}

### Prediction  

The following figures illustrate the model's predictions for the **city test scenario**. The left graphs show short-term horizon predictions ($5s$).

{{< subfigure images="/images/human-prediction/scheme-model_city_results_linear.drawio.png, /images/human-prediction/scheme-model_city_results_angular.drawio.png" captions="Test in city environment: predicted linear velocity, Test in city environment: predicted angular velocity" >}}

### Sensitivity Analysis

{{< figure src="/images/human-prediction/scheme-model_sensitivity_motivation.drawio.png" caption="Sensitivity analysis in city environment." width="400">}}
{{< figure src="/images/human-prediction/scheme-blind.drawio.png" caption="Blind spot impact on prediction." width="500">}}
{{< figure src="/images/human-prediction/scheme-result_v2.drawio.png" caption="Final sensitivity analysis results." width="800">}}

