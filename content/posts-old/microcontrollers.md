---
title: "How do microcontrollers control?"
date: 2022-06-11T00:01:26-07:00
toc: true
draft: true
---

Microcontrollers are computers. They have a CPU that executes instructions,
memory, and registers. However, they also have the ability to read analog
voltages, communicate with different protocols, and turn lights on. In this
post, we will explore the concept of _peripherals_ and _memory-mapped IO_, the
mechanisms by which microcontrollers interact with the physical world.

## Peripherals

Peripherals refer to blocks of silicon in a microcontroller that interact with
the rest of the world. Common examples of peripherals are

* _GPIO_ (General purpose input/output)
* _ADC_ (Analog-Digital converters)
* _DAC_ (Digital-Analog converters)
* Communication protocols

These peripherals allow engineers to write code that controls motors, reads
sensors, or communicates with the outside world. But how does it work? There is
no special assembly instruction that sets a GPIO pin high or reads an ADC.
Instead, there are specific parts of a microcontroller's memory that, when
written to, perform specific functions.

## Memory-mapped registers

```
                        0x0000┌──────────────────┐
                              │                  │
                              │   IO Registers   │
                              │                  │
                              ├──────────────────┤
                              │                  │
                              │                  │
                              │                  │
                              │                  │
                              │                  │
                              │       SRAM       │
                              │                  │
                              │                  │
                              │                  │
                              │                  │
                              │                  │
                              └──────────────────┘
```

Computers have multiple kinds of memory. One of those is _RAM_, or random-access
memory. This is volatile[^1] memory that is used for _runtime_ variables, meaning
data that is written or read while the computer is running a program.

[^1]: Volatile means that the data is erased as soon as the computer loses
  power.

In many microcontrollers, a section of memory addresses are reserved for what
are called "IO registers". There might be a group of registers that control the
SPI peripheral, and a separate group of registers that control the ADC. Your
program can then use load and store instructions to access these registers, and
thus controlling and sensing the external world.

### An example

Let's take the ATmega16m1's GPIO peripheral.
