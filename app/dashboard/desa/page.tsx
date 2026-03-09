'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { PlusCircle, MapPin, Users, Search, Activity, Building2, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getDesaBinaanList } from './actions'
import DeleteDesaButton from './DeleteDesaButton'
import { useSession } from 'next-auth/react'

export const dynamic = 'force-dynamic'

export default function DesaBinaanPage() {
  const { data: session } = useSession()
  const [desaList, setDesaList] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const isKorwil = !!(session?.user as any)?.is_korwil
  const isAdmin = (session?.user as any)?.role === 'ADMIN'
  const isAdminOrKorwil = isAdmin || isKorwil

  useEffect(() => {
    getDesaBinaanList()
      .then((data) => { setDesaList(data); setFiltered(data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(
      desaList.filter((d) =>
        d.nama_desa?.toLowerCase().includes(q) ||
        d.nama_kecamatan?.toLowerCase().includes(q) ||
        d.nama_kota?.toLowerCase().includes(q) ||
        d.nama_relawan?.toLowerCase().includes(q)
      )
    )
  }, [search, desaList])

  const formatDate = (dateString: string) =>
    new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(dateString))

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Desa Binaan</h1>
            <p className="text-slate-500 text-xs mt-0.5">
              {isAdminOrKorwil ? 'Kelola wilayah desa binaan' : 'Desa binaan yang Anda kelola'}
            </p>
          </div>
          {isAdminOrKorwil && (
            <Link href="/dashboard/desa/tambah">
              <Button size="sm" style={{ backgroundColor: '#7a1200' }} className="text-white gap-1 shrink-0">
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Tambah</span>
              </Button>
            </Link>
          )}
        </div>
      </header>

      <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-3">
        {/* Search */}
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari desa, kecamatan, relawan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#7a1200]/20 focus:border-[#7a1200]"
          />
        </div>

        {!loading && (
          <p className="text-xs text-slate-400">{filtered.length} desa ditemukan</p>
        )}

        {/* ── MOBILE: Card layout (hidden on md+) ── */}
        <div className="md:hidden space-y-3">
          {loading && [1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-2" />
              <div className="h-3 bg-slate-100 rounded w-1/3 mb-3" />
              <div className="h-3 bg-slate-100 rounded w-2/3" />
            </div>
          ))}

          {!loading && filtered.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 py-14 text-center">
              <Building2 className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">
                {desaList.length === 0
                  ? (isAdminOrKorwil ? 'Belum ada desa binaan.' : 'Anda belum ditugaskan ke desa manapun.')
                  : 'Tidak ada hasil yang cocok'}
              </p>
            </div>
          )}

          {!loading && filtered.map((desa) => (
            <div key={desa.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {/* Card body */}
              <div className="px-4 pt-4 pb-3">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0 flex-1">
                    <h3 className="font-bold text-slate-800 leading-tight">{desa.nama_desa}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Kec. {desa.nama_kecamatan}</p>
                  </div>
                  <span className={`inline-flex items-center gap-1 py-0.5 px-2 rounded-full text-xs font-semibold shrink-0 ${
                    desa.status_aktif ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${desa.status_aktif ? 'bg-emerald-500' : 'bg-red-400'}`} />
                    {desa.status_aktif ? 'Aktif' : 'Nonaktif'}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{desa.nama_kota}, {desa.nama_provinsi}</span>
                  </div>
                  {desa.nama_relawan && (
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Users className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{desa.nama_relawan}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <Activity className="w-3 h-3 shrink-0" />
                    <span>Mulai: {formatDate(desa.tanggal_mulai)}</span>
                  </div>
                </div>
              </div>
              {/* Card footer */}
              <div className="border-t border-slate-100 px-4 py-2.5 flex items-center justify-end gap-2">
                <Link href={`/dashboard/desa/${desa.id}`}>
                  <Button variant="outline" size="sm" className="text-[#7a1200] border-red-200 hover:bg-red-50 h-8 text-xs gap-1">
                    Detail <ChevronRight className="w-3 h-3" />
                  </Button>
                </Link>
                {isAdminOrKorwil && (
                  <>
                    <Link href={`/dashboard/desa/${desa.id}/edit`}>
                      <Button variant="ghost" size="sm" className="text-slate-600 hover:bg-slate-100 h-8 text-xs">Edit</Button>
                    </Link>
                    <DeleteDesaButton id={desa.id} />
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* ── DESKTOP: Table layout (hidden below md) ── */}
        <div className="hidden md:block bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Nama Desa / Kecamatan</th>
                  <th className="px-6 py-4">Wilayah Kota &amp; Provinsi</th>
                  <th className="px-6 py-4">Relawan Bertugas</th>
                  <th className="px-6 py-4">Status &amp; Waktu</th>
                  <th className="px-6 py-4 w-48">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">Memuat data...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    {desaList.length === 0
                      ? (isAdminOrKorwil ? 'Belum ada data desa binaan.' : 'Anda belum ditugaskan ke desa manapun.')
                      : 'Tidak ada hasil yang cocok'}
                  </td></tr>
                ) : filtered.map((desa) => (
                  <tr key={desa.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{desa.nama_desa}</div>
                      <div className="text-xs text-slate-500 mt-0.5">Kec. {desa.nama_kecamatan}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        {desa.nama_kota}
                      </div>
                      <span className="text-xs text-slate-400 pl-5">{desa.nama_provinsi}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-slate-700">
                        <Users className="w-4 h-4 text-slate-400" />
                        {desa.nama_relawan}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1.5">
                        <span className={`inline-flex items-center gap-1 py-1 px-2.5 rounded-full text-xs font-medium ${
                          desa.status_aktif ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${desa.status_aktif ? 'bg-green-500' : 'bg-red-500'}`} />
                          {desa.status_aktif ? 'Aktif' : 'Nonaktif'}
                        </span>
                        <div className="text-xs text-slate-400 flex items-center gap-1">
                          <Activity className="w-3 h-3" />
                          Mulai: {formatDate(desa.tanggal_mulai)}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 justify-end">
                        <Link href={`/dashboard/desa/${desa.id}`}>
                          <Button variant="outline" size="sm" className="text-[#7a1200] border-red-200 hover:bg-red-50">Detail</Button>
                        </Link>
                        {isAdminOrKorwil && (
                          <>
                            <Link href={`/dashboard/desa/${desa.id}/edit`}>
                              <Button variant="ghost" size="sm" className="text-slate-600 hover:bg-slate-100">Edit</Button>
                            </Link>
                            <DeleteDesaButton id={desa.id} />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
