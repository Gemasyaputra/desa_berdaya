'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { PlusCircle, MapPin, Users, Search, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getDesaBinaanList } from './actions'
import DeleteDesaButton from './DeleteDesaButton'
import { useSession } from 'next-auth/react'

export const dynamic = 'force-dynamic'

export default function DesaBinaanPage() {
  const { data: session } = useSession()
  const [desaList, setDesaList] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const isAdminOrKorwil = session?.user?.role === 'ADMIN' || session?.user?.is_korwil

  useEffect(() => {
    getDesaBinaanList().then(data => {
      setDesaList(data)
      setLoading(false)
    }).catch(err => {
      console.error(err)
      setLoading(false)
    })
  }, [])

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateString))
  }

  return (
    <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Manajemen Desa Binaan</h1>
          <p className="text-slate-500 text-sm mt-1">
            {isAdminOrKorwil 
              ? 'Kelola wilayah Desa Binaan dan penugasan Relawan Anda.'
              : 'Daftar Desa Binaan di mana Anda ditugaskan sebagai Relawan.'}
          </p>
        </div>
        {isAdminOrKorwil && (
          <Link href="/dashboard/desa/tambah">
            <Button className="bg-[#7a1200] hover:bg-[#5a0d00] text-white w-full sm:w-auto">
              <PlusCircle className="w-4 h-4 mr-2" />
              Tambah Desa Binaan
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
              placeholder="Cari desa binaan..." 
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-[#7a1200]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
              <tr>
                <th className="px-6 py-4">Nama Desa / Kecamatan</th>
                <th className="px-6 py-4">Wilayah Kota & Provinsi</th>
                <th className="px-6 py-4">Relawan Bertugas</th>
                <th className="px-6 py-4">Status & Waktu</th>
                <th className="px-6 py-4 font-semibold text-slate-700 w-48">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">Memuat data...</td>
                </tr>
              ) : (
                desaList.map((desa) => (
                  <tr key={desa.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-teal-800 text-base">{desa.nama_desa}</div>
                      <div className="text-xs text-slate-500 mt-0.5">Kec. {desa.nama_kecamatan}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1 text-slate-600">
                        <div className="flex items-center gap-1.5 line-clamp-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                          {desa.nama_kota}
                        </div>
                        <span className="text-xs text-slate-400 pl-5">{desa.nama_provinsi}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 font-medium text-slate-700">
                        <Users className="w-4 h-4 text-teal-500" />
                        {desa.nama_relawan}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1.5">
                        {desa.status_aktif ? (
                          <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium bg-green-50 text-green-700 w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-full text-xs font-medium bg-red-50 text-red-700 w-fit">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>
                            Nonaktif
                          </span>
                        )}
                        <span className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                           <Activity className="w-3 h-3" />
                           Mulai: {formatDate(desa.tanggal_mulai)}
                        </span>
                      </div>
                    </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Link href={`/dashboard/desa/${desa.id}`}>
                            <Button variant="outline" size="sm" className="text-[#7a1200] border-red-200 hover:bg-red-50">
                              Detail
                            </Button>
                          </Link>
                          {isAdminOrKorwil && (
                            <>
                              <Link href={`/dashboard/desa/${desa.id}/edit`}>
                                <Button variant="ghost" size="sm" className="text-slate-600 hover:bg-slate-100">
                                  Edit
                                </Button>
                              </Link>
                              <DeleteDesaButton id={desa.id} />
                            </>
                          )}
                        </div>
                      </td>
                  </tr>
                ))
              )}
              {!loading && desaList.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    {isAdminOrKorwil 
                      ? 'Belum ada data desa binaan di wilayah Anda.'
                      : 'Anda belum ditugaskan ke desa binaan manapun.'}
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
