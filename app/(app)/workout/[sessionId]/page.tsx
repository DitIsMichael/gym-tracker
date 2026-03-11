'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import type { Session, Exercise, SetLog } from '@/lib/types'

interface SetEntry {
  set_number: number
  kg: number
  reps: number
  done: boolean
}

interface ExerciseState {
  exercise: Exercise
  sets: SetEntry[]
  previousSets: SetLog[]
}

export default function WorkoutPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()

  const date = searchParams.get('date') || new Date().toISOString().split('T')[0]
  const viewOnly = searchParams.get('view') === 'true'

  const [session, setSession] = useState<Session | null>(null)
  const [exerciseStates, setExerciseStates] = useState<ExerciseState[]>([])
  const [workoutLogId, setWorkoutLogId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeExerciseIdx, setActiveExerciseIdx] = useState(0)

  // Rest timer
  const [restTimerSeconds, setRestTimerSeconds] = useState(60)
  const [restTimerDefault, setRestTimerDefault] = useState(60)
  const [restTimerActive, setRestTimerActive] = useState(false)
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const [showTimerSettings, setShowTimerSettings] = useState(false)

  useEffect(() => {
    loadData()
    loadTimerSettings()
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [])

  useEffect(() => {
    if (restTimerActive) {
      timerRef.current = setInterval(() => {
        setRestTimerSeconds(s => {
          if (s <= 1) {
            setRestTimerActive(false)
            clearInterval(timerRef.current!)
            return restTimerDefault
          }
          return s - 1
        })
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [restTimerActive])

  async function loadTimerSettings() {
    const { data } = await supabase.from('app_settings').select('rest_timer_seconds').single()
    if (data) {
      setRestTimerDefault(data.rest_timer_seconds)
      setRestTimerSeconds(data.rest_timer_seconds)
    }
  }

  async function loadData() {
    // Load session
    const { data: sess } = await supabase.from('sessions').select('*').eq('id', params.sessionId).single()
    setSession(sess)

    // Load exercises
    const { data: exs } = await supabase.from('exercises').select('*').eq('session_id', params.sessionId).order('order_index')

    // Load or create workout log
    let logId: string | null = null
    const { data: existingLog } = await supabase
      .from('workout_logs')
      .select('*')
      .eq('session_id', params.sessionId)
      .eq('date', date)
      .single()

    if (existingLog) {
      logId = existingLog.id
      setWorkoutLogId(existingLog.id)
    } else if (!viewOnly) {
      const { data: newLog } = await supabase.from('workout_logs').insert({
        session_id: params.sessionId,
        date: date,
        completed: false,
      }).select().single()
      logId = newLog?.id || null
      setWorkoutLogId(newLog?.id || null)
    }

    // Find previous workout log for this session (not today)
    const { data: prevLog } = await supabase
      .from('workout_logs')
      .select('id')
      .eq('session_id', params.sessionId)
      .neq('date', date)
      .order('date', {ascending: false})
      .limit(1)
      .single()

    // Build exercise states
    if (exs) {
      const states: ExerciseState[] = []
      for (const ex of exs) {
        // Load current sets
        const { data: currentSets } = logId ? await supabase
          .from('set_logs')
          .select('*')
          .eq('workout_log_id', logId)
          .eq('exercise_id', ex.id)
          .order('set_number') : {data: []}

        // Load previous sets
        const { data: prevSets } = prevLog ? await supabase
          .from('set_logs')
          .select('*')
          .eq('workout_log_id', prevLog.id)
          .eq('exercise_id', ex.id)
          .order('set_number') : {data: []}

        // Build set entries
        const sets: SetEntry[] = []
        for (let i = 0; i < ex.default_sets; i++) {
          const existingSet = currentSets?.find((s: SetLog) => s.set_number === i + 1)
          sets.push({
            set_number: i + 1,
            kg: existingSet?.kg || prevSets?.[i]?.kg || ex.default_kg,
            reps: existingSet?.reps || prevSets?.[i]?.reps || ex.default_reps,
            done: !!existingSet,
          })
        }

        states.push({ exercise: ex, sets, previousSets: prevSets || [] })
      }
      setExerciseStates(states)
    }

    setLoading(false)
  }

  async function updateSet(exIdx: number, setIdx: number, field: 'kg' | 'reps', value: number) {
    setExerciseStates(prev => {
      const next = [...prev]
      next[exIdx] = {...next[exIdx], sets: [...next[exIdx].sets]}
      next[exIdx].sets[setIdx] = {...next[exIdx].sets[setIdx], [field]: value}
      return next
    })
  }

  async function completeSet(exIdx: number, setIdx: number) {
    if (!workoutLogId) return

    const state = exerciseStates[exIdx]
    const set = state.sets[setIdx]

    // Save to database
    await supabase.from('set_logs').upsert({
      workout_log_id: workoutLogId,
      exercise_id: state.exercise.id,
      exercise_name: state.exercise.name,
      set_number: set.set_number,
      kg: set.kg,
      reps: set.reps,
    }, {onConflict: 'workout_log_id,exercise_id,set_number'})

    setExerciseStates(prev => {
      const next = [...prev]
      next[exIdx] = {...next[exIdx], sets: [...next[exIdx].sets]}
      next[exIdx].sets[setIdx] = {...next[exIdx].sets[setIdx], done: true}
      return next
    })

    // Start rest timer
    setRestTimerSeconds(restTimerDefault)
    setRestTimerActive(true)
  }

  async function addSet(exIdx: number) {
    const state = exerciseStates[exIdx]
    const lastSet = state.sets[state.sets.length - 1]
    setExerciseStates(prev => {
      const next = [...prev]
      next[exIdx] = {...next[exIdx], sets: [...next[exIdx].sets, {
        set_number: state.sets.length + 1,
        kg: lastSet?.kg || state.exercise.default_kg,
        reps: lastSet?.reps || state.exercise.default_reps,
        done: false,
      }]}
      return next
    })
  }

  async function finishWorkout() {
    if (!workoutLogId) return
    await supabase.from('workout_logs').update({completed: true}).eq('id', workoutLogId)
    router.push('/agenda')
  }

  async function saveTimerDefault(seconds: number) {
    await supabase.from('app_settings').update({rest_timer_seconds: seconds})
    setRestTimerDefault(seconds)
    setRestTimerSeconds(seconds)
    setShowTimerSettings(false)
  }

  const totalDone = exerciseStates.reduce((acc, s) => acc + s.sets.filter(s => s.done).length, 0)
  const totalSets = exerciseStates.reduce((acc, s) => acc + s.sets.length, 0)
  const progress = totalSets > 0 ? (totalDone / totalSets) * 100 : 0

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-slate-400">Laden...</div>
    </div>
  )

  return (
    <div className="px-4 pt-6 max-w-md mx-auto pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background: '#1e2235'}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f1f5f9" strokeWidth="2.5" strokeLinecap="round"><polyline points="15,18 9,12 15,6"/></svg>
        </button>
        <div className="flex-1">
          <h1 className="text-xl font-bold font-syne text-white">{session?.name}</h1>
          <p className="text-slate-400 text-sm">{new Date(date + 'T12:00:00').toLocaleDateString('nl-NL', {weekday: 'long', day: 'numeric', month: 'long'})}</p>
        </div>
      </div>

      {/* Progress bar */}
      {!viewOnly && (
        <div className="rounded-2xl p-4 mb-4" style={{background: '#12141f', border: '1px solid #1e2235'}}>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-slate-400">Voortgang</span>
            <span className="font-semibold text-white">{totalDone}/{totalSets} sets</span>
          </div>
          <div className="h-2 rounded-full overflow-hidden" style={{background: '#1e2235'}}>
            <div className="h-full rounded-full transition-all duration-500" style={{width: `${progress}%`, background: progress === 100 ? '#22c55e' : 'linear-gradient(90deg, #f97316, #ea580c)'}} />
          </div>
        </div>
      )}

      {/* Rest timer */}
      {!viewOnly && restTimerActive && (
        <div className="rounded-2xl p-4 mb-4 text-center" style={{background: 'linear-gradient(135deg, rgba(249,115,22,0.2), rgba(249,115,22,0.05))', border: '1px solid rgba(249,115,22,0.3)'}}>
          <div className="text-xs text-orange-400 uppercase tracking-wider mb-1">Rust timer</div>
          <div className="text-5xl font-bold font-syne text-white">
            {Math.floor(restTimerSeconds / 60)}:{String(restTimerSeconds % 60).padStart(2, '0')}
          </div>
          <button onClick={() => setRestTimerActive(false)} className="mt-3 px-4 py-2 rounded-xl text-xs font-semibold text-slate-400" style={{background: '#1e2235'}}>
            Overslaan
          </button>
        </div>
      )}

      {/* Timer settings toggle */}
      {!viewOnly && !restTimerActive && (
        <div className="flex justify-end mb-3">
          <button onClick={() => setShowTimerSettings(!showTimerSettings)} className="flex items-center gap-2 text-xs text-slate-500 hover:text-slate-400 px-3 py-2 rounded-xl" style={{background: '#1e2235'}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
            Rust: {restTimerDefault}s
          </button>
        </div>
      )}

      {showTimerSettings && (
        <div className="rounded-2xl p-4 mb-4" style={{background: '#12141f', border: '1px solid #1e2235'}}>
          <div className="text-sm font-semibold text-white mb-3">Rust timer instellen</div>
          <div className="flex gap-2 flex-wrap">
            {[30, 45, 60, 90, 120, 180].map(s => (
              <button key={s} onClick={() => saveTimerDefault(s)} className="px-3 py-2 rounded-xl text-sm font-semibold" style={{background: restTimerDefault === s ? '#f97316' : '#1e2235', color: 'white'}}>
                {s < 60 ? `${s}s` : `${s/60}m`}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Exercises */}
      <div className="space-y-4">
        {exerciseStates.map((state, exIdx) => (
          <div key={state.exercise.id} className="rounded-2xl overflow-hidden" style={{background: '#12141f', border: '1px solid #1e2235'}}>
            <div className="px-4 py-3 flex items-center justify-between" style={{background: activeExerciseIdx === exIdx ? 'rgba(249,115,22,0.1)' : 'transparent', borderBottom: '1px solid #1e2235'}}>
              <h3 className="font-semibold font-syne text-white">{state.exercise.name}</h3>
              <span className="text-xs text-slate-500">{state.sets.filter(s => s.done).length}/{state.sets.length} sets</span>
            </div>

            {/* Previous session reference */}
            {state.previousSets.length > 0 && (
              <div className="px-4 py-2 flex gap-3 overflow-x-auto" style={{borderBottom: '1px solid #1e2235'}}>
                <span className="text-xs text-slate-600 flex-shrink-0 self-center">Vorig:</span>
                {state.previousSets.map((ps, i) => (
                  <span key={i} className="text-xs flex-shrink-0 px-2 py-1 rounded-lg" style={{background: '#0a0b14', color: '#475569'}}>
                    {ps.kg}kg × {ps.reps}
                  </span>
                ))}
              </div>
            )}

            {/* Sets */}
            <div className="p-3 space-y-2">
              {state.sets.map((set, setIdx) => (
                <div key={setIdx} className="flex items-center gap-2 rounded-xl p-2" style={{background: set.done ? 'rgba(34,197,94,0.1)' : '#0f1118', border: `1px solid ${set.done ? 'rgba(34,197,94,0.3)' : '#1e2235'}`}}>
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0" style={{background: '#1e2235', color: '#64748b'}}>
                    {set.set_number}
                  </div>
                  <div className="flex items-center gap-1 flex-1">
                    <input
                      type="number"
                      value={set.kg}
                      onChange={e => updateSet(exIdx, setIdx, 'kg', +e.target.value)}
                      disabled={viewOnly || set.done}
                      className="text-center text-sm font-semibold"
                      style={{background: 'transparent', border: 'none', padding: '0.25rem', width: '56px', borderRadius: '0.5rem', color: set.done ? '#22c55e' : '#f1f5f9'}}
                      step="2.5"
                      min="0"
                    />
                    <span className="text-xs text-slate-600">kg</span>
                    <span className="text-slate-700 mx-1">×</span>
                    <input
                      type="number"
                      value={set.reps}
                      onChange={e => updateSet(exIdx, setIdx, 'reps', +e.target.value)}
                      disabled={viewOnly || set.done}
                      className="text-center text-sm font-semibold"
                      style={{background: 'transparent', border: 'none', padding: '0.25rem', width: '44px', borderRadius: '0.5rem', color: set.done ? '#22c55e' : '#f1f5f9'}}
                      min="1"
                    />
                    <span className="text-xs text-slate-600">reps</span>
                  </div>
                  {!viewOnly && !set.done && (
                    <button
                      onClick={() => { completeSet(exIdx, setIdx); setActiveExerciseIdx(exIdx) }}
                      className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                      style={{background: 'linear-gradient(135deg, #f97316, #ea580c)'}}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20,6 9,17 4,12"/></svg>
                    </button>
                  )}
                  {set.done && (
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{background: 'rgba(34,197,94,0.2)'}}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round"><polyline points="20,6 9,17 4,12"/></svg>
                    </div>
                  )}
                </div>
              ))}

              {/* Add set button */}
              {!viewOnly && (
                <button onClick={() => addSet(exIdx)} className="w-full py-2 rounded-xl text-xs font-semibold text-slate-500 flex items-center justify-center gap-1" style={{background: '#0f1118', border: '1px dashed #1e2235'}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Set toevoegen
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Finish button */}
      {!viewOnly && progress === 100 && (
        <button
          onClick={finishWorkout}
          className="w-full py-4 rounded-2xl font-bold text-white mt-6 text-lg font-syne"
          style={{background: 'linear-gradient(135deg, #22c55e, #16a34a)'}}
        >
          Training voltooien! 🎉
        </button>
      )}
      {!viewOnly && progress < 100 && totalDone > 0 && (
        <button
          onClick={finishWorkout}
          className="w-full py-3 rounded-2xl font-semibold text-slate-400 mt-4 text-sm"
          style={{background: '#12141f', border: '1px solid #1e2235'}}
        >
          Training beëindigen (incompleet)
        </button>
      )}
    </div>
  )
}
