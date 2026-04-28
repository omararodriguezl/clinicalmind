import { useState, useEffect } from 'react'
import {
  ChevronRight, ChevronLeft, CheckCircle,
  Loader, AlertCircle, Edit3, Users, Lightbulb, Mic,
  ChevronDown, ChevronUp,
} from 'lucide-react'
import { Button } from '../ui/Button'
import { AudioRecorder } from './AudioRecorder'
import { IntakeGuide } from './IntakeGuide'
import { TriageGuide } from './TriageGuide'
import { ClinicianScratchpad } from './ClinicianScratchpad'
import { useAuth } from '../../hooks/useAuth'
import { getClients, createSession, saveClinicianNote } from '../../utils/supabase'
import { transcribeAudio, generateNote, generateSessionFeedback, getOpenAIKey } from '../../utils/openai'
import toast from 'react-hot-toast'

const STEPS = ['Client & Mode', 'Record Audio', 'Transcription', 'AI Feedback', 'SOAP Note']

const MODES = [
  { value: 'army',     label: '68X Army' },
  { value: 'civilian', label: 'Civilian' },
  { value: 'triage',   label: 'Triage' },
]

export function NewSessionWizard({ preselectedClientId, onComplete, onCancel }) {
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [mode, setMode] = useState('civilian')

  // Recording toggle (optional)
  const [recordingEnabled, setRecordingEnabled] = useState(false)

  // Initial recording
  const [audioBlob, setAudioBlob] = useState(null)
  const [transcription, setTranscription] = useState('')
  const [editingTranscription, setEditingTranscription] = useState(false)

  // Clinician scratchpad data { text, image }
  const [scratchpadData, setScratchpadData] = useState({ text: '', image: null })

  // AI feedback
  const [aiFeedback, setAiFeedback] = useState('')

  // Follow-up recording (after feedback)
  const [showFollowUp, setShowFollowUp] = useState(false)
  const [followUpAudioBlob, setFollowUpAudioBlob] = useState(null)
  const [followUpTranscription, setFollowUpTranscription] = useState('')
  const [transcribingFollowUp, setTranscribingFollowUp] = useState(false)

  // SOAP note
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
    if (step === 1) return true // recording is optional
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
        // Has audio — transcribe and go to review step
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
        // No audio — skip transcription review, go directly to AI Feedback
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
          ? `[INITIAL SESSION]\n${transcription}\n\n[FOLLOW-UP QUESTIONS — after AI feedback]\n${followUpTranscription}`
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

      // Save clinician note non-blocking (table may not exist yet)
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

  return (
    <div className="flex flex-col min-h-0">
      {/* Step indicator */}
      <div className="flex items-center gap-1 mb-5 flex-shrink-0">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-1 flex-1">
            <div className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold flex-shrink-0 transition-colors ${
              i < step ? 'bg-success text-white' : i === step ? 'bg-primary text-white' : 'bg-surface-3 text-text-muted'
            }`}>
              {i < step ? <CheckCircle className="w-3 h-3" /> : i + 1}
            </div>
            <span className={`text-[10px] hidden sm:block truncate ${i === step ? 'text-text-primary font-medium' : 'text-text-muted'}`}>
              {label}
            </span>
            {i < STEPS.length - 1 && <div className="flex-1 h-px bg-border mx-1" />}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="flex-1 min-h-0 overflow-y-auto space-y-4">

        {/* ── Step 0: Select client & mode ─────────────────────────────────── */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="form-label">Session Type</label>
              <div className="flex gap-2">
                {MODES.map(m => (
                  <button
                    key={m.value}
                    onClick={() => setMode(m.value)}
                    className={`flex-1 py-2.5 text-sm font-medium rounded-md border transition-all ${
                      mode === m.value
                        ? m.value === 'army'
                          ? 'bg-army-muted text-army-text border-army-border'
                          : m.value === 'triage'
                            ? 'bg-warning-muted text-warning border-warning'
                            : 'bg-civilian-muted text-civilian-text border-civilian-border'
                        : 'bg-surface-2 text-text-secondary border-border hover:border-border-light'
                    }`}
                  >
                    {m.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="form-label">Select Client</label>
              {clients.length === 0 ? (
                <div className="card-2 p-4 text-center text-sm text-text-muted">
                  No clients found. <a href="/clients" className="text-primary hover:underline">Add a client first.</a>
                </div>
              ) : (
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {clients
                    .filter(c => mode === 'triage' || c.mode === mode)
                    .map(client => (
                      <button
                        key={client.id}
                        onClick={() => setSelectedClient(client)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          selectedClient?.id === client.id
                            ? mode === 'army'
                              ? 'bg-army-muted border-army-border text-army-text'
                              : mode === 'triage'
                                ? 'bg-warning-muted border-warning text-warning'
                                : 'bg-civilian-muted border-civilian-border text-civilian-text'
                            : 'bg-surface-2 border-border hover:border-border-light text-text-primary'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Users className="w-3.5 h-3.5 flex-shrink-0 opacity-70" />
                          <span className="text-sm font-medium">{client.name}</span>
                          <span className="text-xs opacity-60 font-mono ml-auto">#{client.client_id_number}</span>
                        </div>
                        {client.diagnosis && (
                          <div className="text-xs opacity-60 mt-0.5 ml-5">{client.diagnosis}</div>
                        )}
                      </button>
                    ))}
                  {clients.filter(c => mode === 'triage' || c.mode === mode).length === 0 && (
                    <p className="text-xs text-text-muted text-center py-4">
                      No {mode === 'army' ? 'Army' : 'Civilian'} clients. Switch mode or add a new client.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Step 1: Record audio + Guide + Scratchpad ─────────────────────── */}
        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-text-secondary">
              Session with{' '}
              <span className="text-text-primary font-medium">{selectedClient?.name}</span>.
              {mode === 'triage' && <span className="ml-1 text-warning font-medium">[Triage]</span>}
            </p>

            {/* Recording toggle */}
            <div className="flex items-center justify-between px-3 py-2 rounded-md bg-surface-2 border border-border">
              <div>
                <p className="text-sm font-medium text-text-primary">Record this session</p>
                <p className="text-xs text-text-muted">Optional — session can be saved with notes only</p>
              </div>
              <button
                onClick={() => { setRecordingEnabled(v => !v); setAudioBlob(null) }}
                className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
                  recordingEnabled ? 'bg-primary' : 'bg-surface-3'
                }`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                  recordingEnabled ? 'translate-x-5' : 'translate-x-0.5'
                }`} />
              </button>
            </div>

            {/* AudioRecorder — only when toggle is on */}
            {recordingEnabled && (
              <AudioRecorder onRecordingComplete={setAudioBlob} />
            )}

            {/* Split: Guide compact left, Scratchpad fills the rest */}
            <div className="flex flex-col md:flex-row gap-3">
              <div style={{ width: '100%', maxWidth: 220, flexShrink: 0 }}>
                {mode === 'triage' ? <TriageGuide /> : <IntakeGuide />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <ClinicianScratchpad
                  large
                  onSave={data => setScratchpadData(data)}
                  onTextChange={text => setScratchpadData(d => ({ ...d, text }))}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── Step 2: Review transcription ─────────────────────────────────── */}
        {step === 2 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-secondary">Review and edit the transcription before analysis.</p>
              <Button variant="ghost" size="xs" icon={Edit3} onClick={() => setEditingTranscription(!editingTranscription)}>
                {editingTranscription ? 'Done' : 'Edit'}
              </Button>
            </div>
            {editingTranscription ? (
              <textarea
                value={transcription}
                onChange={(e) => setTranscription(e.target.value)}
                className="textarea-base min-h-[200px] font-mono text-xs"
              />
            ) : (
              <div className="card-2 p-4 max-h-60 overflow-y-auto">
                <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
                  {transcription || 'No transcription available.'}
                </p>
              </div>
            )}
            {scratchpadData.text && (
              <div className="rounded-md border border-border px-3 py-2 bg-surface-2">
                <p className="text-[10px] text-text-muted mb-1" style={{ fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.1em' }}>
                  CLINICIAN NOTES
                </p>
                <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap max-h-24 overflow-y-auto">
                  {scratchpadData.text}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── Step 3: AI Feedback + Follow-up recording ────────────────────── */}
        {step === 3 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">AI Session Feedback</p>
                <p className="text-xs text-text-muted">Follow-up questions to better understand the patient's problem</p>
              </div>
            </div>

            {aiFeedback && (
              <div className="card-2 p-4 max-h-56 overflow-y-auto">
                <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">{aiFeedback}</p>
              </div>
            )}

            {followUpTranscription && (
              <div className="rounded-lg border border-success/30 bg-success/5 p-3">
                <div className="flex items-center gap-1.5 mb-2">
                  <CheckCircle className="w-3.5 h-3.5 text-success" />
                  <span className="text-xs font-semibold text-success">Follow-up recorded & transcribed</span>
                </div>
                <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap max-h-28 overflow-y-auto">
                  {followUpTranscription}
                </p>
              </div>
            )}

            <div className="rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => setShowFollowUp(v => !v)}
                className="w-full flex items-center justify-between px-3 py-2.5 bg-surface-2 hover:bg-surface-3 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Mic className="w-3.5 h-3.5 text-primary" />
                  <span className="text-xs font-semibold text-text-primary">
                    {followUpTranscription ? 'Re-record Follow-up Questions' : 'Record Follow-up Questions'}
                  </span>
                </div>
                {showFollowUp
                  ? <ChevronUp className="w-3.5 h-3.5 text-text-muted" />
                  : <ChevronDown className="w-3.5 h-3.5 text-text-muted" />}
              </button>

              {showFollowUp && (
                <div className="p-3 space-y-3 border-t border-border">
                  <p className="text-xs text-text-muted">
                    Use the AI feedback above as a guide. Record your follow-up questions and the patient's answers.
                    Both recordings will be combined for the SOAP note.
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
                    <div className="flex items-center gap-2 justify-center py-2 text-xs text-text-muted">
                      <Loader className="w-3.5 h-3.5 animate-spin" />
                      Transcribing follow-up...
                    </div>
                  )}
                </div>
              )}
            </div>

            <p className="text-[11px] text-text-muted">
              {followUpTranscription
                ? 'Both transcriptions will be combined to generate a more complete SOAP note.'
                : 'You can skip follow-up recording and proceed directly to the SOAP note.'}
            </p>
          </div>
        )}

        {/* ── Step 4: Review generated SOAP note ───────────────────────────── */}
        {step === 4 && soapNote && (
          <div className="space-y-3">
            <p className="text-sm text-text-secondary">Review and edit the generated SOAP note before saving.</p>
            {followUpTranscription && (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-primary/10 border border-primary/20">
                <CheckCircle className="w-3 h-3 text-primary flex-shrink-0" />
                <p className="text-[11px] text-primary/80">Note generated from initial + follow-up session recordings.</p>
              </div>
            )}
            {scratchpadData.text && (
              <div className="flex items-center gap-1.5 px-3 py-2 rounded-md bg-surface-2 border border-border">
                <CheckCircle className="w-3 h-3 text-text-muted flex-shrink-0" />
                <p className="text-[11px] text-text-muted">Clinician notes included in SOAP generation.</p>
              </div>
            )}
            {(['subjective', 'objective', 'assessment', 'plan']).map(section => (
              <div key={section} className="space-y-1">
                <label className="form-label">{section.charAt(0).toUpperCase() + section.slice(1)}</label>
                <textarea
                  value={soapNote[`soap_${section}`] || ''}
                  onChange={(e) => setSoapNote(n => ({ ...n, [`soap_${section}`]: e.target.value }))}
                  rows={section === 'plan' || section === 'assessment' ? 4 : 3}
                  className="textarea-base text-sm"
                />
              </div>
            ))}
          </div>
        )}

        {/* Processing overlay */}
        {processing && (
          <div className="flex flex-col items-center justify-center py-10 gap-3">
            <Loader className="w-7 h-7 text-primary animate-spin" />
            <p className="text-sm text-text-secondary">{processingMsg}</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-start gap-2 p-3 rounded-md bg-danger-muted/30 border border-red-800">
            <AlertCircle className="w-4 h-4 text-danger mt-0.5 flex-shrink-0" />
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}
      </div>

      {/* Footer nav */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-border flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          icon={ChevronLeft}
          onClick={() => step === 0 ? onCancel() : setStep(s => s - 1)}
          disabled={processing}
        >
          {step === 0 ? 'Cancel' : 'Back'}
        </Button>

        {step === 4 ? (
          <Button variant="primary" size="sm" loading={saving} onClick={handleSave} icon={CheckCircle}>
            Save Session Note
          </Button>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={handleNext}
            disabled={!canProceed() || processing}
            loading={processing}
            iconRight={ChevronRight}
          >
            {nextLabel()}
          </Button>
        )}
      </div>
    </div>
  )
}
