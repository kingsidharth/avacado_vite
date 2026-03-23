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

const MAX_USER_PROMPT_CHARS = 15_000
const MAX_SYSTEM_PROMPT_CHARS = 5_000

// ============================================================================
// Types
// ============================================================================

interface LessonGenerateBody {
  system_prompt: string
  user_prompt: string
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
  let body: LessonGenerateBody
  try {
    body = await readBodyJson<LessonGenerateBody>(req)
  } catch {
    sendJson(res, 400, { error: 'Invalid JSON body.' })
    return
  }

  const { system_prompt, user_prompt } = body

  if (!system_prompt || typeof system_prompt !== 'string') {
    sendJson(res, 400, { error: 'Missing or invalid system_prompt.' })
    return
  }

  if (!user_prompt || typeof user_prompt !== 'string') {
    sendJson(res, 400, { error: 'Missing or invalid user_prompt.' })
    return
  }

  if (system_prompt.length > MAX_SYSTEM_PROMPT_CHARS) {
    sendJson(res, 400, {
      error: `system_prompt too long. Maximum ${MAX_SYSTEM_PROMPT_CHARS} characters.`,
    })
    return
  }

  if (user_prompt.length > MAX_USER_PROMPT_CHARS) {
    sendJson(res, 400, {
      error: `user_prompt too long. Maximum ${MAX_USER_PROMPT_CHARS} characters.`,
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

  // Build messages
  const messages: Array<{ role: 'system' | 'user'; content: string }> = [
    { role: 'system', content: system_prompt },
    { role: 'user', content: user_prompt },
  ]

  // Generate response (non-streaming for reliability)
  try {
    const { text } = await generateText({
      model,
      messages,
    })

    sendJson(res, 200, { text })
  } catch (err) {
    console.error('Lesson generate error:', err)
    const message = err instanceof Error ? err.message : 'Unknown error'
    sendJson(res, 500, { error: message })
  }
}
