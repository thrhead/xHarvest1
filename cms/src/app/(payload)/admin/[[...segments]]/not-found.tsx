import type { Metadata } from 'next'
import config from '@payload-config'
import { generatePageMetadata } from '@payloadcms/next/views'

export const dynamic = 'force-dynamic'

type Args = {
  params: Promise<{
    segments: string[]
  }>
  searchParams: Promise<{
    [key: string]: string | string[]
  }>
}

export const generateMetadata = async ({ params, searchParams }: Args): Promise<Metadata> => {
  try {
    if (params && searchParams) {
      return await generatePageMetadata({ config, params, searchParams })
    }
  } catch (e) {
    // fallback for prerender
  }
  return { title: '404 - Sayfa Bulunamadı' }
}

export default function NotFound() {
  return (
    <div style={{ padding: '3rem', textAlign: 'center', fontFamily: 'sans-serif' }}>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>404 - Sayfa Bulunamadı</h1>
      <p style={{ color: '#666', marginTop: '0.5rem' }}>Aradığınız admin sayfası bulunamadı.</p>
      <a href="/admin" style={{ color: '#0066cc', marginTop: '1rem', display: 'inline-block' }}>
        Admin Paneline Dön
      </a>
    </div>
  )
}
