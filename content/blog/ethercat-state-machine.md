---
title: "EtherCAT in Four Steps: Understanding Its State Machine"
date: 2026-11-09
description: "Why an EtherCAT device has four states, what each one allows (mailbox, SDO, PDO, Sync Managers, FMMU) and why OP does not mean that a motor is turning."
tags: ["ethercat", "tooling"]
series: ""
draft: false
---

You plug a new EtherCAT drive into the network, start your master, and the device stays in `PRE-OP`. Or it reaches `SAFE-OP` and falls back with an error code. Or it is in `OP` and the motor does nothing.

These three situations come from the same mechanism: the **EtherCAT State Machine** (ESM). Every device, called a *slave* in the specification, goes through four states, and each one unlocks a precise set of features. The goal of this post is to understand why there are four of them and what each state really allows, so that the state shown by your master becomes a diagnosis instead of a mystery.

The four states in one table:

| State | Mailbox (SDO/CoE) | Inputs (slave → master) | Outputs (master → slave) |
| --- | --- | --- | --- |
| `INIT` | No | No | No |
| `PRE-OP` | Yes | No | No |
| `SAFE-OP` | Yes | Yes | Ignored, kept in a safe state |
| `OP` | Yes | Yes | Yes, applied |


The post assumes that you know what an EtherCAT master and slave are, and that a frame goes through all the devices of the network. It does not cover the physical layer or distributed clocks in detail.

## The principle: unlock features one at a time

### Master, slave, ESC and application

An EtherCAT network has one **master** (a PC or a PLC) and several **slaves** (drives, I/O modules, sensors). The master is the only one that sends frames. A frame goes through every slave, and each slave reads or writes its part of the frame while the frame passes.

Each slave contains two parts that work together:

- The **ESC** (EtherCAT Slave Controller) is a hardware chip. It handles the frames and has a small internal memory. When a frame arrives, the ESC copies the data addressed to it into this memory, and writes its own data into the frame.
- The **application** is the firmware that does the real job of the device: control a motor, read an analog input, switch a relay. It reads and writes the *same* memory as the ESC, from the other side.

So the master never talks to the application directly. It writes into the memory of the ESC, and the application reads it there (and the other way around). The state machine decides **which parts of this memory are in use**, and therefore what the application is allowed to do with them.

### Vocabulary used in this post

Several acronyms come back in every section. Here they are in one place, each one is explained again when it is first used.

| Term | Meaning | What it is used for |
| --- | --- | --- |
| **Mailbox** | A pair of memory areas in the slave used to exchange messages one at a time | Configuration and diagnosis, not control. A message is a request and the slave answers |
| **CoE** | CANopen over EtherCAT, a protocol carried by the mailbox | Gives access to the object dictionary of the slave |
| **Object dictionary** | A table inside the slave that lists all its parameters and values. Each entry has an **index** and a **sub-index**, for example `0x6040:00` | Describes everything the device can do or measure |
| **SDO** | Service Data Object: one request to **read or write one entry** of the object dictionary | Set a parameter, read a status. Occasional, not every cycle |
| **PDO** | Process Data Object: a **fixed list of entries** (for example target velocity and controlword) that is sent as one block **every cycle** | Real-time control. *RxPDO* is **received** by the slave (master outputs), *TxPDO* is **transmitted** by the slave (master inputs). The names are from the slave's point of view |
| **Process data** | The content of all the PDOs | What is exchanged cyclically |
| **Sync Manager** (SM) | A zone of the slave memory with an address, a size, a direction and an access mode | Guarantees that the master and the application never read and write the same data at the same time |
| **FMMU** | Fieldbus Memory Management Unit | Maps the *logical* address of the network to the *physical* memory of the slave |
| **SII** | Slave Information Interface, a small EEPROM in the slave | Stores the identity of the device and its default configuration |
| **Working counter** | A counter in the frame that each slave increments when it has read or written data | Lets the master check that every slave processed the frame |

The difference to remember is **SDO versus PDO**. An SDO is a question asked when needed ("what is the value of this parameter?"). A PDO is a list of values sent again and again at each cycle, with no question asked. Configuration uses SDOs, control uses PDOs.

### A fixed order

The state machine forces the master to proceed in a fixed order:

