import { useState, useEffect } from 'react'
import {
  ChevronRight, ChevronLeft, CheckCircle,
  Loader, AlertCircle, Edit3, Users, Lightbulb
} from 'lucide-react'
import { Button } from '../ui/Button'
import { AudioRecorder } from './AudioRecorder'
import { IntakeGuide } from './IntakeGuide'
import { useAuth } from '../../hooks/useAuth'
import { getClients, createSession } from '../../utils/supabase'
import { transcribeAudio, generateNote, generateSessionFeedback, getOpenAIKey } from '../../utils/openai'
import toast from 'react-hot-toast'

const STEPS = ['Client & Mode', 'Record Audio', 'Transcription', 'AI Feedback', 'SOAP Note']

export function NewSessionWizard({ preselectedClientId, onComplete, onCancel }) {
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [mode, setMode] = useState('civilian')
  const [audioBlob, setAudioBlob] = useState(null)
  const [transcription, setTranscription] = useState('')
  const [editingTranscription, setEditingTranscription] = useState(false)
  const [aiFeedback, setAiFeedback] = useState('')
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
        if (c) {
          setSelectedClient(c)
          setMode(c.mode)
        }
      }
    })
  }, [user, preselectedClientId])

  const apiKey = getOpenAIKey()

  const canProceed = () => {
    if (step === 0) return !!selectedClient
    if (step === 1) return !!audioBlob
    if (step === 2) return !!transcription.trim()
    return true
  }

  const handleNext = async () => {
    setError(null)

    if (step === 1) {
      // Transcribe audio
      if (!apiKey) {
        setError('OpenAI API key not configured. Go to Settings to add your key.')
        return
      }
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
      return
    }

    if (step === 2) {
      // Generate AI feedback
      if (!apiKey) {
        setError('OpenAI API key not configured.')
        return
      }
      setProcessing(true)
      setProcessingMsg('Analyzing session with GPT-4...')
      try {
        const feedback = await generateSessionFeedback(transcription, mode, selectedClient, apiKey)
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
      // Generate SOAP note
      if (!apiKey) {
        setError('OpenAI API key not configured.')
        return
      }
      setProcessing(true)
      setProcessingMsg('Generating SOAP note with GPT-4...')
      try {
        const note = await generateNote(transcription, mode, selectedClient, null, apiKey)
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
        transcription,
        ai_feedback: aiFeedback || null,
        ...soapNote,
      })
      onComplete(session)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
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

        {/* Step 0: Select client & mode */}
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <label className="form-label">Mode</label>
              <div className="flex gap-2">
                {['army', 'civilian'].map(m => (
                  <button
                    key={m}
                    onClick={() => setMode(m)}
                    className={`flex-1 py-2.5 text-sm font-medium rounded-md border transition-all ${
                      mode === m
                        ? m === 'army' ? 'bg-army-muted text-army-text border-army-border' : 'bg-civilian-muted text-civilian-text border-civilian-border'
                        : 'bg-surface-2 text-text-secondary border-border hover:border-border-light'
                    }`}
                  >
                    {m === 'army' ? '68X Army' : 'Civilian RBT'}
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
                    .filter(c => c.mode === mode)
                    .map(client => (
                      <button
                        key={client.id}
                        onClick={() => setSelectedClient(client)}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${
                          selectedClient?.id === client.id
                            ? mode === 'army' ? 'bg-army-muted border-army-border text-army-text' : 'bg-civilian-muted border-civilian-border text-civilian-text'
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
                  {clients.filter(c => c.mode === mode).length === 0 && (
                    <p className="text-xs text-text-muted text-center py-4">
                      No {mode === 'army' ? 'Army' : 'Civilian'} clients. Switch mode or add a new client.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 1: Record audio + Intake Guide */}
        {step === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-text-secondary">
              Record your session with{' '}
              <span className="text-text-primary font-medium">{selectedClient?.name}</span>.
              Audio is saved locally and never stored in the cloud.
            </p>
            <AudioRecorder onRecordingComplete={setAudioBlob} />
            <IntakeGuide />
          </div>
        )}

        {/* Step 2: Review transcription */}
        {step === 2 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-text-secondary">Review and edit the transcription before generating feedback.</p>
              <Button
                variant="ghost"
                size="xs"
                icon={Edit3}
                onClick={() => setEditingTranscription(!editingTranscription)}
              >
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
          </div>
        )}

        {/* Step 3: AI Feedback */}
        {step === 3 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Lightbulb className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-semibold text-text-primary">AI Session Feedback</p>
                <p className="text-xs text-text-muted">Follow-up questions to clarify the patient's presenting problem</p>
              </div>
            </div>

            {aiFeedback ? (
              <div className="space-y-2">
                <div className="card-2 p-4 max-h-64 overflow-y-auto">
                  <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">{aiFeedback}</p>
                </div>
                <p className="text-[11px] text-text-muted">
                  This feedback will be saved with the session and included in staffing documents.
                </p>
              </div>
            ) : (
              <div className="card-2 p-6 text-center text-text-muted text-sm">
                No feedback generated yet.
              </div>
            )}
          </div>
        )}

        {/* Step 4: Review generated SOAP note */}
        {step === 4 && soapNote && (
          <div className="space-y-3">
            <p className="text-sm text-text-secondary">Review and edit the generated SOAP note before saving.</p>
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
            {step === 1 ? 'Transcribe' : step === 2 ? 'Analyze with AI' : step === 3 ? 'Generate Note' : 'Next'}
          </Button>
        )}
      </div>
    </div>
  )
}
