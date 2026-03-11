'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function ProfielPage() {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState<{email?: string; user_metadata?: any} | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [savingName, setSavingName] = useState(false)
  const [nameSaved, setNameSaved] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({data}) => {
      setUser(data.user)
      setDisplayName(data.user?.user_metadata?.display_name || '')
    })
  }, [])

  async function saveName() {
    if (!displayName.trim()) return
    setSavingName(true)
    await supabase.auth.updateUser({ data: { display_name: displayName.trim() } })
    setSavingName(false)
    setNameSaved(true)
    setTimeout(() => setNameSaved(false), 2000)
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  async function resetOnboarding() {
    if (!confirm('Weet je zeker dat je de onboarding wilt resetten?')) return
    await supabase.from('app_settings').update({onboarding_completed: false})
    router.push('/onboarding')
  }

  return (
    <div className="px-4 pt-8 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background: '#1e2235'}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f1f5f9" strokeWidth="2.5" strokeLinecap="round"><polyline points="15,18 9,12 15,6"/></svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold font-jakarta text-white">Profiel</h1>
          <p className="text-slate-400 text-sm">Instellingen en account</p>
        </div>
      </div>

      {/* User info */}
      <div className="rounded-2xl p-5 mb-4" style={{background: '#12141f', border: '1px solid #1e2235'}}>
        <div className="flex items-center gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style={{background: 'linear-gradient(135deg, #f97316, #ea580c)'}}>
            💪
          </div>
          <div>
            <div className="font-semibold text-white">{displayName || 'Jouw account'}</div>
            <div className="text-slate-400 text-sm">{user?.email}</div>
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-500 font-medium mb-1.5 block">Weergavenaam</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={displayName}
              onChange={e => setDisplayName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && saveName()}
              placeholder="Jouw naam"
              className="flex-1 text-sm rounded-xl px-3 py-2.5 text-white"
              style={{background: '#0a0b14', border: '1px solid #2e3447'}}
            />
            <button
              onClick={saveName}
              disabled={savingName || !displayName.trim()}
              className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex-shrink-0"
              style={{background: nameSaved ? '#22c55e' : 'linear-gradient(135deg, #f97316, #ea580c)', opacity: !displayName.trim() ? 0.5 : 1}}
            >
              {nameSaved ? '✓' : savingName ? '...' : 'Opslaan'}
            </button>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="space-y-3">
        <Link
          href="/records"
          className="w-full rounded-2xl p-4 flex items-center justify-between"
          style={{background: '#12141f', border: '1px solid #1e2235'}}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background: '#1e2235'}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>
            </div>
            <div className="text-left">
              <div className="font-semibold text-white text-sm">Personal Records</div>
              <div className="text-xs text-slate-500">Beheer je PR's per oefening</div>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round"><polyline points="9,18 15,12 9,6"/></svg>
        </Link>

        <button
          onClick={resetOnboarding}
          className="w-full rounded-2xl p-4 flex items-center justify-between"
          style={{background: '#12141f', border: '1px solid #1e2235'}}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background: '#1e2235'}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            </div>
            <div className="text-left">
              <div className="font-semibold text-white text-sm">Schema herinstellen</div>
              <div className="text-xs text-slate-500">Verander je trainingsschema</div>
            </div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round"><polyline points="9,18 15,12 9,6"/></svg>
        </button>

        <button
          onClick={handleLogout}
          className="w-full rounded-2xl p-4 flex items-center justify-between"
          style={{background: '#12141f', border: '1px solid rgba(239,68,68,0.3)'}}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background: 'rgba(239,68,68,0.1)'}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            </div>
            <span className="font-semibold text-red-400 text-sm">Uitloggen</span>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><polyline points="9,18 15,12 9,6"/></svg>
        </button>
      </div>

      <div className="mt-8 text-center text-slate-700 text-xs">
        GymTrack v1.0 · Gemaakt met 💪
      </div>
    </div>
  )
}