1. Set up the communication channel that allows configuring the device (**mailbox**).
2. Configure the device through that channel.
3. Start the cyclic exchange of data, inputs first.
4. Allow outputs to act on the application.

Each step is only available once the previous one is done, and each change of state is a **transition** during which the slave checks that its configuration is consistent. If it is not, the slave refuses the transition.

The master does not set the state directly: it **requests** a state, and the slave answers with the state it actually reached. The request and the answer go through three **registers**. A register is a small memory cell of the ESC, at a fixed address, that the master can read or write with a frame.

| Register | Address | Written by | Read by | Content |
| --- | --- | --- | --- | --- |
| AL Control | `0x0120` | Master | Slave | The state the master **asks for**. Also an *acknowledge* bit, used to clear an error |
| AL Status | `0x0130` | Slave | Master | The state the slave **is really in**. Also an *error* bit, set when a request was refused |
| AL Status Code | `0x0134` | Slave | Master | A number giving the **reason** of the refusal |

("AL" stands for *Application Layer*: these registers control the application of the slave, not the frame handling of the ESC, which always works.)

The state is encoded in the lowest bits of AL Control and AL Status:

| Value | State |
| --- | --- |
| `0x01` | `INIT` |
| `0x02` | `PRE-OP` |
| `0x04` | `SAFE-OP` |
| `0x08` | `OP` |
| `0x10` | Bit added to the state: error in AL Status, acknowledge in AL Control |

A transition therefore looks like this:

1. The master writes `0x04` in AL Control: "go to `SAFE-OP`".
2. The slave checks its configuration.
3. If everything is consistent, it writes `0x04` in AL Status. The master reads it and knows the transition is done.
4. If not, it stays in its current state, writes the state with the error bit (for example `0x12` while in `PRE-OP`) and puts the reason in AL Status Code.
5. The master reads the code, then writes the state with the acknowledge bit (`0x12`) in AL Control to clear the error, before making a new request.

{{< mermaid caption="Normal start-up sequence. The master can request a lower state from any state." >}}
%%{init: {"flowchart": {"rankSpacing": 24, "nodeSpacing": 20, "padding": 5}}}%%
flowchart LR
  I["INIT"] --> P["PRE-OP"]
  P --> S["SAFE-OP"]
  S --> O["OP"]
  O -.-> S
  S -.-> P
  P -.-> I
  classDef run fill:#FFEFC2,stroke:#E5D28A,color:#6B4A00
  class O run
{{< /mermaid >}}

Going up must follow the order `INIT`, `PRE-OP`, `SAFE-OP`, `OP`, one step at a time. Going down can skip states, for example from `OP` directly to `INIT`.

## INIT: initialize the device

{{< mermaid caption="You are here: INIT." >}}
%%{init: {"flowchart": {"rankSpacing": 24, "nodeSpacing": 20, "padding": 5}}}%%
flowchart LR
  I["INIT"] --> P["PRE-OP"] --> S["SAFE-OP"] --> O["OP"]
  classDef run fill:#FFEFC2,stroke:#E5D28A,color:#6B4A00
  class I run
{{< /mermaid >}}

In this state:

| Element | Status | Detail |
| --- | --- | --- |
| ESC and its registers | **Running** | The master can read and write them. The chip does it alone, the slave application is not needed |
| Slave application | Not reachable | The master has no way to talk to it yet |
| Mailbox | Not running | `SM0` / `SM1` are not configured yet |
| SDO (configuration) | Not running | Needs the mailbox |
| Inputs (TxPDO) | Not running | No process data |
| Outputs (RxPDO) | Not running | No process data |

`INIT` is the state of a slave that has just powered up. The ESC works, so the master can read and write its registers: the chip handles it alone, without the slave application, but **the application layer is not reachable**. No mailbox exists and no process data is exchanged.

This is the state in which the master prepares the communication:

- It gives each slave a **configured station address**, written in an ESC register, so that devices can be addressed individually instead of by their position in the ring.
- It reads the slave identity (vendor, product code, revision) and its default configuration from the **SII**, a small EEPROM on the device.
- It configures the first two **Sync Managers**, `SM0` and `SM1`, which are the memory windows of the mailbox. By convention, `SM0` carries the mailbox from the master to the slave and `SM1` the mailbox from the slave to the master.

