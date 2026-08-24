# Creational Patterns

Creational patterns are about **how objects get made**. Not what they do once they exist, and not how they
are wired to each other: only the moment of creation, and who is allowed to know the details of it.

The reason that moment gets a whole family of patterns to itself is that `new Something()` couples the code
doing the calling to the exact class being made. That coupling is fine and usually invisible, right up to the
point where you need a different class, or one instance instead of many, or an object assembled in six steps,
or a copy of one you already have. Every pattern below is a way of putting something between the caller and
the constructor so that the choice can change without the caller changing.

There are five in the Gang of Four catalogue, and these notes cover all five:

| pattern | the question it answers | page |
| --- | --- | --- |
| **Factory** | which class should I build? | [factory](./00_1_1_0-factory.md) |
| **Abstract factory** | which *family* of classes should I build from? | [abstract factory](./00_1_1_1-abstract-factory.md) |
| **Singleton** | how do I make sure there is only ever one? | [singleton](./00_1_2-singleton.md) |
| **Builder** | how do I assemble something in steps? | [builder](./00_1_4-builder.md) |
| **Prototype** | how do I copy one I already have? | [prototype](./00_1_5_0-prototype.md) |

## Choosing between them

They overlap enough to be genuinely confusable, and the distinctions are small:

* **Factory or builder?** A factory makes one decision and returns a finished object. A builder takes several
  calls, most of them optional, in any order. If your factory is growing parameters that are usually
  `undefined`, it wants to be a builder.
* **Factory or abstract factory?** Count the families. One group of related classes needs a factory; two or
  more, where picking the group is itself a decision worth naming, is where the extra layer earns its keep.
* **Builder or prototype?** Both give you a configured object. A builder assembles it from parts, a prototype
  copies one that already exists. If the expensive part is the assembly and you have already paid for it once,
  copy.
* **Singleton or a module?** In JavaScript and TypeScript, a module is already evaluated once and cached, so
  exporting an object from a module gives you shared state with none of the ceremony. The singleton pattern
  earns its place when the one instance must be created lazily, or when the class is also used normally
  elsewhere.

## What they have in common

All five hide a constructor behind something with a name. That is worth stating because it is also the shared
cost: one more indirection between reading the calling code and knowing what class you actually got. A
factory whose only job is `return new User()` has bought you nothing and charged you a file.

The other thing they share is that the return **type** carries the whole design. `getUser(): IUser` keeps the
choice of subclass inside the factory; `getUser(): Reader | Writer | Admin` leaks it back out to every caller
and quietly undoes the pattern. Whenever one of these is not paying off, the return type is the first place to
look.
