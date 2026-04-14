import { useState } from 'react'
import { Download, ToggleLeft, ToggleRight, Phone, Shield } from 'lucide-react'
import { Button } from '../ui/Button'
import { updateSafetyPlan, updateClient } from '../../utils/supabase'
import { generateSafetyPlanPDF } from '../../utils/pdfGenerator'
import toast from 'react-hot-toast'

function Section({ label, children }) {
  if (!children) return null
  return (
    <div>
      <h4 className="text-xs font-bold uppercase tracking-widest text-text-muted mb-2">{label}</h4>
      {children}
    </div>
  )
}

function ListItems({ items }) {
  if (!items?.length) return <p className="text-sm text-text-muted italic">None documented.</p>
  return (
    <ol className="space-y-1">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
          <span className="text-text-muted flex-shrink-0 w-5">{i + 1}.</span>
          <span>{item}</span>
        </li>
      ))}
    </ol>
  )
}

function Contacts({ contacts }) {
  if (!contacts?.length) return <p className="text-sm text-text-muted italic">None documented.</p>
  return (
    <div className="space-y-1">
      {contacts.map((c, i) => (
        <div key={i} className="flex items-center gap-2 text-sm">
          <span className="text-text-primary font-medium">{c.name}</span>
          {c.phone && (
            <span className="text-text-muted flex items-center gap-1 font-mono text-xs">
              <Phone className="w-3 h-3" />{c.phone}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

export function SafetyPlanViewer({ plan, client, onClose, onUpdated }) {
  const [toggling, setToggling] = useState(false)
  const isArmy = client?.mode === 'army'

  const handleToggleActive = async () => {
    setToggling(true)
    try {
      const updated = await updateSafetyPlan(plan.id, { is_active: !plan.is_active })
      // Update client safety plan badge
      if (!plan.is_active === false) {
        await updateClient(client.id, { has_active_safety_plan: false })
      } else {
        await updateClient(client.id, { has_active_safety_plan: true })
      }
      onUpdated(updated)
      toast.success(updated.is_active ? 'Safety plan activated' : 'Safety plan deactivated')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setToggling(false)
    }
  }

  const handleExport = () => {
    generateSafetyPlanPDF(plan, client)
    toast.success('PDF downloaded')
  }

  return (
    <div className="space-y-5">
      {/* Header controls */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className={`w-2.5 h-2.5 rounded-full ${plan.is_active ? 'bg-danger animate-pulse-slow' : 'bg-success'}`} />
          <span className="text-sm font-medium text-text-primary">
            {plan.is_active ? 'Active' : 'Inactive'} —{' '}
            <span className="text-text-muted text-xs">
              {new Date(plan.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" loading={toggling}
            onClick={handleToggleActive}
            icon={plan.is_active ? ToggleRight : ToggleLeft}
            className={plan.is_active ? 'text-danger' : 'text-success'}
          >
            {plan.is_active ? 'Deactivate' : 'Activate'}
          </Button>
          <Button variant="secondary" size="sm" icon={Download} onClick={handleExport}>PDF</Button>
        </div>
      </div>

      <div className="divider" />

      <div className="space-y-5">
        <Section label="Step 1: Warning Signs">
          <ListItems items={plan.warning_signs} />
        </Section>

        <Section label="Step 2: Internal Coping Strategies">
          <ListItems items={plan.internal_coping} />
        </Section>

        <Section label="Step 3: Social Contacts for Distraction">
          <Contacts contacts={plan.social_contacts} />
        </Section>

        <Section label="Step 4: People to Ask for Help">
          <Contacts contacts={plan.people_to_ask} />
        </Section>

        <Section label="Step 5: Professional Contacts & Crisis Lines">
          <Contacts contacts={plan.professional_contacts} />
        </Section>

        <Section label="Step 6: Making the Environment Safe">
          <ListItems items={plan.environment_safety} />
        </Section>

        {isArmy && (
          <>
            {(plan.weapon_access || plan.weapon_storage) && (
              <Section label="Weapon Access Assessment">
                <div className="card-2 p-3 space-y-2">
                  {plan.weapon_access && (
                    <div>
                      <p className="text-xs text-text-muted mb-0.5">Access</p>
                      <p className="text-sm text-text-secondary">{plan.weapon_access}</p>
                    </div>
                  )}
                  {plan.weapon_storage && (
                    <div>
                      <p className="text-xs text-text-muted mb-0.5">Storage Plan</p>
                      <p className="text-sm text-text-secondary">{plan.weapon_storage}</p>
                    </div>
                  )}
                </div>
              </Section>
            )}

            {(plan.chaplain_name || plan.chaplain_contact) && (
              <Section label="Unit Chaplain">
                <p className="text-sm text-text-secondary">
                  {plan.chaplain_name}{plan.chaplain_contact ? ` — ${plan.chaplain_contact}` : ''}
                </p>
              </Section>
            )}

            {(plan.chain_of_command_name || plan.chain_of_command_contact) && (
              <Section label="Chain of Command">
                <p className="text-sm text-text-secondary">
                  {plan.chain_of_command_name}{plan.chain_of_command_contact ? ` — ${plan.chain_of_command_contact}` : ''}
                </p>
              </Section>
            )}

            {/* Veterans Crisis Line */}
            <div className="p-3 rounded-lg bg-danger-muted/20 border border-red-800/40">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-danger" />
                <span className="text-sm font-bold text-red-300">Veterans Crisis Line</span>
              </div>
              <p className="text-base font-mono font-bold text-red-200">1-800-273-8255 | Press 1</p>
              <p className="text-xs text-red-400 mt-0.5">Text: 838255</p>
            </div>
          </>
        )}

        {!isArmy && (
          <div className="p-3 rounded-lg bg-danger-muted/20 border border-red-800/40">
            <div className="flex items-center gap-2 mb-1">
              <Phone className="w-4 h-4 text-danger" />
              <span className="text-sm font-bold text-red-300">988 Suicide & Crisis Lifeline</span>
            </div>
            <p className="text-lg font-mono font-bold text-red-200">Call or Text: 988</p>
          </div>
        )}
      </div>
    </div>
  )
}
