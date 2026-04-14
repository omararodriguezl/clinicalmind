import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, FileText, Edit3, Check, X, Shield, Stethoscope } from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { Button } from '../components/ui/Button'
import { ModeBadge } from '../components/ui/Badge'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { getSession, updateSession } from '../utils/supabase'
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
  const [showTranscription, setShowTranscription] = useState(false)

  useEffect(() => {
    getSession(id)
      .then(data => {
        setSession(data)
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
      <div className={`rounded-xl border p-4 mb-5 ${session.mode === 'army' ? 'bg-army-bg border-army-border' : 'bg-civilian-bg border-civilian-border'}`}>
        <div className="flex items-center gap-3">
          <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${session.mode === 'army' ? 'bg-army-muted' : 'bg-civilian-muted'}`}>
            {session.mode === 'army' ? <Shield className="w-4 h-4 text-army-text" /> : <Stethoscope className="w-4 h-4 text-civilian-text" />}
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

      {/* Transcription (collapsible) */}
      {session.transcription && (
        <div className="mt-5">
          <button
            onClick={() => setShowTranscription(v => !v)}
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            {showTranscription ? 'Hide' : 'Show'} original transcription
          </button>
          {showTranscription && (
            <div className="mt-2 card-2 p-4 max-h-40 overflow-y-auto">
              <p className="text-xs text-text-muted leading-relaxed whitespace-pre-wrap">{session.transcription}</p>
            </div>
          )}
        </div>
      )}
    </Layout>
  )
}
