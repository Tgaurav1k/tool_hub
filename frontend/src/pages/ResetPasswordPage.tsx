import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, KeyRound, ArrowLeft, CheckCircle } from 'lucide-react'
import { Button, Input } from '@toolhub/ui'
import { C, glass, shadows } from '@toolhub/config'
import { authApi } from '@toolhub/api-client'

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await authApi.resetPassword(token, password)
      setDone(true)
    } catch (err: any) {
      setError(err?.message || 'This reset link is invalid or has expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: C.pageBg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
      }}
    >
      {/* Decorative background circles */}
      <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
        <div
          style={{
            position: 'absolute',
            top: '-120px',
            right: '-120px',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${C.sand200} 0%, transparent 70%)`,
            opacity: 0.5,
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-80px',
            left: '-80px',
            width: '300px',
            height: '300px',
            borderRadius: '50%',
            background: `radial-gradient(circle, ${C.sand100} 0%, transparent 70%)`,
            opacity: 0.6,
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        style={{ width: '100%', maxWidth: '420px', position: 'relative' }}
      >
        <div
          style={{
            background: glass.background,
            backdropFilter: glass.blur,
            WebkitBackdropFilter: glass.blur,
            border: glass.border,
            borderRadius: glass.borderRadius,
            boxShadow: shadows.glass,
            padding: '40px 36px',
          }}
        >
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '14px',
                background: `linear-gradient(135deg, ${C.sand500}, ${C.sand600})`,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: shadows.primary,
                marginBottom: '16px',
              }}
            >
              {done ? <CheckCircle size={28} color="#fff" /> : <KeyRound size={28} color="#fff" />}
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: C.coffee800, margin: '0 0 4px' }}>
              {done ? 'Password updated' : 'Set a new password'}
            </h1>
            <p style={{ fontSize: '14px', color: C.sand600, margin: 0 }}>
              {done
                ? 'Your password has been changed. You can now sign in with it.'
                : 'Choose a new password for your account.'}
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              style={{
                background: C.dangerBg,
                border: `1px solid ${C.danger}`,
                borderRadius: '10px',
                padding: '10px 14px',
                marginBottom: '20px',
                fontSize: '13px',
                color: C.danger,
                fontWeight: 500,
              }}
            >
              {error}
            </motion.div>
          )}

          {done ? (
            <Button
              fullWidth
              size="lg"
              onClick={() => navigate('/login')}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              Go to sign in
            </Button>
          ) : !token ? (
            <p style={{ fontSize: '13px', color: C.danger, textAlign: 'center', margin: '0 0 8px' }}>
              This reset link is missing its token. Please request a new one.
            </p>
          ) : (
            <form onSubmit={handleSubmit}>
              <Input
                label="New password"
                type="password"
                placeholder="••••••••"
                icon={<Lock size={18} />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
              <Input
                label="Confirm new password"
                type="password"
                placeholder="••••••••"
                icon={<Lock size={18} />}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                autoComplete="new-password"
                required
              />
              <Button
                type="submit"
                fullWidth
                size="lg"
                disabled={loading}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
              >
                {loading ? (
                  <span style={{ animation: 'pulse 1.5s infinite' }}>Updating…</span>
                ) : (
                  'Update password'
                )}
              </Button>
            </form>
          )}

          {!done && (
            <button
              type="button"
              onClick={() => navigate('/login')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                margin: '16px auto 0',
                background: 'none',
                border: 'none',
                padding: '4px',
                fontSize: '13px',
                fontWeight: 500,
                color: C.sand600,
                cursor: 'pointer',
              }}
            >
              <ArrowLeft size={15} /> Back to sign in
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
