import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, FileText, Edit3, Check, X, Shield, Stethoscope, Lightbulb, AlertTriangle, PenLine, MessageSquare } from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { Button } from '../components/ui/Button'
import { ModeBadge } from '../components/ui/Badge'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { getSession, updateSession, getClinicianNotes } from '../utils/supabase'
import { generateSOAPNotePDF, exportAsTXT, formatSOAPAsTXT } from '../utils/pdfGenerator'
import toast from 'react-hot-toast'

function SOAPSection({ label, value, onChange, editing }) {
  return (
    <div className="space-y-1.5">
      <div className={`text-xs font-bold uppercase tracking-widest ${editing ? 'text-primary' : 'text-text-muted'}`}>
        {label}
      </div>
      {editing ? (
        <textarea
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
          className="textarea-base text-sm"
        />
      ) : (
        <div className="card-2 p-3">
          <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
            {value || <span className="text-text-muted italic">Not documented.</span>}
          </p>
        </div>
      )}
    </div>
  )
}

export default function SessionDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editData, setEditData] = useState({})
  const [saving, setSaving] = useState(false)
  const [showTranscription, setShowTranscription] = useState(true)
  const [clinicianNotes, setClinicianNotes] = useState([])

  useEffect(() => {
    Promise.all([
      getSession(id),
      getClinicianNotes(id),
    ])
      .then(([data, notes]) => {
        setSession(data)
        setClinicianNotes(notes || [])
        setEditData({
          soap_subjective: data.soap_subjective,
          soap_objective: data.soap_objective,
          soap_assessment: data.soap_assessment,
          soap_plan: data.soap_plan,
        })
      })
      .catch(() => { toast.error('Session not found'); navigate('/sessions') })
      .finally(() => setLoading(false))
  }, [id, navigate])

  const handleSave = async () => {
    setSaving(true)
    try {
      const updated = await updateSession(id, editData)
      setSession(prev => ({ ...prev, ...updated }))
      setEditing(false)
      toast.success('Note saved')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleExportPDF = () => {
    generateSOAPNotePDF(session, session.clients)
    toast.success('PDF downloaded')
  }

  const handleExportTXT = () => {
    const content = formatSOAPAsTXT(session, session.clients)
    const filename = `${session.clients?.client_id_number}_SOAPNote_${new Date(session.session_date).toISOString().split('T')[0]}.txt`
    exportAsTXT(content, filename)
    toast.success('TXT downloaded')
  }

  if (loading) return <Layout><PageLoader /></Layout>
  if (!session) return null

  const client = session.clients

  return (
    <Layout
      backButton={
        <Link to="/sessions">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
      }
      title="Session Note"
      headerActions={
        <div className="flex items-center gap-1.5">
          {editing ? (
            <>
              <Button variant="ghost" size="sm" icon={X} onClick={() => setEditing(false)} disabled={saving}>Cancel</Button>
              <Button variant="primary" size="sm" icon={Check} loading={saving} onClick={handleSave}>Save</Button>
            </>
          ) : (
            <>
              <Button variant="secondary" size="sm" icon={Edit3} onClick={() => setEditing(true)}>Edit</Button>
              <Button variant="secondary" size="sm" icon={Download} onClick={handleExportPDF}>PDF</Button>
              <Button variant="ghost" size="sm" icon={FileText} onClick={handleExportTXT}>TXT</Button>
            </>
          )}
        </div>
      }
    >
      {/* Header info */}
      <div className={`rounded-xl border p-4 mb-5 ${session.mode === 'army' ? 'bg-army-bg border-army-border' : session.mode === 'triage' ? 'bg-warn-bg border-warn-border' : 'bg-civilian-bg border-civilian-border'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${session.mode === 'army' ? 'bg-army-muted' : session.mode === 'triage' ? 'bg-warn-muted' : 'bg-civilian-muted'}`}>
            {session.mode === 'army' ? <Shield className="w-4 h-4 text-army-text" /> : session.mode === 'triage' ? <AlertTriangle className="w-4 h-4" style={{ color: 'var(--cm-warn)' }} /> : <Stethoscope className="w-4 h-4 text-civilian-text" />}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-text-primary font-mono">#{client?.client_id_number}</span>
              <ModeBadge mode={session.mode} />
            </div>
            <div className="text-xs text-text-muted mt-0.5">
              {new Date(session.session_date).toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
              })}
            </div>
          </div>
        </div>
      </div>

      {/* SOAP sections */}
      <div className="space-y-4">
        {[
          { key: 'soap_subjective', label: 'S — Subjective' },
          { key: 'soap_objective', label: 'O — Objective' },
          { key: 'soap_assessment', label: 'A — Assessment' },
          { key: 'soap_plan', label: 'P — Plan' },
        ].map(({ key, label }) => (
          <SOAPSection
            key={key}
            label={label}
            value={editing ? editData[key] : session[key]}
            onChange={(v) => setEditData(d => ({ ...d, [key]: v }))}
            editing={editing}
          />
        ))}
      </div>

      {/* AI Feedback */}
      {session.ai_feedback && (
        <div className="mt-5 rounded-xl border border-primary/30 bg-primary/5 overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 border-b border-primary/20">
            <Lightbulb className="w-3.5 h-3.5 text-primary flex-shrink-0" />
            <span className="text-xs font-semibold text-primary">AI Session Feedback</span>
            <span className="text-[10px] text-primary/50 ml-1">— follow-up questions &amp; clinical observations</span>
          </div>
          <div className="px-4 py-3 max-h-64 overflow-y-auto">
            <p className="text-xs text-text-secondary leading-relaxed whitespace-pre-wrap">{session.ai_feedback}</p>
          </div>
        </div>
      )}

      {/* Clinician Notes (session + follow-up) */}
      {clinicianNotes.length > 0 && (() => {
        const sessionNotes = clinicianNotes.filter(n => !n.content?.startsWith('[FOLLOW-UP]'))
        const followUpNotes = clinicianNotes.filter(n => n.content?.startsWith('[FOLLOW-UP]'))
        return (
          <>
            {sessionNotes.map((note, i) => (note.content || note.canvas_image) && (
              <div key={note.id || i} style={{
                marginTop: 20, border: '1px solid var(--cm-line)',
                borderLeft: '3px solid var(--cm-od)', borderRadius: 8, overflow: 'hidden',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 14px', background: 'var(--cm-surface-alt)',
                  borderBottom: '1px solid var(--cm-line)',
                }}>
                  <PenLine style={{ width: 13, height: 13, color: 'var(--cm-od)' }} />
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5, fontWeight: 700,
                    color: 'var(--cm-od)', letterSpacing: '0.18em', textTransform: 'uppercase',
                  }}>Session Notes</span>
                </div>
                {note.content && (
                  <div style={{ padding: '12px 14px' }}>
                    <p style={{
                      fontSize: 13, color: 'var(--cm-ink-soft)', lineHeight: 1.6,
                      whiteSpace: 'pre-wrap', margin: 0,
                    }}>{note.content}</p>
                  </div>
                )}
                {note.canvas_image && (
                  <div style={{ padding: '0 14px 12px' }}>
                    <img
                      src={note.canvas_image}
                      alt="Handwritten notes"
                      style={{ width: '100%', borderRadius: 6, border: '1px solid var(--cm-line)' }}
                    />
                  </div>
                )}
              </div>
            ))}

            {followUpNotes.map((note, i) => (note.content || note.canvas_image) && (
              <div key={note.id || i} style={{
                marginTop: 16, border: '1px solid var(--cm-line)',
                borderLeft: '3px solid var(--cm-warn)', borderRadius: 8, overflow: 'hidden',
              }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 14px', background: 'var(--cm-surface-alt)',
                  borderBottom: '1px solid var(--cm-line)',
                }}>
                  <MessageSquare style={{ width: 13, height: 13, color: 'var(--cm-warn)' }} />
                  <span style={{
                    fontFamily: 'JetBrains Mono, monospace', fontSize: 9.5, fontWeight: 700,
                    color: 'var(--cm-warn)', letterSpacing: '0.18em', textTransform: 'uppercase',
                  }}>Follow-up Notes</span>
                </div>
                {note.content && (
                  <div style={{ padding: '12px 14px' }}>
                    <p style={{
                      fontSize: 13, color: 'var(--cm-ink-soft)', lineHeight: 1.6,
                      whiteSpace: 'pre-wrap', margin: 0,
                    }}>
                      {note.content.replace(/^\[FOLLOW-UP\]\n?/, '')}
                    </p>
                  </div>
                )}
                {note.canvas_image && (
                  <div style={{ padding: '0 14px 12px' }}>
                    <img
                      src={note.canvas_image}
                      alt="Handwritten follow-up notes"
                      style={{ width: '100%', borderRadius: 6, border: '1px solid var(--cm-line)' }}
                    />
                  </div>
                )}
              </div>
            ))}
          </>
        )
      })()}

      {/* Transcription */}
      {session.transcription && (
        <div style={{ marginTop: 20 }}>
          <button
            onClick={() => setShowTranscription(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: 12, fontWeight: 600, color: 'var(--cm-od)',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            <span>{showTranscription ? '▾' : '▸'}</span>
            {showTranscription ? 'Hide' : 'Show'} session transcription
          </button>
          {showTranscription && (
            <div style={{
              marginTop: 8, padding: '14px 16px',
              background: 'var(--cm-surface)', border: '1px solid var(--cm-line)',
              borderLeft: '3px solid var(--cm-line)', borderRadius: 8,
              maxHeight: 320, overflowY: 'auto',
            }}>
              <p style={{
                fontSize: 12.5, color: 'var(--cm-ink-soft)', lineHeight: 1.65,
                whiteSpace: 'pre-wrap', margin: 0,
                fontFamily: 'JetBrains Mono, monospace',
              }}>{session.transcription}</p>
            </div>
          )}
        </div>
      )}
    </Layout>
  )
}
