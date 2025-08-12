---
title: "Human Driving Behavior Prediction"
date: 2022-03-10
tags: [ai_ml, robotics_autonomy, ros, sensing_perception]
codelang: ["python"]
image: /images/human-prediction/projection-prediction-test-1-lane.drawio.png
description: Prediction of short-term human driving behavior using previous vehicle states, based on a deep learning model integrating multiple sensors.
article: /articles/article_human-driving-prediction/
---

## Abstract

A multimodal deep learning model was developed to predict human driving behavior over a short time horizon. The training dataset was recorded specifically for this project.

{{< youtube code="rqP5nYBehL4" width="800" caption="Video demo, human driving behavior prediction." >}}

More details about this work are provided in {{<cite PredictionHPousseur>}}.

## Introduction

Driving intention is represented as a sequence of vehicle states. Let $I$ be:

{{< equation >}}
I = \{x_0, x_1, ..., x_n\}
{{< /equation >}}

Here, $(x_i) = (v_i, w_i)$ denotes the state at time $i$, where $v_i$ is the linear velocity and $w_i$ is the angular velocity.

{{< figure src="/images/human-prediction/scheme-human_profile_prediction.drawio.png" caption="Goal of the project." width="500">}}

The prediction model, $H_\Theta$, aims to produce:

{{< equation >}}
H_\Theta(X) = \{\hat{y}_{t+1},...,\hat{y}_{t+k}\}
{{< /equation >}}

where 
- $ \Theta $  are the model parameters, $  X $  is the input vector at time $  t $ 
- $ \hat{y}_{t+i} $  is the predicted state
- $ (v_{t+i}, w_{t+i}) $  are the predicted velocities  
- $ dt $  is the acquisition interval in seconds.


## Data and Model

### Data Categories

Input data are grouped into three categories:

- **Vehicle state**: velocities, accelerations, and other dynamics.
- **Environment state**: map and Lidar data.
- **Control state**: steering angle, pedal positions.

{{< figure src="/images/human-prediction/scheme-data.drawio.png" caption="Data input." width="500">}}

### Driving Scenarios

Behavior varies across scenarios such as highways, city streets, and roundabouts. The dataset includes both **structured** (lane-marked roads) and **unstructured** (urban intersections, roundabouts) environments to prevent bias.

{{< figure src="/images/human-prediction/scheme-dataset_diversification.drawio.png" caption="Scenario categories." width="500">}}

### Temporal Aspects

No manual labeling was required; future velocities served as output targets. The sensor acquisition rate is $dt = 100ms$ (10 Hz). A **sliding window** over past states captures temporal dependencies, and **data augmentation** (time warping, resampling) improves generalization.

### Multi-Modal Model

The model consists of:

1. **Input model**: compresses each modality into a latent vector.
2. **Final model**: concatenates latent vectors and applies a recurrent network.

{{< figure src="/images/human-prediction/scheme-data_unbalance_old.drawio.png" caption="Handling unbalanced data representation." width="500">}}

The **input model** uses:
- **CNNs** for image-based features (camera, Lidar projections).
- **Fully connected layers** for numerical data.

The **final model** uses **GRUs** for sequence prediction.

{{< figure src="/images/human-prediction/scheme-models_architecture.drawio.png" caption="Overall model architecture." width="800">}}

## Results

### Test Characteristics

{{< table-wrap >}}
| Test Name         |  Roundabouts |  Intersections | Speed Limit | Distance | Time Record |  Lanes |
|-------------------|--------------|-----------------|-------------|----------|-------------|---------|
| roundabout        | 6            | 1               | 70 km/h     | 4 km     | 378 s       | 2       |
| city              | 4            | 7               | 50 km/h     | 4 km     | 519 s       | 1       |
| speed (1 lane)    | 2            | 0               | 70 km/h     | 2 km     | 116 s       | 1       |
| speed (2 lanes)   | 0            | 0               | 90 km/h     | 2 km     | 84 s        | 2       |
{{< /table-wrap >}}

The following projections compare predicted and actual trajectories for different scenarios.

{{< subfigure images="/images/human-prediction/projection-prediction-test-1-lane.drawio.png,/images/human-prediction/projection-prediction-test-2-lane.drawio.png,/images/human-prediction/projection-prediction-test-city.drawio.png,/images/human-prediction/projection-prediction-test-roundabout.drawio.png" captions="Test 1 Lane, Test 2 Lanes, Test City, Test Roundabout" >}}

{{< figure src="/images/human-prediction/results_mean.png" caption="Mean errors." width="500">}}

The error function is:

{{< equation >}}
loss(y_{predict},y_{true}) = w_{v} \cdot \sum_{i=0}^{n} | y_{predict,v,i} - y_{true,v,i} | + w_{w} \cdot \sum_{i=0}^{n} | y_{predict,w,i} - y_{true,w,i} |
{{< /equation >}}

Where:
- $w_v$ is the weight for linear velocity error.
- $w_w$ is the weight for angular velocity error.

### Example: City Test

{{< subfigure images="/images/human-prediction/scheme-model_city_results_linear.drawio.png, /images/human-prediction/scheme-model_city_results_angular.drawio.png" captions="Predicted linear velocity, Predicted angular velocity in city scenario" >}}

### Sensitivity Analysis

The impact of each input was measured by neutralizing it and observing the change in error. This shows which inputs most influence predictions.

{{< figure src="/images/human-prediction/scheme-model_sensitivity_motivation.drawio.png" caption="Sensitivity analysis motivation." width="400">}}
{{< figure src="/images/human-prediction/scheme-blind.drawio.png" caption="Effect of blind spots." width="600">}}
{{< figure src="/images/human-prediction/scheme-result_v2.drawio.png" caption="Sensitivity analysis results." width="800">}}

## References

{{< bibliography >}}
