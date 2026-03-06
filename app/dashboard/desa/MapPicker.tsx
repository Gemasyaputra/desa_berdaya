'use client'

import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet'
import { Search, Loader2 } from 'lucide-react'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

// Fix missing marker icons in leaflet with next.js
const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

function MapEvents({ position, setPosition }: { position: [number, number] | null, setPosition: (pos: [number, number]) => void }) {
  const map = useMap()
  
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng])
    },
  })

  // Whenever position changes significantly, we could flyTo the new position,
  // but we'll handle flyTo from the search function instead to not double-trigger
  
  return position === null ? null : (
    <Marker position={position} icon={customIcon} />
  )
}

function ChangeView({ center }: { center: [number, number] | null }) {
  const map = useMap()
  if (center) {
    map.flyTo(center, 14, { duration: 1.5 })
  }
  return null
}

export default function MapPicker({
  defaultLat,
  defaultLng,
  autoSearchQuery,
  onChange
}: {
  defaultLat?: number | null
  defaultLng?: number | null
  autoSearchQuery?: string
  onChange: (lat: number, lng: number) => void
}) {
  // Default map center somewhere in Indonesia
  const initialCenter: [number, number] = defaultLat && defaultLng 
    ? [defaultLat, defaultLng] 
    : [-1.8841, 115.1186]
    
  // Default position if an entity is edited
  const initialPosition: [number, number] | null = defaultLat && defaultLng 
    ? [defaultLat, defaultLng] 
    : null

  const [position, setPosition] = useState<[number, number] | null>(initialPosition)
  const [flyToCenter, setFlyToCenter] = useState<[number, number] | null>(null)
  const [isMounted, setIsMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (autoSearchQuery && isMounted) {
      setSearchQuery(autoSearchQuery)
      triggerSearch(autoSearchQuery)
    }
  }, [autoSearchQuery, isMounted])

  const triggerSearch = async (query: string) => {
    if (!query.trim()) return

    setSearching(true)
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`)
      const data = await response.json()
      
      if (data && data.length > 0) {
        const result = data[0]
        const lat = parseFloat(result.lat)
        const lon = parseFloat(result.lon)
        
        const newPos: [number, number] = [lat, lon]
        setFlyToCenter(newPos)
        handlePositionChange(newPos)
      }
    } catch (error) {
      console.error("Auto search error:", error)
    } finally {
      setSearching(false)
    }
  }

  const handlePositionChange = (pos: [number, number]) => {
    setPosition(pos)
    onChange(pos[0], pos[1])
  }

  const handleSearch = async (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault()
    if (!searchQuery.trim()) return

    setSearching(true)
    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`)
      const data = await response.json()
      
      if (data && data.length > 0) {
        const result = data[0]
        const lat = parseFloat(result.lat)
        const lon = parseFloat(result.lon)
        
        const newPos: [number, number] = [lat, lon]
        setFlyToCenter(newPos)
        handlePositionChange(newPos)
      } else {
        alert('Lokasi tidak ditemukan. Coba kata kunci yang lebih spesifik.')
      }
    } catch (error) {
      console.error("Search error:", error)
      alert("Gagal melakukan pencarian lokasi.")
    } finally {
      setSearching(false)
    }
  }

  if (!isMounted) return <div className="h-64 w-full bg-slate-100 animate-pulse rounded-lg border border-slate-200"></div>

  return (
    <div className="space-y-3">
      <div className="relative flex items-center w-full shadow-sm">
        <input 
          type="text" 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Cari desa, jalan, atau nama tempat..." 
          className="w-full pl-4 pr-12 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 outline-none"
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              handleSearch(e)
            }
          }}
        />
        <button 
          type="button" 
          onClick={handleSearch}
          disabled={searching}
          className="absolute right-1 top-1/2 -translate-y-1/2 p-1.5 bg-red-50 text-[#7a1200] rounded-md hover:bg-red-100 disabled:opacity-50"
        >
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
        </button>
      </div>
      
      <div className="h-64 w-full rounded-lg relative overflow-hidden ring-1 ring-slate-200 z-0">
        <MapContainer 
          center={initialCenter} 
          zoom={defaultLat && defaultLng ? 13 : 5} 
          scrollWheelZoom={true} 
          style={{ height: '100%', width: '100%', zIndex: 0 }}
        >
          <ChangeView center={flyToCenter} />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapEvents position={position} setPosition={handlePositionChange} />
        </MapContainer>
      </div>
    </div>
  )
}
