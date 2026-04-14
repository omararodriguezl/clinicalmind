import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ClipboardList, Loader, Download, FileText, AlertCircle,
  Shield, Stethoscope, Sparkles, RefreshCw
} from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { ModeBadge } from '../components/ui/Badge'
import { useAuth } from '../hooks/useAuth'
import { getClients, getSessions } from '../utils/supabase'
import { generateStaffingDocument } from '../utils/openai'
import { getOpenAIKey } from '../utils/openai'
import { generateStaffingPDF, exportAsTXT } from '../utils/pdfGenerator'
import toast from 'react-hot-toast'

export default function Staffing() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const preselectedClientId = searchParams.get('client')

  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [sessions, setSessions] = useState([])
  const [document_, setDocument] = useState('')
  const [generating, setGenerating] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!user) return
    getClients(user.id)
      .then(data => {
        setClients(data)
        if (preselectedClientId) {
          const c = data.find(c => c.id === preselectedClientId)
          if (c) setSelectedClient(c)
        }
      })
      .finally(() => setLoading(false))
  }, [user, preselectedClientId])

  useEffect(() => {
    if (!selectedClient) { setSessions([]); return }
    getSessions(user?.id, selectedClient.id)
      .then(setSessions)
      .catch(() => toast.error('Failed to load sessions'))
  }, [selectedClient, user])

  const handleGenerate = async () => {
    const key = getOpenAIKey()
    if (!key) {
      setError('OpenAI API key not configured. Go to Settings.')
      return
    }
    if (!selectedClient) {
      toast.error('Select a client first')
      return
    }
    if (sessions.length === 0) {
      toast.error('No sessions available for this client')
      return
    }
    setGenerating(true)
    setError(null)
    setDocument('')
    try {
      const doc = await generateStaffingDocument(
        selectedClient,
        sessions,
        selectedClient.mode,
        null,
        key
      )
      setDocument(doc)
    } catch (err) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const handleExportPDF = () => {
    generateStaffingPDF(document_, selectedClient)
    toast.success('PDF downloaded')
  }

  const handleExportTXT = () => {
    const filename = `${selectedClient?.client_id_number}_Staffing_${new Date().toISOString().split('T')[0]}.txt`
    exportAsTXT(document_, filename)
    toast.success('TXT downloaded')
  }

  return (
    <Layout title="Staffing Documents">
      {loading ? <PageLoader /> : (
        <div className="space-y-5">
          {/* Client selector */}
          <div>
            <label className="form-label">Select Client</label>
            {clients.length === 0 ? (
              <div className="card-2 p-4 text-center text-sm text-text-muted">No clients found.</div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {clients.map(client => (
                  <button
                    key={client.id}
                    onClick={() => { setSelectedClient(client); setDocument('') }}
                    className={`text-left p-3 rounded-lg border transition-all ${
                      selectedClient?.id === client.id
                        ? 'bg-primary/10 border-primary/30 text-text-primary'
                        : 'bg-surface-2 border-border hover:border-border-light text-text-secondary'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {client.mode === 'army'
                        ? <Shield className="w-3.5 h-3.5 text-army-text" />
                        : <Stethoscope className="w-3.5 h-3.5 text-civilian-text" />
                      }
                      <span className="text-sm font-medium">{client.name}</span>
                    </div>
                    <div className="flex items-center gap-2 ml-5">
                      <span className="text-xs font-mono text-text-muted">#{client.client_id_number}</span>
                      <ModeBadge mode={client.mode} size="xs" />
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Session count + generate */}
          {selectedClient && (
            <div className="card p-4">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <div>
                  <div className="text-sm font-semibold text-text-primary">{selectedClient.name}</div>
                  <div className="text-xs text-text-muted mt-0.5">
                    {sessions.length} session{sessions.length !== 1 ? 's' : ''} available for analysis
                    {' · '}
                    <ModeBadge mode={selectedClient.mode} size="xs" className="inline" />
                  </div>
                </div>
                <div className="flex gap-2">
                  {document_ && (
                    <Button variant="ghost" size="sm" icon={RefreshCw} onClick={() => setDocument('')}>
                      Reset
                    </Button>
                  )}
                  <Button
                    variant="primary"
                    size="sm"
                    icon={Sparkles}
                    loading={generating}
                    onClick={handleGenerate}
                    disabled={sessions.length === 0}
                  >
                    Generate Staffing Doc
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="flex items-start gap-2 p-3 rounded-md bg-danger-muted/30 border border-red-800">
              <AlertCircle className="w-4 h-4 text-danger mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Generating state */}
          {generating && (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="relative">
                <Loader className="w-8 h-8 text-primary animate-spin" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-text-primary">Generating staffing document...</p>
                <p className="text-xs text-text-muted mt-0.5">GPT-4 is analyzing {sessions.length} sessions</p>
              </div>
            </div>
          )}

          {/* Document output */}
          {document_ && !generating && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-text-primary flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-primary" />
                  Staffing Document
                </h3>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" icon={Download} onClick={handleExportPDF}>PDF</Button>
                  <Button variant="ghost" size="sm" icon={FileText} onClick={handleExportTXT}>TXT</Button>
                </div>
              </div>
              <div className="card-2 p-5">
                <div className="prose prose-sm prose-invert max-w-none">
                  {document_.split('\n').map((line, i) => {
                    if (!line.trim()) return <br key={i} />
                    if (line.startsWith('##')) return (
                      <h3 key={i} className="text-sm font-bold text-primary mt-4 mb-1 uppercase tracking-wider">
                        {line.replace(/^#+\s*/, '')}
                      </h3>
                    )
                    if (line.startsWith('#')) return (
                      <h2 key={i} className="text-base font-bold text-text-primary mt-5 mb-2">
                        {line.replace(/^#+\s*/, '')}
                      </h2>
                    )
                    if (line.startsWith('- ') || line.startsWith('• ')) return (
                      <div key={i} className="flex items-start gap-2 text-sm text-text-secondary leading-relaxed pl-2">
                        <span className="text-primary mt-1.5 flex-shrink-0">•</span>
                        <span>{line.replace(/^[-•]\s*/, '')}</span>
                      </div>
                    )
                    if (line.startsWith('**') && line.endsWith('**')) return (
                      <p key={i} className="text-sm font-bold text-text-primary">{line.replace(/\*\*/g, '')}</p>
                    )
                    return <p key={i} className="text-sm text-text-secondary leading-relaxed">{line}</p>
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Empty state */}
          {!selectedClient && !generating && (
            <EmptyState
              icon={ClipboardList}
              title="Select a client"
              description="Choose a client above, then generate a comprehensive staffing document for supervision."
            />
          )}
        </div>
      )}
    </Layout>
  )
}
