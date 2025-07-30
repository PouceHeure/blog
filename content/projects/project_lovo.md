---
title: "Lovo Bicycle Locker Connected"
date: 2017-08-07
tags: ["arduino", "android", "sigfox"]
description: Bicycle theft detector.
image: "/images/lovo/thumbnail.png"
---

## Presentation

Bicycle theft detector using the Sigfox network. This device was developed using an Arduino board, combined with an inertial measurement unit. In case of abnormal behavior, i.e. acceleration exceeding a defined threshold, the system sends a request over the LoRaWAN network, then, using the Firebase API, a notification is sent to the user.

{{< youtube code="npHM27lVe48" width="500" caption="Video demo" >}}

## Module

### Hardware

The module is composed of an Arduino MKR FOX 1200 board, allowing use of the Sigfox network. 
Coupled with it is an IMU board, which provides the module's acceleration data.
LEDs are added to provide status feedback for easier understanding and debugging.

{{< figure src="/images/lovo/thumbnail.png" caption="Hardware device." width="400">}}

### Android Application

This application was developed in Java using the Android Studio IDE. It allows users to add modules and analyze frames sent over the Sigfox network. It also enables, via the Firebase API, the reception of notifications.

{{< subfigure images="/images/lovo/app_add.png,/images/lovo/app_trames.png" captions="Screenshot app add page,Screenshot request log page" >}}

## System Workflow

1. Based on testing, a threshold value was defined to identify suspicious acceleration. Once this threshold is exceeded, the system classifies the situation as a theft. 
2. A frame is then sent via the Sigfox network. An internal Sigfox gateway propagates this frame to the internet, which then makes a request to the Firebase API to send a notification to the mobile app. 
3. The user is then notified that the bicycle has been stolen.