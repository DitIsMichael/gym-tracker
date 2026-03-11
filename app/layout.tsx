import type { Metadata } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'

const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
})

export const metadata: Metadata = {
  title: 'GymTrack',
  description: 'Jouw persoonlijke sportschool tracker',
  viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className={jakarta.variable}>
      <body suppressHydrationWarning={true} style={{fontFamily: 'var(--font-jakarta), sans-serif'}}>{children}</body>
    </html>
  )
}
