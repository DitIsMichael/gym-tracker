'use client'

import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import { createClient } from '@/lib/supabase/client'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

const STORAGE_KEY = 'chat_messages'

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [hydrated, setHydrated] = useState(false)
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [gymContext, setGymContext] = useState<string>('')
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) setMessages(JSON.parse(saved))
    } catch { /* ignore */ }
    setHydrated(true)
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(messages))
  }, [messages, hydrated])

  useEffect(() => {
    async function loadGymContext() {
      const supabase = createClient()

      const [{ data: sessions }, { data: recentLogs }, { data: setLogs }, { data: bodyWeight }, { data: prs }] = await Promise.all([
        supabase.from('sessions').select('id, name'),
        supabase.from('workout_logs').select('id, date, completed, sessions(name)').order('date', { ascending: false }).limit(10),
        supabase.from('set_logs').select('exercise_name, kg, reps, set_number, workout_log_id').order('created_at', { ascending: false }).limit(50),
        supabase.from('body_weight_logs').select('date, weight').order('date', { ascending: false }).limit(5),
        supabase.from('personal_records').select('kg, exercises(name)'),
      ])

      const parts: string[] = []

      if (sessions?.length) {
        parts.push(`Trainingsschema's: ${sessions.map(s => s.name).join(', ')}`)
      }

      if (recentLogs?.length) {
        const logLines = recentLogs.map(l => {
          const s = l.sessions as unknown as { name: string } | null
          const sessionName = s?.name ?? 'Onbekend'
          return `- ${l.date}: ${sessionName} (${l.completed ? 'voltooid' : 'niet voltooid'})`
        })
        parts.push(`Recente trainingen:\n${logLines.join('\n')}`)
      }

      if (setLogs?.length && recentLogs?.length) {
        const logMap = new Map<string, typeof setLogs>()
        for (const s of setLogs) {
          const arr = logMap.get(s.workout_log_id) ?? []
          arr.push(s)
          logMap.set(s.workout_log_id, arr)
        }
        const lastLog = recentLogs.find(l => l.completed)
        if (lastLog) {
          const sets = logMap.get(lastLog.id) ?? []
          if (sets.length) {
            const byExercise = new Map<string, typeof sets>()
            for (const s of sets) {
              const arr = byExercise.get(s.exercise_name) ?? []
              arr.push(s)
              byExercise.set(s.exercise_name, arr)
            }
            const lines = Array.from(byExercise.entries()).map(([name, exSets]) => {
              const summary = exSets.map((s: { kg: number | null; reps: number | null }) => `${s.kg}kg×${s.reps}`).join(', ')
              return `  - ${name}: ${summary}`
            })
            const s = lastLog.sessions as unknown as { name: string } | null
            parts.push(`Laatste training (${lastLog.date} - ${s?.name ?? 'Onbekend'}):\n${lines.join('\n')}`)
          }
        }
      }

      if (prs?.length) {
        const prLines = prs.map(p => {
          const ex = p.exercises as unknown as { name: string } | null
          return `- ${ex?.name ?? 'Onbekend'}: ${p.kg}kg`
        })
        parts.push(`Persoonlijke records:\n${prLines.join('\n')}`)
      }

      if (bodyWeight?.length) {
        const bwLines = bodyWeight.map(b => `- ${b.date}: ${b.weight}kg`)
        parts.push(`Lichaamsgewicht (recent):\n${bwLines.join('\n')}`)
      }

      setGymContext(parts.join('\n\n'))
    }

    loadGymContext()
  }, [])

  async function sendMessage() {
    const text = input.trim()
    if (!text || loading) return

    const newMessages: Message[] = [...messages, { role: 'user', content: text }]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: newMessages, gymContext }),
    })
    const data = await res.json()
    setMessages([...newMessages, { role: 'assistant', content: data.reply }])
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 flex flex-col" style={{background: '#0a0b14', zIndex: 10}}>
      {/* Header */}
      <div className="px-5 pt-10 pb-4 flex-shrink-0 flex items-end justify-between" style={{borderBottom: '1px solid #1e2235'}}>
        <div>
          <h1 className="text-2xl font-bold text-white">Coach</h1>
          <p className="text-slate-500 text-sm">Jouw persoonlijke fitnesscoach</p>
        </div>
        {messages.length > 0 && (
          <button
            onClick={() => setMessages([])}
            className="text-xs text-slate-500 pb-1"
          >
            Wissen
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center pt-12">
            <div className="text-4xl mb-3">💪</div>
            <p className="text-slate-400 font-medium">Stel een vraag aan je coach</p>
            <p className="text-slate-600 text-sm mt-1">Over training, oefeningen of voeding</p>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className="max-w-xs px-4 py-3 rounded-2xl text-sm leading-relaxed"
              style={{
                background: msg.role === 'user' ? '#f97316' : '#12141f',
                color: msg.role === 'user' ? '#0a0b14' : '#f1f5f9',
                border: msg.role === 'assistant' ? '1px solid #1e2235' : 'none',
                fontWeight: msg.role === 'user' ? 600 : 400,
              }}
            >
              {msg.role === 'assistant' ? (
                <ReactMarkdown
                  components={{
                    p: ({ children }) => <p className="mb-4 last:mb-0">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-4 mb-4 space-y-2">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-4 mb-4 space-y-2">{children}</ol>,
                    li: ({ children }) => <li>{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
                    h1: ({ children }) => <h1 className="font-bold text-base mb-1">{children}</h1>,
                    h2: ({ children }) => <h2 className="font-bold mb-1">{children}</h2>,
                    h3: ({ children }) => <h3 className="font-semibold mb-1">{children}</h3>,
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              ) : (
                msg.content
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="px-4 py-3 rounded-2xl text-sm" style={{background: '#12141f', border: '1px solid #1e2235', color: '#64748b'}}>
              Even nadenken...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-4 pt-3 flex-shrink-0" style={{borderTop: '1px solid #1e2235', paddingBottom: 'calc(8rem + env(safe-area-inset-bottom))'}}>
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && sendMessage()}
            placeholder="Stel een vraag..."
            className="flex-1 rounded-2xl px-4 py-3 text-sm text-white"
            style={{background: '#12141f', border: '1px solid #2e3447', outline: 'none'}}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{background: input.trim() && !loading ? '#f97316' : '#1e2235'}}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={input.trim() && !loading ? '#0a0b14' : '#64748b'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="22" y1="2" x2="11" y2="13"/>
              <polygon points="22,2 15,22 11,13 2,9"/>
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
