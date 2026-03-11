'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import type { Schedule, WorkoutLog, Session } from '@/lib/types'

const DAYS = ['Ma', 'Di', 'Wo', 'Do', 'Vr', 'Za', 'Zo']

const SESSION_IMAGES: Record<string, string> = {
  'Upper Body': '/session-upper-body.webp',
  'Leg Day': '/session-leg-day.webp',
  'Tennis': '/session-tennis.webp',
  'Full Body': '/session-full-body.webp',
}

function getWeekDates(offset = 0) {
  const now = new Date()
  const dayOfWeek = now.getDay()
  const mondayDiff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(now)
  monday.setDate(now.getDate() + mondayDiff + offset * 7)

  return Array.from({length: 7}, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

export default function AgendaPage() {
  const supabase = createClient()
  const [weekOffset, setWeekOffset] = useState(0)
  const [schedule, setSchedule] = useState<Schedule[]>([])
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([])
  const [onboardingDone, setOnboardingDone] = useState(true)
  const [loading, setLoading] = useState(true)

  const weekDates = getWeekDates(weekOffset)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  useEffect(() => {
    loadData()
  }, [weekOffset])

  async function loadData() {
    setLoading(true)

    // Check onboarding
    const { data: settings } = await supabase.from('app_settings').select('*').single()
    if (settings && !settings.onboarding_completed) {
      setOnboardingDone(false)
    }

    // Load schedule
    const { data: scheduleData } = await supabase
      .from('schedule')
      .select('*, sessions(*)')
    setSchedule(scheduleData || [])

    // Load workout logs for this week
    const startDate = weekDates[0].toISOString().split('T')[0]
    const endDate = weekDates[6].toISOString().split('T')[0]

    const { data: logs } = await supabase
      .from('workout_logs')
      .select('*, sessions(*)')
      .gte('date', startDate)
      .lte('date', endDate)
    setWorkoutLogs(logs || [])

    setLoading(false)
  }

  function getSessionForDay(date: Date): Session | null {
    const dayOfWeek = date.getDay() === 0 ? 6 : date.getDay() - 1 // Convert to Mon=0

    // Check for schedule entry
    const scheduleEntry = schedule.find(s => s.day_of_week === dayOfWeek)
    return (scheduleEntry?.sessions as Session) || null
  }

  function getWorkoutLogForDay(date: Date): WorkoutLog | null {
    const dateStr = date.toISOString().split('T')[0]
    const logsForDay = workoutLogs.filter(w => w.date === dateStr)
    return logsForDay.find(w => w.completed) || logsForDay[0] || null
  }

  const weekLabel = weekOffset === 0 ? 'Deze week' :
    weekOffset === 1 ? 'Volgende week' :
    weekOffset === -1 ? 'Vorige week' :
    `Week van ${weekDates[0].toLocaleDateString('nl-NL', {day: 'numeric', month: 'short'})}`

  if (!onboardingDone) {
    return (
      <div className="px-4 pt-8 max-w-md mx-auto">
        <div className="rounded-3xl p-6 text-center" style={{background: '#12141f', border: '1px solid #1e2235'}}>
          <div className="text-5xl mb-4">💪</div>
          <h2 className="text-2xl font-bold font-jakarta mb-2 text-white">Welkom bij GymTrack!</h2>
          <p className="text-slate-400 mb-6 text-sm">Stel eerst je trainingsschema in om te beginnen.</p>
          <Link href="/onboarding" className="block w-full py-3 rounded-xl font-semibold text-white text-center" style={{background: 'linear-gradient(135deg, #f97316, #ea580c)'}}>
            Schema instellen
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 pt-8 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold font-jakarta text-white">Agenda</h1>
          <p className="text-slate-400 text-sm">{weekLabel}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setWeekOffset(w => w - 1)}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{background: '#1e2235'}}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f1f5f9" strokeWidth="2.5" strokeLinecap="round"><polyline points="15,18 9,12 15,6"/></svg>
          </button>
          <button
            onClick={() => setWeekOffset(0)}
            className="px-3 h-10 rounded-xl text-xs font-semibold"
            style={{background: weekOffset === 0 ? '#f97316' : '#1e2235', color: 'white'}}
          >
            Nu
          </button>
          <button
            onClick={() => setWeekOffset(w => w + 1)}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{background: '#1e2235'}}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f1f5f9" strokeWidth="2.5" strokeLinecap="round"><polyline points="9,18 15,12 9,6"/></svg>
          </button>
        </div>
      </div>

      {/* Week days */}
      <div className="space-y-3">
        {weekDates.map((date, i) => {
          const session = getSessionForDay(date)
          const workoutLog = getWorkoutLogForDay(date)
          const isToday = date.getTime() === today.getTime()
          const isPast = date < today

          return (
            <div
              key={i}
              className="rounded-2xl p-4"
              style={{
                background: workoutLog?.completed
                  ? 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))'
                  : isToday ? 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(249,115,22,0.05))' : '#12141f',
                border: workoutLog?.completed
                  ? '1px solid rgba(34,197,94,0.4)'
                  : isToday ? '1px solid rgba(249,115,22,0.4)' : '1px solid #1e2235',
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-center w-10 flex-shrink-0">
                    <div className="text-xs text-slate-500 uppercase tracking-wide">{DAYS[i]}</div>
                    <div className={`text-lg font-bold ${isToday ? 'text-orange-400' : 'text-white'}`}>
                      {date.getDate()}
                    </div>
                  </div>
                  {session ? (
                    <div className="flex items-center gap-3">
                      {/* Small session image */}
                      <div className="relative w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                        {SESSION_IMAGES[session.name] ? (
                          <Image src={SESSION_IMAGES[session.name]} alt={session.name} fill className="object-cover" />
                        ) : (
                          <div className="absolute inset-0 rounded-xl" style={{ background: `${session.color}44` }} />
                        )}
                        {!SESSION_IMAGES[session.name] && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-2 h-2 rounded-full" style={{ background: session.color }} />
                          </div>
                        )}
                      </div>
                      <div>
                        <div className="font-semibold text-white text-sm">{session.name}</div>
                        {workoutLog?.completed && (
                          <div className="text-xs text-green-400 flex items-center gap-1 mt-0.5">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20,6 9,17 4,12"/></svg>
                            Voltooid
                          </div>
                        )}
                        {!workoutLog?.completed && !isPast && (
                          <div className="text-xs text-slate-500 mt-0.5">Gepland</div>
                        )}
                        {!workoutLog?.completed && isPast && !isToday && (
                          <div className="text-xs text-slate-600 mt-0.5">Gemist</div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-slate-600 text-sm">Rustdag</div>
                  )}
                </div>

                {session && !workoutLog?.completed && (
                  <Link
                    href={`/workout/${session.id}?date=${date.toISOString().split('T')[0]}`}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-white"
                    style={{background: isToday ? 'linear-gradient(135deg, #f97316, #ea580c)' : '#1e2235'}}
                  >
                    Start
                  </Link>
                )}
                {workoutLog?.completed && (
                  <Link
                    href={`/workout/${session?.id}?date=${date.toISOString().split('T')[0]}&view=true`}
                    className="px-4 py-2 rounded-xl text-xs font-semibold"
                    style={{background: '#1e2235', color: '#22c55e'}}
                  >
                    Bekijk
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
