'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function ProfielPage() {
  const supabase = createClient()
  const router = useRouter()
  const [user, setUser] = useState<{email?: string} | null>(null)

  useEffect(() => {
    supabase.auth.getUser().then(({data}) => setUser(data.user))
  }, [])

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
          <h1 className="text-2xl font-bold font-syne text-white">Profiel</h1>
          <p className="text-slate-400 text-sm">Instellingen en account</p>
        </div>
      </div>

      {/* User info */}
      <div className="rounded-2xl p-5 mb-4" style={{background: '#12141f', border: '1px solid #1e2235'}}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl" style={{background: 'linear-gradient(135deg, #f97316, #ea580c)'}}>
            💪
          </div>
          <div>
            <div className="font-semibold text-white">Jouw account</div>
            <div className="text-slate-400 text-sm">{user?.email}</div>
          </div>
        </div>
      </div>

      {/* Settings */}
      <div className="space-y-3">
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
