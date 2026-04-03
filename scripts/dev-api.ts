/**
 * Local development API server — Vite proxy hedefi (port 3001)
 * Kullanım: npm run dev:api
 * Aynı anda: npm run dev (Vite, port 5173)
 */
import { setDefaultResultOrder } from 'dns'
// Windows + Node.js 18: IPv6-first DNS bazen Google API'ye bağlanamaz → IPv4 zorla
setDefaultResultOrder('ipv4first')

import http from 'http'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { config } from 'dotenv'

// .env dosyasını yükle
const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '../.env') })

const PORT = 3001

// API handler'larını dinamik olarak yükle
async function loadHandler(name: string) {
  const mod = await import(`../api/${name}.ts`)
  return mod.default as (req: http.IncomingMessage & { body: unknown }, res: http.ServerResponse) => Promise<void>
}

function parseBody(req: http.IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let data = ''
    req.on('data', chunk => { data += chunk })
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}) }
      catch { reject(new Error('Invalid JSON body')) }
    })
    req.on('error', reject)
  })
}

// VercelRequest/Response benzeri minimal shim
function makeVercelLike(req: http.IncomingMessage, res: http.ServerResponse, body: unknown) {
  const vReq = Object.assign(req, {
    body,
    query: {},
    cookies: {},
  })

  const vRes = Object.assign(res, {
    status(code: number) {
      res.statusCode = code
      return vRes
    },
    json(data: unknown) {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(data))
      return vRes
    },
    send(data: string) {
      res.end(data)
      return vRes
    },
  })

  return { vReq, vRes }
}

const server = http.createServer(async (req, res) => {
  // CORS headers (Vite proxy zaten halleder ama güvenlik için)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const url = req.url ?? '/'
  // /api/cv-optimize → cv-optimize
  const match = url.match(/^\/api\/([^?]+)/)
  if (!match) {
    res.writeHead(404)
    res.end('Not found')
    return
  }

  const handlerName = match[1]
  console.log(`[dev-api] ${req.method} /api/${handlerName}`)

  try {
    const body = await parseBody(req)
    const handler = await loadHandler(handlerName)
    const { vReq, vRes } = makeVercelLike(req, res, body)
    await handler(vReq as never, vRes as never)
  } catch (err) {
    console.error(`[dev-api] Error loading/running handler "${handlerName}":`, err)
    if (!res.headersSent) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ error: String(err) }))
    }
  }
})

server.listen(PORT, () => {
  console.log(`\n✅ Local API server: http://localhost:${PORT}`)
  console.log('   Handlers: /api/cv-optimize, /api/mulakat\n')
})
