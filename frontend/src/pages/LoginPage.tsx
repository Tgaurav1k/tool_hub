import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { LogIn, Mail, Lock, Wrench } from 'lucide-react'
import { Button, Input } from '@toolhub/ui'
import { C, glass, shadows } from '@toolhub/config'
import { authApi } from '@toolhub/api-client'
import { getCurrentUser } from '@toolhub/auth'
import { useAppStore } from '../stores/appStore'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const setUser = useAppStore((s) => s.setUser)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await authApi.login(email, password)
      const user = await getCurrentUser()
      if (user) {
        setUser(user)
        navigate('/dashboard')
      }
    } catch (err: any) {
      setError(err?.message || 'Invalid email or password')
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
      <div
        style={{
          position: 'fixed',
          inset: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
        }}
      >
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
        style={{
          width: '100%',
          maxWidth: '420px',
          position: 'relative',
        }}
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
          {/* Logo / Brand */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
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
              <Wrench size={28} color="#fff" />
            </div>
            <h1
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: C.coffee800,
                margin: '0 0 4px',
              }}
            >
              Tool HUB
            </h1>
            <p
              style={{
                fontSize: '14px',
                color: C.sand600,
                margin: 0,
              }}
            >
              Single login portal for SuperAdmin and created users
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

          {/* Form */}
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
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              icon={<Lock size={18} />}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
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
                <span style={{ animation: 'pulse 1.5s infinite' }}>Signing in…</span>
              ) : (
                <>
                  <LogIn size={18} /> Sign In
                </>
              )}
            </Button>

            <button
              type="button"
              onClick={() => navigate('/forgot-password')}
              style={{
                display: 'block',
                margin: '16px auto 0',
                background: 'none',
                border: 'none',
                padding: '4px',
                fontSize: '13px',
                fontWeight: 500,
                color: C.sand600,
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              Forgot password?
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  )
}
