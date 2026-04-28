import { useState, useEffect, Fragment } from 'react'
import {
  ChevronRight, ChevronLeft, CheckCircle,
  Loader, AlertCircle, Edit3, Users, Lightbulb, Mic,
  ChevronDown, ChevronUp, AlertTriangle, BookOpen, Shield,
} from 'lucide-react'
import { Button } from '../ui/Button'
import { AudioRecorder } from './AudioRecorder'
import { ClinicianScratchpad } from './ClinicianScratchpad'
import { TRIAGE_STEPS } from '../../utils/triageData'
import { INTAKE_STEPS } from '../../utils/intakeData'
import { useAuth } from '../../hooks/useAuth'
import { getClients, createSession, saveClinicianNote } from '../../utils/supabase'
import { transcribeAudio, generateNote, generateSessionFeedback, getOpenAIKey } from '../../utils/openai'
import toast from 'react-hot-toast'

const STEP_LABELS = ['Setup', 'Session', 'Transcription', 'AI Feedback', 'SOAP Note']

const MODES = [
  {
    value: 'army',
    label: '68X Army',
    sub: 'Military SOAP · combat stress',
    accent: 'var(--cm-od)',
    accentSoft: 'var(--cm-od-soft)',
    badge: '68X',
  },
  {
    value: 'civilian',
    label: 'Civilian',
    sub: 'Standard behavioral health',
    accent: 'var(--cm-navy)',
    accentSoft: 'var(--cm-navy-soft)',
    badge: 'CIV',
  },
  {
    value: 'triage',
    label: 'Triage',
    sub: 'Rapid intake · field triage',
    accent: 'var(--cm-warn)',
    accentSoft: 'var(--cm-warn-soft)',
    badge: 'TRG',
  },
]

function getModeInfo(value) {
  return MODES.find(m => m.value === value) || MODES[0]
}

function getInitials(name) {
  if (!name) return '?'
  const parts = name.trim().split(/\s+/)
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name.slice(0, 2).toUpperCase()
}

// ── Stepper ──────────────────────────────────────────────────────────────────

function WizardStepper({ step }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', padding: '14px 0 6px' }}>
      {STEP_LABELS.map((label, i) => {
        const done = i < step, active = i === step
        return (
          <Fragment key={i}>
            <div style={{
              width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
              background: done || active ? 'var(--cm-od)' : 'transparent',
              border: `1.5px solid ${done || active ? 'var(--cm-od)' : 'var(--cm-line)'}`,
              color: done || active ? '#fff' : 'var(--cm-ink-faint)',
              fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: active ? '0 0 0 3px var(--cm-od-soft)' : 'none',
              transition: 'all 0.15s',
            }}>
              {done
                ? <CheckCircle style={{ width: 11, height: 11 }} />
                : i + 1}
            </div>
            {i < STEP_LABELS.length - 1 && (
              <div style={{
                flex: 1, height: 2, margin: '0 3px',
                background: i < step ? 'var(--cm-od)' : 'var(--cm-line)',
                transition: 'background 0.15s',
              }} />
            )}
          </Fragment>
        )
      })}
    </div>
  )
}

// ── Guide Accordion ──────────────────────────────────────────────────────────

