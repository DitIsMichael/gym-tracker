'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import type { Session, Exercise } from '@/lib/types'

// Placeholder gradient per oefening (gebaseerd op spiergroep)
function getExerciseGradient(name: string): string {
  const lower = name.toLowerCase()
  if (lower.includes('press') || lower.includes('chest')) return 'linear-gradient(135deg, #1e3a5f 0%, #2d6a9f 100%)'
  if (lower.includes('row') || lower.includes('pull') || lower.includes('latt')) return 'linear-gradient(135deg, #1a3a2a 0%, #2d6b4a 100%)'
  if (lower.includes('curl') || lower.includes('bicep')) return 'linear-gradient(135deg, #3a1a3a 0%, #7b3fa0 100%)'
  if (lower.includes('tricep') || lower.includes('dip')) return 'linear-gradient(135deg, #3a2a1a 0%, #9b6230 100%)'
  if (lower.includes('shoulder') || lower.includes('lateral')) return 'linear-gradient(135deg, #1a2a3a 0%, #2d4a7a 100%)'
  if (lower.includes('leg') || lower.includes('squat') || lower.includes('lunge')) return 'linear-gradient(135deg, #2a1a1a 0%, #7a2d2d 100%)'
  if (lower.includes('kuit') || lower.includes('calf')) return 'linear-gradient(135deg, #1a2a1a 0%, #3d5a3d 100%)'
  return 'linear-gradient(135deg, #1e2235 0%, #2d3450 100%)'
}

function ExerciseIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 6.5h11M6.5 17.5h11M3 12h18M6 9.5V6a.5.5 0 0 0-.5-.5H4a.5.5 0 0 0-.5.5v12a.5.5 0 0 0 .5.5h1.5a.5.5 0 0 0 .5-.5v-3.5M18 9.5V6a.5.5 0 0 1 .5-.5H20a.5.5 0 0 1 .5.5v12a.5.5 0 0 1-.5.5h-1.5a.5.5 0 0 1-.5-.5v-3.5"/>
    </svg>
  )
}

