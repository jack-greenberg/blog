---
title: "Getting started with <MICROCONTROLLER> in Rust (Part 2: Blinky)"
date: 2022-10-05T16:18:56-04:00
draft: false
---

In my [previous post], I went over the setup and configuration of an embedded
application in Rust, trying to stay as generic as possible but provide specific
examples. In this post, I'll focus a little closer on the specific
microcontroller I am using, but try to generalize where possible.

[previous post]: /posts/new-microcontroller-rust/new-microcontroller-rust/

Today, we'll work on getting a blinky program running. We'll start by creating
the basic structure of all embedded applications (a `main` function with an
infinite loop). Next, we'll go over the initialization code that sets up our
hardware, followed by filling in our infinite loop so that we can blink an LED.

On the board I am using, there is an LED connected to pin PE3, so that is what
we will be blinking. The goal is to have a program that turns the LED on for
half a second and then turns it off for half a second.

---

As you will recall from Part 1, we started with the `cortex-m-quickstart`
template for our application. Cleaning up some of the comments, our
`src/main.rs` file looks like this:

```rust
// src/main.rs

#![no_std]
#![no_main]

use panic_halt as _;

use cortex_m::asm;
use cortex_m_rt::entry;

#[entry]
fn main() -> ! {
    // Init
    asm::nop();

    loop {
        // TODO: Fill me in
    }
}
```

We have our basic embedded application architecture with an [entry-point] (`main`), space
for initialization code, and an infinite loop.

[entrypoint]: https://twitter.com/jackgreenb/status/1572328501692305418?s=20&t=Z4xmnQe7G4iwrupgeeD2Dg

Let's start filling it in.

## Initialization

In our initialization, we need access to the _device_ peripherals like the power
configuration and GPIOs (unique to the microcontroller), as well as the _core_
peripherals (unique to Cortex-M devices) like the NVIC and SysTick timer:

```rust
// Device peripherals (i.e. GPIO)
let dp = pac::Peripherals::take().unwrap();

// Core peripherals (i.e. NVIC)
let cp = cortex_m::Peripherals::take().unwrap();
```

In order to access peripherals like GPIO, we need to enable them. In order to
enable them, we need access to the internal clock on the microcontroller. We do
that by accessing the **RCC** (reset and clock control) struct. We will also
need to use the **PWR** (power) struct in order to configure the clocks, as
instructed by the [documentation]:

[documentation]: https://docs.rs/stm32h7xx-hal/latest/stm32h7xx_hal/rcc/index.html

> [RCC] peripheral must be used alongside the PWR peripheral to freeze voltage
> scaling of the device.

```rust
let pwrcfg: stm32h7xx_hal::pwr::PowerConfiguration = dp.PWR.constrain().freeze();
let rcc: stm32h7xx_hal::rcc::Rcc = dp.RCC.constrain();
```

On other microcontrollers, the clocks may have a different model for
configuration. Check the examples and documentation for your HAL to get an learn
more. The following code was adapted from the [examples] in the `stm32h7xx-hal`
library.

[examples]: https://github.com/stm32-rs/stm32h7xx-hal/tree/master/examples

I was initially confused by `.constrain()` and `.freeze()`. It took a bit of
digging, but I came across [a great article by Jorge Aparicio] about the model
that Rust uses to interact with hardware peripherals (see the **Aside** for more
details).

[a great article by Jorge Aparicio]: https://blog.japaric.io/brave-new-io/

> ### Aside: Hardware Peripherals in Rust
>
> In a nutshell, embedded Rust utilizes the ownership model for controlling
> access to peripherals.
>
> Starting with a concrete example, when we access `dp.RCC`, we are accessing a
> struct with a bunch of members that represent the parts of the RCC registers
> in our microcontroller. In C, we configure the RCC hardware block by writing
> to those registers. We do a similar thing in Rust, except it's abstracted for
> us.
>
> Calling `.constrain()` "consumes the original `RCC` which granted full
> access to every `RCC` register" and only allows us to modify aspects of the
> register defined in a struct called **`Parts`** (it's not crucial to know what
> is in `Parts`). In "consuming" a struct, we ensure that after configuration,
> we can no longer use the original `dp.RCC` struct, and must instead use the
> members of the `Parts` struct.
>
> When we call `.freeze()`, we consume the `Parts` struct, preventing further
> modification of struct and thus the peripherals. This ensures we don't have
> multiple places in our code trying to change the configuration of peripherals.
> Note that there are some peripherals that return a new object after calling
> `.freeze()` because there are parts that make sense to modify during the
> runtime of the device.

