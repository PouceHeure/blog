---
title: "Human Legs Detection From Scan 2D"
date: 2020-12-10
tags: ["deep-learning","AI","lidar","ROS"]
---

Github Repo: [https://github.com/PouceHeure/ros_detection_legs](https://github.com/PouceHeure/ros_detection_legs)

Réalisation d'un projet personnel, dont le but est de réaliser un modèle capable de détecter des jambes en exploitant un LiDAR mono couche.

Les réseaux récurrents sont généralement utilisés sur des données ordonnées temporellement. Dans ce projet, j'ai voulu exploiter un RNN sur des données où la séquence est ordonnée selon une position spatiale.
L'idée est de soumettre au réseau les données du scan dans le même ordre et d'exploiter ce positionnement dans le réseau.

Dans ce projet, j'ai développé toute la chaine:

- acquisition des données;
- création d'un outil pour labéliser;
- labélisation des données;
- création du modèle;
- training du modèle;
- création de l'outil pour visualiser le rendu;

L'intégration du modèle a été fait avec ROS, permettant de récuperer les données capteurs. Cette intégration permetterait par la suite, d'exploiter cette information dans une application robotique.

{{< youtube code="KcfxU6_UrOo" width="500" caption="video demo">}}

