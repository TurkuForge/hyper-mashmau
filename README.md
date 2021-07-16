# HyperMashmau for Node.js and the Browser
I created this library becasue I feel Hyper media does not have a good frontend tool for traversion data. This allows a simular workflow to Falcor and GraphQL
but gives you the power to use your a HAL based Hyper media APIs.

This library tries not to be super opininated and keeps thing open for extention.

The idea behind the library is simple "Write Less Do More". I took a look at what other successful libraryes have done well and tried to mimic that in the Hypermedia 
context.

The API is supose to be varry simple to work with.
```typescript
const hyperMashmau = new HyperMashmau({ apiRootUrl: 'https://example.org/api' });
const { name, age, gender } = await hyperMashmau.get<{name: string, age: number, gender: string}>(`/hm:users/0/{
  name,
  age,
  gender,
}`);
```
The code above will actualy make multable API requests if needed. Lets say `_embedded` only has `name` then the library will get the self link and get the 
full resource and return to you the data a object with `{ name, age, gender }`.
