---
title: "A Lightweight Multi-Agent System Library"
date: 2020-09-07
tags: [ai_ml, multi_agent_systems]
codelang: ["python"]
description: A simple Python library to build and simulate multi-agent systems with agents, environments, and message-passing networks.
image: "https://raw.githubusercontent.com/PouceHeure/py_light_mas/master/.doc/py_light_mas-sequence.png"
github: https://github.com/PouceHeure/py_light_mas
---

## Overview

`py_light_mas` is a minimal Python framework for **multi-agent systems (MAS)**.  
It defines simple abstractions for **Agents**, **Environments**, **Simulation loops**, and optional **Networks** for inter-agent communication.
## Concepts & Architecture

The framework supports two perspectives:
- **Relation view** — how agents, environments, and networks are connected.
- **Sequence view** — how events (ticks, messages) flow over time.

{{< figure src="https://raw.githubusercontent.com/PouceHeure/py_light_mas/master/.doc/py_light_mas-sequence.png" caption="Sequence Diagram" width="600">}}

### Core Components
- **Agent** — Receives and reacts to messages, signals, and simulation ticks.
- **Environment** — Manages the world state and can render or log output.
- **Network** — Optional communication channel between agents.
- **Simulation** — Runs the main loop and orchestrates events.

{{< figure src="https://raw.githubusercontent.com/PouceHeure/py_light_mas/master/.doc/py_light_mas-relation.png" caption="Agent relations" width="600">}}

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

sim = MySimulation()
sim.run_loop()
```

## Networking Example

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

### Horse Race
A simple race simulation where multiple horse agents compete to finish first.  
{{< figure src="https://raw.githubusercontent.com/PouceHeure/py_light_mas/master/.doc/horse.gif" caption="Horse Race Example" width="500">}}

### Robot Resource Search
Robots (black) navigate an environment to find resources (blue).  
{{< figure src="https://raw.githubusercontent.com/PouceHeure/py_light_mas/master/.doc/robot.gif" caption="Robot Simulation" width="500">}}

### Morse Chat
Two agents exchange Morse-coded messages across different networks.  
``` bash 
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

Generate HTML API docs with:
```bash
pip3 install pdoc3
./gen_doc.sh
open doc/index.html
```
