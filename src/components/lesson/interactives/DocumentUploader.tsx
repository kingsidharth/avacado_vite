import { useState, useCallback, useRef } from 'react'
import { animate } from 'animejs'
import { Upload, FileText, CheckCircle2, AlertCircle, RefreshCw, Loader2, BookOpen } from 'lucide-react'
import { parseDocument, parseDocumentFromUrl } from '@/lib/document-parser'
import type { ParsedDocument } from '@/lib/document-parser'
import { useDocumentStore } from '@/store/document'
import { cn } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

interface DocumentUploaderProps {
  headline: string
  subline: string
  accepted_types: string[]
  max_size_mb: number
  sample_doc_url: string
  sample_doc_label: string
  success_message: string
  points: number
  onActivityComplete?: () => void
}

// ============================================================================
// Helpers
// ============================================================================

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getDocType(fileName: string): 'pdf' | 'docx' | 'txt' {
  const ext = fileName.split('.').pop()?.toLowerCase() ?? ''
  if (ext === 'pdf') return 'pdf'
  if (ext === 'docx') return 'docx'
  return 'txt'
}

function isAcceptedType(fileName: string, acceptedTypes: string[]): boolean {
  const ext = `.${fileName.split('.').pop()?.toLowerCase() ?? ''}`
  return acceptedTypes.some((t) => t.toLowerCase() === ext)
}

// ============================================================================
// Component
// ============================================================================

