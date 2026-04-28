import { useState, useEffect } from 'react'
import { Layout } from '../components/layout/Layout'
import { Button } from '../components/ui/Button'
import { ClinicianScratchpad } from '../components/recording/ClinicianScratchpad'
import { useAuth } from '../hooks/useAuth'
import { saveGroupSession, getGroupSessions, saveClinicianNote } from '../utils/supabase'
import { generateGroupSession, getOpenAIKey } from '../utils/openai'
import {
  ChevronDown, ChevronUp, FileText, Clock, MessageSquare,
  Zap, HelpCircle, CheckCircle, AlertCircle, Loader,
  Search, GraduationCap, ArrowLeft, Save, RefreshCw,
} from 'lucide-react'
import toast from 'react-hot-toast'

// ── Section config ─────────────────────────────────────────────────────────────

const SECTIONS = [
  { key: 'overview',   label: 'Session Overview',        icon: FileText },
  { key: 'outline',    label: 'Timed Outline',           icon: Clock },
  { key: 'script',     label: 'Full Facilitator Script', icon: MessageSquare },
  { key: 'activity',   label: 'Activity or Exercise',    icon: Zap },
  { key: 'questions',  label: 'Processing Questions',    icon: HelpCircle },
  { key: 'takeaways',  label: 'Key Takeaways',           icon: CheckCircle },
  { key: 'notes',      label: 'Facilitator Notes',       icon: AlertCircle },
]

// ── Plan parser ────────────────────────────────────────────────────────────────

