'use client'

import React from 'react'
import dynamic from 'next/dynamic'

// Client-side wrapper for Leaflet map to prevent SSR issues
const StaticMap = dynamic(() => import('./StaticMap'), {
  ssr: false,
  loading: () => <div className="h-64 w-full bg-slate-100 animate-pulse rounded-2xl border border-slate-200 flex items-center justify-center text-slate-400">Memuat Satelit...</div>
})

export default function StaticMapWrapper({ lat, lng, popupText }: { lat: number, lng: number, popupText?: string }) {
  return <StaticMap lat={lat} lng={lng} popupText={popupText} />
}
