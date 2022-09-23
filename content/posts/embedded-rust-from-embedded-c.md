---
title: "Embedded Rust From Embedded C: Peripherals"
date: 2022-09-20T17:09:37+02:00
draft: false
---

As an embedded C developer, I have become entrenched in the ways of the
language. Things like using structs to access registers or [opaque pointers] for
passing data around[^1]. Rust provides a whole new memory model that makes
writing _any_ program safer at no extra cost. In the next few posts we'll
explore some of the patterns that make embedded Rust special and compare them to
how things are done in C.

[opaque pointers]: https://interrupt.memfault.com/blog/opaque-pointers
[^1]: Basically object-oriented code in C

## Peripherals

In microcontrollers, we interface with the modern world using peripherals like
GPIO, ADCs, and serial communication like SPI and I2C. In order for a program to
interact with these peripherals, we read from and write to sections of memory
that are divided up as registers. In C, we might represent the registers using a
struct where each member of the struct is a bitfield for the different bits in
that register.

### C

As an example, let's look at the `SPI_CFG1` register. It has an address
offset of `0x08` from the base of `0x40013000`, so the address of the memory for
that register is `0x40013008`. Bits 0-4 indicate the number of bits in a SPI
message, whereas bit 15 enables the DMA (direct memory access peripheral) stream
for TX (message transmission). In C, we represent the register like so:

In C, this might look like:

```c
struct SPI_CFG1_s {
    uint8_t DSIZE : 5; // Number of bits in a SPI message
    uint8_t FTHLV : 4; // ...
    ...
    uint8_t TXDMAEN : 1; // Enable DMA Stream for TX
} SPI_CFG1;
```

Then we can access it like so:

```c
SPI_CFG1.DSIZE = 0b00011;
```

### Rust

Rust also uses structs to represent the registers, but it uses Rust's ownership
model to make this a bit safer. The idea is that you get variables that have
ownership of certain aspects of the microcontroller. At the highest level, the
Peripherals structs give access to the entire microcontroller[^2]. We then start
accessing members of those structs and calling functions like `constrain()` and
`freeze()` on them.

[^2]: There are two top-level structs we use: the `cortex_m::Peripherals` and
  `pac::Peripherals`. The former is for things specific to Cortex M
  microcontrollers, like the SysTick timer and Nested Vector Interrupt
  Controller (NVIC). The latter gives access to the other peripherals like
  timers, GPIO, ADC, etc.

```rust
let pwr = dp.PWR.constrain();
let pwrcfg = pwr.freeze();
```

This took some time to understand, but essentially `constrain` consumes the
`dp.PWR` struct (a member of the device peripherals that represents all the
registers corresponding to power management in the chip) and gives access to the
HAL crate's Pwr struct, which contains some helpful abstractions that take care
of reading and writing registers for you. Once the system has been configured,
you call `.freeze()` to consume the struct to prevent further writes to the
configuration.

The `freeze` method will return an instance of a struct that contains all of the
configurations so that they can be used by other initialization. For instance,
you need to use the PowerConfiguration struct (the outcome of calling `freeze`
on the `pwr` struct above) to set up the Core Clock Distribution and Reset
(CCDR) system that allows you to enable power and clocks to other peripherals
like GPIO.[^3]

[^3]: This brings up the question: "What if I want to modify the configuration
  after?" to which I say maybe you need a new system design. But it is still
  possible to use the PAC (peripheral access crate) to change things if you
  really need to. But... really?

These methods ensure that your peripherals that have dependencies (like GPIO on
PWR and RCC) will be able to be configured and used properly. All of these
checks happen at compile time, not at runtime. As a result, your program has no
additional overhead but is still more robust.

### Next time

In the next post, we'll explore traits and abstractions that make writing code
easier and more generalizable! In the meantime, here are some good resources to
check out that helped me a lot:

* [Brave new I/O]: A more thorough introduction to embedded Rust's approach to
  microcontroller code.
* [Learn modern embedded Rust]: A list of resources (very meta) for learning
  embedded Rust!
* [Rust embedded ecosystem and tools]: A list of tools to make embedded Rust
  easier and smoother
* [Demystifying Rust Embedded HAL Split and Constrain Methods]: An informative
  post about `.split()` and `.constrain()`.
* [Blinky with a ton of comments]: A GitHub gist I wrote that contains a program
  to blinky an LED on a [WeAct Studio Dev Board] with almost every line
  commented in detail.

[Brave new I/O]: https://blog.japaric.io/brave-new-io/
[Learn modern embedded Rust]: https://github.com/joaocarvalhoopen/How_to_learn_modern_Rust#embedded-rust
[Rust embedded ecosystem and tools]: https://www.anyleaf.org/blog/rust-embedded-ecosystem-and-tools
[WeAct Studio Dev Board]: https://www.adafruit.com/product/5032
[Blinky with a ton of comments]: https://gist.github.com/jack-greenberg/1ad01de50bb7ce3f76c9a3cbf9f66c97
[Demystifying Rust Embedded HAL Split and Constrain Methods]: https://dev.to/apollolabsbin/demystifying-rust-embedded-hal-split-and-constrain-methods-591e
