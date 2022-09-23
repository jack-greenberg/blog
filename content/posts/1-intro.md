---
title: "Intro to Embedded Rust"
date: 2022-09-13T10:25:46-04:00
draft: true
---

This semester I am doing an independent study in embedded Rust. The deliverables
are frequent blog posts. This is the first of those.

---

## Safety-Critical Embedded Systems

Embedded systems in general is a fairly vast ecosystem. There are tons of
microcontrollers each with different architectures, lots of different code
libraries, tools, and debugging methods.

Most embedded code is written in C. A large portion of that is _safety critical_
code, including medical devices, aerospace, and automotive applications.
However, time and again, C has proved to be unsafe. It is easy to write code
that is susceptible to memory faults and race conditions.

As a result, the safety-critical code industry has developed standards like
MISRA and AUTOSAR along with tooling like static analyzers. These auxiliary
guidelines and tools are designed to catch unsafe code before it is deployed to
the real world.

In the early 2000s, a group of engineers at Mozilla started working on a new
programming language that was meant to replace C as the standard for systems
software programming. Over the last 16 years, that language evolved into
__Rust__.

Rust has almost all the same capabilities as C, but utilizes a powerful
compiler, type system, and memory model to make compile-time guarantees about
the safety of the code. For example, Rust's use of ownership ensures that there
are a variable always has exclusive write-access to a piece of data.

But this blog isn't about Rust. It's about _embedded_ Rust.

## A new embedded language

Embedded Rust is still a fairly volatile space. Standards of writing code change
week-to-week and new tools are constantly developed. However, the vast amounts
of tooling developed for writing safe embedded C code aren't needed, so the
ecosystem of tools is smaller and easier to use.

### Cargo

While not specific to _embedded_, Cargo is Rust's package manager and build
system. It is also highly extendable. By default, Rust binaries can be "built"
(i.e. compiled) and "run" (compiled and executed).

#### `cargo-flash`

Binaries that target embedded systems need to be "flashed", or uploaded to the
board they are meant to run on. [`cargo-flash`] is a plugin for Cargo that lets
a developer run `cargo flash` which will compile and upload their program to the
target device. It is configured to use a specific tool, like `openocd` or
DFU[^1].

[`cargo-flash`]: https://github.com/probe-rs/cargo-flash
[^1]: Device-firmware-update

#### 
