---
title: "Using Rust's Xtask to Automate Remote Embedded Development"
date: 2022-12-11T23:39:26-05:00
draft: false
---

Cargo is an incredibly powerful tool. Not only does it manage building, running,
and testing code, but it also serves as a package manager. However, there are
limitations to Cargo. A tool like GNU Make provides a framework for running
arbitrary commands to complete tasks, but requires a lot of configuration,
whereas Cargo has a more limited scope but is effectively plug and play.

In this post, we'll look at [*xtask*], a tool that extends the functionality of
Cargo to execute arbitrary code written in---you guessed it---Rust.

[*xtask*]: https://github.com/matklad/cargo-xtask

---

One thing you will notice looking at the xtask repository is that there is *no
code*. Xtask isn't a library, it's a convention. To use it, you create a Rust
package called xtask in your repository. When you run xtask with `cargo xtask`,
it simply runs the `main.rs` file that you create in the xtask crate you
created.

Getting started is fairly easy. Your project will have to use the Cargo
*workspace* feature, which allows you to have multiple sub-crates in a single
parent crate. The xtask README has good instructions on how to do that. You will
create a member of your workspace called `xtask` and then in your
`.cargo/config.toml` file, you add the following:

```toml
[alias]
xtask = "run --package xtask --"
```

What this does is anytime you run `cargo xtask`, it will internally run 

```shell
cargo run --package xtask --
```

In your xtask crate, you create a `main.rs` file and fill that in with the
arbitrary code you want to run.

# An example project

For my embedded Rust independent study, I found myself doing a lot of [remote
embedded development]. I found myself constantly running the following commands
over and over in the same order:

[remote embedded development]: /posts/remote-embedded/

1. `cargo build ...`
2. `scp target/thumbv7em-none-eabihf/release/...`
3. `ssh user@ip.address probe-run ...`

Running this multiple times was annoying, and I wanted a way to automate it.
This is a perfect use-case for xtask! Let's set that up.

I went ahead and converted my project into a workspace and added a member called
xtask, creating the Cargo alias that let's me run `cargo xtask` and creating the
`main.rs` file.

In the xtask, I want to first compile the project, then copy it to the remote
server, and finally use probe-run to flash and debug the program. We'll start by
building it. The recommended way to do this is to use Rust's `Command` system to
invoke processes, similar to the Unix fork + exec. The API is fairly
straightforward. We'll first get the instance of Cargo that the user has
installed by checking for the `CARGO` environment variable, and then build the
command, execute, and read the result:

```rust
fn build() -> Result<(), Box<dyn std::error::Error>> {
    let cargo = env::var("CARGO").unwrap_or_else(|_| "cargo".to_string());

    let status = Command::new(cargo)
        .args(&["build", "--release", "--package=dfuh7", "--target=thumbv7em-none-eabihf"])
        .status()?;

    
    if !status.success() {
        Err("cargo build failed")?;
    }

    Ok(())
}
```

This creates an invocation of `cargo build` that we can use by just calling
`build()` in our `main` function in `xtask/main.rs`. In future iterations, it
would be fairly straightforward to pass the name of the package into the
function and create a more generic `build` function that can build multiple
different members of a workspace. This would also allow us to pass specific
arguments to `cargo build` depending on the package.

Next, we copy the file to a remote server, and we can do something similar:

```rust
fn copy(remote_host: str) -> Result<(), Box<dyn std::error::Error>> {
    let status = Command::new("scp")
        .args(&["target/thumbv7em-none-eabihf/release/dfuh7", format!("scp://{}", remote_host)])
        .status()?;

    
    if !status.success() {
        Err("Unable to copy file to server")?;
    }

    Ok(())
}
```

In future iterations, I would like to explore using `librsync`, which is a
protocol that improves upon the basic capabilities of `scp`. Additionally, there
is something a bit cleaner about using libraries directly instead of simply
invoking commands on the command line--it becomes simpler to handle and react to
errors.

Finally, we have to flash the file. This is slightly more complicated. Ideally,
we could use the [`probe-rs`], a library that provides the ability to flash and
debug firmware on an embedded target. However, because we are running our xtask
locally but want to execute flashing on a remote host, we can't just use this.

[`probe-rs`]: https://probe.rs/

We could use the `probe-run` CLI that ships with probe-rs through an SSH
session, but I was unable to get this working in the amount of time I had on
this project.

The other solution I started on was to set up an HTTP server on the remote host.
The idea is that a user can make a POST request with the binary as an attached
file, and the server would take the file and handle flashing the target. Then,
the output of the debugger could be streamed back to the local machine and
printed out. We would then no longer need to use `scp` or `rsync` to copy the
file over, and our xtask could simply build the file and then send an HTTP
request. In the near future, I'd like to continue fleshing out this idea, but in
the shorter term, I am having trouble getting the `probe-rs` library working on
the remote host.

---

In the end, I have a partially working system. I have been able to successfully
copy files to a server, using both `scp` and HTTP, but it was proving very
difficult to prototype the system where the remote host uses `probe-rs` to flash
the firmware and send the debugging output back to the local machine. This is
one of the difficulties I find with Rust---it's hard to create simple prototypes
because the language lends itself to highly robust and complete systems. This is
of course great for production code, but it makes quick experiments more
challenging.

In the future, I plan to spend more time working on my remote flashing tool.
Ideally I would like to create a system that is generic enough that in can be
deployed on different remote hosts with multiple embedded targets attached.
