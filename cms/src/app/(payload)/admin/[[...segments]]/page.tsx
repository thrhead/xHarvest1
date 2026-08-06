import type { Metadata } from 'next'
import config from '@payload-config'
import { RootPage, generatePageMetadata } from '@payloadcms/next/views'
import { importMap } from '../importMap'

export const dynamic = 'force-dynamic'
export const dynamicParams = true
export const revalidate = 0

type Args = {
  params: Promise<{
    segments: string[]
  }>
  searchParams: Promise<{
    [key: string]: string | string[]
  }>
}

export const generateMetadata = async ({ params, searchParams }: Args): Promise<Metadata> => {
  if (process.env.NEXT_PHASE === 'phase-production-build' || process.argv.some(a => a.includes('build'))) {
    return { title: 'Payload Admin' }
  }
  return generatePageMetadata({ config, params, searchParams })
}

const Page = ({ params, searchParams }: Args) =>
  RootPage({ config, importMap, params, searchParams })

export default Page
