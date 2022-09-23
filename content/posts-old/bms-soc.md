---
title: "Bms Soc"
date: 2022-07-25T07:50:27-07:00
toc: true
draft: true
---

Have you ever wondered how your phone knows what battery level it's at? Maybe when it's almost dead, but you've been at 1% for 20 minutes now.

<img src="/images/battery.jpg" width="50%" />

Well, until recently, I assumed that calculating the state of charge for a
battery was easy!

I was wrong.

What follows is my journey through understanding the complicated concept of
_state of charge estimation_ for lithium-ion battery cells. You can expect a bit
of electrical engineering and a bit of math, but I'll do my best to keep things
understandable the whole time!

---

# Day 1: Coulomb counting

Batteries store energy.

---

# Day 2: Kalman Filter

> All models are wrong, but some are useful.
> - One of my college professors
