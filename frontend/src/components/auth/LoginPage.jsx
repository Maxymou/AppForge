import React, { useState } from 'react'
import { motion } from 'framer-motion'
import useAuthStore from '../../stores/authStore'
import { useNavigate } from 'react-router-dom'
import { AppForgeBrand, Button, Card, Input } from '../ui/primitives'

export default function LoginPage() {
  const { login, loading, error, clearError } = useAuthStore()
  const navigate = useNavigate()
  const [email, setEmail] = useState('admin@appforge.local')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    clearError()
    const success = await login(email, password)
    if (success) navigate('/roadmap')
  }

  return (
    // .app-viewport anchors the login shell to the stable --app-height so
    // the card never jumps when the iOS keyboard opens on focus.
    // .safe-x / safe-top / safe-bottom paint the notch + home indicator.
    <div className="app-viewport safe-top safe-bottom safe-x relative items-center justify-center overflow-hidden bg-main p-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(124,143,248,0.17),transparent_40%),radial-gradient(circle_at_80%_0%,rgba(62,207,159,0.08),transparent_35%)]" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md"
      >
        <div className="mb-7 flex justify-center">
          <AppForgeBrand />
        </div>

        <Card className="p-7 md:p-8">
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-content">Welcome back</h1>
            <p className="mt-1 text-sm text-content-muted">Sign in to continue to your workspace.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
                {error}
              </motion.div>
            )}

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-content-muted">Email</label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@appforge.local" required autoComplete="email" />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-content-muted">Password</label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required autoComplete="current-password" />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? (
                <>
                  <svg className="spinner h-4 w-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.37 0 0 5.37 0 12h4z" /></svg>
                  Signing in...
                </>
              ) : 'Sign in'}
            </Button>
          </form>
        </Card>
      </motion.div>
    </div>
  )
}
