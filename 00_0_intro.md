# Design Patterns

These are working notes on design patterns, written while learning them, with a runnable TypeScript sample
for every one. They cover the **creational** family and nothing else yet.

They are practical notes and not a replacement for the literature. The canonical source is
*Design Patterns: Elements of Reusable Object-Oriented Software* (1994) by Erich Gamma, Richard Helm, Ralph
Johnson and John Vlissides, still universally called the Gang of Four book, and refactoring.guru is the
friendliest modern reference if the original's C++ and Smalltalk get in the way. Where these notes and those
disagree, they are right.

## What a pattern actually is

A pattern is not a library and not code you install. It is three things at once: a **problem** that keeps
recurring, an **arrangement** of classes and objects that tends to solve it, and a **name** so you can
discuss the arrangement without drawing it.

The name is the part that gets undersold. "Make `getInstance()` return the object we made last time" is a
sentence; "singleton" is a word, and both people in the conversation already know its trade-offs. Most of the
value of knowing the catalogue is being able to have that conversation quickly, including the part where
someone says "not here".

Because patterns are shapes rather than code, none of them is free. Each one buys flexibility somewhere by
adding indirection somewhere else, so the interesting question is never "which pattern is this" but "is the
flexibility worth the indirection here". Each page in these notes tries to say when it is not.

## The three families

The Gang of Four catalogue is 23 patterns in three families, split by what the pattern is about:

| family | about | count | examples |
| --- | --- | --- | --- |
| **Creational** | how objects get made | 5 | factory, abstract factory, singleton, builder, prototype |
| **Structural** | how objects are composed | 7 | adapter, decorator, facade, proxy |
| **Behavioural** | how objects communicate | 11 | observer, strategy, iterator, command |

These notes are the first row. See [creational patterns](./00_1_0-creational-patterns.md) for what the five
have in common and which to reach for, then the page for each one.

## The samples run

Every sample is TypeScript, and every `console.log` in them is followed by the output it really produces:

```ts
class Reader {
  constructor(public name: string, public role = 0, public salary = 1) {}
}

const reader = new Reader('Peter');
console.log(reader);
// Reader { name: 'Peter', role: 0, salary: 1 }
```

Those comments are checked rather than trusted. `npm test` compiles each block, runs it, and compares the
program's actual output against them line for line, so a sample that stops working, or a comment that was
never right in the first place, fails. It reports how many blocks it compiled and ran, how many output claims
matched, and then either `no failures` or every mismatch with the file and line it is in.

That check was worth adding because the notes did not pass it. The builder, singleton and prototype pages each
documented a value their own code never printed, and the abstract factory's last example did not compile at
all.

TypeScript is pinned to the version that was current when these notes were written, so the samples behave as
they did then. That has one visible consequence, on the
[shallow vs deep copy](./00_1_5_1-prototype-shallow-vs-deep-copy.md) page, where `structuredClone` is typed
as returning `any`; a current compiler types it generically, and the page says so.
