---
title: "Getting started with <MICROCONTROLLER> in Rust"
date: 2022-10-04T16:18:56-04:00
draft: false
---

Embedded Rust is amazing. Between the sophisticated tooling, common set of
peripheral abstractions (HALs), and its memory-safety, there is a lot to like.
However, all embedded systems development is challenging for one crucial reason:
the hardware. Specifically, there are so many microcontrollers that it can be
hard to know which to choose, or, if you have a random one, how to use it.

In this post, I hope to highlight the process of writing a blinky application
for an arbitrary microcontroller. We'll use the STM32H750VBT6 microcontroller.

I'll start by determining if it even possible to use this microcontroller
(spoiler alert: it is). Then, we'll work through adapting the
`cortex-m-quickstart` template repository to fit our needs. Finally, we'll write
the application, enable logging over ITM (a challenge in and of itself), and
test it on hardware!

## Prelude: Impulse Buying

A while back, I was looking for a new development board to play around with. I
wanted a microcontroller that had a memory-protection unit (MPU) so that I could
run [Hubris], the embedded operating system by [Oxide].

I found [this board] on Adafruit that has an STM32H750VBT6 and bought it. It's
got an LCD screen, a button, an LED, and an SD card slot. Plenty of stuff to
play around with...

## Step one: sanity check

The basis for most embedded Rust code is the *peripheral access crate*, or PAC.
This is a library that contains definitions for all of the memory-mapped
registers of the microcontroller, which is the method by which we interact with
hardware peripherals like SPI and GPIO.

However, we usually don't use the PAC---we use a HAL, or *hardware abstraction
library*. The HAL provides an abstraction over the PAC, meaning that instead of
writing a one to a specific bit in a register to set a GPIO pin high, we can
just call `pin.set_high()` and the `set_high` method handles writing the
register for us.

PACs and HALs are often idenfitied by the _family_ of microcontroller. An
STM32F103C8T6 would be classified in the STM32F1 family, whereas our chip
(STM32H750VBT6) is an STM32H7 microcontroller. So the PAC for our
microcontroller is called `stm32h7` and the HAL is called `stm32h7xx-hal`.
Looking at the [documentation for the PAC], it seems like our microcontroller
isn't supported... Hm. That is unfortunate. In any case, let's check the HAL:

[documentation for the PAC]: https://crates.io/crates/stm32h7

> #### Supported Configurations
>
>   * stm32h743v (Revision V: stm32h743, stm32h742, stm32h750)

There it is! The "stm32h750". It is a bit confusing that it is wrapped up with
`stm32h743v`, but I think this is good enough for us to move forward with the
HAL.

## Step two: ~~`git clone`~~ `cargo generate`

Now that we've verified that we have a HAL we can use to simplify our
programming, let's start setting up our application. Instead of starting from
scratch, we can use the [`cortex-m-quickstart`] template repository. This gives
us boilerplate code and configuration files that we can tweak to get our system
up and running much quicker.

[`cortex-m-quickstart`]: https://github.com/rust-embedded/cortex-m-quickstart

We'll want to start by installing `cargo-generate`, and once we have that, we
can run:

```sh
$ cargo generate --git https://github.com/rust-embedded/cortex-m-quickstart
```

After we enter into our repository, we see a bunch of files. Our code will live
in the `src/` folder, and the rest of the files are used for configuration of
our code. Let's start there.

To start there are three files we will need to edit before we start on code:

1. `memory.x`: Defines the memory layout of our microcontroller
2. `.cargo/config.toml`: Defines the configuration for building our application
3. `Cargo.toml`: Defines what crates we use in our code

### Linker Script: `memory.x`

To start, we need to tell our compiler what the memory layout of our chip is.
This is defined by your chip, so you'll have to read the datasheet:

![](images/memory-table.png)