export default function SessieDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [session, setSession] = useState<Session | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ name: '', default_sets: '3', default_reps: '10', default_kg: '0', muscle_groups: '' })
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    const { data: sess } = await supabase.from('sessions').select('*').eq('id', params.id).single()
    setSession(sess)
    const { data: exs } = await supabase.from('exercises').select('*').eq('session_id', params.id).order('order_index')
    setExercises(exs || [])
    setLoading(false)
  }

  async function saveExercise() {
    if (!form.name.trim()) return
    const sets = parseFloat(form.default_sets) || 3
    const reps = parseFloat(form.default_reps) || 10
    const kg = parseFloat(form.default_kg) || 0
    if (editingId) {
      await supabase.from('exercises').update({
        name: form.name.trim(),
        default_sets: sets,
        default_reps: reps,
        default_kg: kg,
        muscle_groups: form.muscle_groups.trim() || null,
      }).eq('id', editingId)
    } else {
      await supabase.from('exercises').insert({
        session_id: params.id,
        name: form.name.trim(),
        default_sets: sets,
        default_reps: reps,
        default_kg: kg,
        order_index: exercises.length,
        muscle_groups: form.muscle_groups.trim() || null,
      })
    }
    setForm({ name: '', default_sets: '3', default_reps: '10', default_kg: '0', muscle_groups: '' })
    setShowAdd(false)
    setEditingId(null)
    loadData()
  }

  async function deleteExercise(id: string) {
    await supabase.from('exercises').delete().eq('id', id)
    loadData()
  }

  function startEdit(ex: Exercise) {
    setForm({
      name: ex.name,
      default_sets: String(ex.default_sets),
      default_reps: String(ex.default_reps),
      default_kg: String(ex.default_kg),
      muscle_groups: ex.muscle_groups || '',
    })
    setEditingId(ex.id)
    setShowAdd(true)
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0b14' }}>
      {/* Header */}
      <div className="px-4 pt-10 pb-4 flex items-center gap-3" style={{ borderBottom: '1px solid #1e2235' }}>
        <button onClick={() => router.back()} className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#1e2235' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f1f5f9" strokeWidth="2.5" strokeLinecap="round"><polyline points="15,18 9,12 15,6" /></svg>
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {session && <div className="w-3 h-3 rounded-full" style={{ background: session.color }} />}
            <h1 className="text-xl font-bold text-white">{session?.name || 'Sessie'}</h1>
          </div>
          <p className="text-slate-500 text-xs">{exercises.length} oefening{exercises.length !== 1 ? 'en' : ''}</p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setEditingId(null); setForm({ name: '', default_sets: '3', default_reps: '10', default_kg: '0', muscle_groups: '' }) }}
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
        </button>
      </div>

      <div className="px-4 pt-5 pb-32 max-w-md mx-auto">
        {/* Add/Edit form */}
        {showAdd && (
          <div className="rounded-2xl p-5 mb-5" style={{ background: '#12141f', border: '1px solid #f97316' }}>
            <h3 className="font-semibold text-white mb-4">{editingId ? 'Oefening bewerken' : 'Oefening toevoegen'}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Naam</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Bijv. Bench Press" autoFocus />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Spiergroepen</label>
                <input value={form.muscle_groups} onChange={e => setForm(f => ({ ...f, muscle_groups: e.target.value }))} placeholder="Bijv. Borst & Triceps" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Sets</label>
                  <input type="number" value={form.default_sets} onChange={e => setForm(f => ({ ...f, default_sets: e.target.value }))} min="1" max="10" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Reps</label>
                  <input type="number" value={form.default_reps} onChange={e => setForm(f => ({ ...f, default_reps: e.target.value }))} min="1" max="100" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Kg</label>
                  <input type="number" value={form.default_kg} onChange={e => setForm(f => ({ ...f, default_kg: e.target.value }))} min="0" step="0.5" />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button onClick={() => { setShowAdd(false); setEditingId(null) }} className="flex-1 py-3 rounded-xl text-sm font-semibold text-slate-400" style={{ background: '#1e2235' }}>
                Annuleren
              </button>
              <button onClick={saveExercise} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)' }}>
                Opslaan
              </button>
            </div>
          </div>
        )}

        {/* Exercise cards */}
        {loading ? (
          <div className="text-center py-16 text-slate-500">Laden...</div>
        ) : exercises.length === 0 ? (
          <div className="rounded-2xl p-10 text-center" style={{ background: '#12141f', border: '1px solid #1e2235' }}>
            <div className="text-4xl mb-3">🏋️</div>
            <p className="text-slate-400 text-sm">Nog geen oefeningen. Voeg je eerste oefening toe!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {exercises.map(ex => (
              <div key={ex.id} className="rounded-2xl overflow-hidden" style={{ border: '1px solid #1e2235' }}>
                {/* Image / placeholder */}
                <div
                  className="relative flex items-center justify-center"
                  style={{
                    height: 140,
                    background: getExerciseGradient(ex.name),
                  }}
                >
                  <ExerciseIcon />
                  {/* Action buttons overlay */}
                  <div className="absolute top-3 right-3 flex gap-2">
                    <button
                      onClick={() => startEdit(ex)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#f1f5f9" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                    </button>
                    <button
                      onClick={() => deleteExercise(ex.id)}
                      className="w-8 h-8 rounded-xl flex items-center justify-center"
                      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><polyline points="3,6 5,6 21,6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" /></svg>
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="px-4 py-3" style={{ background: '#12141f' }}>
                  <div className="font-bold text-white text-base">{ex.name}</div>
                  {ex.muscle_groups && (
                    <div className="text-slate-400 text-sm mt-0.5">{ex.muscle_groups}</div>
                  )}
                  <div className="flex gap-2 mt-3">
                    <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full" style={{ background: '#1e2235', color: '#f97316' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><polyline points="12,6 12,12 16,14" /></svg>
                      {ex.default_sets} sets
                    </span>
                    <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full" style={{ background: '#1e2235', color: '#64748b' }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                      {ex.default_reps} reps
                    </span>
                    {ex.default_kg > 0 && (
                      <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full" style={{ background: '#1e2235', color: '#64748b' }}>
                        {ex.default_kg} kg
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
