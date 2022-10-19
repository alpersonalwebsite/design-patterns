# Abstract Factory

<!-- 
  TODO:
  What is?
  Factory that returns factories?
  It can also return Builder, Prototypes, Singletons and other design pattern implementations

-->

* We have the `DogFactory` which returns a new instance of `FrenchBulldog`, `Husky` or throw an error.
* We have the `CatFactory` which returns a new instance of `Ragdoll` or throw an error.
* We have the `AnimalFactory` which has the static method `getAnimal()`. This method takes an animal (name and breed) and return an animal (either of the type DogBreed or CatBreed).

```ts

// Dog
type DogBreed = 'French Bulldog' | 'Husky';

interface IDog {
  name: string;
  breed: DogBreed | unknown;
}

class Dog implements IDog {
  name = '';
  breed = '';
}

class FrenchBulldog extends Dog {
  constructor(name: string) {
    super()
    this.name = name;
    this.breed = 'French Bulldog';
  }
}

class Husky extends Dog {
  constructor(name: string) {
    super()
    this.name = name;
    this.breed = 'Husky';
  }
}

class DogFactory {
  static getDog(name: string, breed: DogBreed): IDog | never {
    if (breed === 'French Bulldog') {
      return new FrenchBulldog(name);
    } else if (breed === 'Husky') {
        return new Husky(name);
    } else {
        throw new Error(`Dog breed not supported!`);
    }
  }
}

// Cat

type CatBreed = 'Ragdoll'

interface ICat {
  name: string;
  breed: CatBreed | unknown;
}

class Cat implements ICat {
  name = '';
  breed = ''
}

class Ragdoll extends Cat {
  constructor(name: string) {
    super()
    this.name = name;
    this.breed = 'Ragdoll';
  }
}


class CatFactory {
  static getCat(name: string, breed: CatBreed): ICat {
    if (breed === 'Ragdoll') {
      return new Ragdoll(name);
    } else {
        throw new Error(`Cat breed not supported!`);
    }
  }
}


// Animal Asbtract Factory

interface IAnimal extends IDog, ICat {}

class AnimalFactory {
  static getAnimal(breed: DogBreed | CatBreed, name: string): IAnimal | void {
    try {
      if (['French Bulldog', 'Husky'].includes(breed)) return DogFactory.getDog(name, breed as DogBreed);
      if (['Ragdoll'].includes(breed)) return CatFactory.getCat(name, breed as CatBreed);
      
      throw new Error('We do not have that Factory');

    } catch (err) {
        console.log(err);
    }
  }
}


const animal1 = AnimalFactory.getAnimal('Ragdoll', 'Peter');
console.log(animal1);
// Ragdoll: {
//   "name": "Peter",
//   "breed": "Ragdoll"
// } 

const animal2 = AnimalFactory.getAnimal('Husky', 'Wendy');
console.log(animal2);
// Husky: {
//   "name": "Wendy",
//   "breed": "Husky"
// } 

const animal3 = AnimalFactory.getAnimal('French Bulldog', 'Hook');
console.log(animal3);
// FrenchBulldog: {
//   "name": "Hook",
//   "breed": "French Bulldog"
// } 

const animal4 = AnimalFactory.getAnimal('Other', 'Peter');
console.log(animal4);
// We do not have that Factory
// undefined
```