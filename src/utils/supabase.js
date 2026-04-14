import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials missing. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.'
  )
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
    },
  }
)

// ── Clients ──────────────────────────────────────────────────────────────────

export async function getClients(userId) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('user_id', userId)
    .order('name', { ascending: true })
  if (error) throw error
  return data
}

export async function getClient(id) {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createClient_(client) {
  const { data, error } = await supabase
    .from('clients')
    .insert([client])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateClient(id, updates) {
  const { data, error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteClient(id) {
  const { error } = await supabase.from('clients').delete().eq('id', id)
  if (error) throw error
}

// ── Sessions ─────────────────────────────────────────────────────────────────

export async function getSessions(userId, clientId = null) {
  let query = supabase
    .from('sessions')
    .select('*, clients(name, client_id_number)')
    .eq('user_id', userId)
    .order('session_date', { ascending: false })

  if (clientId) query = query.eq('client_id', clientId)

  const { data, error } = await query
  if (error) throw error
  return data
}

export async function getSession(id) {
  const { data, error } = await supabase
    .from('sessions')
    .select('*, clients(*)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function createSession(session) {
  const { data, error } = await supabase
    .from('sessions')
    .insert([session])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateSession(id, updates) {
  const { data, error } = await supabase
    .from('sessions')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function deleteSession(id) {
  const { error } = await supabase.from('sessions').delete().eq('id', id)
  if (error) throw error
}

// ── Safety Plans ──────────────────────────────────────────────────────────────

export async function getSafetyPlans(clientId) {
  const { data, error } = await supabase
    .from('safety_plans')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getActiveSafetyPlan(clientId) {
  const { data, error } = await supabase
    .from('safety_plans')
    .select('*')
    .eq('client_id', clientId)
    .eq('is_active', true)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function createSafetyPlan(plan) {
  const { data, error } = await supabase
    .from('safety_plans')
    .insert([plan])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function updateSafetyPlan(id, updates) {
  const { data, error } = await supabase
    .from('safety_plans')
    .update(updates)
    .eq('id', id)
    .select()
    .single()
  if (error) throw error
  return data
}

// ── User Settings ──────────────────────────────────────────────────────────────

export async function getUserSettings(userId) {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function upsertUserSettings(settings) {
  const { data, error } = await supabase
    .from('user_settings')
    .upsert([settings], { onConflict: 'user_id' })
    .select()
    .single()
  if (error) throw error
  return data
}

// ── DSM Favorites ─────────────────────────────────────────────────────────────

export async function getDsmFavorites(userId) {
  const { data, error } = await supabase
    .from('dsm_favorites')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function addDsmFavorite(favorite) {
  const { data, error } = await supabase
    .from('dsm_favorites')
    .insert([favorite])
    .select()
    .single()
  if (error) throw error
  return data
}

export async function removeDsmFavorite(id) {
  const { error } = await supabase.from('dsm_favorites').delete().eq('id', id)
  if (error) throw error
}
