'use client'

import { createClient } from '@/lib/supabase-client'
import { useState } from 'react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    const sb = createClient()
    await sb.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/api/auth/callback` },
    })
    setSent(true)
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#090909', display: 'flex',
      alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
      fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",
      padding: '24px',
    }}>
      <div style={{ fontSize: 48, marginBottom: 8 }}>◎</div>
      <h1 style={{ color: '#d0d0d0', fontWeight: 200, fontSize: 22, marginBottom: 4 }}>
        Habit Tracker
      </h1>
      <p style={{ color: '#333', fontSize: 12, marginBottom: 40 }}>your personal daily companion</p>

      {sent ? (
        <p style={{ color: '#4ade80', fontSize: 13, textAlign: 'center', maxWidth: 280 }}>
          Check your email — tap the magic link to sign in. You can close this tab.
        </p>
      ) : (
        <form onSubmit={handleSubmit} style={{ width: '100%', maxWidth: 320, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            style={{
              background: '#0c0c0c', border: '1px solid #222', borderRadius: 8,
              color: '#888', fontSize: 14, padding: '12px 16px', outline: 'none',
              fontFamily: 'inherit',
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              background: '#141414', border: '1px solid #2a2a2a', borderRadius: 8,
              color: loading ? '#333' : '#888', fontSize: 13, padding: '12px',
              cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {loading ? 'Sending…' : 'Send magic link'}
          </button>
          <p style={{ color: '#252525', fontSize: 11, textAlign: 'center' }}>
            No password needed — we&apos;ll email you a sign-in link
          </p>
        </form>
      )}
    </div>
  )
}
