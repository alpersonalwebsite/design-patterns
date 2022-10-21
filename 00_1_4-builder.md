# Builder

<!-- 
  TODO:
  What is?
  Separates the creation of the object from its representation so we can use the came construction process to create different representations
  It is similar to Factory.
  The difference is that the Builder is used to create more complex objects
-->

* We have a `User` class, 2 Director classes (`ReaderDirector` and `WriterDirector`) and that use the `UserBuilder`.
* The Directors uses the `UserBuilder` class to build a `User`. Each Director is going to generate a different type of `User`
  (the `WriterDirector` sets also a salary).
* Inside the Director, we can chose which methods use and their order (indistinct).
* Methods are chained. This is possible because each method except the last one, `getUser()`, returns `this`.
  (each methods except getUser() returns a reference to `UserBuilder`)

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
// User: {
//   "name": "",
//   "salary": 0,
//   "role": "reader"
// } 

console.log(writer);
// User: {
//   "name": "",
//   "salary": 100,
//   "role": "writer"
// } 

console.log(reader.construction());
// "I'm a reader. My name is Peter. My salary is 0" 

console.log(writer.construction());
// "I'm a writer. My name is Wendy. My salary is 100"
```