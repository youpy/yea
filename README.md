# yea

- https://deno.land/x/yea
- [playground](https://codepen.io/youpy/pen/YzgEvNp?editors=0010)

## usage

```html
<html>
  <body>
    <script type="module">
      import { amen } from "https://deno-emit-proxy.deno.dev/x/yea@v0.8.0/mod.ts";

      document.querySelector("button").addEventListener("click", () =>
        amen(({ index, cumulativeIndex, numSlices }) => {
          const sliceIndex = Math.floor(
            (Math.sin(cumulativeIndex / 0.485) * 0.5 + 0.5) * numSlices
          );
          const duration = ((cumulativeIndex * sliceIndex) % 3) + 1;

          return {
            sliceIndex,
            duration,
            length: 1 / duration,
            loop: {
              prob: 1,
              length: 1 / (((cumulativeIndex * index) % 4) + 1),
            },
          };
        })
      );
    </script>
    <button>start</button>
  </body>
</html>
```

# credits

- The audio files used in this software are from
  https://rhythm-lab.com/amen_breaks/
