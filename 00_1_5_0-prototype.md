# Prototype

<!-- 
  TODO:
  What is?
  Good for when we want to create new object with more resource we want to use or have available
  We can save resources creating a copy of any object that is in memory
  An object that supports cloning is called a prototype.


  Shallow copy:    Object.assign({}, obj)
  Deep copy:       JSON.parse(JSON.stringify(obj))  it doesnt copy functions
-->

* We have the `User` class that has the property `data` and the method `clone()`
* We create a new object instantiating the class. Then, we clone that object and assign the returned value to the variable `copiedObject`
* If we change the vakue of a nested property of the object `copiedObject` the `originalObject` WILL not be affected.

Important: Since the method `clone()` returns a new `User` instead of a user object, ALL methods are available in the new objects.

---

Depending oin the shape of you data youy might want to do a `shallow` or `deep` copy.

Shallow vs Deep copy [Shallow vs Deep copy](./00_1_5_1-prototype-shallow-vs-deep-copy.md).

---


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

console.log(originalObject, copiedObject);

//  User: {
//   "userObject": {
//     "name": "Peter",
//     "age": 33,
//     "hobbies": [
//       "writing"
//     ]
//   }
// },  
// User: {
//   "userObject": {
//     "name": "Peter",
//     "age": 33,
//     "hobbies": [
//       "writing"
//     ]
//   }
// } 

copiedObject.data.age = 11;

console.log(originalObject, copiedObject);

// User: {
//   "data": {
//     "name": "Peter",
//     "age": 33,
//     "hobbies": [
//       "writing"
//     ]
//   }
// },  
// User: {
//   "data": {
//     "name": "Peter",
//     "age": 11,
//     "hobbies": [
//       "writing"
//     ]
//   }
// } 
```
