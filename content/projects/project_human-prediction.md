---
title: "Human Driving Behavior Prediction"
date: 2022-12-10
# pinned: true
tags: ["deep learning", "camera", "ROS", "autonomous vehicle", "lidar"]
image: /images/human-prediction/projection-prediction-test-1-lane.drawio.png
description: Prediction of the human driving behavior in a short-time horizon, depending on previous state of the vehicle. Exploiting deep-learning model, based on multi sensors.
article: /articles/human-driving-prediction/
---

## Abstract

We developed a multimodal deep learning model capable of predicting human driving behavior. This model was trained on a dataset specifically recorded for this project.

{{< youtube code="rqP5nYBehL4" width="800" caption="Video demo, human driving behavior prediction." >}}

`More detail about this solution, feel free to consult the article {{<cite PredictionHPousseur>}}.`

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

To ensure diversity in the training data, we incorporated recordings from both **structured environments** (e.g., highways with lane markings) and **unstructured environments** (e.g., urban intersections, roundabouts). Each scenario was balanced to prevent model bias toward specific driving conditions.

{{< figure src="/images/human-prediction/scheme-dataset_diversification.drawio.png" caption="Scenarios Categories." width="500" label="exemple1">}}

### Temporal Data

In this project, data labeling was unnecessary as the predicted values consist of future vehicle velocities. Instead, we used the next velocity series as the model output.

Due to sensor constraints, the time interval between two acquisitions is set to $dt = 100ms$, which corresponds to the minimum sensor frequency ($10 Hz$).

To improve temporal coherence, we applied **sliding window techniques** over past vehicle states, allowing the model to capture dependencies over different time horizons. Additionally, **data augmentation techniques** (such as time warping and resampling) were applied to enhance generalization.

### Multi-Modal Model Definition  

The model is divided into two main components. The **input model** compresses input data into a lower-dimensional vector, which can serve as a latent representation. The outputs are then concatenated in the **final model**, a recurrent neural network.

{{< figure src="/images/human-prediction/scheme-data_unbalance_old.drawio.png" caption="Handling unbalanced data representation." width="500">}}

This approach was chosen to address data imbalance issues, particularly in handling large inputs such as maps and Lidar data. By processing these inputs separately, we allow the model to focus on extracting the most relevant features for inference.

The **input model** consists of:
- **CNN layers** for spatial feature extraction from image-based data (e.g., camera, Lidar projections).
- **Fully connected layers** for numerical data processing (e.g., vehicle velocity, control inputs).

The **final model** aggregates these processed features and applies **Gated Recurrent Units (GRUs)** to refine the long-term predictions.

{{< figure src="/images/human-prediction/scheme-models_architecture.drawio.png" caption="Overall model architecture, including input and final model." width="800">}}

## Results

The model has been tested on different situations: 
- 1 lane;
- 2 lane;
- City;
- Roundabout.

Following figure shows the projection of prediction and real data, over these different situation.
{{< subfigure images="/images/human-prediction/projection-prediction-test-1-lane.drawio.png,/images/human-prediction/projection-prediction-test-2-lane.drawio.png,/images/human-prediction/projection-prediction-test-city.drawio.png,/images/human-prediction/projection-prediction-test-roundabout.drawio.png" captions="Test 1 Lane, Test 2 Lanes, Test City, Test Roundabout" >}}

{{< figure src="/images/human-prediction/results_mean.png" caption="Mean Errors" width="500">}}

{{< equation >}}
        loss(y_{predict},y_{true}) = w_{v} \cdot \sum_{i=0}^{n} | y_{predict,v,i} - y_{true,v,i} | + w_w \cdot \sum_{i=0}^{n} | y_{predict,w,i} - y_{true,w,i} |
{{< /equation >}}

### Prediction  

The following figures illustrate the model's predictions for the **city test scenario**. The left graphs show short-term horizon predictions ($5s$).

{{< subfigure images="/images/human-prediction/scheme-model_city_results_linear.drawio.png, /images/human-prediction/scheme-model_city_results_angular.drawio.png" captions="Test in city environment: predicted linear velocity, Test in city environment: predicted angular velocity" >}}

<!-- We evaluated the model’s performance using **Mean Absolute Error (MAE)** and **Root Mean Square Error (RMSE)** metrics. The results indicate:
- **Low error rates (~4%)** in structured environments such as highways.
- **Higher error rates (~7%)** in urban environments due to dynamic obstacles and complex intersections.
- **Better short-term accuracy** (1-3s) compared to long-term predictions (5-10s), as expected from recurrent architectures. -->

### Sensitivity Analysis

The neural network approach makes the process non-deterministic. To better "understand" and gain insight into how the network generates its inferences, we leveraged the topology of our multi-input network. Our approach consists of setting each input, one at a time, to a neutral position and analyzing the variation in error compared to the initial error. This method allows us to better understand the impact of each input on the model and its decision-making process.

{{< figure src="/images/human-prediction/scheme-model_sensitivity_motivation.drawio.png" caption="Sensitivity analysis in city environment." width="400">}}
{{< figure src="/images/human-prediction/scheme-blind.drawio.png" caption="Blind spot impact on prediction." width="600">}}
{{< figure src="/images/human-prediction/scheme-result_v2.drawio.png" caption="Final sensitivity analysis results." width="800">}}

<!-- ### Conclusion  

The proposed multimodal deep learning model achieves **state-of-the-art performance** in predicting human driving behavior across diverse scenarios. The results demonstrate the **importance of sensor fusion, temporal modeling, and robust training datasets**.

Future work will focus on:
- **Adaptive learning techniques** to improve real-time inference.
- **Integration with shared autonomy frameworks** for driver-assist systems.
- **Extending the approach to multi-agent scenarios**, where interactions with pedestrians and other vehicles are considered.

-->

## References

{{< bibliography >}}