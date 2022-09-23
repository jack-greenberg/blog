---
title: "Low-code and Convenience or: How I Learned to Stop Worrying and Love the Spreadsheet"
date: 2021-08-28T10:05:53-04:00
toc: true
draft: true
---

---

_Over the last year I have been hard at work on a tool to track my finances and
take better control over them. I'll talk more about it in another piece, but
this one just highlights a lesson I learned and wanted to share._

---

Software engineers love to hate on spreadsheets. At least, I did before I
started this project. But I've grown to appreciate spreadsheets. They make
building useful tools incredibly easy. They can be used for data entry, storage,
analysis, and visualization.

The spreadsheet I have been working on lately is a finance-tracking app. Think
Intuit's Mint app, but without the
[gross](https://www.propublica.org/article/turbotax-deliberately-hides-its-free-file-page-from-search-engines)
[injustices](https://www.propublica.org/article/turbotax-military-discount-trick-troops-paying-to-file-taxes)
to the
[American](https://www.propublica.org/article/turbotax-just-tricked-you-into-paying-to-file-your-taxes)
[tax](https://www.propublica.org/article/how-the-maker-of-turbotax-fought-free-simple-tax-filing)
[system](https://www.propublica.org/article/congress-is-about-to-ban-the-government-from-offering-free-online-tax-filing-thank-turbotax).
When I started, I wanted to get a quick prototype working. I had a vague idea of
how I wanted the tool to work, but wanted to be able to rapidly iterate on
functionality so that I could find the solution that works best for me.

This is __virtue #1__ for spreadsheets:

## Spreadsheets are simple to set up

> Well, spreadsheets were the original low-code tool ...  They don’t have a
> complex tool chain or a compile step. You don’t have to “run” your spreadsheet
> to see the results.[^1]

[^1]:[simplethread.com](https://www.simplethread.com/use-spreadsheets-everywhere/)

Think about building a web app. You'll need a front-end. "Ok," you think to
yourself, "maybe HTML, CSS, and JavaScript." But then you realize that your web
app will need to interactive, so you decide on React. Now you need a package
manager like `npm`. Your UI will be pretty complex too, so let's use Tailwind.
Now we also need Webpack, Prettier, and a ton of other frameworks and tools. You
can see that this gets complicated, quickly.

When I started with my spreadsheet, I created a sheet with a single table to
hold all of my transactions. Then I created a sheet that performed queries on
those transactions to tell my my net-worth, how much I owed on credit cards, and
what percentage of my income I was spending. I didn't need any external tools.
Just two sheets in a single file.

Not a week goes by that I don't think about rewriting this tool from
scratch in Rust, with a fancy GUI and API. But who has the time for that? Not
me. Maybe one day, but for now, my spreadsheet does everything I need it to do.

Iterating on the project is also made easier by the simplicity of the
spreadsheet, which brings me to __virtue #2__:

## Spreadsheets are extensible

Every few months or so, I start to think about a metric I would like to know.
For instance, wouldn't it be nice to know how much of my income I am putting
towards expenses and not saving? Instead of having to modify a GUI and backend
to be able to support this new datum, I can simply add a new cell in the
spreadsheet that computes the ratio of my expenses to my income and _boom_. I'm
done. Easy as pie.

There are also more complicated features I added. I wanted a way of budgeting
each month. But since my income changes some months (like when my internship
ended in August and school began in September), I needed the system to be able
to keep track of budgets on a per-month basis so that I could go back and check
my historical budgets.

Google Sheets also has one more incredible feature: _Google App Scripts_. This
feature allows you to write scripts in a language similar to JavaScript that can
be used to automate certain mundane tasks. For my case, I could have a list of
my recurring transactions and my app script could be set up such that every
month, a function executes to read through my recurring transactions and update
my Transactions sheet with the expenses.

App Scripts also have a very useful feature where you can connect certain
functions to an API endpoint, so that you can make an HTTP request to your
script and it will execute on your spreadsheet. This makes it possible for me to
connect Apple's Shortcuts app with my finance spreadsheet to make inputting
transactions simpler and quicker.

The last virtue I will discuss, __virtue #3__ is one that is often a shortcoming
of many software projects you will find on GitHub:

## Spreadsheets are well-documented

I am no spreadsheet guru, but I have gotten pretty good at Googling things. I
never remember how to write a `QUERY`, but luckily for me, Google Sheets have
great documentation, not to mention easy-to-read tooltips when you are writing
formulas. Things I can't find in their docs are readily accessible elsewhere
on the internet. Because so many non-technical people use spreadsheets, the
documentation is easy to understand.

I don't have to look through the backend of a spreadsheet or even understand how
cell dependencies work, the way I might have to dig through a codebase on GitHub
to understand how some function works.

## Shortcomings

I like spreadsheets a lot for building tools, but I would be remiss if I didn't
talk about some of their issues.

For starters, they can sometimes be slow, especially once you have >1000 rows of
data, like I do. My spreadsheet takes between 2-5 seconds to recalculate
everytime I add a new transaction in. This isn't a huge problem because I never
need it to be super fast, but it can sometimes be annoying. There are also some
things that code would make easier, such as optimizing cached values, creating
database migrations, and tailoring a front-end experience. But again, those
things all take a lot of time, and whatever benefit they give me, spreadsheets
make up for by being so damn easy to use.

Additionally, spreadsheets are difficult to edit anywhere except my computer. I
often imagine having a cross-platform, easy to edit finance tool that works just
as well for data entry on my phone as on my computer, but using a spreadsheet on
my iPhone is a pain because the keyboard takes up so much screen space. But
there are ways to make data entry easier, as mentioned above with Google App
Scripts HTTP API.

---

In conclusion, spreadsheets are great for creating tools that involve any sort
of data. You don't need to worry about setting up code linters, package
management, or compiling--everything works immediately. While there are flaws,
they are mostly aesthetic or at least workable for the convenienve afforded by
the spreadsheet. I'll continue using my finance spreadsheet for now, until I
decide my tool's functionality is marketable and I quit my job to start the next
_Mint_.
