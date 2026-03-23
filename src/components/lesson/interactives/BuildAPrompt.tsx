import { useState, useCallback, useRef } from 'react'
import { animate } from 'animejs'
import { Loader2, Copy, Check, AlertCircle, Sparkles, Mail, MessageSquare, ListOrdered, BarChart3 } from 'lucide-react'
import { apiUrl } from '@/lib/api/client'
import { useLessonWorkspaceStore } from '@/store/lesson-workspace'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

interface PromptField {
  id: string
  label: string
  type: 'dropdown' | 'text' | 'textarea'
  placeholder?: string
  options?: string[]
  required: boolean
}

interface BuildAPromptProps {
  headline: string
  subline: string
  fields: PromptField[]
  system_prompt: string
  prompt_template: string
  output_label: string
  output_format: 'email' | 'message' | 'outline' | 'analysis'
  store_key: string
  cta_text: string
  points: number
  show_copy: boolean
  onActivityComplete?: () => void
}

type Phase = 'form' | 'loading' | 'result' | 'error'

// ============================================================================
// Helpers
// ============================================================================

function buildPromptFromTemplate(template: string, values: Record<string, string>): string {
  let result = template
  for (const [key, value] of Object.entries(values)) {
    result = result.replaceAll(`{${key}}`, value)
  }
  return result
}

async function fetchLessonGenerate(
  systemPrompt: string,
  userPrompt: string
): Promise<string> {
  const res = await fetch(apiUrl('/api/lesson-generate'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ system_prompt: systemPrompt, user_prompt: userPrompt }),
  })

  if (!res.ok) {
    const errorBody = await res.text()
    console.error('lesson-generate API error:', res.status, errorBody)
    throw new Error(`API error ${res.status}`)
  }

  const json = (await res.json()) as { text?: string; error?: string }
  if (json.error) throw new Error(json.error)
  if (!json.text) throw new Error('No text in response')
  return json.text
}

// ============================================================================
// Output Format Renderers
// ============================================================================

function EmailOutput({ text }: { text: string }) {
  const lines = text.split('\n').filter((l) => l.trim())
  // Try to extract subject from first line if it looks like "Subject: ..."
  let subject = ''
  let bodyLines = lines

  const subjectIdx = lines.findIndex((l) => l.toLowerCase().startsWith('subject:'))
  if (subjectIdx !== -1) {
    subject = lines[subjectIdx].replace(/^subject:\s*/i, '')
    bodyLines = lines.filter((_, i) => i !== subjectIdx)
  }

  return (
    <div className="flex flex-col gap-0 rounded-xl border border-gray-200 bg-gray-50/60 overflow-hidden">
      {subject && (
        <div className="border-b border-gray-200 bg-white px-4 py-2.5">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Subject</p>
          <p className="text-sm font-medium text-foreground">{subject}</p>
        </div>
      )}
      <div className="px-4 py-3">
        {bodyLines.map((line, i) => (
          <p key={i} className="text-sm leading-relaxed text-gray-800">
            {line}
            {i < bodyLines.length - 1 && <br />}
          </p>
        ))}
      </div>
    </div>
  )
}

function MessageOutput({ text }: { text: string }) {
  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4">
      <div className="flex items-center gap-2 mb-2">
        <div className="flex size-6 items-center justify-center rounded-full bg-blue-100">
          <MessageSquare className="size-3 text-blue-600" />
        </div>
        <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600">Message</p>
      </div>
      <p className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">{text}</p>
    </div>
  )
}

function OutlineOutput({ text }: { text: string }) {
  const lines = text.split('\n').filter((l) => l.trim())

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2 mb-3">
        <ListOrdered className="size-4 text-blue-500" />
        <p className="text-[10px] font-semibold uppercase tracking-wide text-blue-600">Outline</p>
      </div>
      <div className="flex flex-col gap-1.5">
        {lines.map((line, i) => (
          <p key={i} className="text-sm leading-relaxed text-gray-800">{line}</p>
        ))}
      </div>
    </div>
  )
}

function AnalysisOutput({ text }: { text: string }) {
  const lines = text.split('\n').filter((l) => l.trim())
  // First line as summary, rest as bullet points
  const summary = lines[0] || ''
  const bullets = lines.slice(1)

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="size-4 text-purple-500" />
        <p className="text-[10px] font-semibold uppercase tracking-wide text-purple-600">Analysis</p>
      </div>
      {summary && (
        <p className="text-sm font-medium text-foreground mb-2">{summary}</p>
      )}
      {bullets.length > 0 && (
        <div className="flex flex-col gap-1">
          {bullets.map((line, i) => (
            <p key={i} className="text-sm leading-relaxed text-gray-700">{line}</p>
          ))}
        </div>
      )}
    </div>
  )
}

