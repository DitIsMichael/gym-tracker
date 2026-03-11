'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useParams, useRouter } from 'next/navigation'
import type { Session, Exercise } from '@/lib/types'

export default function SessieDetailPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  const [session, setSession] = useState<Session | null>(null)
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({name: '', default_sets: '3', default_reps: '10', default_kg: '0'})
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
      }).eq('id', editingId)
    } else {
      await supabase.from('exercises').insert({
        session_id: params.id,
        name: form.name.trim(),
        default_sets: sets,
        default_reps: reps,
        default_kg: kg,
        order_index: exercises.length,
      })
    }
    setForm({name: '', default_sets: '3', default_reps: '10', default_kg: '0'})
    setShowAdd(false)
    setEditingId(null)
    loadData()
  }

  async function deleteExercise(id: string) {
    await supabase.from('exercises').delete().eq('id', id)
    loadData()
  }

  function startEdit(ex: Exercise) {
    setForm({name: ex.name, default_sets: String(ex.default_sets), default_reps: String(ex.default_reps), default_kg: String(ex.default_kg)})
    setEditingId(ex.id)
    setShowAdd(true)
  }

  return (
    <div className="px-4 pt-8 max-w-md mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background: '#1e2235'}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f1f5f9" strokeWidth="2.5" strokeLinecap="round"><polyline points="15,18 9,12 15,6"/></svg>
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            {session && <div className="w-3 h-3 rounded-full" style={{background: session.color}} />}
            <h1 className="text-2xl font-bold font-syne text-white">{session?.name || 'Sessie'}</h1>
          </div>
          <p className="text-slate-400 text-sm">{exercises.length} oefening{exercises.length !== 1 ? 'en' : ''}</p>
        </div>
        <button
          onClick={() => { setShowAdd(true); setEditingId(null); setForm({name: '', default_sets: '3', default_reps: '10', default_kg: '0'}) }}
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{background: 'linear-gradient(135deg, #f97316, #ea580c)'}}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
      </div>

      {/* Add/Edit form */}
      {showAdd && (
        <div className="rounded-2xl p-5 mb-4" style={{background: '#12141f', border: '1px solid #f97316', boxShadow: '0 0 0 1px rgba(249,115,22,0.2)'}}>
          <h3 className="font-semibold font-syne text-white mb-4">{editingId ? 'Oefening bewerken' : 'Oefening toevoegen'}</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-400 mb-1 block">Naam</label>
              <input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="Bijv. Bench Press" autoFocus />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Sets</label>
                <input type="number" value={form.default_sets} onChange={e => setForm(f => ({...f, default_sets: e.target.value}))} min="1" max="10" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Reps</label>
                <input type="number" value={form.default_reps} onChange={e => setForm(f => ({...f, default_reps: e.target.value}))} min="1" max="100" />
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Kg</label>
                <input type="number" value={form.default_kg} onChange={e => setForm(f => ({...f, default_kg: e.target.value}))} min="0" step="0.5" />
              </div>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => {setShowAdd(false); setEditingId(null)}} className="flex-1 py-3 rounded-xl text-sm font-semibold text-slate-400" style={{background: '#1e2235'}}>
              Annuleren
            </button>
            <button onClick={saveExercise} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white" style={{background: 'linear-gradient(135deg, #f97316, #ea580c)'}}>
              Opslaan
            </button>
          </div>
        </div>
      )}

      {/* Exercises list */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-slate-500">Laden...</div>
        ) : exercises.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{background: '#12141f', border: '1px solid #1e2235'}}>
            <div className="text-4xl mb-3">🏃</div>
            <p className="text-slate-400 text-sm">Nog geen oefeningen. Voeg je eerste oefening toe!</p>
          </div>
        ) : exercises.map(ex => (
          <div key={ex.id} className="rounded-2xl p-4" style={{background: '#12141f', border: '1px solid #1e2235'}}>
            <div className="flex items-start justify-between">
              <div>
                <div className="font-semibold text-white">{ex.name}</div>
                <div className="flex gap-3 mt-2">
                  <span className="text-xs px-2 py-1 rounded-lg font-medium" style={{background: '#1e2235', color: '#f97316'}}>{ex.default_sets} sets</span>
                  <span className="text-xs px-2 py-1 rounded-lg font-medium" style={{background: '#1e2235', color: '#64748b'}}>{ex.default_reps} reps</span>
                  <span className="text-xs px-2 py-1 rounded-lg font-medium" style={{background: '#1e2235', color: '#64748b'}}>{ex.default_kg} kg</span>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => startEdit(ex)} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background: '#1e2235'}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button onClick={() => deleteExercise(ex.id)} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background: '#1e2235'}}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
