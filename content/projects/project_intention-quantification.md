---
title: "Driving Intention Quantification Formula"
date: 2022-12-10
tags: ["quantification", "autosys"]
description: "Define a quantification formulation mesuring the quality of the driving intention, exploiting to order intensions between them"
image: /images/quantification-intentions/scaner_studio_situation.png
---

In the context of intention fusion between an autonomous system and a human driver, it is essential to assess whether an intention is feasible and to establish a metric that reflects its quality. This metric must therefore incorporate both feasibility and quality aspects. Additionally, the formulation accounts for various criteria such as safety, comfort, and context.

In our research, we define driving intention as a sequence of control commands over a short time horizon. Our evaluation method is inspired by Bellman equations, enabling the assessment of an action while considering the impact of future actions that follow from it.

This approach was tested in simulation (allowing for the evaluation of risky driving scenarios).

The results of this work were published at the IEEE Intelligent Vehicles Symposium (IV) 2023 in the USA.