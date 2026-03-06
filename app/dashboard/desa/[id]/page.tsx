import React from 'react'
import { notFound } from 'next/navigation'
import { getDesaBinaanById } from '../actions'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { ArrowLeft, MapPin, Activity, User, Home, Map as MapIcon, Navigation } from 'lucide-react'
import MapWrapper from './MapWrapper'

export default async function DetailDesaBinaanPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const desa = await getDesaBinaanById(Number(resolvedParams.id))
  
  if (!desa) {
    notFound()
  }

  const isBinaanAktif = desa.status_binaan === 'Aktif'
  const hasCoordinate = desa.latitude && desa.longitude

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/desa">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full hover:bg-slate-100">
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-slate-800">Desa {desa.desa_name}</h1>
              {isBinaanAktif ? (
                <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-semibold bg-red-50 text-red-800 border border-red-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                  Aktif Dibina
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full text-xs font-semibold bg-red-50 text-red-700 border border-red-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                  Dibekukan
                </span>
              )}
            </div>
            <p className="text-slate-500 text-sm mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" /> 
              {desa.kecamatan_name}, {desa.kota_name}, {desa.provinsi_name}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column - Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
             <div className="bg-slate-50 px-5 py-4 border-b border-slate-100">
               <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                 <User className="w-4 h-4 text-[#7a1200]" /> Relawan Pendamping
               </h3>
             </div>
             <div className="p-5">
               <div className="flex items-start gap-3">
                 <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold shrink-0">
                    {desa.relawan?.nama_lengkap?.charAt(0) || 'R'}
                 </div>
                 <div>
                   <p className="font-medium text-slate-800">{desa.relawan?.nama_lengkap || 'Belum ditugaskan'}</p>
                   <p className="text-sm text-slate-500">{desa.relawan?.email || '-'}</p>
                 </div>
               </div>
             </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
             <div className="bg-slate-50 px-5 py-4 border-b border-slate-100">
               <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                 <Home className="w-4 h-4 text-[#7a1200]" /> Profil Desa
               </h3>
             </div>
             <div className="p-5 space-y-4">
               <div>
                 <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1">Mulai Dibina</span>
                 <p className="text-sm text-slate-700 font-medium flex items-center gap-2">
                   <Activity className="w-4 h-4 text-slate-400" />
                   {new Date(desa.tanggal_mulai).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                 </p>
               </div>
               
               <div className="pt-3 border-t border-slate-50">
                 <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-2">Potensi / Deskripsi</span>
                 <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">
                   {desa.potensi_desa || 'Belum ada deskripsi potensi wilayah pendaulatan desa.'}
                 </p>
               </div>
             </div>
          </div>
        </div>

        {/* Right Column - Map */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden h-full flex flex-col">
            <div className="bg-slate-50 px-5 py-4 border-b border-slate-100 flex items-center justify-between">
               <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                 <MapIcon className="w-4 h-4 text-[#7a1200]" /> Pemetaan Visual
               </h3>
               {hasCoordinate && (
                 <span className="text-xs font-mono text-slate-500 bg-white px-2 py-1 rounded border border-slate-200 flex items-center gap-1.5 shadow-sm">
                   <Navigation className="w-3 h-3 text-teal-500" />
                   {Number(desa.latitude).toFixed(4)}, {Number(desa.longitude).toFixed(4)}
                 </span>
               )}
            </div>
            <div className="p-4 flex-grow flex flex-col items-center justify-center bg-slate-50">
              {hasCoordinate ? (
                <div className="w-full h-[400px] rounded-2xl overflow-hidden shadow-inner ring-1 ring-slate-200 relative z-0">
                  <MapWrapper lat={Number(desa.latitude)} lng={Number(desa.longitude)} popupText={`Desa ${desa.desa_name}`} />
                </div>
              ) : (
                <div className="text-center py-24 px-6 border-2 border-dashed border-slate-200 rounded-2xl w-full bg-white">
                  <MapPin className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h4 className="text-slate-700 font-medium mb-1">Titik Koordinat Belum Ditetapkan</h4>
                  <p className="text-sm text-slate-500 max-w-sm mx-auto">Korwil belum memberikan pinpoint lokasi yang spesifik untuk desa ini di dalam pengaturan peta.</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
