---
title: "Lovo Anti-theft Bicycle Connected"
date: 2017-08-07
tags: [core_technologies]
codelang: ["cpp","java"]
description: "Connected anti-theft bicycle system using Arduino, IMU, Sigfox, and Firebase to detect motion and notify users."
image: "/images/lovo/thumbnail.png"
---

## Overview

This project is a bicycle theft detection system based on the Sigfox network. It uses an Arduino board combined with an inertial measurement unit (IMU). When abnormal motion is detected, such as acceleration above a set threshold, the device sends data via Sigfox. The information is then forwarded to Firebase, which triggers a notification to the user’s mobile application.

{{< youtube code="npHM27lVe48" width="800" caption="Video demo: the system sends a notification when motion is detected." label="demo-lovo">}}

## Hardware

The device is built around an Arduino MKR FOX 1200, enabling Sigfox communication. An IMU board measures acceleration. LEDs are included to indicate status and assist during testing.

{{< figure src="/images/lovo/thumbnail.png" caption="Hardware device." width="400">}}

## Android Application

Developed in Java with Android Studio, the app allows users to register devices, view data received through Sigfox, and receive alerts via Firebase.

{{< subfigure images="/images/lovo/app_add.png,/images/lovo/app_trames.png" captions="App module registration page,App request log page" >}}

## System Workflow

1. The IMU continuously monitors acceleration. If it exceeds a predefined threshold, the event is classified as a theft attempt.  
2. A Sigfox frame is sent to the network. The Sigfox backend forwards the data to Firebase.  
3. Firebase pushes a notification to the Android app, alerting the user.  

The {{< videoref label="demo-lovo" >}} demonstrates this process in action.
