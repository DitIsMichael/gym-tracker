'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import type { Session } from '@/lib/types'

const SESSION_IMAGES: Record<string, string> = {
  'Upper Body': '/session-upper-body.webp',
  'Leg Day': '/session-leg-day.webp',
  'Tennis': '/session-tennis.webp',
  'Full Body': '/session-full-body.webp',
}

function getSessionGradient(color: string): string {
  return `linear-gradient(135deg, ${color}22 0%, ${color}55 100%)`
}

export default function SessiesPage() {
  const supabase = createClient()
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [exerciseCounts, setExerciseCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadSessions() }, [])

  async function loadSessions() {
    const { data } = await supabase.from('sessions').select('*').order('created_at')
    const sessionList = data || []
    setSessions(sessionList)

    // Fetch exercise counts per session
    if (sessionList.length > 0) {
      const { data: exercises } = await supabase
        .from('exercises')
        .select('session_id')
      if (exercises) {
        const counts: Record<string, number> = {}
        for (const ex of exercises) {
          counts[ex.session_id] = (counts[ex.session_id] || 0) + 1
        }
        setExerciseCounts(counts)
      }
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen" style={{ background: '#0a0b14' }}>
      {/* Header */}
      <div className="px-4 pt-10 pb-4 flex items-center gap-3" style={{ borderBottom: '1px solid #1e2235' }}>
        <button onClick={() => router.back()} className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: '#1e2235' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f1f5f9" strokeWidth="2.5" strokeLinecap="round"><polyline points="15,18 9,12 15,6" /></svg>
        </button>
        <div>
          <h1 className="text-xl font-bold text-white">Sessies</h1>
          <p className="text-slate-500 text-xs">Bewerk je trainingen en oefeningen</p>
        </div>
      </div>

      <div className="px-4 pt-5 pb-32 max-w-md mx-auto space-y-4">
        {loading ? (
          <div className="text-center py-16 text-slate-500">Laden...</div>
        ) : sessions.map(session => {
          const img = SESSION_IMAGES[session.name]
          const count = exerciseCounts[session.id] || 0
          return (
            <Link
              key={session.id}
              href={`/sessies/${session.id}`}
              className="block rounded-2xl overflow-hidden"
              style={{ border: '1px solid #1e2235' }}
            >
              {/* Image / placeholder */}
              <div className="relative flex items-end" style={{ height: 160 }}>
                {img ? (
                  <Image src={img} alt={session.name} fill className="object-cover" />
                ) : (
                  <div className="absolute inset-0" style={{ background: getSessionGradient(session.color) }} />
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.75) 40%, rgba(0,0,0,0.05) 100%)' }} />
                {/* Session name */}
                <div className="relative z-10 p-4 w-full">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: session.color }} />
                    <p className="font-bold text-white text-lg leading-tight">{session.name}</p>
                  </div>
                  {count > 0 && (
                    <p className="text-slate-300 text-sm">{count} oefening{count !== 1 ? 'en' : ''}</p>
                  )}
                </div>
              </div>

              {/* Bottom info bar */}
              <div className="px-4 py-3 flex items-center gap-2" style={{ background: '#12141f' }}>
                <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full" style={{ background: '#1e2235', color: session.color }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                  {count} oefeningen
                </span>
                <span className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full" style={{ background: '#1e2235', color: '#64748b' }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                  Bewerken
                </span>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
