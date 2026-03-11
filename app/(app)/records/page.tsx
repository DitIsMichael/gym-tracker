'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Session, Exercise } from '@/lib/types'

interface ExerciseWithPR extends Exercise {
  pr_kg: number
  pr_id: string | null
  max_logged_kg: number | null
}

interface SessionWithExercises extends Session {
  exercises: ExerciseWithPR[]
}

export default function RecordsPage() {
  const supabase = createClient()
  const [sessions, setSessions] = useState<SessionWithExercises[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValue, setEditValue] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data: sessionsData } = await supabase
      .from('sessions')
      .select('*')
      .order('created_at')

    if (!sessionsData) {
      setLoading(false)
      return
    }

    const result: SessionWithExercises[] = []

    for (const session of sessionsData) {
      const { data: exercises } = await supabase
        .from('exercises')
        .select('*')
        .eq('session_id', session.id)
        .order('order_index')

      if (!exercises || exercises.length === 0) continue

      const exercisesWithPR: ExerciseWithPR[] = []

      for (const ex of exercises) {
        // Load PR
        const { data: pr } = await supabase
          .from('personal_records')
          .select('*')
          .eq('exercise_id', ex.id)
          .single()

        // Load max logged kg from set_logs
        const { data: maxLog } = await supabase
          .from('set_logs')
          .select('kg')
          .eq('exercise_id', ex.id)
          .order('kg', { ascending: false })
          .limit(1)
          .single()

        exercisesWithPR.push({
          ...ex,
          pr_kg: pr?.kg || 0,
          pr_id: pr?.id || null,
          max_logged_kg: maxLog?.kg || null,
        })
      }

      result.push({ ...session, exercises: exercisesWithPR })
    }

    setSessions(result)
    setLoading(false)
  }

  function startEdit(exercise: ExerciseWithPR) {
    setEditingId(exercise.id)
    setEditValue(String(exercise.pr_kg || ''))
  }

  async function savePR(exercise: ExerciseWithPR) {
    const kg = parseFloat(editValue)
    if (isNaN(kg) || kg < 0) return

    setSaving(true)

    let newPrId = exercise.pr_id

    if (exercise.pr_id) {
      const { error } = await supabase
        .from('personal_records')
        .update({ kg, updated_at: new Date().toISOString() })
        .eq('id', exercise.pr_id)
      if (error) {
        alert('Opslaan mislukt: ' + error.message)
        setSaving(false)
        return
      }
    } else {
      const { data, error } = await supabase
        .from('personal_records')
        .insert({ exercise_id: exercise.id, kg })
        .select()
        .single()
      if (error) {
        alert('Opslaan mislukt: ' + error.message)
        setSaving(false)
        return
      }
      newPrId = data?.id || null
    }

    setSaving(false)
    setEditingId(null)

    setSessions(prev =>
      prev.map(s => ({
        ...s,
        exercises: s.exercises.map(e =>
          e.id === exercise.id
            ? { ...e, pr_kg: kg, pr_id: newPrId }
            : e
        ),
      }))
    )
  }

  async function useMaxAsRecord(exercise: ExerciseWithPR) {
    if (!exercise.max_logged_kg) return
    setEditValue(String(exercise.max_logged_kg))
    setEditingId(exercise.id)
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-slate-400">Laden...</div>
    </div>
  )

  return (
    <div className="px-4 pt-6 max-w-md mx-auto pb-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold font-jakarta text-white">Records</h1>
        <p className="text-slate-400 text-sm mt-1">Jouw persoonlijke records per oefening</p>
      </div>

      {sessions.length === 0 && (
        <div className="text-center py-16 text-slate-500">
          <svg className="mx-auto mb-4" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="6"/>
            <path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/>
          </svg>
          <p>Nog geen sessies of oefeningen.</p>
          <p className="text-sm mt-1">Maak eerst een sessie aan via het Sessies tabblad.</p>
        </div>
      )}

      <div className="space-y-6">
        {sessions.map(session => (
          <div key={session.id}>
            {/* Session header */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: session.color }} />
              <h2 className="font-semibold text-white font-jakarta">{session.name}</h2>
            </div>

            {/* Exercises */}
            <div className="space-y-2">
              {session.exercises.map(exercise => (
                <div
                  key={exercise.id}
                  className="rounded-2xl p-4"
                  style={{ background: '#12141f', border: '1px solid #1e2235' }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-white text-sm">{exercise.name}</span>
                    {exercise.pr_kg > 0 && (
                      <span
                        className="text-xs font-bold px-2 py-1 rounded-lg"
                        style={{ background: 'rgba(249,115,22,0.2)', color: '#f97316' }}
                      >
                        PR: {exercise.pr_kg} kg
                      </span>
                    )}
                  </div>

                  {editingId === exercise.id ? (
                    <div className="flex items-center gap-2 mt-3">
                      <input
                        type="number"
                        value={editValue}
                        onChange={e => setEditValue(e.target.value)}
                        autoFocus
                        step="2.5"
                        min="0"
                        className="flex-1 text-sm font-semibold text-center rounded-xl px-3 py-2"
                        style={{ background: '#0a0b14', border: '1px solid #f97316', color: '#f1f5f9' }}
                        placeholder="kg"
                      />
                      <span className="text-slate-500 text-sm">kg</span>
                      <button
                        onClick={() => savePR(exercise)}
                        disabled={saving}
                        className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                        style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
                      >
                        {saving ? '...' : 'Opslaan'}
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-3 py-2 rounded-xl text-sm text-slate-400"
                        style={{ background: '#1e2235' }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 mt-2">
                      {exercise.max_logged_kg && exercise.max_logged_kg !== exercise.pr_kg && (
                        <button
                          onClick={() => useMaxAsRecord(exercise)}
                          className="text-xs px-2 py-1 rounded-lg flex items-center gap-1"
                          style={{ background: '#1e2235', color: '#64748b' }}
                        >
                          Max gelogd: {exercise.max_logged_kg} kg
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="9,11 12,14 22,4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                        </button>
                      )}
                      <button
                        onClick={() => startEdit(exercise)}
                        className="ml-auto text-xs px-3 py-1.5 rounded-xl font-medium"
                        style={{ background: '#1e2235', color: '#94a3b8' }}
                      >
                        {exercise.pr_kg > 0 ? 'Bewerken' : '+ Record instellen'}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
