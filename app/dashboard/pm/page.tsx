'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PlusCircle, Search, MapPin, UserSquare2, Users, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import DeletePMButton from './DeletePMButton'
import { getPenerimaManfaatList } from './actions'
import { useSession } from 'next-auth/react'

export const dynamic = 'force-dynamic'

export default function PenerimaManfaatPage() {
  const { data: session } = useSession()
  const [list, setList] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const role = (session?.user as any)?.role
  const canAdd = role === 'RELAWAN' || role === 'PROG_HEAD'

  useEffect(() => {
    if (!session?.user) return
    getPenerimaManfaatList()
      .then((data) => { setList(data); setFiltered(data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [session])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(
      list.filter((pm) =>
        pm.nama?.toLowerCase().includes(q) ||
        pm.nik?.toLowerCase().includes(q) ||
        pm.nama_desa?.toLowerCase().includes(q) ||
        pm.kategori_pm?.toLowerCase().includes(q)
      )
    )
  }, [search, list])

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Penerima Manfaat</h1>
            <p className="text-slate-500 text-xs mt-0.5">Kelola data penerima manfaat per desa binaan</p>
          </div>
          {canAdd && (
            <Link href="/dashboard/pm/tambah">
              <Button size="sm" style={{ backgroundColor: '#7a1200' }} className="text-white gap-1 shrink-0">
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:inline">Tambah PM</span>
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
            placeholder="Cari nama, NIK, desa, kategori..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#7a1200]/20 focus:border-[#7a1200]"
          />
        </div>

        {!loading && (
          <p className="text-xs text-slate-400">{filtered.length} penerima manfaat ditemukan</p>
        )}

        {/* ── MOBILE: Card layout (hidden on md+) ── */}
        <div className="md:hidden space-y-3">
          {loading && [1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-2xl border border-slate-100 p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-slate-200 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-slate-200 rounded w-1/2" />
                  <div className="h-3 bg-slate-100 rounded w-1/3" />
                  <div className="h-3 bg-slate-100 rounded w-2/3" />
                </div>
              </div>
            </div>
          ))}

          {!loading && filtered.length === 0 && (
            <div className="bg-white rounded-2xl border border-slate-100 py-14 text-center">
              <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">
                {list.length === 0 ? 'Belum ada data penerima manfaat.' : 'Tidak ada hasil yang cocok'}
              </p>
            </div>
          )}

          {!loading && filtered.map((pm) => (
            <div key={pm.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="px-4 pt-4 pb-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-[#7a1200] shrink-0">
                    <UserSquare2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-800 truncate">{pm.nama}</p>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">{pm.nik}</p>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        {pm.kategori_pm}
                      </span>
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{pm.nama_desa}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-100 px-4 py-2.5 flex items-center justify-end gap-2">
                <Link href={`/dashboard/pm/${pm.id}`}>
                  <Button variant="outline" size="sm" className="text-[#7a1200] border-red-200 hover:bg-red-50 h-8 text-xs gap-1">
                    Detail <ChevronRight className="w-3 h-3" />
                  </Button>
                </Link>
                <Link href={`/dashboard/pm/${pm.id}/edit`}>
                  <Button variant="ghost" size="sm" className="text-slate-600 hover:bg-slate-100 h-8 text-xs">Edit</Button>
                </Link>
                <DeletePMButton id={pm.id} />
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
                  <th className="px-6 py-4">Penerima Manfaat</th>
                  <th className="px-6 py-4">Kategori</th>
                  <th className="px-6 py-4">Desa Binaan</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">Memuat data...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    {list.length === 0 ? 'Belum ada data penerima manfaat.' : 'Tidak ada hasil yang cocok'}
                  </td></tr>
                ) : filtered.map((pm) => (
                  <tr key={pm.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-[#7a1200] shrink-0">
                          <UserSquare2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{pm.nama}</p>
                          <p className="text-xs text-slate-500 font-mono mt-0.5">{pm.nik}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        {pm.kategori_pm}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        {pm.nama_desa}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/dashboard/pm/${pm.id}`}>
                          <Button variant="ghost" size="sm" className="text-[#7a1200] hover:bg-red-50">Detail</Button>
                        </Link>
                        <Link href={`/dashboard/pm/${pm.id}/edit`}>
                          <Button variant="ghost" size="sm" className="text-slate-600 hover:bg-slate-100">Edit</Button>
                        </Link>
                        <DeletePMButton id={pm.id} />
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
