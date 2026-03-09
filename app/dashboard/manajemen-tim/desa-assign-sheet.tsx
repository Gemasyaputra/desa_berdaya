'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
  MapPin, Loader2, Plus, X, ArrowLeftRight, Building2, RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import {
  getDesaOptions, getDesaByRelawan, assignDesaToRelawan,
  unassignDesaFromRelawan, getAllDesaWithRelawan, changeDesaRelawan,
  getRelawanList,
  type DesaOption, type RelawanRow,
} from './actions'

// ============================================================
// Sheet: Kelola Desa untuk 1 Relawan
// ============================================================
export function KelolaDesaRelawanSheet({
  relawanId,
  relawanNama,
  onRefresh,
}: {
  relawanId: number
  relawanNama: string
  onRefresh?: () => void
}) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [myDesa, setMyDesa] = useState<DesaOption[]>([])
  const [allDesa, setAllDesa] = useState<DesaOption[]>([])
  const [selectedDesa, setSelectedDesa] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [mine, all] = await Promise.all([
        getDesaByRelawan(relawanId),
        getDesaOptions(),
      ])
      setMyDesa(mine)
      setAllDesa(all)
    } finally { setLoading(false) }
  }, [relawanId])

  const handleOpen = () => { setOpen(true); load() }

  // Desa yang belum ditugaskan ke siapa-siapa
  const unassigned = allDesa.filter(
    (d) => !d.relawan_id && !myDesa.find((m) => m.id === d.id)
  )

  const handleAssign = async () => {
    if (!selectedDesa) return
    setSavingId(Number(selectedDesa))
    const res = await assignDesaToRelawan(Number(selectedDesa), relawanId)
    if (res.success) {
      toast.success('Desa berhasil ditugaskan')
      setSelectedDesa('')
      load()
      onRefresh?.()
    } else {
      toast.error(res.error || 'Gagal menugaskan desa')
    }
    setSavingId(null)
  }

  const handleUnassign = async (desaId: number, desaNama: string) => {
    if (!confirm(`Lepas desa "${desaNama}" dari relawan ini?`)) return
    setSavingId(desaId)
    const res = await unassignDesaFromRelawan(desaId)
    if (res.success) {
      toast.success('Desa berhasil dilepas')
      load()
      onRefresh?.()
    } else {
      toast.error(res.error || 'Gagal melepas desa')
    }
    setSavingId(null)
  }

  return (
    <>
      <Button
        size="sm" variant="outline" onClick={handleOpen}
        className="h-7 px-2 text-xs text-indigo-700 border-indigo-200 hover:bg-indigo-50"
      >
        <Building2 className="w-3 h-3 mr-1" /> Desa
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-[#7a1200]" />
              Desa Binaan — {relawanNama}
            </SheetTitle>
            <p className="text-sm text-slate-500">Kelola desa yang ditugaskan ke relawan ini</p>
          </SheetHeader>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#7a1200]" />
            </div>
          ) : (
            <div className="space-y-5">
              {/* Tambah desa */}
              <div className="bg-indigo-50 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-indigo-800">Tambah Penugasan Desa</p>
                <div className="flex gap-2">
                  <Select value={selectedDesa} onValueChange={setSelectedDesa}>
                    <SelectTrigger className="flex-1 text-sm">
                      <SelectValue placeholder="Pilih desa yang belum ditugaskan..." />
                    </SelectTrigger>
                    <SelectContent>
                      {unassigned.length === 0
                        ? <SelectItem value="__none" disabled>Semua desa sudah ditugaskan</SelectItem>
                        : unassigned.map((d) => (
                          <SelectItem key={d.id} value={String(d.id)}>
                            {d.nama_desa} — {d.kecamatan}, {d.kota}
                          </SelectItem>
                        ))
                      }
                    </SelectContent>
                  </Select>
                  <Button
                    onClick={handleAssign}
                    disabled={!selectedDesa || savingId !== null}
                    style={{ backgroundColor: '#7a1200' }}
                    className="text-white gap-1 shrink-0"
                  >
                    {savingId && savingId === Number(selectedDesa)
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <Plus className="w-4 h-4" />
                    }
                    Tugaskan
                  </Button>
                </div>
              </div>

              {/* Daftar desa saat ini */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-slate-700">
                    Desa yang Sedang Dikelola <Badge className="ml-1 bg-indigo-100 text-indigo-700">{myDesa.length}</Badge>
                  </p>
                  <button onClick={load} className="text-slate-400 hover:text-slate-600">
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                </div>
                {myDesa.length === 0
                  ? <p className="text-sm text-slate-400 italic text-center py-6">Belum ada desa yang ditugaskan</p>
                  : (
                    <div className="space-y-2">
                      {myDesa.map((d) => (
                        <div key={d.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-100">
                          <div className="flex items-center gap-2 min-w-0">
                            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-700 truncate">{d.nama_desa}</p>
                              <p className="text-xs text-slate-400">{d.kecamatan}, {d.kota}</p>
                            </div>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-7 w-7 text-red-400 hover:bg-red-50 hover:text-red-600 shrink-0"
                            disabled={savingId === d.id}
                            onClick={() => handleUnassign(d.id, d.nama_desa)}
                          >
                            {savingId === d.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                          </Button>
                        </div>
                      ))}
                    </div>
                  )
                }
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}

// ============================================================
// Sheet: Ganti Relawan untuk semua Desa (manajemen global)
// ============================================================
export function GantiRelawanDesaSheet() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState<number | null>(null)
  const [desaList, setDesaList] = useState<DesaOption[]>([])
  const [relawanList, setRelawanList] = useState<RelawanRow[]>([])
  const [search, setSearch] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [desas, relawans] = await Promise.all([
        getAllDesaWithRelawan(),
        getRelawanList(),
      ])
      setDesaList(desas)
      setRelawanList(relawans)
    } finally { setLoading(false) }
  }, [])

  const handleOpen = () => { setOpen(true); load() }

  const handleChange = async (desaId: number, relawanId: string) => {
    setSavingId(desaId)
    const newRelawanId = relawanId === '__none' ? null : Number(relawanId)
    const res = await changeDesaRelawan(desaId, newRelawanId)
    if (res.success) {
      toast.success('Relawan desa berhasil diganti')
      // update state lokal tanpa refetch penuh
      setDesaList((prev) =>
        prev.map((d) =>
          d.id === desaId
            ? {
                ...d,
                relawan_id: newRelawanId,
                relawan_nama: relawanList.find((r) => r.id === newRelawanId)?.nama ?? null,
              }
            : d
        )
      )
    } else {
      toast.error(res.error || 'Gagal mengganti relawan')
    }
    setSavingId(null)
  }

  const filtered = desaList.filter((d) =>
    d.nama_desa.toLowerCase().includes(search.toLowerCase()) ||
    d.kota.toLowerCase().includes(search.toLowerCase()) ||
    (d.relawan_nama ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <Button
        variant="outline" size="sm"
        onClick={handleOpen}
        className="gap-1 text-purple-700 border-purple-200 hover:bg-purple-50"
      >
        <ArrowLeftRight className="w-4 h-4" /> Ganti Relawan Desa
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2">
              <ArrowLeftRight className="w-5 h-5 text-[#7a1200]" />
              Ganti Relawan per Desa
            </SheetTitle>
            <p className="text-sm text-slate-500">Ubah penugasan relawan untuk setiap desa binaan</p>
          </SheetHeader>

          {/* Search */}
          <input
            type="text"
            placeholder="Cari desa atau relawan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-[#7a1200]/20"
          />

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-[#7a1200]" />
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.length === 0 && (
                <p className="text-center text-slate-400 text-sm py-8">Tidak ada hasil</p>
              )}
              {filtered.map((d) => (
                <div key={d.id} className="px-3 py-3 rounded-xl border border-slate-100 bg-slate-50 space-y-2">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-slate-800 truncate">{d.nama_desa}</p>
                      <p className="text-xs text-slate-400">{d.kecamatan}, {d.kota}</p>
                    </div>
                    {savingId === d.id && <Loader2 className="w-4 h-4 animate-spin text-slate-400" />}
                  </div>
                  <Select
                    value={d.relawan_id ? String(d.relawan_id) : '__none'}
                    onValueChange={(v) => handleChange(d.id, v)}
                    disabled={savingId === d.id}
                  >
                    <SelectTrigger className="text-sm bg-white">
                      <SelectValue placeholder="Pilih relawan..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none">
                        <span className="text-slate-400 italic">— Tidak ada relawan —</span>
                      </SelectItem>
                      {relawanList.map((r) => (
                        <SelectItem key={r.id} value={String(r.id)}>
                          {r.nama}
                          {r.korwil_nama ? <span className="text-slate-400 ml-1">({r.korwil_nama})</span> : null}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
