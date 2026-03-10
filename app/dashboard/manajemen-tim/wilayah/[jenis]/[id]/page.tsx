'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { MapPin, ArrowLeft, ChevronDown, ChevronRight, Users, Building2, Loader2 } from 'lucide-react'
import {
  getRelawanWilayah,
  getKorwilWilayah,
  getMonevWilayah,
  type DesaItem,
  type RelawanWilayahItem,
  type KorwilWilayahDetail,
  type MonevWilayahDetail,
} from '@/app/dashboard/manajemen-tim/actions'

function DesaList({ desa }: { desa: DesaItem[] }) {
  if (desa.length === 0) {
    return <p className="text-xs text-slate-400 italic px-3 py-2">Belum ada desa binaan</p>
  }

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
              <div
                key={d.db_id}
                className="flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors"
              >
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

export default function WilayahManajemenTimPage() {
  const params = useParams()
  const jenis = (params?.jenis as string) || ''
  const idStr = (params?.id as string) || ''

  const id = useMemo(() => {
    const n = Number(idStr)
    return Number.isFinite(n) ? n : 0
  }, [idStr])

  const [loading, setLoading] = useState(true)
  const [relawanDesa, setRelawanDesa] = useState<DesaItem[] | null>(null)
  const [korwilDetail, setKorwilDetail] = useState<KorwilWilayahDetail | null>(null)
  const [monevDetail, setMonevDetail] = useState<MonevWilayahDetail | null>(null)

  useEffect(() => {
    let mounted = true
    async function run() {
      if (!id || !jenis) return
      setLoading(true)
      try {
        if (jenis === 'relawan') {
          const desa = await getRelawanWilayah(id)
          if (mounted) setRelawanDesa(desa)
        } else if (jenis === 'korwil') {
          const det = await getKorwilWilayah(id)
          if (mounted) setKorwilDetail(det)
        } else if (jenis === 'monev') {
          const det = await getMonevWilayah(id)
          if (mounted) setMonevDetail(det)
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }
    run()
    return () => { mounted = false }
  }, [id, jenis])

  const title = useMemo(() => {
    if (jenis === 'relawan') return 'Wilayah — Relawan'
    if (jenis === 'korwil') return 'Wilayah — Korwil'
    if (jenis === 'monev') return 'Wilayah — Monev'
    return 'Wilayah'
  }, [jenis])

  const subtitle = useMemo(() => {
    if (jenis === 'relawan') return 'Desa binaan yang dikelola relawan ini'
    if (jenis === 'korwil') return 'Relawan dan desa binaan di bawah Korwil ini'
    if (jenis === 'monev') return 'Korwil, relawan, dan desa binaan di bawah Monev ini'
    return ''
  }, [jenis])

  const totalKorwil = monevDetail?.korwils.length ?? 0
  const totalRelawan = monevDetail?.korwils.reduce((s, k) => s + k.relawans.length, 0) ?? 0
  const totalDesa = monevDetail?.korwils.reduce((s, k) => s + k.relawans.reduce((sr, r) => sr + r.desa.length, 0), 0) ?? 0

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <Link href="/dashboard/manajemen-tim">
              <Button variant="outline" size="icon" className="h-10 w-10 border-slate-200">
                <ArrowLeft className="w-5 h-5 text-slate-600" />
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-[#7a1200]" />
                {title}
              </h1>
              <p className="text-slate-500 text-xs mt-0.5">{subtitle}</p>
            </div>
          </div>

          {jenis === 'monev' && monevDetail && (
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className="bg-amber-100 text-amber-700">{totalKorwil} Korwil</Badge>
              <Badge className="bg-blue-100 text-blue-700">{totalRelawan} Relawan</Badge>
              <Badge className="bg-emerald-100 text-emerald-700">{totalDesa} Desa</Badge>
            </div>
          )}
        </div>
      </header>

      <main className="p-4 lg:p-6 max-w-4xl mx-auto">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-[#7a1200]" />
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
            {jenis === 'relawan' && relawanDesa && <DesaList desa={relawanDesa} />}
            {jenis === 'korwil' && korwilDetail && (
              <div className="space-y-3">
                {korwilDetail.relawans.length === 0
                  ? <p className="text-slate-400 text-sm text-center py-8">Belum ada relawan di bawah Korwil ini</p>
                  : korwilDetail.relawans.map((r) => <RelawanWilayah key={r.relawan_id} item={r} />)
                }
              </div>
            )}
            {jenis === 'monev' && monevDetail && (
              <div className="space-y-4">
                {monevDetail.korwils.length === 0
                  ? <p className="text-slate-400 text-sm text-center py-8">Belum ada Korwil di bawah Monev ini</p>
                  : monevDetail.korwils.map((k) => <KorwilSection key={k.korwil_id} korwil={k} />)
                }
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