function parsePlan(rawText) {
  const headers = [
    { key: 'overview',   re: /1\.\s*\**\s*SESSION OVERVIEW\s*\**/i },
    { key: 'outline',    re: /2\.\s*\**\s*TIMED OUTLINE\s*\**/i },
    { key: 'script',     re: /3\.\s*\**\s*FULL FACILITATOR SCRIPT\s*\**/i },
    { key: 'activity',   re: /4\.\s*\**\s*ACTIVITY OR EXERCISE\s*\**/i },
    { key: 'questions',  re: /5\.\s*\**\s*PROCESSING QUESTIONS\s*\**/i },
    { key: 'takeaways',  re: /6\.\s*\**\s*KEY TAKEAWAYS\s*\**/i },
    { key: 'notes',      re: /7\.\s*\**\s*FACILITATOR NOTES\s*\**/i },
  ]

  const positions = headers
    .map(({ key, re }) => {
      const m = rawText.match(re)
      return m ? { key, index: m.index, headerEnd: m.index + m[0].length } : null
    })
    .filter(Boolean)
    .sort((a, b) => a.index - b.index)

  if (positions.length === 0) return { _raw: rawText, overview: rawText }

  const result = { _raw: rawText }
  for (let i = 0; i < positions.length; i++) {
    const start = positions[i].headerEnd
    const end = i < positions.length - 1 ? positions[i + 1].index : rawText.length
    result[positions[i].key] = rawText.slice(start, end).trim()
  }
  return result
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function typeLabel(t) {
  return t === 'psychoeducational' ? 'Psychoeducational' : 'Process Group'
}
function typeBadgeClass(t) {
  return t === 'psychoeducational'
    ? 'bg-army-muted text-army-text border-army-border'
    : 'bg-civilian-muted text-civilian-text border-civilian-border'
}

// ── PlanSection collapsible ────────────────────────────────────────────────────

function PlanSection({ label, icon: Icon, content, isCollapsed, onToggle }) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface-2 hover:bg-surface-3 transition-colors"
      >
        <div className="flex items-center gap-2.5">
          <Icon className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-sm font-semibold text-text-primary">{label}</span>
        </div>
        {isCollapsed
          ? <ChevronDown className="w-4 h-4 text-text-muted flex-shrink-0" />
          : <ChevronUp className="w-4 h-4 text-text-muted flex-shrink-0" />}
      </button>
      {!isCollapsed && (
        <div className="px-4 py-4 border-t border-border">
          <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
            {content || '—'}
          </p>
        </div>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function GroupSessions() {
  const { user } = useAuth()
  const apiKey = getOpenAIKey()

  const [tab, setTab] = useState('generator')

  // Generator form
  const [topic, setTopic]       = useState('')
  const [groupType, setGroupType] = useState(null)
  const [duration, setDuration] = useState(60)
  const [generating, setGenerating] = useState(false)
  const [genError, setGenError] = useState(null)

  // Generated plan
  const [parsedPlan, setParsedPlan] = useState(null)
  const [rawPlan, setRawPlan]       = useState(null)
  const [collapsed, setCollapsed]   = useState({})

  // Save
  const [saving, setSaving]           = useState(false)
  const [savedSession, setSavedSession] = useState(null)

  // Scratchpad
  const [scratchpadData, setScratchpadData] = useState({ text: '', image: null })

  // Saved sessions list
  const [savedSessions, setSavedSessions]   = useState([])
  const [loadingSaved, setLoadingSaved]     = useState(false)
  const [search, setSearch]                 = useState('')
  const [viewingSession, setViewingSession] = useState(null)
  const [viewedParsed, setViewedParsed]     = useState(null)
  const [viewedCollapsed, setViewedCollapsed] = useState({})

  useEffect(() => {
    if (tab !== 'saved' || !user) return
    setLoadingSaved(true)
    getGroupSessions(user.id)
      .then(setSavedSessions)
      .catch(err => toast.error(err.message))
      .finally(() => setLoadingSaved(false))
  }, [tab, user])

  const handleGenerate = async () => {
    if (!apiKey) { setGenError('OpenAI API key not configured. Go to Settings.'); return }
    setGenError(null)
    setGenerating(true)
    setParsedPlan(null)
    setRawPlan(null)
    setSavedSession(null)
    setScratchpadData({ text: '', image: null })
    try {
      const plan = await generateGroupSession(topic, groupType, duration, apiKey)
      setRawPlan(plan)
      setParsedPlan(parsePlan(plan))
      setCollapsed({})
    } catch (err) {
      setGenError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleSave = async () => {
    if (!user || !rawPlan) return
    setSaving(true)
    try {
      const session = await saveGroupSession({
        user_id: user.id,
        topic,
        group_type: groupType,
        duration_minutes: duration,
        generated_plan: rawPlan,
      })
      setSavedSession(session)
      if (scratchpadData.text || scratchpadData.image) {
        saveClinicianNote({
          session_id: session.id,
          content: scratchpadData.text || '',
          canvas_image: scratchpadData.image || null,
        }).catch(err => console.warn('note save failed:', err.message))
      }
      toast.success('Session plan saved')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleReset = () => {
    setParsedPlan(null)
    setRawPlan(null)
    setSavedSession(null)
    setCollapsed({})
    setScratchpadData({ text: '', image: null })
  }

  const handleViewSaved = (session) => {
    setViewingSession(session)
    setViewedParsed(parsePlan(session.generated_plan))
    setViewedCollapsed({})
  }

  const filteredSaved = savedSessions.filter(s =>
    !search || s.topic.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Layout title="Group Sessions">

      {/* Tab switcher */}
      <div className="flex gap-1 mb-6 p-1 rounded-xl bg-surface-2 border border-border w-fit">
        {[
          { id: 'generator', label: 'Session Generator' },
          { id: 'saved',     label: 'Saved Plans' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => { setTab(t.id); setViewingSession(null) }}
            className={`px-4 py-1.5 text-sm font-medium rounded-lg transition-all ${
              tab === t.id
                ? 'bg-surface text-text-primary'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Generator tab ──────────────────────────────────────────────────── */}
      {tab === 'generator' && (
        <div className="space-y-6 max-w-3xl">

          {/* Form — shown until plan is generated */}
          {!parsedPlan && !generating && (
            <div className="space-y-5">

              {/* Topic */}
              <div>
                <label className="form-label">Topic</label>
                <input
                  type="text"
                  value={topic}
                  onChange={e => setTopic(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && topic.trim() && groupType && handleGenerate()}
                  placeholder="e.g. stress management, anger, sleep hygiene, coping with deployment..."
                  className="input-base w-full"
                />
              </div>

              {/* Group type cards */}
              <div>
                <label className="form-label">Group Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      value: 'psychoeducational',
                      title: 'Psychoeducational',
                      desc: 'You teach. Structured content, skills, and tools for the group.',
                    },
                    {
                      value: 'process',
                      title: 'Process Group',
                      desc: 'You facilitate. The group reflects, shares, and explores together.',
                    },
                  ].map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => setGroupType(opt.value)}
                      className={`p-4 text-left rounded-xl border-2 transition-all ${
                        groupType === opt.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-surface-2 hover:border-border-light'
                      }`}
                    >
                      <p className={`text-sm font-semibold mb-1 ${
                        groupType === opt.value ? 'text-primary' : 'text-text-primary'
                      }`}>
                        {opt.title}
                      </p>
                      <p className="text-xs text-text-muted leading-relaxed">{opt.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="form-label">Duration</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    value={duration}
                    onChange={e => setDuration(Math.min(120, Math.max(15, Number(e.target.value))))}
                    min={15}
                    max={120}
                    className="input-base w-24 text-center"
                  />
                  <span className="text-sm text-text-muted">minutes</span>
                </div>
              </div>

              {genError && (
                <div className="flex items-start gap-2 p-3 rounded-md bg-danger-muted/30 border border-red-800">
                  <AlertCircle className="w-4 h-4 text-danger mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-red-300">{genError}</p>
                </div>
              )}

              <Button
                variant="primary"
                size="lg"
                icon={GraduationCap}
                onClick={handleGenerate}
                disabled={!topic.trim() || !groupType}
                className="w-full sm:w-auto"
              >
                Generate Session Plan
              </Button>
            </div>
          )}

          {/* Loading */}
          {generating && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader className="w-8 h-8 text-primary animate-spin" />
              <p className="text-sm text-text-secondary">Generating your session plan...</p>
            </div>
          )}

          {/* Generated plan view */}
          {parsedPlan && !generating && (
            <div className="space-y-4">

              {/* Plan header bar */}
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 pb-2 border-b border-border">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${typeBadgeClass(groupType)}`}>
                      {typeLabel(groupType)}
                    </span>
                    <span className="text-xs text-text-muted">{duration} min</span>
                  </div>
                  <h2 className="text-base font-bold text-text-primary truncate">{topic}</h2>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button variant="ghost" size="sm" icon={RefreshCw} onClick={handleReset}>
                    New Plan
                  </Button>
                  {savedSession ? (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-success/10 border border-success/30">
                      <CheckCircle className="w-3.5 h-3.5 text-success" />
                      <span className="text-xs font-medium text-success">Saved</span>
                    </div>
                  ) : (
                    <Button variant="primary" size="sm" icon={Save} loading={saving} onClick={handleSave}>
                      Save Plan
                    </Button>
                  )}
                </div>
              </div>

              {/* 7 collapsible sections */}
              <div className="space-y-2">
                {SECTIONS.map(s => (
                  <PlanSection
                    key={s.key}
                    label={s.label}
                    icon={s.icon}
                    content={parsedPlan[s.key]}
                    isCollapsed={!!collapsed[s.key]}
                    onToggle={() => setCollapsed(c => ({ ...c, [s.key]: !c[s.key] }))}
                  />
                ))}
              </div>

              {/* Clinician scratchpad */}
              <div className="pt-2">
                <label className="form-label mb-2 block">Session Notes</label>
                <ClinicianScratchpad
                  onSave={data => setScratchpadData(data)}
                  onTextChange={text => setScratchpadData(d => ({ ...d, text }))}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Saved Plans tab ────────────────────────────────────────────────── */}
      {tab === 'saved' && (
        viewingSession ? (
          /* Full saved session view */
          <div className="space-y-4 max-w-3xl">
            <div className="flex items-center gap-3 pb-2 border-b border-border">
              <Button variant="ghost" size="sm" icon={ArrowLeft} onClick={() => setViewingSession(null)}>
                Back
              </Button>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${typeBadgeClass(viewingSession.group_type)}`}>
                    {typeLabel(viewingSession.group_type)}
                  </span>
                  <span className="text-xs text-text-muted">{viewingSession.duration_minutes} min</span>
                </div>
                <h2 className="text-base font-bold text-text-primary truncate">{viewingSession.topic}</h2>
              </div>
            </div>
            <div className="space-y-2">
              {SECTIONS.map(s => (
                <PlanSection
                  key={s.key}
                  label={s.label}
                  icon={s.icon}
                  content={viewedParsed?.[s.key]}
                  isCollapsed={!!viewedCollapsed[s.key]}
                  onToggle={() => setViewedCollapsed(c => ({ ...c, [s.key]: !c[s.key] }))}
                />
              ))}
            </div>
          </div>
        ) : (
          /* Sessions list */
          <div className="space-y-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-muted pointer-events-none" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by topic..."
                className="input-base w-full pl-9"
              />
            </div>

            {loadingSaved ? (
              <div className="flex items-center justify-center py-16">
                <Loader className="w-6 h-6 text-primary animate-spin" />
              </div>
            ) : filteredSaved.length === 0 ? (
              <div className="text-center py-16 text-sm text-text-muted">
                {search
                  ? 'No plans match your search.'
                  : 'No saved session plans yet. Generate one first!'}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredSaved.map(session => (
                  <button
                    key={session.id}
                    onClick={() => handleViewSaved(session)}
                    className="text-left p-4 rounded-xl border border-border bg-surface-2 hover:border-primary/40 hover:bg-surface-3 transition-all"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded border ${typeBadgeClass(session.group_type)}`}>
                        {typeLabel(session.group_type)}
                      </span>
                      <span className="text-xs text-text-muted ml-auto">{session.duration_minutes} min</span>
                    </div>
                    <p className="text-sm font-semibold text-text-primary leading-snug mb-2 line-clamp-2">
                      {session.topic}
                    </p>
                    <p className="text-xs text-text-muted">
                      {new Date(session.created_at).toLocaleDateString('en-US', {
                        month: 'short', day: 'numeric', year: 'numeric',
                      })}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        )
      )}
    </Layout>
  )
}
