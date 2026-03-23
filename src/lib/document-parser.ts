// ============================================================================
// Client-side document parser for PDF, DOCX, and TXT files
// ============================================================================

export interface ParsedDocument {
  text: string
  wordCount: number
  pageEstimate: number
  format: 'pdf' | 'docx' | 'txt'
}

/**
 * Parse a user-uploaded file into plain text.
 * Supports .pdf (via pdfjs-dist), .docx (via mammoth), and .txt.
 */
export async function parseDocument(file: File): Promise<ParsedDocument> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? ''

  if (ext === 'pdf') return parsePdf(file)
  if (ext === 'docx') return parseDocx(file)
  return parseTxt(file)
}

// ============================================================================
// PDF Parsing
// ============================================================================

async function parsePdf(file: File): Promise<ParsedDocument> {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist')

  // Use the bundled worker
  GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).href

  const arrayBuffer = await file.arrayBuffer()
  const pdf = await getDocument({ data: arrayBuffer }).promise

  const pages: string[] = []
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i)
    const content = await page.getTextContent()
    const text = content.items
      .map((item: Record<string, unknown>) => ('str' in item ? (item.str as string) : ''))
      .join(' ')
    pages.push(text)
  }

  const fullText = pages.join('\n\n')
  return {
    text: fullText,
    wordCount: fullText.trim().split(/\s+/).filter(Boolean).length,
    pageEstimate: pdf.numPages,
    format: 'pdf',
  }
}

// ============================================================================
// DOCX Parsing
// ============================================================================

async function parseDocx(file: File): Promise<ParsedDocument> {
  const mammoth = await import('mammoth')
  const arrayBuffer = await file.arrayBuffer()
  const result = await mammoth.extractRawText({ arrayBuffer })
  const text = result.value
  return {
    text,
    wordCount: text.trim().split(/\s+/).filter(Boolean).length,
    pageEstimate: Math.max(1, Math.ceil(text.length / 3000)),
    format: 'docx',
  }
}

// ============================================================================
// Plain Text Parsing
// ============================================================================

async function parseTxt(file: File): Promise<ParsedDocument> {
  const text = await file.text()
  return {
    text,
    wordCount: text.trim().split(/\s+/).filter(Boolean).length,
    pageEstimate: Math.max(1, Math.ceil(text.length / 3000)),
    format: 'txt',
  }
}

// ============================================================================
// Load sample document from URL
// ============================================================================

export async function parseDocumentFromUrl(url: string): Promise<ParsedDocument> {
  const res = await fetch(url)
  const text = await res.text()
  return {
    text,
    wordCount: text.trim().split(/\s+/).filter(Boolean).length,
    pageEstimate: Math.max(1, Math.ceil(text.length / 3000)),
    format: 'txt',
  }
}
