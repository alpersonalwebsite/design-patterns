# Prototype: shallow vs deep copy

The prototype pattern hands you a copy of an object you already have. Which leaves a question the pattern
itself does not answer: **how deep does the copy go?** Get it wrong and the "copy" quietly shares state with
the original, so a change in one shows up in the other, usually a long way from where you made it.

Everything below was run against the TypeScript pinned in this repository and the local node, and the output
comments are that run's real output. Copy any block into a playground and you should see the same.

## Shallow: the top level only

A spread (`{ ...obj }`) and `Object.assign({}, obj)` both copy one level. New top-level properties, and the
same nested objects.

```ts
interface IAddress {
  city: string;
}

interface IUser {
  name: string;
  address: IAddress;
}

const original: IUser = { name: 'Peter', address: { city: 'Neverland' } };

const viaSpread = { ...original };
const viaAssign = Object.assign({}, original);

// `name` is a string, sitting at the top level, so it was copied.
viaSpread.name = 'Wendy';
console.log(original.name);
// Peter

// `address` is an object. What got copied is the REFERENCE, so all three names
// point at one address, and writing through any of them changes it for everyone.
viaSpread.address.city = 'London';
console.log(original.address.city);
// London
console.log(viaAssign.address.city);
// London
```

That is the whole hazard in nine lines. Nothing here is broken, and for a flat object a shallow copy is the
right tool: it is cheap and it says what it does. It stops being right the moment the object has an object
inside it.

## Deep with JSON: works, and loses things

`JSON.parse(JSON.stringify(obj))` is the trick these notes use in the prototype sample, and it does produce
a genuinely independent copy. What it also does is round-trip your object through a text format that has no
way to represent most of what JavaScript can hold.

```ts
const rich = {
  name: 'Peter',
  when: new Date('2022-10-06'),
  hobbies: ['writing'],
  nickname: undefined,
  tags: new Map([['favourite', 1]]),
  score: NaN,
};

const jsonClone = JSON.parse(JSON.stringify(rich));
console.log(jsonClone);
// {
//   name: 'Peter',
//   when: '2022-10-06T00:00:00.000Z',
//   hobbies: [ 'writing' ],
//   tags: {},
//   score: null
// }

const structuredCopy = structuredClone(rich);
console.log(structuredCopy);
// {
//   name: 'Peter',
//   when: 2022-10-06T00:00:00.000Z,
//   hobbies: [ 'writing' ],
//   nickname: undefined,
//   tags: Map(1) { 'favourite' => 1 },
//   score: NaN
// }
```

Read the two dumps side by side, because every difference is a loss:

| value | after JSON round-trip | after `structuredClone` |
| --- | --- | --- |
| `Date` | a **string**, so `.getFullYear()` is gone | still a `Date` |
| `undefined` property | the key **disappears** | key and value survive |
| `Map` | `{}`, an empty object | a `Map` with its entries |
| `NaN` | `null` | `NaN` |
| `Infinity` | `null` (same reason as `NaN`) | `Infinity` |

The `Date` row is the one that bites hardest, because nothing throws: you get a string that prints exactly
like the date did, and it fails later at the first method call.

## What each one refuses to do

```ts
const withMethod = {
  name: 'Peter',
  greet(): string {
    return 'hi';
  },
};

// Reports the error's NAME only. Its message embeds the function's own source
// text, which differs between the TypeScript you wrote and the JavaScript that
// actually ran, so it is not a stable thing to write down.
function report(label: string, attempt: () => unknown): void {
  try {
    attempt();
    console.log(`${label} no error`);
  } catch (err) {
    console.log(`${label} ${err instanceof Error ? err.name : String(err)}`);
  }
}

const jsonClone = JSON.parse(JSON.stringify(withMethod));
console.log(jsonClone);
// { name: 'Peter' }

console.log(typeof jsonClone.greet);
// undefined

report('structuredClone, method:', () => structuredClone(withMethod));
// structuredClone, method: DataCloneError

const cyclic: { name: string; self?: unknown } = { name: 'Peter' };
cyclic.self = cyclic;

report('JSON, cycle:', () => JSON.parse(JSON.stringify(cyclic)));
// JSON, cycle: TypeError

report('structuredClone, cycle:', () => structuredClone(cyclic));
// structuredClone, cycle: no error
```

Neither one copies functions, and that is the difference worth internalising: **JSON drops the method in
silence** (`typeof jsonClone.greet` is `undefined`, and you find out when you call it), while
`structuredClone` refuses the whole operation with a `DataCloneError`. On a cycle they swap sides: JSON
throws a `TypeError`, `structuredClone` handles it and the copy points at itself.

So the failure modes are not ranked, they are shaped differently. JSON fails quietly and later;
`structuredClone` fails loudly and now.

## Two things to know about `structuredClone` in TypeScript

It is not a library. `structuredClone` is a platform function, in Node from **v17.0.0** (per Node's own API
docs) and in every current browser, so it needs no import and no dependency. Two caveats, both measured with
the 4.8.4 pinned here:

**Its return type was `any`.** In this TypeScript it is declared
`declare function structuredClone(value: any, options?: StructuredSerializeOptions): any`, so the clone
arrives untyped and the compiler stops helping you:

```ts
const src = { name: 'Peter', age: 33 };
const copy = structuredClone(src);

// A typo on an `any` is not an error. This compiles, and prints nothing useful.
console.log(copy.thisPropertyDoesNotExist);
// undefined
```

A current TypeScript declares it generically, `structuredClone<T = any>(value: T, options?:
StructuredSerializeOptions): T`, and that snippet is a compile error there. If you are on an older compiler,
annotate the result yourself (`const copy: typeof src = structuredClone(src)`) rather than trusting it.

**It is declared in `lib.dom.d.ts`.** So a `tsconfig.json` that narrows `lib` to `["es2022"]`, which a
Node-only project reasonably might, cannot see it:

    error TS2304: Cannot find name 'structuredClone'.

That is a types problem and not a runtime one: the function is there, node has it, only the compiler has
been told not to look. The fix is `@types/node`, which declares it for Node without dragging in the DOM.

## Which to reach for

* Flat object, no nesting: spread or `Object.assign`. Say what you mean, cheaply.
* Plain data, nested, and you know it is JSON-shaped (strings, numbers, booleans, arrays, plain objects):
  either works, and JSON is fine.
* Anything holding a `Date`, a `Map`, a `Set`, `undefined`, `NaN`, or a cycle: `structuredClone`.
* Objects with methods, or class instances whose prototype you need back: neither. Clone the data and
  rebuild the object, which is exactly what the [prototype sample](./00_1_5_0-prototype.md) does when
  `clone()` returns `new User(copiedData)` instead of the bare copy.

That last line is the point where this page rejoins the pattern. A prototype's `clone()` is not a call to a
copy function, it is your chance to decide how deep the copy goes and what type comes back.
