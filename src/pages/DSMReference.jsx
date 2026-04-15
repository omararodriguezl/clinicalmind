import { useState, useEffect, useRef } from 'react'
import {
  BookOpen, Star, MessageSquare, Loader,
  AlertCircle, ChevronDown, ChevronUp, Sparkles, X,
  Upload, FileCheck, Trash2, Info
} from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'
import { Layout } from '../components/layout/Layout'
import { Button } from '../components/ui/Button'
import { SearchInput } from '../components/ui/SearchInput'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { useAuth } from '../hooks/useAuth'
import { getDsmFavorites, addDsmFavorite, removeDsmFavorite } from '../utils/supabase'
import { queryDSM, getOpenAIKey } from '../utils/openai'
import { DSM5_QUICK_REF } from '../utils/constants'
import toast from 'react-hot-toast'

// Use CDN worker to avoid Vite bundling issues
pdfjsLib.GlobalWorkerOptions.workerSrc =
  'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'

const DSM_PDF_KEY = 'cm_dsm_pdf_text'
const DSM_PDF_NAME_KEY = 'cm_dsm_pdf_name'

// Simple keyword relevance search — returns the top matching passages (max ~3000 chars)
function searchPdfContext(pdfText, query, maxChars = 3500) {
  const stopWords = new Set(['the','a','an','and','or','of','in','to','for','is','are','was','were','be','been','that','this','with','from','at','by','have','has','had','what','how','when','can','do','does','did','not','it','its'])
  const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 2 && !stopWords.has(w))
  if (queryWords.length === 0) return ''

  // Split into paragraphs
  const paragraphs = pdfText
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(p => p.length > 40)

  // Score each paragraph
  const scored = paragraphs.map(p => {
    const lower = p.toLowerCase()
    const score = queryWords.reduce((s, w) => s + (lower.includes(w) ? 1 : 0), 0)
    return { text: p, score }
  }).filter(p => p.score > 0)

  scored.sort((a, b) => b.score - a.score)

  let result = ''
  for (const { text } of scored) {
    if (result.length + text.length + 2 > maxChars) break
    result += text + '\n\n'
  }
  return result.trim()
}

