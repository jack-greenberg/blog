---
title: "Three levels of blinky"
date: 2022-06-13T20:00:07-07:00
draft: true
toc: true
---

The first program that most people learning firmware development will write is
_blinky_. It is the equivalent of software's "hello world". In this post, we
will explore a few different ways of writing a blinky program in increasing
complexity.

## 0. Blink 😉

The program we will write will simply blink and LED on or off once per second.
I'll be using examples drawn from the Olin Electric Motorsports monorepo.

The fundamental operation of an LED is the GPIO peripheral, which stands for
_general purpose input/output_. GPIO pins are able to be set to either 5V or 0V
(ground), and are most often used to encode binary signals (i.e. on/off).

## 1. Libraries

The simplest way to write a blinky program is to use a library to abstract the
hardware functionality. Let's start there. In order to use code in a library, we
must first import it:

```c {linenos=table}
#include "libs/gpio/api.h"
#include "libs/gpio/pin_defs.h"

#include <util/delay.h>

```

Line __1__ imports the functions we will use that will help us configure the GPIO
pins. Line __2__ is a file that creates individual definitions for all of the
pins for ease of readability.

In line __4__, we import a library that is _unique_ to AVR microcontrollers[^1].
We include this library to give us access to the function `_delay_ms()`, which
will allow us to put a pause in our blinky program.

[^1]: By _unique_, I mean that you won't be able to use it, for example, in ARM
  microcontrollers.

## 2. Application Structure

```c {linenos=table, linenostart=6}
int main(void) {
    gpio_t LED = PB0;

    // TODO
    
    while (1) {
        // TODO
    }
}
```

We have our `main` function, which gets called when the device starts up. Inside
`main`, we will have some lines that initialize the system and thus only called
once, and then we will have a `while` loop that runs ad infinitum (forever).

In line __6__, we declare a variable called `LED` and assign it to `PB0`. `PB0`
is a _macro_ that expands into a C struct that contains all of the information
needed to identify a GPIO pin on the microcontroller[^2]. This allows us to
refer to the pin as simply `LED` when we use it in functions, which makes our
code more readable and makes it easier to update the code if, for example, we
ship new hardware that moves the LED to a different physical pin.

[^2]: That information is the offset of the pin in it's port (i.e. PB**0** vs
  PB**4**), and the memory offsets of the DDR, PORT, and PIN registers.

## 3. Initialization

Now we'll add in code for the initialization of our program. Recall that this is
the code that we only need to run once. Things you'll usually find in
initialization are:

* `X_init` functions that initialize peripherals like CAN or SPI
* Setting the correct configuration of GPIO pins
* Running initial checks on a system to determine the state when the device
  turns on and the program runs

```c {linenos=table, hl_lines=[4], linenostart=6}
int main(void) {
    gpio_t LED = PB0;

    gpio_set_mode(LED, OUTPUT);
    
    while (1) {
        // TODO
    }
}
```

In line 9, we add a call to the `gpio_set_mode` function. In the most basic
sense, we can configure a GPIO pin as an _input_, meaning you can read from the
pin, or an _output_, meaning you can set the value of a pin as high or low.
(There are a few additional configurations like high-impedance and pull-up
enabled, but we won't get into that right now.) Because we want to drive the
LED, we set the pin to be an output.

## 4. Loop

Now we get to the "meat" of the application.

```c {linenos=table, hl_lines=["7-10"], linenostart=6}
int main(void) {
    gpio_t LED = PB0;

    gpio_set_mode(LED, OUTPUT);
    
    while (1) {
        gpio_set_pin(LED);
        _delay_ms(500);
        gpio_clear_pin(LED);
        _delay_ms(500);
    }
}
```
