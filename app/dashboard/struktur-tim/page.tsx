'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  Shield, UserCheck, Building2, ChevronDown, ChevronRight,
  RefreshCw, Users, GitBranch,
} from 'lucide-react'
import {
  getTeamForMonev, getTeamForKorwil, getMonevListSimple,
  type TeamForMonev, type TeamForKorwil,
} from '../actions'
import { KorwilWilayahSheet, RelawanWilayahSheet } from '../manajemen-tim/wilayah-sheet'
import { useSession } from 'next-auth/react'

// =====================================================
// Skeleton Loaders
// =====================================================
function SkeletonRow() {
  return (
    <div className="animate-pulse flex items-center gap-3 px-4 py-3 border border-slate-200 rounded-xl">
      <div className="w-8 h-8 rounded-full bg-slate-200 flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-slate-200 rounded w-40" />
        <div className="h-2 bg-slate-100 rounded w-24" />
      </div>
    </div>
  )
}

// =====================================================
// Badge Pill
// =====================================================
function Pill({ label, value, color = 'slate' }: { label: string; value: number; color?: string }) {
  const colorMap: Record<string, string> = {
    slate: 'bg-slate-100 text-slate-600',
    red: 'bg-red-100 text-[#7a1200]',
    amber: 'bg-amber-100 text-amber-700',
  }
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${colorMap[color] ?? colorMap.slate}`}>
      {label}: <strong>{value}</strong>
    </span>
  )
}

// =====================================================
// Halaman Utama
// =====================================================
export default function StrukturTimPage() {
  const { data: session } = useSession()
  const isAdmin = (session?.user as any)?.role === 'ADMIN'

  const [loading, setLoading] = useState(true)
  const [teamMonev, setTeamMonev] = useState<TeamForMonev | null>(null)
  const [teamKorwil, setTeamKorwil] = useState<TeamForKorwil | null>(null)
  const [expandedKorwils, setExpandedKorwils] = useState<Set<number>>(new Set())
  const [monevList, setMonevList] = useState<{ id: number; nama: string }[]>([])
  const [selectedMonevId, setSelectedMonevId] = useState<number | null>(null)

  // Load daftar monev untuk Admin
  useEffect(() => {
    if (isAdmin) {
      getMonevListSimple().then((list) => {
        setMonevList(list)
        if (list.length > 0 && !selectedMonevId) {
          setSelectedMonevId(list[0].id)
        }
      })
    }
  }, [isAdmin])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [tm, tk] = await Promise.all([
        getTeamForMonev(isAdmin ? selectedMonevId : undefined),
        getTeamForKorwil(),
      ])
      setTeamMonev(tm)
      setTeamKorwil(tk)
      // Auto-expand semua korwil saat pertama load
      if (tm) {
        setExpandedKorwils(new Set(tm.korwils.map((k) => k.id)))
      }
    } finally {
      setLoading(false)
    }
  }, [selectedMonevId, isAdmin])

  useEffect(() => { fetchAll() }, [fetchAll])

  const toggleKorwil = (id: number) => {
    setExpandedKorwils((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const expandAll = () => {
    if (teamMonev) setExpandedKorwils(new Set(teamMonev.korwils.map((k) => k.id)))
  }

  const collapseAll = () => setExpandedKorwils(new Set())

  // Hitung ringkasan statistik
  const totalKorwil = teamMonev?.korwils.length ?? 0
  const totalRelawan = teamMonev?.korwils.reduce((acc, k) => acc + k.relawans.length, 0) ?? 0
  const totalDesa = teamMonev?.korwils.reduce((acc, k) => acc + k.jumlah_desa, 0) ?? 0

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 max-w-[1600px] mx-auto">
          <div className="space-y-0.5">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              Struktur Tim
              <span className="px-2.5 py-0.5 bg-[#7a1200]/5 text-[#7a1200] text-[10px] font-bold rounded-full uppercase tracking-widest border border-red-100">Hierarchy</span>
            </h1>
            <p className="text-slate-400 text-xs font-medium">Hierarki Monev → Korwil → Relawan</p>
          </div>
          <div className="flex items-center gap-4 flex-wrap">
            {/* Selector Monev — hanya untuk Admin */}
            {isAdmin && monevList.length > 0 && (
              <Select
                value={selectedMonevId ? String(selectedMonevId) : ''}
                onValueChange={(v) => setSelectedMonevId(Number(v))}
              >
                <SelectTrigger className="w-[180px] border border-slate-200 bg-white shadow-sm focus:ring-0 font-bold text-slate-600 rounded-xl h-11">
                  <SelectValue placeholder="Pilih Monev..." />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-slate-200">
                  {monevList.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)} className="font-medium">
                      {m.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              onClick={fetchAll}
              disabled={loading}
              className="px-6 h-11 rounded-2xl gap-2 text-white font-bold shadow-lg shadow-[#7a1200]/20 hover:shadow-[#7a1200]/30 transition-all active:scale-95"
              style={{ backgroundColor: '#7a1200' }}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto p-8 py-10 space-y-10">

        {/* === Tampilan untuk MONEV / ADMIN === */}
        {(loading || teamMonev) && (
          <>
            {/* Stat cards */}
            {!loading && teamMonev && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.03)] bg-white rounded-2xl overflow-hidden group hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 ring-1 ring-slate-100">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-2">Monev</p>
                        <p className="text-3xl font-black text-slate-800 tracking-tight">{teamMonev.monev_nama}</p>
                      </div>
                      <div className="w-11 h-11 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 group-hover:bg-red-50 group-hover:border-red-100 transition-colors duration-300">
                        <Shield className="w-5 h-5 text-slate-400 group-hover:text-[#7a1200] transition-colors" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.03)] bg-white rounded-2xl overflow-hidden group hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 ring-1 ring-slate-100">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-2">Korwil</p>
                        <p className="text-3xl font-black text-slate-800 tracking-tight">{totalKorwil}</p>
                      </div>
                      <div className="w-11 h-11 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 group-hover:bg-amber-50 group-hover:border-amber-100 transition-colors duration-300">
                        <UserCheck className="w-5 h-5 text-slate-400 group-hover:text-amber-600 transition-colors" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.03)] bg-white rounded-2xl overflow-hidden group hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 ring-1 ring-slate-100">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-2">Relawan</p>
                        <p className="text-3xl font-black text-slate-800 tracking-tight">{totalRelawan}</p>
                      </div>
                      <div className="w-11 h-11 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 group-hover:bg-blue-50 group-hover:border-blue-100 transition-colors duration-300">
                        <Users className="w-5 h-5 text-slate-400 group-hover:text-blue-600 transition-colors" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.03)] bg-white rounded-2xl overflow-hidden group hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 ring-1 ring-slate-100">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-2">Desa Aktif</p>
                        <p className="text-3xl font-black text-slate-800 tracking-tight">{totalDesa}</p>
                      </div>
                      <div className="w-11 h-11 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 group-hover:bg-emerald-50 group-hover:border-emerald-100 transition-colors duration-300">
                        <Building2 className="w-5 h-5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Daftar Korwil Premium Style */}
            <Card className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-2xl bg-white overflow-hidden p-2 ring-1 ring-slate-100 mt-6">
              <div className="p-6 flex items-center justify-between bg-slate-50/50 rounded-xl border border-slate-100 mb-6">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-white border border-red-100 flex items-center justify-center text-[#7a1200] shadow-sm">
                    <Shield className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Lead Supervisor</p>
                    <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">{teamMonev?.monev_nama ?? 'MONEV'}</h3>
                  </div>
                </div>
                {!loading && teamMonev && teamMonev.korwils.length > 0 && (
                  <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2 mr-4">
                      <Button variant="outline" size="sm" onClick={expandAll} className="h-8 text-[11px] font-bold uppercase tracking-wider rounded-lg border-slate-200 hover:bg-slate-50 text-slate-500">
                        Buka Semua
                      </Button>
                      <Button variant="outline" size="sm" onClick={collapseAll} className="h-8 text-[11px] font-bold uppercase tracking-wider rounded-lg border-slate-200 hover:bg-slate-50 text-slate-500">
                        Tutup Semua
                      </Button>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-slate-800 leading-none">{totalKorwil}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Korwil</p>
                    </div>
                    <div className="w-px h-10 bg-slate-200" />
                    <div className="text-right">
                      <p className="text-xl font-black text-[#7a1200] leading-none">{totalRelawan}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Relawan</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-5 pb-8">
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => <SkeletonRow key={i} />)}
                  </div>
                ) : !teamMonev || teamMonev.korwils.length === 0 ? (
                  <p className="text-slate-400 text-sm font-medium text-center py-10">Belum ada Korwil yang terdaftar untuk Monev ini.</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {teamMonev.korwils.map((korwil, idx) => {
                      const isExpanded = expandedKorwils.has(korwil.id)
                      return (
                        <div key={korwil.id} className={`rounded-[2rem] border transition-all duration-300 overflow-hidden ${isExpanded ? 'border-[#7a1200]/30 shadow-2xl shadow-[#7a1200]/5 bg-white' : 'border-slate-100 hover:border-slate-300 bg-slate-50'}`}>
                          <div className="w-full flex items-center justify-between p-6 bg-transparent">
                            <button
                              type="button"
                              className="flex-1 flex items-center gap-4 text-left"
                              onClick={() => toggleKorwil(korwil.id)}
                            >
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-base font-black flex-shrink-0 transition-all duration-300 ${
                                isExpanded 
                                ? 'bg-[#7a1200] text-white shadow-lg shadow-[#7a1200]/20' 
                                : 'bg-slate-200 text-slate-600 hover:bg-[#7a1200] hover:text-white'
                              }`}>
                                {idx + 1}
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className={`text-base tracking-tight truncate transition-colors duration-300 ${
                                  isExpanded ? 'font-black text-slate-800' : 'font-bold text-slate-700 hover:text-slate-900'
                                }`}>{korwil.nama}</p>
                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">
                                  Korwil · {korwil.jumlah_desa} desa · {korwil.relawans.length} relawan
                                </p>
                              </div>
                            </button>
                            <div className="flex items-center gap-3">
                              <KorwilWilayahSheet korwilId={korwil.id} korwilNama={korwil.nama} />
                              <button 
                                type="button" 
                                onClick={() => toggleKorwil(korwil.id)} 
                                className={`p-2 rounded-xl bg-white shadow-sm border border-slate-100 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                              >
                                <ChevronDown className="w-4 h-4 text-[#7a1200]" />
                              </button>
                            </div>
                          </div>

                          {/* Relawan list */}
                          {isExpanded && (
                            <div className="px-6 pb-6 space-y-3">
                              {korwil.relawans.length === 0 ? (
                                <p className="px-4 py-6 text-sm text-slate-400 italic font-medium bg-white rounded-2xl border border-dashed border-slate-200 text-center">
                                  Belum ada relawan di bawah Korwil ini
                                </p>
                              ) : (
                                korwil.relawans.map((r, rIdx) => (
                                  <div
                                    key={r.id}
                                    className="flex items-center gap-4 p-4 bg-slate-50/50 hover:bg-white border border-slate-100 hover:border-slate-200 hover:shadow-sm rounded-2xl transition-all group"
                                  >
                                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 font-black text-xs flex-shrink-0 group-hover:bg-[#7a1200] group-hover:text-white group-hover:border-[#7a1200] transition-colors duration-300">
                                      {r.nama.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-bold text-slate-700 truncate group-hover:text-slate-900 transition-colors duration-300">{r.nama}</p>
                                      <p className="text-[11px] font-medium text-slate-400">{r.jumlah_desa} desa aktif binaan</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <RelawanWilayahSheet relawanId={r.id} relawanNama={r.nama} />
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </Card>
          </>
        )}

        {/* === Tampilan untuk KORWIL (Tim Saya) === */}
        {(loading || teamKorwil) && (
          <Card className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-2xl bg-white overflow-hidden p-6 ring-1 ring-slate-100">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center text-[#7a1200] border border-red-100 shadow-sm shadow-red-100/50">
                  <UserCheck className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">My Managed Team</p>
                  <h3 className="text-lg font-black text-slate-800 tracking-tight">Korwil: <span className="text-slate-500">{teamKorwil?.korwil_nama}</span></h3>
                </div>
              </div>
              <div className="bg-slate-50 border border-slate-200 text-slate-500 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-none">
                {teamKorwil?.relawans.length ?? 0} Relawan
              </div>
            </div>
            
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {[1, 2, 3, 4].map((i) => <SkeletonRow key={i} />)}
              </div>
            ) : !teamKorwil || teamKorwil.relawans.length === 0 ? (
              <div className="py-12 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                <p className="text-slate-400 font-bold italic">Belum ada relawan aktif di wilayah Anda.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {teamKorwil.relawans.map((r) => (
                  <div key={r.id} className="border border-slate-100 bg-slate-50/50 hover:bg-white hover:shadow-xl hover:border-white transition-all duration-300 rounded-[1.5rem] group p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white shadow-sm flex items-center justify-center font-black text-slate-800 group-hover:bg-[#7a1200] group-hover:text-white transition-colors duration-300 flex-shrink-0">
                      {r.nama.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-slate-800 truncate leading-none mb-1">{r.nama}</p>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">{r.jumlah_desa} Desa Aktif</p>
                    </div>
                    <div className="flex-shrink-0">
                      <RelawanWilayahSheet relawanId={r.id} relawanNama={r.nama} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        )}

        {/* Jika tidak ada data sama sekali (Relawan biasa) */}
        {!loading && !teamMonev && !teamKorwil && (
          <Card className="border-0 shadow-sm">
            <CardContent className="py-16 text-center">
              <GitBranch className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 font-medium">Halaman ini hanya tersedia untuk Monev dan Korwil</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
