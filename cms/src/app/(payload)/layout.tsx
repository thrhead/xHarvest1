import type { ReactNode } from 'react'
import type { ServerFunctionClient } from 'payload'

export const dynamic = 'force-dynamic'
import '@payloadcms/next/css'
import { RootLayout, handleServerFunctions } from '@payloadcms/next/layouts'
import config from '@payload-config'
import { importMap } from './admin/importMap'

type Props = { children: ReactNode }

const serverFunction: ServerFunctionClient = async function (args) {
  'use server'
  return handleServerFunctions({
    ...args,
    config,
    importMap,
  })
}

export default function PayloadLayout({ children }: Props) {
  return (
    <RootLayout config={config} importMap={importMap} serverFunction={serverFunction} htmlProps={{ suppressHydrationWarning: true }}>
      {children}
    </RootLayout>
  )
}
