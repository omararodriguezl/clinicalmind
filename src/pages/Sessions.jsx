import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  Mic, Plus, Calendar, ChevronRight, Shield, Stethoscope, Trash2
} from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { Button } from '../components/ui/Button'
import { Modal, ConfirmModal } from '../components/ui/Modal'
import { SearchInput } from '../components/ui/SearchInput'
import { ModeBadge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { NewSessionWizard } from '../components/recording/NewSessionWizard'
import { useAuth } from '../hooks/useAuth'
import { getSessions, deleteSession } from '../utils/supabase'
import toast from 'react-hot-toast'

export default function Sessions() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const preselectedClient = searchParams.get('client')

  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showWizard, setShowWizard] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const fetchSessions = async () => {
    if (!user) return
    try {
      const data = await getSessions(user.id)
      setSessions(data)
    } catch (err) {
      toast.error('Failed to load sessions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
    if (preselectedClient) setShowWizard(true)
  }, [user])

  const filtered = sessions.filter(s =>
    s.clients?.client_id_number?.toLowerCase().includes(search.toLowerCase()) ||
    s.clients?.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.soap_assessment?.toLowerCase().includes(search.toLowerCase())
  )

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteSession(deletingId)
      setSessions(prev => prev.filter(s => s.id !== deletingId))
      setDeletingId(null)
      toast.success('Session deleted')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDeleting(false)
    }
  }

  const handleSessionCreated = (newSession) => {
    setShowWizard(false)
    fetchSessions()
    toast.success('Session note saved')
  }

  return (
    <Layout
      title="Sessions"
      headerActions={
        <Button variant="primary" size="sm" icon={Plus} onClick={() => setShowWizard(true)}>
          New Session
        </Button>
      }
    >
      <SearchInput
        value={search}
        onChange={setSearch}
        placeholder="Search sessions..."
        className="mb-4"
      />

      {loading ? (
        <PageLoader />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Mic}
          title={search ? 'No sessions found' : 'No sessions yet'}
          description="Record a session to generate AI-assisted SOAP notes."
          action={() => setShowWizard(true)}
          actionLabel="New Session"
          actionIcon={Plus}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((session) => (
            <div key={session.id} className="card hover:border-border-light transition-colors group flex">
              <Link to={`/sessions/${session.id}`} className="flex items-center gap-3 p-4 flex-1 min-w-0">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${session.mode === 'army' ? 'bg-army-muted' : 'bg-civilian-muted'}`}>
                  {session.mode === 'army'
                    ? <Shield className="w-3.5 h-3.5 text-army-text" />
                    : <Stethoscope className="w-3.5 h-3.5 text-civilian-text" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-text-primary font-mono">
                      #{session.clients?.client_id_number || '?'}
                    </span>
                    <ModeBadge mode={session.mode} size="xs" />
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Calendar className="w-3 h-3 text-text-muted" />
                    <span className="text-xs text-text-muted">
                      {new Date(session.session_date).toLocaleDateString('en-US', {
                        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
                      })}
                    </span>
                  </div>
                  {session.soap_assessment && (
                    <p className="text-xs text-text-muted mt-1 truncate">{session.soap_assessment}</p>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-text-secondary flex-shrink-0" />
              </Link>
              <div className="flex items-center pr-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setDeletingId(session.id)}
                  className="opacity-0 group-hover:opacity-100 text-text-muted hover:text-danger"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* New Session Wizard Modal */}
      <Modal
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        title="New Session"
        size="lg"
        className="!max-h-[95dvh]"
      >
        <NewSessionWizard
          preselectedClientId={preselectedClient}
          onComplete={handleSessionCreated}
          onCancel={() => setShowWizard(false)}
        />
      </Modal>

      {/* Delete confirm */}
      <ConfirmModal
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Session"
        message="Are you sure? This will permanently delete the session note and cannot be undone."
        confirmLabel="Delete"
        loading={deleting}
      />
    </Layout>
  )
}
