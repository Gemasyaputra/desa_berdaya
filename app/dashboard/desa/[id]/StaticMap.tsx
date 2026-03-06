'use client'

import React, { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
})

export default function StaticMap({ lat, lng, popupText }: { lat: number, lng: number, popupText?: string }) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    setIsMounted(true)
  }, [])

  if (!isMounted) return <div className="h-full w-full bg-slate-100 animate-pulse"></div>

  return (
    <MapContainer 
      center={[lat, lng]} 
      zoom={14} 
      scrollWheelZoom={true} 
      style={{ height: '100%', width: '100%', zIndex: 0 }}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]} icon={customIcon}>
        {popupText && (
          <Popup>
            <div className="font-medium text-slate-800">{popupText}</div>
          </Popup>
        )}
      </Marker>
    </MapContainer>
  )
}
