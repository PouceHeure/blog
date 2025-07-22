---
title: "ROS2 - Dashboard Framework"
date: 2025-05-01
tags: ["ROS"]
---

## Motivation

Creation of a framework to quickly build dashboards from configuration files, specifically for use with **ROS 2**.

## Solution

The idea is to define a UI interface—similar to how it's done with Qt—but using a **YAML** configuration file. The system then generates only what’s needed to connect the dashboard with **ROS 2**: defining callbacks and specifying how to retrieve the data. This approach enables full customization of dashboards that plot real-time data, either on a solid background color or over a background image (if an image topic is provided).

Currently, the framework supports the following widgets:

- **Slider**
- **Label**
- **Map**
- **Circle**
- **Plot**

This solution can be used in two ways:

- **Online**: connected to a running **ROS 2 node**
- **Offline**: by reading from a **ROS 2 bag**, making it suitable for post-processing and analysis

It is also possible to generate a video of the dashboard—transparent or not—which can then be integrated into other video content.


{{< figure src="/images/dashboard/dashboard_2.png" caption="Dashboard example" width="500">}}

{{< figure src="/images/dashboard/dashboard_3.png" caption="Dashboard example" width="500">}}

{{< figure src="/images/dashboard/dashboard_4.png" caption="Dashboard example" width="500">}}