---
title: "More about SD Cards than you (probably) wanted to know"
date: 2022-03-11T18:00:00-07:00
toc: true
draft: false
tags: ['firmware', 'electrical']
---

In order to understand how writing to an SD card works, you have to first
understand two things (or at least know what they are): SPI and filesystem
formats.

SPI is the communication protocol used by SD cards. They use a particular
protocol that sits on top of SPI (just above the physical layer in the OSI
model, like UDS for CAN) which dictates what data should be sent when, and how
the sender and receiver should respond and react to that data. SPI alone won't
work, you need to know what things to say in SPI. Think of it as SPI being a
language, and the SD card protocol is how to have a conversation in that
language (i.e. first you say "hi", then they say "hi", then you say "how are
you", then they respond with their status, etc etc).

Next, you need to know a bit about filesystems. In particular, FAT32, which is
an acronym for *File Allocation Table 32*, where the 32 comes from the fact that
the filesystem uses 32 bits of data to identify a cluster of data on a storage
device. A filesystem like FAT32 is basically a system for storing data to some
non-volatile memory (as opposed to RAM, which is volatile memory). FAT32 is
fairly space-efficient, and, importantly, it is cross-compatible with most
devices in the world, since most devices use them (your laptop might use
FAT32!).

In the SD card that we create, we'll use the FAT32 filesystem. This will allow
us to mount the SD card in our computer once it comes off the car. Additionally,
there are a number of libraries (meant for Arduinos) that understand how to
communicate with a FAT32-formatted SD card using SPI, so we'll probably use
those.

In particular, we should look into the [SdFat
library](https://github.com/greiman/SdFat), which is what the Arduino standard
library uses under the hood to communicate with SD cards. The
[arduino.cc](https://www.arduino.cc/en/Reference/SD) link in the Resources
column lists some examples, and there are also examples in the /examples folder
of the SdFat library linked.

## Super nerdy deep dive into SD cards

*Most of this is taken from [this
article](https://www.engineersgarage.com/avr-microcontroller/interfacing-sd-card-with-avr-microcontroller-part-38-46/).*

SD cards can be broken up into 2 main blocks: the **memory core** and the **SD
card controller**. The memory core is where the actual data is written and
stored, and where the filesystem exists. The SD card controller is basically
like a translator that interprets commands from SPI and interfaces with the
memory core. "It can respond to certain set of standard *SD commands* and read
or write data from the memory core in for the external device."

![SD%20Card%20Research%20cdcda324ff2f47439076ef39eb340c42/sd_diagram.gif](SD%20Card%20Research%20cdcda324ff2f47439076ef39eb340c42/sd_diagram.gif)

The capacity of the memory core is equivalent to the size of the SD card. Aside
from the memory core, there are registers that store the status of the SD card,
which are read-only (RO).

### Communicating with an SD card

You can connect an SD card either to an "SD bus", or to a SPI bus. An SD bus is
nice because it is much *faster*, however, most microcontrollers come with SPI
functionality, so SPI buses are more common. There is a standard set of "SD
commands" sent over the SPI bus (or the SD bus, if used) that allow data reads
and writes from the memory core. There are some SD commands that are
inaccessible from SPI (only accessible using an SD bus), but they aren't
critical.

### Functional layers of an SD card

There are 3 functional layers of an SD card:

1. Serial interface layer
2. SD commands layer
3. Filesystem layer

![https://engineersgarag.wpengine.com/wp-content/uploads/2019/07/Memory-Architechure-of-SD-Card.png](https://engineersgarag.wpengine.com/wp-content/uploads/2019/07/Memory-Architechure-of-SD-Card.png)

The serial interface layer and the SD command layer are a part of the SD
controller, and the filesystem layer is part of the ‘Memory core’.

### Serial Interface Layer

This is the layer in which we need to specify which communication bus we are
using: SPI bus or SD bus. The microcontroller can specify which device it wants
to communicate over SPI with using the correct CS, or chip-select, pin.

The following table lists the SD card pin and it's associated purpose. Following
the table, there is a diagram with the pin numbering:

[Untitled](https://www.notion.so/597e6a12e77a4619aba73d46a5018c5b)

![https://engineersgarag.wpengine.com/wp-content/uploads/2019/07/SD-Card-with-PIN-Out.jpg](https://engineersgarag.wpengine.com/wp-content/uploads/2019/07/SD-Card-with-PIN-Out.jpg)

[https://external-content.duckduckgo.com/iu/?u=http%3A%2F%2Fwww.theorycircuit.com%2Fwp-content%2Fuploads%2F2018%2F01%2Fmicro-sd-pinout.png&f=1&nofb=1](https://external-content.duckduckgo.com/iu/?u=http%3A%2F%2Fwww.theorycircuit.com%2Fwp-content%2Fuploads%2F2018%2F01%2Fmicro-sd-pinout.png&f=1&nofb=1)

SD cards usually operate at 3.3V, so a voltage regulator will be required for a
microcontroller operating at 5V (like most of our boards).

### SD Command Layer

There are a few standard commands that the SD card can understand, and they can
be used by the microcontroller to read registers, and read and write core
memory.

There are six registers in the SD controller:

[SD Controller
Registers](https://www.notion.so/4587be2ecbef4761b7d317ab6ef98b23)

### SD Commands

All SD commands are 6 bytes long. There is a CRC (cyclic redundancy check) in
the last byte to check for data correctness. The SD card ignores the CRC for
most commands except CMD8, unless the sender requests that the CRC be checked
each time. The commands generally follow this format:

![SD%20Card%20Research%20cdcda324ff2f47439076ef39eb340c42/sd_cmd.png](SD%20Card%20Research%20cdcda324ff2f47439076ef39eb340c42/sd_cmd.png)

A table containing all the SD commands can be found
[here](http://www.chlazza.net/sdcardinfo.html). I've left it out for brevity's
sake. It's worth a skim though.

### Responses

There are 3 basic responses from the SD card back to the microcontroller:

![https://engineersgarag.wpengine.com/wp-content/uploads/2019/07/SD-card-command-Response-1-in-SPI-Mode.png](https://engineersgarag.wpengine.com/wp-content/uploads/2019/07/SD-card-command-Response-1-in-SPI-Mode.png)

![https://engineersgarag.wpengine.com/wp-content/uploads/2019/07/SD-card-command-Response-2-in-SPI-Mode.png](https://engineersgarag.wpengine.com/wp-content/uploads/2019/07/SD-card-command-Response-2-in-SPI-Mode.png)

![https://engineersgarag.wpengine.com/wp-content/uploads/2019/07/SD-card-command-Response-3-in-SPI-Mode.png](https://engineersgarag.wpengine.com/wp-content/uploads/2019/07/SD-card-command-Response-3-in-SPI-Mode.png)

### Writing

There are two main write commands: **write block** and **write multiple block**.
A **block** is a consecutive chunk of 512 bytes of memory. If you wanted to
write the 2000th memory location, the command would look like:

1. First byte: 0x18 (write block)
2. 2nd-5th byte: 0x000007d0 (2000 in base 10 (argument)
3. 6th byte: CRC

You'll then receive an R1 response, so if there were no errors, you can start
sending data. You *must* send 512 data bytes, even if your data isn't that
large. The actual data is preceded by a data token, a byte with all the bits
except the LSB is set to 1 (0xFE). Then bytes 2-513 are the data bytes. Finally,
the last two bytes are a CRC.

### Reading

Reading is similar process to writing, you just use a different command number.
The errors associated are worth a look though:

![SD%20Card%20Research%20cdcda324ff2f47439076ef39eb340c42/sd_error.gif](SD%20Card%20Research%20cdcda324ff2f47439076ef39eb340c42/sd_error.gif)

This is the response byte from the SD card to the microcontroller. Not yet sure
what the CC Error and the Card ECC Failed things mean. Out of range likely means
that the the data you requested doesn't exist.

### Initializing

The following flow chart shows the initialization sequence for an SD card in SPI
mode.

![https://engineersgarag.wpengine.com/wp-content/uploads/2019/07/Algorithm-to-initialize-SD-card-in-SPI-mode-using-AVR.png](https://engineersgarag.wpengine.com/wp-content/uploads/2019/07/Algorithm-to-initialize-SD-card-in-SPI-mode-using-AVR.png)

### Filesystem Layer

The FAT32 filesystem is written to the SD card when the memory core is
formatted. The data of a file is scrambled around the memory core, and there is
a FAT (file allocation table) that holds the location of next block
corresponding to the location of the current block.

A memory core has 1 byte memory locations, and the locations are grouped into
"sectors". In FAT32, sectors contain 512 memory locations. Those sectors are
then arranged into clusters. The number of sectors per cluster varies.

FAT32 is arranged such that the first handful of sectors at the beginning of the
memory core are reserved for metadata and operations. The first sector is the
MBR, or master boot record. It holds metadata about the partitions inside the
file system.

Then, there are a number of unused and reserved sectors.

After that, there are the FATs. These are basically a bunch of look-up tables
that provide the information about where data is located. Because the files are
scrambled among the SD card, the file allocation tables are used to figure out
where a certain piece of data starts, and where to jump to next. After that
comes the data stored on the SD card.

# Resources

- [https://www.engineersgarage.com/avr-microcontroller/interfacing-sd-card-with-avr-microcontroller-part-38-46/](https://www.engineersgarage.com/avr-microcontroller/interfacing-sd-card-with-avr-microcontroller-part-38-46/)
- [https://github.com/greiman/SdFat](https://github.com/greiman/SdFat)
- [https://www.arduino.cc/en/Reference/SD](https://www.arduino.cc/en/Reference/SD)
