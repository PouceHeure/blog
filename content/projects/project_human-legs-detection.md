---
title: "Leg Detection Using a 2D LiDAR"
date: 2020-12-10
tags: [ai_ml, core_technologies, ros, sensing_perception]
description: Leg detection based on RNN classification.
image: "/images/legs-detection/thumbnail.png"
github: https://github.com/PouceHeure/ros_detection_legs
---

## Overview

### Source Code

In addition to the main GitHub project, there are the following submodule repositories:
- **Dataset of scanned legs (with labels):** [https://github.com/PouceHeure/dataset_lidar2D_legs](https://github.com/PouceHeure/dataset_lidar2D_legs)  
- **Labeling GUI tool:** [https://github.com/PouceHeure/lidar_tool_label](https://github.com/PouceHeure/lidar_tool_label)  
- **Radar interface:** [https://github.com/PouceHeure/ros_pygame_radar_2D](https://github.com/PouceHeure/ros_pygame_radar_2D)

### Context

This project focuses on detecting human legs using 2D LiDAR data, by leveraging a Recurrent Neural Network (RNN) with **Long Short-Term Memory (LSTM)** cells. Unlike traditional applications of LSTMs on time-series data, here the network is applied to **spatially ordered LiDAR data**.

Each LiDAR scan is treated as a sequence of points ordered by angle (θ), forming a one-dimensional spatial sequence. The LSTM learns shape patterns across these sequences that are typical of human legs in polar space.

### Pipeline

This system was built end-to-end:

- Data acquisition using 2D LiDAR
- Custom labeling and annotation tool
- Spatial clustering and sequence construction
- Model training using LSTM
- Real-time ROS integration and visualization

{{< youtube code="KcfxU6_UrOo" width="800" caption="Video demo, legs detection from a scan." >}}

## Input Representation

Each LiDAR scan consists of a set of polar points:

{{< equation >}}
P_i = (\theta_i, r_i)
{{< /equation >}}

where $\theta_i$ is the angle and $r_i$ is the distance for point $i$.

To build inputs for the model, a **segmentation** process is applied to group nearby points into clusters. Two metrics are used:

- **Angular distance**
- **Radial distance**

These are computed using:

{{< equation >}}
d_{\text{polar}}(P_i, P_j) = \sqrt{r_i^2 + r_j^2 - 2 r_i r_j \cos(\theta_i - \theta_j)}
{{< /equation >}}

{{< equation >}}
d_{\text{radius}}(P_i, P_j) = |r_i - r_j|
{{< /equation >}}

Points are grouped together if both distances fall below predefined thresholds: `limit_distance` and `limit_radius`. Each resulting **cluster** is then encoded as a spatial sequence:

{{< equation >}}
C = \{ P_1, P_2, \dots, P_n \}
{{< /equation >}}

{{< figure src="https://raw.githubusercontent.com/PouceHeure/ros_detection_legs/master/.doc/graph/segmentation.png" caption="Cluster variables representation" width="500">}}

This cluster becomes the input to the LSTM classifier.

### LSTM Model

LSTM networks can model dependencies in sequential data, even when patterns are non-local. Here, instead of time steps, the input sequence represents **spatial structure** across the LiDAR scan.

Human legs often produce smooth, symmetric curves or narrow arcs in the LiDAR field. These spatial structures are encoded in the order of angles and radial distances. The LSTM implicitly learns the shape by scanning across:

- Changes in radius
- Relative angular spacing
- Local curvature patterns

This allows the model to generalize across different leg shapes and positions.

### Model Behavior

The LSTM outputs a binary prediction:

- `1`: the cluster corresponds to a leg
- `0`: not a leg

This is formally a binary classification task, optimized using a cross-entropy loss:

{{< equation >}}
\mathcal{L}_{\text{BCE}} = -\left( y \log(\hat{y}) + (1 - y) \log(1 - \hat{y}) \right)
{{< /equation >}}

Where:

- $ y \in \text{{0, 1}}$ is the ground-truth label,
- $ \hat{y} \in [0, 1] $ is the model's predicted probability.

## Computing the Center of a Detected Cluster

For each cluster of LiDAR points classified as a leg, the system estimates its position by calculating the **geometric center** in polar coordinates. This is analogous to finding the center of mass, but applied to spatial points in the scan.

Given a cluster:
\[
C = \{ P_1, P_2, \dots, P_n \}, \quad P_i = (\theta_i, r_i)
\]
the center is computed as:

\[
\theta_{\text{center}} = \frac{1}{n} \sum_{i=1}^{n} \theta_i
\]
\[
r_{\text{center}} = \frac{1}{n} \sum_{i=1}^{n} r_i
\]

Where:
- \( \theta_{\text{center}} \) is the average angular position,
- \( r_{\text{center}} \) is the average radial distance,
- \( n \) is the number of points in the cluster.

These polar coordinates can be:
- **Used directly** in applications like robot navigation or person tracking, or
- **Converted to Cartesian coordinates** \((x, y)\) for mapping and visualization:
\[
x = r_{\text{center}} \cdot \cos(\theta_{\text{center}}), \quad y = r_{\text{center}} \cdot \sin(\theta_{\text{center}})
\]

This method is applied consistently during both **training evaluation** and **real-time ROS integration**.

### Training and Generalization

To improve model generalization, **data augmentation** was applied by rotating positive clusters:

{{< equation >}}
\theta_i' = \theta_i + \Delta \theta
{{< /equation >}}

{{< figure src="https://raw.githubusercontent.com/PouceHeure/ros_detection_legs/master/.doc/graph/raising.png" caption="Data augmentation." width="300">}}

This keeps the cluster structure intact while simulating different orientations.

Additionally, positive class balancing was applied to compensate for class imbalance:

{{< equation >}}
\text{Final dataset size} = N + K \cdot N_{\text{positive}}
{{< /equation >}}

Where:
- $ N $ is the original dataset size,
- $ N_{\text{positive}} $ is the number of positive examples,
- $ K $ is the number of augmentation steps.

The model was trained on custom-labeled data and evaluated on real-world tests. The figure below shows training curves:

{{< figure src="https://raw.githubusercontent.com/PouceHeure/ros_detection_legs/master/model/train/evaluation.png" caption="Training Curves" width="500">}}

## Integration 

A ROS node, **`detector_node`**, subscribes to the **`/scan`** topic. As LiDAR data is published, the node processes the input in real-time using the trained LSTM model to detect leg positions. The detected positions are then published to the **`/radar`** topic.

{{< figure src="https://raw.githubusercontent.com/PouceHeure/ros_detection_legs/master/.doc/graph/prediction_ros.png" caption="Prediction pipeline integrated into the ROS node." width="500">}}

Similar to training, the input data must be transformed before inference. Therefore, **clustering is performed directly in the subscriber callback function**, converting raw LiDAR scans into usable cluster sequences.

{{< figure src="https://raw.githubusercontent.com/PouceHeure/ros_detection_legs/master/.doc/graph/prediction.png" caption="Clustering and sequence creation for LSTM input during prediction." width="500">}}

For each predicted positive cluster (i.e., detected leg), the **center computation** described in the *Computing the Center of a Detected Cluster* section is used to estimate its position.
