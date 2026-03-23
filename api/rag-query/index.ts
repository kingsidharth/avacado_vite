import type { IncomingMessage, ServerResponse } from 'node:http'
import { createOpenRouter } from '@openrouter/ai-sdk-provider'
import { generateText } from 'ai'
import { getEnv, assertOpenRouterApiKey } from '../_lib/env.js'
import { readBodyJson, sendJson } from '../_lib/http.js'
import { requireClerkUserId } from '../_lib/auth.js'
import { fetchAllowedModels } from '../_lib/openrouter-models.js'

// ============================================================================
// Constants
// ============================================================================

const MAX_DOCUMENT_CHARS = 30_000
const MAX_QUERY_CHARS = 2_000

const RAG_SYSTEM_PROMPT = `You are a document analyst. Answer ONLY from the provided document. If the answer isn't in the document, say "I couldn't find this in the document." Be specific — quote figures, exact text when possible. Keep answers concise (2-4 sentences).`

// ============================================================================
// Types
// ============================================================================

interface RagHistoryEntry {
  query: string
  response: string
}

interface RagQueryBody {
  document_text: string
  query: string
  history?: RagHistoryEntry[]
}

// ============================================================================
// Handler
// ============================================================================

export default async function handler(
  req: IncomingMessage & { body?: unknown },
  res: ServerResponse
) {
  if (req.method !== 'POST') {
    res.statusCode = 405
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify({ error: 'Method not allowed. Use POST.' }))
    return
  }

  // Authenticate
  try {
    await requireClerkUserId(req)
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    sendJson(res, 401, { error: message })
    return
  }

  // Parse body
  let body: RagQueryBody
  try {
    body = await readBodyJson<RagQueryBody>(req)
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON body.' })
    return
  }

  const { document_text, query, history } = body

  if (!document_text || typeof document_text !== 'string') {
    sendJson(res, 400, { error: 'Missing or invalid document_text.' })
    return
  }

  if (!query || typeof query !== 'string') {
    sendJson(res, 400, { error: 'Missing or invalid query.' })
    return
  }

  if (document_text.length > MAX_DOCUMENT_CHARS) {
    sendJson(res, 400, {
      error: `Document too long. Maximum ${MAX_DOCUMENT_CHARS} characters.`,
    })
    return
  }

  if (query.length > MAX_QUERY_CHARS) {
    sendJson(res, 400, {
      error: `Query too long. Maximum ${MAX_QUERY_CHARS} characters.`,
    })
    return
  }

  // Set up OpenRouter
  const env = getEnv()
  assertOpenRouterApiKey(env)

  const allowedModels = await fetchAllowedModels(env)
  const defaultModelId = allowedModels[0]?.id

  if (!defaultModelId) {
    sendJson(res, 400, { error: 'No allowed model available.' })
    return
  }

  const openrouter = createOpenRouter({ apiKey: env.openrouterApiKey })
  const model = openrouter.chat(defaultModelId)

  // Build message history for the model
  const messages: Array<{ role: 'system' | 'user' | 'assistant'; content: string }> = [
    { role: 'system', content: RAG_SYSTEM_PROMPT },
    {
      role: 'user',
      content: `Here is the document to analyze:\n\n---\n${document_text}\n---`,
    },
    {
      role: 'assistant',
      content:
        'I have read the document. Ask me any question and I will answer based only on what is in the document.',
    },
  ]

  // Append conversation history if provided
  if (Array.isArray(history)) {
    for (const entry of history) {
      if (entry.query && entry.response) {
        messages.push({ role: 'user', content: entry.query })
        messages.push({ role: 'assistant', content: entry.response })
      }
    }
  }

  // Append the current query
  messages.push({ role: 'user', content: query })

  // Generate response (non-streaming for reliability)
  try {
    const { text } = await generateText({
      model,
      messages,
    })

    sendJson(res, 200, { text })
  } catch (err) {
    console.error('RAG query error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    sendJson(res, 500, { error: message })
  }
}
