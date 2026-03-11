'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  {
    href: '/home',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#0a0b14' : '#64748b'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
        <polyline points="9,22 9,12 15,12 15,22"/>
      </svg>
    )
  },
  {
    href: '/sessies',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#0a0b14' : '#64748b'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6.5 6.5h1M16.5 6.5h1M6.5 17.5h1M16.5 17.5h1"/>
        <rect x="2" y="9" width="4" height="6" rx="1"/>
        <rect x="18" y="9" width="4" height="6" rx="1"/>
        <rect x="6" y="11" width="12" height="2" rx="1"/>
      </svg>
    )
  },
  {
    href: '/chat',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#0a0b14' : '#64748b'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
      </svg>
    )
  },
  {
    href: '/progressie',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#0a0b14' : '#64748b'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22,12 18,12 15,21 9,3 6,12 2,12"/>
      </svg>
    )
  },
  {
    href: '/profiel',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={active ? '#0a0b14' : '#64748b'} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
        <circle cx="12" cy="7" r="4"/>
      </svg>
    )
  },
]

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div className="min-h-screen" style={{background: '#0a0b14'}}>
      <main className="pb-28">
        {children}
      </main>

      {/* Bottom Navigation — pill style */}
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-5 pt-2" style={{background: 'linear-gradient(to top, #0a0b14 60%, transparent)'}}>
        <nav className="flex items-center gap-1 px-3 py-3 rounded-full" style={{background: '#12141f', border: '1px solid #1e2235'}}>
          {navItems.map(item => {
            const active = pathname === item.href || pathname.startsWith(item.href + '/')
            return (
              <Link
                key={item.href}
                href={item.href}
                className="w-12 h-12 rounded-full flex items-center justify-center transition-all"
                style={{background: active ? '#f97316' : 'transparent'}}
              >
                {item.icon(active)}
              </Link>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
