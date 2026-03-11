'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      setError('Onjuiste inloggegevens. Probeer het opnieuw.')
      setLoading(false)
    } else {
      router.push('/agenda')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{background: 'radial-gradient(ellipse at top, #1a1f3a 0%, #0a0b14 60%)'}}>
      {/* Logo/Brand */}
      <div className="mb-8 text-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{background: 'linear-gradient(135deg, #f97316, #ea580c)'}}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6.5 6.5h1M16.5 6.5h1M6.5 17.5h1M16.5 17.5h1"/>
            <rect x="2" y="9" width="4" height="6" rx="1"/>
            <rect x="18" y="9" width="4" height="6" rx="1"/>
            <rect x="6" y="11" width="12" height="2" rx="1"/>
          </svg>
        </div>
        <h1 className="text-3xl font-bold font-jakarta text-white">GymTrack</h1>
        <p className="text-slate-400 mt-1 text-sm">Jouw persoonlijke sportschool tracker</p>
      </div>

      {/* Login form */}
      <div className="w-full max-w-sm rounded-3xl p-6" style={{background: '#12141f', border: '1px solid #1e2235'}}>
        <h2 className="text-xl font-semibold font-jakarta mb-6 text-white">Inloggen</h2>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm text-slate-400 mb-2">E-mailadres</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="jouw@email.nl"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-slate-400 mb-2">Wachtwoord</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 rounded-xl px-4 py-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl font-semibold text-white transition-all"
            style={{background: loading ? '#64748b' : 'linear-gradient(135deg, #f97316, #ea580c)'}}
          >
            {loading ? 'Bezig...' : 'Inloggen'}
          </button>
        </form>
      </div>
    </div>
  )
}
