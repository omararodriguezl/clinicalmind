import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Brain, Eye, EyeOff, Lock, Mail, Shield, ArrowLeft, CheckCircle } from 'lucide-react'
import { useAuth } from '../hooks/useAuth'
import { Button } from '../components/ui/Button'
import toast from 'react-hot-toast'

export default function Login() {
  const { signIn, resetPassword } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [forgotMode, setForgotMode] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)

  const handleSignIn = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await signIn(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      toast.error(err.message || 'Failed to sign in')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setResetLoading(true)
    try {
      await resetPassword(resetEmail)
      setResetSent(true)
    } catch (err) {
      toast.error(err.message || 'Failed to send reset email')
    } finally {
      setResetLoading(false)
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
          <p className="text-sm text-text-secondary mt-1">AI-Assisted Clinical Documentation</p>
        </div>

        {/* ── Forgot Password flow ── */}
        {forgotMode ? (
          <div className="card p-6">
            {resetSent ? (
              /* Success state */
              <div className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-success-muted border border-green-700 mb-1">
                  <CheckCircle className="w-6 h-6 text-success" />
                </div>
                <h2 className="text-base font-semibold text-text-primary">Check your email</h2>
                <p className="text-sm text-text-secondary">
                  We sent a password reset link to{' '}
                  <span className="text-text-primary font-medium">{resetEmail}</span>.
                  Click the link in the email to set a new password.
                </p>
                <p className="text-xs text-text-muted">
                  Didn't receive it? Check your spam folder.
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={ArrowLeft}
                  onClick={() => { setForgotMode(false); setResetSent(false); setResetEmail('') }}
                  className="mt-2"
                >
                  Back to sign in
                </Button>
              </div>
            ) : (
              /* Email input state */
              <>
                <button
                  onClick={() => setForgotMode(false)}
                  className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-secondary mb-4 transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  Back to sign in
                </button>
                <h2 className="text-base font-semibold text-text-primary mb-1">Reset password</h2>
                <p className="text-xs text-text-muted mb-5">
                  Enter your email and we'll send you a link to reset your password.
                </p>
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div>
                    <label className="form-label">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                      <input
                        type="email"
                        required
                        autoComplete="email"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="input-base pl-9"
                      />
                    </div>
                  </div>
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    loading={resetLoading}
                    className="w-full"
                  >
                    Send Reset Link
                  </Button>
                </form>
              </>
            )}
          </div>
        ) : (
          /* ── Normal sign in ── */
          <div className="card p-6">
            <h2 className="text-base font-semibold text-text-primary mb-1">Sign in to your account</h2>
            <p className="text-xs text-text-muted mb-5">Personal clinical workspace</p>

            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="form-label">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={form.email}
                    onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="you@example.com"
                    className="input-base pl-9"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="form-label !mb-0">Password</label>
                  <button
                    type="button"
                    onClick={() => setForgotMode(true)}
                    className="text-xs text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={form.password}
                    onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                    placeholder="••••••••"
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
              </div>

              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                className="w-full"
              >
                Sign In
              </Button>
            </form>

            <div className="mt-5 pt-5 border-t border-border text-center">
              <p className="text-xs text-text-muted">
                Don't have an account?{' '}
                <Link to="/signup" className="text-primary hover:underline font-medium">
                  Create account
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* Security notice */}
        <div className="mt-4 flex items-start gap-2 p-3 rounded-lg bg-surface-2 border border-border">
          <Shield className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-text-muted leading-relaxed">
            All client data is encrypted and stored with row-level security. This app is for personal professional use only.
          </p>
        </div>
      </div>
    </div>
  )
}
