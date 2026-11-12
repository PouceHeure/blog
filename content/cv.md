---
title: "About"
date: 2024-01-15
layout: "cv"
url: "/cv"

name: "Hugo POUSSEUR"
role: "PhD in Robotics · Software Robotic Developer (IIT)"
tagline: "Robotics engineer, from low-level integration to autonomous navigation."
photo: "/images/about/hugo.png"
initials: "HP"
chips: ["Planning", "Perception", "Control", "ROS2", "Multi-agent systems"]

stats:
  - { value: "7+", label: "years in robotics, from research to industry" }
  - { value: "8", label: "IEEE conference papers" }
  - { value: "1st", label: "in class during years 1 and 2 of the engineering cycle" }
  - { value: "3", label: "countries: France, Japan, Italy" }

timeline:
  - years: "2026"
    title: "Senior Software Robotic Engineer (IIT)"
    type: work
    org: "Istituto Italiano di Tecnologia"
    country: "🇮🇹 Italy"
    kind: current
    bullets:
      - Low-level integration (EtherCAT, real-time systems) and testing on robotic platforms.
      - Motor driver configuration (firmware and parameters) and control-loop tuning.
      - Middleware development (DDS/ROS2), exposing EtherCAT sensors and actuators to higher-level control modules.
  - { years: "2025", title: "French National Qualification to Apply for Associate Professor", type: academic, org: "CNU – Section 27", country: "🇫🇷 France" }
  - years: "2024–2025"
    title: "Research Engineer (CNRS)"
    type: work
    org: "Heudiasyc Laboratory"
    country: "🇫🇷 France"
    bullets:
      - "Designed and implemented a full autonomous driving stack (navigation & control) on a real car using ROS2/C++, including traffic light integration."
      - "Delivered a demonstration setup for Imperial College London research."
      - "Supported research projects: prepared experiments, delivered software developments, and assisted MSc/PhD students."
  - years: "2020–2024"
    title: "PhD in Robotics"
    type: academic
    org: "Université de Technologie de Compiègne"
    country: "🇫🇷 France"
    text: "Thesis: [Shared navigation in a cybernetic multi-agent autonomous system](/articles/thesis/)"
  - years: "2020–2023"
    title: "Research Internship Co-supervision"
    type: academic
    org: "Heudiasyc Laboratory"
    country: "🇫🇷 France"
    bullets:
      - "Supervised 6 Master’s theses on planning, perception, and autonomous vehicle control."
  - years: "2019–2022"
    title: "Teaching Assistant"
    type: academic
    org: "UTC & ESILV"
    country: "🇫🇷 France"
    bullets:
      - "Led TD/TP sessions in AI, Algorithms, C++/Python, local planning, and ROS (≈30 students per group)."
      - "Prepared a 15-person team for the French Robotics Cup (design, strategy, system integration)."
      - "Supervised 6 MSc theses on planning, perception, shared-control and autonomous vehicle control."
  - years: "2022"
    title: "Research Assignment"
    type: academic
    org: "University of Tokyo, Fujimoto Laboratory"
    country: "🇯🇵 Japan"
    text: "[Road adhesion estimation using camera data](/projects/friction-detection/)"
  - years: "2019"
    title: "Master Internship"
    type: work
    org: "CEA-LIST"
    country: "🇫🇷 France"
    text: "Development of tools for collaborative robotics projects."
  - { years: "2018–2019", title: "Specialized Master’s in Robotics", type: academic, org: "CentraleSupélec, Metz", country: "🇫🇷 France" }
  - years: "2014–2019"
    title: "Engineering Degree in Computing"
    type: academic
    org: "ESILV, Paris"
    country: "🇫🇷 France"
    text: "Ranked 1st in class during the 1st and 2nd years of the engineering cycle."

skills:
  - title: "Robotics"
    items:
      - { label: "Planning", url: "/tags/planning_navigation/" }
      - { label: "Perception (Vision/LiDAR)", url: "/tags/sensing_perception/" }
      - { label: "Control", url: "/tags/control_optimization/" }
      - { label: "ROS", url: "/tags/ros/" }
      - { label: "ROS2", url: "/tags/ros2/" }
      - { label: "Multi-Agent Systems", url: "/tags/multi_agent_systems/" }
  - title: "Programming"
    items: [{ label: "C++" }, { label: "Python" }]
  - title: "Machine Learning"
    items:
      - { label: "Deep Learning (CNN, RNN)", url: "/tags/ai_ml/" }
      - { label: "TensorFlow" }
  - title: "Tools"
    items: [{ label: "Linux" }, { label: "Git" }, { label: "Docker" }, { label: "OpenCV" }]

projects:
  - { title: "Traffic Light Detection & Control", text: "Detection of traffic lights and adaptive control.", url: "/projects/autosys-traffic-light-detection/" }
  - { title: "Autonomous Vehicle Planning", text: "Global route planning, local path adjustment, dynamic control.", url: "/projects/autosys-local-planning/" }
  - { title: "Autonomous Vehicle Control", text: "Lateral/longitudinal control with navigation integration.", url: "/projects/autosys-control/" }
  - { title: "Human Driving Behavior Prediction", text: "Short-term prediction with deep learning & multi-sensor data.", url: "/projects/human-prediction/" }
  - { title: "Visual Control Applied to Autonomous Vehicle", text: "Lane-based control from camera images only.", url: "/projects/visual-control/" }

publications:
  - { tag: "2024 · Thesis", title: "Shared navigation in a cybernetic multi-agent autonomous system", main: true }
  - { tag: "2023 · ITSC", title: "Cooperative Architecture Using Air and Ground Vehicles for Search and Recognition" }
  - { tag: "2023 · IV", title: "Multi-Criteria Approach for Driving Intention" }
  - { tag: "2022 · ITSC", title: "Prediction of Human Driving Behavior Using Deep Learning" }
  - { tag: "2021 · SMC", title: "Shared Decision-Making for Autonomous Navigation" }

extras:
  - { label: "Association", text: "President & Treasurer of a Robotics Association" }
  - { label: "Robotics Cup", text: "French Robotics Cup (2 years), led a team of 15" }
  - { label: "Marathon", text: "Paris Marathon finisher (3h35)" }
---
