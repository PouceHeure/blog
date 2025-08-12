---
title: "A Lightweight Multi-Agent System Library"
date: 2020-09-07
tags: [ai_ml, multi_agent_systems]
codelang: ["python"]
description: A lightweight Python library to build and simulate multi-agent systems with agents, environments, and message-passing networks.
image: "https://raw.githubusercontent.com/PouceHeure/py_light_mas/master/.doc/py_light_mas-sequence.png"
github: https://github.com/PouceHeure/py_light_mas
---

## Overview

`py_light_mas` is a lightweight Python framework for multi-agent systems (MAS).
It provides simple abstractions for Agents, an Environnemnt, a Simulation loop, and an optional Network for inter-agent communication.

## Architecture

The architecture can be illustrated in two diagrams that describe the same system:

{{< figure src="https://raw.githubusercontent.com/PouceHeure/py_light_mas/master/.doc/py_light_mas-relation.png" caption="Relations between Simulation, Environnemnt, Agents, and Network." width="600" label="rel-view">}}
The {{< figref "rel-view" >}} highlights how the Simulation connects the Environnemnt, Agents, and optional Network.

{{< figure src="https://raw.githubusercontent.com/PouceHeure/py_light_mas/master/.doc/py_light_mas-sequence.png" caption="Event sequence across a simulation tick with message passing." width="600" label="seq-view">}}
The {{< figref "seq-view" >}} focuses on the chronological order of events (ticks, signals, messages) during simulation.

### Core components

* Agent: reacts to messages, signals, and simulation ticks
* Environnemnt: maintains world state and can render or log output
* Network: optional communication channel between agents
* Simulation: runs the main loop and dispatches events

## Quickstart

```python
from py_light_mas import Simulation, Environnemnt, Agent

class MyEnv(Environnemnt):
    def on_event_new_tick(self):
        print("Environment tick")

class MyAgent(Agent):
    def on_event_new_tick(self, env):
        print(f"{self.get_name()} tick in environment")

class MySimulation(Simulation):
    def __init__(self):
        super().__init__()
        env = MyEnv("world")
        agent = MyAgent("agent1")
        self.add(env)
        self.add(agent)

# Option A: use the built-in loop
sim = MySimulation()
sim.run_loop()

# Option B: drive the loop yourself
# while True:
#     ...  # your code
#     sim.run()
#     ...
```

## Networking example

```python
from py_light_mas import Network

net = Network("localhost")
agent.connect(net)
```

Agents can send messages through the network:

```python
agent.send("other_agent", "Hello World")
```

## Examples

The repository includes demos with visual and console output.

### Horse race
A simple race where multiple horse agents try to finish first.
{{< figure src="https://raw.githubusercontent.com/PouceHeure/py_light_mas/master/.doc/horse.gif" caption="Horse race demo." width="500" label="horse-race">}}
The {{< figref "horse-race" >}} illustrates competition in a shared environment.

### Robot resource search
Robots (black) navigate to find resources (blue).
{{< figure src="https://raw.githubusercontent.com/PouceHeure/py_light_mas/master/.doc/robot.gif" caption="Robot search demo." width="500" label="robot-search">}}
The {{< figref "robot-search" >}} shows distributed exploration with simple behaviors.

### Morse chat
Two agents exchange Morse-coded messages across different networks.

```bash
[name: agent_A_01 address: team_A/192.168.0.0 network: ://team_A aid: 0 type: SenderAgent] success connection to: team_A
[name: agent_B_01 address: team_B/192.168.0.0 network: ://team_B aid: 1 type: ReplierAgent] success connection to: team_B
from: team_A/192.168.0.0 to: team_B/192.168.0.0 content: __...._.__._..__..
from: team_B/192.168.0.0 to: team_A/192.168.0.0 content: ok __...._.__._..__..
from: team_A/192.168.0.0 to: team_B/192.168.0.0 content: _..__...
from: team_B/192.168.0.0 to: team_A/192.168.0.0 content: ok _..__...
from: team_A/192.168.0.0 to: team_B/192.168.0.0 content: ._.___.___...___.
from: team_B/192.168.0.0 to: team_A/192.168.0.0 content: ok ._.___.___...___.
from: team_A/192.168.0.0 to: team_B/192.168.0.0 content: .____._.______...
from: team_B/192.168.0.0 to: team_A/192.168.0.0 content: ok .____._.______...
from: team_A/192.168.0.0 to: team_B/192.168.0.0 content: ....___.
from: team_B/192.168.0.0 to: team_A/192.168.0.0 content: ok ....___.
from: team_A/192.168.0.0 to: team_B/192.168.0.0 content: ___.____.___
from: team_B/192.168.0.0 to: team_A/192.168.0.0 content: ok ___.____.___
from: team_A/192.168.0.0 to: team_B/192.168.0.0 content: .._.__...
from: team_B/192.168.0.0 to: team_A/192.168.0.0 content: ok .._.__...
from: team_A/192.168.0.0 to: team_B/192.168.0.0 content: __.
from: team_B/192.168.0.0 to: team_A/192.168.0.0 content: ok __.
```

## Documentation

Generate HTML API docs:

```bash
pip3 install pdoc3
./gen_doc.sh
open doc/index.html
```
