---
title: "Traffic Light Detection & Control"
date: 2025-05-01
tags: ["detection", "camera", "image-processing", "YOLO", "control", "ROS2"]
pinned: true
description: Detection of traffic light, and adapt the control of the vehicle depends of the light state. 
image: "/images/traffic_light/detection_traffic_light__green_new.png"
---

{{< youtube code="TODO" width="500" caption="Demo video coming soon" >}}

## Motivation

Adapting a vehicle's behavior to traffic lights is a key feature in autonomous driving. The vehicle must be able to adjust its speed based on the current state of the traffic light.

This project is divided into four main components:

- **Matching**: Identifying traffic light positions on the map.
- **Detection**: Determining the current state of the traffic light.
- **Planning**: Adjusting the vehicle's speed according to the detection result.
- **Control**: Applying the computed velocity to the vehicle.

This project has been developped in python for the detection, and in cpp for the control, inside of ROS2 enviroennement.

---

## Matching

Based on the vehicle's planned trajectory, we can project the map’s elements:such as traffic lights onto the path. This step doesn’t determine the state of the lights but serves to notify the system that a traffic light zone is ahead.

---

## Detection

Within a traffic light zone, the system must identify the current state of the light.

We used **YOLO** for detection. By default, YOLO is not trained to recognize traffic light states, it can detect the presence of a light but not its color or status. To address this, we trained a YOLO model using a custom dataset built specifically for this application.

### Dataset

#### Cameras

Several data recording sessions were conducted using multiple cameras (3 different) to ensure data diversity, with weather condition differents (raining and sun).

This also allowed for evaluating the best-suited camera for detection. Key constraints included:

- **Field of view**
- **Image contrast**, even under direct sunlight
- **Ease of camera mounting and adjustment**

#### Labels

The dataset was annotated using the following labels:

- `TL_TOP_RED`: 0
- `TL_BOTTOM_RED`: 1
- `TL_TOP_GREEN`: 2
- `TL_BOTTOM_GREEN`: 3
- `TL_TOP_ORANGE`: 4
- `TL_BOTTOM_ORANGE`: 5

This labeling strategy allows the model to distinguish both the position (top or bottom) and the color of the traffic lights.

The following figure shows the dataset distribution. We aimed to ensure a minimum number of samples for each class. The duration of each light color explains the current imbalance, indeed the red lights appear more frequently than green or orange.

Additionally, the position of the camera affects the distribution. From a distance, the bottom lights are often difficult or impossible to see, especially when their view is obstructed by trees.

{{< figure src="/images/traffic_light/model/labels_light.png" caption="Labels Distributions" width="300">}}


### Training

The YOLO model has been trained on the dataset created previously. The following figure shows a batch of the training. 

{{< figure src="/images/traffic_light/model/train_batch18621.jpg" caption="Example Batch" width="500">}}

As we can see, the quality, constrast are different, in reason of the camera source different, and the yolo configuration of the training, allowing to create more data on original one, in putting some different transformation, traanslation, and color. 

After $500$ epochs, the following figure shows the results of the training:

{{< figure src="/images/traffic_light/model/results.png" caption="Results" width="800">}}


- Precision
{{< equation >}}
\text{Precision} = \frac{TP}{TP + FP}
{{< /equation >}}

Precision measures the proportion of predicted positive detections that are actually correct.  
**Value:** ≈ 0.99 : This indicates very few false positives.

---

- Recall
{{< equation >}}
\text{Recall} = \frac{TP}{TP + FN}
{{< /equation >}}

Recall measures how many of the actual objects were successfully detected.  
**Value:** ≈ 0.97 : Meaning the model misses very few objects.

---

- IoU (Intersection over Union)
{{< equation >}}
\text{IoU} = \frac{\text{Area of Overlap}}{\text{Area of Union}}
{{< /equation >}}

This measures how well a predicted bounding box overlaps with the ground truth box.  
**Threshold:** Typically ≥ 0.5 to count a detection as correct.

---

- mAP@0.5 (mean Average Precision at IoU = 0.5)
{{< equation >}}
\text{mAP@0.5} = \text{mean}(AP_{\text{IoU}=0.5})
{{< /equation >}}

