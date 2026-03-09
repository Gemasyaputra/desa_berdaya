'use client'

import { Suspense } from 'react'
import AppSettingsPanel from './app-settings-panel'

export function KonfigurasiTabs() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-16">
        <div className="animate-spin w-6 h-6 border-4 border-[#7a1200] border-t-transparent rounded-full" />
      </div>
    }>
      <AppSettingsPanel />
    </Suspense>
  )
}
