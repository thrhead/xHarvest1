import type { ReactNode } from 'react'
import '../../lib/web-polyfill'
import './globals.css'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Ekim Hasat - Çiftçi & Tarla Yönetim Portalı',
  description: 'Tarlalarınızın poligon sınırlarını çizin, ekim-hasat takvimini takip edin ve tarımsal rehberlere erişin.',
}

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <html lang="tr">
      <body className="bg-slate-50 text-slate-900 antialiased font-sans">
        {children}
      </body>
    </html>
  )
}

