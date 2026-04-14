import { useEffect, useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Plus, Shield, Stethoscope, AlertTriangle,
  Mic, ShieldAlert, ClipboardList, Edit2, FileText, Calendar
} from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { Button } from '../components/ui/Button'
import { ModeBadge, SafetyBadge } from '../components/ui/Badge'
import { Modal } from '../components/ui/Modal'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { ClientForm } from '../components/clients/ClientForm'
import { getClient, getSessions, getActiveSafetyPlan } from '../utils/supabase'
import { useClients } from '../hooks/useClients'
import toast from 'react-hot-toast'

export default function ClientDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { editClient } = useClients()
  const [client, setClient] = useState(null)
  const [sessions, setSessions] = useState([])
  const [safetyPlan, setSafetyPlan] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    async function load() {
      try {
        const [clientData, sessionsData, planData] = await Promise.all([
          getClient(id),
          getSessions(null, id),
          getActiveSafetyPlan(id),
        ])
        setClient(clientData)
        setSessions(sessionsData)
        setSafetyPlan(planData)
      } catch (err) {
        toast.error('Failed to load client')
        navigate('/clients')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id, navigate])

  const handleEdit = async (data) => {
    setSaving(true)
    try {
      const updated = await editClient(id, data)
      setClient(updated)
      setEditing(false)
      toast.success('Client updated')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <Layout><PageLoader /></Layout>
  if (!client) return null

  const modeColor = client.mode === 'army'
    ? 'from-army-bg to-transparent border-army-border'
    : 'from-civilian-bg to-transparent border-civilian-border'

  return (
    <Layout
      backButton={
        <Link to="/clients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
      }
      title={client.name}
      headerActions={
        <Button variant="secondary" size="sm" icon={Edit2} onClick={() => setEditing(true)}>
          Edit
        </Button>
      }
    >
      {/* Client header card */}
      <div className={`rounded-xl border bg-gradient-to-br ${modeColor} p-5 mb-5`}>
        <div className="flex items-start gap-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${client.mode === 'army' ? 'bg-army-muted' : 'bg-civilian-muted'}`}>
            {client.mode === 'army'
              ? <Shield className="w-6 h-6 text-army-text" />
              : <Stethoscope className="w-6 h-6 text-civilian-text" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h2 className="text-lg font-bold text-text-primary">{client.name}</h2>
              {client.has_active_safety_plan && (
                <AlertTriangle className="w-4 h-4 text-danger animate-pulse-slow" />
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-xs font-mono text-text-muted">#{client.client_id_number}</span>
              <ModeBadge mode={client.mode} />
              {client.has_active_safety_plan && <SafetyBadge active />}
            </div>
            {client.diagnosis && (
              <p className="text-sm text-text-secondary">{client.diagnosis}</p>
            )}
          </div>
        </div>

        {/* Army info */}
        {client.mode === 'army' && (client.rank || client.unit || client.chain_of_command) && (
          <div className="mt-4 pt-4 border-t border-army-border grid grid-cols-3 gap-3">
            {client.rank && (
              <div>
                <div className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Rank</div>
                <div className="text-sm text-army-text font-medium">{client.rank}</div>
              </div>
            )}
            {client.unit && (
              <div>
                <div className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Unit</div>
                <div className="text-sm text-army-text font-medium">{client.unit}</div>
              </div>
            )}
            {client.chain_of_command && (
              <div>
                <div className="text-[10px] text-text-muted uppercase tracking-wider mb-0.5">Chain of Command</div>
                <div className="text-sm text-army-text font-medium">{client.chain_of_command}</div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
        <Link to={`/sessions?client=${id}`}>
          <Button variant="secondary" size="sm" icon={Mic} className="w-full">New Session</Button>
        </Link>
        <Link to={`/safety?client=${id}`}>
          <Button variant="secondary" size="sm" icon={ShieldAlert} className="w-full">Safety Plan</Button>
        </Link>
        <Link to={`/staffing?client=${id}`}>
          <Button variant="secondary" size="sm" icon={ClipboardList} className="w-full">Staffing</Button>
        </Link>
        <Button variant="ghost" size="sm" icon={FileText} className="w-full">Export</Button>
      </div>

      {/* Sessions */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
            Sessions ({sessions.length})
          </h3>
          <Link to={`/sessions?client=${id}`}>
            <Button variant="ghost" size="xs" icon={Plus}>New</Button>
          </Link>
        </div>
        {sessions.length === 0 ? (
          <div className="card p-6 text-center text-sm text-text-muted">
            No sessions recorded yet.
          </div>
        ) : (
          <div className="space-y-2">
            {sessions.map((session) => (
              <Link key={session.id} to={`/sessions/${session.id}`}>
                <div className="card p-4 hover:border-border-light transition-colors flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-text-muted flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-text-primary font-medium">
                      {new Date(session.session_date).toLocaleDateString('en-US', {
                        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                      })}
                    </div>
                    {session.soap_assessment && (
                      <p className="text-xs text-text-muted mt-0.5 truncate">{session.soap_assessment}</p>
                    )}
                  </div>
                  <ModeBadge mode={session.mode} size="xs" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* General notes */}
      {client.general_notes && (
        <div className="mt-5">
          <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">General Notes</h3>
          <div className="card-2 p-4">
            <p className="text-sm text-text-secondary whitespace-pre-wrap">{client.general_notes}</p>
          </div>
        </div>
      )}

      {/* Edit modal */}
      <Modal isOpen={editing} onClose={() => setEditing(false)} title="Edit Client" size="md">
        <ClientForm
          initialData={client}
          onSubmit={handleEdit}
          onCancel={() => setEditing(false)}
          loading={saving}
        />
      </Modal>
    </Layout>
  )
}
