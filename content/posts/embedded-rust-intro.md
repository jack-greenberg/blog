---
title: "Embedded Rust Landscape"
date: 2022-10-03T16:18:56-04:00
draft: true
---

Embedded systems development is challenging. When working in C, there is a lot
of overhead in putting together a build system, finding libraries for
interacting with peripherals, and figuring out how to put it all together and
flash a microcontroller. Futhermore, there are so many microcontrollers, many of
which differ only slightly from one another.

Rust presents intriguing solutions to all of these projects, some of which are
more effective than others. In this post, I'll talk about three areas in which
Rust innovates in the embedded development space: **tooling**, **peripheral
libraries**, and **code structure**.

---

## Tooling

One cannot talk about Rust and tooling without talking about *Cargo*, the Rust
Swiss Army Knife tool. Officially,

> Cargo is the Rust package manager. Cargo downloads your Rust package's
> dependencies, compiles your packages, makes distributable packages, and
> uploads them to crates.io, the Rust community’s package registry.

However, Cargo's extensibility allows it to be so much more than that. In the
embedded space, we are often concerned with four major tasks:

1. building,
2. flashing, 
3. testing, and
4. debugging.

Cargo allows us to do all of these---and more---while only invoking a single
command `cargo` and configuring the system using the `Cargo.toml` file.

When we want to build our code, we can simply call `cargo build`. No need to
specify complicated compiler flags. This significantly shortens the overhead to
getting compilable code.

For flashing, the `cargo-flash` package allows us to invoke `cargo flash
--chip=X`, where `X` is the microcontroller we are targeting. The tool will take
care of invoking the proper subcommands (i.e. `openocd`) for us.

When it comes to testing and debugging, once again, Cargo can be used to
streamline our development process. In a future post, I'll chat about using
Cargo for remote development and debugging of embedded systems.

In addition to Cargo, there are tools like [`probe-rs`] that provide debugging
support. A lot of the tooling is supported by [Knurling], a project by Ferrous
Systems, whose goal is to "improve the embedded Rust experience."

The primary advantage to this ecosystem of tools is that all of the setup and
configuration is straightforward and well-documented. This contrasts with the
majority of tooling surrounding embedded C: if you aren't using a complicated
and slow IDE, the tools you use take time and careful integration with the build
system you already use, making the lead times much higher.

---

## Peripheral Libraries

---

## Code Structure
