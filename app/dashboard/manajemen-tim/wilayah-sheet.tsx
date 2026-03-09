'use client'

import { useState } from 'react'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { MapPin, ChevronDown, ChevronRight, Users, Building2, Loader2 } from 'lucide-react'
import {
  getRelawanWilayah, getKorwilWilayah, getMonevWilayah,
  type DesaItem, type RelawanWilayahItem, type KorwilWilayahDetail, type MonevWilayahDetail,
} from './actions'

// ── Komponen daftar desa ───────────────────────────────────── //
function DesaList({ desa }: { desa: DesaItem[] }) {
  if (desa.length === 0) {
    return <p className="text-xs text-slate-400 italic px-3 py-2">Belum ada desa binaan</p>
  }

  // Grup desa berdasarkan kota
  const byKota = desa.reduce<Record<string, DesaItem[]>>((acc, d) => {
    const key = `${d.provinsi} › ${d.kota}`
    if (!acc[key]) acc[key] = []
    acc[key].push(d)
    return acc
  }, {})

  return (
    <div className="space-y-2">
      {Object.entries(byKota).map(([kotaLabel, items]) => (
        <div key={kotaLabel}>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-1 mb-1">{kotaLabel}</p>
          <div className="space-y-1">
            {items.map((d) => (
              <div key={d.db_id} className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <MapPin className="w-3 h-3 text-[#7a1200] flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">{d.nama_desa}</p>
                    <p className="text-xs text-slate-400">{d.kecamatan}</p>
                  </div>
                </div>
                <Badge className={d.status_aktif ? 'bg-emerald-100 text-emerald-700 text-xs' : 'bg-slate-100 text-slate-500 text-xs'}>
                  {d.status_aktif ? 'Aktif' : 'Nonaktif'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── Expandable Relawan ─────────────────────────────────────── //
function RelawanWilayah({ item }: { item: RelawanWilayahItem }) {
  const [open, setOpen] = useState(true)
  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-amber-50 hover:bg-amber-100 transition-colors text-left"
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
            {item.relawan_nama.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-800">{item.relawan_nama}</p>
            <p className="text-xs text-slate-500">{item.desa.length} desa</p>
          </div>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
      </button>
      {open && (
        <div className="p-3">
          <DesaList desa={item.desa} />
        </div>
      )}
    </div>
  )
}

// ── Expandable Korwil ──────────────────────────────────────── //
function KorwilSection({ korwil }: { korwil: KorwilWilayahDetail }) {
  const [open, setOpen] = useState(true)
  const totalDesa = korwil.relawans.reduce((s, r) => s + r.desa.length, 0)

  return (
    <div className="border-2 border-amber-200 rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-amber-50 hover:bg-amber-100 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
            {korwil.korwil_nama.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-semibold text-slate-800">{korwil.korwil_nama}</p>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="flex items-center gap-1"><Users className="w-3 h-3" />{korwil.relawans.length} relawan</span>
              <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{totalDesa} desa</span>
            </div>
          </div>
        </div>
        {open ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
      </button>
      {open && (
        <div className="p-3 space-y-2">
          {korwil.relawans.length === 0
            ? <p className="text-xs text-slate-400 italic text-center py-2">Belum ada relawan</p>
            : korwil.relawans.map((r) => <RelawanWilayah key={r.relawan_id} item={r} />)
          }
        </div>
      )}
    </div>
  )
}

// ── Sheet Relawan Wilayah ──────────────────────────────────── //
export function RelawanWilayahSheet({ relawanId, relawanNama }: { relawanId: number; relawanNama: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [desa, setDesa] = useState<DesaItem[] | null>(null)

  const handleOpen = async () => {
    setOpen(true)
    if (desa !== null) return
    setLoading(true)
    try { setDesa(await getRelawanWilayah(relawanId)) } finally { setLoading(false) }
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={handleOpen} className="h-7 px-2 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50">
        <MapPin className="w-3 h-3 mr-1" /> Wilayah
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#7a1200]" />
              Wilayah — {relawanNama}
            </SheetTitle>
            <p className="text-sm text-slate-500">Desa binaan yang dikelola relawan ini</p>
          </SheetHeader>
          {loading
            ? <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-[#7a1200] animate-spin" /></div>
            : desa && <DesaList desa={desa} />
          }
        </SheetContent>
      </Sheet>
    </>
  )
}

// ── Sheet Korwil Wilayah ───────────────────────────────────── //
export function KorwilWilayahSheet({ korwilId, korwilNama }: { korwilId: number; korwilNama: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState<KorwilWilayahDetail | null>(null)

  const handleOpen = async () => {
    setOpen(true)
    if (detail !== null) return
    setLoading(true)
    try { setDetail(await getKorwilWilayah(korwilId)) } finally { setLoading(false) }
  }

  return (
    <>
      <Button size="sm" variant="outline" onClick={handleOpen} className="h-7 px-2 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50">
        <MapPin className="w-3 h-3 mr-1" /> Wilayah
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#7a1200]" />
              Wilayah Korwil — {korwilNama}
            </SheetTitle>
            <p className="text-sm text-slate-500">Relawan dan desa binaan di bawah Korwil ini</p>
          </SheetHeader>
          {loading
            ? <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-[#7a1200] animate-spin" /></div>
            : detail && (
              <div className="space-y-3">
                {detail.relawans.length === 0
                  ? <p className="text-slate-400 text-sm text-center py-8">Belum ada relawan di bawah Korwil ini</p>
                  : detail.relawans.map((r) => <RelawanWilayah key={r.relawan_id} item={r} />)
                }
              </div>
            )
          }
        </SheetContent>
      </Sheet>
    </>
  )
}

// ── Sheet Monev Wilayah ────────────────────────────────────── //
export function MonevWilayahSheet({ monevId, monevNama }: { monevId: number; monevNama: string }) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [detail, setDetail] = useState<MonevWilayahDetail | null>(null)

  const handleOpen = async () => {
    setOpen(true)
    if (detail !== null) return
    setLoading(true)
    try { setDetail(await getMonevWilayah(monevId)) } finally { setLoading(false) }
  }

  const totalKorwil = detail?.korwils.length ?? 0
  const totalRelawan = detail?.korwils.reduce((s, k) => s + k.relawans.length, 0) ?? 0
  const totalDesa = detail?.korwils.reduce((s, k) => s + k.relawans.reduce((sr, r) => sr + r.desa.length, 0), 0) ?? 0

  return (
    <>
      <Button size="sm" variant="outline" onClick={handleOpen} className="h-7 px-2 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50">
        <MapPin className="w-3 h-3 mr-1" /> Wilayah
      </Button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-xl overflow-y-auto">
          <SheetHeader className="mb-4">
            <SheetTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#7a1200]" />
              Wilayah Monev — {monevNama}
            </SheetTitle>
            {detail && (
              <div className="flex items-center gap-2 flex-wrap mt-1">
                <Badge className="bg-amber-100 text-amber-700">{totalKorwil} Korwil</Badge>
                <Badge className="bg-blue-100 text-blue-700">{totalRelawan} Relawan</Badge>
                <Badge className="bg-emerald-100 text-emerald-700">{totalDesa} Desa</Badge>
              </div>
            )}
          </SheetHeader>
          {loading
            ? <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 text-[#7a1200] animate-spin" /></div>
            : detail && (
              <div className="space-y-4">
                {detail.korwils.length === 0
                  ? <p className="text-slate-400 text-sm text-center py-8">Belum ada Korwil di bawah Monev ini</p>
                  : detail.korwils.map((k) => <KorwilSection key={k.korwil_id} korwil={k} />)
                }
              </div>
            )
          }
        </SheetContent>
      </Sheet>
    </>
  )
}
