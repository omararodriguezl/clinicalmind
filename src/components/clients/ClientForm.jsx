import { useState } from 'react'
import { Button } from '../ui/Button'

export function ClientForm({ initialData, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({
    name: initialData?.name || '',
    client_id_number: initialData?.client_id_number || '',
    mode: initialData?.mode || 'civilian',
    diagnosis: initialData?.diagnosis || '',
    general_notes: initialData?.general_notes || '',
    rank: initialData?.rank || '',
    unit: initialData?.unit || '',
    chain_of_command: initialData?.chain_of_command || '',
  })

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }))

  const handleSubmit = (e) => {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Mode selector */}
      <div>
        <label className="form-label">Mode</label>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => set('mode', 'army')}
            className={`flex-1 py-2.5 text-sm font-medium rounded-md border transition-all ${
              form.mode === 'army'
                ? 'bg-army-muted text-army-text border-army-border'
                : 'bg-surface-2 text-text-secondary border-border hover:border-border-light'
            }`}
          >
            68X Army
          </button>
          <button
            type="button"
            onClick={() => set('mode', 'civilian')}
            className={`flex-1 py-2.5 text-sm font-medium rounded-md border transition-all ${
              form.mode === 'civilian'
                ? 'bg-civilian-muted text-civilian-text border-civilian-border'
                : 'bg-surface-2 text-text-secondary border-border hover:border-border-light'
            }`}
          >
            Civilian RBT
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 sm:col-span-1">
          <label className="form-label">Full Name *</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="Client full name"
            className="input-base"
          />
        </div>
        <div className="col-span-2 sm:col-span-1">
          <label className="form-label">Client ID Number *</label>
          <input
            type="text"
            required
            value={form.client_id_number}
            onChange={(e) => set('client_id_number', e.target.value)}
            placeholder="e.g. CM-001"
            className="input-base font-mono"
          />
        </div>
      </div>

      <div>
        <label className="form-label">Diagnosis / Presenting Problem</label>
        <input
          type="text"
          value={form.diagnosis}
          onChange={(e) => set('diagnosis', e.target.value)}
          placeholder="e.g. PTSD, F43.10"
          className="input-base"
        />
      </div>

      {/* Army-specific fields */}
      {form.mode === 'army' && (
        <div className="space-y-3 p-3 rounded-lg bg-army-bg border border-army-border">
          <p className="text-xs text-army-text font-semibold">Army-Specific Information</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Rank</label>
              <input
                type="text"
                value={form.rank}
                onChange={(e) => set('rank', e.target.value)}
                placeholder="e.g. SPC"
                className="input-base"
              />
            </div>
            <div>
              <label className="form-label">Unit</label>
              <input
                type="text"
                value={form.unit}
                onChange={(e) => set('unit', e.target.value)}
                placeholder="e.g. 1-502 INF"
                className="input-base"
              />
            </div>
          </div>
          <div>
            <label className="form-label">Chain of Command Contact</label>
            <input
              type="text"
              value={form.chain_of_command}
              onChange={(e) => set('chain_of_command', e.target.value)}
              placeholder="Supervisor name and phone"
              className="input-base"
            />
          </div>
        </div>
      )}

      <div>
        <label className="form-label">General Notes</label>
        <textarea
          value={form.general_notes}
          onChange={(e) => set('general_notes', e.target.value)}
          placeholder="Background information, context, etc."
          rows={3}
          className="textarea-base"
        />
      </div>

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={loading}>
          {initialData ? 'Save Changes' : 'Add Client'}
        </Button>
      </div>
    </form>
  )
}
