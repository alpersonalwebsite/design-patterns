# Factory

<!-- 
  TODO:
  What is?
  Abstraction between the object creation and where it is used?
  Defers the creation of the objects to a subclass
  Combination of Single Responsability and Open/Closed Principles?
-->

* We have the interface `IUser` which is the `blueprint` of the base class `User` (or, what's the same, `User` class implements the interface `IUSer`)
* We have the subclasses `Reader`, `Writer` and `Admin` which extend the base class `User`.
* We have the factory `UserFactory` which is going to build specific classes of `Users` without the calling class knowing how Users are created.

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

const reader = UserFactory.getUser('Peter', 0);
console.log(reader);
// Reader: {
//   "name": "Peter",
//   "role": 0,
//   "salary": 1
// } 

const writer = UserFactory.getUser('Wendy', 1);
console.log(writer);
// Writer: {
//   "name": "Wendy",
//   "role": 1,
//   "salary": 2
// } 

const admin = UserFactory.getUser('', 2);
console.log(admin);
// Admin: {
//   "name": "",
//   "role": 2,
//   "salary": 3
// } 
```