import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus, X, Check, AlertTriangle, Phone } from 'lucide-react'
import { Button } from '../ui/Button'
import { useAuth } from '../../hooks/useAuth'
import { createSafetyPlan, updateClient } from '../../utils/supabase'
import { SAFETY_PLAN_STEPS, ARMY_SAFETY_ADDITIONS, ARMY_CRISIS_RESOURCES, CIVILIAN_CRISIS_RESOURCES } from '../../utils/constants'
import toast from 'react-hot-toast'

function ListInput({ value = [], onChange, placeholder = 'Add item...' }) {
  const [input, setInput] = useState('')
  const add = () => {
    const trimmed = input.trim()
    if (trimmed) { onChange([...value, trimmed]); setInput('') }
  }
  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={placeholder}
          className="input-base flex-1"
        />
        <Button type="button" variant="secondary" size="sm" icon={Plus} onClick={add} />
      </div>
      {value.length > 0 && (
        <div className="space-y-1">
          {value.map((item, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded bg-surface-3 border border-border">
              <span className="text-xs text-text-muted w-4 flex-shrink-0">{i + 1}.</span>
              <span className="text-sm text-text-primary flex-1">{item}</span>
              <button onClick={() => onChange(value.filter((_, j) => j !== i))} className="text-text-muted hover:text-danger">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function ContactInput({ value = [], onChange, placeholder = 'Name' }) {
  const [form, setForm] = useState({ name: '', phone: '' })
  const add = () => {
    if (form.name.trim()) {
      onChange([...value, { ...form }])
      setForm({ name: '', phone: '' })
    }
  }
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-2">
        <input
          type="text"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder={placeholder}
          className="input-base"
        />
        <div className="flex gap-2">
          <input
            type="tel"
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            placeholder="Phone (optional)"
            className="input-base flex-1"
          />
          <Button type="button" variant="secondary" size="sm" icon={Plus} onClick={add} />
        </div>
      </div>
      {value.length > 0 && (
        <div className="space-y-1">
          {value.map((c, i) => (
            <div key={i} className="flex items-center gap-2 p-2 rounded bg-surface-3 border border-border">
              <span className="text-sm text-text-primary flex-1">{c.name}</span>
              {c.phone && <span className="text-xs text-text-muted font-mono flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</span>}
              <button onClick={() => onChange(value.filter((_, j) => j !== i))} className="text-text-muted hover:text-danger">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function SafetyPlanBuilder({ client, onSaved, onCancel }) {
  const { user } = useAuth()
  const isArmy = client?.mode === 'army'

  const [currentStep, setCurrentStep] = useState(0)
  const [saving, setSaving] = useState(false)
  const [data, setData] = useState({
    warning_signs: [],
    internal_coping: [],
    social_contacts: [],
    people_to_ask: [],
    professional_contacts: isArmy
      ? [{ name: 'Veterans Crisis Line', phone: '1-800-273-8255 press 1' }]
      : [{ name: '988 Suicide & Crisis Lifeline', phone: '988' }],
    environment_safety: [],
    weapon_access: '',
    weapon_storage: '',
    chaplain_name: '',
    chaplain_contact: '',
    chain_of_command_name: '',
    chain_of_command_contact: '',
  })

  const set = (field, val) => setData(d => ({ ...d, [field]: val }))

  const allSteps = [
    ...SAFETY_PLAN_STEPS,
    ...(isArmy ? ARMY_SAFETY_ADDITIONS : []),
  ]

  const step = allSteps[currentStep]
  const totalSteps = allSteps.length

  const handleSave = async () => {
    setSaving(true)
    try {
      const plan = await createSafetyPlan({
        user_id: user.id,
        client_id: client.id,
        is_active: true,
        ...data,
      })
      // Mark client as having active safety plan
      await updateClient(client.id, { has_active_safety_plan: true })
      onSaved(plan)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const renderStepContent = () => {
    const s = step
    const commonProps = { placeholder: 'Type and press Enter...' }

    if (s.id === 'warning_signs') return <ListInput value={data.warning_signs} onChange={v => set('warning_signs', v)} {...commonProps} />
    if (s.id === 'internal_coping') return <ListInput value={data.internal_coping} onChange={v => set('internal_coping', v)} {...commonProps} />
    if (s.id === 'social_contacts') return <ContactInput value={data.social_contacts} onChange={v => set('social_contacts', v)} placeholder="Person/Place name" />
    if (s.id === 'people_to_ask') return <ContactInput value={data.people_to_ask} onChange={v => set('people_to_ask', v)} placeholder="Person name" />
    if (s.id === 'professional_contacts') return (
      <div className="space-y-3">
        <ContactInput value={data.professional_contacts} onChange={v => set('professional_contacts', v)} placeholder="Professional/Service name" />
        <div className="p-3 rounded-lg bg-danger-muted/20 border border-red-800/40">
          <p className="text-xs font-semibold text-red-300 mb-1.5">Crisis Resources (pre-filled)</p>
          {(isArmy ? ARMY_CRISIS_RESOURCES : CIVILIAN_CRISIS_RESOURCES).map((r, i) => (
            <div key={i} className="text-xs text-text-muted">{r.name}: <span className="text-text-secondary font-mono">{r.phone || r.text}</span></div>
          ))}
        </div>
      </div>
    )
    if (s.id === 'environment_safety') return <ListInput value={data.environment_safety} onChange={v => set('environment_safety', v)} placeholder="e.g. Secure firearms with gun lock" />

    // Army-specific
    if (s.id === 'weapon_access') return (
      <div className="space-y-3">
        <div>
          <label className="form-label">Weapon/Firearm Access Assessment</label>
          <textarea value={data.weapon_access} onChange={e => set('weapon_access', e.target.value)}
            placeholder="Does the soldier have access to firearms? Describe current storage situation."
            rows={3} className="textarea-base" />
        </div>
        <div>
          <label className="form-label">Storage Plan</label>
          <textarea value={data.weapon_storage} onChange={e => set('weapon_storage', e.target.value)}
            placeholder="What is the plan for safe storage or temporary removal of weapons?"
            rows={2} className="textarea-base" />
        </div>
        <div className="flex items-start gap-2 p-2.5 rounded bg-warning-muted/20 border border-yellow-800/40">
          <AlertTriangle className="w-3.5 h-3.5 text-warning mt-0.5 flex-shrink-0" />
          <p className="text-xs text-yellow-300/80">Army regulations (AR 600-63) require documentation of weapon access for soldiers at risk.</p>
        </div>
      </div>
    )
    if (s.id === 'chaplain') return (
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="form-label">Chaplain Name</label>
          <input type="text" value={data.chaplain_name} onChange={e => set('chaplain_name', e.target.value)} placeholder="CH Smith" className="input-base" />
        </div>
        <div>
          <label className="form-label">Chaplain Contact</label>
          <input type="text" value={data.chaplain_contact} onChange={e => set('chaplain_contact', e.target.value)} placeholder="555-0100" className="input-base" />
        </div>
      </div>
    )
    if (s.id === 'chain_of_command') return (
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="form-label">Supervisor Name</label>
          <input type="text" value={data.chain_of_command_name} onChange={e => set('chain_of_command_name', e.target.value)} placeholder="SSG Johnson" className="input-base" />
        </div>
        <div>
          <label className="form-label">Contact Number</label>
          <input type="text" value={data.chain_of_command_contact} onChange={e => set('chain_of_command_contact', e.target.value)} placeholder="555-0101" className="input-base" />
        </div>
      </div>
    )

    return null
  }

  return (
    <div className="flex flex-col min-h-0">
      {/* Progress */}
      <div className="mb-4 flex-shrink-0">
        <div className="flex items-center justify-between text-xs text-text-muted mb-2">
          <span>Step {currentStep + 1} of {totalSteps}</span>
          <span>{Math.round(((currentStep + 1) / totalSteps) * 100)}%</span>
        </div>
        <div className="w-full h-1.5 bg-surface-3 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto">
        {/* Clinician prompt */}
        <div className={`p-3 rounded-lg mb-4 border ${isArmy ? 'bg-army-bg border-army-border' : 'bg-civilian-bg border-civilian-border'}`}>
          <p className="text-xs font-semibold mb-0.5 text-text-muted uppercase tracking-wider">Ask client:</p>
          <p className="text-sm font-medium text-text-primary">{step.prompt}</p>
        </div>

        {/* Input */}
        {renderStepContent()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between pt-4 mt-4 border-t border-border flex-shrink-0">
        <Button
          variant="ghost"
          size="sm"
          icon={ChevronLeft}
          onClick={() => currentStep === 0 ? onCancel() : setCurrentStep(s => s - 1)}
        >
          {currentStep === 0 ? 'Cancel' : 'Back'}
        </Button>

        {currentStep === totalSteps - 1 ? (
          <Button variant="primary" size="sm" icon={Check} loading={saving} onClick={handleSave}>
            Save Safety Plan
          </Button>
        ) : (
          <Button variant="primary" size="sm" iconRight={ChevronRight} onClick={() => setCurrentStep(s => s + 1)}>
            Next
          </Button>
        )}
      </div>
    </div>
  )
}
