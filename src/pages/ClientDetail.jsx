import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Calendar, ChevronRight, Mic } from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { Button } from '../components/ui/Button'
import { ModeBadge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { NewSessionWizard } from '../components/recording/NewSessionWizard'
import { getClient, getSessions } from '../utils/supabase'
import toast from 'react-hot-toast'

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [client, setClient] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [showWizard, setShowWizard] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [clientData, sessionsData] = await Promise.all([
          getClient(id),
          getSessions(null, id),
        ])
        setClient(clientData)
        setSessions(sessionsData)
      } catch {
        toast.error('Failed to load client')
        navigate('/clients')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, navigate])

  const handleSessionCreated = (newSession) => {
    setShowWizard(false)
    setSessions(prev => [newSession, ...prev])
    toast.success('Session note saved')
  }

  if (loading) return <Layout><PageLoader /></Layout>
  if (!client) return null

  return (
    <Layout
      backButton={
        <Link to="/clients">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
        </Link>
      }
      title={client.name}
      headerActions={
        <Button variant="primary" size="sm" icon={Mic} onClick={() => setShowWizard(true)}>
          New Session
        </Button>
      }
    >
      {/* Client info strip */}
      <div className="flex items-center gap-2 mb-5 px-1">
        <span className="text-xs font-mono text-text-muted">#{client.client_id_number}</span>
        <ModeBadge mode={client.mode} size="xs" />
        {client.diagnosis && (
          <span className="text-xs text-text-muted truncate">{client.diagnosis}</span>
        )}
      </div>

      {/* Sessions */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
          Sessions ({sessions.length})
        </h3>
        <Button variant="ghost" size="xs" icon={Plus} onClick={() => setShowWizard(true)}>
          New
        </Button>
      </div>

      {sessions.length === 0 ? (
        <div className="card p-8 text-center space-y-3">
          <Mic className="w-8 h-8 text-text-muted mx-auto opacity-40" />
          <p className="text-sm text-text-muted">No sessions yet.</p>
          <Button variant="primary" size="sm" icon={Plus} onClick={() => setShowWizard(true)}>
            Record First Session
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {sessions.map((session) => (
            <Link key={session.id} to={`/sessions/${session.id}`}>
              <div className="card p-4 hover:border-border-light transition-colors flex items-center gap-3 group">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  session.mode === 'army' ? 'bg-army-muted' : 'bg-civilian-muted'
                }`}>
                  <Calendar className={`w-3.5 h-3.5 ${session.mode === 'army' ? 'text-army-text' : 'text-civilian-text'}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-text-primary">
                    {new Date(session.session_date).toLocaleDateString('en-US', {
                      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
                    })}
                  </div>
                  {session.soap_assessment && (
                    <p className="text-xs text-text-muted mt-0.5 truncate">{session.soap_assessment}</p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-text-secondary flex-shrink-0" />
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* New Session modal */}
      <Modal
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        title="New Session"
        size="lg"
        className="!max-h-[95dvh]"
      >
        <NewSessionWizard
          preselectedClientId={id}
          onComplete={handleSessionCreated}
          onCancel={() => setShowWizard(false)}
        />
      </Modal>
    </Layout>
  )
}
