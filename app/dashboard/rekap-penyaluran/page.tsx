'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { getRekapPenyaluran } from './actions'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  Search, 
  Wallet,
  Receipt,
  Download,
  Building2,
  TrendingUp,
  Target,
  User,
  ArrowRight
} from 'lucide-react'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import { Badge } from '@/components/ui/badge'

export default function RekapPenyaluranPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDesa, setFilterDesa] = useState('all')
  const [filterKategori, setFilterKategori] = useState('all')
  const [filterSumberDana, setFilterSumberDana] = useState('all')
  const [filterRelawan, setFilterRelawan] = useState('all')
  const [itemsPerPage, setItemsPerPage] = useState<number>(50)
  const [currentPage, setCurrentPage] = useState<number>(1)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const res = await getRekapPenyaluran()
      setData(res)
    } catch (e) {
      console.error(e)
      toast.error('Gagal mengambil data rekap penyaluran')
    } finally {
      setLoading(false)
    }
  }

  const filteredData = useMemo(() => {
    return data.filter(item => {
      // Dropdown filters
      if (filterDesa !== 'all' && item.nama_desa !== filterDesa) return false
      if (filterKategori !== 'all' && item.kategori_program !== filterKategori) return false
      if (filterSumberDana !== 'all' && item.sumber_dana !== filterSumberDana) return false
      if (filterRelawan !== 'all' && item.relawan_nama !== filterRelawan) return false

      // Text search
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return (
        item.nama_program?.toLowerCase().includes(q) ||
        item.nama_desa?.toLowerCase().includes(q) ||
        item.kategori_program?.toLowerCase().includes(q) ||
        item.sumber_dana?.toLowerCase().includes(q) ||
        item.relawan_nama?.toLowerCase().includes(q)
      )
    })
  }, [data, searchQuery, filterDesa, filterKategori, filterSumberDana, filterRelawan])

  // Extract unique options for filters
  const filterOptions = useMemo(() => {
    const desaSet = new Set<string>()
    const kategoriSet = new Set<string>()
    const sumberDanaSet = new Set<string>()
    const relawanSet = new Set<string>()

    data.forEach(item => {
      if (item.nama_desa && item.nama_desa !== '-') desaSet.add(item.nama_desa)
      if (item.kategori_program && item.kategori_program !== '-') kategoriSet.add(item.kategori_program)
      if (item.sumber_dana && item.sumber_dana !== '-') sumberDanaSet.add(item.sumber_dana)
      if (item.relawan_nama && item.relawan_nama !== '-') relawanSet.add(item.relawan_nama)
    })

    return {
      desa: Array.from(desaSet).sort(),
      kategori: Array.from(kategoriSet).sort(),
      sumberDana: Array.from(sumberDanaSet).sort(),
      relawan: Array.from(relawanSet).sort()
    }
  }, [data])

  const totals = useMemo(() => {
    let totalAjuan = 0
    let totalCair = 0
    let totalRealisasi = 0
    let totalPengembalian = 0
    let totalSisa = 0

    filteredData.forEach(item => {
      totalAjuan += item.total_ajuan || 0
      totalCair += item.total_dicairkan || 0
      totalRealisasi += item.total_realisasi || 0
      totalPengembalian += item.total_pengembalian || 0
      totalSisa += item.sisa_saldo || 0
    })

    return { totalAjuan, totalCair, totalRealisasi, totalPengembalian, totalSisa }
  }, [filteredData])

  const totalPages = Math.ceil(filteredData.length / itemsPerPage)
  const paginatedData = filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleExport = () => {
    if (filteredData.length === 0) return toast.warning('Tidak ada data untuk diekspor')
    const exportData = filteredData.map(item => ({
      'Nama Desa': item.nama_desa,
      'Relawan': item.relawan_nama,
      'Nama Program': item.nama_program,
      'Kategori Program': item.kategori_program,
      'Sumber Dana': item.sumber_dana,
      'Total Ajuan RI (Rp)': item.total_ajuan,
      'Total Dicairkan (Rp)': item.total_dicairkan,
      'Total Realisasi CA (Rp)': item.total_realisasi,
      'Total Pengembalian (Rp)': item.total_pengembalian,
      'Sisa Saldo (Rp)': item.sisa_saldo
    }))
    
    // Add totals row
    exportData.push({
      'Nama Desa': 'TOTAL KESELURUHAN',
      'Relawan': '',
      'Nama Program': '',
      'Kategori Program': '',
      'Sumber Dana': '',
      'Total Ajuan RI (Rp)': totals.totalAjuan,
      'Total Dicairkan (Rp)': totals.totalCair,
      'Total Realisasi CA (Rp)': totals.totalRealisasi,
      'Total Pengembalian (Rp)': totals.totalPengembalian,
      'Sisa Saldo (Rp)': totals.totalSisa
    })

    const ws = XLSX.utils.json_to_sheet(exportData)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap_Penyaluran')
    XLSX.writeFile(wb, `Rekap_Penyaluran_${new Date().getTime()}.xlsx`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh] min-h-[400px]">
        <div className="animate-spin w-10 h-10 border-4 border-[#008784] border-t-transparent rounded-full"></div>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-8 max-w-[1600px] mx-auto min-h-screen bg-slate-50 space-y-6">
      <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-end">
        <div>
          <h1 className="text-2xl lg:text-3xl font-black text-slate-800 tracking-tight">Rekap Penyaluran Keuangan</h1>
          <p className="text-slate-500 mt-1 font-medium">Ringkasan total pencairan, realisasi, refund, dan sisa saldo per program.</p>
        </div>
        <div className="flex gap-3 w-full lg:w-auto">
          <Button onClick={handleExport} className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md w-full lg:w-auto gap-2">
            <Download className="w-4 h-4" />
            Export Excel
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
          <CardContent className="p-6">
            <div className="flex gap-4 items-center">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Target className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Ajuan RI</p>
                <p className="text-xl font-black text-slate-800">Rp {totals.totalAjuan.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white border-l-4 border-l-[#008784]">
          <CardContent className="p-6">
            <div className="flex gap-4 items-center">
              <div className="w-12 h-12 rounded-xl bg-[#008784]/10 text-[#008784] flex items-center justify-center">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold font-mono text-[#008784]/70 uppercase tracking-widest mb-1">Total Anggaran Cair</p>
                <p className="text-2xl font-black text-[#008784]">Rp {totals.totalCair.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white">
          <CardContent className="p-6">
            <div className="flex gap-4 items-center">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Total Realisasi CA</p>
                <p className="text-xl font-black text-amber-700">Rp {totals.totalRealisasi.toLocaleString('id-ID')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className={`border-none shadow-sm rounded-2xl overflow-hidden ${totals.totalSisa < 0 ? 'bg-rose-50' : 'bg-white'}`}>
          <CardContent className="p-6">
            <div className="flex gap-4 items-center">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${totals.totalSisa < 0 ? 'bg-rose-100 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
                <BarChart3 className="w-6 h-6" />
              </div>
              <div>
                <p className={`text-xs font-bold uppercase tracking-widest mb-1 ${totals.totalSisa < 0 ? 'text-rose-500' : 'text-slate-400'}`}>Sisa Saldo</p>
                <p className={`text-xl font-black ${totals.totalSisa < 0 ? 'text-rose-600' : 'text-indigo-700'}`}>
                  Rp {totals.totalSisa.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="bg-white p-4 lg:p-6 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Cari kata kunci..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:border-[#008784] focus:ring-4 focus:ring-[#008784]/10 transition-all outline-none text-sm text-slate-700"
            />
          </div>
          <div className="flex flex-wrap lg:flex-nowrap gap-3">
            <select
              value={filterDesa}
              onChange={(e) => setFilterDesa(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#008784] min-w-[140px]"
            >
              <option value="all">Semua Desa</option>
              {filterOptions.desa.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
            <select
              value={filterKategori}
              onChange={(e) => setFilterKategori(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#008784] min-w-[140px]"
            >
              <option value="all">Semua Kategori</option>
              {filterOptions.kategori.map(k => <option key={k} value={k}>{k}</option>)}
            </select>
            <select
              value={filterSumberDana}
              onChange={(e) => setFilterSumberDana(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#008784] min-w-[140px]"
            >
              <option value="all">Semua Sumber Dana</option>
              {filterOptions.sumberDana.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <select
              value={filterRelawan}
              onChange={(e) => setFilterRelawan(e.target.value)}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#008784] min-w-[140px]"
            >
              <option value="all">Semua Relawan</option>
              {filterOptions.relawan.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
            <select
              value={itemsPerPage.toString()}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#008784]"
            >
              <option value="50">50 Baris</option>
              <option value="100">100 Baris</option>
              <option value="500">500 Baris</option>
            </select>
          </div>
        </div>

        <div className="w-full overflow-x-auto rounded-xl border border-slate-200 pb-2">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] uppercase bg-slate-50/80 text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-4 py-3.5 font-black tracking-widest min-w-[180px]">Desa & Relawan</th>
                <th className="px-4 py-3.5 font-black tracking-widest min-w-[200px]">Program</th>
                <th className="px-4 py-3.5 text-right font-black tracking-widest">Total Ajuan (Rp)</th>
                <th className="px-4 py-3.5 text-right font-black tracking-widest">Total Cair (Rp)</th>
                <th className="px-4 py-3.5 text-right font-black tracking-widest whitespace-nowrap"><span className="text-amber-600">Realisasi (Rp)</span></th>
                <th className="px-4 py-3.5 text-right font-black tracking-widest"><span className="text-rose-500">Refund (Rp)</span></th>
                <th className="px-4 py-3.5 text-right font-black tracking-widest min-w-[120px]"><span className="text-indigo-600">Sisa Saldo (Rp)</span></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/80 font-medium">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-400">
                    <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                    <p>Tidak ada data</p>
                  </td>
                </tr>
              ) : (
                paginatedData.map(row => (
                  <tr key={row.program_id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <div className="font-bold text-slate-800 flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          {row.nama_desa}
                        </div>
                        <div className="text-xs text-slate-500 flex items-center gap-1.5">
                          <User className="w-3 h-3 opacity-70" />
                          {row.relawan_nama}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-700 line-clamp-2" title={row.nama_program}>{row.nama_program}</div>
                      <div className="flex gap-1.5 mt-1">
                         <span className="text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 border border-slate-200">{row.kategori_program}</span>
                         {row.sumber_dana && row.sumber_dana !== '-' && (
                           <span className="text-[9px] uppercase tracking-widest font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 border border-emerald-100">{row.sumber_dana}</span>
                         )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row.total_ajuan.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-[#008784]">
                      {row.total_dicairkan.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-amber-600">
                      {row.total_realisasi.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-right text-rose-500">
                      {row.total_pengembalian.toLocaleString('id-ID')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`font-black px-2 py-1 rounded-md text-xs ${row.sisa_saldo < 0 ? 'bg-rose-100/50 text-rose-600 border border-rose-200/50' : 'bg-slate-100/80 text-slate-700 border border-slate-200'}`}>
                         {row.sisa_saldo.toLocaleString('id-ID')}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Setup */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center mt-6 p-4 border-t border-slate-100">
            <span className="text-sm font-medium text-slate-500">
              Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredData.length)} dari {filteredData.length} data
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="font-bold"
              >
                Prev
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="font-bold"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
