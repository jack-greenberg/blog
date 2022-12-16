---
title: "Reflection on Embedded Rust"
date: 2022-12-12T11:15:07-05:00
draft: false
---

This semester I decided to embark on an independent study of embedded Rust.
Having worked extensively in C, I wanted to explore a new frontier of embedded
systems. After three months and a handful of projects, I have come up with a few
main takeaways:

1. The tooling ecosystem for embedded Rust makes writing, testing, and debugging
   code far simpler than the tooling ecosystem for C.
2. Rust's patterns of traits and implementations makes for more idiomatic
   embedded systems that lend themselves to different hardware platforms.
3. Both Rust and C are appriopriate languages for embedded systems, but Rust has
   the additional complexity because of things like borrow-checking and
   lifetimes which make development more difficult for C developers.

In this post I'll dive into each of the three categories, talking about my
experience and where I'll be going from here.

---

## 1. Tooling Ecosystem

I'll start with a story.

I few years ago, I was working on a project for Principles of Integrated
Engineering, a course taught at Olin in which students team up to create
integrated systems with mechanical, electrical, and firmware components. I was
working on a gantry system and I was the RE (responsible engineer) for firmware.

I was fairly comfortable with C at this point from an internship, so I decided
that I would ditch the default Arduino setup that other teams took and use an
STM32 Blue Pill, which has a 32-bit ARM Cortex M3 microcontroller. I also wanted
to further challenge myself by integrating CMake (a build system I hadn't used
before), FreeRTOS, and use peripheral drivers from libopencm3.

The setup was nightmarish. It took two weeks just to get compiling code. Between
setting up the build chain, finding all the correct linker flags, getting all
the correct code linked in, and setting up the tools to flash, I barely had time
to work on the actual application.

Now compare this with the [setup for Rust]. Cargo alone is a complete game
changer. A single tool that can be used for compiling, running, flashing,
testing, and debugging code, not to mention seamlessly integrated package
management and cross-compilation---it puts C to shame.

[setup for Rust]: posts/new-microcontroller-rust/new-microcontroller-rust/

With templates like `cortex-m-quickstart`, the time between concept and running
firmware is far lower than any tooling provided for embedded C.

This is one of the best features of Rust. For my capstone, I am working with a
partner on a firmware image that implements motor control via trapezoidal
commutation, and it took less than an hour to get some initial code with all the
correct hardware setup. And the ease of setting up hardware and writing the code
brings me into the next topic...

---

## 2. Rust's Features

One area of Rust that is incredibly promising is *traits* and *implementations*.
Imagine working with a piece of hardware that has an LCD screen attached to it.
These are very complex pieces of hardware, and when writing C, it can be
incredibly difficult to do any complicated graphics given the difficulty of
writing a driver for the chip and then writing a layer that processes graphics
which utilizes your chip driver.

Rust has a crate called `embedded-graphics` that manages that upper layer. You
can very easily create objects representing text, images, and shapes. For the
chip-driver layer, `embedded-graphics` provides a trait, where any struct that
implements the required members of the trait can seamlessly display the text or
shapes that you have created.

This creates a separation of hardware logic from so-called "business logic".
Maybe the chip you are using to drive the LCD screen is out of stock. No
worries, you can simply find a new chip, develop the driver (likely one already
exists and has a crate) and implement the `embedded-graphics` trait, and
voila! You have a working LCD screen displaying the same thing as was on your
old chip. In this way we have very stack-able code in Rust. Traits and
implementations define the interface between two layers of a software stack, and
different instances of those layers can be swapped out depending on the
circumstance.

I experienced this first-hand when working on the device firmware upgrade (DFU)
[bootloader] for the STM32H750. I was able to find a crate that provided a trait
called `DFUMemIO`. I created an implementation of that trait that used QSPI and
USB to perform the flashing, and just like that I was able to create a
bootloader.

[bootloader]: https://github.com/jack-greenberg/dfuh7

---

## 3. Rust's Complexity

While there is a lot to love about Rust, I would be remiss if I didn't mention
the downsides. At the beginning of this article, I mentioned that the ease of
tooling and how that lets developers focus more on the writing the application.
However, in my experience, the time gained by not worrying about tooling is made
up for by struggling with Rust's compiler.

People in the Rust community often call this "fighting with the borrow-checker".
Rust's feature of borrow checking and lifetimes are incredibly powerful and lead
to safer applications from a memory and concurrency standpoint, but for the
uninitiated, this can be incredibly difficult to navigate.

Let's take an example of how a straightforward concept, simple (yet dangerous)
to execute in C, is much more convoluted in Rust.

Say I have some global struct that I'd like to access. Maybe it contains data
for a driver. In C, we can simply declare it in the global scope:

```c
struct DriverInfo {
    uint32_t data_a;
    uint8_t data_b;
};

struct DriverInfo drv = {
    .data_a = 0,
    .data_b = 0
};

void foo(uint32_t new_value) {
    drv.data_a = 1;
}

int main(void) {
    drv.data_a = 12;

    for (;;) {
        foo(2);
        // ...
    }
}
```

In Rust, this is much more difficult. The declaration of our global object looks
like this:

```rust
static mut drv: Mutex<RefCell<Option<DriverInfo>>> =
    Mutex::new(Refcell::new(None));

fn main() {
    let mut drv = ...;

    unsafe {
        interrupt_free(|cs| {
            drv.borrow(cs).replace(Some(drv));
        });
    }
}
```

The method used in Rust is far more complex than in C. We have to use an
`Option`, a `RefCell` ("[a] mutable memory location with dynamically checked
borrow rules"), and a mutex (allows for access in an interrupt context or across
threads). Because `drv` is a global, static mutable, any attempt to write or
read requires an `unsafe` wrapping because the compiler cannot verify that
accessing it will always be deterministic.

Rust trades verbosity for safety. This is arguably a great deal, but it means
that a lot of research and pattern matching is needed to write embedded Rust
code. Luckily, there are already lots of great resources and examples for doing
almost anything in embedded Rust, so with enough patience, anything is possible.

---

My journey learning embedded Rust has been incredibly fruitful. I am by no means
an expert in embedded Rust, but I can already see myself using it in future
projects (in my senior capstone, I am working on an embedded controls
application written in Rust). Hopefully, the more time I spend with Rust, the
less I will have to fight with the compiler and the more I will understand the
complexity of safely managing memory.
