---
title: "Driving Intention Quantification Formula"
date: 2023-12-10
tags: [planning_navigation, robotics_autonomy]
codelang: ["python"]
description: "Define a quantification formulation measuring the quality of driving intentions, used to compare and rank them."
image: /images/quantification-intentions/scaner_studio_situation.png
article: /articles/article_general-multi-criteria/
---

## Abstract

As part of a collaborative research effort on shared control between an autonomous driving system and a human driver, I contributed to work focused on evaluating the **quality** of driving intentions.  
A **driving intention** is defined as a short sequence of planned control actions (speed, steering) over a time horizon:

{{< equation >}}
I_t = \{(v,w)_{t+0\cdot\Delta t},(v,w)_{t+1\cdot\Delta t},...,(v,w)_{t+n\cdot\Delta t}\}
{{< /equation >}}

For example, an intention can be expressed as a sequence of linear and angular velocities applied to the vehicle.

The evaluation challenge is twofold:

- Determine whether an intention is **admissible** (safe, legal, feasible)  
- Evaluate its **quality** based on criteria such as comfort, safety margin, and compliance with road constraints  

The developed framework introduces a quantification method inspired by the Bellman principle, where a future-aware score is computed using **discounted weighted evaluations**.

The results were published at IEEE IV 2023, {{<cite GeneralHPousseur>}}

## Motivation

Driving intentions are often ambiguous. For the same situation, multiple trajectories may exist:

- One that crashes (inadmissible)  
- One that narrowly avoids an obstacle (admissible but low quality)  
- One that handles the scene smoothly (admissible and high quality)  

{{< figure src="/images/quantification-intentions/result_scenario.png" caption="Three driving intentions evaluated differently depending on safety, lateral acceleration, and compliance." width="500">}}

## Unified Evaluation Pipeline

Each driving intention is evaluated over time and across multiple criteria using a **unified scoring formulation** that distinguishes between:

- **Admissibility**: binary decision from hard constraints (guards)  
- **Quality**: scalar score using weighted and discounted evaluators  

## Quality Evaluation (Soft Criteria)

Quality represents the evaluation of intentions based on several criteria, such as comfort and security. Each criterion is defined by two functions: a metric that quantifies the situation and an analyzer that evaluates the result.

### Metric per Evaluator

For each soft evaluator $k$ and time step $t$, a **metric** is computed:

{{< equation >}}
m_k(t) = f_k(x_t, u_t, \text{context})
{{< /equation >}}

Where:  
- $x_t$: system state at time $t$ (e.g. position, velocity)  
- $u_t$: control command at time $t$ (e.g. acceleration, steering)  
- `context`: environment description (obstacles, road structure)  
- $f_k$: metric function for evaluator $k$ (e.g. lateral acceleration, speed violation)  

### Analyzer Function (Generic Form)

Each metric is transformed into a **normalized score** using a dedicated analyzer function:

{{< equation >}}
q_k(t) = \mathcal{A}_k(m_k(t)) \in [0, 1]
{{< /equation >}}

Where:  
- $\mathcal{A}_k$: a mapping that interprets the metric's value for comfort, safety, or feasibility.  

Example (sigmoid-shaped analyzer):

{{< equation >}}
\mathcal{A}_k(m) = \frac{1}{1 + e^{\text{ramp}_k \cdot (m - \text{shift}_k)}}
{{< /equation >}}

- `ramp_k`: controls the steepness of the score drop  
- `shift_k`: defines the acceptable threshold  

{{< figure src="/images/quantification-intentions/plot_acc_example_vert.png" caption="Example analyzer for lateral acceleration using sigmoid shape." width="500">}}

### Temporal Discounting

To give more weight to early decisions (e.g. avoid imminent risks), exponential discounting is applied:

{{< equation >}}
Q_k = \sum_{t=0}^T \gamma^t \cdot q_k(t)
{{< /equation >}}

Where:  
- $Q_k$: total discounted score for evaluator $k$  
- $q_k(t)$: score at time $t$ for evaluator $k$  
- $\gamma$: discount factor $(\gamma \in [0, 1])$  
- $T$: prediction horizon  

{{< figure src="/images/quantification-intentions/implement_discount_factor.png" caption="Bellman-style discount accumulation gives more importance to short-term outcomes." width="500">}}

## Aggregation of Soft Scores

After computing all evaluator scores $Q_k$, the final global score is:

{{< equation >}}
Q_{\text{final}} = \sum_{k=1}^K w_k \cdot Q_k
{{< /equation >}}

Where:  
- $w_k$: weight of importance for criterion $k$  
- $Q_k$: quality score for criterion $k$  

Only admissible intentions are compared using this fusion.

## Admissibility Evaluation (Hard Constraints)

Unlike soft evaluators, **admissibility** is a binary outcome: either the intention is valid or not. It is determined by a set of **guard functions**.

Each guard combines:  
- a metric function $m_j(t)$  
- a boolean test $\mathcal{G}_j$ over that metric  

