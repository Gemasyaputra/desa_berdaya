import React from 'react'
import type { Metadata } from 'next'
import { Source_Sans_3 } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { Toaster } from 'sonner'
import './globals.css'
import { AppSessionProvider } from '@/components/session-provider'
import { getAllAppSettings } from '@/lib/settings'

const sourceSansPro = Source_Sans_3({
  subsets: ['latin'],
  display: 'swap',
})

export async function generateMetadata(): Promise<Metadata> {
  try {
    const s = await getAllAppSettings()
    const title = (s.app_title ?? '').trim() || 'SIDB - Dashboard'
    const faviconUrl = (s.app_favicon_url ?? '').trim() || '/favicon.png'
    return {
      title,
      description: 'Sistem Monitoring Desa Berdaya',
      generator: 'v0.app',
      icons: {
        icon: [{ url: faviconUrl, sizes: 'any' }],
        shortcut: faviconUrl,
        apple: faviconUrl,
      },
    }
  } catch {
    return {
      title: 'SIDB - Dashboard',
      description: 'Sistem Monitoring Desa Berdaya',
      icons: {
        icon: [{ url: '/favicon.png', sizes: 'any' }],
        shortcut: '/favicon.png',
        apple: '/favicon.png',
      },
    }
  }
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${sourceSansPro.className} font-sans antialiased`} suppressHydrationWarning>
        <AppSessionProvider>
          {children}
          <Toaster position="top-right" />
          <Analytics />
        </AppSessionProvider>
      </body>
    </html>
  )
}