function DisorderCard({ disorder, isFavorite, onToggleFavorite }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="card hover:border-border-light transition-colors">
      <div className="flex items-start gap-3 p-4 cursor-pointer" onClick={() => setExpanded(v => !v)}>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-xs font-mono text-primary font-bold">{disorder.icd10}</span>
            <span className="text-xs text-text-muted">{disorder.category}</span>
          </div>
          <h3 className="text-sm font-semibold text-text-primary">{disorder.name}</h3>
          {!expanded && (
            <p className="text-xs text-text-muted mt-1 line-clamp-2">{disorder.criteria}</p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(disorder) }}
            className={`p-1.5 rounded-md transition-colors ${isFavorite ? 'text-yellow-400 hover:text-yellow-300' : 'text-text-muted hover:text-yellow-400'}`}
          >
            <Star className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
          </button>
          {expanded ? <ChevronUp className="w-4 h-4 text-text-muted" /> : <ChevronDown className="w-4 h-4 text-text-muted" />}
        </div>
      </div>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
          <div>
            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Diagnostic Criteria</div>
            <p className="text-sm text-text-secondary leading-relaxed">{disorder.criteria}</p>
          </div>
          <div>
            <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1.5">Differential Diagnoses</div>
            <div className="flex flex-wrap gap-1.5">
              {disorder.differentials.map((d, i) => (
                <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-surface-3 border border-border text-text-secondary">{d}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function DSMReference() {
  const { user } = useAuth()
  const fileInputRef = useRef(null)

  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [favorites, setFavorites] = useState([])

  // AI Consult
  const [aiQuestion, setAiQuestion] = useState('')
  const [aiAnswer, setAiAnswer] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState(null)
  const [showAIPanel, setShowAIPanel] = useState(false)

  // DSM PDF
  const [pdfName, setPdfName] = useState(() => localStorage.getItem(DSM_PDF_NAME_KEY) || '')
  const [pdfLoaded, setPdfLoaded] = useState(() => !!localStorage.getItem(DSM_PDF_KEY))
  const [uploadingPdf, setUploadingPdf] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [showPdfInfo, setShowPdfInfo] = useState(false)

  useEffect(() => {
    if (!user) return
    getDsmFavorites(user.id).then(setFavorites).catch(() => {})
  }, [user])

  const favoriteCodes = new Set(favorites.map(f => f.disorder_code))

  const handleToggleFavorite = async (disorder) => {
    const existing = favorites.find(f => f.disorder_code === disorder.code)
    if (existing) {
      await removeDsmFavorite(existing.id)
      setFavorites(prev => prev.filter(f => f.id !== existing.id))
      toast.success('Removed from favorites')
    } else {
      const added = await addDsmFavorite({ user_id: user.id, disorder_code: disorder.code, disorder_name: disorder.name })
      setFavorites(prev => [...prev, added])
      toast.success('Added to favorites')
    }
  }

  const handlePdfUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file || file.type !== 'application/pdf') {
      toast.error('Please select a PDF file')
      return
    }

    setUploadingPdf(true)
    setUploadProgress(0)

    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      const totalPages = pdf.numPages

      let fullText = ''
      // Extract text from all pages (cap at 600 pages to stay within storage limits)
      const maxPages = Math.min(totalPages, 600)
      for (let i = 1; i <= maxPages; i++) {
        const page = await pdf.getPage(i)
        const content = await page.getTextContent()
        const pageText = content.items.map(item => item.str).join(' ')
        fullText += pageText + '\n\n'
        setUploadProgress(Math.round((i / maxPages) * 100))
      }

      // Try to store; warn if too large
      try {
        localStorage.setItem(DSM_PDF_KEY, fullText)
        localStorage.setItem(DSM_PDF_NAME_KEY, file.name)
        setPdfName(file.name)
        setPdfLoaded(true)
        toast.success(`DSM-5 PDF loaded — ${totalPages} pages extracted`)
      } catch {
        toast.error('PDF text too large to store. Try a smaller file or a text-only PDF.')
      }
    } catch (err) {
      toast.error('Failed to read PDF: ' + err.message)
    } finally {
      setUploadingPdf(false)
      setUploadProgress(0)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemovePdf = () => {
    localStorage.removeItem(DSM_PDF_KEY)
    localStorage.removeItem(DSM_PDF_NAME_KEY)
    setPdfName('')
    setPdfLoaded(false)
    toast.success('DSM-5 PDF removed')
  }

  const handleAIQuery = async () => {
    if (!aiQuestion.trim()) return
    const key = getOpenAIKey()
    if (!key) { setAiError('OpenAI API key not configured. Go to Settings.'); return }

    setAiLoading(true)
    setAiError(null)
    setAiAnswer('')

    try {
      // If PDF is loaded, find relevant passages and include as context
      const pdfText = localStorage.getItem(DSM_PDF_KEY)
      let question = aiQuestion
      if (pdfText) {
        const context = searchPdfContext(pdfText, aiQuestion)
        if (context) {
          question = `Using the following DSM-5 reference text:\n\n---\n${context}\n---\n\nAnswer this clinical question: ${aiQuestion}`
        }
      }
      const answer = await queryDSM(question, key)
      setAiAnswer(answer)
    } catch (err) {
      setAiError(err.message)
    } finally {
      setAiLoading(false)
    }
  }

  const filtered = DSM5_QUICK_REF.filter(d => {
    const matchesSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.icd10.toLowerCase().includes(search.toLowerCase()) ||
      d.criteria.toLowerCase().includes(search.toLowerCase()) ||
      d.category.toLowerCase().includes(search.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || d.category === categoryFilter
    const matchesFav = !showFavoritesOnly || favoriteCodes.has(d.code)
    return matchesSearch && matchesCategory && matchesFav
  })

  const uniqueCategories = [...new Set(DSM5_QUICK_REF.map(d => d.category))]

  return (
    <Layout
      title="DSM-5 Reference"
      headerActions={
        <Button
          variant={showAIPanel ? 'primary' : 'secondary'}
          size="sm"
          icon={Sparkles}
          onClick={() => setShowAIPanel(v => !v)}
        >
          AI Consult
        </Button>
      }
    >
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Main content */}
        <div className="flex-1 min-w-0 space-y-4">
          {/* DSM PDF status bar */}
          <div className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-xs ${
            pdfLoaded
              ? 'bg-success/5 border-success/30'
              : 'bg-surface-2 border-border'
          }`}>
            {pdfLoaded ? (
              <>
                <FileCheck className="w-3.5 h-3.5 text-success flex-shrink-0" />
                <span className="text-success font-medium truncate flex-1">{pdfName}</span>
                <button onClick={() => setShowPdfInfo(true)} className="text-text-muted hover:text-text-secondary">
                  <Info className="w-3.5 h-3.5" />
                </button>
                <button onClick={handleRemovePdf} className="text-text-muted hover:text-danger transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            ) : (
              <>
                <BookOpen className="w-3.5 h-3.5 text-text-muted flex-shrink-0" />
                <span className="text-text-muted flex-1">Upload your DSM-5 PDF to enable full-text AI search</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf"
                  onChange={handlePdfUpload}
                  className="hidden"
                />
                <Button
                  variant="secondary"
                  size="xs"
                  icon={Upload}
                  loading={uploadingPdf}
                  onClick={() => fileInputRef.current?.click()}
                >
                  {uploadingPdf ? `${uploadProgress}%` : 'Upload PDF'}
                </Button>
              </>
            )}
          </div>

          {/* Search & filters */}
          <div className="space-y-2">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by disorder name, ICD-10 code, or symptom..."
            />
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowFavoritesOnly(v => !v)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${
                  showFavoritesOnly
                    ? 'bg-yellow-900/30 border-yellow-700 text-yellow-300'
                    : 'bg-surface-2 border-border text-text-secondary hover:border-border-light'
                }`}
              >
                <Star className="w-3 h-3" />
                Favorites ({favorites.length})
              </button>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="input-base py-1.5 text-xs w-auto"
              >
                <option value="all">All Categories</option>
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="text-xs text-text-muted">
            Showing {filtered.length} of {DSM5_QUICK_REF.length} disorders
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No disorders found"
              description="Try different search terms, or use AI Consult to ask a clinical question."
            />
          ) : (
            <div className="space-y-2">
              {filtered.map(disorder => (
                <DisorderCard
                  key={disorder.code}
                  disorder={disorder}
                  isFavorite={favoriteCodes.has(disorder.code)}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          )}
        </div>

        {/* AI Consult panel */}
        {showAIPanel && (
          <div className="w-full lg:w-80 flex-shrink-0">
            <div className="card p-4 sticky top-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  AI Clinical Consult
                </h3>
                <button onClick={() => setShowAIPanel(false)} className="text-text-muted hover:text-text-secondary">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {pdfLoaded && (
                <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-md bg-success/10 border border-success/25 mb-3">
                  <FileCheck className="w-3 h-3 text-success flex-shrink-0" />
                  <p className="text-[11px] text-success">Using your DSM-5 PDF as reference</p>
                </div>
              )}

              <p className="text-xs text-text-muted mb-3">
                Ask clinical questions about DSM-5 diagnoses, differential diagnosis, or treatment.
                {!pdfLoaded && ' Upload your PDF above for full-text answers.'}
              </p>

              <textarea
                value={aiQuestion}
                onChange={e => setAiQuestion(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleAIQuery())}
                placeholder="e.g. What differentiates PTSD from Adjustment Disorder?"
                rows={3}
                className="textarea-base text-sm mb-2"
              />
              <Button
                variant="primary"
                size="sm"
                className="w-full"
                loading={aiLoading}
                onClick={handleAIQuery}
                icon={MessageSquare}
              >
                Ask
              </Button>

              {aiError && (
                <div className="mt-3 flex items-start gap-2 p-2.5 rounded bg-danger-muted/20 border border-red-800/40">
                  <AlertCircle className="w-3.5 h-3.5 text-danger mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-red-300">{aiError}</p>
                </div>
              )}

              {aiLoading && (
                <div className="flex items-center gap-2 mt-3 text-xs text-text-muted">
                  <Loader className="w-3.5 h-3.5 animate-spin" />
                  Consulting GPT-4{pdfLoaded ? ' with your PDF' : ''}...
                </div>
              )}

              {aiAnswer && !aiLoading && (
                <div className="mt-3 p-3 rounded-lg bg-surface-3 border border-border max-h-80 overflow-y-auto">
                  <div className="space-y-1.5">
                    {aiAnswer.split('\n').map((line, i) => {
                      if (!line.trim()) return null
                      if (line.startsWith('#')) return (
                        <p key={i} className="text-xs font-bold text-primary">{line.replace(/^#+\s*/, '')}</p>
                      )
                      if (line.startsWith('**') && line.endsWith('**')) return (
                        <p key={i} className="text-xs font-semibold text-text-primary">{line.replace(/\*\*/g, '')}</p>
                      )
                      return <p key={i} className="text-xs text-text-secondary leading-relaxed">{line}</p>
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* PDF info modal */}
      <Modal isOpen={showPdfInfo} onClose={() => setShowPdfInfo(false)} title="DSM-5 PDF Reference" size="sm">
        <div className="space-y-3 text-sm">
          <div className="flex items-center gap-2 p-3 rounded-lg bg-success/5 border border-success/30">
            <FileCheck className="w-4 h-4 text-success" />
            <span className="text-success font-medium truncate">{pdfName}</span>
          </div>
          <p className="text-text-secondary text-xs leading-relaxed">
            Your DSM-5 PDF text has been extracted and stored locally in your browser. When you use AI Consult,
            the most relevant passages from your PDF are automatically included in the query to give you
            more accurate, DSM-5 specific answers.
          </p>
          <p className="text-text-muted text-xs">
            The PDF text is stored only in your browser's local storage and is never uploaded to any server.
          </p>
          <Button variant="danger" size="sm" icon={Trash2} className="w-full" onClick={() => { handleRemovePdf(); setShowPdfInfo(false) }}>
            Remove PDF
          </Button>
        </div>
      </Modal>
    </Layout>
  )
}
