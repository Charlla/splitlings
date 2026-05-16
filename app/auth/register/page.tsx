'use client'

import { useState, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Registration failed')
        return
      }
      router.push('/game')
    } catch {
      setError('Network error — please try again')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main
      className="flex min-h-svh flex-col items-center justify-center px-4"
      style={{ background: 'hsl(230, 25%, 8%)' }}
    >
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <Link href="/" className="text-4xl font-bold tracking-tight" style={{ color: 'var(--primary)' }}>
            SPLITLINGS
          </Link>
          <p className="mt-2 text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Create your player account
          </p>
        </div>

        <div
          className="rounded-2xl border p-6"
          style={{ borderColor: 'rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.04)' }}
        >
          <h2 className="text-xl font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
            Join the game
          </h2>
          <p className="text-sm mb-6" style={{ color: 'var(--muted-foreground)' }}>
            Create an account to save scores and compete
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                Username
              </label>
              <input
                type="text"
                required
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="OrbSplitter99"
                maxLength={24}
                className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  borderColor: 'rgba(255,255,255,0.12)',
                  color: 'var(--foreground)',
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="player@example.com"
                className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  borderColor: 'rgba(255,255,255,0.12)',
                  color: 'var(--foreground)',
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="At least 8 characters"
                className="w-full rounded-lg border px-3 py-2.5 text-sm outline-none"
                style={{
                  background: 'rgba(255,255,255,0.06)',
                  borderColor: 'rgba(255,255,255,0.12)',
                  color: 'var(--foreground)',
                }}
              />
            </div>

            {error && (
              <p
                className="text-sm rounded-lg px-3 py-2"
                style={{ color: 'var(--destructive)', background: 'rgba(220,50,50,0.1)' }}
              >
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              {loading ? 'Creating account…' : 'Create Account & Play'}
            </button>
          </form>

          <p className="mt-4 text-center text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className="font-medium underline underline-offset-4"
              style={{ color: 'var(--primary)' }}
            >
              Sign in
            </Link>
          </p>
        </div>

        <p className="mt-4 text-center text-xs" style={{ color: 'rgba(150,170,210,0.4)' }}>
          <Link href="/" className="hover:underline">
            Back to Home
          </Link>
        </p>
      </div>
    </main>
  )
}
