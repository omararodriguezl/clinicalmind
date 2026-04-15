import { useState, useEffect } from 'react'
import {
  Settings as SettingsIcon, Key, User, Brain, Shield, Stethoscope,
  Eye, EyeOff, Check, AlertCircle, ExternalLink, Loader
} from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { Button } from '../components/ui/Button'
import { useSettings } from '../hooks/useSettings'
import { useAuth } from '../hooks/useAuth'
import toast from 'react-hot-toast'

function Section({ title, icon: Icon, children, color = 'text-primary' }) {
  return (
    <div className="card p-5 space-y-4">
      <div className="flex items-center gap-2 pb-3 border-b border-border">
        <Icon className={`w-4 h-4 ${color}`} />
        <h2 className="text-sm font-semibold text-text-primary">{title}</h2>
      </div>
      {children}
    </div>
  )
}

export default function Settings() {
  const { user } = useAuth()
  const { settings, loading, saving, saveSettings } = useSettings()
  const [form, setForm] = useState(null)
  const [showKey, setShowKey] = useState(false)
  const [testingKey, setTestingKey] = useState(false)
  const [keyStatus, setKeyStatus] = useState(null)

  // Initialize form from settings once loaded
  useEffect(() => {
    if (!loading && settings) setForm({ ...settings })
  }, [loading, settings])

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }))

  const handleSave = async () => {
    try {
      await saveSettings(form)
      toast.success('Settings saved')
    } catch (err) {
      toast.error(err.message)
    }
  }

  const handleTestKey = async () => {
    const key = form?.openai_api_key?.trim()
    if (!key) { toast.error('Enter an API key first'); return }
    setTestingKey(true)
    setKeyStatus(null)
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: { Authorization: `Bearer ${key}` },
      })
      if (response.ok) {
        setKeyStatus('valid')
        toast.success('API key is valid')
      } else {
        setKeyStatus('invalid')
        toast.error('Invalid API key')
      }
    } catch {
      setKeyStatus('invalid')
      toast.error('Failed to test key — check your connection')
    } finally {
      setTestingKey(false)
    }
  }

  if (loading || !form) {
    return (
      <Layout title="Settings">
        <div className="flex items-center justify-center py-16">
          <Loader className="w-6 h-6 text-primary animate-spin" />
        </div>
      </Layout>
    )
  }

  return (
    <Layout title="Settings">
      <div className="space-y-4 max-w-2xl">

        {/* Account info */}
        <Section title="Account" icon={User}>
          <div>
            <label className="form-label">Email</label>
            <input
              type="text"
              value={user?.email || ''}
              readOnly
              className="input-base opacity-60 cursor-not-allowed"
            />
          </div>
        </Section>

        {/* Clinician info */}
        <Section title="Clinician Profile" icon={SettingsIcon}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Your Name</label>
              <input
                type="text"
                value={form.clinician_name || ''}
                onChange={e => set('clinician_name', e.target.value)}
                placeholder="John Smith"
                className="input-base"
              />
            </div>
            <div>
              <label className="form-label">Credentials</label>
              <input
                type="text"
                value={form.clinician_credentials || ''}
                onChange={e => set('clinician_credentials', e.target.value)}
                placeholder="e.g. SPC, 68X, RBT"
                className="input-base"
              />
            </div>
          </div>
          <div>
            <label className="form-label">Facility / Unit Name</label>
            <input
              type="text"
              value={form.facility_name || ''}
              onChange={e => set('facility_name', e.target.value)}
              placeholder="e.g. Fort Campbell BHOP or ABC Behavioral Health"
              className="input-base"
            />
          </div>
          <div>
            <label className="form-label">Default Mode</label>
            <div className="flex gap-2">
              {['army', 'civilian'].map(m => (
                <button
                  key={m}
                  onClick={() => set('default_mode', m)}
                  className={`flex-1 py-2.5 text-sm font-medium rounded-md border transition-all ${
                    form.default_mode === m
                      ? m === 'army' ? 'bg-army-muted text-army-text border-army-border' : 'bg-civilian-muted text-civilian-text border-civilian-border'
                      : 'bg-surface-2 text-text-secondary border-border hover:border-border-light'
                  }`}
                >
                  {m === 'army' ? '68X Army' : 'Civilian'}
                </button>
              ))}
            </div>
          </div>
        </Section>

        {/* OpenAI API Key */}
        <Section title="OpenAI API Key" icon={Key} color="text-yellow-400">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-warning-muted/20 border border-yellow-800/40">
            <AlertCircle className="w-3.5 h-3.5 text-warning mt-0.5 flex-shrink-0" />
            <p className="text-xs text-yellow-300/80 leading-relaxed">
              Your API key is stored in your Supabase account (encrypted at rest) and synced to this device.
              It is only used to call OpenAI directly from your browser — never stored on our servers.
            </p>
          </div>
          <div>
            <label className="form-label">API Key</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type={showKey ? 'text' : 'password'}
                  value={form.openai_api_key || ''}
                  onChange={e => set('openai_api_key', e.target.value)}
                  placeholder="sk-..."
                  className="input-base pl-9 pr-9 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowKey(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                >
                  {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <Button
                variant="secondary"
                size="sm"
                loading={testingKey}
                onClick={handleTestKey}
                className={keyStatus === 'valid' ? 'text-success' : keyStatus === 'invalid' ? 'text-danger' : ''}
              >
                {keyStatus === 'valid' ? 'Valid' : keyStatus === 'invalid' ? 'Invalid' : 'Test'}
              </Button>
            </div>
            <p className="text-xs text-text-muted mt-1.5">
              Get your key at{' '}
              <a
                href="https://platform.openai.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline inline-flex items-center gap-0.5"
              >
                platform.openai.com <ExternalLink className="w-3 h-3" />
              </a>
            </p>
          </div>
        </Section>

        {/* Custom AI Prompts */}
        <Section title="Custom AI Instructions" icon={Brain}>
          <p className="text-xs text-text-muted -mt-2">
            Add custom instructions to GPT-4 when generating notes. Leave blank to use defaults.
          </p>
          <div>
            <label className="form-label flex items-center gap-1.5">
              <Shield className="w-3 h-3 text-army" />
              Army Mode — Custom Instructions
            </label>
            <textarea
              value={form.custom_army_prompt || ''}
              onChange={e => set('custom_army_prompt', e.target.value)}
              placeholder="e.g. Always use Behavioral Health language consistent with Army Regulation 40-66..."
              rows={3}
              className="textarea-base text-sm"
            />
          </div>
          <div>
            <label className="form-label flex items-center gap-1.5">
              <Stethoscope className="w-3 h-3 text-civilian" />
              Civilian Mode — Custom Instructions
            </label>
            <textarea
              value={form.custom_civilian_prompt || ''}
              onChange={e => set('custom_civilian_prompt', e.target.value)}
              placeholder="e.g. Use ABA terminology. Always include target behaviors and prompting levels..."
              rows={3}
              className="textarea-base text-sm"
            />
          </div>
        </Section>

        {/* Save button */}
        <div className="flex justify-end">
          <Button variant="primary" size="md" loading={saving} icon={Check} onClick={handleSave}>
            Save Settings
          </Button>
        </div>

        {/* Data & Privacy */}
        <Section title="Data & Privacy" icon={SettingsIcon} color="text-text-muted">
          <div className="space-y-2 text-xs text-text-muted leading-relaxed">
            <p>• All client data is stored in your personal Supabase project with row-level security.</p>
            <p>• Audio recordings are processed client-side and sent directly to OpenAI Whisper. They are never stored permanently.</p>
            <p>• No client full names appear in exported PDFs — only client ID numbers.</p>
            <p>• This app is for personal professional use. Ensure HIPAA compliance for your practice.</p>
            <p>• Always obtain informed consent from clients before recording sessions.</p>
          </div>
        </Section>

      </div>
    </Layout>
  )
}