Average precision calculated across all classes at a fixed IoU of 0.5.  
**Value:** ≈ 0.98 : Indicates high detection accuracy at moderate overlap.

---

- mAP@0.5:0.95 (COCO-style mAP)
{{< equation >}}
\text{mAP}_{[0.5:0.95]} = \frac{1}{10} \sum_{i=0}^{9} AP_{0.5 + 0.05i}
{{< /equation >}}

Average precision over 10 IoU thresholds from 0.5 to 0.95.  
**Value:** ≈ 0.83 : A more rigorous and reliable performance metric.

---

- F1-score (optional)
{{< equation >}}
F1 = 2 \cdot \frac{\text{Precision} \cdot \text{Recall}}{\text{Precision} + \text{Recall}}
{{< /equation >}}

Harmonic mean of precision and recall, useful for balancing both aspects.  
**Estimated value:** ≈ 0.98 : Strong overall detection quality.


{{< figure src="/images/traffic_light/model/confusion_matrix_normalized.png" caption="Results" width="600">}}

| Class             | Accuracy | Notes                                                                 |
|------------------|----------|-----------------------------------------------------------------------|
| TL_TOP_GREEN      | ≈ 0.98   | Excellent detection. Minor confusion with background and BOTTOM_GREEN |
| TL_TOP_RED        | ≈ 0.99   | Nearly perfect detection                                              |
| TL_BOTTOM_RED     | ≈ 0.90   | Confused with background                                              |
| TL_BOTTOM_GREEN   | ≈ 0.97   | Confused with TL_BOTTOM_ORANGE                                       |
| TL_TOP_ORANGE     | ≈ 0.98   | Minor confusion with BOTTOM_ORANGE and background                     |
| TL_BOTTOM_ORANGE  | ≈ 0.96   | Confused with TL_BOTTOM_GREEN                                        |



### Tests Examples

Following figure show an example of the detection perform on real data during a test.
On different traffic lights. For the moment, the project onyl focuse on top light because bottom are not visiable all time.

{{< subfigure images="/images/traffic_light/detection_traffic_light__green_new.png,/images/traffic_light/detection_traffic_light__orange_new.png,/images/traffic_light/detection_traffic_light__red_new.png" captions="Green top detection., Orange top detection., Red top detection." >}}

The traffic light draws on the image, it's the current representation of the traffic light by the system.

### State Definition

The system uses the map to identify traffic lights along the planned route. A dedicated detection node publishes information about a detected traffic light, including its current state.

This node includes a **timeout** parameter to retain the previous state when no new detection is made. This prevents undesirable behavior such as sudden braking. In fact, if the system fails to detect a state, it assumes the light is red by default.

To avoid overloading the system with computations, and since this is not a safety-critical task, the detection node runs at **10 Hz**, which offers a reasonable update frequency.  
(Note: For comparison, average human reaction time to visual stimuli is around 180–250 ms.)

The detection model is lightweight and can run easily at **30 Hz**. Since the camera also operates at 30 Hz and the model is deterministic (relying only on the current image), running it faster would offer no benefit.

---

## Adaptive Control

Once the state of the traffic light is determined, the vehicle's speed profile can be adjusted accordingly.

Each element of the road (in this case, each traffic light) is associated with a **finite state machine** to define how the vehicle should behave. A speed profile (distance vs. velocity) is set for each state.

The state machine for a traffic light is defined as follows:

- `LOCK`: The element is considered active. The vehicle will stop at a defined distance before the light.
- `SKIP`: The element is ignored. The vehicle will not stop at the light.
- `FREE`: The element has been passed. It is no longer relevant.

**Transitions:**
- `LOCK` <-> `SKIP`
- `SKIP` → `FREE`

Based on the detected state of the light, the system updates the element's state:

- `LOCK`: when the light is red or orange
- `SKIP`: when the light is green
- `FREE`: when the vehicle has already passed the traffic light

The final control signal is derived by combining all the velocity profiles, taking the minimum value at each distance point to ensure compliance with all constraints.


## Results 

Mettre video


## Conclusion

Le modèle a été essayé dans des conditions différentes, pluies et soleil (même plein jour), le système en générale montre une 