function GuideAccordion({ mode }) {
  const isTriage = mode === 'triage'
  const steps = isTriage ? TRIAGE_STEPS : INTAKE_STEPS
  const [sectionIdx, setSectionIdx] = useState(0)
  const [collapsed, setCollapsed] = useState(false)

  const section = steps[sectionIdx]
  const accent = isTriage ? 'var(--cm-warn)' : 'var(--cm-od)'
  const accentSoft = isTriage ? 'var(--cm-warn-soft)' : 'var(--cm-od-soft)'

  return (
    <div style={{
      border: `1px solid ${accent}`,
      borderRadius: 8, overflow: 'hidden',
      background: 'var(--cm-surface)',
    }}>
      <button
        onClick={() => setCollapsed(v => !v)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 14px', border: 'none', cursor: 'pointer',
          background: accentSoft,
          borderBottom: collapsed ? 'none' : `1px solid ${accent}40`,
        }}
      >
        {isTriage
          ? <AlertTriangle style={{ width: 13, height: 13, color: accent, flexShrink: 0 }} />
          : <BookOpen style={{ width: 13, height: 13, color: accent, flexShrink: 0 }} />
        }
        <span style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5, fontWeight: 700,
          color: accent, letterSpacing: '0.18em', textTransform: 'uppercase',
        }}>
          {isTriage ? 'Triage Guide' : 'Intake Guide'}
        </span>
        <span style={{ fontSize: 12, color: 'var(--cm-ink-mute)', flex: 1, textAlign: 'left' }}>
          {section.title}
        </span>
        {collapsed
          ? <ChevronDown style={{ width: 13, height: 13, color: accent, flexShrink: 0 }} />
          : <ChevronUp   style={{ width: 13, height: 13, color: accent, flexShrink: 0 }} />
        }
      </button>

      {!collapsed && (
        <div style={{ padding: '12px 14px 10px' }}>
          <div style={{
            fontFamily: 'JetBrains Mono, monospace', fontSize: 9, color: accent,
            letterSpacing: '0.2em', fontWeight: 700, textTransform: 'uppercase', marginBottom: 3,
          }}>
            {section.section}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--cm-ink)', marginBottom: 10 }}>
            {section.title}
          </div>

          {section.instruction && (
            <div style={{
              padding: '7px 10px', marginBottom: 10, borderRadius: 5,
              background: `${accentSoft}`, border: `1px solid ${accent}30`,
              fontSize: 11.5, color: 'var(--cm-ink-soft)', lineHeight: 1.45,
            }}>
              {section.instruction}
            </div>
          )}

          <ol style={{ padding: 0, margin: 0, listStyle: 'none' }}>
            {section.questions.map((q, i) => (
              <li key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'flex-start' }}>
                <span style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700,
                  color: accent, flexShrink: 0, marginTop: 2, minWidth: 18,
                }}>
                  {i + 1}.
                </span>
                <span style={{ fontSize: 13, color: 'var(--cm-ink-soft)', lineHeight: 1.5 }}>{q}</span>
              </li>
            ))}
          </ol>

          <div style={{
            display: 'flex', alignItems: 'center', paddingTop: 10,
            borderTop: `1px solid ${accent}30`, marginTop: 4,
          }}>
            <button
              onClick={() => setSectionIdx(s => Math.max(0, s - 1))}
              disabled={sectionIdx === 0}
              style={{
                display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none',
                cursor: sectionIdx === 0 ? 'default' : 'pointer',
                fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: accent,
                opacity: sectionIdx === 0 ? 0.3 : 1, fontWeight: 600, padding: 0,
              }}
            >
              <ChevronLeft style={{ width: 12, height: 12 }} /> Prev
            </button>

            <div style={{ flex: 1, display: 'flex', justifyContent: 'center', gap: 5 }}>
              {steps.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setSectionIdx(i)}
                  style={{
                    width: i === sectionIdx ? 16 : 6, height: 6, borderRadius: 3,
                    border: 'none', cursor: 'pointer', padding: 0,
                    background: i <= sectionIdx ? accent : 'var(--cm-line)',
                    transition: 'all 0.15s',
                  }}
                />
              ))}
            </div>

            <button
              onClick={() => setSectionIdx(s => Math.min(steps.length - 1, s + 1))}
              disabled={sectionIdx === steps.length - 1}
              style={{
                display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none',
                cursor: sectionIdx === steps.length - 1 ? 'default' : 'pointer',
                fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: accent,
                opacity: sectionIdx === steps.length - 1 ? 0.3 : 1, fontWeight: 600, padding: 0,
              }}
            >
              Next <ChevronRight style={{ width: 12, height: 12 }} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Mode Badge ───────────────────────────────────────────────────────────────

function ModeBadgeInline({ mode }) {
  const info = getModeInfo(mode)
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      fontFamily: 'JetBrains Mono, monospace', fontSize: 9, fontWeight: 700,
      letterSpacing: '0.16em', textTransform: 'uppercase',
      padding: '2px 6px', borderRadius: 2,
      background: info.accentSoft,
      color: info.accent,
      border: `1px solid ${info.accent}50`,
    }}>
      {info.badge}
    </span>
  )
}

