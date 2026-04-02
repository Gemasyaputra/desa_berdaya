'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Target, LayoutGrid, Search, Filter, X } from 'lucide-react'
import { getIntervensiPrograms } from './actions'
import { Badge } from '@/components/ui/badge'

export default function IntervensiListPage() {
  const router = useRouter()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const res = await getIntervensiPrograms()
      setData(res)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    return data.filter(row => {
      const q = search.toLowerCase()
      const matcheSearch = !q || (
        (row.nama_desa || '').toLowerCase().includes(q) ||
        (row.nama_program || '').toLowerCase().includes(q) ||
        (row.nama_relawan || '').toLowerCase().includes(q) ||
        (row.sumber_dana || '').toLowerCase().includes(q) ||
        (row.fundraiser || '').toLowerCase().includes(q)
      )
      const matchesStatus = statusFilter === 'ALL' || row.status === statusFilter
      return matcheSearch && matchesStatus
    })
  }, [data, search, statusFilter])

  const clearFilters = () => {
    setSearch('')
    setStatusFilter('ALL')
  }

  const hasFilters = search !== '' || statusFilter !== 'ALL'

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 uppercase text-[10px] font-bold tracking-wider">APPROVED</Badge>
      case 'CANCELLED': return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 uppercase text-[10px] font-bold tracking-wider">CANCELLED</Badge>
      default: return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 uppercase text-[10px] font-bold tracking-wider">DRAFT</Badge>
    }
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center flex-shrink-0">
            <Target className="w-7 h-7 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800">Intervensi Program</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">Perencanaan dan alokasi anggaran program desa</p>
          </div>
        </div>
        
        <Button 
          className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/20 px-6 h-12 rounded-xl font-bold transition-all w-full md:w-auto"
          onClick={() => router.push('/dashboard/intervensi/tambah')}
        >
          <Plus className="w-5 h-5 mr-2" />
          Tambah Intervensi
        </Button>
      </div>

      <Card className="border-none shadow-xl shadow-slate-200/40 rounded-[2rem] overflow-hidden bg-white">
        <CardHeader className="bg-white border-b border-slate-100 px-8 py-5">
          <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-indigo-500" /> 
              Daftar Intervensi Program
              {!loading && (
                <span className="text-sm font-semibold text-slate-400 ml-1">
                  ({filtered.length}/{data.length})
                </span>
              )}
            </CardTitle>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              {/* Search box */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <Input
                  placeholder="Cari desa, program, relawan..."
                  className="pl-9 h-10 w-full sm:w-64 rounded-xl border-slate-200 text-sm"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              {/* Status filter */}
              <div className="relative flex items-center gap-2">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <select
                  className="pl-9 pr-4 h-10 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-white appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-400 cursor-pointer"
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">Semua Status</option>
                  <option value="DRAFT">Draft</option>
                  <option value="APPROVED">Approved</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>

              {/* Clear filter button */}
              {hasFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-10 px-3 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 font-semibold gap-1"
                  onClick={clearFilters}
                >
                  <X className="w-4 h-4" />
                  Reset
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#f8fafc] text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                <tr>
                  <th className="px-8 py-4 min-w-[200px]">Desa Binaan & Program</th>
                  <th className="px-8 py-4">Relawan</th>
                  <th className="px-8 py-4">Sumber Dana / Fundraiser</th>
                  <th className="px-8 py-4 whitespace-nowrap">Tanggal Dibuat</th>
                  <th className="px-8 py-4 whitespace-nowrap text-center">Status</th>
                  <th className="px-8 py-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-12 text-center text-slate-400 font-medium">Memuat data...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-14 text-center">
                      <div className="flex flex-col items-center gap-2 text-slate-400">
                        <Search className="w-8 h-8 opacity-40" />
                        <p className="font-medium">
                          {hasFilters ? 'Tidak ada data yang sesuai filter' : 'Belum ada data intervensi program'}
                        </p>
                        {hasFilters && (
                          <Button variant="link" className="text-indigo-500 font-semibold text-xs h-auto p-0" onClick={clearFilters}>
                            Reset Filter
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors group">
                      <td className="px-8 py-5">
                        <div className="font-bold text-slate-800 mb-1">{row.nama_desa || '-'}</div>
                        <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400"></span>
                          {row.nama_program || '-'}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="font-semibold text-slate-700">{row.nama_relawan || '-'}</div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="font-semibold text-slate-700">{row.sumber_dana || '-'}</div>
                        <div className="text-[11px] font-medium text-slate-400">{row.fundraiser || '-'}</div>
                      </td>
                      <td className="px-8 py-5 text-slate-500 font-medium">
                        {new Date(row.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-8 py-5 text-center">
                        {getStatusBadge(row.status)}
                      </td>
                      <td className="px-8 py-5 text-center">
                        <Button 
                          variant="outline"
                          size="sm"
                          className="rounded-xl border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 hover:bg-indigo-50 font-bold px-4"
                          onClick={() => router.push(`/dashboard/intervensi/${row.id}`)}
                        >
                          Detail
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
