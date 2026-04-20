'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { PlusCircle, Search, MapPin, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getLaporanKegiatan } from './actions'
import DeleteLaporanButton from './DeleteLaporanButton'
import { useSession } from 'next-auth/react'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

export default function LaporanKegiatanListPage() {
  const { data: session } = useSession()
  const [laporanList, setLaporanList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const role = (session?.user as any)?.role
  const canMod = role === 'RELAWAN' || role === 'PROG_HEAD' || role === 'ADMIN' || role === 'KORWIL'

  useEffect(() => {
    getLaporanKegiatan().then((data: any[]) => {
      setLaporanList(data)
      setLoading(false)
    }).catch((err: any) => {
      console.error(err)
      setLoading(false)
    })
  }, [])

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(number)
  }

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(dateString))
  }

  const getEditUrl = (laporan: any) => {
    return `/dashboard/laporan-kegiatan/${laporan.id}/edit`
  }

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Laporan Kegiatan</h1>
          <p className="text-slate-500 text-sm mt-1">Daftar pelaporan realisasi kegiatan di Desa Binaan.</p>
        </div>
        {canMod && (
          <Link href="/dashboard/laporan-kegiatan/tambah">
            <Button className="bg-[#7a1200] hover:bg-[#5a0d00] text-white w-full sm:w-auto">
              <PlusCircle className="w-4 h-4 mr-2" />
              Tambah Laporan
            </Button>
          </Link>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-4 items-center justify-between bg-slate-50/50">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari laporan..." 
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-[#7a1200]"
            />
          </div>
        </div>

        {/* Mobile View: Card Layout */}
        <div className="md:hidden divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-slate-500">Memuat data...</div>
          ) : (
            laporanList.map((laporan) => (
              <div key={laporan.id} className="p-4 space-y-4 hover:bg-slate-50/50 transition-colors">
                <div className="flex justify-between items-start gap-2">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-800 leading-tight mb-1">{laporan.judul_kegiatan}</div>
                    <Badge variant="outline" className="text-[10px] font-bold uppercase text-teal-700 bg-teal-50 border-teal-100 px-2 py-0">
                      {laporan.jenis_kegiatan}
                    </Badge>
                  </div>
                  <div className="text-[10px] font-semibold text-slate-500 uppercase shrink-0 bg-slate-100 px-2 py-1 rounded-md">
                    {formatDate(laporan.tanggal_kegiatan || laporan.created_at)}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 rounded-lg p-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-bold">{laporan.nama_desa}</span>
                </div>

                <div className="flex items-center gap-2 pt-2">
                  <Link href={`/dashboard/laporan-kegiatan/${laporan.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-teal-600 border-teal-100 hover:bg-teal-50 rounded-xl font-bold text-[10px] uppercase">
                      Lihat Detail
                    </Button>
                  </Link>
                  {canMod && (
                    <>
                      <Button asChild variant="outline" size="sm" className="text-slate-600 border-slate-100 hover:bg-slate-50 rounded-xl font-bold text-[10px] uppercase">
                        <Link href={getEditUrl(laporan)}>
                          Edit
                        </Link>
                      </Button>
                      <DeleteLaporanButton id={laporan.id} />
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Desktop View: Table Layout */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Judul Kegiatan</th>
                <th className="px-6 py-4">Desa Binaan</th>
                <th className="px-6 py-4">Tanggal Aktifitas</th>
                <th className="px-6 py-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">Memuat data...</td>
                </tr>
              ) : (
                laporanList.map((laporan) => (
                  <tr key={laporan.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-slate-800">{laporan.judul_kegiatan}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{laporan.jenis_kegiatan}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        {laporan.nama_desa}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {formatDate(laporan.tanggal_kegiatan || laporan.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/dashboard/laporan-kegiatan/${laporan.id}`}>
                          <Button variant="ghost" size="sm" className="text-teal-600 hover:bg-teal-50">
                            Lihat Detail
                          </Button>
                        </Link>
                        {canMod && (
                          <>
                            <Button asChild variant="ghost" size="sm" className="text-slate-600 hover:bg-slate-100">
                              <Link href={getEditUrl(laporan)}>
                                Edit
                              </Link>
                            </Button>
                            <DeleteLaporanButton id={laporan.id} />
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {!loading && laporanList.length === 0 && (
          <div className="p-12 text-center text-slate-500">
            Belum ada data laporan kegiatan yang terdaftar.
          </div>
        )}
      </div>
    </div>
  )
}
