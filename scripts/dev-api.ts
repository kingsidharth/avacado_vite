/**
 * Local API dev server — runs all api/ handlers on Bun's HTTP server.
 * Vite proxies /api/* here so `bun run dev` serves both frontend and API.
 */
import { createServer, type IncomingMessage, type ServerResponse } from 'node:http'
import { resolve } from 'node:path'
import { readFileSync, existsSync } from 'node:fs'

// Load .env.local into process.env before anything else
const envPath = resolve(import.meta.dirname, '..', '.env.local')
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf8').split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'")))
      value = value.slice(1, -1)
    if (!process.env[key]) process.env[key] = value
  }
}

import healthHandler from '../api/health'
import meHandler from '../api/users/me'
import syncHandler from '../api/users/sync'
import onboardingHandler from '../api/users/onboarding'
import activitiesHandler from '../api/activities'
import clerkWebhookHandler from '../api/webhooks/clerk'
import chatsHandler from '../api/chats/index'
import chatIdHandler from '../api/chats/[id]'
import chatHandler from '../api/chat/index'
import chatModelsHandler from '../api/chat/models'

type Handler = (req: IncomingMessage & { body?: unknown }, res: ServerResponse) => void | Promise<void>

const routes: [string, Handler][] = [
  ['/api/health', healthHandler],
  ['/api/users/me', meHandler],
  ['/api/users/sync', syncHandler],
  ['/api/users/onboarding', onboardingHandler],
  ['/api/activities', activitiesHandler],
  ['/api/webhooks/clerk', clerkWebhookHandler],
  ['/api/chat/models', chatModelsHandler],
  ['/api/chat', chatHandler],
  ['/api/chats', chatsHandler],
]

function matchRoute(pathname: string): Handler | null {
  for (const [pattern, handler] of routes) {
    if (pathname === pattern || pathname === `${pattern}/`) return handler
  }
  // /api/chats/:id
  if (pathname.startsWith('/api/chats/') && pathname.split('/').filter(Boolean).length === 3) {
    return chatIdHandler
  }
  return null
}

const PORT = Number(process.env.API_DEV_PORT) || 3001

// Ensure DB is migrated before handling requests (avoids 500 from missing tables)
const { getDb } = await import('../api/_lib/db/adapter')
try {
  const db = await getDb()
  await db.migrate()
} catch (err) {
  console.error('API startup: migration failed.', err instanceof Error ? err.message : err)
  process.exit(1)
}

if (!process.env.CLERK_SECRET_KEY?.trim()) {
  console.warn(
    'API startup: CLERK_SECRET_KEY is not set in .env.local. /api/users/me and /api/users/onboarding will return 401. Add your Clerk secret key from dashboard.clerk.com → API Keys.',
  )
}

const server = createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', `http://localhost:${PORT}`)
  const handler = matchRoute(url.pathname)

  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    res.end()
    return
  }

  if (!handler) {
    res.statusCode = 404
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Not found' }))
    return
  }

  try {
    await handler(req, res)
  } catch (err) {
    if (!res.headersSent) {
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: err instanceof Error ? err.message : 'Internal server error' }))
    }
  }
})

server.on('error', (error: NodeJS.ErrnoException) => {
  if (error.code === 'EADDRINUSE') {
    console.error(
      `API dev server could not start because port ${PORT} is already in use. Stop the process using that port or set API_DEV_PORT to a different value and retry.`,
    )
    process.exit(1)
  }

  console.error('API dev server failed to start.', error)
  process.exit(1)
})

server.listen(PORT, () => {
  console.log(`API dev server running at http://localhost:${PORT}`)
})
