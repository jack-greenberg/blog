---
title: "Getting started with <MICROCONTROLLER> in Rust (Part 1: Setup)"
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

### Memory Configuration: `memory.x`

To start, we need to tell our compiler what the memory layout of our chip is
using a *linker script*. This is defined by your chip, so you'll have to read
the datasheet. The memory for our chip is pretty confusing. There are six types
of RAM (DTCM, SRAM1, 2, 3, and 4, and _back-up_ SRAM), as well as three types of
flash (ITCM, a flash memory bank, and "System Memory"). There are tradeoffs
between the different types, but for now, we will just use DTCM for data and
the flash memory bank for code[^1].

[^1]: The main reason for choosing DTCM over the other SRAM regions is that I
  was having some trouble with the SRAM regions where my device would crash due
  to some memory issue. That debugging story will be for another time.

According to the datasheet, we have 128K of flash (addresses
0x08000000--0x0801FFFF) and 128K of DTCM (addresses 0x20000000--0x2001FFFF). We
can indicate that to Rust in `memory.x`:

```
MEMORY {
  FLASH : ORIGIN = 0x08000000, LENGTH = 128K
  RAM : ORIGIN = 0x20000000, LENGTH = 128K
}
```

This is all we need to tell Rust how to place the code and data for our program.
Next, let's configure the compilation stage.

### Compiler Configuration: `.cargo/config.toml`

This file configures `cargo`, Rust's build system and package manager. There are
only two changes we need to make here:

1. **Choose a "runner".** The runner is the command that gets executed when we
   type `cargo run` into our terminal. In normal Rust programming, this will
   just execute your program on your machine. However, we cannot execute
   embedded Rust code on our laptops or PCs [^2]. Instead, we are going to use
   `openocd` to setup a debug server that we can connect to with GDB:

   ```toml
   runner = "openocd"
   ```

    When we go to flash our device, we will use `cargo flash`.

[^2]: Yes, there is some support for emulation using QEMU, but we'll just look
  the other way for now...

2. **Choose our target platform.** We need to tell `cargo` which target platform
   we are compiling for. In a non-embedded context, this might be something like
   `x86_64-unknown-linux-gnu`. In our context, it will depend on the
   architecture of the microcontroller's core. The datasheet will tell you if
   you have a Cortex M0, M3, etc. as well as whether or not your device has a
   *floating point unit*, or FPU. The `cortex-m-quickstart` template
   conveniently lists our options. Our microcontroller is a Cortex M7 core with
   an FPU, so we will choose 

   ```toml
   target = "thumbv7em-none-eabihf"
   ```

Finally, we will configure our application and add package dependencies so that
we don't have to write a bunch of hardware libraries from scratch.

### Application Configuration: `Cargo.toml`

As we mentioned before, we want to use a HAL to write our software so that we
don't have to spend time worrying about writing specific values into specific
memory-mapped registers. Our HAL is the `stm32h7xx-hal`, but if you are using a
different chip, you should find the associated HAL. You can find a good list of
HALs [here].

[here]: https://github.com/rust-embedded/awesome-embedded-rust#hal-implementation-crates

In our `Cargo.toml` file, we will add the following under the `[dependencies]`
header:

```toml
stm32h7xx-hal = { version = "0.12.2", features = ["stm32h750v"] }
```

In our case, we specify a feature as listed in the *[crates.io]* page that
chooses the correct library code for our specific microcontroller.

[crates.io]: https://docs.rs/crate/stm32h7xx-hal/0.12.2/features

---

With all of that, we are finally ready to start writing code! In the next part,
we will write a blinky program on our microcontroller.
