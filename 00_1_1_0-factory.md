# Factory

A factory is a function or class whose job is to decide **which** object to build, so that the code asking
for one does not have to know. The caller says what it wants in the abstract ("a user with the reader role")
and gets back something that satisfies a shared interface, with the choice of concrete class made somewhere
it can be changed once.

Two things fall out of that, and they are the reason the pattern is worth the indirection:

* **The creation is separated from the use.** Nothing outside the factory mentions `Reader`, `Writer` or
  `Admin`. Add a fourth role and the callers do not change.
* **Each class keeps one job.** The factory decides which class; the class knows how to be itself. That is
  the single responsibility principle, and the "add a role without editing the callers" part is the
  open/closed principle, which is the pair this pattern is usually introduced to demonstrate.

In the sample below:

* `IUser` is the interface, the shape everything the factory returns will have, and `User` is the base class
  that implements it.
* `Reader`, `Writer` and `Admin` extend `User`, each setting the role and salary that define it.
* `UserFactory.getUser()` takes a name and a `Role` and returns an `IUser`. The caller never names a
  subclass.

Note the return type: `getUser()` is declared to return `IUser`, not `Reader | Writer | Admin`. That is
deliberate and it is most of the value. The narrower type would leak the very decision the factory exists to
own.

```ts
enum Role {
  READER,
  WRITER,
  ADMIN
}

interface IUser {
  name: string;
  role: Role;
  salary: number;
}

class User implements IUser {
  name = '';
  role = 0;
  salary = 0;
}

class Reader extends User {
  constructor(name: string) {
    super();
    this.name = name;
    this.role = Role.READER
    this.salary = 1
  }
}

class Writer extends User {
  constructor(name: string) {
    super();
    this.name = name;
    this.role = Role.WRITER
    this.salary = 2
  }
}

class Admin extends User {
  constructor(name: string) {
    super();
    this.name = name;
    this.role = Role.ADMIN
    this.salary = 3
  }
}

class UserFactory {
  public static getUser(name: string, role: Role): IUser {
    if (role === Role.READER ) {
      return new Reader(name);
    } else if (role === Role.WRITER) {
        return new Writer(name);
    } else {
        return new Admin(name);
    }
  }
}

const reader = UserFactory.getUser('Peter', Role.READER);
console.log(reader);
// Reader { name: 'Peter', role: 0, salary: 1 }

const writer = UserFactory.getUser('Wendy', Role.WRITER);
console.log(writer);
// Writer { name: 'Wendy', role: 1, salary: 2 }

const admin = UserFactory.getUser('Hook', Role.ADMIN);
console.log(admin);
// Admin { name: 'Hook', role: 2, salary: 3 }
```