const OUTPUT_RENDERERS: Record<string, React.FC<{ text: string }>> = {
  email: EmailOutput,
  message: MessageOutput,
  outline: OutlineOutput,
  analysis: AnalysisOutput,
}

const FORMAT_ICONS: Record<string, React.FC<{ className?: string }>> = {
  email: Mail,
  message: MessageSquare,
  outline: ListOrdered,
  analysis: BarChart3,
}

// ============================================================================
// Component
// ============================================================================

export default function BuildAPrompt(rawProps: Record<string, unknown>) {
  const props = rawProps as unknown as BuildAPromptProps
  const onActivityComplete = rawProps.onActivityComplete as (() => void) | undefined

  const {
    headline,
    subline,
    fields = [],
    system_prompt,
    prompt_template,
    output_label,
    output_format = 'email',
    store_key,
    cta_text,
    points,
    show_copy,
  } = props

  // Store
  const setWorkspaceData = useLessonWorkspaceStore((s) => s.setWorkspaceData)

  // State
  const [phase, setPhase] = useState<Phase>('form')
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({})
  const [aiOutput, setAiOutput] = useState('')
  const [errorMessage, setErrorMessage] = useState('')
  const [copied, setCopied] = useState(false)

  const completedCalledRef = useRef(false)

  // Check if all required fields are filled
  const allRequiredFilled = fields
    .filter((f) => f.required)
    .every((f) => (fieldValues[f.id] || '').trim().length > 0)

  // Mount animation
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    const children = node.querySelectorAll('.bap-animate')
    animate(children, {
      opacity: [0, 1],
      translateY: [16, 0],
      delay: (_el, i: number) => i * 100,
      duration: 350,
      ease: 'outQuad',
    })
  }, [])

  // Output card animation
  const outputRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    animate(node, {
      opacity: [0, 1],
      scale: [0.96, 1],
      duration: 400,
      ease: 'outQuad',
    })
  }, [])

  // Update a field value
  const updateField = useCallback((id: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [id]: value }))
  }, [])

  // Submit form
  const handleSubmit = useCallback(async () => {
    if (!allRequiredFilled) return

    setPhase('loading')
    setErrorMessage('')

    try {
      const userPrompt = buildPromptFromTemplate(prompt_template, fieldValues)
      const text = await fetchLessonGenerate(system_prompt, userPrompt)

      setAiOutput(text)
      setWorkspaceData(store_key, text)
      setPhase('result')

      if (!completedCalledRef.current) {
        completedCalledRef.current = true
        onActivityComplete?.()
      }
    } catch (err) {
      console.error('BuildAPrompt error:', err)
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
      setPhase('error')
    }
  }, [allRequiredFilled, prompt_template, fieldValues, system_prompt, store_key, setWorkspaceData, onActivityComplete])

  // Copy to clipboard
  const handleCopy = useCallback(async () => {
    if (!aiOutput) return
    try {
      await navigator.clipboard.writeText(aiOutput)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      console.error('Failed to copy to clipboard')
    }
  }, [aiOutput])

  // Retry on error
  const handleRetry = useCallback(() => {
    setPhase('form')
    setErrorMessage('')
  }, [])

  // Get the appropriate output renderer
  const OutputRenderer = OUTPUT_RENDERERS[output_format] || EmailOutput
  const FormatIcon = FORMAT_ICONS[output_format] || Mail

  // ---------------------------------------------------------------
  // Render: Form phase
  // ---------------------------------------------------------------
  if (phase === 'form') {
    return (
      <div ref={containerRef} className="flex flex-col gap-4 px-4 py-5">
        {/* Header */}
        <div className="bap-animate space-y-1" style={{ opacity: 0 }}>
          <h2 className="text-lg font-semibold tracking-tight">{headline}</h2>
          <p className="text-sm text-muted-foreground">{subline}</p>
        </div>

        {/* Fields */}
        <div className="bap-animate flex flex-col gap-3" style={{ opacity: 0 }}>
          {fields.map((field) => (
            <div key={field.id} className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-foreground">
                {field.label}
                {field.required && <span className="ml-0.5 text-red-400">*</span>}
              </label>

              {field.type === 'dropdown' && (
                <select
                  value={fieldValues[field.id] || ''}
                  onChange={(e) => updateField(field.id, e.target.value)}
                  className="w-full rounded-xl border-2 border-gray-200 bg-white px-3 py-2.5 text-sm transition-colors focus:border-blue-400 focus:outline-none"
                >
                  <option value="">{field.placeholder || 'Select...'}</option>
                  {(field.options || []).map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              )}

              {field.type === 'text' && (
                <input
                  type="text"
                  value={fieldValues[field.id] || ''}
                  onChange={(e) => updateField(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  className="w-full rounded-xl border-2 border-gray-200 bg-white px-3 py-2.5 text-sm transition-colors focus:border-blue-400 focus:outline-none"
                />
              )}

              {field.type === 'textarea' && (
                <textarea
                  value={fieldValues[field.id] || ''}
                  onChange={(e) => updateField(field.id, e.target.value)}
                  placeholder={field.placeholder}
                  rows={3}
                  className="w-full resize-none rounded-xl border-2 border-gray-200 bg-white px-3 py-2.5 text-sm leading-relaxed transition-colors focus:border-blue-400 focus:outline-none"
                />
              )}
            </div>
          ))}
        </div>

        {/* CTA */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!allRequiredFilled}
          style={{ opacity: 0 }}
          className={cn(
            'bap-animate flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold transition-all active:scale-[0.98]',
            allRequiredFilled
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
          )}
        >
          <Sparkles className="size-4" />
          {cta_text}
        </button>
      </div>
    )
  }

  // ---------------------------------------------------------------
  // Render: Loading phase
  // ---------------------------------------------------------------
  if (phase === 'loading') {
    return (
      <div ref={containerRef} className="flex flex-col gap-4 px-4 py-5">
        <div className="bap-animate space-y-1" style={{ opacity: 0 }}>
          <h2 className="text-lg font-semibold tracking-tight">{headline}</h2>
          <p className="text-sm text-muted-foreground">{subline}</p>
        </div>

        <div className="bap-animate flex flex-col items-center gap-3 rounded-xl border border-gray-200 bg-gray-50/50 p-6" style={{ opacity: 0 }}>
          <Loader2 className="size-6 animate-spin text-blue-500" />
          <p className="text-sm text-muted-foreground">Generating your {output_format}...</p>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------
  // Render: Error phase
  // ---------------------------------------------------------------
  if (phase === 'error') {
    return (
      <div ref={containerRef} className="flex flex-col gap-4 px-4 py-5">
        <div className="bap-animate space-y-1" style={{ opacity: 0 }}>
          <h2 className="text-lg font-semibold tracking-tight">{headline}</h2>
          <p className="text-sm text-muted-foreground">{subline}</p>
        </div>

        <div className="bap-animate flex flex-col items-center gap-3 rounded-xl border-2 border-red-200 bg-red-50/50 p-5" style={{ opacity: 0 }}>
          <AlertCircle className="size-5 text-red-500" />
          <p className="text-sm text-center text-red-700">{errorMessage}</p>
          <button
            type="button"
            onClick={handleRetry}
            className="rounded-xl bg-red-600 px-5 py-2 text-sm font-semibold text-white transition-all hover:bg-red-700 active:scale-[0.97]"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  // ---------------------------------------------------------------
  // Render: Result phase
  // ---------------------------------------------------------------
  return (
    <div ref={containerRef} className="flex flex-col gap-4 px-4 py-5">
      <div className="bap-animate space-y-1" style={{ opacity: 0 }}>
        <h2 className="text-lg font-semibold tracking-tight">{headline}</h2>
        <p className="text-sm text-muted-foreground">{subline}</p>
      </div>

      {/* Output label */}
      <div className="bap-animate flex items-center gap-2" style={{ opacity: 0 }}>
        <FormatIcon className="size-4 text-blue-500" />
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">{output_label}</p>
      </div>

      {/* Output card */}
      <div ref={outputRef} style={{ opacity: 0 }}>
        <OutputRenderer text={aiOutput} />
      </div>

      {/* Actions row */}
      <div className="bap-animate flex items-center gap-3" style={{ opacity: 0 }}>
        {show_copy && (
          <button
            type="button"
            onClick={handleCopy}
            className={cn(
              'flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold transition-all active:scale-[0.97]',
              copied
                ? 'border-2 border-green-300 bg-green-50 text-green-700'
                : 'border-2 border-gray-200 bg-white text-foreground hover:border-blue-300 hover:bg-blue-50'
            )}
          >
            {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        )}
      </div>

      {/* Points badge */}
      <div className="bap-animate flex flex-col items-center gap-1 rounded-xl border border-green-200 bg-green-50/60 py-3" style={{ opacity: 0 }}>
        <p className="text-sm font-semibold text-green-800">Generated!</p>
        <p className="text-xs text-muted-foreground">+{points} points</p>
      </div>
    </div>
  )
}
