import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Plus, Users, AlertTriangle, Shield, Stethoscope,
  ChevronRight, Filter, Trash2, Edit2
} from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { Button } from '../components/ui/Button'
import { Modal, ConfirmModal } from '../components/ui/Modal'
import { SearchInput } from '../components/ui/SearchInput'
import { ModeBadge, SafetyBadge } from '../components/ui/Badge'
import { EmptyState } from '../components/ui/EmptyState'
import { PageLoader } from '../components/ui/LoadingSpinner'
import { useClients } from '../hooks/useClients'
import { ClientForm } from '../components/clients/ClientForm'
import toast from 'react-hot-toast'

export default function Clients() {
  const { clients, loading, addClient, editClient, removeClient } = useClients()
  const [search, setSearch] = useState('')
  const [modeFilter, setModeFilter] = useState('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [deletingClient, setDeletingClient] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const filtered = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.client_id_number.toLowerCase().includes(search.toLowerCase()) ||
      c.diagnosis?.toLowerCase().includes(search.toLowerCase())
    const matchesMode = modeFilter === 'all' || c.mode === modeFilter
    return matchesSearch && matchesMode
  })

  const handleAdd = async (data) => {
    setSaving(true)
    try {
      await addClient(data)
      setShowAddModal(false)
      toast.success('Client added')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleEdit = async (data) => {
    setSaving(true)
    try {
      await editClient(editingClient.id, data)
      setEditingClient(null)
      toast.success('Client updated')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await removeClient(deletingClient.id)
      setDeletingClient(null)
      toast.success('Client removed')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <Layout
      title="Clients"
      headerActions={
        <Button variant="primary" size="sm" icon={Plus} onClick={() => setShowAddModal(true)}>
          Add Client
        </Button>
      }
    >
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name, ID, or diagnosis..."
          className="flex-1"
        />
        <div className="flex gap-1.5">
          {['all', 'army', 'civilian'].map((f) => (
            <button
              key={f}
              onClick={() => setModeFilter(f)}
              className={[
                'px-3 py-2 text-xs font-medium rounded-md border transition-colors',
                modeFilter === f
                  ? f === 'army' ? 'badge-army' : f === 'civilian' ? 'badge-civilian' : 'bg-surface-3 text-text-primary border-border-light'
                  : 'bg-surface-2 text-text-secondary border-border hover:border-border-light',
              ].join(' ')}
            >
              {f === 'all' ? 'All' : f === 'army' ? '68X Army' : 'Civilian'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="flex gap-4 mb-4 text-xs text-text-muted">
        <span>{clients.length} total</span>
        <span className="text-army-text">{clients.filter(c => c.mode === 'army').length} army</span>
        <span className="text-civilian-text">{clients.filter(c => c.mode === 'civilian').length} civilian</span>
        {clients.filter(c => c.has_active_safety_plan).length > 0 && (
          <span className="text-danger flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            {clients.filter(c => c.has_active_safety_plan).length} safety plan{clients.filter(c => c.has_active_safety_plan).length > 1 ? 's' : ''}
          </span>
        )}
      </div>

      {loading ? (
        <PageLoader />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Users}
          title={search ? 'No clients found' : 'No clients yet'}
          description={search ? 'Try a different search term.' : 'Add your first client to get started.'}
          action={() => setShowAddModal(true)}
          actionLabel="Add Client"
          actionIcon={Plus}
        />
      ) : (
        <div className="space-y-2">
          {filtered.map((client) => (
            <div key={client.id} className="card hover:border-border-light transition-colors group">
              <Link to={`/clients/${client.id}`} className="flex items-center gap-3 p-4">
                {/* Mode indicator */}
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${client.mode === 'army' ? 'bg-army-muted' : 'bg-civilian-muted'}`}>
                  {client.mode === 'army'
                    ? <Shield className="w-4 h-4 text-army-text" />
                    : <Stethoscope className="w-4 h-4 text-civilian-text" />
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-semibold text-text-primary truncate">{client.name}</span>
                    {client.has_active_safety_plan && (
                      <AlertTriangle className="w-3.5 h-3.5 text-danger animate-pulse-slow flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-text-muted font-mono">#{client.client_id_number}</span>
                    <ModeBadge mode={client.mode} size="xs" />
                    {client.diagnosis && (
                      <span className="text-xs text-text-muted truncate max-w-[200px]">{client.diagnosis}</span>
                    )}
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-text-secondary transition-colors flex-shrink-0" />
              </Link>

              {/* Actions */}
              <div className="flex items-center gap-1 px-4 pb-3 -mt-1">
                <Button
                  variant="ghost"
                  size="xs"
                  icon={Edit2}
                  onClick={(e) => { e.preventDefault(); setEditingClient(client) }}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="xs"
                  icon={Trash2}
                  onClick={(e) => { e.preventDefault(); setDeletingClient(client) }}
                  className="text-danger/70 hover:text-danger hover:bg-danger-muted/30"
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Client" size="md">
        <ClientForm onSubmit={handleAdd} onCancel={() => setShowAddModal(false)} loading={saving} />
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editingClient} onClose={() => setEditingClient(null)} title="Edit Client" size="md">
        <ClientForm
          initialData={editingClient}
          onSubmit={handleEdit}
          onCancel={() => setEditingClient(null)}
          loading={saving}
        />
      </Modal>

      {/* Delete confirm */}
      <ConfirmModal
        isOpen={!!deletingClient}
        onClose={() => setDeletingClient(null)}
        onConfirm={handleDelete}
        title="Delete Client"
        message={`Are you sure you want to delete ${deletingClient?.name}? All their sessions and safety plans will be permanently removed.`}
        confirmLabel="Delete"
        loading={deleting}
      />
    </Layout>
  )
}
