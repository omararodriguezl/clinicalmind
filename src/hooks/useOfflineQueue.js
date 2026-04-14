import { useState, useEffect, useRef, useCallback } from 'react'

const QUEUE_KEY = 'cm_offline_queue'

/**
 * Manages an offline queue for tasks that fail due to network issues.
 * When connectivity is restored, queued tasks are automatically retried.
 */
export function useOfflineQueue(processor) {
  const [queue, setQueue] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]')
    } catch (_) {
      return []
    }
  })
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [processing, setProcessing] = useState(false)
  const processorRef = useRef(processor)
  processorRef.current = processor

  // Persist queue to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
    } catch (_) {}
  }, [queue])

  // Online / offline detection
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Auto-process queue when we come back online
  useEffect(() => {
    if (isOnline && queue.length > 0 && !processing) {
      processQueue()
    }
  }, [isOnline, queue.length]) // eslint-disable-line

  const enqueue = useCallback((task) => {
    const item = { id: Date.now(), ...task, addedAt: new Date().toISOString(), retries: 0 }
    setQueue(prev => [...prev, item])
    return item.id
  }, [])

  const processQueue = useCallback(async () => {
    if (processing || !isOnline) return
    setProcessing(true)

    setQueue(currentQueue => {
      processItems(currentQueue)
      return currentQueue
    })

    async function processItems(items) {
      const remaining = []
      for (const item of items) {
        try {
          await processorRef.current(item)
          // success — don't add back to remaining
        } catch (err) {
          if (item.retries < 3) {
            remaining.push({ ...item, retries: item.retries + 1, lastError: err.message })
          }
          // after 3 retries, drop the item
        }
      }
      setQueue(remaining)
      setProcessing(false)
    }
  }, [processing, isOnline])

  const clearQueue = useCallback(() => {
    setQueue([])
    localStorage.removeItem(QUEUE_KEY)
  }, [])

  return {
    queue,
    queueLength: queue.length,
    isOnline,
    processing,
    enqueue,
    processQueue,
    clearQueue,
  }
}
