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

export default function SessiesPage() {
  const supabase = createClient()
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { loadSessions() }, [])

  async function loadSessions() {
    const { data } = await supabase.from('sessions').select('*').order('created_at')
    setSessions(data || [])
    setLoading(false)
  }

  return (
    <div className="px-4 pt-8 max-w-md mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => router.back()} className="w-10 h-10 rounded-xl flex items-center justify-center" style={{background: '#1e2235'}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f1f5f9" strokeWidth="2.5" strokeLinecap="round"><polyline points="15,18 9,12 15,6"/></svg>
        </button>
        <div>
          <h1 className="text-2xl font-bold font-jakarta text-white">Sessies</h1>
          <p className="text-slate-400 text-sm">Bewerk je trainingen en oefeningen</p>
        </div>
      </div>

      {/* Sessions list */}
      <div className="flex flex-col gap-3">
        {loading ? (
          <div className="text-center py-12 text-slate-500">Laden...</div>
        ) : sessions.map(session => {
          const img = SESSION_IMAGES[session.name]
          return (
            <Link
              key={session.id}
              href={`/sessies/${session.id}`}
              className="relative rounded-2xl overflow-hidden block"
              style={{height: '140px'}}
            >
              {img ? (
                <Image
                  src={img}
                  alt={session.name}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="absolute inset-0" style={{background: session.color + '33'}} />
              )}
              {/* Dark gradient overlay */}
              <div className="absolute inset-0" style={{background: 'linear-gradient(to top, rgba(0,0,0,0.72) 40%, rgba(0,0,0,0.1) 100%)'}} />
              {/* Text */}
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <p className="font-bold text-white text-lg leading-tight">{session.name}</p>
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
