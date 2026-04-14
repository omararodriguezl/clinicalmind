import { useState, useRef, useCallback, useEffect } from 'react'

const STORAGE_KEY = 'cm_recording_backup'

export function useRecording() {
  const [isRecording, setIsRecording] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [duration, setDuration] = useState(0)
  const [audioBlob, setAudioBlob] = useState(null)
  const [audioUrl, setAudioUrl] = useState(null)
  const [error, setError] = useState(null)
  const [hasPermission, setHasPermission] = useState(null)

  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const streamRef = useRef(null)
  const timerRef = useRef(null)
  const wakeLockRef = useRef(null)

  // Request microphone permission upfront
  const requestPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      stream.getTracks().forEach(t => t.stop())
      setHasPermission(true)
      return true
    } catch (err) {
      setHasPermission(false)
      setError('Microphone access denied. Please allow microphone access in your browser settings.')
      return false
    }
  }, [])

  // Wake Lock — prevent screen from turning off during recording
  const acquireWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen')
      } catch (_) {
        // Wake lock not critical — fail silently
      }
    }
  }, [])

  const releaseWakeLock = useCallback(() => {
    if (wakeLockRef.current) {
      wakeLockRef.current.release().catch(() => {})
      wakeLockRef.current = null
    }
  }, [])

  // Re-acquire wake lock when page becomes visible again
  useEffect(() => {
    const handleVisibility = async () => {
      if (document.visibilityState === 'visible' && isRecording && !isPaused) {
        await acquireWakeLock()
      }
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  }, [isRecording, isPaused, acquireWakeLock])

  const startRecording = useCallback(async () => {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          channelCount: 1,
          sampleRate: 16000,
          echoCancellation: true,
          noiseSuppression: true,
        },
      })
      streamRef.current = stream

      // Pick best supported MIME type
      const mimeType = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg', 'audio/mp4']
        .find(t => MediaRecorder.isTypeSupported(t)) || ''

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)
      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType || 'audio/webm' })
        setAudioBlob(blob)
        const url = URL.createObjectURL(blob)
        setAudioUrl(url)

        // Save to localStorage as backup (base64 — max ~10MB safe)
        try {
          const reader = new FileReader()
          reader.onloadend = () => {
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify({
                data: reader.result,
                type: blob.type,
                timestamp: Date.now(),
              }))
            } catch (_) { /* localStorage quota exceeded — skip */ }
          }
          reader.readAsDataURL(blob)
        } catch (_) {}
      }

      recorder.start(1000) // collect chunks every second
      setIsRecording(true)
      setIsPaused(false)
      setDuration(0)

      timerRef.current = setInterval(() => {
        setDuration(d => d + 1)
      }, 1000)

      await acquireWakeLock()
    } catch (err) {
      setError(err.message || 'Failed to start recording')
    }
  }, [acquireWakeLock])

  const pauseRecording = useCallback(() => {
    if (mediaRecorderRef.current?.state === 'recording') {
      mediaRecorderRef.current.pause()
      setIsPaused(true)
      clearInterval(timerRef.current)
    }
  }, [])

  const resumeRecording = useCallback(async () => {
    if (mediaRecorderRef.current?.state === 'paused') {
      mediaRecorderRef.current.resume()
      setIsPaused(false)
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1)
      }, 1000)
      await acquireWakeLock()
    }
  }, [acquireWakeLock])

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
    streamRef.current?.getTracks().forEach(t => t.stop())
    clearInterval(timerRef.current)
    setIsRecording(false)
    setIsPaused(false)
    releaseWakeLock()
  }, [releaseWakeLock])

  const discardRecording = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl)
    setAudioBlob(null)
    setAudioUrl(null)
    setDuration(0)
    chunksRef.current = []
    localStorage.removeItem(STORAGE_KEY)
  }, [audioUrl])

  // Check for a backup recording from a previous session
  const getBackupRecording = useCallback(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return null
      const { data, type, timestamp } = JSON.parse(stored)
      // Ignore backups older than 24 hours
      if (Date.now() - timestamp > 86400000) {
        localStorage.removeItem(STORAGE_KEY)
        return null
      }
      return { data, type, timestamp }
    } catch (_) {
      return null
    }
  }, [])

  const clearBackup = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const formatDuration = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearInterval(timerRef.current)
      streamRef.current?.getTracks().forEach(t => t.stop())
      releaseWakeLock()
    }
  }, [releaseWakeLock])

  return {
    isRecording,
    isPaused,
    duration,
    formattedDuration: formatDuration(duration),
    audioBlob,
    audioUrl,
    error,
    hasPermission,
    requestPermission,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    discardRecording,
    getBackupRecording,
    clearBackup,
  }
}
