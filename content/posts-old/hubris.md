---
title: "Let's write a Hubris app"
date: 2022-07-15T15:52:31-07:00
draft: true
toc: true
---

Oxide released an embedded operating system called Hubris, and it looks very
cool. Let's try writing an application!

## Platform

I'm going to be attempting to implement this on a [WeAct Studio STM32H750 dev
board](https://www.adafruit.com/product/5032). It has a SPI LCD screen, an SD
card slot, and a user button.

## Goals

The goal is to have the display cycle through images whenever the button is
pressed. The images will live on the SD card.

## Let's get started!

First, clone the repo:

```shell
$ git clone git@github.com:oxidecomputer/hubris.git
```

So far so good! Let's enter the directory and have a look around.

The `app/` folder seems to be where the applications are defined. Applications
run `tasks` that are defined in the `tasks` folder. Who'd'a thought...

We're running an STM32H750VBT6 microcontroller, which is in the STM32H7 family.
Oh look, there's a demo for that in `app/demo-stm32h7-nucleo/`. Let's clone that
directory as a starting place:

```
$ cp -r app/demo-stm32h7-nucleo app/fern
```

Why `fern`? Why not. Let's start adapting by editing the `app/fern/Cargo.toml`
file.

```diff
 [package]
 edition = "2018"
 readme = "README.md"
-name = "demo-stm32h7-nucleo"
+name = "fern"
 version = "0.1.0"
 
 [features]
 ...
 semihosting = ["panic-semihosting"]
 h743 = ["stm32h7/stm32h743", "drv-stm32h7-startup/h743"]
 h753 = ["stm32h7/stm32h753", "drv-stm32h7-startup/h753"]
 
 [dependencies]
 cortex-m = { version = "0.7", features = ["inline-asm"] }
 ...
 
 # this lets you use `cargo fix`!
 [[bin]]
-name = "demo-stm32h7-nucleo"
+name = "fern"
 test = false
 bench = false
```

Do we need an `h750` feature? Well, looking at the 
[stm32h7xx-hal](https://crates.io/crates/stm32h7xx-hal) crate, it looks like our
chip is supported under a different name:

> Supported Configurations
> 
> __stm32h743v__ (Revision V: stm32h743, stm32h742, <u>stm32h750</u>)

Let's just stick with `stm32h743` for now, and see where that gets us. Let's try
building with just the name change.

> We do not use cargo build or cargo run directly because they are too inflexible for our purposes.

Ok, so...?

> Instead, the repo includes a Cargo extension called xtask that namespaces our
> custom build commands.

```shell
$ cargo xtask dist app/demo-stm32h7-nucleo/app-h743.toml
```

Ah ha! Ok so we need to edit the `app-h7XX.toml` file. Let's clone
`app-h743.toml` and just call it `app.toml`, and make a couple changes:

```diff
-name = "demo-stm32h743-nucleo"
+name = "fern"
 target = "thumbv7em-none-eabihf"
-board = "nucleo-h743zi2"
+board = "weact-stm32h750"
 chip = "../../chips/stm32h7"
 stacksize = 896
```

Is board important? Is name? We'll find out soon enough!

Looking at the [NUCLEO-STM32H743 dev board](), it looks like it runs a
[STM32H743ZIT6U]() microcontroller. Since it's got an `I` in the name at that
location, that means it has 2 megabytes of flash. But wait, the `app.toml` file
says `size = 1048576`, which is only 1 megabyte! Oh.

> \# Flash sections are mapped into flash bank 1 (of 2).

Ah gotcha. Our chip (STM32H750VBT6) has 128K on-chip flash, and our board has an
8M QSPI flash chip. Let's go ahead and add those in:
<!-- Gotcha. Sure. Our chip (STM32H750VBT6) uses QSPI (read: external) flash, and the -->
<!-- board has 8 megabytes of it, so let's put that: -->

```
[outputs.flash]
address = 0x08000000
size = 131072
read = true
execute = true

[outputs.qspi_flash]
address = 0x09000000
size = 8388608
read = true
execute = true
```

Whew, that's a lot. What about RAM? Well, there's a comment in the original
`app.toml` saying

> RAM sections are currently mapped into DTCM, a small but fast SRAM.

Our micro has 128 kilobytes of DTCM RAM, so I guess let's use that! Oh look,
it's the same! Yay :)

```
# RAM sections are currently mapped into DTCM, a small but fast SRAM.
[outputs.ram]
address = 0x20000000
size = 131072
read = true
write = true
execute = false  # let's assume XN until proven otherwise
```

Ok, now that we've configured memory, let's try building!

```shell
$ cargo xtask dist app/fern/app.toml
...
error: Board is not supported by the task/net
  --> task/net/src/bsp.rs:29:9
   |
29 |         compile_error!("Board is not supported by the task/net");
   |         ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
...
```

Oof. Okay... well, we don't really need the `net` task anyways, so let's comment
it out. And `udpecho` while we're at it. The tasks we have now are:

* `user_leds`
* `ping`
* `pong`
* `uartecho`
* `hiffy`
* `jefe`
* `idle`
* `rng_driver`

```shell
$ cargo xtask dist app/fern/app.toml
...
    Finished release [optimized + debuginfo] target(s) in 33.54s
target/thumbv7em-none-eabihf/release/demo-stm32h7-nucleo -> target/demo-stm32h743-nucleo/dist/kernel
flash = 0x08000000..0x08800000
ram   = 0x20000000..0x20020000
sram1 = 0x30000000..0x30020000
Used:
  flash: 0x1e000 (1%)
  ram:   0x10000 (50%)
  sram1: 0x0 (0%)
warning: memory allocation is sub-optimal
Suggested improvements:
kernel:
  ram:    3360  (currently 4096)
```

:0 COOL! Honestly didn't expect it to build.

## Tasks

Hubris has a few tasks that we need to include as a baseline.

### Jefe

Jefe, as far as I can tell, is the task supervisor. It is responsible for seeing
if any tasks have failed and restart them.

### Hiffy

Hiffy is the task that is responsible for communicating with Humility, the
Hubris debugger. This will help us debug things once we flash our hardware.

### Idle

This is the task that gets run when there is nothing else to run. It has the
lowest priority of any task.

### Our tasks

> The goal is to have the display cycle through images whenever the button is
> pressed. The images will live on the SD card.

Given this as our goal, we have a couple of tasks to start on:

1. **LCD task**: this will handle interfacing with the screen for us. We will
   need to provide (somehow) the image for it to display
2. **SD Card task**: this is how we will interact with the SD card. We should
   write a similar API to the Unix file API (i.e. with file descriptors, read,
   write, etc)

We know that we'll need SPI for our LCD screen, so let's set that up. But first,
we need to do a little more house keeping.

## Cleaning house

I ripped out all the tasks except for `jefe`, `hiffy`, and `idle`. I also
switched the `board` at the top of our `app.toml` to be `weact-stm32h750` and
the `kernel` to be `fern`. This caused our build to break because of an issue in
compilation: an unsupported board. After poking around, I realized it was
because of a `compile_error!` macro in `app/fern/src/main.rs`, so I updated that
file to remove all instances of `demo-stm32h743-nucleo` from the `cfg_if!`
macros and replaced them with `weact-stm32h750`. This name seems to be arbitrary
and is just used with `cfg_if` stuff.

I also had to add `app/fern` to the root `Cargo.toml` under `workspace.members`.
And now we're back to building!

Test | Test2
-----|------
asdf | asdf
