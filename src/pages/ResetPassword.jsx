import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Brain, Eye, EyeOff, Lock, CheckCircle, AlertCircle } from 'lucide-react'
import { supabase } from '../utils/supabase'
import { Button } from '../components/ui/Button'
import toast from 'react-hot-toast'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [error, setError] = useState(null)

  // Supabase redirects here with a token in the URL hash.
  // onAuthStateChange fires with event PASSWORD_RECOVERY when the token is valid.
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const passwordStrong = password.length >= 8

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    if (!passwordStrong) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setDone(true)
      toast.success('Password updated successfully')
      setTimeout(() => navigate('/dashboard'), 2500)
    } catch (err) {
      setError(err.message || 'Failed to update password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[size:48px_48px] pointer-events-none" />

      <div className="relative w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-4 shadow-glow">
            <Brain className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-text-primary">ClinicalMind</h1>
        </div>

        <div className="card p-6">
          {done ? (
            /* Success */
            <div className="text-center space-y-3 py-2">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-success-muted border border-green-700">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
              <h2 className="text-base font-semibold text-text-primary">Password updated!</h2>
              <p className="text-sm text-text-secondary">
                Your password has been changed. Redirecting to the app...
              </p>
            </div>
          ) : !sessionReady ? (
            /* Waiting for token */
            <div className="text-center space-y-3 py-2">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <h2 className="text-base font-semibold text-text-primary">Verifying link...</h2>
              <p className="text-xs text-text-muted">
                If this takes too long, the link may have expired.{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="text-primary hover:underline"
                >
                  Request a new one.
                </button>
              </p>
            </div>
          ) : (
            /* New password form */
            <>
              <h2 className="text-base font-semibold text-text-primary mb-1">Set new password</h2>
              <p className="text-xs text-text-muted mb-5">Choose a strong password for your account.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="form-label">New Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 8 characters"
                      className="input-base pl-9 pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary"
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {password && (
                    <p className={`text-xs mt-1 ${passwordStrong ? 'text-success' : 'text-warning'}`}>
                      {passwordStrong ? '✓ Strong enough' : 'Use at least 8 characters'}
                    </p>
                  )}
                </div>

                <div>
                  <label className="form-label">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      placeholder="Repeat password"
                      className="input-base pl-9"
                    />
                  </div>
                  {confirm && password !== confirm && (
                    <p className="text-xs mt-1 text-danger">Passwords don't match</p>
                  )}
                </div>

                {error && (
                  <div className="flex items-center gap-2 p-2.5 rounded-md bg-danger-muted/30 border border-red-800">
                    <AlertCircle className="w-3.5 h-3.5 text-danger flex-shrink-0" />
                    <p className="text-xs text-red-300">{error}</p>
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={loading}
                  className="w-full"
                >
                  Update Password
                </Button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
