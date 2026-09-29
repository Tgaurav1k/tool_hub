import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Send, ArrowLeft, KeyRound } from 'lucide-react'
import { Button, Input } from '@toolhub/ui'
import { C, glass, shadows } from '@toolhub/config'
import { authApi } from '@toolhub/api-client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [info, setInfo] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setInfo('')
    setLoading(true)
    try {
      const res = await authApi.forgotPassword(email.trim())
      setInfo(res.message || 'If that email exists, a new password has been sent to it.')
    } catch (err: any) {
      setError(err?.message || 'Could not send a reset email. Please try again later.')
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
              <KeyRound size={28} color="#fff" />
            </div>
            <h1 style={{ fontSize: '24px', fontWeight: 700, color: C.coffee800, margin: '0 0 4px' }}>
              Reset your password
            </h1>
            <p style={{ fontSize: '14px', color: C.sand600, margin: 0 }}>
              Enter your account email and we’ll send you a link to set a new password.
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

          {/* Success Banner */}
          {info && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              style={{
                background: C.successBg,
                border: `1px solid ${C.success}`,
                borderRadius: '10px',
                padding: '10px 14px',
                marginBottom: '20px',
                fontSize: '13px',
                color: C.success,
                fontWeight: 500,
              }}
            >
              {info}
            </motion.div>
          )}

          {/* Form */}
          {!info && (
            <form onSubmit={handleSubmit}>
              <Input
                label="Email"
                type="email"
                placeholder="you@company.com"
                icon={<Mail size={18} />}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="username"
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
                  <span style={{ animation: 'pulse 1.5s infinite' }}>Sending…</span>
                ) : (
                  <>
                    <Send size={18} /> Send reset link
                  </>
                )}
              </Button>
            </form>
          )}

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
        </div>
      </motion.div>
    </div>
  )
}
