import { useState, useEffect } from 'react'
import {
  BookOpen, Star, StarOff, Search, MessageSquare, Loader,
  AlertCircle, ChevronDown, ChevronUp, Sparkles, X
} from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { Button } from '../components/ui/Button'
import { SearchInput } from '../components/ui/SearchInput'
import { EmptyState } from '../components/ui/EmptyState'
import { Modal } from '../components/ui/Modal'
import { useAuth } from '../hooks/useAuth'
import { getDsmFavorites, addDsmFavorite, removeDsmFavorite } from '../utils/supabase'
import { queryDSM, getOpenAIKey } from '../utils/openai'
import { DSM5_QUICK_REF, DSM5_CATEGORIES } from '../utils/constants'
import toast from 'react-hot-toast'

function DisorderCard({ disorder, isFavorite, onToggleFavorite }) {
  const [expanded, setExpanded] = useState(false)

  return (
    <div className="card hover:border-border-light transition-colors">
      <div
        className="flex items-start gap-3 p-4 cursor-pointer"
        onClick={() => setExpanded(v => !v)}
      >
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
            {isFavorite ? <Star className="w-3.5 h-3.5 fill-current" /> : <Star className="w-3.5 h-3.5" />}
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
                <span key={i} className="text-xs px-2 py-0.5 rounded-full bg-surface-3 border border-border text-text-secondary">
                  {d}
                </span>
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
  const [search, setSearch] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [favorites, setFavorites] = useState([])
  const [aiQuestion, setAiQuestion] = useState('')
  const [aiAnswer, setAiAnswer] = useState('')
  const [aiLoading, setAiLoading] = useState(false)
  const [aiError, setAiError] = useState(null)
  const [showAIPanel, setShowAIPanel] = useState(false)

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
      const added = await addDsmFavorite({
        user_id: user.id,
        disorder_code: disorder.code,
        disorder_name: disorder.name,
      })
      setFavorites(prev => [...prev, added])
      toast.success('Added to favorites')
    }
  }

  const handleAIQuery = async () => {
    if (!aiQuestion.trim()) return
    const key = getOpenAIKey()
    if (!key) {
      setAiError('OpenAI API key not configured. Go to Settings.')
      return
    }
    setAiLoading(true)
    setAiError(null)
    setAiAnswer('')
    try {
      const answer = await queryDSM(aiQuestion, key)
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

          {/* Results */}
          <div className="text-xs text-text-muted mb-2">
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
              <p className="text-xs text-text-muted mb-3">
                Ask GPT-4 clinical questions about DSM-5 diagnoses, differential diagnosis, or treatment considerations.
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
                  Consulting GPT-4...
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
    </Layout>
  )
}
