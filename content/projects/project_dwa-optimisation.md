---
title: "Optimization of the Dynamic Window Approach (DWA)"
date: 2021-12-10
tags: ["planing","optimisation","ROS"]
---

## Context

As part of my PhD work, I implemented a strategy known as the Dynamic Window Approach (DWA), which allows a robot to reach a target while avoiding obstacles. This is a purely reactive system. The method explores a set of admissible velocities over a short time horizon and evaluates each candidate using an objective function. However, this approach can be computationally expensive due to the need to evaluate every possible candidate.

## Approach 

To address this, I developed a new approach that leverages the convexity of the objective functions, applying gradient descent to converge more quickly and accurately toward the optimal solution. This method not only speeds up convergence but also increases precision by avoiding the discretization required in the traditional DWA.

## Result

This work was published at the IEEJ SAMCOM 2022 conference (Japan), {{< cite GradientHPousseur >}}.

{{< figure src="/images/dwa-optimization/scenario_example.png" caption="Visual Servoing features on real application." width="500">}}


## References
{{< bibliography >}}