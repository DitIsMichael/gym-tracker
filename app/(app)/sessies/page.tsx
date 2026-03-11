'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import type { Session } from '@/lib/types'

const SESSION_COLORS = ['#f97316', '#3b82f6', '#22c55e', '#a855f7', '#ec4899', '#14b8a6']

export default function SessiesPage() {
  const supabase = createClient()
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [newName, setNewName] = useState('')
  const [newColor, setNewColor] = useState('#f97316')
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadSessions() }, [])

  async function loadSessions() {
    const { data } = await supabase.from('sessions').select('*').order('created_at')
    setSessions(data || [])
    setLoading(false)
  }

  async function addSession() {
    if (!newName.trim()) return
    const { error } = await supabase.from('sessions').insert({name: newName.trim(), color: newColor})
    if (!error) {
      setNewName('')
      setShowAdd(false)
      loadSessions()
    }
  }

  async function deleteSession(id: string) {
    if (!confirm('Sessie verwijderen? Alle bijbehorende oefeningen worden ook verwijderd.')) return
    await supabase.from('sessions').delete().eq('id', id)
    loadSessions()
  }

  return (
    <div className="px-4 pt-8 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button onClick={() => router.back()} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background: '#1e2235'}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f1f5f9" strokeWidth="2.5" strokeLinecap="round"><polyline points="15,18 9,12 15,6"/></svg>
          </button>
          <div>
            <h1 className="text-2xl font-bold font-syne text-white">Sessies</h1>
            <p className="text-slate-400 text-sm">Beheer je trainingstypen</p>
          </div>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{background: 'linear-gradient(135deg, #f97316, #ea580c)'}}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
        </button>
      </div>

      {/* Add session form */}
      {showAdd && (
        <div className="rounded-2xl p-5 mb-4" style={{background: '#12141f', border: '1px solid #1e2235'}}>
          <h3 className="font-semibold font-syne text-white mb-4">Nieuwe sessie</h3>
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Bijv. Upper body, Leg day..."
            className="mb-4"
            onKeyDown={e => e.key === 'Enter' && addSession()}
            autoFocus
          />
          <div className="flex gap-2 mb-4">
            {SESSION_COLORS.map(c => (
              <button
                key={c}
                onClick={() => setNewColor(c)}
                className="w-8 h-8 rounded-full transition-transform"
                style={{
                  background: c,
                  transform: newColor === c ? 'scale(1.2)' : 'scale(1)',
                  outline: newColor === c ? `2px solid white` : 'none',
                  outlineOffset: '2px',
                }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowAdd(false)} className="flex-1 py-3 rounded-xl text-sm font-semibold text-slate-400" style={{background: '#1e2235'}}>
              Annuleren
            </button>
            <button onClick={addSession} className="flex-1 py-3 rounded-xl text-sm font-semibold text-white" style={{background: 'linear-gradient(135deg, #f97316, #ea580c)'}}>
              Toevoegen
            </button>
          </div>
        </div>
      )}

      {/* Sessions list */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-slate-500">Laden...</div>
        ) : sessions.length === 0 ? (
          <div className="rounded-2xl p-8 text-center" style={{background: '#12141f', border: '1px solid #1e2235'}}>
            <div className="text-4xl mb-3">🏋️</div>
            <p className="text-slate-400 text-sm">Nog geen sessies. Maak je eerste sessie aan!</p>
          </div>
        ) : sessions.map(session => (
          <div key={session.id} className="rounded-2xl p-4 flex items-center justify-between" style={{background: '#12141f', border: '1px solid #1e2235'}}>
            <Link href={`/sessies/${session.id}`} className="flex items-center gap-3 flex-1">
              <div className="w-4 h-4 rounded-full flex-shrink-0" style={{background: session.color}} />
              <span className="font-semibold text-white">{session.name}</span>
            </Link>
            <div className="flex items-center gap-2">
              <Link href={`/sessies/${session.id}`} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background: '#1e2235'}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </Link>
              <button onClick={() => deleteSession(session.id)} className="w-9 h-9 rounded-xl flex items-center justify-center" style={{background: '#1e2235'}}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
