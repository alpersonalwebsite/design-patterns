# Builder

A builder separates constructing an object from the object itself, so one construction process can produce
different results. It is a close relative of the [factory](./00_1_1_0-factory.md), and the difference is
scale: a factory picks a class and returns it, a builder assembles something in several steps where the steps
are optional and their order does not matter.

The usual symptom that you want one is a constructor with six parameters, four of which are usually
`undefined`.

In the sample below:

* `User` is the thing being built.
* `UserBuilder` sets one field per call and hands back the finished `User` from `getUser()`.
* `ReaderDirector` and `WriterDirector` are the **directors**: each one knows a recipe. Both use the same
  builder, and produce different users (the writer's recipe also sets a salary).
* Inside a director you choose which steps to call and in what order. `setName().setRole()` and
  `setRole().setName()` give the same result, which is the property that makes this a builder rather than
  a constructor with extra steps.

The chaining works because every method except `getUser()` ends in `return this`, so each call hands the
builder back to the next one. The return type is written `this` rather than `UserBuilder`, which matters if
anyone ever subclasses the builder: `this` keeps the chain typed as the subclass, where `UserBuilder` would
flatten it to the base and lose any methods the subclass added.

```ts
class User {
  name = '';
  salary = 0;
  role = ''

  construction(): string {
    return `I'm a ${this.role}. My name is ${this.name}. My salary is ${this.salary}`
  }
}

type Role = 'reader' | 'writer'

interface IUserBuilder {
  user: User;
  setRole(userRole: Role): this;
  setSalary(userSalary: number): this;
  setName(name: string): this;
  getUser(): User;
}

class UserBuilder implements IUserBuilder {
  user: User;

  constructor() {
    this.user = new User();
  }

  setRole(userRole: Role): this {
    this.user.role = userRole;
    return this;
  }

  setSalary(userSalary: number): this {
    this.user.salary = userSalary;
    return this;
  }

  setName(userName: string): this {
    this.user.name = userName;
    return this;
  }

  getUser() {
    return this.user;
  }
}

class ReaderDirector {
  static construct(name: string): User {
    return new UserBuilder()
      .setRole('reader')
      .setName(name)
      .getUser();
  }
}

class WriterDirector {
  static construct(name: string): User {
    return new UserBuilder()
      .setRole('writer')
      .setName(name)
      .setSalary(100)
      .getUser();
  }
}



const reader = ReaderDirector.construct('Peter');
const writer = WriterDirector.construct('Wendy');

console.log(reader);
// User { name: 'Peter', salary: 0, role: 'reader' }

console.log(writer);
// User { name: 'Wendy', salary: 100, role: 'writer' }

console.log(reader.construction());
// I'm a reader. My name is Peter. My salary is 0

console.log(writer.construction());
// I'm a writer. My name is Wendy. My salary is 100
```
