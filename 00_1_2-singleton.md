# Singleton

A singleton is a class you only ever get one of. Ask for a second instance and you are handed the first one
back, so every part of the program that reaches for it is looking at the same object and the same state.

The classic reason is a resource that is expensive or awkward to have twice: a database connection pool, a
configuration object read once at start-up, a logger, a cache. The reason it turns up in a leaderboard
example is that shared mutable state is the whole point, and a leaderboard makes it visible in three lines.

What you get for it:

* **Shared state.** Everyone reads and writes one object, with no wiring to pass it around.
* **Initialised once.** A slow constructor runs on the first `new` and never again.
* **A place for cross-class communication.** Two classes that know nothing about each other can both reach
  the same instance.
* **It models genuinely unique things well.** There is one leaderboard in this game, not a leaderboard per
  caller.

Worth saying plainly, since these notes are about when to use a pattern and not only how: those benefits are
also the complaints. Global mutable state is hard to test (the instance outlives your test), hard to reason
about (any caller can have written to it), and hard to run twice in one process. Reach for it when the thing
really is unique, not to avoid passing an argument.

## The class

`LeaderBoard` has five members:

* `instance`, **static**, holding the one instance the class hands out.
* `#players`, a **private field**, the scores themselves.
* `constructor()`, which is where the trick lives.
* `addWinner()` and `show()`, the two methods anyone outside calls.

A reminder on the modifiers, since `static` and `#` are both load-bearing in the sample:

| modifier | who can reach it |
| --- | --- |
| `public` | everyone (the default) |
| `protected` | the class and its subclasses |
| `private` | the class only, enforced by TypeScript at compile time |
| `#field` | the class only, enforced by JavaScript at runtime |
| `static` | called on the class itself, not on an instance |

`private` and `#` are not the same thing, and the sample uses `#`. TypeScript's `private` is a compile-time
rule that vanishes in the emitted JavaScript, so `(obj as any).players` reaches it at runtime. A `#field` is
genuinely inaccessible from outside the class, and that is enforced by the language rather than the compiler.

The constructor is the pattern:

```ts
class LeaderBoard {
  static instance: LeaderBoard;

  constructor() {
    if (LeaderBoard.instance) {
      return LeaderBoard.instance;
    }
    LeaderBoard.instance = this;
  }
}
```

Returning an object from a constructor overrides what `new` would have given you, which is the mechanism the
whole pattern rests on. The first `new LeaderBoard()` finds `instance` unset, stores `this`, and you get the
new object. Every later `new LeaderBoard()` finds it set and returns the original, so the freshly built
object is thrown away unused. That is the cost of doing it this way: `new` still allocates, it just does not
give you what it allocated.

Then `let leaderBoard = new LeaderBoard()` and the winners go in. From that point every reference, however
it was obtained, is the same object.

```ts
interface IPlayer {
  [name: string]: number
}

class LeaderBoard {
  static instance: LeaderBoard;
  #players: IPlayer = {}

  constructor() {
    if (LeaderBoard.instance) {
      return LeaderBoard.instance;
    }
    LeaderBoard.instance = this;
  }

  public addWinner(name: string, points: number): void {
    this.#players[name] = (!this.#players[name] ? 0 : this.#players[name]) + points;
  }

  public show(): void {
    console.log(this.#players);
  }
}


let leaderBoard = new LeaderBoard()

console.log(leaderBoard);
// LeaderBoard {}

type Players = 'Peter' | 'Wendy' | 'Hook'

interface IGame {
  players: Array<Players>,
  winner: Players,
  points: number
}

// Peter plays against Wendy and wins
let game1Results: IGame = {
  players: ['Peter', 'Wendy'],
  winner: 'Peter',
  points: 1
}

leaderBoard.addWinner(game1Results.winner, game1Results.points);

leaderBoard.show();
// { Peter: 1 }

// Wendy plays against Hook and wins
let game2Results: IGame = {
  players: ['Hook', 'Wendy'],
  winner: 'Wendy',
  points: 1
}

leaderBoard.addWinner(game2Results.winner, game2Results.points);

leaderBoard.show();
// { Peter: 1, Wendy: 1 }

// Wendy plays against Peter and wins
let game3Results: IGame = {
  players: ['Wendy', 'Peter'],
  winner: 'Wendy',
  points: 1
}

leaderBoard.addWinner(game3Results.winner, game3Results.points);

leaderBoard.show();
// { Peter: 1, Wendy: 2 }


const lead = new LeaderBoard();
lead.show();
// { Peter: 1, Wendy: 2 }

leaderBoard.show();
// { Peter: 1, Wendy: 2 }
```


## Why the leaderboard prints as empty

`console.log(leaderBoard)` shows `LeaderBoard {}`, and it keeps showing `LeaderBoard {}` after three games
have been recorded. Nothing is wrong: **`#` private fields are invisible to `console.log`.** They are not
properties, so nothing that enumerates properties can see them, and Node's inspector does not have a switch
for it either:

```ts
class WithBoth {
  #hidden = { Peter: 1 };
  visible = { Peter: 1 };
}

// The two fields hold identical objects. Only one is printed.
console.log(new WithBoth());
// WithBoth { visible: { Peter: 1 } }
```

Measured with `util.inspect(obj, { showHidden: true })` as well, which prints the same `{}`. So the `show()`
method is not decoration: on a class that keeps its state in a `#field`, a method that logs is the only way to
see the state at all. That is a real cost of `#` over TypeScript's `private`, whose fields are ordinary
properties at runtime and do print.

## A smaller version of the same thing

This one was in the file as a comment, so nothing ever rendered it and nothing ever compiled it. It is the
pattern with everything else stripped away, which makes it the clearer of the two to read first.

```ts
class Singleton {
  static instance: Singleton;
  id: number;

  constructor(id: number) {
    this.id = id;

    if (Singleton.instance) {
      return Singleton.instance;
    }
    Singleton.instance = this;
  }
}

// Singleton.instance does not exist yet, so it is set to `this`, and obj1 is the
// object that was just built.
const obj1 = new Singleton(1);
console.log(obj1);
// Singleton { id: 1 }

// Singleton.instance exists, so it is returned and obj2 points at obj1. Note the
// id: the argument 2 was assigned, to an object that is then discarded.
const obj2 = new Singleton(2);
console.log(obj2);
// Singleton { id: 1 }
```

That last comment is worth pausing on, because it is a real hazard in this shape of singleton. `this.id = id`
runs before the instance check, on the throwaway object, so passing an argument to a second `new` is silently
ignored. Move the assignment after the check and it is worse: it mutates the shared instance, so any caller
can rewrite everyone else's state through a constructor that looks like it is building something new. Neither
is a bug in the sample, and both are why a singleton with constructor arguments is usually a design worth
questioning.
