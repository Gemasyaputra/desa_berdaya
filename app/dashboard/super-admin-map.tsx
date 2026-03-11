'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import { Card, CardContent } from '@/components/ui/card'
import { MapPin, Building2, Map as MapIcon, Navigation, Shield } from 'lucide-react'
import type { VillageMapPoint, DistributionStats } from './actions'

const customPinIcon = L.divIcon({
  html: `
    <div class="custom-pin-wrapper">
      <div class="custom-pin-head">
        <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      </div>
      <div class="custom-pin-point"></div>
    </div>
  `,
  className: 'empty-leaflet-icon',
  iconSize: [28, 38],
  iconAnchor: [14, 38],
  popupAnchor: [0, -32],
})

export function SuperAdminMap({ 
  points, 
  stats 
}: { 
  points: VillageMapPoint[], 
  stats: DistributionStats | null 
}) {
  const [isMounted, setIsMounted] = useState(false)
  const [geoJsonData, setGeoJsonData] = useState<any>(null)

  useEffect(() => {
    setIsMounted(true)
    fetch('/indonesia-provinces.json')
      .then(res => res.json())
      .then(data => setGeoJsonData(data))
      .catch(err => console.error("Failed to fetch geojson: ", err))
  }, [])

  // Calculate province density
  const provinceCounts = useMemo(() => {
    const counts: Record<string, number> = {}
    points.forEach(p => {
      const prov = p.nama_provinsi?.toUpperCase()
      if (prov) {
        counts[prov] = (counts[prov] || 0) + 1
      }
    })
    return counts
  }, [points])

  const maxDensity = Math.max(0, ...Object.values(provinceCounts))

  const matchProvinceName = (dbProv: string, geoProv: string) => {
    const db = dbProv.toUpperCase()
    const geo = geoProv.toUpperCase()

    if (db === geo) return true
    if (geo.includes('JAKARTA') && db.includes('JAKARTA')) return true
    if (geo.includes('YOGYAKARTA') && db.includes('YOGYAKARTA')) return true
    if (geo.includes('BANTEN') && db.includes('BANTEN')) return true
    if (geo.includes('BANGKA BELITUNG') && db.includes('BANGKA BELITUNG')) return true
    if (geo.includes('GORONTALO') && db.includes('GORONTALO')) return true
    if (geo.replace(/ /g, '') === db.replace(/ /g, '')) return true

    // Overlap matching
    const geoWords = geo.split(' ')
    const dbWords = db.split(' ')
    const matchScore = geoWords.filter(w => dbWords.includes(w)).length
    if (matchScore >= 2 && geoWords[0] === dbWords[0]) return true
    if (matchScore === 1 && geoWords.length === 1 && dbWords.length === 1) return true

    // specific cases for Papua
    if (geo.includes('IRIAN JAYA') && db.includes('PAPUA')) {
      if (geo.includes('TIMUR') && (db.includes('SELATAN') || db.includes('PEGUNUNGAN') || db === 'PAPUA')) return true
      if (geo.includes('TENGAH') && db.includes('TENGAH')) return true
      if (geo.includes('BARAT') && db.includes('BARAT')) return true
    }
    return false
  }

  const getProvinceMapCount = (feature: any) => {
    const geoProv = feature.properties?.Propinsi || ''
    let count = 0
    for (const [dbProv, c] of Object.entries(provinceCounts)) {
      if (matchProvinceName(dbProv, geoProv)) {
        count += c
      }
    }
    return count
  }

  const interpolateColor = (color1: string, color2: string, factor: number) => {
    const hex = (c: string) => parseInt(c.slice(1), 16)
    const c1 = hex(color1)
    const c2 = hex(color2)
    
    const r1 = (c1 >> 16) & 255, g1 = (c1 >> 8) & 255, b1 = c1 & 255
    const r2 = (c2 >> 16) & 255, g2 = (c2 >> 8) & 255, b2 = c2 & 255
    
    const r = Math.round(r1 + factor * (r2 - r1))
    const g = Math.round(g1 + factor * (g2 - g1))
    const b = Math.round(b1 + factor * (b2 - b1))
    
    return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
  }

  const geoJsonStyle = (feature: any) => {
    const count = getProvinceMapCount(feature)
    const factor = maxDensity > 0 ? Math.min(count / maxDensity, 1) : 0
    
    // Gradien dari abu-abu (#EAEAEA) ke merah marun (#7A1D1D)
    const fillColor = interpolateColor('#EAEAEA', '#7A1D1D', factor)
    
    return {
      fillColor: fillColor,
      weight: 1, // thin border
      opacity: 1,
      color: '#cbd5e1', // light gray border
      fillOpacity: count > 0 ? 0.8 : 0.6,
    }
  }

  // Custom Icon for Clustering
  const createClusterCustomIcon = function (cluster: any) {
    return L.divIcon({
      html: `<span>${cluster.getChildCount()}</span>`,
      className: 'custom-cluster-icon',
      iconSize: L.point(40, 40, true),
    })
  }

  if (!isMounted) return <div className="h-[500px] w-full bg-[#f8fafc] animate-pulse rounded-2xl border border-slate-100"></div>

  // Center of Indonesia to show Sumatra to Papua
  const defaultCenter: [number, number] = [-2.5489, 118.0149]
  const defaultZoom = 5

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Map Display */}
      <Card className="lg:col-span-8 border-0 shadow-[0_8px_30px_rgb(0,0,0,0.04)] overflow-hidden rounded-2xl h-[500px] bg-white ring-1 ring-slate-100">
        <MapContainer 
          center={defaultCenter} 
          zoom={defaultZoom} 
          scrollWheelZoom={true} 
          style={{ height: '100%', width: '100%', zIndex: 0 }}
          zoomControl={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          />

          {geoJsonData && (
            <GeoJSON 
              data={geoJsonData} 
              style={geoJsonStyle}
            />
          )}
          
          <MarkerClusterGroup
            chunkedLoading
            iconCreateFunction={createClusterCustomIcon}
            maxClusterRadius={50}
          >
            {points.map((p) => (
              <Marker key={p.id} position={[p.latitude, p.longitude]} icon={customPinIcon}>
                <Popup className="modern-popup" closeButton={false}>
                  <div className="p-4 min-w-[240px] rounded-xl bg-white">
                    <div className="mb-3">
                      <p className="font-black text-slate-800 text-base leading-tight">{p.nama_desa}</p>
                      <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-[#7a1200]" /> {p.nama_kota}, {p.nama_provinsi}
                      </p>
                    </div>

                    <div className="space-y-2 bg-slate-50 rounded-lg p-3 border border-slate-100 mb-3">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Relawan</p>
                        <p className="text-sm font-semibold text-slate-700">{p.nama_relawan}</p>
                      </div>
                      <div className="pt-2 border-t border-slate-200/60">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Status Binaan</p>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                          p.status === 'Aktif' 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-slate-200 text-slate-600'
                        }`}>
                          {p.status}
                        </span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                      <span className="flex items-center gap-1"><Navigation className="w-3 h-3 opacity-70" /> {p.latitude.toFixed(4)}</span>
                      <span>{p.longitude.toFixed(4)}</span>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MarkerClusterGroup>
        </MapContainer>
        
        {/* CSS For Clustering and Modern Popup */}
        <style dangerouslySetInnerHTML={{__html: `
          .custom-cluster-icon {
            background-color: #7A1D1D;
            color: white;
            border-radius: 50%;
            text-align: center;
            font-weight: 800;
            box-shadow: 0 8px 24px rgba(122, 29, 29, 0.25);
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 15px;
            border: 2px solid white;
            transition: transform 0.2s ease, box-shadow 0.2s ease;
          }
          .custom-cluster-icon:hover {
            transform: scale(1.1);
            box-shadow: 0 10px 30px rgba(122, 29, 29, 0.35);
          }
          
          .empty-leaflet-icon {
            background: transparent;
            border: none;
          }
          .custom-pin-wrapper {
            position: relative;
            display: flex;
            flex-direction: column;
            align-items: center;
            filter: drop-shadow(0 6px 10px rgba(122, 29, 29, 0.3));
            transition: transform 0.2s ease;
          }
          .custom-pin-wrapper:hover {
            transform: translateY(-4px) scale(1.05);
            filter: drop-shadow(0 8px 15px rgba(122, 29, 29, 0.4));
          }
          .custom-pin-head {
            width: 28px;
            height: 28px;
            background-color: #7A1D1D;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 2;
          }
          .custom-pin-point {
            width: 0;
            height: 0;
            border-left: 7px solid transparent;
            border-right: 7px solid transparent;
            border-top: 12px solid #7A1D1D;
            margin-top: -4px;
            z-index: 1;
          }

          .modern-popup .leaflet-popup-content-wrapper {
            padding: 0;
            border-radius: 16px;
            box-shadow: 0 10px 40px -10px rgba(0,0,0,0.15);
            border: 1px solid #f1f5f9;
            overflow: hidden;
          }
          .modern-popup .leaflet-popup-content {
            margin: 0;
            width: 100% !important;
          }
          .modern-popup .leaflet-popup-tip {
            background: #fff;
            box-shadow: -2px 2px 15px rgba(0,0,0,0.05);
          }
        `}} />
        
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
