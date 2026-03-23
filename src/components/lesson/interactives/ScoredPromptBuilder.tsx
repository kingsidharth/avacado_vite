import { useState, useCallback, useRef } from 'react'
import { animate } from 'animejs'
import { Send, Loader2, RotateCcw } from 'lucide-react'
import { apiUrl } from '@/lib/api/client'

// ============================================================================
// Types
// ============================================================================

interface ScoringConfig {
  role_keywords: string[]
  format_keywords: string[]
  tone_keywords: string[]
  audience_keywords: string[]
}

interface ScoreLabels {
  pro: string
  getting_there: string
  needs_work: string
  try_again: string
}

interface ScoredPromptBuilderProps {
  headline: string
  subline: string
  placeholder: string
  min_words: number
  scoring: ScoringConfig
  score_labels: ScoreLabels
  points: number
  onActivityComplete?: () => void
}

// ============================================================================
// Helpers
// ============================================================================

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function scorePrompt(text: string, scoring: ScoringConfig): number {
  const lower = text.toLowerCase()
  let total = 0

  if (scoring.role_keywords?.some((kw) => lower.includes(kw.toLowerCase()))) {
    total += 25
  }
  if (countWords(text) >= 15) {
    total += 20
  }
  if (scoring.format_keywords?.some((kw) => lower.includes(kw.toLowerCase()))) {
    total += 25
  }
  if (scoring.tone_keywords?.some((kw) => lower.includes(kw.toLowerCase()))) {
    total += 15
  }
  if (scoring.audience_keywords?.some((kw) => lower.includes(kw.toLowerCase()))) {
    total += 15
  }

  return Math.min(total, 100)
}

function getScoreLabel(score: number, labels: ScoreLabels): string {
  if (score >= 75) return labels.pro
  if (score >= 50) return labels.getting_there
  if (score >= 25) return labels.needs_work
  return labels.try_again
}

function getScoreColor(score: number): string {
  if (score >= 75) return 'text-green-600'
  if (score >= 50) return 'text-blue-600'
  if (score >= 25) return 'text-yellow-600'
  return 'text-red-500'
}

function getScoreRingColor(score: number): string {
  if (score >= 75) return 'stroke-green-500'
  if (score >= 50) return 'stroke-blue-500'
  if (score >= 25) return 'stroke-yellow-500'
  return 'stroke-red-400'
}

const FALLBACK_RESPONSE =
  "Great prompt! You've included clear instructions that would help an AI understand exactly what you need. The specificity in your request makes it much easier to generate a relevant, focused response."

// ============================================================================
// Component
// ============================================================================