// ── SOAP Section Card ────────────────────────────────────────────────────────

function SoapCard({ code, label, value, onChange, rows = 3 }) {
  return (
    <div style={{
      border: '1px solid var(--cm-line)', borderLeft: '3px solid var(--cm-od)',
      borderRadius: 6, overflow: 'hidden', background: 'var(--cm-surface)',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        padding: '8px 12px', borderBottom: '1px solid var(--cm-line-soft)',
        background: 'var(--cm-surface-alt)',
      }}>
        <div style={{
          width: 20, height: 20, background: 'var(--cm-od)', color: '#fff',
          borderRadius: 3, fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>{code}</div>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5, fontWeight: 700,
          color: 'var(--cm-ink-mute)', letterSpacing: '0.2em', textTransform: 'uppercase',
        }}>{label}</span>
      </div>
      <textarea
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        style={{
          width: '100%', padding: '10px 12px', resize: 'vertical',
          background: 'transparent', border: 'none', outline: 'none',
          fontSize: 13, color: 'var(--cm-ink-soft)', lineHeight: 1.55,
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      />
    </div>
  )
}

// ── Main Wizard ──────────────────────────────────────────────────────────────

export function NewSessionWizard({ preselectedClientId, onComplete, onCancel }) {
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [mode, setMode] = useState('civilian')
  const [clientSearch, setClientSearch] = useState('')

  const [recordingEnabled, setRecordingEnabled] = useState(false)
  const [audioBlob, setAudioBlob] = useState(null)
  const [transcription, setTranscription] = useState('')
  const [editingTranscription, setEditingTranscription] = useState(false)
  const [scratchpadData, setScratchpadData] = useState({ text: '', image: null })
  const [aiFeedback, setAiFeedback] = useState('')

  const [showFollowUp, setShowFollowUp] = useState(false)
  const [followUpAudioBlob, setFollowUpAudioBlob] = useState(null)
  const [followUpTranscription, setFollowUpTranscription] = useState('')
  const [transcribingFollowUp, setTranscribingFollowUp] = useState(false)

  const [soapNote, setSoapNote] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [processingMsg, setProcessingMsg] = useState('')
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!user) return
    getClients(user.id).then(data => {
      setClients(data)
      if (preselectedClientId) {
        const c = data.find(c => c.id === preselectedClientId)
        if (c) { setSelectedClient(c); setMode(c.mode) }
      }
    })
  }, [user, preselectedClientId])

  const apiKey = getOpenAIKey()

  const canProceed = () => {
    if (step === 0) return !!selectedClient
    if (step === 1) return true
    if (step === 2) return !!transcription.trim()
    return true
  }

  const handleTranscribeFollowUp = async () => {
    if (!followUpAudioBlob || !apiKey) return
    setTranscribingFollowUp(true)
    setError(null)
    try {
      const text = await transcribeAudio(followUpAudioBlob, apiKey)
      setFollowUpTranscription(text)
      setShowFollowUp(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setTranscribingFollowUp(false)
    }
  }

  const handleNext = async () => {
    setError(null)

    if (step === 1) {
      if (!apiKey) { setError('OpenAI API key not configured. Go to Settings to add your key.'); return }
      if (audioBlob) {
        setProcessing(true)
        setProcessingMsg('Transcribing audio with Whisper...')
        try {
          const text = await transcribeAudio(audioBlob, apiKey)
          setTranscription(text)
          setStep(2)
        } catch (err) {
          setError(err.message)
        } finally {
          setProcessing(false)
          setProcessingMsg('')
        }
      } else {
        setProcessing(true)
        setProcessingMsg('Analyzing with GPT-4...')
        try {
          const input = scratchpadData.text || ''
          setTranscription(input)
          const feedback = await generateSessionFeedback(input, mode, selectedClient, apiKey, scratchpadData.text)
          setAiFeedback(feedback)
          setStep(3)
        } catch (err) {
          setError(err.message)
        } finally {
          setProcessing(false)
          setProcessingMsg('')
        }
      }
      return
    }

    if (step === 2) {
      if (!apiKey) { setError('OpenAI API key not configured.'); return }
      setProcessing(true)
      setProcessingMsg('Analyzing session with GPT-4...')
      try {
        const feedback = await generateSessionFeedback(transcription, mode, selectedClient, apiKey, scratchpadData.text)
        setAiFeedback(feedback)
        setStep(3)
      } catch (err) {
        setError(err.message)
      } finally {
        setProcessing(false)
        setProcessingMsg('')
      }
      return
    }

    if (step === 3) {
      if (!apiKey) { setError('OpenAI API key not configured.'); return }
      setProcessing(true)
      setProcessingMsg('Generating SOAP note with GPT-4...')
      try {
        const combined = followUpTranscription
          ? `[INITIAL SESSION]\n${transcription}\n\n[FOLLOW-UP]\n${followUpTranscription}`
          : transcription
        const note = await generateNote(combined, mode, selectedClient, null, apiKey, scratchpadData.text)
        setSoapNote(note)
        setStep(4)
      } catch (err) {
        setError(err.message)
      } finally {
        setProcessing(false)
        setProcessingMsg('')
      }
      return
    }

    setStep(s => s + 1)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const session = await createSession({
        user_id: user.id,
        client_id: selectedClient.id,
        mode,
        session_date: new Date().toISOString(),
        transcription: followUpTranscription
          ? `[INITIAL]\n${transcription}\n\n[FOLLOW-UP]\n${followUpTranscription}`
          : transcription,
        ai_feedback: aiFeedback || null,
        ...soapNote,
      })
      if (scratchpadData.text || scratchpadData.image) {
        saveClinicianNote({
          session_id: session.id,
          content: scratchpadData.text || '',
          canvas_image: scratchpadData.image || null,
        }).catch(err => console.warn('clinician_notes save failed:', err.message))
      }
      onComplete(session)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const nextLabel = () => {
    if (step === 1) return audioBlob ? 'Transcribe' : 'Continue'
    if (step === 2) return 'Analyze with AI'
    if (step === 3) return 'Generate Note'
    return 'Next'
  }

  const modeInfo = getModeInfo(mode)
  const filteredClients = clients.filter(c =>
    mode === 'triage' || c.mode === mode
  ).filter(c =>
    !clientSearch ||
    c.name?.toLowerCase().includes(clientSearch.toLowerCase()) ||
    c.client_id_number?.toLowerCase().includes(clientSearch.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>

      {/* Stepper */}
      <WizardStepper step={step} />

      {/* Step label */}
      <div style={{
        display: 'flex', alignItems: 'baseline', gap: 8, paddingBottom: 16,
      }}>
        <span style={{
          fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5, fontWeight: 700,
          color: 'var(--cm-ink-faint)', letterSpacing: '0.22em', textTransform: 'uppercase',
        }}>
          STEP {String(step + 1).padStart(2, '0')} / 0{STEP_LABELS.length}
        </span>
        <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--cm-ink)', letterSpacing: -0.2 }}>
          {STEP_LABELS[step]}
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, minHeight: 0, overflowY: 'auto' }}>

        {/* ── Step 0: Setup ─────────────────────────────────────────────────── */}
        {step === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Mode selection */}
            <div>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5, fontWeight: 700,
                color: 'var(--cm-ink-mute)', letterSpacing: '0.22em', textTransform: 'uppercase',
                marginBottom: 10,
              }}>PROTOCOL · SELECT MODE</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {MODES.map(m => {
                  const sel = mode === m.value
                  return (
                    <button
                      key={m.value}
                      onClick={() => { setMode(m.value); setSelectedClient(null) }}
                      style={{
                        padding: '12px 10px', borderRadius: 8, cursor: 'pointer',
                        background: sel ? m.accentSoft : 'var(--cm-surface)',
                        border: sel ? `2px solid ${m.accent}` : '1px solid var(--cm-line)',
                        boxShadow: sel ? `0 0 0 3px ${m.accentSoft}` : 'none',
                        textAlign: 'left', transition: 'all 0.12s',
                      }}
                    >
                      <div style={{
                        fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 700,
                        color: sel ? m.accent : 'var(--cm-ink)', letterSpacing: '0.1em',
                        marginBottom: 4,
                      }}>
                        {m.label}
                      </div>
                      <div style={{
                        fontSize: 11, color: sel ? m.accent : 'var(--cm-ink-mute)',
                        lineHeight: 1.35, opacity: 0.85,
                      }}>
                        {m.sub}
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Client selection */}
            <div>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5, fontWeight: 700,
                color: 'var(--cm-ink-mute)', letterSpacing: '0.22em', textTransform: 'uppercase',
                marginBottom: 10,
              }}>SELECT CLIENT</div>

              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '8px 12px', marginBottom: 8, borderRadius: 6,
                background: 'var(--cm-surface)', border: '1px solid var(--cm-line)',
              }}>
                <svg width="13" height="13" viewBox="0 0 14 14" fill="none" stroke="var(--cm-ink-mute)" strokeWidth="1.5" strokeLinecap="round">
                  <circle cx="6" cy="6" r="4"/><path d="M9 9l3.5 3.5"/>
                </svg>
                <input
                  value={clientSearch}
                  onChange={e => setClientSearch(e.target.value)}
                  placeholder="Search by name or ID..."
                  style={{
                    flex: 1, background: 'none', border: 'none', outline: 'none',
                    fontSize: 13, color: 'var(--cm-ink)', fontFamily: 'Inter, system-ui, sans-serif',
                  }}
                />
              </div>

              {clients.length === 0 ? (
                <div style={{
                  padding: '16px', textAlign: 'center', borderRadius: 6,
                  border: '1px solid var(--cm-line)', background: 'var(--cm-surface)',
                  fontSize: 13, color: 'var(--cm-ink-mute)',
                }}>
                  No clients found.{' '}
                  <a href="/clients" style={{ color: 'var(--cm-od)', textDecoration: 'underline' }}>
                    Add a client first.
                  </a>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 280, overflowY: 'auto' }}>
                  {filteredClients.length === 0 ? (
                    <div style={{ padding: 16, textAlign: 'center', fontSize: 13, color: 'var(--cm-ink-mute)' }}>
                      No {mode === 'army' ? 'Army' : mode === 'triage' ? '' : 'Civilian'} clients match.
                    </div>
                  ) : (
                    filteredClients.map(client => {
                      const sel = selectedClient?.id === client.id
                      return (
                        <button
                          key={client.id}
                          onClick={() => setSelectedClient(client)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 12,
                            padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                            background: 'var(--cm-surface)',
                            border: sel ? `2px solid ${modeInfo.accent}` : '1px solid var(--cm-line)',
                            boxShadow: sel ? `0 0 0 3px ${modeInfo.accentSoft}` : 'none',
                            textAlign: 'left', transition: 'all 0.12s',
                          }}
                        >
                          <div style={{
                            width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                            background: sel ? modeInfo.accent : 'var(--cm-od)',
                            color: '#fff',
                            fontFamily: 'JetBrains Mono, monospace', fontSize: 11, fontWeight: 700,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            {getInitials(client.name)}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cm-ink)' }}>
                              {client.name}
                            </div>
                            <div style={{
                              fontFamily: 'JetBrains Mono, monospace', fontSize: 10,
                              color: 'var(--cm-ink-mute)', letterSpacing: '0.1em', marginTop: 2,
                            }}>
                              #{client.client_id_number}
                              {client.diagnosis && ` · ${client.diagnosis}`}
                            </div>
                          </div>
                          {sel && (
                            <div style={{
                              width: 20, height: 20, borderRadius: '50%',
                              background: modeInfo.accent, flexShrink: 0,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <CheckCircle style={{ width: 12, height: 12, color: '#fff' }} />
                            </div>
                          )}
                        </button>
                      )
                    })
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step 1: Record + Guide + Notes ────────────────────────────────── */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Session context */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 14, color: 'var(--cm-ink-soft)' }}>Session with</span>
              <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--cm-ink)' }}>
                {selectedClient?.name}
              </span>
              <ModeBadgeInline mode={mode} />
            </div>

            {/* Record toggle */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', borderRadius: 8,
              background: 'var(--cm-surface)', border: '1px solid var(--cm-line)',
            }}>
              <div style={{
                width: 32, height: 32, borderRadius: 6, flexShrink: 0,
                background: recordingEnabled ? 'var(--cm-danger-soft)' : 'var(--cm-surface-alt)',
                border: `1px solid ${recordingEnabled ? 'var(--cm-rec)' : 'var(--cm-line)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {recordingEnabled
                  ? <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--cm-rec)' }} />
                  : <Mic style={{ width: 14, height: 14, color: 'var(--cm-ink-mute)' }} />
                }
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cm-ink)' }}>
                  Record this session
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--cm-ink-mute)', marginTop: 2 }}>
                  Optional — session can be saved with notes only
                </div>
              </div>
              <button
                onClick={() => { setRecordingEnabled(v => !v); setAudioBlob(null) }}
                style={{
                  width: 44, height: 26, borderRadius: 14, padding: 3, flexShrink: 0,
                  background: recordingEnabled ? 'var(--cm-rec)' : 'var(--cm-surface-alt)',
                  border: `1px solid ${recordingEnabled ? 'var(--cm-rec)' : 'var(--cm-line)'}`,
                  cursor: 'pointer', display: 'flex', alignItems: 'center',
                  transition: 'all 0.18s',
                }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: '50%', background: '#fff',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
                  transform: recordingEnabled ? 'translateX(18px)' : 'translateX(0)',
                  transition: 'transform 0.18s',
                }} />
              </button>
            </div>

            {recordingEnabled && (
              <AudioRecorder onRecordingComplete={setAudioBlob} />
            )}

            {/* Guide accordion */}
            <GuideAccordion mode={mode} />

            {/* Notes */}
            <ClinicianScratchpad
              large
              onSave={data => setScratchpadData(data)}
              onTextChange={text => setScratchpadData(d => ({ ...d, text }))}
            />
          </div>
        )}

        {/* ── Step 2: Review transcription ──────────────────────────────────── */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 13, color: 'var(--cm-ink-mute)' }}>
                Review and edit the transcription before AI analysis.
              </p>
              <button
                onClick={() => setEditingTranscription(!editingTranscription)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, color: 'var(--cm-od)',
                }}
              >
                <Edit3 style={{ width: 12, height: 12 }} />
                {editingTranscription ? 'Done' : 'Edit'}
              </button>
            </div>

            {editingTranscription ? (
              <textarea
                value={transcription}
                onChange={e => setTranscription(e.target.value)}
                style={{
                  width: '100%', minHeight: 220, padding: '12px 14px',
                  background: 'var(--cm-surface)', border: '1px solid var(--cm-line)',
                  borderRadius: 6, outline: 'none', resize: 'vertical',
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 12,
                  color: 'var(--cm-ink-soft)', lineHeight: 1.6,
                }}
              />
            ) : (
              <div style={{
                padding: '14px', maxHeight: 240, overflowY: 'auto',
                background: 'var(--cm-surface)', border: '1px solid var(--cm-line)',
                borderRadius: 6,
              }}>
                <p style={{
                  fontSize: 13, color: 'var(--cm-ink-soft)', lineHeight: 1.65,
                  whiteSpace: 'pre-wrap', margin: 0,
                }}>
                  {transcription || 'No transcription available.'}
                </p>
              </div>
            )}

            {scratchpadData.text && (
              <div style={{
                padding: '10px 14px', borderRadius: 6,
                background: 'var(--cm-surface-alt)', border: '1px solid var(--cm-line)',
              }}>
                <div style={{
                  fontFamily: 'JetBrains Mono, monospace', fontSize: 9, fontWeight: 700,
                  color: 'var(--cm-ink-faint)', letterSpacing: '0.2em', marginBottom: 6,
                }}>CLINICIAN NOTES</div>
                <p style={{
                  fontSize: 12, color: 'var(--cm-ink-soft)', lineHeight: 1.55,
                  whiteSpace: 'pre-wrap', margin: 0, maxHeight: 80, overflowY: 'auto',
                }}>
                  {scratchpadData.text}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Step 3: AI Feedback ───────────────────────────────────────────── */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: 6, flexShrink: 0,
                background: 'var(--cm-od-soft)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Lightbulb style={{ width: 14, height: 14, color: 'var(--cm-od)' }} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--cm-ink)' }}>AI Session Feedback</div>
                <div style={{ fontSize: 11.5, color: 'var(--cm-ink-mute)' }}>
                  Follow-up questions to better understand the patient's situation
                </div>
              </div>
            </div>

            {aiFeedback && (
              <div style={{
                padding: '14px', maxHeight: 220, overflowY: 'auto',
                background: 'var(--cm-surface)', border: '1px solid var(--cm-line)',
                borderLeft: '3px solid var(--cm-od)', borderRadius: 6,
              }}>
                <p style={{
                  fontSize: 13, color: 'var(--cm-ink-soft)', lineHeight: 1.65,
                  whiteSpace: 'pre-wrap', margin: 0,
                }}>
                  {aiFeedback}
                </p>
              </div>
            )}

            {followUpTranscription && (
              <div style={{
                padding: '10px 14px', borderRadius: 6,
                background: 'var(--cm-od-soft)', border: '1px solid var(--cm-od)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <CheckCircle style={{ width: 13, height: 13, color: 'var(--cm-od)' }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--cm-od)' }}>
                    Follow-up recorded &amp; transcribed
                  </span>
                </div>
                <p style={{
                  fontSize: 12, color: 'var(--cm-ink-soft)', lineHeight: 1.55,
                  whiteSpace: 'pre-wrap', margin: 0, maxHeight: 100, overflowY: 'auto',
                }}>
                  {followUpTranscription}
                </p>
              </div>
            )}

            <div style={{
              border: '1px solid var(--cm-line)', borderRadius: 8, overflow: 'hidden',
              background: 'var(--cm-surface)',
            }}>
              <button
                onClick={() => setShowFollowUp(v => !v)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 14px', background: 'var(--cm-surface-alt)',
                  border: 'none', cursor: 'pointer', borderBottom: showFollowUp ? '1px solid var(--cm-line)' : 'none',
                }}
              >
                <Mic style={{ width: 13, height: 13, color: 'var(--cm-od)', flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--cm-ink)', flex: 1, textAlign: 'left' }}>
                  {followUpTranscription ? 'Re-record Follow-up' : 'Record Follow-up Questions'}
                </span>
                {showFollowUp
                  ? <ChevronUp style={{ width: 13, height: 13, color: 'var(--cm-ink-mute)' }} />
                  : <ChevronDown style={{ width: 13, height: 13, color: 'var(--cm-ink-mute)' }} />
                }
              </button>

              {showFollowUp && (
                <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <p style={{ fontSize: 12, color: 'var(--cm-ink-mute)', margin: 0 }}>
                    Use the AI feedback above as a guide. Record follow-up questions and the patient's answers.
                  </p>
                  <AudioRecorder onRecordingComplete={setFollowUpAudioBlob} />
                  {followUpAudioBlob && !transcribingFollowUp && (
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-full"
                      onClick={handleTranscribeFollowUp}
                      loading={transcribingFollowUp}
                    >
                      Transcribe Follow-up
                    </Button>
                  )}
                  {transcribingFollowUp && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center', padding: '8px 0' }}>
                      <Loader style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />
                      <span style={{ fontSize: 12, color: 'var(--cm-ink-mute)' }}>Transcribing...</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            <p style={{ fontSize: 11.5, color: 'var(--cm-ink-faint)', margin: 0 }}>
              {followUpTranscription
                ? 'Both recordings will be combined for a more complete SOAP note.'
                : 'You can skip follow-up recording and proceed directly to the SOAP note.'}
            </p>
          </div>
        )}

        {/* ── Step 4: SOAP Note Review ──────────────────────────────────────── */}
        {step === 4 && soapNote && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Meta badges */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap',
              padding: '10px 12px', borderRadius: 6,
              background: 'var(--cm-surface)', border: '1px solid var(--cm-line)',
              borderLeft: '3px solid var(--cm-od)',
            }}>
              <div style={{
                fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5, fontWeight: 700,
                color: 'var(--cm-od)', letterSpacing: '0.2em',
              }}>SOAP NOTE · DRAFT</div>
              <div style={{ flex: 1 }} />
              <ModeBadgeInline mode={mode} />
            </div>

            {(followUpTranscription || scratchpadData.text) && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 12px', borderRadius: 4,
                background: 'var(--cm-od-soft)', border: '1px solid var(--cm-od)',
                fontSize: 11.5, color: 'var(--cm-od)',
              }}>
                <CheckCircle style={{ width: 12, height: 12, flexShrink: 0 }} />
                {followUpTranscription
                  ? 'Generated from initial + follow-up recordings'
                  : 'Clinician notes included in SOAP generation'}
              </div>
            )}

            {[
              { code: 'S', label: 'Subjective', key: 'soap_subjective', rows: 3 },
              { code: 'O', label: 'Objective',  key: 'soap_objective',  rows: 3 },
              { code: 'A', label: 'Assessment', key: 'soap_assessment', rows: 4 },
              { code: 'P', label: 'Plan',       key: 'soap_plan',       rows: 4 },
            ].map(s => (
              <SoapCard
                key={s.code}
                code={s.code}
                label={s.label}
                value={soapNote[s.key] || ''}
                onChange={v => setSoapNote(n => ({ ...n, [s.key]: v }))}
                rows={s.rows}
              />
            ))}
          </div>
        )}

        {/* Processing */}
        {processing && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '40px 0', gap: 12,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: '50%',
              border: '3px solid var(--cm-od)', borderTopColor: 'transparent',
              animation: 'spin 0.9s linear infinite',
            }} />
            <p style={{ fontSize: 13, color: 'var(--cm-ink-mute)', margin: 0 }}>{processingMsg}</p>
            <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 8,
            padding: '10px 14px', borderRadius: 6, marginTop: 8,
            background: 'var(--cm-danger-soft)', border: '1px solid var(--cm-danger)',
          }}>
            <AlertCircle style={{ width: 14, height: 14, color: 'var(--cm-danger)', marginTop: 1, flexShrink: 0 }} />
            <p style={{ fontSize: 13, color: 'var(--cm-danger)', margin: 0 }}>{error}</p>
          </div>
        )}
      </div>

      {/* Action bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        paddingTop: 16, marginTop: 16,
        borderTop: '1px solid var(--cm-line)', flexShrink: 0,
      }}>
        <button
          onClick={() => step === 0 ? onCancel() : setStep(s => s - 1)}
          disabled={processing}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            height: 42, padding: '0 16px', borderRadius: 7,
            background: 'transparent', border: '1px solid var(--cm-line)',
            color: 'var(--cm-ink)', fontSize: 14, fontWeight: 600,
            cursor: 'pointer', opacity: processing ? 0.4 : 1,
            fontFamily: 'Inter, system-ui, sans-serif',
          }}
        >
          <ChevronLeft style={{ width: 14, height: 14 }} />
          {step === 0 ? 'Cancel' : 'Back'}
        </button>

        {step === 4 ? (
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              height: 42, padding: '0 20px', borderRadius: 7,
              background: 'var(--cm-od)', border: '1px solid var(--cm-od)',
              color: '#fff', fontSize: 14, fontWeight: 700,
              cursor: saving ? 'default' : 'pointer',
              opacity: saving ? 0.6 : 1,
              boxShadow: '0 2px 8px var(--cm-od-soft)',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            {saving
              ? <><Loader style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> Saving...</>
              : <><CheckCircle style={{ width: 14, height: 14 }} /> Save Session Note</>
            }
          </button>
        ) : (
          <button
            onClick={handleNext}
            disabled={!canProceed() || processing}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              height: 42, padding: '0 20px', borderRadius: 7,
              background: canProceed() && !processing ? 'var(--cm-od)' : 'var(--cm-surface-alt)',
              border: `1px solid ${canProceed() && !processing ? 'var(--cm-od)' : 'var(--cm-line)'}`,
              color: canProceed() && !processing ? '#fff' : 'var(--cm-ink-faint)',
              fontSize: 14, fontWeight: 700,
              cursor: canProceed() && !processing ? 'pointer' : 'default',
              boxShadow: canProceed() && !processing ? '0 2px 8px var(--cm-od-soft)' : 'none',
              fontFamily: 'Inter, system-ui, sans-serif',
              transition: 'all 0.15s',
            }}
          >
            {processing
              ? <><Loader style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} /> Processing...</>
              : <>{nextLabel()} <ChevronRight style={{ width: 14, height: 14 }} /></>
            }
          </button>
        )}
      </div>
    </div>
  )
}