{{< mermaid caption="In INIT the master configures SM0 and SM1: the mailbox, one window per direction." >}}
%%{init: {"flowchart": {"rankSpacing": 24, "nodeSpacing": 20, "padding": 5}}}%%
flowchart LR
  M["Master"]
  subgraph ESC["Slave: ESC memory"]
    SM0["SM0<br/>mailbox out<br/>master → slave"]
    SM1["SM1<br/>mailbox in<br/>slave → master"]
    SM2["SM2<br/>RxPDO outputs<br/>master → slave"]
    SM3["SM3<br/>TxPDO inputs<br/>slave → master"]
  end
  A["Slave application"]
  M --> SM0 --> A
  A --> SM1 --> M
  M --> SM2 --> A
  A --> SM3 --> M
  classDef run fill:#FFEFC2,stroke:#E5D28A,color:#6B4A00
  class SM0,SM1 run
{{< /mermaid >}}

A Sync Manager is a part of the slave's memory with an address, a size, a direction and an access mode. It makes sure the master and the slave application never read and write the same data at the same time. The mailbox uses it in a handshake mode: a message is written once, and must be read before the next one can be written.

Each slave has **its own** ESC memory, with the same address layout as the others: the `SM2` of slave 1 and the `SM2` of slave 2 can both be at `0x1100`, but they are two different memories. These addresses are **physical**: they only make sense inside one slave. The network uses **logical** addresses instead, described in the `PRE-OP` section.

Once the mailbox windows are set, the master requests `PRE-OP`. The slave checks that the mailbox configuration is valid, and if it is not, it stays in `INIT` and reports the reason, for example `0x0016` (invalid mailbox configuration).

At the end of this step, no application data has been exchanged. The only thing established is a way to talk to the device.

## PRE-OP: configure before communicating

{{< mermaid caption="You are here: PRE-OP." >}}
%%{init: {"flowchart": {"rankSpacing": 24, "nodeSpacing": 20, "padding": 5}}}%%
flowchart LR
  I["INIT"] --> P["PRE-OP"] --> S["SAFE-OP"] --> O["OP"]
  classDef run fill:#FFEFC2,stroke:#E5D28A,color:#6B4A00
  class P run
{{< /mermaid >}}

In this state:

| Element | Status | Detail |
| --- | --- | --- |
| ESC and its registers | **Running** | Same as before |
| Slave application | Reachable | Through the mailbox only |
| Mailbox | **Running** | Request and response messages, one at a time |
| SDO (configuration) | **Running** | Read and write the object dictionary |
| Inputs (TxPDO) | Not running | `SM3` and the PDO mapping are not ready |
| Outputs (RxPDO) | Not running | `SM2` and the PDO mapping are not ready |

In `PRE-OP` the mailbox is active, and the master can finally talk to the slave application. The mailbox is a request and response channel that carries several protocols, each one identified in the mailbox header. The most used one for configuration is **CoE** (CANopen over EtherCAT), which gives access to the **object dictionary** of the device through **SDOs**.

The main protocols carried by the mailbox are:

- **CoE**: access to the object dictionary, therefore the SDOs.
- **FoE** (File access over EtherCAT): file transfer, for example a firmware update.
- **EoE** (Ethernet over EtherCAT): tunnels standard Ethernet frames through the EtherCAT network.

An SDO is thus a CoE message that travels in the mailbox: the master writes the request in `SM0`, the slave application reads it, then writes the answer in `SM1`, where the master reads it.

An SDO (Service Data Object) reads or writes one object, identified by an index and a sub-index:

```text
0x6040:00   Controlword      (write)
0x6041:00   Statusword       (read)
0x1C12:00   Outputs: number of PDOs assigned to SM2  (write)
```

SDO transfers are **acyclic**: the master asks when it needs, and the slave answers. They are slow compared to the cycle time, and not deterministic, which is why they are used for configuration and not for control.

The main job of the master in this state is to describe the **process data**, the data that will be exchanged every cycle:

