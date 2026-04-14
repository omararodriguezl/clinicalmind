import { useState, useEffect, useCallback } from 'react'
import { getClients, createClient_, updateClient, deleteClient } from '../utils/supabase'
import { useAuth } from './useAuth'

export function useClients() {
  const { user } = useAuth()
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchClients = useCallback(async () => {
    if (!user) return
    setLoading(true)
    setError(null)
    try {
      const data = await getClients(user.id)
      setClients(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchClients()
  }, [fetchClients])

  const addClient = useCallback(async (clientData) => {
    const newClient = await createClient_({ ...clientData, user_id: user.id })
    setClients(prev => [...prev, newClient].sort((a, b) => a.name.localeCompare(b.name)))
    return newClient
  }, [user])

  const editClient = useCallback(async (id, updates) => {
    const updated = await updateClient(id, updates)
    setClients(prev => prev.map(c => c.id === id ? updated : c))
    return updated
  }, [])

  const removeClient = useCallback(async (id) => {
    await deleteClient(id)
    setClients(prev => prev.filter(c => c.id !== id))
  }, [])

  return {
    clients,
    loading,
    error,
    refetch: fetchClients,
    addClient,
    editClient,
    removeClient,
  }
}
