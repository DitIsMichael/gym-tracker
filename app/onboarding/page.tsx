'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import type { Session } from '@/lib/types'

const DAYS = ['Maandag', 'Dinsdag', 'Woensdag', 'Donderdag', 'Vrijdag', 'Zaterdag', 'Zondag']
const DAYS_SHORT = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']

export default function OnboardingPage() {
  const supabase = createClient()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [sessions, setSessions] = useState<Session[]>([])
  const [schedule, setSchedule] = useState<(string | null)[]>(Array(7).fill(null))
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadSessions() }, [])

  async function loadSessions() {
    const { data } = await supabase.from('sessions').select('*').order('created_at')
    setSessions(data || [])

    // Load existing schedule
    const { data: existing } = await supabase.from('schedule').select('*')
    if (existing && existing.length > 0) {
      const newSchedule = Array(7).fill(null)
      existing.forEach((s: {day_of_week: number, session_id: string | null}) => { newSchedule[s.day_of_week] = s.session_id })
      setSchedule(newSchedule)
    }
    setLoading(false)
  }

  function toggleDay(dayIdx: number, sessionId: string | null) {
    setSchedule(prev => {
      const next = [...prev]
      next[dayIdx] = next[dayIdx] === sessionId ? null : sessionId
      return next
    })
  }

  async function saveSchedule() {
    // Delete existing schedule
    await supabase.from('schedule').delete().neq('id', '00000000-0000-0000-0000-000000000000')

    // Insert new schedule
    const toInsert = schedule
      .map((sessionId, dayOfWeek) => sessionId ? {day_of_week: dayOfWeek, session_id: sessionId} : null)
      .filter(Boolean)

    if (toInsert.length > 0) {
      await supabase.from('schedule').insert(toInsert)
    }

    // Mark onboarding complete
    const { data: settings } = await supabase.from('app_settings').select('id').single()
    if (settings) {
      await supabase.from('app_settings').update({onboarding_completed: true}).eq('id', settings.id)
    } else {
      await supabase.from('app_settings').insert({onboarding_completed: true, rest_timer_seconds: 60})
    }

    router.push('/agenda')
  }

  const trainDays = schedule.filter(Boolean).length

  return (
    <div className="min-h-screen px-4 pt-8 max-w-md mx-auto" style={{background: '#0a0b14'}}>
      {/* Progress dots */}
      <div className="flex justify-center gap-2 mb-8">
        {[1, 2].map(s => (
          <div key={s} className="h-1.5 rounded-full transition-all" style={{width: step === s ? '2rem' : '0.5rem', background: step === s ? '#f97316' : '#1e2235'}} />
        ))}
      </div>

      {step === 1 ? (
        <>
          <div className="mb-8">
            <div className="text-5xl mb-4">👋</div>
            <h1 className="text-3xl font-bold font-jakarta text-white mb-2">Welkom bij GymTrack!</h1>
            <p className="text-slate-400">Laten we eerst je trainingsschema instellen. Maak je sessies aan die je wilt tracken.</p>
          </div>

          {sessions.length === 0 ? (
            <div className="rounded-2xl p-6 text-center mb-4" style={{background: '#12141f', border: '1px solid #1e2235'}}>
              <p className="text-slate-400 text-sm">Ga naar Sessies en maak eerst je trainingstypen aan (bijv. "Upper body", "Leg day").</p>
            </div>
          ) : (
            <div className="space-y-3 mb-6">
              {sessions.map(s => (
                <div key={s.id} className="rounded-2xl p-4 flex items-center gap-3" style={{background: '#12141f', border: '1px solid #1e2235'}}>
                  <div className="w-4 h-4 rounded-full" style={{background: s.color}} />
                  <span className="font-semibold text-white">{s.name}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => router.push('/sessies')}
              className="flex-1 py-3 rounded-xl font-semibold text-white"
              style={{background: '#1e2235'}}
            >
              Sessies aanmaken
            </button>
            {sessions.length > 0 && (
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-3 rounded-xl font-semibold text-white"
                style={{background: 'linear-gradient(135deg, #f97316, #ea580c)'}}
              >
                Volgende
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="mb-6">
            <div className="text-5xl mb-4">📅</div>
            <h1 className="text-3xl font-bold font-jakarta text-white mb-2">Jouw trainingsweek</h1>
            <p className="text-slate-400 text-sm">Wijs voor elke dag een sessie toe. Laat leeg voor een rustdag.</p>
          </div>

          <div className="space-y-3 mb-6">
            {DAYS.map((day, i) => (
              <div key={i} className="rounded-2xl overflow-hidden" style={{background: '#12141f', border: schedule[i] ? '1px solid rgba(249,115,22,0.3)' : '1px solid #1e2235'}}>
                <div className="px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold" style={{background: schedule[i] ? '#f97316' : '#1e2235', color: 'white'}}>
                      {DAYS_SHORT[i]}
                    </div>
                    <span className="font-medium text-white text-sm">{day}</span>
                  </div>
                  {schedule[i] ? (
                    <span className="text-xs text-orange-400">{sessions.find(s => s.id === schedule[i])?.name}</span>
                  ) : (
                    <span className="text-xs text-slate-600">Rustdag</span>
                  )}
                </div>
                <div className="px-3 pb-3 flex gap-2 flex-wrap">
                  <button
                    onClick={() => setSchedule(prev => {const n = [...prev]; n[i] = null; return n})}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold"
                    style={{background: !schedule[i] ? '#f97316' : '#1e2235', color: 'white'}}
                  >
                    Rust
                  </button>
                  {sessions.map(s => (
                    <button
                      key={s.id}
                      onClick={() => toggleDay(i, s.id)}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold"
                      style={{
                        background: schedule[i] === s.id ? s.color : '#1e2235',
                        color: 'white',
                        opacity: schedule[i] !== null && schedule[i] !== s.id ? 0.5 : 1,
                      }}
                    >
                      {s.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl p-4 mb-4" style={{background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)'}}>
            <p className="text-orange-300 text-sm text-center">
              {trainDays} trainingsdag{trainDays !== 1 ? 'en' : ''} gepland per week
            </p>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} className="w-12 h-12 rounded-xl flex items-center justify-center" style={{background: '#1e2235'}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f1f5f9" strokeWidth="2.5" strokeLinecap="round"><polyline points="15,18 9,12 15,6"/></svg>
            </button>
            <button
              onClick={saveSchedule}
              className="flex-1 py-3 rounded-xl font-semibold text-white"
              style={{background: 'linear-gradient(135deg, #f97316, #ea580c)'}}
            >
              Schema opslaan 🚀
            </button>
          </div>
        </>
      )}
    </div>
  )
}
