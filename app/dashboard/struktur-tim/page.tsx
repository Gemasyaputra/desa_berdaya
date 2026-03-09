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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Struktur Tim</h1>
            <p className="text-slate-500 text-sm">Hierarki Monev → Korwil → Relawan</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Selector Monev — hanya untuk Admin */}
            {isAdmin && monevList.length > 0 && (
              <Select
                value={selectedMonevId ? String(selectedMonevId) : ''}
                onValueChange={(v) => setSelectedMonevId(Number(v))}
              >
                <SelectTrigger className="w-48 text-sm bg-white">
                  <SelectValue placeholder="Pilih Monev..." />
                </SelectTrigger>
                <SelectContent>
                  {monevList.map((m) => (
                    <SelectItem key={m.id} value={String(m.id)}>
                      {m.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            <Button
              onClick={fetchAll}
              disabled={loading}
              className="gap-2 text-white"
              style={{ backgroundColor: '#7a1200' }}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">

        {/* === Tampilan untuk MONEV / ADMIN === */}
        {(loading || teamMonev) && (
          <>
            {/* Stat cards */}
            {!loading && teamMonev && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <Card className="border-0 shadow-sm bg-gradient-to-br from-rose-900 to-rose-700 text-white">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-rose-200 text-xs font-medium">Monev</p>
                        <p className="text-xl font-bold mt-1 truncate">{teamMonev.monev_nama}</p>
                      </div>
                      <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                        <Shield className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-gradient-to-br from-amber-600 to-amber-500 text-white">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-amber-100 text-xs font-medium">Korwil</p>
                        <p className="text-3xl font-bold mt-1">{totalKorwil}</p>
                      </div>
                      <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                        <UserCheck className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-700 to-blue-500 text-white">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-blue-100 text-xs font-medium">Relawan</p>
                        <p className="text-3xl font-bold mt-1">{totalRelawan}</p>
                      </div>
                      <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-sm bg-gradient-to-br from-emerald-700 to-emerald-500 text-white">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-emerald-100 text-xs font-medium">Desa Aktif</p>
                        <p className="text-3xl font-bold mt-1">{totalDesa}</p>
                      </div>
                      <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Daftar Korwil */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center">
                      <GitBranch className="w-5 h-5 text-[#7a1200]" />
                    </div>
                    <div>
                      <CardTitle className="text-base text-slate-800">Hierarki Tim</CardTitle>
                      {teamMonev && (
                        <p className="text-xs text-slate-500">
                          Monev: <span className="font-semibold text-[#7a1200]">{teamMonev.monev_nama}</span>
                        </p>
                      )}
                    </div>
                  </div>
                  {!loading && teamMonev && teamMonev.korwils.length > 0 && (
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" onClick={expandAll} className="text-xs">
                        Buka Semua
                      </Button>
                      <Button variant="outline" size="sm" onClick={collapseAll} className="text-xs">
                        Tutup Semua
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => <SkeletonRow key={i} />)}
                  </div>
                ) : !teamMonev || teamMonev.korwils.length === 0 ? (
                  <p className="text-slate-400 text-sm text-center py-8">Belum ada Korwil yang terdaftar</p>
                ) : (
                  <div className="space-y-3">
                    {teamMonev.korwils.map((korwil, idx) => {
                      const isExpanded = expandedKorwils.has(korwil.id)
                      return (
                        <div key={korwil.id} className="border border-slate-200 rounded-xl overflow-hidden">
                          {/* Korwil row */}
                          <div className="w-full flex items-center justify-between px-4 py-3 bg-red-50">
                            <button
                              type="button"
                              className="flex-1 flex items-center gap-3 text-left min-w-0"
                              onClick={() => toggleKorwil(korwil.id)}
                            >
                              <div className="w-9 h-9 rounded-full bg-[#7a1200] flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                                {idx + 1}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-slate-800 text-sm">{korwil.nama}</p>
                                <div className="flex items-center gap-2 mt-0.5">
                                  <span className="text-xs text-slate-500 font-medium">Korwil</span>
                                  <Pill label="Desa" value={korwil.jumlah_desa} color="red" />
                                  <Pill label="Relawan" value={korwil.relawans.length} color="amber" />
                                </div>
                              </div>
                            </button>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <KorwilWilayahSheet korwilId={korwil.id} korwilNama={korwil.nama} />
                              <button type="button" onClick={() => toggleKorwil(korwil.id)} className="p-1">
                                {isExpanded
                                  ? <ChevronDown className="w-4 h-4 text-slate-400" />
                                  : <ChevronRight className="w-4 h-4 text-slate-400" />
                                }
                              </button>
                            </div>
                          </div>

                          {/* Relawan list */}
                          {isExpanded && (
                            <div className="divide-y divide-slate-100">
                              {korwil.relawans.length === 0 ? (
                                <p className="px-4 py-3 pl-16 text-sm text-slate-400 italic">
                                  Belum ada relawan di bawah Korwil ini
                                </p>
                              ) : (
                                korwil.relawans.map((r, rIdx) => (
                                  <div
                                    key={r.id}
                                    className="flex items-center gap-3 px-4 py-3 pl-14 bg-white hover:bg-slate-50 transition-colors"
                                  >
                                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 text-xs font-bold flex-shrink-0">
                                      {r.nama.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-slate-700 truncate">{r.nama}</p>
                                      <p className="text-xs text-slate-400">Relawan</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <RelawanWilayahSheet relawanId={r.id} relawanNama={r.nama} />
                                      <Pill label="Desa" value={r.jumlah_desa} />
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
              </CardContent>
            </Card>
          </>
        )}

        {/* === Tampilan untuk KORWIL (Tim Saya) === */}
        {(loading || teamKorwil) && (
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-red-100 flex items-center justify-center">
                  <UserCheck className="w-5 h-5 text-[#7a1200]" />
                </div>
                <div>
                  <CardTitle className="text-base text-slate-800">Tim Saya</CardTitle>
                  {teamKorwil && (
                    <p className="text-xs text-slate-500">
                      Korwil: <span className="font-semibold text-[#7a1200]">{teamKorwil.korwil_nama}</span>{' '}
                      · {teamKorwil.relawans.length} relawan
                    </p>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[1, 2, 3].map((i) => <SkeletonRow key={i} />)}
                </div>
              ) : !teamKorwil || teamKorwil.relawans.length === 0 ? (
                <p className="text-slate-400 text-sm text-center py-8">Belum ada relawan di wilayah Anda</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {teamKorwil.relawans.map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200 hover:border-red-200 hover:bg-red-50 transition-colors"
                    >
                      <div className="w-10 h-10 rounded-full bg-[#7a1200] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {r.nama.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-700 truncate">{r.nama}</p>
                        <Pill label="Desa aktif" value={r.jumlah_desa} />
                      </div>
                      <RelawanWilayahSheet relawanId={r.id} relawanNama={r.nama} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
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
