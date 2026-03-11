'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
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
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday)
    d.setDate(monday.getDate() + i)
    return d
  })
}

function toDayOfWeek(date: Date): number {
  return date.getDay() === 0 ? 6 : date.getDay() - 1
}

function SessionThumb({ session, size = 44 }: { session: Session; size?: number }) {
  return (
    <div className="relative rounded-xl overflow-hidden flex-shrink-0" style={{ width: size, height: size }}>
      {SESSION_IMAGES[session.name] ? (
        <Image src={SESSION_IMAGES[session.name]} alt={session.name} fill className="object-cover" />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center" style={{ background: `${session.color}44` }}>
          <div className="w-2 h-2 rounded-full" style={{ background: session.color }} />
        </div>
      )}
    </div>
  )
}

function DayCard({
  dayOfWeek,
  date,
  session,
  workoutLog,
  isToday,
  isPast,
  onEditClick,
}: {
  dayOfWeek: number
  date: Date
  session: Session | null
  workoutLog: WorkoutLog | null
  isToday: boolean
  isPast: boolean
  onEditClick: (dow: number) => void
}) {
  const { setNodeRef: dropRef, isOver } = useDroppable({ id: dayOfWeek })
  const { attributes, listeners, setNodeRef: dragRef, isDragging } = useDraggable({
    id: dayOfWeek,
    disabled: !session,
  })

  const dateStr = date.toISOString().split('T')[0]

  let bg = '#12141f'
  let border = '#1e2235'
  if (workoutLog?.completed && session) {
    bg = 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))'
    border = 'rgba(34,197,94,0.4)'
  } else if (isToday) {
    bg = 'linear-gradient(135deg, rgba(249,115,22,0.15), rgba(249,115,22,0.05))'
    border = 'rgba(249,115,22,0.4)'
  }
  if (isOver) {
    bg = 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(249,115,22,0.08))'
    border = 'rgba(249,115,22,0.7)'
  }

  return (
    <div
      ref={dropRef}
      className="rounded-2xl p-4"
      style={{
        background: bg,
        border: `1px solid ${border}`,
        opacity: isDragging ? 0.3 : 1,
        transition: 'opacity 0.15s, border-color 0.15s',
      }}
    >
      <div className="flex items-center justify-between gap-2">
        {/* Day number */}
        <div className="text-center w-10 flex-shrink-0">
          <div className="text-xs text-slate-500 uppercase tracking-wide">{DAYS[dayOfWeek]}</div>
          <div className={`text-lg font-bold ${isToday ? 'text-orange-400' : 'text-white'}`}>
            {date.getDate()}
          </div>
        </div>

        {/* Session (draggable) or rest */}
        <div className="flex-1 min-w-0">
          {session ? (
            <div
              ref={dragRef}
              {...attributes}
              {...listeners}
              className="flex items-center gap-3 cursor-grab active:cursor-grabbing select-none"
              style={{ touchAction: 'none' }}
            >
              <SessionThumb session={session} size={44} />
              <div className="min-w-0">
                <div className="font-semibold text-white text-sm truncate">{session.name}</div>
                {workoutLog?.completed && (
                  <div className="text-xs text-green-400 flex items-center gap-1 mt-0.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
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
            <div className="text-slate-600 text-sm pl-1">Rustdag</div>
          )}
        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Edit / Add button */}
          <button
            onClick={() => onEditClick(dayOfWeek)}
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: '#1e2235' }}
          >
            {session ? (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            )}
          </button>

          {session && !workoutLog?.completed && (
            <Link
              href={`/workout/${session.id}?date=${dateStr}`}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-white"
              style={{ background: isToday ? 'linear-gradient(135deg, #f97316, #ea580c)' : '#1e2235' }}
            >
              Start
            </Link>
          )}
          {workoutLog?.completed && session && (
            <Link
              href={`/workout/${session.id}?date=${dateStr}&view=true`}
              className="px-4 py-2 rounded-xl text-xs font-semibold"
              style={{ background: '#1e2235', color: '#22c55e' }}
            >
              Bekijk
            </Link>
          )}
        </div>
      </div>
    </div>
  )
}

