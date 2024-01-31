import { serveDir } from 'https://deno.land/std@0.213.0/http/file_server.ts'
import { bundle } from 'https://deno.land/x/emit@0.31.4/mod.ts'

const url = new URL(import.meta.resolve('./mod.ts'))
const { code } = await bundle(url)
const serveId = new Date().getTime().toString()

Deno.mkdir('./dist', { recursive: true })
Deno.writeTextFile('./dist/main.js', code)
Deno.copyFile('./index.html', './dist/index.html')
Deno.serve((req) => {
  const pathname = new URL(req.url).pathname

  if (pathname === '/_serve') {
    return new Response(serveId)
  }

  return serveDir(req, {
    fsRoot: './dist',
  })
})