Generic formulation for one guard:

{{< equation >}}
g_j(t) = \mathcal{G}_j(m_j(t)) \in \{0, 1\}
{{< /equation >}}

Final admissibility decision:

{{< equation >}}
\text{Admissible} = \prod_j \left( \bigwedge_{t=0}^{T} g_j(t) \right)
{{< /equation >}}

Meaning:  
- An intention is admissible **only if** all guards are satisfied at all time steps.  
- If any guard fails, the intention is immediately rejected.  

{{< figure src="/images/quantification-intentions/guards.png" caption="Guard system example: a collision detection guard invalidates the intention." width="450">}}

## Visualization of Evaluators

{{< figure src="/images/quantification-intentions/collision_front_avoid/plots/evaluators.png" caption="Evaluator visualization from a specific simulation test case (Set A): three criteria shown (collision, lateral acceleration, speed). Each row shows the metric, its analyzer output, the raw score, and final discounted score." width="850">}}

This example comes from a scenario where the vehicle narrowly avoids a front obstacle with aggressive lateral acceleration. It illustrates how each step of the evaluation pipeline contributes to the global quality score.

## Trajectory Comparison

The quantification framework can evaluate multiple driving intentions for the same scenario. The example below considers a situation where the vehicle must navigate around a static obstacle ahead.

### Environment Overview

{{< subfigure images="/images/quantification-intentions/collision_front_avoid/plots/states_env.png,/images/quantification-intentions/collision_front_hit/plots/states_env.png,/images/quantification-intentions/good/plots/states_env.png" captions="Set A: avoids with sharp maneuver, Set B: direct collision, Set C: safe and smooth path" >}}

- **Set A**: Executes a fast lateral deviation to avoid the obstacle, maintaining admissibility but causing strong accelerations.  
- **Set B**: Continues straight and collides with the obstacle; inadmissible.  
- **Set C**: Anticipates early, gently deviating from the obstacle with minimal dynamic effort.  

### Per-Evaluator Score Analysis

Each trajectory is scored across three soft evaluators:  
1. **Lateral acceleration** (comfort)  
2. **Speed compliance** (respect for speed limits)  
3. **Other contextual metrics** (excluding collision itself)  

{{< subfigure images="/images/quantification-intentions/collision_front_avoid/plots/scores.png,/images/quantification-intentions/collision_front_hit/plots/scores.png,/images/quantification-intentions/good/plots/scores.png" captions="Set A: evaluator scores, Set B: evaluator scores, Set C: evaluator scores" >}}

- **Set A**: Good obstacle clearance, but high lateral acceleration yields mixed scores.  
- **Set B**: High comfort and speed compliance metrics, but rejected due to collision guard failure.  
- **Set C**: High scores on all criteria, indicating smooth and legal behavior.  

### Final Aggregated Score

Per-evaluator scores are combined using weighted summation into a **final quality score**, applied only to **admissible trajectories**:

{{< subfigure images="/images/quantification-intentions/collision_front_avoid/plots/article_qualities.png,/images/quantification-intentions/collision_front_hit/plots/article_qualities.png,/images/quantification-intentions/good/plots/article_qualities.png" captions="Set A: final score, Set B: final score (not used), Set C: final score" >}}

- **Set A**: Moderate total score; admissible but dynamically aggressive.  
- **Set B**: Rejected due to collision guard violation.  
- **Set C**: Highest final score; safe, smooth, and legal trajectory.  

### Guard Evaluation

Each intention is checked against guard functions:

{{< subfigure images="/images/quantification-intentions/collision_front_avoid/plots/guards.png,/images/quantification-intentions/collision_front_hit/plots/guards.png,/images/quantification-intentions/good/plots/guards.png" captions="Set A: all guards passed, Set B: guard failed (collision), Set C: all guards passed" >}}

- **Set A** and **Set C**: All guards satisfied.  
- **Set B**: Collision guard failed; trajectory rejected.  

### Summary Table

{{< table-wrap >}}

| Set | Admissible | Lateral Accel Score | Speed Score | Final Score | Comments                           |
|-----|------------|---------------------|-------------|--------------|------------------------------------|
| A   | YES        | Low                 | Medium      | Medium       | Avoids obstacle but sharp turn     |
| B   | NO         | High                | High        | 0            | Smooth, but collision → rejected   |
| C   | YES        | High                | High        | High         | Smooth, safe, fully admissible     |

{{< /table-wrap >}}

## Conclusion

This quantification method provides a structured and scalable way to assess driving intentions:

- **Guard-based admissibility** ensures feasibility and safety  
- **Soft metric scoring** evaluates comfort and driving style  
- **Temporal discounting** values proactive behavior  
- **Fusion weighting** allows fine control over decision logic  

Applications include:  
- Shared autonomy decision fusion  
- Risk-sensitive motion planning  
- Real-time arbitration between competing strategies  

## References

{{< bibliography >}}
