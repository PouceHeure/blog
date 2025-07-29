---
title: "Friction Camera Detection"
date: 2022-11-10
tags: ["image-processing", "camera", "autonomous-driving", "friction-estimation"]
description: Road friction estimation based on surface segmentation using a camera and projection into a global grid.
image: /images/road-friction/thumbnail.png
---

{{< youtube code="mbmAByTlTSU" width="500" caption="Video demo" >}}

As part of a European research project, I conducted a two-month research mission at the University of Tokyo to investigate road surface friction estimation using only a forward-facing camera.

This led to the publication of paper, {{< cite ProposalUTakumi >}}, at IEEE AIM 2023 conference, in collaboration with the University of Tokyo and UTC. The system uses image segmentation, confidence modeling, geometric projection, and accumulation into a global surface grid map.

## Image Processing Pipeline

### Goal

The system performs lightweight, camera-based classification of road surfaces to support downstream control and traction management.

### Steps

The algorithm consists of five main operations:

1. ROI selection  
2. Color distance computation  
3. Threshold filtering  
4. Image downsampling  
5. Confidence mask application

{{< figure src="/images/road-friction/ip_process.png" caption="The five-stage pipeline used to process RGB images: from region-of-interest selection to a confidence-weighted binary classification." width="600">}}

### Prediction Output

The output is a pixel-wise classification with confidence scores:

- **ROAD**
- **BLUE (slippery)**
- **UNKNOWN**

{{< figure src="/images/road-friction/image_processing_results.png" caption="Left: raw RGB image. Middle: binary mask showing predicted slippery surfaces. Right: final output with pixel-level confidence." width="700">}}

## Projection to World Coordinates

### Camera to 3D Conversion

Each pixel $(u, v)$ is converted to 3D camera coordinates using intrinsic calibration:

{{< equation >}}
x_c = \frac{(u - c_x)}{f_x} \cdot z(v)
{{< /equation >}}

{{< equation >}}
y_c = \frac{(v - c_y)}{f_y} \cdot z(v)
{{< /equation >}}

Where:
- $z(v)$ is calibrated depth for pixel row $v$
- $(f_x, f_y)$ are focal lengths
- $(c_x, c_y)$ is the optical center

### Camera to World Frame

By applying the vehicle’s pose (from GPS + Kalman filter), each pixel is reprojected into world coordinates and then assigned to a 2D global grid cell.

## Friction Grid Construction

### Multi-layer Update

Two layers are maintained:

- $B_{ij}$ for blue-sheet (slippery) surfaces  
- $R_{ij}$ for normal road surfaces

Each projected pixel updates its corresponding cell:

{{< equation >}}
\begin{cases}
B_{ij} \leftarrow B_{ij} + \hat{p}_{uv}, & \text{if } \hat{p}_{uv} > 0 \\
R_{ij} \leftarrow R_{ij} + \hat{p}_{uv}, & \text{if } \hat{p}_{uv} < 0
\end{cases}
{{< /equation >}}

### Final Grid

The final surface grid value is:

{{< equation >}}
G_{ij} = 
\begin{cases}
\frac{B_{ij} + R_{ij}}{|B_{ij}| + |R_{ij}|}, & \text{if } |B_{ij}| + |R_{ij}| \neq 0 \\
0, & \text{else}
\end{cases}
{{< /equation >}}

Where $G_{ij} \in [-1, 1]$ represents the surface type (−1 = road, +1 = slippery surface).

{{< figure src="/images/road-friction/grid_friction_motivation.png" caption="Illustration of the global friction grid: detections from image space are reprojected and aggregated in world coordinates." width="600">}}

## Applications

### Control Integration

This grid is used to adapt the **slip ratio limiter** and **torque constraints** in a driving force controller (CDFC), improving safety and energy usage.

{{< figure src="/images/road-friction/ip_flow_chart_bg.png" caption="Control integration flow: camera-based surface predictions directly influence controller parameters such as slip ratio limiters." width="600">}}

### Outlook

The current method is based on simple color thresholds but can be extended to more robust vision systems using CNNs or multi-class detection.

{{< figure src="/images/road-friction/ip_perspectives.png" caption="Conceptual comparison of current rule-based detection with future potential using machine learning or deep feature extraction." width="600">}}

## Experimental Setup

The system was deployed on a custom-built **in-wheel motor EV** at the University of Tokyo.

- Low-friction zones simulated with blue polymer
- Vehicle pose estimated with GPS and IMU
- Results fed to control layer in real-time

<!-- ## Conclusion

This image-based segmentation pipeline allows friction estimation using only a monocular RGB camera. When integrated into an autonomous controller, it enables real-time traction adaptation and significant energy savings during low-friction events. -->

## References

{{< bibliography >}}