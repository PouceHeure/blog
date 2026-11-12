---
title: "Treno Data & Model"
date: 2026-10-01
tags: [ai_ml]
codelang: ["python","node"]
description: "Data collection, statistic analysis and behavior modelisation."
image: "images/treno_data_model/thumbnail.png"
# pinned: true
aliases: ["/projects/treno_data_model/"]
# draft: true
---

## Motivation

Sometimes in Italy it's possible to have station without any screen, any information about train in coming. Except the speaker. After to take 2 times the wrong train, I decided to develop my tools to track train and since this day I never used the wrong train.

Mon but chnager une data macro en data micro, essayer de reduire une incertiture tres importante initiale combler par un modele, predisant au mieux alors la position des train le loin de la voie.

## Step one: I need data

After trying different approaches, the best solution looks to use the viaggi treno API http://www.viaggiatreno.it/infomobilita/index.jsp (useful doc http://www.viaggiatreno.it/infomobilita/rest-jsapi).



## Step two: Think like a train

Difficulty: the data information is sequential with delay. And representative of the current instant. A train can have 10 minutes of delay, but he can reach the dealy over the travel.

The model should at the end light, to use on simple vps, without 64go ram. The model should not inlcude for now complexity relqtion between data. The motivation create the best simple model.

## Step tree: Get access everywhere