'use client'

import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin, Building2, Map as MapIcon, Navigation, Shield } from 'lucide-react'
import type { VillageMapPoint, DistributionStats } from './actions'

const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

export function SuperAdminMap({ 
  points, 
  stats 
}: { 
  points: VillageMapPoint[], 
  stats: DistributionStats | null 
}) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return <div className="h-[500px] w-full bg-[#f8fafc] animate-pulse rounded-2xl border border-slate-100"></div>

  // Center of Indonesia (approximated)
  const defaultCenter: [number, number] = [-2.5489, 118.0149]
  const defaultZoom = 5

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Map Display */}
      <Card className="lg:col-span-8 border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden rounded-2xl h-[500px] bg-white ring-1 ring-slate-100">
        <MapContainer 
          center={points.length > 0 ? [points[0].latitude, points[0].longitude] : defaultCenter} 
          zoom={points.length > 0 ? 6 : defaultZoom} 
          scrollWheelZoom={true} 
          style={{ height: '100%', width: '100%', zIndex: 0 }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {points.map((p) => (
            <Marker key={p.id} position={[p.latitude, p.longitude]} icon={customIcon}>
              <Popup className="minimalist-popup">
                <div className="p-3 min-w-[180px]">
                  <p className="font-bold text-slate-900 text-sm mb-1">{p.nama_desa}</p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-[#7a1200]" /> {p.nama_kota}
                  </p>
                  <p className="text-[11px] text-slate-400 mt-0.5 ml-5">{p.nama_provinsi}</p>
                  
                  <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                    <span className="flex items-center gap-1"><Navigation className="w-3 h-3" /> {p.latitude.toFixed(4)}</span>
                    <span>{p.longitude.toFixed(4)}</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
        
        {/* Floating Badge - Minimalist */}
        <div className="absolute top-6 left-6 z-[10] bg-white shadow-[0_4px_15px_rgba(0,0,0,0.08)] px-4 py-2 rounded-xl border border-slate-50 flex items-center gap-2.5">
          <div className="w-2 h-2 rounded-full bg-[#7a1200]" />
          <span className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Village Presence</span>
        </div>
      </Card>

      {/* Distribution Stats - Minimalist */}
      <div className="lg:col-span-4 flex flex-col gap-6">
        <Card className="flex-1 border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] bg-white rounded-2xl relative overflow-hidden ring-1 ring-slate-100">
          <CardContent className="p-8 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-4 mb-10">
                <div className="p-3 bg-red-50 rounded-xl">
                  <MapIcon className="w-6 h-6 text-[#7a1200]" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 tracking-tight">Cakupan Wilayah</h3>
                  <p className="text-xs text-slate-400 font-medium">Statistik Sebaran Nasional</p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-4">
                {[
                  { label: 'Provinsi', value: stats?.totalProvinsi ?? 0, icon: Building2, color: 'text-slate-600', bg: 'bg-slate-50' },
                  { label: 'Kota/Kabupaten', value: stats?.totalKota ?? 0, icon: MapPin, color: 'text-slate-600', bg: 'bg-slate-50' },
                  { label: 'Kecamatan', value: stats?.totalKecamatan ?? 0, icon: Navigation, color: 'text-slate-600', bg: 'bg-slate-50' },
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-slate-50 bg-white hover:border-slate-200 transition-all group">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-lg ${item.bg} flex items-center justify-center transition-colors`}>
                        <item.icon className={`w-5 h-5 ${item.color}`} />
                      </div>
                      <span className="text-sm font-semibold text-slate-500">{item.label}</span>
                    </div>
                    <span className="text-lg font-bold text-slate-900">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-slate-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-400 uppercase tracking-[0.2em] font-black mb-1">Total Impact</p>
                  <p className="text-sm font-bold text-slate-700">Desa Aktif Binaan</p>
                </div>
                <div className="text-right">
                  <span className="text-4xl font-black tracking-tighter text-[#7a1200]">
                    {stats?.totalDesa ?? 0}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Card - Minimalist */}
        <Card className="border-0 shadow-[0_4px_20px_rgb(0,0,0,0.03)] bg-white rounded-2xl p-6 ring-1 ring-slate-100">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider mb-1">Monitoring Focus</p>
              <p className="text-xs font-semibold text-slate-600 leading-relaxed italic">
                Data real-time koordinat program pemberdayaan ekonomi masyarakat desa.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