- **PDOs** (Process Data Objects) are the lists of objects exchanged cyclically. The slave receives *RxPDOs* (outputs of the master) and sends *TxPDOs* (inputs of the master). Which objects they contain is called the **PDO mapping**, and it is configured in the object dictionary, often with the default mapping of the device.
- **`SM2` and `SM3`** are the Sync Managers dedicated to process data, by convention `SM2` for outputs (master → slave) and `SM3` for inputs (slave → master). Their configuration depends on the size of the PDOs, so it can only be done once the mapping is known.
- **FMMUs** (Fieldbus Memory Management Units) translate between the **logical address space** of the network and the physical memory of the slave. They allow one single frame to read and write the data of many devices, since each slave takes from the frame only the part mapped to its own Sync Managers. The master configures them to build the cyclic frame. A FMMU is only a **mapping**, internal to the ESC: it translates a logical address of the frame into a physical address of this slave's memory. Each slave has its own FMMUs and only knows its own part; only the master knows the whole layout.

{{< mermaid caption="In PRE-OP the master prepares SM2 and SM3: the process data, one window per direction." >}}
%%{init: {"flowchart": {"rankSpacing": 24, "nodeSpacing": 20, "padding": 5}}}%%
flowchart LR
  M["Master"]
  subgraph ESC["Slave: ESC memory"]
    SM0["SM0<br/>mailbox out<br/>master → slave"]
    SM1["SM1<br/>mailbox in<br/>slave → master"]
    SM2["SM2<br/>RxPDO outputs<br/>master → slave"]
    SM3["SM3<br/>TxPDO inputs<br/>slave → master"]
  end
  A["Slave application"]
  M --> SM0 --> A
  A --> SM1 --> M
  M --> SM2 --> A
  A --> SM3 --> M
  classDef run fill:#FFEFC2,stroke:#E5D28A,color:#6B4A00
  class SM2,SM3 run
{{< /mermaid >}}

Nothing is sent yet in this state. The master only *describes* the process data and prepares the memory; the values themselves are exchanged later, from `SAFE-OP`. This separation is the reason for the state: a configuration change is done with acyclic messages, and nothing in the cyclic exchange can be broken by a half-written configuration.

The diagram shows how the content of a PDO ends up in the cyclic frame.

{{< mermaid caption="From the content of a PDO to the cyclic frame (example: outputs of a drive). Inputs follow the same path with SM3." >}}
%%{init: {"flowchart": {"rankSpacing": 26, "nodeSpacing": 20, "padding": 5}}}%%
flowchart TB
  A["<b>① Define the PDO layout</b><br/>Configure which objects it contains<br/>(SDO write in object 0x1600)<br/>Controlword 0x6040: 2 bytes<br/>Target position 0x607A: 4 bytes<br/>→ the PDO is 6 bytes"]
  B["<b>② Assign the PDO to SM2</b><br/>(SDO write of 0x1600 in object 0x1C12)<br/>→ SM2 must carry this PDO"]
  C["<b>③ Size SM2 in the slave memory</b><br/>SM2 at address 0x1100, 6 bytes<br/>(ESC register)"]
  D["<b>④ Map to the network with the FMMU</b><br/>logical 0x0000 to 0x0005<br/>↔ physical 0x1100<br/>(ESC register)"]
  E["<b>⑤ Result, from SAFE-OP</b><br/>The cyclic frame will carry one logical block:<br/>slave 1 outputs (6 B), slave 2 outputs (6 B), ..."]
  A --> B --> C --> D --> E
  classDef run fill:#FFEFC2,stroke:#E5D28A,color:#6B4A00
  class E run
{{< /mermaid >}}

Read it from top to bottom. Steps ① to ④ are done now, in `PRE-OP`. Step ⑤ is what they prepare.

**Steps ① and ② describe the data.** The master does *SDO writes*: it writes values in the object dictionary of the slave, through the mailbox. Nothing moves yet, the slave only notes what the PDO will contain and which Sync Manager carries it.

**Steps ③ and ④ configure the memory.** The master writes registers of the ESC (not through the mailbox: the chip handles it alone): the size and address of `SM2`, then the FMMU that links this memory to a logical address.

**Where do the addresses come from?** The physical addresses (`SM2` at `0x1100`) are the default values of the manufacturer, stored in the **SII** of the slave or in its **ESI** file (XML); the master rarely changes them. The logical addresses are **chosen freely by the master**, which builds a *process image* and gives each slave a consecutive range. The sizes come from the PDO mapping, read by SDO or in the ESI file.

**Step ⑤ is the result, but it only happens later.** Once the slave is in `SAFE-OP`, the master sends at each cycle (one iteration of its loop, at a fixed period) one single block of logical addresses. Each slave only takes the bytes mapped to its own `SM2` and writes the bytes mapped to its own `SM3`. No SDO is involved anymore.

