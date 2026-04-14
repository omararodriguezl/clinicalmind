import { useState, useEffect, useCallback } from 'react'
import { getUserSettings, upsertUserSettings } from '../utils/supabase'
import { useAuth } from './useAuth'

const DEFAULTS = {
  default_mode: 'civilian',
  custom_army_prompt: '',
  custom_civilian_prompt: '',
  clinician_name: '',
  clinician_credentials: '',
  facility_name: '',
  openai_api_key: '',
}

export function useSettings() {
  const { user } = useAuth()
  const [settings, setSettings] = useState(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fetchSettings = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const data = await getUserSettings(user.id)
      if (data) {
        setSettings({ ...DEFAULTS, ...data })
        // Sync OpenAI key to localStorage for openai.js helper
        if (data.openai_api_key) {
          localStorage.setItem('cm_openai_key', data.openai_api_key)
        }
      }
    } catch (_) {
      // Use defaults on error
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const saveSettings = useCallback(async (updates) => {
    setSaving(true)
    try {
      const merged = { ...settings, ...updates, user_id: user.id }
      const saved = await upsertUserSettings(merged)
      setSettings({ ...DEFAULTS, ...saved })
      if (saved.openai_api_key) {
        localStorage.setItem('cm_openai_key', saved.openai_api_key)
      }
      return saved
    } finally {
      setSaving(false)
    }
  }, [settings, user])

  return { settings, loading, saving, saveSettings, refetch: fetchSettings }
}
