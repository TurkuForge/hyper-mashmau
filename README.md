![example workflow](https://github.com/TurkuForge/HyperMashmau/actions/workflows/node.yml/badge.svg)
![Coverage Badge](https://img.shields.io/endpoint?url=https://gist.githubusercontent.com/dusan-turajlic/8965bef2b017d5e6cefd8fafeff41e12/raw/hyper_mashmau__main.json)

# HyperMashmau for Node.js and the Browser
We created this library because we feel Hypermedia APIs do not have any good frontend tools for traversing data.
This library has a similar workflow to [Falcor](https://netflix.github.io/falcor/) or [GraphQL](https://graphql.org/) 
but gives you the power to use your HAL-based Hypermedia APIs.

This library tries not to be opinionated and keeps things open for extension.

The idea behind the library is simple "Write Less Do More". We took a look at what other successful libraries have done well and tried to mimic that in the Hypermedia context.
The HyperMashmau is simple to use and easy to migrate to.
```typescript
const hyperMashmau = new HyperMashmau({ apiRootUrl: 'https://example.org/api' });
const { name, age, gender } = await hyperMashmau.get<{name: string, age: number, gender: string}>(`/hm:users/0/{
  name,
  age,
  gender,
}`);
```
The code above will make multiple API requests if needed. Let’s say `_embedded` has a `hm:user` but that resource only has `name` then the library will get the self 
link of that resource and try to find the remaining values from the full resource. 
If it can't find the values their ether it will print an error but still return the data it could find.
