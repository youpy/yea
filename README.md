# yea

- https://yea-ddl.pages.dev
- https://deno.land/x/yea

## usage

```javascript
import {
  amen,
  pick,
  seq,
} from 'https://deno-emit-proxy.deno.dev/x/yea@v0.2.0/mod.ts'

amen((index) => {
  return {
    sliceIndex: index,
    length: seq([0.0, 1, 0.5, 1]),
    loop: {
      length: seq([1, 1 / 2, 1 / 3, 1 / 4]),
      prob: 1,
    },
    swap: {
      index: pick([
        Math.floor(Math.random() * 16),
        Math.abs(index + (Math.floor(Math.random() * 32) - 16)),
      ]),
      prob: 0.4,
    },
    hop: {
      index: Math.abs(index + (Math.floor(Math.random() * 32) - 16)),
      prob: 0.3,
    },
  }
})
```
