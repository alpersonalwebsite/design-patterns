# Prototype

The prototype pattern builds a new object by **copying one you already have**, rather than constructing it
from scratch. An object that supports being copied this way is the prototype, and the copy is made by the
object itself: `clone()` is a method on it, not a function somewhere else that knows its internals.

Reach for it when building the thing is the expensive part and you already have one in memory: an object
assembled from several network calls, a parsed document, a configured client. Copying what you have beats
paying for the setup again.

In the sample below:

* `User` holds its state in `data` and exposes `clone()`.
* We build one object, clone it, and keep the result as `copiedObject`.
* Changing a nested property of `copiedObject` leaves `originalObject` alone, which is what makes it a copy
  rather than a second name for the same thing. That independence is not automatic, and
  [shallow vs deep copy](./00_1_5_1-prototype-shallow-vs-deep-copy.md) is the page about how it is achieved
  and what it costs.

Important: `clone()` returns `new User(copiedData)`, not the copied data on its own. So the result is a real
`User` with all its methods, including `clone()` itself, which means you can clone a clone. Returning the
bare object would give you something that prints the same and has no behaviour, and that difference is the
easiest thing to get wrong here.

```ts
interface IUser {
  name: string;
  age: number;
  hobbies?: string[];
}

interface IClone {
  data: IUser;
  clone(): User;
}

class User implements IClone {

  data: IUser = {
    name: '',
    age: 0
  }

  constructor(data: IUser) {
    this.data = data;
  }
  
  clone(): User {
    let copiedObj = JSON.parse(JSON.stringify(this.data));
    return new User(copiedObj);
  }
}


const originalObject = new User({ name: 'Peter', age: 33, hobbies: [ 'writing' ] });

const copiedObject = originalObject.clone();

console.log('original:', originalObject);
// original: User { data: { name: 'Peter', age: 33, hobbies: [ 'writing' ] } }
console.log('copy    :', copiedObject);
// copy    : User { data: { name: 'Peter', age: 33, hobbies: [ 'writing' ] } }

copiedObject.data.age = 11;

console.log('original:', originalObject);
// original: User { data: { name: 'Peter', age: 33, hobbies: [ 'writing' ] } }
console.log('copy    :', copiedObject);
// copy    : User { data: { name: 'Peter', age: 11, hobbies: [ 'writing' ] } }
```