export default function DocumentUploader(rawProps: Record<string, unknown>) {
  const props = rawProps as unknown as DocumentUploaderProps
  const onActivityComplete = rawProps.onActivityComplete as (() => void) | undefined

  const {
    headline,
    subline,
    accepted_types = ['.pdf', '.docx', '.txt'],
    max_size_mb = 5,
    sample_doc_url,
    sample_doc_label,
    success_message,
    points,
  } = props

  // State
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploaded, setUploaded] = useState<ParsedDocument | null>(null)
  const [uploadedName, setUploadedName] = useState<string | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const completedCalledRef = useRef(false)

  const setDocument = useDocumentStore((s) => s.setDocument)

  // Mount animation via callback ref
  const containerRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    const children = node.querySelectorAll('.du-animate')
    animate(children, {
      opacity: [0, 1],
      translateY: [16, 0],
      delay: (_el, i: number) => i * 100,
      duration: 350,
      ease: 'outQuad',
    })
  }, [])

  // Success animation via callback ref
  const successRef = useCallback((node: HTMLDivElement | null) => {
    if (!node) return
    animate(node, {
      opacity: [0, 1],
      translateY: [12, 0],
      scale: [0.97, 1],
      duration: 400,
      ease: 'outQuad',
    })
  }, [])

  // Process a file after selection/drop
  const processFile = useCallback(
    async (file: File) => {
      setError(null)

      // Validate type
      if (!isAcceptedType(file.name, accepted_types)) {
        setError(`Unsupported file type. Accepted: ${accepted_types.join(', ')}`)
        return
      }

      // Validate size
      const maxBytes = max_size_mb * 1024 * 1024
      if (file.size > maxBytes) {
        setError(`File too large. Maximum size is ${max_size_mb} MB. Your file is ${formatFileSize(file.size)}.`)
        return
      }

      setUploading(true)

      try {
        const parsed = await parseDocument(file)
        setUploaded(parsed)
        setUploadedName(file.name)
        setDocument(parsed.text, file.name, getDocType(file.name))

        if (!completedCalledRef.current) {
          completedCalledRef.current = true
          onActivityComplete?.()
        }
      } catch {
        setError('Failed to parse document. Please try a different file.')
      } finally {
        setUploading(false)
      }
    },
    [accepted_types, max_size_mb, setDocument, onActivityComplete]
  )

  // Handle sample document
  const handleSampleDoc = useCallback(async () => {
    setError(null)
    setUploading(true)

    try {
      const parsed = await parseDocumentFromUrl(sample_doc_url)
      const sampleName = sample_doc_url.split('/').pop() ?? 'sample-document.txt'
      setUploaded(parsed)
      setUploadedName(sampleName)
      setDocument(parsed.text, sampleName, 'sample')

      if (!completedCalledRef.current) {
        completedCalledRef.current = true
        onActivityComplete?.()
      }
    } catch {
      setError('Failed to load sample document. Please try uploading your own file.')
    } finally {
      setUploading(false)
    }
  }, [sample_doc_url, setDocument, onActivityComplete])

  // Drag-and-drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      const files = e.dataTransfer.files
      if (files.length > 0) {
        processFile(files[0])
      }
    },
    [processFile]
  )

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        processFile(files[0])
      }
      // Reset so re-selecting same file works
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    },
    [processFile]
  )

  const handleClickZone = useCallback(() => {
    if (uploading) return
    fileInputRef.current?.click()
  }, [uploading])

  const handleChangeDocument = useCallback(() => {
    setUploaded(null)
    setUploadedName(null)
    setError(null)
    completedCalledRef.current = false
  }, [])

  // ---------------------------------------------------------------
  // Render: Success State
  // ---------------------------------------------------------------
  if (uploaded && uploadedName) {
    return (
      <div ref={containerRef} className="flex flex-col gap-4 px-4 py-5">
        <div className="du-animate space-y-1" style={{ opacity: 0 }}>
          <h2 className="text-lg font-semibold tracking-tight">{headline}</h2>
          <p className="text-sm text-muted-foreground">{subline}</p>
        </div>

        <div ref={successRef} className="flex flex-col gap-3 rounded-2xl border-2 border-green-200 bg-green-50/60 p-5" style={{ opacity: 0 }}>
          <div className="flex items-start gap-3">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green-100">
              <CheckCircle2 className="size-5 text-green-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-green-800">{success_message}</p>
              <p className="mt-0.5 truncate text-xs text-green-700/80">{uploadedName}</p>
            </div>
          </div>

          <div className="flex items-center gap-4 rounded-xl bg-white/70 px-3 py-2.5">
            <div className="flex items-center gap-1.5">
              <FileText className="size-3.5 text-gray-500" />
              <span className="text-xs font-medium text-gray-700">{uploaded.wordCount.toLocaleString()} words</span>
            </div>
            <div className="flex items-center gap-1.5">
              <BookOpen className="size-3.5 text-gray-500" />
              <span className="text-xs font-medium text-gray-700">
                ~{uploaded.pageEstimate} {uploaded.pageEstimate === 1 ? 'page' : 'pages'}
              </span>
            </div>
            <div className="ml-auto">
              <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-green-700">
                {uploaded.format}
              </span>
            </div>
          </div>

          <p className="text-xs text-muted-foreground">+{points} points</p>
        </div>

        <button
          type="button"
          onClick={handleChangeDocument}
          className="flex items-center justify-center gap-1.5 rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-all hover:bg-gray-50 active:scale-[0.98]"
        >
          <RefreshCw className="size-3.5" />
          Change Document
        </button>
      </div>
    )
  }

  // ---------------------------------------------------------------
  // Render: Upload State
  // ---------------------------------------------------------------
  return (
    <div ref={containerRef} className="flex flex-col gap-4 px-4 py-5">
      {/* Header */}
      <div className="du-animate space-y-1" style={{ opacity: 0 }}>
        <h2 className="text-lg font-semibold tracking-tight">{headline}</h2>
        <p className="text-sm text-muted-foreground">{subline}</p>
      </div>

      {/* Drop Zone */}
      <div>
        <button
          type="button"
          onClick={handleClickZone}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          disabled={uploading}
          className={cn(
            'flex w-full flex-col items-center gap-3 rounded-2xl border-2 border-dashed p-8 transition-all duration-200',
            dragActive
              ? 'border-blue-400 bg-blue-50/50 scale-[1.01]'
              : 'border-gray-300 bg-gray-50/40 hover:border-gray-400 hover:bg-gray-50',
            uploading && 'pointer-events-none opacity-60'
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="size-8 animate-spin text-blue-500" />
              <p className="text-sm font-medium text-blue-600">Processing document...</p>
            </>
          ) : (
            <>
              <div
                className={cn(
                  'flex size-12 items-center justify-center rounded-full transition-colors',
                  dragActive ? 'bg-blue-100' : 'bg-gray-100'
                )}
              >
                <Upload className={cn('size-5', dragActive ? 'text-blue-500' : 'text-gray-500')} />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  {dragActive ? 'Drop your file here' : 'Drop a file or click to browse'}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {accepted_types.join(', ')} up to {max_size_mb} MB
                </p>
              </div>
            </>
          )}
        </button>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept={accepted_types.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Sample Document Button */}
      {sample_doc_url && (
        <button
          type="button"
          onClick={handleSampleDoc}
          disabled={uploading}
          className="flex items-center justify-center gap-2 rounded-xl border-2 border-blue-200 bg-blue-50/50 px-4 py-3 text-sm font-medium text-blue-700 transition-all hover:bg-blue-50 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <FileText className="size-4" />
          {sample_doc_label || 'Use Sample Document'}
        </button>
      )}

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50/60 p-3">
          <AlertCircle className="mt-0.5 size-4 shrink-0 text-red-500" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}
    </div>
  )
}