When the configuration is done, the master requests `SAFE-OP`. This is the transition where the slave checks the most: that `SM2` and `SM3` are consistent with the PDOs, and that the mapping makes sense. A refusal here usually has one of these codes:

- `0x0017`: invalid Sync Manager configuration.
- `0x001D`: invalid output configuration.
- `0x001E`: invalid input configuration.

## SAFE-OP: communicate without acting

{{< mermaid caption="You are here: SAFE-OP." >}}
%%{init: {"flowchart": {"rankSpacing": 24, "nodeSpacing": 20, "padding": 5}}}%%
flowchart LR
  I["INIT"] --> P["PRE-OP"] --> S["SAFE-OP"] --> O["OP"]
  classDef run fill:#FFEFC2,stroke:#E5D28A,color:#6B4A00
  class S run
{{< /mermaid >}}

In this state:

| Element | Status | Detail |
| --- | --- | --- |
| ESC and its registers | **Running** | Same as before |
| Slave application | Reachable | Mailbox and process data |
| Mailbox | **Running** | Still available |
| SDO (configuration) | **Running** | Still available |
| Inputs (TxPDO) | **Running** | Updated every cycle, the master reads real values |
| Outputs (RxPDO) | Received, **not applied** | The device outputs stay in their safe state |

`SAFE-OP` is the first state with cyclic process data, but only in one direction in practice:

- The slave **updates its inputs** (TxPDO) every cycle: sensor values, status words, measured positions. The master can read real data.
- The master **sends its outputs** (RxPDO), but the slave **does not apply them**. The outputs of the device stay in their *safe state*, which is defined by the device and by its documentation: output switched off, torque disabled, brake engaged, and so on.
- The mailbox stays available, so SDO access is still possible.

The reason for this state is the order of the start-up. A master that starts the cyclic exchange has not yet produced a valid output: its application may not be running, and its first values may be zeros or garbage. If the slave applied them from the first cycle, the machine would move on unknown values. `SAFE-OP` lets both sides start exchanging and check the data, with no consequence on the machine.

During this state, the master has the occasion to:

- check that the inputs are valid and that the **working counter** of the cyclic frame is correct. The working counter is incremented by each slave that read or wrote data in the frame. If its value is lower than expected, one slave did not process the data;
- send meaningful output values, so that the first outputs applied in `OP` are the ones the application wants;
- wait for the **distributed clocks** to synchronize, when the device uses them.

The transition to `OP` is where the slave checks that the cyclic exchange is really working. These are the usual reasons why a device refuses it or falls back to `SAFE-OP`:

| AL Status Code | Meaning | What to check |
| --- | --- | --- |
| `0x001A` | Synchronization error | Distributed clocks not yet locked, wrong `SYNC0` cycle time |
| `0x001B` | Sync Manager watchdog | The master does not send outputs often enough, or has stopped |
| `0x001D` | Invalid output configuration | `SM2` size does not match the RxPDO mapping |
| `0x001E` | Invalid input configuration | `SM3` size does not match the TxPDO mapping |

{{< callout title="A frequent cause: the master stops sending outputs" >}}
The slave monitors the arrival of process data with a **Sync Manager watchdog**. If the master does not update the outputs within the watchdog time, the slave considers that the master is gone and goes back to `SAFE-OP`, with the error `0x001B`. In practice this often happens when a program stops its cyclic loop (breakpoint, long computation, wrong real-time priority) while the network is still up.
{{< /callout >}}

## OP: exchange and control

{{< mermaid caption="You are here: OP." >}}
%%{init: {"flowchart": {"rankSpacing": 24, "nodeSpacing": 20, "padding": 5}}}%%
flowchart LR
  I["INIT"] --> P["PRE-OP"] --> S["SAFE-OP"] --> O["OP"]
  classDef run fill:#FFEFC2,stroke:#E5D28A,color:#6B4A00
  class O run
{{< /mermaid >}}

In this state:

| Element | Status | Detail |
| --- | --- | --- |
| ESC and its registers | **Running** | Same as before |
| Slave application | Reachable | Mailbox and process data |
| Mailbox | **Running** | Still available |
| SDO (configuration) | **Running** | Still available, but not for anything cyclic |
| Inputs (TxPDO) | **Running** | Updated every cycle |
| Outputs (RxPDO) | **Running** and **applied** | The application uses the values sent by the master |