export default function ScoredPromptBuilder(rawProps: Record<string, unknown>) {
  const props = rawProps as unknown as ScoredPromptBuilderProps
  const onActivityComplete = rawProps.onActivityComplete as (() => void) | undefined

  const {
    headline,
    subline,
    placeholder,
    min_words = 15,
    scoring,
    score_labels,
  } = props

  const [text, setText] = useState('')
  const [score, setScore] = useState<number | null>(null)
  const [displayScore, setDisplayScore] = useState(0)
  const [aiResponse, setAiResponse] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const completedCalledRef = useRef(false)
  const scoreCircleRef = useRef<SVGCircleElement>(null)

  const wordCount = countWords(text)
  const meetsMinWords = wordCount >= min_words

  // Callback ref for mount animation
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return

    const children = node.querySelectorAll('.prompt-animate')
    animate(children, {
      opacity: [0, 1],
      translateY: [12, 0],
      delay: (_el, i: number) => i * 80,
      duration: 300,
      ease: 'outQuad',
    })
  }, [])

  const animateScore = useCallback((targetScore: number) => {
    const proxy = { val: 0 }
    animate(proxy, {
      val: targetScore,
      duration: 800,
      ease: 'outQuad',
      onUpdate: () => {
        setDisplayScore(Math.round(proxy.val))
      },
    })

    // Animate the SVG ring
    if (scoreCircleRef.current) {
      const circumference = 2 * Math.PI * 40
      const offset = circumference - (targetScore / 100) * circumference
      animate(scoreCircleRef.current, {
        strokeDashoffset: [circumference, offset],
        duration: 800,
        ease: 'outQuad',
      })
    }
  }, [])

  const handleSend = useCallback(async () => {
    if (!text.trim() || loading) return

    const finalScore = scorePrompt(text, scoring)
    setScore(finalScore)
    setLoading(true)
    setAiResponse(null)

    // Animate score
    setTimeout(() => animateScore(finalScore), 100)

    // POST to /api/chat for a response
    try {
      const res = await fetch(apiUrl('/api/chat'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [
            {
              role: 'system',
              content:
                'You are a helpful AI assistant. Respond concisely in 2-3 sentences to the user prompt. Keep your response practical and direct.',
            },
            { role: 'user', content: text },
          ],
        }),
      })

      if (!res.ok) throw new Error('API error')

      // Try to parse streaming or JSON response
      const contentType = res.headers.get('content-type') || ''
      if (contentType.includes('application/json')) {
        const json = (await res.json()) as { text?: string; content?: string; message?: string }
        setAiResponse(json.text || json.content || json.message || FALLBACK_RESPONSE)
      } else {
        // Streaming text response — read all
        const responseText = await res.text()
        // Try to extract meaningful text from potential SSE stream
        const lines = responseText.split('\n').filter((l) => l.startsWith('0:'))
        if (lines.length > 0) {
          const parsed = lines.map((l) => {
            try {
              return JSON.parse(l.slice(2)) as string
            } catch {
              return ''
            }
          }).join('')
          setAiResponse(parsed || FALLBACK_RESPONSE)
        } else {
          setAiResponse(responseText.trim() || FALLBACK_RESPONSE)
        }
      }
    } catch {
      setAiResponse(FALLBACK_RESPONSE)
    } finally {
      setLoading(false)

      if (!completedCalledRef.current) {
        completedCalledRef.current = true
        onActivityComplete?.()
      }
    }
  }, [text, loading, scoring, animateScore, onActivityComplete])

  const handleReset = useCallback(() => {
    setScore(null)
    setDisplayScore(0)
    setAiResponse(null)
  }, [])

  return (
    <div ref={containerRef} className="flex flex-col gap-4 px-4 py-5">
      {/* Header */}
      <div className="prompt-animate space-y-1" style={{ opacity: 0 }}>
        <h2 className="text-lg font-semibold tracking-tight">{headline}</h2>
        <p className="text-sm text-muted-foreground">{subline}</p>
      </div>

      {/* Textarea */}
      <div className="prompt-animate space-y-2" style={{ opacity: 0 }}>
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            if (score !== null) handleReset()
          }}
          placeholder={placeholder}
          rows={4}
          className="w-full resize-none rounded-xl border-2 border-gray-200 bg-white p-3 text-sm leading-relaxed transition-colors focus:border-blue-400 focus:outline-none"
        />

        {/* Word counter */}
        <div className="flex items-center justify-between">
          <p
            className={`text-xs font-medium transition-colors ${
              meetsMinWords ? 'text-green-600' : 'text-muted-foreground'
            }`}
          >
            {wordCount} words (aim for {min_words}+)
          </p>

          {/* Send / Edit buttons */}
          {score === null ? (
            <button
              onClick={handleSend}
              disabled={!text.trim() || loading}
              className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97]"
            >
              {loading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              Send
            </button>
          ) : (
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 rounded-lg border-2 border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 active:scale-[0.97]"
            >
              <RotateCcw className="size-3.5" />
              Edit & Re-send
            </button>
          )}
        </div>
      </div>

      {/* Score display */}
      {score !== null && (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-gray-200 bg-gray-50/80 p-5">
          {/* Score circle */}
          <div className="relative flex size-24 items-center justify-center">
            <svg className="-rotate-90" width="96" height="96" viewBox="0 0 96 96">
              <circle
                cx="48"
                cy="48"
                r="40"
                fill="none"
                className="stroke-gray-200"
                strokeWidth="6"
              />
              <circle
                ref={scoreCircleRef}
                cx="48"
                cy="48"
                r="40"
                fill="none"
                className={getScoreRingColor(score)}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${2 * Math.PI * 40}`}
                strokeDashoffset={`${2 * Math.PI * 40}`}
              />
            </svg>
            <span className={`absolute text-2xl font-bold ${getScoreColor(score)}`}>
              {displayScore}
            </span>
          </div>

          {/* Label */}
          <p className={`text-sm font-semibold ${getScoreColor(score)}`}>
            {getScoreLabel(score, score_labels)}
          </p>
        </div>
      )}

      {/* AI Response */}
      {loading && (
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-4">
          <Loader2 className="size-4 animate-spin text-blue-500" />
          <span className="text-sm text-muted-foreground">AI is thinking...</span>
        </div>
      )}

      {aiResponse && !loading && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-blue-600">
            AI Response
          </p>
          <p className="text-sm leading-relaxed text-gray-800">{aiResponse}</p>
        </div>
      )}
    </div>
  )
}
