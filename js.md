# Interview prep question

## How to create create objects in js

1. using object literals
``` js
const persion = {
    name: 'Alice',
    age : 23,
    greet: () => {
        console.log("Hiii")
    }
}
```

2. Using new Object() constructure
``` js
const person = new Object();
person.name = "Bob";
person.age = 30;
person.greet = function() {
  console.log("Hi!");
};
```

3. using constructure funtion
``` js
function Person(name, age) {
  this.name = name;
  this.age = age;
  this.greet = function() {
    console.log(`Hello, I am ${this.name}`);
  };
}

const p1 = new Person("Charlie", 28);

```

4. using class

``` js
class Person {
  constructor(name, age) {
    this.name = name;
    this.age = age;
  }
  
  greet() {
    console.log(`Hi, I'm ${this.name}`);
  }
}

const p1 = new Person("David", 32);

```

5. Object.create()
``` js
const proto = {
  greet() {
    console.log(`Hello, I'm ${this.name}`);
  }
};

const person = Object.create(proto);
person.name = "Eve";
person.age = 22;
person.greet();

```


## expore this code part
``` js
const person = new Object();
person.name = "hi"
person.age = 23
person.greet = () => {
    console.log("hi");
    console.log(person.kind)
    console.log(typeof person.kind); // "function"
    return () => {
        console.log("from call back");
    }
}
person.kind = "paint"


console.log(person.greet())

// hi
// paint
// string
// [Function (anonymous)]
//bacause when kind is accessed during call at that time it is defined
//but when fun is called before declaration it gives undefined but not error??? why??


// Reason
// Because in JavaScript:

// Accessing a missing property = undefined

// Accessing a missing variable = ReferenceError
```

## Object.create(proto, propertiesObject?)

proto: The object which should be the prototype of the newly created object.

propertiesObject (optional): An object specifying property descriptors (like Object.defineProperties).

1. Basic inheritance
```js
const animal = { eats: true };
const dog = Object.create(animal);

dog.barks = true;

console.log(dog.barks); // true
console.log(dog.eats);  // true (inherited from animal)
console.log(Object.getPrototypeOf(dog) === animal); // true
```

2. using propertyObject
```js
const person = Object.create(Object.prototype, {
  name: {
    value: "Alice",
    writable: true,
    enumerable: true,
    configurable: true
  },
  age: {
    value: 25,
    writable: false, // read-only
    enumerable: true
  }
});

console.log(person.name); // "Alice"
person.age = 30;
console.log(person.age); // 25 (read-only)
person.name = "changed"
console.log(person.name)
```

-- enumerable
``` js
const obj = {};
Object.defineProperty(obj, 'secret', { value: 42, enumerable: false });
obj.name = 'Alice';

console.log(Object.keys(obj)); // ["name"]
for (let key in obj) {
  console.log(key); // "name" only, not "secret"
}
```

-- configurable
```js
const obj = {};
Object.defineProperty(obj, 'id', { value: 1, configurable: false });

delete obj.id;
console.log(obj.id); // 1 (cannot delete)

Object.defineProperty(obj, 'id', { writable: true }); 
// ❌ TypeError: Cannot redefine property: id (because configurable: false)
```

## Inherited method for normal class

```js
| Method                       | Description                                                                       |
| ---------------------------- | --------------------------------------------------------------------------------- |
| `toString()`                 | Returns a string representation of the object. Default: `"[object Object]"`.      |
| `valueOf()`                  | Returns the primitive value of the object (usually the object itself).            |
| `hasOwnProperty(prop)`       | Returns `true` if `prop` exists **directly on the object**, not on the prototype. |
| `isPrototypeOf(obj)`         | Checks if the object exists in the prototype chain of `obj`.                      |
| `propertyIsEnumerable(prop)` | Checks if the property exists **on the object itself** and is enumerable.         |
| `toLocaleString()`           | Returns a localized string representation (can be overridden).                    |
| `constructor`                | Points to the function that created the instance (usually `Object`).              |
```

```js
const obj = { name: "Alice" };

console.log(obj.toString());        // "[object Object]"
console.log(obj.hasOwnProperty("name")); // true
console.log(obj.hasOwnProperty("toString")); // false, inherited
console.log(obj.constructor === Object); // true
```


## shallow copy

-- A shallow copy copies an object only one level deep.
-- Nested objects (arrays, objects inside) are still referenced (not cloned).

```js
const original = {
  name: "Alice",
  address: { city: "Delhi", pin: 110001 }
};

// Shallow copy
const copy = { ...original }; // or Object.assign({}, original)

copy.name = "Bob";
copy.address.city = "Mumbai";

console.log(original.name);    // Alice ✅ (independent)
console.log(original.address.city); // Mumbai ❌ (changed in original!)
```

## Deep copy

-- A deep copy duplicates the object recursively.
-- All nested objects/arrays are completely cloned, no shared references.


```js
const original = {
  name: "Alice",
  address: { city: "Delhi", pin: 110001 }
};

// Deep copy using structuredClone
const copy = structuredClone(original);

copy.address.city = "Mumbai";

console.log(original.address.city); // Delhi ✅ (unchanged)
console.log(copy.address.city);     // Mumbai ✅
```


## slice and splice

-- slice
-- Purpose: Returns a shallow copy of a portion of an array without modifying the original array.

``` js
array.slice(start, end)
```


```js
const arr = [10, 20, 30, 40, 50];

arr.slice(1, 4);  // [20, 30, 40]  (start inclusive, end exclusive)
arr.slice(2);     // [30, 40, 50]  (from index 2 to end)
arr.slice(-3);    // [30, 40, 50]  (last 3 elements)
arr.slice(-4, -1);// [20, 30, 40]

```

-- splice
-- Purpose: Adds, removes, or replaces elements in the array. It modifies the original array.
```js
Parameter	Description
start	Index at which to start changing the array.
deleteCount	Number of elements to remove from start. If 0, no elements are removed.
item1, ...	Optional elements to insert at start position.
```

```js
array.splice(start, deleteCount, item1, item2, ...)
```

```js
const arr = [10, 20, 30];
arr.splice(1, 0, 15, 17); // insert 15,17 at index 1, delete 0 elements
console.log(arr); // [10, 15, 17, 20, 30]
```



### if in console.log(fun()) then it will run the fun and frint what fun returns

<!-- process.stdout.write("hi ");
process.stdout.write("there"); --> --> this to wrte without default newline break


