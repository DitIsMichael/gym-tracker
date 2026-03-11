'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type Period = 'week' | 'maand' | 'jaar'

interface ExerciseProgress {
  exercise_name: string
  current_max_weight: number
  previous_max_weight: number
  percentage_change: number
  total_volume_current: number
  total_volume_previous: number
  volume_change: number
}

interface BodyWeightEntry {
  date: string
  weight: number
}

export default function ProgressiePage() {
  const supabase = createClient()
  const router = useRouter()
  const [period, setPeriod] = useState<Period>('maand')
  const [progress, setProgress] = useState<ExerciseProgress[]>([])
  const [bodyWeights, setBodyWeights] = useState<BodyWeightEntry[]>([])
  const [newWeight, setNewWeight] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'oefeningen' | 'gewicht'>('oefeningen')

  useEffect(() => { loadProgress() }, [period])
  useEffect(() => { loadBodyWeights() }, [])

  function getPeriodDates() {
    const now = new Date()
    const end = now.toISOString().split('T')[0]
    const start = new Date(now)

    if (period === 'week') start.setDate(now.getDate() - 7)
    else if (period === 'maand') start.setMonth(now.getMonth() - 1)
    else start.setFullYear(now.getFullYear() - 1)

    const prevEnd = new Date(start)
    prevEnd.setDate(prevEnd.getDate() - 1)
    const prevStart = new Date(prevEnd)
    if (period === 'week') prevStart.setDate(prevEnd.getDate() - 7)
    else if (period === 'maand') prevStart.setMonth(prevEnd.getMonth() - 1)
    else prevStart.setFullYear(prevEnd.getFullYear() - 1)

    return {
      currentStart: start.toISOString().split('T')[0],
      currentEnd: end,
      prevStart: prevStart.toISOString().split('T')[0],
      prevEnd: prevEnd.toISOString().split('T')[0],
    }
  }

  async function loadProgress() {
    setLoading(true)
    const {currentStart, currentEnd, prevStart, prevEnd} = getPeriodDates()

    // Load current period sets
    const { data: currentSets } = await supabase
      .from('set_logs')
      .select('*, workout_logs!inner(date)')
      .gte('workout_logs.date', currentStart)
      .lte('workout_logs.date', currentEnd)

    // Load previous period sets
    const { data: prevSets } = await supabase
      .from('set_logs')
      .select('*, workout_logs!inner(date)')
      .gte('workout_logs.date', prevStart)
      .lte('workout_logs.date', prevEnd)

    // Calculate progress per exercise
    const exerciseMap = new Map<string, ExerciseProgress>()

    const allExerciseNames = new Set([
      ...(currentSets || []).map((s: {exercise_name: string}) => s.exercise_name),
      ...(prevSets || []).map((s: {exercise_name: string}) => s.exercise_name),
    ])

    for (const name of Array.from(allExerciseNames)) {
      const curr = (currentSets || []).filter((s: {exercise_name: string}) => s.exercise_name === name)
      const prev = (prevSets || []).filter((s: {exercise_name: string}) => s.exercise_name === name)

      const currMax = curr.length > 0 ? Math.max(...curr.map((s: {kg: number | null}) => s.kg || 0)) : 0
      const prevMax = prev.length > 0 ? Math.max(...prev.map((s: {kg: number | null}) => s.kg || 0)) : 0

      const currVolume = curr.reduce((acc: number, s: {kg: number | null, reps: number | null}) => acc + (s.kg || 0) * (s.reps || 0), 0)
      const prevVolume = prev.reduce((acc: number, s: {kg: number | null, reps: number | null}) => acc + (s.kg || 0) * (s.reps || 0), 0)

      const weightChange = prevMax > 0 ? ((currMax - prevMax) / prevMax) * 100 : 0
      const volumeChange = prevVolume > 0 ? ((currVolume - prevVolume) / prevVolume) * 100 : 0

      if (currMax > 0 || prevMax > 0) {
        exerciseMap.set(name, {
          exercise_name: name,
          current_max_weight: currMax,
          previous_max_weight: prevMax,
          percentage_change: Math.round(weightChange * 10) / 10,
          total_volume_current: Math.round(currVolume),
          total_volume_previous: Math.round(prevVolume),
          volume_change: Math.round(volumeChange * 10) / 10,
        })
      }
    }

    setProgress(Array.from(exerciseMap.values()).sort((a, b) => b.percentage_change - a.percentage_change))
    setLoading(false)
  }

  async function loadBodyWeights() {
    const { data } = await supabase.from('body_weight_logs').select('*').order('date', {ascending: false}).limit(30)
    setBodyWeights(data || [])
  }

  async function logWeight() {
    const w = parseFloat(newWeight)
    if (isNaN(w) || w <= 0) return
    const today = new Date().toISOString().split('T')[0]
    await supabase.from('body_weight_logs').upsert({date: today, weight: w}, {onConflict: 'date'})
    setNewWeight('')
    loadBodyWeights()
  }

  return (
    <div className="px-4 pt-8 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background: '#1e2235'}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f1f5f9" strokeWidth="2.5" strokeLinecap="round"><polyline points="15,18 9,12 15,6"/></svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold font-jakarta text-white">Progressie</h1>
          <p className="text-slate-400 text-sm">Jouw vooruitgang in kaart</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 p-1 rounded-2xl" style={{background: '#12141f'}}>
        {(['oefeningen', 'gewicht'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className="flex-1 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all"
            style={{
              background: activeTab === tab ? '#f97316' : 'transparent',
              color: activeTab === tab ? 'white' : '#64748b',
            }}
          >
            {tab === 'oefeningen' ? 'Oefeningen' : 'Lichaamsgewicht'}
          </button>
        ))}
      </div>

      {activeTab === 'oefeningen' && (
        <>
          {/* Period selector */}
          <div className="flex gap-2 mb-5">
            {(['week', 'maand', 'jaar'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="px-4 py-2 rounded-xl text-sm font-semibold capitalize"
                style={{background: period === p ? '#1e2235' : 'transparent', color: period === p ? '#f97316' : '#64748b', border: period === p ? '1px solid #f97316' : '1px solid transparent'}}
              >
                {p === 'week' ? 'Week' : p === 'maand' ? 'Maand' : 'Jaar'}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-500">Laden...</div>
          ) : progress.length === 0 ? (
            <div className="rounded-2xl p-8 text-center" style={{background: '#12141f', border: '1px solid #1e2235'}}>
              <div className="text-4xl mb-3">📊</div>
              <p className="text-slate-400 text-sm">Nog niet genoeg data. Train meer en kom terug!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {progress.map((ex, i) => (
                <div key={i} className="rounded-2xl p-4" style={{background: '#12141f', border: '1px solid #1e2235'}}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="font-semibold text-white">{ex.exercise_name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">Max gewicht</div>
                    </div>
                    <div className={`text-lg font-bold font-jakarta ${ex.percentage_change > 0 ? 'text-green-400' : ex.percentage_change < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                      {ex.percentage_change > 0 ? '+' : ''}{ex.percentage_change}%
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="flex-1 rounded-xl p-3" style={{background: '#0a0b14'}}>
                      <div className="text-xs text-slate-500 mb-1">Vorig</div>
                      <div className="font-bold text-slate-400">{ex.previous_max_weight || '–'} <span className="text-xs font-normal">kg</span></div>
                    </div>
                    <div className="flex items-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#374151" strokeWidth="2"><polyline points="9,18 15,12 9,6"/></svg>
                    </div>
                    <div className="flex-1 rounded-xl p-3" style={{background: '#0a0b14', border: ex.percentage_change > 0 ? '1px solid rgba(34,197,94,0.2)' : 'none'}}>
                      <div className="text-xs text-slate-500 mb-1">Nu</div>
                      <div className={`font-bold ${ex.percentage_change > 0 ? 'text-green-400' : 'text-white'}`}>{ex.current_max_weight || '–'} <span className="text-xs font-normal">kg</span></div>
                    </div>
                  </div>

                  {/* Volume bar */}
                  <div className="mt-3">
                    <div className="flex justify-between text-xs text-slate-600 mb-1">
                      <span>Volume</span>
                      <span>{ex.volume_change > 0 ? '+' : ''}{ex.volume_change}%</span>
                    </div>
                    <div className="h-1.5 rounded-full overflow-hidden" style={{background: '#1e2235'}}>
                      <div className="h-full rounded-full" style={{
                        width: `${Math.min(100, Math.max(0, 50 + ex.volume_change / 2))}%`,
                        background: ex.volume_change >= 0 ? '#22c55e' : '#ef4444'
                      }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {activeTab === 'gewicht' && (
        <div>
          {/* Log weight */}
          <div className="rounded-2xl p-5 mb-4" style={{background: '#12141f', border: '1px solid #1e2235'}}>
            <h3 className="font-semibold font-jakarta text-white mb-3">Gewicht loggen</h3>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <input
                  type="number"
                  value={newWeight}
                  onChange={e => setNewWeight(e.target.value)}
                  placeholder="75.5"
                  step="0.1"
                  min="30"
                  max="300"
                  onKeyDown={e => e.key === 'Enter' && logWeight()}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">kg</span>
              </div>
              <button onClick={logWeight} className="px-5 py-3 rounded-xl font-semibold text-white whitespace-nowrap" style={{background: 'linear-gradient(135deg, #f97316, #ea580c)'}}>
                Log
              </button>
            </div>
          </div>

          {/* Weight history */}
          <div className="space-y-2">
            {bodyWeights.length === 0 ? (
              <div className="rounded-2xl p-8 text-center" style={{background: '#12141f', border: '1px solid #1e2235'}}>
                <div className="text-4xl mb-3">⚖️</div>
                <p className="text-slate-400 text-sm">Nog geen gewicht gelogd.</p>
              </div>
            ) : bodyWeights.map((bw, i) => {
              const prev = bodyWeights[i + 1]
              const diff = prev ? bw.weight - prev.weight : null
              return (
                <div key={i} className="rounded-xl px-4 py-3 flex items-center justify-between" style={{background: '#12141f', border: '1px solid #1e2235'}}>
                  <div>
                    <div className="font-semibold text-white">{bw.weight} kg</div>
                    <div className="text-xs text-slate-500">{new Date(bw.date + 'T12:00:00').toLocaleDateString('nl-NL', {weekday: 'short', day: 'numeric', month: 'short'})}</div>
                  </div>
                  {diff !== null && (
                    <div className={`text-sm font-semibold ${diff > 0 ? 'text-red-400' : diff < 0 ? 'text-green-400' : 'text-slate-500'}`}>
                      {diff > 0 ? '+' : ''}{diff.toFixed(1)} kg
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
