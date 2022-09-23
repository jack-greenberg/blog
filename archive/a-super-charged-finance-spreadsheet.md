---
title: "A super-charged finance spreadsheet"
date: 2021-08-04T23:14:21-07:00
draft: true
---

I've spent the last few months working on a Google Spreadsheet to track my
spending and income. It's incredibly verbose, but it allows me to calculate
useful metrics and is very extensible. In this post I'll dive into some of the
features, highlight some interesting techniques, and discuss a few plans I have.

![]()

## Why not use X or Y?

Before January 2021, I used Intuit's Mint to track my finances. But I continued
having issues with accounts falling out of sync. There was no easy way for me to
take control of my data. It was nice to have all of my transactions in one
place, but it couldn't account for things like cash. And categorizing all the
transactions manually was painful to say the least.

So I decided to make my own tool. I poked around other solutions, but none met
my needs.

There's no one-size-fits-all spreadsheet. People have different goals, whether
it's paying off debt, acheiving [financial independence](TODO://reddit), or
retiring early.  Most of the spreadsheets and tools I found online didn't really
fit my use-case, which is just a tool to track my spending and see where my
money is going and what my net-worth is.

## Ew... spreadsheets

Software engineers love to hate on spreadsheets. At least, I did before I
started this project. But I've grown to appreciate spreadsheets. Not a week goes
by that I don't think about rewriting the project as a cross-platform native app
with a Rust backend and some fancy theming, but I'm prevented by the one
commodity more valuable than money: time. Who has time to build and test the
whole thing? Certainly not me.

The alure of spreadsheets lies in their simplicity and low barrier of entry.

> Well, spreadsheets were the original low-code tool ...  They don’t have a
> complex tool chain or a compile step. You don’t have to “run” your spreadsheet
> to see the results.[^1]

[^1]:[simplethread.com](https://www.simplethread.com/use-spreadsheets-everywhere/)

## Transactions

Date     |Name        |Amount |Account
---------|------------|-------|-------
8/5/2021 |Testing 1234| $12.43|Checkings
8/5/2021 |            |-$12.43|Dining
