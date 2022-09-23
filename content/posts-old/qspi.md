---
title: "Flashing QSPI"
date: 2022-08-15T15:05:44-07:00
draft: true
---

I recently bought two development boards, the WeAct Studio STM32H750 and the
Raspberry Pi Pico with an RP2040. Both microcontrollers have limited or no
on-chip flash memory. Instead, they both have QSPI flash chips. Quad-SPI is a
protocol that is commonly used to interact with memory devices because of its
high speed.

I've been working on figuring out how to program the external QSPI flash chip on
the devices, and then how to boot from that memory. This document serves as my
notes.

# Programming methods

There are a *lot* of methods that can be used to program flash memory. Each
method is basically just some combination of hardware and software.

## Hardware

1. **J-Link/ST-Link/CMSIS-DAP-link**: These are programming dongles that usually
   use some sort of USB connector to your computer. The other end uses either
   the JTAG or the SWD (serial wire debug) protocol, which connects directly to
   your microcontroller to debug/program it.

2. **USB Cable**: Just a plain-old USB cable. Usually, either your MCU will have
   a USB peripheral or an FTDI USB-UART converter

## Software

This is where things get a bit more complicated.

1. **OpenOCD**
2. **probe-rs**
3. **pyOCD**
3. **DFU**

The STM32 has a built-in fixed ROM bootloader that can connect using a USB DFU
utility. However, this bootloader doesn't seem to be able to update QSPI flash.
It's possible however to write a different USB DFU bootloader that _is_ able to
write to QSPI flash.

OpenOCD, probe-rs, and pyOCD all use J-Link/ST-Link/etc so a programmer like
that is necessary. However, with those, it seems to be possible to write QSPI
flash.

# A better approach

I think the best approach would be to create a bootloader that uses the USB DFU
but also has support for QSPI flashing. That way we can use USB to update the
firmware. The bootloader will either update the firmware using USB or just
configure QSPI and jump to it. I believe this is the approach the RP2040 uses. I
wonder if I can copy [their bootloader]?

[their bootloader]: https://github.com/cbiffle/rp2040-rustboot

We should be able to configure QSPI in "extended memory" mode so that we map
memory addresses `0x9000000-0x901FFFFF` to just read from QSPI.
