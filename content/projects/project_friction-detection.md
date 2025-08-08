---
title: "Friction Camera Detection"
date: 2022-11-10
tags: [sensing_perception]
codelang: ["python"]
description: Road friction estimation based on surface segmentation using a camera and projection into a global grid.
image: /images/road-friction/thumbnail.png
article: /articles/article_camera-based-control/
---

## Mission Context

As part of a European research project, I conducted a two-month research mission at the University of Tokyo to investigate road surface friction estimation using only a forward-facing camera.

This led to the publication of a paper, {{< cite ProposalUTakumi >}}, at IEEE AIM 2023, in collaboration with the University of Tokyo and UTC. The system uses image segmentation, confidence modeling, geometric projection, and accumulation into a global surface grid map.

{{< youtube code="mbmAByTlTSU" width="800" caption="Video demo, road friction estimation." >}}

The experiment was conducted in partnership with the Fujimoto Lab (University of Tokyo) as part of the OWheel collaboration. The lab focuses on autonomous vehicles and control systems, particularly for electric vehicles and in-wheel motor platforms.

{{< figure src="/images/road-friction/fujimoto_laboratory.jpg" caption="Laboratories of the University of Tokyo, Kashiwa campus." width="500">}}

The mission goal was to detect road surface types in real time from a front-facing camera and provide this information to a traction controller.


## Image Processing Pipeline

### Steps

1. ROI selection  
2. Color distance computation  
3. Binary thresholding  
4. Image downsampling  
5. Confidence mask application

{{< figure src="/images/road-friction/ip_process.png" caption="Five-step processing pipeline from RGB image to pixel-level friction prediction." width="700">}}

The image classifier generates:

- **ROAD** (normal traction)
- **SLIPPERY** (blue polymer)
- **UNKNOWN**

{{< figure src="/images/road-friction/image_processing_results.png" caption="Left: original image. Middle: binary mask. Right: confidence-weighted prediction." width="700">}}


## Projection and Grid Map Generation

### Camera to World Projection

Each pixel $(u, v)$ is projected to 3D using:

{{< equation >}}
x_c = \frac{(u - c_x)}{f_x} \cdot z(v)
{{< /equation >}}

{{< equation >}}
y_c = \frac{(v - c_y)}{f_y} \cdot z(v)
{{< /equation >}}

where $z(v)$ is the estimated distance from camera to ground, computed via linear regression.

The pose is corrected using **GPS + IMU + Kalman filter**. This allows transforming image pixels into world coordinates and inserting them into a 2D grid.

{{< figure src="/images/road-friction/image_projection.png" caption="Pipeline: projecting detection to grid map using calibrated camera + GPS pose." width="700">}}


### Accumulation and Trust Masking

To ensure stability, each grid cell is updated across multiple frames. Distant pixels receive lower confidence due to both projection error and poor color reliability.

{{< figure src="/images/road-friction/data_binary_trust_mask.png" caption="Trust mask improves reliability in central image zones." width="700">}}


## Grid Output and Road Profile

The grid map accumulates surface class over time. Two buffers are maintained:

- $B_{ij}$: slippery class (blue-sheet)
- $R_{ij}$: normal road class

Each projected detection updates the relevant grid:

{{< equation >}}
\begin{cases}
B_{ij} \leftarrow B_{ij} + \hat{p}_{uv}, & \text{if } \hat{p}_{uv} > 0 \\
R_{ij} \leftarrow R_{ij} + \hat{p}_{uv}, & \text{if } \hat{p}_{uv} < 0
\end{cases}
{{< /equation >}}

Final grid value:

{{< equation >}}
G_{ij} = 
\begin{cases}
\frac{B_{ij} + R_{ij}}{|B_{ij}| + |R_{ij}|}, & \text{if } |B_{ij}| + |R_{ij}| \neq 0 \\
0, & \text{else}
\end{cases}
{{< /equation >}}

This grid is transformed into **friction profiles** for left and right wheels.

{{< figure src="/images/road-friction/output_road_friction_detection.png" caption="Example of final friction profile used by controller." width="700">}}


## Runtime Optimization

Image resolution reduction was critical. Projection runtime dropped by over $10\times$ by resizing images before processing.

{{< figure src="/images/road-friction/data_plot_with_reduction.png" caption="With downsampling: efficient per-frame processing time." width="500">}}


## Experimental Setup

- EV testbed with onboard RGB camera and GPS
- Blue polymer used to simulate slippery surfaces
- Kalman filtering improved GPS position
- Real-time fusion of camera and pose data

{{< figure src="/images/road-friction/tool_recorder.png" caption="Custom tool for GPS + Camera synchronized dataset creation." width="600">}}

{{< figure src="/images/road-friction/data_gps_issue_efk.png" caption="Left: raw GPS. Right: with Kalman filtering." width="700">}}


## Evaluation

### Case 1: Double Bluesheet Lane

{{< figure src="/images/road-friction/profiles/double/image_scenario_selected.png" caption="Vehicle on symmetrical slippery zones." width="400">}}

{{< figure src="/images/road-friction/profiles/double/plot_road_profiles.png" caption="Profile generated from friction grid." width="600">}}

{{< figure src="/images/road-friction/profiles/double/plot_road_profiles_errors.png" caption="Distance error between predicted and true profile." width="600">}}


### Case 2: Asymmetric Surface

{{< figure src="/images/road-friction/profiles/mixed/image_scenario_selected.png" caption="Vehicle with offset slippery zone." width="400">}}

{{< figure src="/images/road-friction/profiles/mixed/plot_road_profiles.png" caption="Estimated friction profile (asymmetric)." width="600">}}

{{< figure src="/images/road-friction/profiles/mixed/plot_road_profiles_errors.png" caption="Prediction error across path length." width="600">}}


## Slip Ratio Results

The slip ratio is defined as:

{{< equation >}}
s = \frac{Rw - u}{Rw}
{{< /equation >}}

Where:
- $Rw$ is wheel speed
- $u$ is vehicle forward velocity

The use of visual-based friction prediction reduced slip ratio **by 50%**, compared to wheel-only estimation.

{{< figure src="/images/road-friction/slip_results.png" caption="Slip ratio: visual-based control (red) vs. wheel-sensor-only (blue)." width="700">}}


## Conclusion

- Camera-only system provides accurate road surface detection
- Friction grid enables reliable prediction
- Real-time compatibility demonstrated
- Controller benefits: reduced slip and better adaptation

This approach validates vision as a viable modality for low-cost, efficient, and anticipatory traction control.

## References

{{< bibliography >}}
