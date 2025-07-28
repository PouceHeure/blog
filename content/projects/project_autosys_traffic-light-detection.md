---
title: "Traffic Light Detection & Control"
date: 2025-05-01
tags: ["detection", "camera", "image-processing", "YOLO", "control", "ROS2"]
pinned: true
description: Detection of traffic light, and adapt the control of the vehicle depends of the light state. 
image: "/images/traffic_light/detection_traffic_light__green_new.png"
---

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

We used **YOLO** for detection. By default, YOLO is not trained to recognize traffic light states—it can detect the presence of a light but not its color or status. To address this, we trained a YOLO model using a custom dataset built specifically for this application.

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

This labeling strategy allows the model to distinguish between the top and bottom lights as well as their colors.

The following figure show the dataset distribution. We tried to get for anyone a minimal value. The light duration of the color explain the current distribution, where the light red it's more present than the light green and orange.
The position impacts this distribution, because far of the traffic light, the lisibility of the bottom light is hard or not possible, because the view is hidden by tree.
{{< figure src="/images/traffic_light/model/labels_light.png" caption="Labels Distributions" width="500">}}

#### Training

The YOLO model has been trained on the dataset created previously. The following figure shows a batch of the training. 

{{< figure src="/images/traffic_light/model/train_batch18621.jpg" caption="Example Batch" width="500">}}

As we can see, the quality, constrast are different, in reason of the camera source different, and the yolo configuration of the training, allowing to create more data on original one, in putting some different transformation, traanslation, and color. 

After $500$ epochs, the following figure shows the results of the training:

{{< figure src="/images/traffic_light/model/results.png" caption="Results" width="500">}}


- Precision
{{< equation >}}
\text{Precision} = \frac{TP}{TP + FP}
{{< /equation >}}

Precision measures the proportion of predicted positive detections that are actually correct.  
**Value:** ≈ 0.99 — This indicates very few false positives.

---

- Recall
{{< equation >}}
\text{Recall} = \frac{TP}{TP + FN}
{{< /equation >}}

Recall measures how many of the actual objects were successfully detected.  
**Value:** ≈ 0.97 — Meaning the model misses very few objects.

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
**Value:** ≈ 0.98 — Indicates high detection accuracy at moderate overlap.

---

- mAP@0.5:0.95 (COCO-style mAP)
{{< equation >}}
\text{mAP}_{[0.5:0.95]} = \frac{1}{10} \sum_{i=0}^{9} AP_{0.5 + 0.05i}
{{< /equation >}}

Average precision over 10 IoU thresholds from 0.5 to 0.95.  
**Value:** ≈ 0.83 — A more rigorous and reliable performance metric.

---

- F1-score (optional)
{{< equation >}}
F1 = 2 \cdot \frac{\text{Precision} \cdot \text{Recall}}{\text{Precision} + \text{Recall}}
{{< /equation >}}

Harmonic mean of precision and recall, useful for balancing both aspects.  
**Estimated value:** ≈ 0.98 — Strong overall detection quality.



{{< figure src="/images/traffic_light/model/confusion_matrix_normalized.png" caption="Results" width="500">}}

| Class             | Accuracy | Notes                                                                 |
|------------------|----------|-----------------------------------------------------------------------|
| TL_TOP_GREEN      | ≈ 0.98   | Excellent detection. Minor confusion with background and BOTTOM_GREEN |
| TL_TOP_RED        | ≈ 0.99   | Nearly perfect detection                                              |
| TL_BOTTOM_RED     | ≈ 0.90   | Confused with background                                              |
| TL_BOTTOM_GREEN   | ≈ 0.97   | Confused with TL_BOTTOM_ORANGE                                       |
| TL_TOP_ORANGE     | ≈ 0.98   | Minor confusion with BOTTOM_ORANGE and background                     |
| TL_BOTTOM_ORANGE  | ≈ 0.96   | Confused with TL_BOTTOM_GREEN                                        |



#### Test

Following figure show an example of the detection perform on real data during a test.
On different traffic lights. For the moment, the project onyl focuse on top light because bottom are not visiable all time.

{{< subfigure images="/images/traffic_light/detection_traffic_light__green_new.png,/images/traffic_light/detection_traffic_light__orange_new.png,/images/traffic_light/detection_traffic_light__red_new.png" captions="Detections from the model." >}}


### State Definition

Le système expoite la carte pour définir sur son trajet, les feux de la route. Un noeud avec la détection permet de renseigner les informations sur la détection d'un feu, en y indiquant l'état du feu. 

Ce noeud inclue un paramètre timeout, permettant de conserver l'état précedent dans un cas où une detection n'est pas faite, de cette manière le système permet d'éviter tout comportement désagréable, où le système freine. 

Car en effet, dans un cas où le système de ne détecte pas d'état, le système considére le feu comme rouge.

Pour éviter de saturé le système en calcul, et n'étant pas une priorité sécuritère, le système tourne à 10Hz. Permettant une détection à une fréquence convenable. 
(TODO: Peut-être ajouter un truc en mode un humain le temps de réaction est de 200ms.)

Le système exploite un réseau léger, capable de tourner facilement à 30Hz, la caméra utilisée a une fréquence de 30Hz inutile de tourner le modèle plus rapidement, car il est déterministe, et dépend de l'tétat actuellement seulement.

## Control Adaptive

Une fois l'état définie, il est ainsi possible d'y adapter le profile de vitesse du véhicle. 

Pour chaque élément de la route, et donc ici le feu de la route, une machine a état est associée, permettant de définir le comportement du véhicle au dépend de cette élément. Un profile de vitesse définie en distance/speed est définie en fonction de chaque état.

Pour une feu de la route, la machine a état est définie de la manière suivante: 
- `LOCK`: l'élément est pris en compte, et le véhicle va s'arrêté à une distance du feu
- `SKIP`: l'élement n'est plus pris en compte, le véhicle ne s'arrête pas au feu
- `FREE`: l'élement a été dépassé, inutile de le considérer

Transitions: 
- `LOCK` <-> `SKIP`
- `SKIP` -> `FREE`

En fonction de l'état du feu transmise, nous pouvons alors adapté l'état du feu.
- `LOCK`: feu rouge, feu orange
- `SKIP`: feu vert
- `FREE`: véhicle dépasse l'élément

Le signal final est ajouté à l'ensemble des signaux, en prenant la borne minimale le long de ces profiles.

## Results 

Mettre video