---
title: "Remote Embedded Development"
date: 2022-11-28T18:09:49-08:00
draft: false
---

I hate wires. Being a student of embedded systems for the last couple years, I
have had plenty of experience lugging wires around, finding and losing small
screw drivers for screw pin terminals, and plugging and unplugging dev boards
from debuggers.

In this post, I'll talk about how I found a low-cost solution to my woes and how
anyone can set up something similar.

---

## Background

While working on an embedded Rust project for a class, I found myself carrying a
small STM32H750 development board in my backpack, along with a USB cable, a
debugger, a USB cable _for_ the debugger, and lots of jumper wires. Anytime I
wanted to do work, I had to pull all of this out of my bag and reassemble it.
The more I did this, the more annoyed I became, until finally I carved out some
time to find a better solution.

In previous internships, there was a way to access hardware in a lab from my
laptop by accessing the company VPN and then `ssh`ing into a computer connected
to the hardware. I set out to create a similar setup in my dorm room.

My goal is to be able to debug and test hardware remotely as easily as I could
with the hardware in front of me. Of course, there are limitations: we don't
have any hardware-in-the-loop that would allow us to set and read analog and
digital signals, and any issues in hardware or hardware setup would require
access to the hardware. However, for working on an application or a bootloader,
it should be sufficient to have access to a debugger like GDB and the ability to
flash and run a serial console.

## Materials

I had a few Raspberry Pis lying around, so I installed RaspbianOS and connected
my debugger to the USB port on the Pi. I also connected the USB peripheral of
the dev board I am using to the Pi because the project I was working on used
USB, and I was able to use the USB port of the device to power the
microcontroller.

In addition, I had a USB web camera sitting in my desk drawer so I connected it
to the Raspberry Pi and set up a tool called [`motion`] which allows users to
expose a USB webcam as a live stream with a web interface. My configuration can
be found in [this GitHub Gist].

[`motion`]: https://motion-project.github.io
[this GitHub Gist]: https://gist.github.com/jack-greenberg/d73c71e51a8d00a9bffee68a027765df

With this, I was able to run the following command on Linux to pull up a window
with the live stream:

```sh
$ ffplay \
    -fflags nobuffer \
    -flags low_delay \
    -framedrop -strict experimental \
    <server_ip_address>:8081
```

This is incredibly useful for applications where you have visual elements like
LEDs or an LCD screen.

## Workflow

At the moment, my workflow looks like this:

1. Develop code locally
2. Use `cargo` locally to build a firmware image
3. Use `scp` to copy the built file to the Raspberry Pi using `ssh`
4. In an `ssh` session, use `probe-run` to flash and monitor the serial output
   from `defmt`
5. Rinse and repeat

The main issue with this workflow as of now is the number of steps and time that
it takes. There are a couple of things we can do to make the process more
seamless:

* Instead of having a separate `ssh` session open, we can just run `probe-run`
  from `ssh` directly--`ssh` defaults to just using the `$SHELL` of the server
  you are accessing, but you can actually run any command, like so:

  ```sh
  $ ssh user@server_ip 'probe-run --chip=STM32H750VB ./dfuh7'
  ```

* We can wrap the whole thing in a `cargo xtask`. `xtask` is similar to GNU
  Make in that you can use it to execute arbitrary commands during
  building/compilation. In a future post, we will explore `xtask` to do just
  this so that we can run `cargo xtask remote-flash` to build the firmware, copy
  the file to the server, and flash it.

## Extensions

There are a number of things we could build on to make an even better remote
setup. Right now, we don't have the ability to simulate digital/analog inputs
and outputs. Using an Arduino with a serial connection is a very cheap way of
creating a mini HiL (hardware-in-the-loop) simulator. When working on the high
voltage power distribution firmware for my college's Formula SAE team I used a
system like this to fully test the state machine that controlled power
distribution and precharge for our tractive system:

![](images/air-hil.jpg)

This system could simulate all the inputs and read all the outputs, for both
GPIO pins and the CANbus network that the target was connected to. As a result
of being able to do this testing, we had almost no integration issues between
firmware and the final version of hardware. Adding a Raspberry Pi to the mix,
even hooking it up to Github Actions to do automated hardware-based continuous
integration, and your systems will continue getting more and more robust!

### A brief _request for help_

One area that I am interested in exploring is a setup that allows for automated
testing, in-person development, _and_ remote development. The idea is that a
user can access the hardware in person by connecting various programmers and
dongles to their laptop, *or* they can remotely access it as it is connected to
a Raspberry Pi, ***or*** if it isn't being used by someone, it can be utilized
by an automated testing setup in continuous integration. This would allow for
full flexibility of an embedded workflow and would save on cost to not have to
have duplicated rigs.

I'm not totally sure about how to go about this though. There would probably
need to be some way of the user indicating that they are using the rig in
person, maybe a button or a switch or something. And the continuous integration
handler would need to be smart enough to know when the system was in use. If
anyone has any ideas, my email is on the [About](/about) page, so feel free to
get in touch!

## Conclusion

In the end, my remote embedded setup works great for me. There is a lot of
muscle-memory involved for now in terms of remembering the correct commands and
the correct order, but for now, I am able to work on my application remotely
just as efficiently as I would if I was still lugging the hardware around in my
backpack, so I consider it a success.
