'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'

const SESSION_IMAGES: Record<string, string> = {
  'Upper Body': '/session-upper-body.webp',
  'Leg Day': '/session-leg-day.webp',
  'Tennis': '/session-tennis.webp',
  'Full Body': '/session-full-body.webp',
}

interface DayInfo {
  date: Date
  dayLabel: string
  dayNum: number
  isToday: boolean
  sessionColor: string | null
  isCompleted: boolean
}

interface UpcomingSession {
  dayLabel: string
  date: string
  name: string
  color: string
  sessionId: string
  exerciseCount: number
}

export default function HomePage() {
  const supabase = createClient()
  const [userName, setUserName] = useState<string | null>(null)
  const [todaySession, setTodaySession] = useState<{ name: string; color: string; sessionId: string; exerciseCount: number } | null>(null)
  const [upcomingSessions, setUpcomingSessions] = useState<UpcomingSession[]>([])
  const [weekDays, setWeekDays] = useState<DayInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadAll() }, [])

  async function loadAll() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserName(user.user_metadata?.display_name || user.email?.split('@')[0] || null)
    }

    const { data: schedule } = await supabase.from('schedule').select('*, sessions(*)')
    const { data: exercises } = await supabase.from('exercises').select('session_id')

    // Count exercises per session
    const exCounts: Record<string, number> = {}
    for (const ex of exercises || []) {
      exCounts[ex.session_id] = (exCounts[ex.session_id] || 0) + 1
    }

    const today = new Date()
    const todayDow = (today.getDay() + 6) % 7

    const weekStart = new Date(today)
    weekStart.setDate(today.getDate() - todayDow)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    const weekStartStr = weekStart.toISOString().split('T')[0]
    const weekEndStr = weekEnd.toISOString().split('T')[0]

    const { data: completedLogs } = await supabase
      .from('workout_logs')
      .select('date')
      .eq('completed', true)
      .gte('date', weekStartStr)
      .lte('date', weekEndStr)

    const completedDates = new Set(completedLogs?.map(l => l.date) || [])
    const DAY_LABELS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']

    const days: DayInfo[] = []
    for (let i = 0; i < 7; i++) {
      const d = new Date(today)
      d.setDate(today.getDate() - todayDow + i)
      const sched = schedule?.find(s => s.day_of_week === i)
      const dateStr = d.toISOString().split('T')[0]
      days.push({
        date: d,
        dayLabel: DAY_LABELS[i],
        dayNum: d.getDate(),
        isToday: i === todayDow,
        sessionColor: (sched?.sessions as any)?.color || null,
        isCompleted: completedDates.has(dateStr),
      })
    }
    setWeekDays(days)

    // Today's session
    const todaySched = schedule?.find(s => s.day_of_week === todayDow)
    if (todaySched?.sessions) {
      const sess = todaySched.sessions as any
      setTodaySession({
        name: sess.name,
        color: sess.color,
        sessionId: sess.id,
        exerciseCount: exCounts[sess.id] || 0,
      })
    }

    // Upcoming sessions (next 3 days with a session, excluding today)
    const upcoming: UpcomingSession[] = []
    for (let offset = 1; offset <= 7 && upcoming.length < 3; offset++) {
      const dow = (todayDow + offset) % 7
      const sched = schedule?.find(s => s.day_of_week === dow)
      if (sched?.sessions) {
        const d = new Date(today)
        d.setDate(today.getDate() + offset)
        const sess = sched.sessions as any
        upcoming.push({
          dayLabel: DAY_LABELS[dow],
          date: d.toISOString().split('T')[0],
          name: sess.name,
          color: sess.color,
          sessionId: sess.id,
          exerciseCount: exCounts[sess.id] || 0,
        })
      }
    }
    setUpcomingSessions(upcoming)

    setLoading(false)
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Goedemorgen'
    if (h < 18) return 'Goedemiddag'
    return 'Goedenavond'
  }

  return (
    <div className="px-4 pt-10 max-w-md mx-auto pb-32">

      {/* Greeting */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-slate-500 text-sm font-medium">{greeting()}</p>
          <h1 className="text-3xl font-bold text-white mt-0.5">
            {userName ? userName : 'Welkom terug'}
            <span className="ml-2" style={{ color: '#f97316' }}>👋</span>
          </h1>
        </div>
        <Image src="/draak.png" alt="mascotte" width={68} height={68} priority />
      </div>

      {/* Week strip */}
      <div className="rounded-2xl p-4 mb-6" style={{ background: '#12141f', border: '1px solid #1e2235' }}>
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#475569' }}>Deze week</span>
          <Link href="/agenda" className="flex items-center gap-1 text-xs font-medium" style={{ color: '#f97316' }}>
            Agenda
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9,18 15,12 9,6" /></svg>
          </Link>
        </div>
        <div className="flex items-center justify-between">
          {weekDays.map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <span className="text-xs font-medium" style={{ color: day.isToday ? (day.isCompleted ? '#16a34a' : '#f97316') : '#475569' }}>
                {day.dayLabel}
              </span>
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold"
                style={{
                  background: (day.isToday && !day.isCompleted) ? '#f97316' : day.isCompleted ? 'rgba(22,163,74,0.2)' : 'transparent',
                  color: (day.isToday && !day.isCompleted) ? '#0a0b14' : '#94a3b8',
                  border: (day.isToday && day.isCompleted) ? '2px solid #16a34a' : undefined,
                }}
              >
                {day.dayNum}
              </div>
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: day.sessionColor || 'transparent' }} />
            </div>
          ))}
        </div>
      </div>

      {!loading && (
        <>
          {/* Today's training */}
          <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#475569' }}>Vandaag</p>
          {todaySession ? (
            <Link
              href={`/workout/${todaySession.sessionId}?date=${new Date().toISOString().split('T')[0]}`}
              className="block rounded-2xl overflow-hidden mb-6"
              style={{ border: '1px solid #1e2235' }}
            >
              <div className="relative flex items-end" style={{ height: 170 }}>
                {SESSION_IMAGES[todaySession.name] ? (
                  <Image src={SESSION_IMAGES[todaySession.name]} alt={todaySession.name} fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${todaySession.color}22, ${todaySession.color}55)` }} />
                )}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.78) 40%, rgba(0,0,0,0.05) 100%)' }} />
                <div className="relative z-10 p-4 w-full flex items-end justify-between">
                  <div>
                    <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.55)' }}>Vandaag</span>
                    <p className="text-xl font-bold text-white">{todaySession.name}</p>
                    {todaySession.exerciseCount > 0 && (
                      <p className="text-sm mt-0.5" style={{ color: 'rgba(255,255,255,0.5)' }}>{todaySession.exerciseCount} oefeningen</p>
                    )}
                  </div>
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#f97316' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0a0b14" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="5,3 19,12 5,21" />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="px-4 py-3 flex gap-2" style={{ background: '#12141f' }}>
                <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full" style={{ background: '#1e2235', color: todaySession.color }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                  {todaySession.exerciseCount} oefeningen
                </span>
                <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full" style={{ background: '#1e2235', color: '#22c55e' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polygon points="5,3 19,12 5,21" /></svg>
                  Start training
                </span>
              </div>
            </Link>
          ) : (
            <div className="rounded-2xl p-5 mb-6" style={{ background: '#12141f', border: '1px solid #1e2235' }}>
              <p className="text-white font-semibold">Rustdag 🛋️</p>
              <p className="text-slate-500 text-sm mt-0.5">Geen training gepland vandaag.</p>
            </div>
          )}

          {/* Upcoming sessions */}
          {upcomingSessions.length > 0 && (
            <>
              <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: '#475569' }}>Komende trainingen</p>
              <div className="space-y-3 mb-6">
                {upcomingSessions.map((s, i) => (
                  <Link
                    key={i}
                    href={`/workout/${s.sessionId}?date=${s.date}`}
                    className="block rounded-2xl overflow-hidden"
                    style={{ border: '1px solid #1e2235' }}
                  >
                    <div className="relative flex items-end" style={{ height: 110 }}>
                      {SESSION_IMAGES[s.name] ? (
                        <Image src={SESSION_IMAGES[s.name]} alt={s.name} fill className="object-cover" />
                      ) : (
                        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${s.color}22, ${s.color}55)` }} />
                      )}
                      <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.78) 40%, rgba(0,0,0,0.05) 100%)' }} />
                      <div className="relative z-10 p-4 w-full flex items-end justify-between">
                        <div>
                          <span className="text-xs font-medium" style={{ color: 'rgba(255,255,255,0.5)' }}>{s.dayLabel}</span>
                          <p className="text-base font-bold text-white">{s.name}</p>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full" style={{ background: 'rgba(0,0,0,0.4)', color: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(4px)' }}>
                          {s.exerciseCount} oef.
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </>
          )}

        </>
      )}
    </div>
  )
}
