---
title: "CAN Software Update Bootloader"
date: 2022-08-10T16:58:05-07:00
draft: False
toc: true
---

## About

__Btldr__ is a bootloader for AVR microcontrollers that allows devices to have
their firmware updated using the CAN protocol. It goes along with client-side
__updatr__ CLI which is used to send the binary to the target.

## Motivation

While working on _Olin Electric Motorsports_, my college's FSAE electric race
car team, I was frustrated by the process of updating firmware. I was the lead
firmware engineer at the time, and anytime I wanted to tweak something, I had to
open up whatever enclosure the PCB was in, plug in a _USBASP_ dongle to the
board, and run the update command.

This was sometimes dangerous as one of the enclosures also contained a 400V
battery with questionable harnessing. I started doing some research into
bootloaders after chatting with a few industry professionals, and after lots of
dead-ends and lots of "ah-has", I finally understood what a bootloader was and
how to go about writing one.

## Design

The ATMega16m1 has 16KB of flash memory, 1KB of SRAM, and 512 bytes of EEPROM.
Not exactly a lot. The flash is divided into two sections: _application_ and
_bootloader_ with configurable size. I configured the system so that the
bootloader section was 4KB, just to give myself as much room as necessary to
start. I will optimize from there. [^1]

[^1]: Plus, none of our firmware images are larger than 10KB, so we are not
  hurting for space.

### 1. Startup

When the microcontroller resets or powers on, the bootloader is the first thing
to run. When this happens, we query EEPROM for a set of bootflags. One flag is
is used to indicate that a software update was requested. We'll get back to this
later. The other flag indicates that the image in the application section is
valid.

If an update wasn't requested and the image is valid (we will get to image
validity later), we jump to the application:

```c
/*
 * The MCU's reset vector is 0x0000, and that performs initialization and then
 * jumps to `main`.
 */
asm volatile("jmp 0x0000");
```

If an update _was_ requested, or the image in the application section isn't
"valid" (again, we'll revisit this), we enter continue the bootloader into the
updater image (not to be confused with _updatr_, the CLI that we'll discuss
later).

### 2. Update

In the updater image (which is really just an extension of the bootloader), we
initialize the CAN driver and start listening for messages. There are four types
of messages we can receive:

__QUERY__: (base + 0) A request from the client for system information<br/>
__SESSION__: (base + 2) A request from the client to start an update
session<br/>
__DATA__: (base + 4) Contains chunks of the image to be flashed<br />
__RESET__: (base + 6) Instructs the target to reset itself by jumping back to
the bootloader

These four commands are the client-to-target side of the update protocol. The
"base" is the base ID assigned to each ECU on the CAN bus. For example, the BMS
is assigned a base of `0x710`, so the __DATA__ message for the BMS would be
`0x714`.
