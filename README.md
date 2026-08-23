# Design Patterns

Notes on the five **creational** design patterns, with a runnable TypeScript sample for each: factory,
abstract factory, singleton, builder and prototype. Written while learning them, kept short on purpose.

Start with [the introduction](./00_0_intro.md) if you want the framing, or go straight to a pattern.

## Reading order

| # | page | pattern |
| --- | --- | --- |
| 1 | [00_0_intro.md](./00_0_intro.md) | what a pattern is, and the three families |
| 2 | [00_1_0-creational-patterns.md](./00_1_0-creational-patterns.md) | what the five have in common, and which to reach for |
| 3 | [00_1_1_0-factory.md](./00_1_1_0-factory.md) | factory |
| 4 | [00_1_1_1-abstract-factory.md](./00_1_1_1-abstract-factory.md) | abstract factory |
| 5 | [00_1_2-singleton.md](./00_1_2-singleton.md) | singleton |
| 6 | [00_1_4-builder.md](./00_1_4-builder.md) | builder |
| 7 | [00_1_5_0-prototype.md](./00_1_5_0-prototype.md) | prototype |
| 8 | [00_1_5_1-prototype-shallow-vs-deep-copy.md](./00_1_5_1-prototype-shallow-vs-deep-copy.md) | shallow vs deep copy, which the prototype page needs |

The numbering skips `00_1_3`. Nothing is missing: builder simply landed on `_4`.

## Running the samples

Every `console.log` in these notes is followed by the output it actually produces. Those comments are
checked, not trusted:

```sh
npm install
npm test
```

`npm test` extracts every fenced `ts` block, compiles it with the pinned TypeScript under `--strict`, runs it, and
compares the program's real stdout line for line against the expectations written in the block's comments. A
sample that stops compiling, or a comment that never matched in the first place, fails with the file and line.

Each block is compiled on its own, so any of them can be pasted into a playground unchanged.

TypeScript is pinned to **4.8.4**, the release that was current when these notes were written (September
2022), and it is the only dependency. That is deliberate: the samples should behave the way they did when the
notes were made, not the way a compiler five major versions later would treat them. Where the difference is
visible, the notes say so.
