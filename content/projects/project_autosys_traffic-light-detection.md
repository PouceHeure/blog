---
title: "Traffic Light Detection & Control"
date: 2025-05-01
tags: ["ROS2", "detection", "YOLO", "control"]
pinned: true
---

## Motivation

Adapting a vehicle's behavior to traffic lights is a key feature in autonomous driving. The vehicle must be able to adjust its speed based on the current state of the traffic light.

This project is divided into four main components:

- **Matching**: Identifying traffic light positions on the map.
- **Detection**: Determining the current state of the traffic light.
- **Planning**: Adjusting the vehicle's speed according to the detection result.
- **Control**: Applying the computed velocity to the vehicle.

---

## Matching

Based on the vehicle's planned trajectory, we can project the map’s elements:such as traffic lights onto the path. This step doesn’t determine the state of the lights but serves to notify the system that a traffic light zone is ahead.

---

## Detection

Within a traffic light zone, the system must identify the current state of the light.

We used **YOLO** for detection. By default, YOLO is not trained to recognize traffic light states—it can detect the presence of a light but not its color or status. To address this, we trained a YOLO model using a custom dataset built specifically for this application.

### Dataset

#### Cameras

Several data recording sessions were conducted using multiple cameras to ensure data diversity. This also allowed for evaluating the best-suited camera for detection. Key constraints included:

- **Field of view**
- **Image contrast**, even under direct sunlight
- **Ease of camera mounting and adjustment**

#### Labels

The dataset was annotated using the following labels:

- `TL_TOP_RED`
- `TL_BOTTOM_RED`
- `TL_TOP_ORANGE`
- `TL_BOTTOM_ORANGE`
- `TL_TOP_GREEN`
- `TL_BOTTOM_GREEN`

This labeling strategy allows the model to distinguish between the top and bottom lights as well as their colors.

{{< figure src="/images/traffic_light/tl_detection_webcam_combined3/labels.jpg" caption="Labels Distributions" width="500">}}

#### Training

The YOLO model was trained on this dataset:

{{< figure src="/images/traffic_light/tl_detection_webcam_combined3/train_batch0.jpg" caption="Example Batch" width="500">}}

{{< figure src="/images/traffic_light/tl_detection_webcam_combined3/confusion_matrix_normalized.png" caption="Results" width="500">}}


