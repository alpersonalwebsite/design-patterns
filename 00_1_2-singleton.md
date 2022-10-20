# Singleton

<!-- 
  TODO:
  What is?
  When we need to have a single instance of a class throughout the whole application. Example, for openning a database connection
  After first instance is created, any new instance is going to point to the original instance

  Benefits:
  * Shared state (store application state)
  * Avoid long initializations (we initialize it once)
  * Cross class communication
  * Perfectly represents unique items
-->

* We have the interface `IUser` which is the `blueprint` of the base class `User` (or, what's the same, `User` class implements the interface `IUSer`)
* We have the subclasses `Reader`, `Writer` and `Admin` which extend the base class `User`.
* We have the factory `UserFactory` which is going to build specific classes of `Users` without the calling class knowing how Users are created.


* We have the class `LeaderBoard` that has the following members:
  * instance (static)
  * #players (private field for players)
  * constructor()
  * addWinner()
  * show()

Quick note... Remember:
  * public -> everyone (default)
  * protected -> the own class and the subclasses
  * private -> the own class
  * static -> called on the class itself (not instances)

Going back to the explanation.
  * We have the `instance` which is of type `LeaderBoard`
  * We have the private field `#players`
  * Every time the constructor runs we `check if instance has been initialized`. If so, we return the instance, if not, we instantiate it.
  * Then we have 2 methods exposed `addWiner()` and `show()`, one for adding the winner of a game and the other for showing the leaderboard.

After this, we initialize the class `let leaderBoard = new LeaderBoard()` and add the winners.
Once we initialize the class, we are always going to operate with the same (unique) instance of that class.


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
// LeaderBoard: {} 

type Players = 'Peter' | 'Wendy' | 'Hook'

interface IGame {
  players: Array<Players>,
  winner: Players,
  points: number
}

// Peter plays aganist Wendy and wins
let game1Results: IGame = {
  players: ['Peter', 'Wendy'],
  winner: 'Peter',
  points: 1
}

leaderBoard.addWinner(game1Results.winner, game1Results.points);

leaderBoard.show();
// {
//   "Peter": 1
// } 

// Wendy plays aganist Hook and wins
let game2Results: IGame = {
  players: ['Hook', 'Wendy'],
  winner: 'Wendy',
  points: 1
}

leaderBoard.addWinner(game2Results.winner, game2Results.points);

leaderBoard.show();
// {
//   "Peter": 1
// } 

// Wendy plays aganist Peter and wins
let game3Results: IGame = {
  players: ['Wendy', 'Peter'],
  winner: 'Wendy',
  points: 1
}

leaderBoard.addWinner(game3Results.winner, game3Results.points);

leaderBoard.show();
// {
//   "Peter": 1,
//   "Wendy": 2
// }


const lead = new LeaderBoard();
lead.show();
// {
//   "Peter": 1,
//   "Wendy": 2
// }

leaderBoard.show();
// {
//   "Peter": 1,
//   "Wendy": 2
// }
```


<!--
Old Singleton example

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

// Singleton.instance doesn't exist so Singleton.instance is equals this (aka, the instance that was created when the constructor was first called)
const obj1 = new Singleton(1);
console.log(obj1);
// Singleton: {
//   "id": 1
// } 


// Singleton.instance exists so Singleton.instance is returned
// or what is the same... obj2 points to obj1
const obj2 = new Singleton(2);
console.log(obj2);
// Singleton: {
//   "id": 1
// } 

```
-->