OK, back to blinky. We gain access to the CCDR (Core Clock Distribution and
Reset) struct using the RCC, PWR, and SYSCFG registers. (If this sounds like a
lot, don't worry--**it is**. I don't fully understand each and every register we
are writing to. Most of this code is copied and pasted from the [HAL examples]
and slightly tweaked until I got things working.)

[HAL examples]: https://github.com/stm32-rs/stm32h7xx-hal/tree/master/examples

```rust
let ccdr: stm32h7xx_hal::rcc::Ccdr = rcc
    .sys_ck(96.MHz())
    .pclk1(48.MHz())
    .freeze(pwrcfg, &dp.SYSCFG);
```

The above code sets up the main clocks in the microcontroller at the given
frequencies, and then "freezes" the configuration so that it can't be modified.

This is the last bit of code we need for initializing the microcontroller
itself. Next, we will look at setting up GPIO specifically and blinking the LED.

## Configuring GPIOs

There are a number of GPIO "pin banks" in the STM32 microcontrollers. They are
in a group of 16 pins and each group is assigned a letter. So you might 16 pins
on Port A, labeled `PA0`, `PA1`, ..., `PA15`. To access individual pins, we have
to "split" the GPIO group:

```rust
let gpioe = dp.GPIOE.split(ccdr.peripheral.GPIOE);
```

The LED on our board is connected to Port E, pin 3 (`PE3`), hence using `GPIOE`.
We can use the `gpioe` variable to access the individual pins like so:

```rust
let mut led = gpioe.pe3.into_push_pull_output();
```

We now have a variable that represents the pin our LED is attached to. We set it
to be _push/pull_ as opposed to _open drain_. The difference isn't important for
this post.

In order to blink the LED, we need to be able to delay for a certain amount of
time. Luckily, there is a helpful abstraction we can use: `delay::Delay`! This
is a struct with methods that allow a developer to insert arbitrary-time-length
delays into their code:

```rust
let mut delay = delay::Delay::new(cp.SYST, ccdr.clocks);
```

## Loop

Now we have our LED variable and our delay variable, and that is all we need to
do for initialization! After all that, we implemenet a simple 2 line loop:

```rust
loop {
    led.toggle();
    delay.delay_ms(500_u16);
}
```

We toggle the LED and we delay for 500 milliseconds!

## Zooming back out

In all honesty, this was a pretty large effort. It took a while to understand
how the `.constrain()`, `.freeze()`, and `.split()` methods worked. On top of
that, some of the code examples I found online were outdated and didn't compile
straight out of the box.

The code to get blinky running is also substantially longer than the code would
be in C. However, as I would come to learn after trying a few more advanced
things that I'll cover in subsequent posts, the advantages of Rust are truly
enough to make me never want to write embedded C again.

The whole I/O system that Jorge Aparicio discusses in his blog post (linked
above and at the end) is quite nice. Rust's use of generic types and traits also
means that code is quite easy to port over. As I will explore in the next post,
abstractions make things very easy when you have complicated systems, such as an
LCD screen driven by an external chip using SPI _and_ GPIOs.

The next post will go into writing a simple program to display an image and text
on the little LCD screen of my dev board. It turns out to be far simpler than I
originally thought it might be :sweat_smile:

## Artifacts and Resources

* [Blinky with a ton of comments]: This is the same blinky I wrote about in this
  post, but with lots of comments on every line.
* [Brave new I/O]: A more thorough introduction to embedded Rust's approach to
  microcontroller code.
* [Learn modern embedded Rust]: A list of resources (very meta) for learning
  embedded Rust!
* [Rust embedded ecosystem and tools]: A list of tools to make embedded Rust
  easier and smoother
* [Demystifying Rust Embedded HAL Split and Constrain Methods]: An informative
  post about `.split()` and `.constrain()`.

[Blinky with a ton of comments]: https://github.com/jack-greenberg/embedded-rust-isr/blob/main/blinky/src/main.rs
[Brave new I/O]: https://blog.japaric.io/brave-new-io/
[Learn modern embedded Rust]: https://github.com/joaocarvalhoopen/How_to_learn_modern_Rust#embedded-rust
[Rust embedded ecosystem and tools]: https://www.anyleaf.org/blog/rust-embedded-ecosystem-and-tools
[WeAct Studio Dev Board]: https://www.adafruit.com/product/5032
[Demystifying Rust Embedded HAL Split and Constrain Methods]: https://dev.to/apollolabsbin/demystifying-rust-embedded-hal-split-and-constrain-methods-591e

---

In the next post, I'll go over the *debugging* ecosystem of embedded Rust and
we'll work on debugging our program by adding different bugs and using different
methods to find them.
