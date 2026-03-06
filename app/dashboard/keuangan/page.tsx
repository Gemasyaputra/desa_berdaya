'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { PlusCircle, Search, MapPin, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getLaporanKeuangan } from './actions'
import DeleteLaporanButton from './DeleteLaporanButton'

export const dynamic = 'force-dynamic'

export default function LaporanKeuanganListPage() {
  const [laporanList, setLaporanList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getLaporanKeuangan().then(data => {
      setLaporanList(data)
      setLoading(false)
    }).catch(err => {
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

  return (
    <div className="p-4 lg:p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Kegiatan & Keuangan</h1>
          <p className="text-slate-500 text-sm mt-1">Daftar pelaporan realisasi kegiatan di Desa Binaan.</p>
        </div>
        <Link href="/dashboard/keuangan/tambah">
          <Button className="bg-[#7a1200] hover:bg-[#5a0d00] text-white w-full sm:w-auto">
            <PlusCircle className="w-4 h-4 mr-2" />
            Tambah Laporan
          </Button>
        </Link>
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

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Judul Kegiatan</th>
                <th className="px-6 py-4">Desa Binaan</th>
                <th className="px-6 py-4">Realisasi</th>
                <th className="px-6 py-4">Tanggal</th>
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
                    <td className="px-6 py-4 font-mono font-medium text-slate-700">
                      {formatRupiah(laporan.total_realisasi)}
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {formatDate(laporan.created_at)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {laporan.bukti_url && (
                          <Button variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50" asChild>
                            <a href={laporan.bukti_url} target="_blank" rel="noreferrer">
                              Bukti
                            </a>
                          </Button>
                        )}
                        <Link href={`/dashboard/keuangan/${laporan.id}/edit`}>
                          <Button variant="ghost" size="sm" className="text-slate-600 hover:bg-slate-100">
                            Edit
                          </Button>
                        </Link>
                        <DeleteLaporanButton id={laporan.id} />
                      </div>
                    </td>
                  </tr>
                ))
              )}
              {!loading && laporanList.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Belum ada data laporan kegiatan yang terdaftar.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
