---
title: "Human Driving Prediction"
date: 2022-12-10
tags: ["AI", "machine-learning", "robotic", "camera-vision","ROS","RNN","CNN","deep-learning"]
---

## Abstract

Dans le cadre de mes recherches, j'ai travaillé sur la prédiction de la conduite humaine. Cette prédiction est réalisée à l'aide d'un modèle de deep-learning. 
La particularité de ce modèle est qu'il est capable de recevoir différents types d'entrées: image, scalaires,... le tout dans un réseau récurrent.

Dans un premier temps, il a fallu réaliser un enregistrement de données réelles, en utilisant les voitures que disposent le laboratoire.
Dans un second temps, j'ai développé un framework basé sur Tensorflow, permettant facilement de créer des réseaux de neurones avec des types d'entrées différents.
Au final le réseau a été entrainé en respectant bien une bonne distribution dans les datasets d'entrainements et de tests.
De plus j'ai souhaité exploité la topologie de réseaux (multi entrées) afin d'évaluer l'inférence faite par le modèle en limitant certaines entrées.

Dans ce projet j'ai du réaliser:
- analyse des données exploitables avec les voitures;
- définition des roadmaps et enregistrements des données;
- extraction de données et mise en forme pour l'apprentissage;
- création d'un modèle multi-entrées avec création d'un framework pour faciliter son implémentation;
- entrainement du modèle sur cluster GPU;
- validation du modèle exploité;
- publication des résultats à la conférence IEEE ITSC 2022 (chine);

➡️ **[Voir Publication](/articles/human-driving-prediction/)**  