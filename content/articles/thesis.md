---
title: "Thesis: Shared navigation in a cybernetic multi-agent autonomous system"
date: 2024-03-28
year: 2024
doi: "https://theses.fr/2024COMP2802"
author_position: "1st"
tags: ["multi-agents systems", "autonomous car", "artifical intelligence", "shared navigation", "shared control", "machine learning", "deep learning", "autonomous vehicle", "connected vehicles", "cybernetics", "automatic control", "game theory", "distributed artificial intelligence", "decision making"]
---

## Abstract

My thesis is based on shared navigation between the autonomous system and the human. In our research, we focus on command fusion. In our approach, both entities, the human and the autonomous system, simultaneously control the vehicle, and a module acquires their commands and performs the command fusion. This approach involves studying the intentions of both the human and the autonomous system to ensure the most appropriate fusion of their choices and to evaluate the decision-making of each entity. The intention of the autonomous system is calculated using a visual servoing controller. The implementation of visual servoing relies on a deep learning network detecting lanes. For the human driver, who actively drives and cannot express their intention simultaneously, we use a deep learning-based model to predict their intention. The construction of this model required the creation of a driving dataset using our vehicles and the development of a recurrent model that integrates data of various types. Each of these intentions is then evaluated according to specific criteria, including safety, comfort, and context, to guide the fusion process towards the selection of the highest quality intention. This quantification is based on a state analysis derived from the realization of these intentions. We then use game theory to facilitate the fusion process, where each entity, human and autonomous system, aims to steer the final command towards their choice.