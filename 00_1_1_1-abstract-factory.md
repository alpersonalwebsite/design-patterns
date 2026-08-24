# Abstract Factory

An abstract factory is a factory over factories. Where a plain [factory](./00_1_1_0-factory.md) picks a
class, an abstract factory picks the **family** the class belongs to and delegates: `AnimalFactory` does not
know how to build a Husky, it knows that dog breeds are `DogFactory`'s problem.

That is the whole distinction, and it is easy to overstate. Reach for it when you have more than one group of
related things to build and the grouping itself is a decision worth naming. With one family, a factory is
enough.

Nothing says the thing it returns has to be built by a factory either. The delegate can be a builder, a
prototype's `clone()`, or a singleton's accessor, whichever the family needs. That is the sense in which the
pattern is "abstract": it commits to a family, not to a construction technique.

In the sample below:

* We have the `DogFactory`, which returns a new instance of `FrenchBulldog` or `Husky`.
* We have the `CatFactory`, which returns a new instance of `Ragdoll`.
* We have the `AnimalFactory` with the static method `getAnimal()`. It takes a breed and a name, picks the
  factory that handles that breed, and returns the animal. If no factory handles it, it reports that and
  returns nothing.

Note: `getAnimal()` takes the breed as a plain `string`, not as `DogBreed | CatBreed`. That is deliberate.
The breed of an animal you are asked to build arrives from outside your program (a form, a query string, a
row in a database), so it is a string until you have checked it, and a factory whose job is to say "we do
not have that one" needs to be callable with the value it rejects. Typing the parameter as the union makes
the rejection path unreachable: the compiler refuses the call, and the interesting branch never runs.

The two `is`-functions (`isDogBreed`, `isCatBreed`) are how the string becomes a breed. They are type
predicates (`breed is DogBreed`), so inside the `if`, TypeScript knows the string is a `DogBreed` and passes
it to `DogFactory.getDog()` with no cast.

```ts
// Dogs
type DogBreed = 'French Bulldog' | 'Husky';

interface IDog {
  name: string;
  breed: DogBreed;
}

class Dog implements IDog {
  constructor(public name: string, public breed: DogBreed) {}
}

class FrenchBulldog extends Dog {
  constructor(name: string) {
    super(name, 'French Bulldog');
  }
}

class Husky extends Dog {
  constructor(name: string) {
    super(name, 'Husky');
  }
}

const isDogBreed = (breed: string): breed is DogBreed =>
  breed === 'French Bulldog' || breed === 'Husky';

class DogFactory {
  static getDog(name: string, breed: DogBreed): IDog {
    switch (breed) {
      case 'French Bulldog':
        return new FrenchBulldog(name);
      case 'Husky':
        return new Husky(name);
      default: {
        // Unreachable while DogBreed has exactly those two members, and the
        // compiler proves it: `breed` is `never` here. Add a third breed to
        // DogBreed without adding a case and this line stops compiling, which
        // is the whole reason to write it.
        const unhandled: never = breed;
        throw new Error(`Dog breed not supported: ${String(unhandled)}`);
      }
    }
  }
}

// Cats
type CatBreed = 'Ragdoll';

interface ICat {
  name: string;
  breed: CatBreed;
}

class Cat implements ICat {
  constructor(public name: string, public breed: CatBreed) {}
}

class Ragdoll extends Cat {
  constructor(name: string) {
    super(name, 'Ragdoll');
  }
}

const isCatBreed = (breed: string): breed is CatBreed => breed === 'Ragdoll';

class CatFactory {
  static getCat(name: string, breed: CatBreed): ICat {
    switch (breed) {
      case 'Ragdoll':
        return new Ragdoll(name);
      default: {
        const unhandled: never = breed;
        throw new Error(`Cat breed not supported: ${String(unhandled)}`);
      }
    }
  }
}

// The abstract factory
type IAnimal = IDog | ICat;

class AnimalFactory {
  static getAnimal(breed: string, name: string): IAnimal | void {
    try {
      if (isDogBreed(breed)) return DogFactory.getDog(name, breed);
      if (isCatBreed(breed)) return CatFactory.getCat(name, breed);

      throw new Error('We do not have that Factory');
    } catch (err) {
      console.log(err instanceof Error ? err.message : err);
    }
  }
}

const animal1 = AnimalFactory.getAnimal('Ragdoll', 'Peter');
console.log(animal1);
// Ragdoll { name: 'Peter', breed: 'Ragdoll' }

const animal2 = AnimalFactory.getAnimal('Husky', 'Wendy');
console.log(animal2);
// Husky { name: 'Wendy', breed: 'Husky' }

const animal3 = AnimalFactory.getAnimal('French Bulldog', 'Hook');
console.log(animal3);
// FrenchBulldog { name: 'Hook', breed: 'French Bulldog' }

const animal4 = AnimalFactory.getAnimal('Other', 'Peter');
// We do not have that Factory
console.log(animal4);
// undefined
```

## `IAnimal` is a union, and `breed: DogBreed | unknown` is not a type

Two lines in the first version of this page held each other up, and both are worth understanding because the
mistake is easy to repeat.

The interfaces read `breed: DogBreed | unknown`, which looks like "a breed, or something we have not pinned
down yet". It is not. A union with `unknown` **is** `unknown`, because every type is assignable to `unknown`,
so the union absorbs the specific half and the annotation constrains nothing at all. Checked under
`--strict` with the pinned compiler, all of these are accepted:

```ts
// Repeated here so this block stands on its own: the checker compiles each one
// separately, which is also why you can paste any of them straight into a
// playground and have it work.
type DogBreed = 'French Bulldog' | 'Husky';

interface ILooseDog {
  name: string;
  breed: DogBreed | unknown;
}

const nonsense1: ILooseDog = { name: 'Hook', breed: 42 };
const nonsense2: ILooseDog = { name: 'Hook', breed: { totally: 'not a breed' } };
const nonsense3: ILooseDog = { name: 'Hook', breed: Symbol('nope') };
console.log(nonsense1.breed, nonsense2.breed, nonsense3.breed);
// 42 { totally: 'not a breed' } Symbol(nope)
```

The second line was `interface IAnimal extends IDog, ICat {}`, and it only compiled because of the first. An
interface extending both says an animal is a dog **and** a cat at the same time, so its `breed` has to
satisfy both `DogBreed` and `CatBreed`, and nothing does. With the escape hatch removed, the compiler says
so directly:

    error TS2320: Interface 'IAnimal' cannot simultaneously extend types 'IDog' and 'ICat'.
      Named property 'breed' of types 'IDog' and 'ICat' are not identical.

What the page means is "either", which is a union: `type IAnimal = IDog | ICat`. So the vague annotation was
not a small imprecision, it was load-bearing, and it was holding up a model that said the opposite of what
was intended.