In `OP` (operational), everything is active: the mailbox, the inputs and the outputs. The slave **applies** the values of the RxPDO to its application, and the master sees the real inputs. This is the normal state of a device during the operation of the machine.

Three points to remember about this state:

- The exchange is **cyclic and periodic**. The master must keep sending frames at the planned period. If the period is not respected, the working counter or the watchdog will report it.
- The master must keep checking the **working counter** of every frame, and the state of each slave. A slave that fails can go back to a lower state at any time (see the previous section), and the master has to detect it and decide what to do.
- The mailbox is still there. SDOs can be used in `OP`, for example to change a parameter or read a diagnosis, but they must not be used for anything that has to be done every cycle.

### OP does not mean that the motor is turning

`OP` only says that **process data is exchanged and applied**. What the device does with this data is defined by its own application, and often by another protocol on top of EtherCAT.

A servo drive that follows the **CiA 402** profile is the typical case. It has its own state machine, driven by the `Controlword` (`0x6040`) and reported by the `Statusword` (`0x6041`):

```text
Switch on disabled → Ready to switch on → Switched on → Operation enabled
```

The drive moves only in `Operation enabled`. To go there, the master writes a sequence of values in the `Controlword`, **through the RxPDO**, which is why `OP` is required first. A drive in EtherCAT `OP` is therefore usually in `Switch on disabled`: the network is ready, but the power stage is not enabled.

{{< mermaid caption="Two state machines in a drive: the EtherCAT one is a prerequisite of the CiA 402 one." >}}
%%{init: {"flowchart": {"rankSpacing": 24, "nodeSpacing": 20, "padding": 5}}}%%
flowchart TB
  A["EtherCAT ESM<br/>INIT → PRE-OP → SAFE-OP → OP"] --> B["PDO exchange applied<br/>Controlword / Statusword"]
  B --> C["CiA 402 state machine<br/>Switch on disabled → ... → Operation enabled"]
  C --> D["Motor can move"]
  classDef run fill:#FFEFC2,stroke:#E5D28A,color:#6B4A00
  class D run
{{< /mermaid >}}

So when a drive is in `OP` and the motor does not move, the question is no longer about EtherCAT: look at the `Statusword`, then at the faults reported by the drive.

## Checking the state from the command line

With the IgH EtherCAT Master, the state of each slave is visible in one command, and the main objects can be listed with two others:

```bash
# list slaves with their current state
ethercat slaves

# list the PDO mapping of each slave (SM2 / SM3)
ethercat pdos

# read one SDO, here the statusword of a CiA 402 drive
ethercat upload -p 0 0x6041 0
```

Other masters have equivalent tools (the `slaveinfo` and `simple_test` examples of SOEM, or the diagnostic view of commercial masters). Whatever the tool, the same information is available: the current state, the AL Status Code and the content of the process data.

## What breaks where

The state in which a device stays is a good indicator of the type of problem:

| Symptom | Where to look |
| --- | --- |
| Stays in `INIT` | Cabling, station address, mailbox `SM0` / `SM1` configuration (`0x0016`) |
| Stays in `PRE-OP` | PDO mapping, `SM2` / `SM3` and FMMU configuration (`0x0017`, `0x001D`, `0x001E`) |
| Falls back from `SAFE-OP` or `OP` | Sync Manager watchdog (`0x001B`), distributed clocks (`0x001A`), cycle regularity |
| In `OP` but the motor does not move | Device application: `Controlword`, `Statusword`, drive faults |

The four states are not four modes of the same thing: each one adds one capability. `INIT` gives access to the chip, `PRE-OP` gives a configuration channel, `SAFE-OP` gives data without effect, and `OP` gives data with effect. When a device refuses a transition, it is telling you which of these capabilities is not ready.

To go further, the [EtherCAT Technology Group](https://www.ethercat.org/) publishes the specification and application notes, the [IgH EtherCAT Master documentation](https://docs.etherlab.org/ethercat/) describes the master used in the examples, and the [SOEM project](https://github.com/OpenEtherCATsociety/SOEM) is a small open-source master where the state transitions are easy to read in the code.
