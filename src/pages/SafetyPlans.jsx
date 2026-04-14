import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ShieldAlert, Plus, AlertTriangle, ChevronRight, Shield, Stethoscope, CheckCircle } from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { Button } from '../components/ui/Button'
import { Modal } from '../components/ui/Modal'
import { SearchInput } from '../components/ui/SearchInput'
import { ModeBadge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { SafetyPlanBuilder } from '../components/safety/SafetyPlanBuilder'
import { SafetyPlanViewer } from '../components/safety/SafetyPlanViewer'
import { useAuth } from '../hooks/useAuth'
import { getClients, getSafetyPlans, getActiveSafetyPlan } from '../utils/supabase'
import toast from 'react-hot-toast'

export default function SafetyPlans() {
  const { user } = useAuth()
  const [searchParams] = useSearchParams()
  const preselectedClient = searchParams.get('client')

  const [clients, setClients] = useState([])
  const [selectedClient, setSelectedClient] = useState(null)
  const [plans, setPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showBuilder, setShowBuilder] = useState(false)
  const [viewingPlan, setViewingPlan] = useState(null)

  useEffect(() => {
    if (!user) return
    async function load() {
      try {
        const clientsData = await getClients(user.id)
        setClients(clientsData)
        if (preselectedClient) {
          const c = clientsData.find(c => c.id === preselectedClient)
          if (c) setSelectedClient(c)
        }
      } catch (err) {
        toast.error('Failed to load data')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [user, preselectedClient])

  useEffect(() => {
    if (!selectedClient) { setPlans([]); return }
    getSafetyPlans(selectedClient.id)
      .then(setPlans)
      .catch(() => toast.error('Failed to load safety plans'))
  }, [selectedClient])

  const handlePlanSaved = async (plan) => {
    setShowBuilder(false)
    // Refresh
    const updated = await getSafetyPlans(selectedClient.id)
    setPlans(updated)
    toast.success('Safety plan saved')
  }

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.client_id_number.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <Layout
      title="Safety Plans"
      headerActions={
        selectedClient && (
          <Button variant="primary" size="sm" icon={Plus} onClick={() => setShowBuilder(true)}>
            New Plan
          </Button>
        )
      }
    >
      {loading ? <PageLoader /> : (
        <div className="flex flex-col md:flex-row gap-4">
          {/* Client list sidebar */}
          <div className="w-full md:w-64 flex-shrink-0">
            <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Select Client</h3>
            <SearchInput value={search} onChange={setSearch} placeholder="Search clients..." className="mb-2" />

            {filteredClients.length === 0 ? (
              <EmptyState icon={ShieldAlert} title="No clients" description="Add clients first." />
            ) : (
              <div className="space-y-1">
                {filteredClients.map(client => (
                  <button
                    key={client.id}
                    onClick={() => setSelectedClient(client)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedClient?.id === client.id
                        ? 'bg-primary/10 border-primary/30 text-text-primary'
                        : 'bg-surface-2 border-border hover:border-border-light text-text-secondary'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {client.mode === 'army'
                        ? <Shield className="w-3.5 h-3.5 text-army-text flex-shrink-0" />
                        : <Stethoscope className="w-3.5 h-3.5 text-civilian-text flex-shrink-0" />
                      }
                      <span className="text-sm font-medium truncate">{client.name}</span>
                      {client.has_active_safety_plan && (
                        <AlertTriangle className="w-3 h-3 text-danger animate-pulse-slow ml-auto flex-shrink-0" />
                      )}
                    </div>
                    <div className="text-xs text-text-muted ml-5 font-mono">#{client.client_id_number}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Plans panel */}
          <div className="flex-1 min-w-0">
            {!selectedClient ? (
              <EmptyState
                icon={ShieldAlert}
                title="Select a client"
                description="Choose a client from the list to view or create safety plans."
              />
            ) : plans.length === 0 ? (
              <EmptyState
                icon={ShieldAlert}
                title="No safety plans"
                description={`No safety plans for ${selectedClient.name}. Create one now.`}
                action={() => setShowBuilder(true)}
                actionLabel="Create Safety Plan"
                actionIcon={Plus}
              />
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-sm font-semibold text-text-primary">
                    {selectedClient.name} — Safety Plans ({plans.length})
                  </h3>
                </div>
                {plans.map(plan => (
                  <div
                    key={plan.id}
                    className={`card p-4 cursor-pointer hover:border-border-light transition-colors ${plan.is_active ? 'border-danger/30 bg-danger-muted/10' : ''}`}
                    onClick={() => setViewingPlan(plan)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${plan.is_active ? 'bg-danger-muted' : 'bg-success-muted'}`}>
                        {plan.is_active
                          ? <AlertTriangle className="w-4 h-4 text-danger" />
                          : <CheckCircle className="w-4 h-4 text-success" />
                        }
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-text-primary">
                            {plan.is_active ? 'Active Safety Plan' : 'Inactive Safety Plan'}
                          </span>
                          {plan.is_active && (
                            <span className="text-[10px] text-danger animate-pulse-slow font-bold">ACTIVE</span>
                          )}
                        </div>
                        <div className="text-xs text-text-muted">
                          Created {new Date(plan.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-text-muted flex-shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Builder Modal */}
      <Modal
        isOpen={showBuilder}
        onClose={() => setShowBuilder(false)}
        title={`Safety Plan — ${selectedClient?.name}`}
        size="xl"
        className="!max-h-[95dvh]"
      >
        <SafetyPlanBuilder
          client={selectedClient}
          onSaved={handlePlanSaved}
          onCancel={() => setShowBuilder(false)}
        />
      </Modal>

      {/* Viewer Modal */}
      <Modal
        isOpen={!!viewingPlan}
        onClose={() => setViewingPlan(null)}
        title="Safety Plan"
        size="xl"
      >
        <SafetyPlanViewer
          plan={viewingPlan}
          client={selectedClient}
          onClose={() => setViewingPlan(null)}
          onUpdated={(updated) => {
            setPlans(prev => prev.map(p => p.id === updated.id ? updated : p))
            setViewingPlan(updated)
          }}
        />
      </Modal>
    </Layout>
  )
}
