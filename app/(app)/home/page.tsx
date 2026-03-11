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

export default function HomePage() {
  const supabase = createClient()
  const [userName, setUserName] = useState<string | null>(null)
  const [todaySession, setTodaySession] = useState<{ name: string; color: string; sessionId: string } | null>(null)
  const [weekDays, setWeekDays] = useState<DayInfo[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setUserName(user.user_metadata?.display_name || user.email?.split('@')[0] || null)
    }

    const { data: schedule } = await supabase
      .from('schedule')
      .select('*, sessions(*)')

    const today = new Date()
    const todayDow = (today.getDay() + 6) % 7 // 0=Mon

    // Calculate week start (Monday) and end (Sunday) dates
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

    const todaySched = schedule?.find(s => s.day_of_week === todayDow)
    if (todaySched?.sessions) {
      setTodaySession({
        name: (todaySched.sessions as any).name,
        color: (todaySched.sessions as any).color,
        sessionId: (todaySched.sessions as any).id,
      })
    }

    setLoading(false)
  }

  const greeting = () => {
    const h = new Date().getHours()
    if (h < 12) return 'Goedemorgen'
    if (h < 18) return 'Goedemiddag'
    return 'Goedenavond'
  }

  return (
    <div className="px-5 pt-10 max-w-md mx-auto pb-8">

      {/* Greeting */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-slate-500 text-sm font-medium">{greeting()}</p>
          <h1 className="text-3xl font-bold text-white mt-0.5">
            {userName ? userName : 'Welkom terug'}
            <span className="ml-2" style={{color: '#f97316'}}>👋</span>
          </h1>
        </div>
        <Image src="/draak.png" alt="mascotte" width={68} height={68} priority />
      </div>

      {/* Week strip */}
      <div className="rounded-2xl p-4 mb-5" style={{background: '#12141f', border: '1px solid #1e2235'}}>
        <div className="flex items-center justify-between">
          {weekDays.map((day, i) => (
            <div key={i} className="flex flex-col items-center gap-1.5">
              <span className="text-xs font-medium" style={{color: day.isToday ? (day.isCompleted ? '#16a34a' : '#f97316') : '#475569'}}>
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
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{background: day.isCompleted ? '#22c55e' : (day.sessionColor || 'transparent')}}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Today's training */}
      {!loading && (
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{color: '#475569'}}>Volgende training</p>
          {todaySession ? (
            <Link
              href={`/workout/${todaySession.sessionId}?date=${new Date().toISOString().split('T')[0]}`}
              className="block w-full rounded-2xl overflow-hidden relative"
              style={{height: '140px'}}
            >
              {SESSION_IMAGES[todaySession.name] && (
                <Image
                  src={SESSION_IMAGES[todaySession.name]}
                  alt={todaySession.name}
                  fill
                  className="object-cover"
                />
              )}
              <div className="absolute inset-0" style={{background: 'linear-gradient(to top, rgba(0,0,0,0.78) 40%, rgba(0,0,0,0.1) 100%)'}} />
              <div className="absolute bottom-0 left-0 right-0 p-4 flex items-end justify-between">
                <div>
                  <span className="text-xs font-medium" style={{color: 'rgba(255,255,255,0.6)'}}>Vandaag</span>
                  <p className="text-xl font-bold text-white">{todaySession.name}</p>
                </div>
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{background: '#f97316'}}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#0a0b14" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="5,3 19,12 5,21"/>
                  </svg>
                </div>
              </div>
            </Link>
          ) : (
            <div
              className="rounded-2xl p-5"
              style={{background: '#12141f', border: '1px solid #1e2235'}}
            >
              <p className="text-white font-semibold">Rustdag</p>
              <p className="text-slate-500 text-sm mt-0.5">Geen training gepland vandaag.</p>
            </div>
          )}
        </div>
      )}

      {/* Agenda link */}
      <Link
        href="/agenda"
        className="w-full rounded-2xl p-4 flex items-center justify-between"
        style={{background: '#12141f', border: '1px solid #1e2235'}}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background: '#1e2235'}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
          </div>
          <div>
            <p className="font-semibold text-white text-sm">Agenda</p>
            <p className="text-slate-500 text-xs">Bekijk je volledige schema</p>
          </div>
        </div>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round"><polyline points="9,18 15,12 9,6"/></svg>
      </Link>

    </div>
  )
}
