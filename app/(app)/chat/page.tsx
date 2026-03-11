'use client'

import { useState, useRef, useEffect } from 'react'

interface Message {
  role: 'user' | 'assistant'
  content: string
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

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
      body: JSON.stringify({ messages: newMessages }),
    })
    const data = await res.json()
    setMessages([...newMessages, { role: 'assistant', content: data.reply }])
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 flex flex-col" style={{background: '#0a0b14', zIndex: 10}}>
      {/* Header */}
      <div className="px-5 pt-10 pb-4 flex-shrink-0" style={{borderBottom: '1px solid #1e2235'}}>
        <h1 className="text-2xl font-bold text-white">Coach</h1>
        <p className="text-slate-500 text-sm">Jouw persoonlijke fitnesscoach</p>
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
              {msg.content}
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
