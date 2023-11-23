import { bundle } from 'https://deno.land/x/emit@0.31.4/mod.ts'

const url = new URL(import.meta.resolve('./mod.ts'))
const { code } = await bundle(url)

Deno.mkdir('./dist', { recursive: true })
Deno.writeTextFile('./dist/main.js', code)
Deno.copyFile('./index.html', './dist/index.html')
