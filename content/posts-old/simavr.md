---
title: "Debugging a segfault in SimAVR"
date: 2022-06-11T00:01:58-07:00
toc: true
draft: true
---

## What is simavr?

> a lean, mean and hackable AVR simulator for linux & OSX

SimAVR is a simulator. It has support for a number of microcontrollers that use
the AVR architecture. I noticed that it has support for the ATmega16m1, which is
a microcontroller used on my [FSAE team]. I decided to give it a shot with one
of our firmware images.

[FSAE team]: https://www.olinelectricmotorsports.com

# Setup

I started off by cloning the [repository] and building everything using `make`.
I then used the default CLI `run_avr` to run my ELF binary in the simulator:

[repository]: https://github.com/buserror/simavr

```shell
$ ./run_avr -f 4000000 -m atmega16m1 -g ~/path/to/binary.elf
Loaded 6072 bytes at 0
Loaded 136 bytes at 800100
[1]    511243 segmentation fault (core dumped)  ./simavr/run_avr -m atmega16m1 -f 4000000
```

:disappointed: Sad. Well, let's use valgrind to see if we can get to the bottom
of this.

```shell
$ valgrind ./run_avr -f 4000000 -m atmega16m1 -g ~/path/to/binary.elf
...
==511402== Invalid read of size 8
==511402==    at 0x4857116: avr_register_io_read (sim_io.c:64)
==511402==    by 0x4861623: avr_uart_init (avr_uart.c:536)
==511402==    by 0x485E1C9: avr_lin_init (avr_lin.c:101)
==511402==    by 0x4868ADB: mxm1_init (sim_megaxm1.c:38)
==511402==    by 0x485B6E4: avr_init (sim_avr.c:120)
==511402==    by 0x10955D: main (run_avr.c:247)
...
```

Okay! Theres a clue: an invalid read. In `sim_io.c:64` we see:

```c
	if (avr->io[a].r.param || avr->io[a].r.c) {
```

So an invalid read... My guess is the `avr->io[a]` access. What is `a`?

```c
void
avr_register_io_read(
		avr_t *avr,
		avr_io_addr_t addr,
		avr_io_read_t readp,
		void * param)
{
	avr_io_addr_t a = AVR_DATA_TO_IO(addr);
```

`AVR_DATA_TO_IO` effectively just maps the `addr` to an address in IO memory,
which just means subtracting 32 (`0x20`). So whatever address we are accessing,
doesn't exist.
