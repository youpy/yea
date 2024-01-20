# yea

- https://yea-ddl.pages.dev
- https://deno.land/x/yea

## usage

```html
<html>
  <body>
    <script type="module">
      import { amen } from "https://deno-emit-proxy.deno.dev/x/yea@v0.4.0/mod.ts";

      document.querySelector("button").addEventListener("click", () =>
        amen((index, cumulativeIndex) => {
          const sliceIndex = Math.floor(
            (Math.sin(cumulativeIndex / value) * 0.5 + 0.5) * 16
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
