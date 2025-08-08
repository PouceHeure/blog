---
title: "Traffic Light Detection & Control"
date: 2025-05-15
tags: [control_optimization, core_technologies, robotics_autonomy, ros2, sensing_perception]
codelang: ["cpp"]
# pinned: true
description: Detection of traffic light, and adapt the control of the vehicle depends of the light state. 
image: "/images/traffic_light/thumbnail.png"
---

## Motivation

Adapting a vehicle's behavior to traffic lights is a key feature in autonomous driving. The vehicle must be able to adjust its speed based on the current state of the traffic light.

This project is divided into four main components:

- **Matching**: Identifying traffic light positions on the map.
- **Detection**: Determining the current state of the traffic light.
- **Planning**: Adjusting the vehicle's speed according to the detection result.
- **Control**: Applying the computed velocity to the vehicle.

The detection pipeline is implemented in Python, while control is handled in C++ within a ROS2 environment.

{{< youtube code="1FJVICEZgao" width="800" caption="Demo video, autonomous vehicle adapting control depending the traffic light detection." >}}

## Matching

Based on the vehicle's planned trajectory, map elements such as traffic lights are projected onto the path. This step does not determine the state of the lights but serves to notify the system that a traffic light zone is ahead.

## Detection

Within a traffic light zone, the system must identify the current state of the light.

**YOLO** is used for detection. By default, YOLO is not trained to recognize traffic light states; it can detect the presence of a light but not its color or status. A custom YOLO model was therefore trained using a dedicated dataset for this application.

### Dataset

#### Cameras

Multiple recording sessions were conducted using three different cameras under varying weather conditions (rain and sun) to ensure diversity.  
This setup also enabled evaluation of the most suitable camera for detection. Key constraints included:

- **Field of view**
- **Image contrast**, even under direct sunlight
- **Ease of mounting and adjustment**

#### Labels

The dataset was annotated with the following labels:

- `TL_TOP_RED`: 0
- `TL_BOTTOM_RED`: 1
- `TL_TOP_GREEN`: 2
- `TL_BOTTOM_GREEN`: 3
- `TL_TOP_ORANGE`: 4
- `TL_BOTTOM_ORANGE`: 5

This labeling strategy allows the model to distinguish both the position (top or bottom) and the color of the lights.

The following figure shows the dataset distribution. A minimum number of samples for each class was targeted. The duration of each light color explains the imbalance, with red lights appearing more frequently than green or orange.  
Camera position also influences distribution: from a distance, bottom lights are often obscured, for example by trees.

{{< figure src="/images/traffic_light/model/labels_light.png" caption="Labels Distributions" width="300">}}

### Training

The YOLO model was trained on the dataset described above.  

{{< figure src="/images/traffic_light/model/train_batch18621.jpg" caption="Example Batch" width="500">}}

Image quality and contrast vary due to different camera sources and YOLO training configurations. Data augmentation was applied during training, including transformations, translations, and color adjustments.

After 500 epochs, the following results were obtained:

{{< figure src="/images/traffic_light/model/results.png" caption="Results Plots, training and validation evaluations" width="800">}}

- **Precision**
{{< equation >}}
\text{Precision} = \frac{TP}{TP + FP}
{{< /equation >}}
Proportion of predicted positive detections that are correct.  
**Value:** ≈ 0.99 (very few false positives)

---

- **Recall**
{{< equation >}}
\text{Recall} = \frac{TP}{TP + FN}
{{< /equation >}}
Proportion of actual objects successfully detected.  
**Value:** ≈ 0.97 (very few missed detections)

---

- **mAP@0.5**
{{< equation >}}
\text{mAP@0.5} = \text{mean}(AP_{\text{IoU}=0.5})
{{< /equation >}}
Average precision across all classes at IoU = 0.5.  
**Value:** ≈ 0.98

---

- **mAP@0.5:0.95**
{{< equation >}}
\text{mAP}_{[0.5:0.95]} = \frac{1}{10} \sum_{i=0}^{9} AP_{0.5 + 0.05i}
{{< /equation >}}
Average precision across IoU thresholds from 0.5 to 0.95.  
**Value:** ≈ 0.83

---

- **F1-score**
{{< equation >}}
F1 = 2 \cdot \frac{\text{Precision} \cdot \text{Recall}}{\text{Precision} + \text{Recall}}
{{< /equation >}}
Harmonic mean of precision and recall.  
**Value:** ≈ 0.98

{{< figure src="/images/traffic_light/model/confusion_matrix_normalized.png" caption="Confusion matrix normalized." width="600">}}

{{< table-wrap >}}

| Class             | Accuracy | Notes                                                                 |
|------------------|----------|-----------------------------------------------------------------------|
| TL_TOP_GREEN      | ≈ 0.98   | Minor confusion with background and BOTTOM_GREEN                     |
| TL_TOP_RED        | ≈ 0.99   | Nearly perfect detection                                             |
| TL_BOTTOM_RED     | ≈ 0.90   | Some confusion with background                                       |
| TL_BOTTOM_GREEN   | ≈ 0.97   | Confused with TL_BOTTOM_ORANGE                                       |
| TL_TOP_ORANGE     | ≈ 0.98   | Minor confusion with BOTTOM_ORANGE and background                    |
| TL_BOTTOM_ORANGE  | ≈ 0.96   | Confused with TL_BOTTOM_GREEN                                        |

{{< /table-wrap >}}

### Test Examples

Examples of detection on real-world data are shown below. Current implementation focuses on top lights, as bottom lights are not consistently visible.

{{< subfigure images="/images/traffic_light/detection_traffic_light__green_new.png,/images/traffic_light/detection_traffic_light__orange_new.png,/images/traffic_light/detection_traffic_light__red_new.png" captions="Green top detection., Orange top detection., Red top detection." >}}

The drawn traffic light on each image represents the system's recognized state.

### State Definition

The map is used to identify traffic lights along the planned route. A dedicated detection node publishes the detected traffic light state.

This node includes a **timeout** parameter to retain the last detected state when no new detection is available, avoiding sudden braking. In the absence of a detection, the default assumption is red.

The detection node runs at **10 Hz** to balance processing load with responsiveness. Given the deterministic nature of the model and the camera’s 30 Hz frame rate, higher inference frequency offers no benefit.

## Adaptive Control

Once the traffic light state is determined, the vehicle’s speed profile is adjusted accordingly.

Each road element (including each traffic light) is associated with a **finite state machine** defining vehicle behavior. A speed profile is assigned based on distance, for example:  
$ d \in [0, distance_{ahead}],\ speed = profile(d)$.  
{{< refer href="/projects/project_autosys_local-planning/#speed-profile-signal" project="Planning Project" section="Speed Profile: signal" >}}

The traffic light state machine is defined as:

- `LOCK`: Element is active; the vehicle stops before the light.
- `SKIP`: Element is ignored; the vehicle proceeds without stopping.
- `FREE`: Element has been passed; it is no longer relevant.

**Transitions:**
- `LOCK` $\Longleftrightarrow$ `SKIP`
- `SKIP` $\Longrightarrow$ `FREE`

State updates based on detected light color:
- `LOCK`: red or orange  
- `SKIP`: green  
- `FREE`: light already passed  

The final control signal is derived by combining all velocity profiles and taking the minimum value at each distance point, ensuring compliance with all constraints.