function SessionPicker({
  sessions,
  currentSessionId,
  workoutLog,
  onSelect,
  onMarkIncomplete,
  onClose,
}: {
  sessions: Session[]
  currentSessionId: string | null
  workoutLog: WorkoutLog | null
  onSelect: (sessionId: string | null) => void
  onMarkIncomplete: () => void
  onClose: () => void
}) {
  return (
    <>
      <div className="fixed inset-0 z-[60] bg-black/60" onClick={onClose} />
      <div
        className="fixed bottom-0 left-0 right-0 z-[70] rounded-t-3xl"
        style={{
          background: '#12141f',
          border: '1px solid #1e2235',
          paddingBottom: 'calc(1.5rem + env(safe-area-inset-bottom))',
        }}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-lg font-bold text-white">Dag aanpassen</h3>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: '#1e2235' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          <div className="space-y-2">
            {sessions.map(session => {
              const active = currentSessionId === session.id
              return (
                <button
                  key={session.id}
                  onClick={() => onSelect(session.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-2xl text-left"
                  style={{
                    background: active ? 'rgba(249,115,22,0.12)' : '#1e2235',
                    border: active ? '1px solid rgba(249,115,22,0.4)' : '1px solid transparent',
                  }}
                >
                  <SessionThumb session={session} size={40} />
                  <span className="font-semibold text-white text-sm flex-1">{session.name}</span>
                  {active && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth="2.5">
                      <polyline points="20,6 9,17 4,12" />
                    </svg>
                  )}
                </button>
              )
            })}

            {workoutLog?.completed && (
              <button
                onClick={onMarkIncomplete}
                className="w-full flex items-center gap-3 p-3 rounded-2xl text-left"
                style={{ background: '#1e2235' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(234,179,8,0.1)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#eab308" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 1 0 18 0 9 9 0 0 0-18 0"/>
                    <path d="M12 8v4"/>
                    <path d="M12 16h.01"/>
                  </svg>
                </div>
                <span className="font-semibold text-yellow-400 text-sm">Niet voltooid zetten</span>
              </button>
            )}

            {currentSessionId && (
              <button
                onClick={() => onSelect(null)}
                className="w-full flex items-center gap-3 p-3 rounded-2xl text-left"
                style={{ background: '#1e2235' }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(239,68,68,0.1)' }}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </div>
                <span className="font-semibold text-red-400 text-sm">Rustdag instellen</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default function AgendaPage() {
  const supabase = createClient()
  const [weekOffset, setWeekOffset] = useState(0)
  const [schedule, setSchedule] = useState<Schedule[]>([])
  const [allSessions, setAllSessions] = useState<Session[]>([])
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([])
  const [onboardingDone, setOnboardingDone] = useState(true)
  const [loading, setLoading] = useState(true)
  const [pickerDayOfWeek, setPickerDayOfWeek] = useState<number | null>(null)
  const [activeDragDay, setActiveDragDay] = useState<number | null>(null)

  const weekDates = getWeekDates(weekOffset)
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  )

  useEffect(() => {
    loadData()
  }, [weekOffset])

  async function loadData() {
    setLoading(true)

    const { data: settings } = await supabase.from('app_settings').select('*').single()
    if (settings && !settings.onboarding_completed) setOnboardingDone(false)

    const { data: scheduleData } = await supabase.from('schedule').select('*, sessions(*)')
    setSchedule(scheduleData || [])

    const { data: sessionsData } = await supabase.from('sessions').select('*').order('name')
    setAllSessions(sessionsData || [])

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

  function getScheduleEntry(dow: number): Schedule | undefined {
    return schedule.find(s => s.day_of_week === dow)
  }

  function getSessionForDay(dow: number): Session | null {
    return (getScheduleEntry(dow)?.sessions as Session) || null
  }

  function getWorkoutLogForDay(date: Date, sessionId?: string | null): WorkoutLog | null {
    const dateStr = date.toISOString().split('T')[0]
    const logs = workoutLogs.filter(w => w.date === dateStr && (sessionId == null || w.session_id === sessionId))
    return logs.find(w => w.completed) || logs[0] || null
  }

  async function assignSession(dow: number, sessionId: string | null) {
    const newSession = sessionId ? allSessions.find(s => s.id === sessionId) || null : null
    const dayDate = weekDates.find(d => toDayOfWeek(d) === dow)
    const dateStr = dayDate ? dayDate.toISOString().split('T')[0] : null

    // Optimistic: update schedule and clear workout logs for this day
    // (prevents stale greens when switching to a session that was previously completed on this date)
    setSchedule(prev => {
      const existing = prev.find(s => s.day_of_week === dow)
      if (existing) {
        return prev.map(s =>
          s.day_of_week === dow
            ? { ...s, session_id: sessionId, sessions: newSession ?? undefined }
            : s,
        )
      }
      return [...prev, { id: '', day_of_week: dow, session_id: sessionId, sessions: newSession ?? undefined }]
    })
    if (dateStr) {
      setWorkoutLogs(prev => prev.filter(w => w.date !== dateStr))
    }
    setPickerDayOfWeek(null)

    await supabase.from('schedule').upsert(
      { day_of_week: dow, session_id: sessionId },
      { onConflict: 'day_of_week' },
    )
    const startDate = weekDates[0].toISOString().split('T')[0]
    const endDate = weekDates[6].toISOString().split('T')[0]
    const [{ data: scheduleData }, { data: logs }] = await Promise.all([
      supabase.from('schedule').select('*, sessions(*)'),
      supabase.from('workout_logs').select('*, sessions(*)').gte('date', startDate).lte('date', endDate),
    ])
    setSchedule(scheduleData || [])
    setWorkoutLogs(logs || [])
  }

  async function markIncomplete(dow: number) {
    const date = weekDates.find(d => toDayOfWeek(d) === dow)
    if (!date) return
    const dateStr = date.toISOString().split('T')[0]
    const sessionId = getScheduleEntry(dow)?.session_id ?? null
    const log = workoutLogs.find(w => w.date === dateStr && w.session_id === sessionId)
    if (!log) return

    setWorkoutLogs(prev => prev.map(w => w.id === log.id ? { ...w, completed: false } : w))
    setPickerDayOfWeek(null)

    await supabase.from('workout_logs').update({ completed: false }).eq('id', log.id)
    const startDate = weekDates[0].toISOString().split('T')[0]
    const endDate = weekDates[6].toISOString().split('T')[0]
    const { data: logs } = await supabase.from('workout_logs').select('*, sessions(*)').gte('date', startDate).lte('date', endDate)
    setWorkoutLogs(logs || [])
  }

  function handleDragStart(event: DragStartEvent) {
    setActiveDragDay(event.active.id as number)
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    setActiveDragDay(null)
    if (!over || active.id === over.id) return

    const fromDay = active.id as number
    const toDay = over.id as number

    const fromEntry = getScheduleEntry(fromDay)
    const toEntry = getScheduleEntry(toDay)
    const fromSessionId = fromEntry?.session_id ?? null
    const toSessionId = toEntry?.session_id ?? null

    if (!fromSessionId) return

    // Find actual dates in the current week for these day-of-week values
    const fromDate = weekDates.find(d => toDayOfWeek(d) === fromDay)!
    const toDate = weekDates.find(d => toDayOfWeek(d) === toDay)!
    const fromDateStr = fromDate.toISOString().split('T')[0]
    const toDateStr = toDate.toISOString().split('T')[0]

    // Find workout logs for these dates, matched to the specific session being dragged
    const fromLog = workoutLogs.find(w => w.date === fromDateStr && w.session_id === fromSessionId) ?? null
    const toLog = toSessionId ? workoutLogs.find(w => w.date === toDateStr && w.session_id === toSessionId) ?? null : null

    // Optimistic swap — schedule
    const fromSession = allSessions.find(s => s.id === fromSessionId) ?? null
    const toSession = toSessionId ? allSessions.find(s => s.id === toSessionId) ?? null : null

    setSchedule(prev => {
      let next = prev.map(s => {
        if (s.day_of_week === fromDay) return { ...s, session_id: toSessionId, sessions: toSession ?? undefined }
        if (s.day_of_week === toDay) return { ...s, session_id: fromSessionId, sessions: fromSession ?? undefined }
        return s
      })
      if (!toEntry) {
        next = [...next, { id: '', day_of_week: toDay, session_id: fromSessionId, sessions: fromSession ?? undefined }]
      }
      return next
    })

    // Optimistic swap — workout logs (swap their dates so the green follows the session)
    setWorkoutLogs(prev => prev.map(w => {
      if (fromLog && w.id === fromLog.id) return { ...w, date: toDateStr }
      if (toLog && w.id === toLog.id) return { ...w, date: fromDateStr }
      return w
    }))

    const updates: Promise<unknown>[] = [
      supabase.from('schedule').upsert({ day_of_week: fromDay, session_id: toSessionId }, { onConflict: 'day_of_week' }) as Promise<unknown>,
      supabase.from('schedule').upsert({ day_of_week: toDay, session_id: fromSessionId }, { onConflict: 'day_of_week' }) as Promise<unknown>,
    ]
    if (fromLog) updates.push(supabase.from('workout_logs').update({ date: toDateStr }).eq('id', fromLog.id) as Promise<unknown>)
    if (toLog) updates.push(supabase.from('workout_logs').update({ date: fromDateStr }).eq('id', toLog.id) as Promise<unknown>)

    await Promise.all(updates)

    const startDate = weekDates[0].toISOString().split('T')[0]
    const endDate = weekDates[6].toISOString().split('T')[0]
    const [{ data: scheduleData }, { data: logs }] = await Promise.all([
      supabase.from('schedule').select('*, sessions(*)'),
      supabase.from('workout_logs').select('*, sessions(*)').gte('date', startDate).lte('date', endDate),
    ])
    setSchedule(scheduleData || [])
    setWorkoutLogs(logs || [])
  }

  const weekLabel =
    weekOffset === 0 ? 'Deze week' :
    weekOffset === 1 ? 'Volgende week' :
    weekOffset === -1 ? 'Vorige week' :
    `Week van ${weekDates[0].toLocaleDateString('nl-NL', { day: 'numeric', month: 'short' })}`

  if (!onboardingDone) {
    return (
      <div className="px-4 pt-8 max-w-md mx-auto">
        <div className="rounded-3xl p-6 text-center" style={{ background: '#12141f', border: '1px solid #1e2235' }}>
          <div className="text-5xl mb-4">💪</div>
          <h2 className="text-2xl font-bold font-jakarta mb-2 text-white">Welkom bij GymTrack!</h2>
          <p className="text-slate-400 mb-6 text-sm">Stel eerst je trainingsschema in om te beginnen.</p>
          <Link
            href="/onboarding"
            className="block w-full py-3 rounded-xl font-semibold text-white text-center"
            style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
          >
            Schema instellen
          </Link>
        </div>
      </div>
    )
  }

  const activeDragSession = activeDragDay !== null ? getSessionForDay(activeDragDay) : null
  const pickerCurrentSessionId = pickerDayOfWeek !== null ? (getScheduleEntry(pickerDayOfWeek)?.session_id ?? null) : null
  const pickerWorkoutLog = pickerDayOfWeek !== null
    ? (() => {
        const date = weekDates.find(d => toDayOfWeek(d) === pickerDayOfWeek)
        return date ? getWorkoutLogForDay(date, pickerCurrentSessionId) : null
      })()
    : null

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveDragDay(null)}
    >
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
              style={{ background: '#1e2235' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f1f5f9" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="15,18 9,12 15,6" />
              </svg>
            </button>
            <button
              onClick={() => setWeekOffset(0)}
              className="px-3 h-10 rounded-xl text-xs font-semibold"
              style={{ background: weekOffset === 0 ? '#f97316' : '#1e2235', color: 'white' }}
            >
              Nu
            </button>
            <button
              onClick={() => setWeekOffset(w => w + 1)}
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: '#1e2235' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f1f5f9" strokeWidth="2.5" strokeLinecap="round">
                <polyline points="9,18 15,12 9,6" />
              </svg>
            </button>
          </div>
        </div>

        {/* Week days */}
        <div className="space-y-3">
          {weekDates.map((date, i) => {
            const dow = toDayOfWeek(date)
            const session = getSessionForDay(dow)
            const workoutLog = getWorkoutLogForDay(date, session?.id)
            const isToday = date.getTime() === today.getTime()
            const isPast = date < today

            return (
              <DayCard
                key={i}
                dayOfWeek={dow}
                date={date}
                session={session}
                workoutLog={workoutLog}
                isToday={isToday}
                isPast={isPast}
                onEditClick={setPickerDayOfWeek}
              />
            )
          })}
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay dropAnimation={null}>
        {activeDragSession && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-2xl shadow-2xl pointer-events-none"
            style={{ background: '#1e2235', border: '1px solid rgba(249,115,22,0.5)' }}
          >
            <SessionThumb session={activeDragSession} size={36} />
            <span className="text-white font-semibold text-sm">{activeDragSession.name}</span>
          </div>
        )}
      </DragOverlay>

      {/* Session picker */}
      {pickerDayOfWeek !== null && (
        <SessionPicker
          sessions={allSessions}
          currentSessionId={pickerCurrentSessionId}
          workoutLog={pickerWorkoutLog}
          onSelect={sessionId => assignSession(pickerDayOfWeek, sessionId)}
          onMarkIncomplete={() => markIncomplete(pickerDayOfWeek)}
          onClose={() => setPickerDayOfWeek(null)}
        />
      )}
    </DndContext>
  )
}
