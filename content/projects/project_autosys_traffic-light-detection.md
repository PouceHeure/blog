---
title: "Traffic Light Detection & Control"
date: 2025-05-15
tags: [autonomous_vehicle, control_optimization, core_technologies, robotics_autonomy, ros2, sensing_perception]
codelang: ["cpp"]
# pinned: true
description: Detection of traffic lights, and adaptation of vehicle control depending on the light state.
image: "/images/traffic_light/thumbnail.png"
---

## Motivation

As part of an autonomous driving project, I contributed to the development of a system enabling a vehicle to adapt its behavior to traffic lights. The vehicle adjusts its speed according to the current traffic light state.

The project is divided into four main components:

- **Matching**: Identifying traffic light positions on the map  
- **Detection**: Determining the current state of the traffic light  
- **Planning**: Adjusting vehicle speed according to the detection result  
- **Control**: Applying the computed velocity to the vehicle  

The detection pipeline is implemented in Python, while control is handled in C++ within a ROS2 environment.

{{< youtube code="1FJVICEZgao" width="800" caption="Demo video: autonomous vehicle adapting control based on traffic light detection." >}}

## Matching

Based on the vehicle's planned trajectory, map elements such as traffic lights are projected onto the path.  
This step does not determine the state of the lights, but flags that a traffic light zone is ahead.

## Detection

Within a traffic light zone, the system must identify the current state of the light.

**YOLO** is used for detection. By default, YOLO is not trained to recognize traffic light states; it detects only the presence of a light. A custom YOLO model was therefore trained using a dedicated dataset for this application.

### Dataset

#### Cameras

Multiple recording sessions were conducted using three different cameras under varying weather conditions (rain and sun) to ensure diversity.  
This also enabled evaluation of the most suitable camera for detection. Key constraints included:

- **Field of view**  
- **Image contrast**, even in direct sunlight  
- **Ease of mounting and adjustment**  

#### Labels

The dataset was annotated with the following labels:

- `TL_TOP_RED`: 0  
- `TL_BOTTOM_RED`: 1  
- `TL_TOP_GREEN`: 2  
- `TL_BOTTOM_GREEN`: 3  
- `TL_TOP_ORANGE`: 4  
- `TL_BOTTOM_ORANGE`: 5  

This allows the model to distinguish both the position (top or bottom) and the color of the lights.

The following figure shows dataset distribution. The minimum number of samples per class was targeted. Red lights occur more often due to their longer duration.  
Camera position also affects distribution: bottom lights are often obscured by trees when far away.

{{< figure src="/images/traffic_light/model/labels_light.png" caption="Label distributions." width="300">}}

### Training

The YOLO model was trained on this dataset.

{{< figure src="/images/traffic_light/model/train_batch18621.jpg" caption="Batch image example from training." width="500">}}

Image quality and contrast vary due to different camera sources and YOLO configurations.  
Data augmentation included transformations, translations, and color adjustments to improve generalization.

After 500 epochs, the following evaluation results were obtained on the validation set:

---

- **Precision**  
{{< equation >}}
\text{Precision} = \frac{TP}{TP + FP}
{{< /equation >}}  
Measures how often the model’s *positive detections* (e.g., "green top light detected") are correct.  
A precision close to 1.0 means very few **false positives**, the system rarely claims a light is green/red/orange when it is not.  
**Result:** ≈ 0.99 . Almost every detection made by the system is correct.

---

- **Recall**  
{{< equation >}}
\text{Recall} = \frac{TP}{TP + FN}
{{< /equation >}}  
Measures how many of the *actual lights present* were detected by the model.  
A high recall means the model rarely misses a relevant light (**false negatives** are rare).  
**Result:** ≈ 0.97 . The system detects almost all visible traffic lights.

---

- **mAP\@0.5**  
{{< equation >}}
\text{mAP@0.5} = \text{mean}(AP_{\text{IoU}=0.5})
{{< /equation >}}  
Mean Average Precision across all classes, calculated at an IoU (Intersection-over-Union) threshold of 0.5.  
IoU is the overlap ratio between the predicted bounding box and the ground-truth box.  
A value near 1.0 means the predicted box is well-aligned with the real light location.  
**Result:** ≈ 0.98 . Bounding boxes are accurate for most detections.

---

- **mAP@[0.5:0.95]**  
{{< equation >}}
\text{mAP}_{[0.5:0.95]} = \frac{1}{10} \sum_{i=0}^{9} AP_{0.5 + 0.05i}
{{< /equation >}}  
Average precision computed over multiple IoU thresholds from 0.5 to 0.95 in steps of 0.05.  
This is a stricter metric than mAP\@0.5 because it requires good alignment across a range of IoU tolerances.  
**Result:** ≈ 0.83 . Performance remains high even under stricter bounding box alignment requirements.

---

- **F1-score**  
{{< equation >}}
F1 = 2 \cdot \frac{\text{Precision} \cdot \text{Recall}}{\text{Precision} + \text{Recall}}
{{< /equation >}}  
The harmonic mean of precision and recall, a balanced single score that considers both false positives and false negatives.  
**Result:** ≈ 0.98 . The detector maintains a strong balance between correctly identifying lights and not missing them.

---

These results confirm the detector is both **accurate** (high precision) and **comprehensive** (high recall), with bounding boxes that closely match ground truth (high mAP).  
This reliability is crucial for control decisions, since a missed red light or a false green could lead to unsafe vehicle behavior.


{{< figure src="/images/traffic_light/model/confusion_matrix_normalized.png" caption="Normalized confusion matrix." width="600">}}

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

Examples of detection on real-world data are shown below.  
Current implementation focuses on top lights, as bottom lights are not always visible.

{{< subfigure images="/images/traffic_light/detection_traffic_light__green_new.png,/images/traffic_light/detection_traffic_light__orange_new.png,/images/traffic_light/detection_traffic_light__red_new.png" captions="Green top detection., Orange top detection., Red top detection." >}}

The drawn traffic light overlay represents the system's recognized state.

### State Definition

The map is used to identify traffic lights along the planned route.  
A dedicated detection node publishes the detected light state.

This node includes a **timeout** parameter to retain the last detection when no new result is available, preventing sudden braking.  
If no detection is available, the default state is red.

The detection node runs at **10 Hz**, balancing processing load with responsiveness. Given the deterministic nature of the model and the camera’s 30 Hz frame rate, a higher inference rate offers no benefit.

## Adaptive Control

Once the traffic light state is determined, the vehicle’s speed profile is adjusted accordingly.

Each road element (including each traffic light) is associated with a **finite state machine** defining vehicle behavior. A speed profile is assigned based on distance, for example:  
$ d \in [0, distance_{ahead}],\ speed = profile(d)$.  
{{< refer href="/projects/project_autosys_local-planning/#speed-profile-signal" project="Planning Project" section="Speed Profile: signal" >}}

The traffic light state machine is defined as:

- `LOCK`: Element is active; vehicle stops before the light  
- `SKIP`: Element is ignored; vehicle continues  
- `FREE`: Element passed; no longer relevant  

**Transitions:**
- `LOCK` $\Longleftrightarrow$ `SKIP`  
- `SKIP` $\Longrightarrow$ `FREE`  

State updates based on detected light color:
- `LOCK`: red or orange  
- `SKIP`: green  
- `FREE`: light already passed  

The final control signal is computed by combining all velocity profiles and taking the minimum value at each distance point, ensuring compliance with all constraints.
