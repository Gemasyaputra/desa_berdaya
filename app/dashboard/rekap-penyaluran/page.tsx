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
  ArrowRight,
  Layers,
  ChevronDown,
  ChevronRight,
  X
} from 'lucide-react'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { MultiSelect } from '@/components/ui/multi-select'
import { MultiSelectGroup } from '@/components/ui/multi-select-group'
import { FavoriteGroupSelector } from '@/components/favorite-group-selector'

export default function RekapPenyaluranPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterDesa, setFilterDesa] = useState<string[]>([])
  const [filterTahun, setFilterTahun] = useState<string[]>([])
  const [filterBulan, setFilterBulan] = useState<string[]>([])
  const [filterKategori, setFilterKategori] = useState<string[]>([])
  const [filterSumberDana, setFilterSumberDana] = useState<string[]>([])
  const [filterRelawan, setFilterRelawan] = useState<string[]>([])
  const [itemsPerPage, setItemsPerPage] = useState<number>(50)
  const [currentPage, setCurrentPage] = useState<number>(1)
  const [groupBys, setGroupBys] = useState<string[]>([])
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})

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
      if (filterDesa.length > 0 && !filterDesa.includes(item.nama_desa)) return false
      if (filterTahun.length > 0 && !filterTahun.includes(item.tahun)) return false
      if (filterBulan.length > 0 && !filterBulan.includes(item.bulan)) return false
      if (filterKategori.length > 0 && !filterKategori.includes(item.kategori_program)) return false
      if (filterSumberDana.length > 0 && !filterSumberDana.includes(item.sumber_dana)) return false
      if (filterRelawan.length > 0 && !filterRelawan.includes(item.relawan_nama)) return false

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
  }, [data, searchQuery, filterDesa, filterTahun, filterBulan, filterKategori, filterSumberDana, filterRelawan])

  // Extract unique options for filters
  const filterOptions = useMemo(() => {
    const desaSet = new Set<string>()
    const tahunSet = new Set<string>()
    const bulanSet = new Set<string>()
    const kategoriSet = new Set<string>()
    const sumberDanaSet = new Set<string>()
    const relawanSet = new Set<string>()

    data.forEach(item => {
      if (item.nama_desa && item.nama_desa !== '-') desaSet.add(String(item.nama_desa))
      if (item.tahun != null && item.tahun !== '-') tahunSet.add(String(item.tahun))
      if (item.bulan != null && item.bulan !== '-') bulanSet.add(String(item.bulan))
      if (item.kategori_program && item.kategori_program !== '-') kategoriSet.add(String(item.kategori_program))
      if (item.sumber_dana && item.sumber_dana !== '-') sumberDanaSet.add(String(item.sumber_dana))
      if (item.relawan_nama && item.relawan_nama !== '-') relawanSet.add(String(item.relawan_nama))
    })

    return {
      desa: Array.from(desaSet).sort((a, b) => a.localeCompare(b)),
      tahun: Array.from(tahunSet).sort((a, b) => b.localeCompare(a)), // descending
      bulan: Array.from(bulanSet).sort((a, b) => Number(a) - Number(b)), // numeric sort
      kategori: Array.from(kategoriSet).sort((a, b) => a.localeCompare(b)),
      sumberDana: Array.from(sumberDanaSet).sort((a, b) => a.localeCompare(b)),
      relawan: Array.from(relawanSet).sort((a, b) => a.localeCompare(b))
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

  // Find unique programs for column headers
  const uniquePrograms = useMemo(() => {
    const programs = new Set<string>()
    filteredData.forEach(item => {
      if (item.nama_program && item.nama_program !== '-') programs.add(item.nama_program)
    })
    return Array.from(programs).sort()
  }, [filteredData])

  // Pivot data: Group by Desa + Relawan
  const pivotData = useMemo(() => {
    const grouped = new Map<string, any>()
    filteredData.forEach(item => {
      const key = `${item.nama_desa}_${item.relawan_nama}`
      if (!grouped.has(key)) {
        grouped.set(key, {
          nama_desa: item.nama_desa,
          relawan_nama: item.relawan_nama,
          programsData: {}, // key: programName, value: financial data
          rowTotal: {
             ajuan: 0, cair: 0, realisasi: 0, pengembalian: 0, sisa: 0
          }
        })
      }
      
      const row = grouped.get(key)
      const progName = item.nama_program
      
      if (!row.programsData[progName]) {
        row.programsData[progName] = { ajuan: 0, cair: 0, realisasi: 0, pengembalian: 0, sisa: 0 }
      }
      
      row.programsData[progName].ajuan += item.total_ajuan || 0
      row.programsData[progName].cair += item.total_dicairkan || 0
      row.programsData[progName].realisasi += item.total_realisasi || 0
      row.programsData[progName].pengembalian += item.total_pengembalian || 0
      row.programsData[progName].sisa += item.sisa_saldo || 0
      
      row.rowTotal.ajuan += item.total_ajuan || 0
      row.rowTotal.cair += item.total_dicairkan || 0
      row.rowTotal.realisasi += item.total_realisasi || 0
      row.rowTotal.pengembalian += item.total_pengembalian || 0
      row.rowTotal.sisa += item.sisa_saldo || 0
    })
    return Array.from(grouped.values()).sort((a, b) => (a.nama_desa ?? '').localeCompare(b.nama_desa ?? ''))
  }, [filteredData])

  const buildGroups = (data: any[], keys: string[], depth: number = 0, path: string = ''): any[] => {
    if (depth >= keys.length || keys.length === 0) return data;
    const keyType = keys[depth];
    const map = new Map<string, any[]>();
    
    data.forEach(item => {
      let val = 'Lain-lain';
      if (keyType === 'relawan') val = item.relawan_nama || 'Tanpa Relawan';
      else if (keyType === 'desa') val = item.nama_desa || 'Tanpa Desa';
      
      if (!map.has(val)) map.set(val, []);
      map.get(val)!.push(item);
    });

    const groups = Array.from(map.entries()).sort((a, b) => (a[0] ?? '').localeCompare(b[0] ?? ''));
    return groups.map(([groupName, items]) => {
      const currentPath = path ? `${path}|${groupName}` : groupName;
      return {
        groupName,
        path: currentPath,
        depth,
        itemsCount: items.length,
        children: buildGroups(items, keys, depth + 1, currentPath),
        isLeaf: depth === keys.length - 1
      };
    });
  };

  const groupedData = useMemo(() => {
    if (groupBys.length === 0) return null;
    return buildGroups(pivotData, groupBys);
  }, [pivotData, groupBys]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const totalPages = Math.ceil(pivotData.length / itemsPerPage)
  const paginatedData = pivotData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const handleExport = () => {
    if (pivotData.length === 0) return toast.warning('Tidak ada data untuk diekspor')
    
    // Construct AoA (Array of Arrays) for Excel with merged headers
    const aoa: any[][] = []
    
    // Header Row 1: grouping
    const headerRow1 = ['Nama Desa', 'Nama Relawan']
    uniquePrograms.forEach(p => {
      headerRow1.push(p, '', '', '', '') // spans 5 columns
    })
    headerRow1.push('TOTAL KESELURUHAN', '', '', '', '')
    aoa.push(headerRow1)
    
    // Header Row 2: sub-columns
    const headerRow2 = ['', ''] // under Desa & Relawan
    uniquePrograms.forEach(() => {
      headerRow2.push('Ajuan RI', 'Anggaran Dicairkan', 'Realisasi', 'Refund', 'Saldo')
    })
    headerRow2.push('Total Ajuan RI', 'Total Dicairkan', 'Total Realisasi', 'Total Refund', 'Total Saldo')
    aoa.push(headerRow2)
    
    // Data Rows
    pivotData.forEach(row => {
      const dataRow = [row.nama_desa, row.relawan_nama]
      uniquePrograms.forEach(pName => {
        const pData = row.programsData[pName]
        if (pData) {
          dataRow.push(pData.ajuan, pData.cair, pData.realisasi, pData.pengembalian, pData.sisa)
        } else {
          dataRow.push(0, 0, 0, 0, 0)
        }
      })
      // Add row total
      dataRow.push(row.rowTotal.ajuan, row.rowTotal.cair, row.rowTotal.realisasi, row.rowTotal.pengembalian, row.rowTotal.sisa)
      aoa.push(dataRow)
    })
    
    // Final Grand Totals row
    const totalsRow: (string | number)[] = ['GRAND TOTAL', '']
    uniquePrograms.forEach(pName => {
      // Calculate total for this specific column
      let sAjuan = 0, sCair = 0, sReali = 0, sPeng = 0, sSisa = 0
      pivotData.forEach(r => {
        if (r.programsData[pName]) {
          sAjuan += r.programsData[pName].ajuan
          sCair += r.programsData[pName].cair
          sReali += r.programsData[pName].realisasi
          sPeng += r.programsData[pName].pengembalian
          sSisa += r.programsData[pName].sisa
        }
      })
      totalsRow.push(sAjuan, sCair, sReali, sPeng, sSisa)
    })
    totalsRow.push(totals.totalAjuan, totals.totalCair, totals.totalRealisasi, totals.totalPengembalian, totals.totalSisa)
    aoa.push(totalsRow)

    const ws = XLSX.utils.aoa_to_sheet(aoa)
    
    // Merges for Header 1
    const merges = []
    // Merge Desa (Row 0-1, Col 0) and Relawan (Row 0-1, Col 1)
    merges.push({ s: {r:0, c:0}, e: {r:1, c:0} })
    merges.push({ s: {r:0, c:1}, e: {r:1, c:1} })
    
    // Merge Programs (Col 2-6, 7-11, etc.)
    let colIdx = 2
    uniquePrograms.forEach(() => {
      merges.push({ s: {r:0, c:colIdx}, e: {r:0, c:colIdx+4} })
      colIdx += 5
    })
    // Merge Total block
    merges.push({ s: {r:0, c:colIdx}, e: {r:0, c:colIdx+4} })
    
    ws['!merges'] = merges
    
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Rekap_Penyaluran')
    XLSX.writeFile(wb, `Rekap_Penyaluran_${new Date().getTime()}.xlsx`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[80vh] min-h-[400px]">
        <div className="animate-spin w-10 h-10 border-4 border-[#7a1200] border-t-transparent rounded-full"></div>
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
        <Card className="border-none shadow-sm rounded-2xl overflow-hidden bg-white border-l-4 border-l-[#7a1200]">
          <CardContent className="p-6">
            <div className="flex gap-4 items-center">
              <div className="w-12 h-12 rounded-xl bg-[#7a1200]/10 text-[#7a1200] flex items-center justify-center">
                <Wallet className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs font-bold font-mono text-[#7a1200]/70 uppercase tracking-widest mb-1">Total Anggaran Cair</p>
                <p className="text-2xl font-black text-[#7a1200]">Rp {totals.totalCair.toLocaleString('id-ID')}</p>
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
        <div className="flex flex-wrap gap-4 mb-6 items-start">
          <div className="w-full md:w-[300px] shrink-0 relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Cari kata kunci..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full min-h-[42px] pl-10 pr-4 py-2 rounded-xl border border-slate-200 focus:border-[#7a1200] focus:ring-4 focus:ring-[#7a1200]/10 transition-all outline-none text-sm text-slate-700 font-medium"
            />
          </div>
          <div className="flex flex-wrap gap-3 flex-1">
            <MultiSelectGroup 
              title="Filter Waktu"
              groups={[
                { key: 'tahun', title: 'Tahun', options: filterOptions.tahun, selected: filterTahun, onChange: setFilterTahun },
                { key: 'bulan', title: 'Bulan', options: filterOptions.bulan, selected: filterBulan, onChange: setFilterBulan }
              ]}
            />
            <MultiSelectGroup 
              title="Filter Desa & Relawan"
              groups={[
                { key: 'desa', title: 'Desa', options: filterOptions.desa, selected: filterDesa, onChange: setFilterDesa },
                { key: 'relawan', title: 'Relawan', options: filterOptions.relawan, selected: filterRelawan, onChange: setFilterRelawan }
              ]}
            />
            <MultiSelectGroup 
              title="Filter Sumber Dana & Kategori"
              groups={[
                { key: 'kategori', title: 'Kategori', options: filterOptions.kategori, selected: filterKategori, onChange: setFilterKategori },
                { key: 'sumberDana', title: 'Sumber Dana', options: filterOptions.sumberDana, selected: filterSumberDana, onChange: setFilterSumberDana }
              ]}
            />

            <Select value={itemsPerPage.toString()} onValueChange={(val) => setItemsPerPage(Number(val))}>
              <SelectTrigger className="w-full lg:w-[130px] bg-slate-50 border-slate-200 rounded-xl h-[42px]">
                <SelectValue placeholder="Baris" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="50">50 Baris</SelectItem>
                <SelectItem value="100">100 Baris</SelectItem>
                <SelectItem value="500">500 Baris</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex flex-col gap-2 w-full lg:w-auto">
              <Select value="none" onValueChange={(val) => { 
                if (val !== 'none' && !groupBys.includes(val)) {
                  setGroupBys(prev => [...prev, val]);
                  setExpandedGroups({}); 
                }
              }}>
                <SelectTrigger className="w-full lg:w-[220px] bg-slate-50 border-slate-200 rounded-xl h-[42px] font-bold text-slate-600">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-slate-400" />
                    <SelectValue placeholder="Tambah Group By..." />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tambah Group By...</SelectItem>
                  <SelectItem value="relawan">Berdasarkan Relawan</SelectItem>
                  <SelectItem value="desa">Berdasarkan Desa</SelectItem>
                </SelectContent>
              </Select>
              <div className="w-full lg:w-[220px]">
                <FavoriteGroupSelector 
                  moduleName="rekap_penyaluran" 
                  currentGroupBys={groupBys} 
                  onApplyFavorite={(groups) => {
                    setGroupBys(groups)
                    setExpandedGroups({})
                  }} 
                />
              </div>
              {groupBys.length > 0 && (
                <div className="flex flex-wrap gap-1 items-center">
                  {groupBys.map((g, idx) => (
                    <React.Fragment key={g}>
                      <Badge variant="secondary" className="bg-slate-200 text-slate-700 text-[10px] uppercase gap-1 flex items-center pr-1 h-6">
                        {g} 
                        <button onClick={() => {
                            setGroupBys(prev => prev.filter(v => v !== g));
                            setExpandedGroups({});
                        }} className="hover:bg-slate-300 p-0.5 rounded-full transition-colors">
                          <X className="w-3 h-3 hover:text-rose-600"/>
                        </button>
                      </Badge>
                      {idx < groupBys.length - 1 && <ChevronRight className="w-3 h-3 text-slate-300" />}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-full overflow-x-auto rounded-xl border border-slate-200 pb-2">
          <table className="w-full text-sm text-left">
            <thead className="text-[11px] uppercase bg-slate-50/80 text-slate-500 border-b border-slate-200">
              <tr>
                <th rowSpan={2} className="px-4 py-3.5 font-black tracking-widest min-w-[200px] border-r border-slate-200 bg-white sticky left-0 z-10 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">Desa & Relawan</th>
                {uniquePrograms.map(p => (
                  <th key={p} colSpan={5} className="px-4 py-2 text-center font-black tracking-widest border-r border-slate-200 bg-slate-100/50">{p}</th>
                ))}
                <th colSpan={5} className="px-4 py-2 text-center font-black tracking-widest bg-indigo-50/80 text-indigo-700">TOTAL KESELURUHAN</th>
              </tr>
              <tr className="border-t border-slate-200">
                {uniquePrograms.map(p => (
                  <React.Fragment key={p + '_sub'}>
                    <th className="px-3 py-2 text-right font-bold tracking-widest min-w-[100px] border-l border-slate-200">Ajuan RI</th>
                    <th className="px-3 py-2 text-right font-bold tracking-widest min-w-[100px] text-[#7a1200]">Cair</th>
                    <th className="px-3 py-2 text-right font-bold tracking-widest min-w-[100px] text-amber-600">Realisasi</th>
                    <th className="px-3 py-2 text-right font-bold tracking-widest min-w-[100px] text-rose-500">Refund</th>
                    <th className="px-3 py-2 text-right font-bold tracking-widest min-w-[120px] border-r border-slate-200">Saldo</th>
                  </React.Fragment>
                ))}
                <th className="px-3 py-2 text-right font-black tracking-widest min-w-[110px] border-l border-slate-300">Total Ajuan</th>
                <th className="px-3 py-2 text-right font-black tracking-widest min-w-[110px] text-[#7a1200]">Total Cair</th>
                <th className="px-3 py-2 text-right font-black tracking-widest min-w-[110px] text-amber-600">Total Realisasi</th>
                <th className="px-3 py-2 text-right font-black tracking-widest min-w-[110px] text-rose-500">Total Refund</th>
                <th className="px-3 py-2 text-right font-black tracking-widest min-w-[130px] text-indigo-700 bg-indigo-50/20">Total Saldo</th>
              </tr>
            </thead>
              <tbody className="divide-y divide-slate-100/80 font-medium">
                {(() => {
                  const renderDataRow = (row: any) => (
                    <tr key={`${row.nama_desa}_${row.relawan_nama}`} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-4 py-3 bg-white sticky left-0 z-10 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                        <div className="flex flex-col gap-1 pl-4">
                          <div className="font-bold text-slate-800 flex items-center gap-1.5 whitespace-nowrap">
                            <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span className="truncate max-w-[180px]">{row.nama_desa}</span>
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-1.5 whitespace-nowrap">
                            <User className="w-3 h-3 opacity-70 shrink-0" />
                            <span className="truncate max-w-[180px]">{row.relawan_nama}</span>
                          </div>
                        </div>
                      </td>
                      {uniquePrograms.map(p => {
                        const pData = row.programsData[p] || { ajuan: 0, cair: 0, realisasi: 0, pengembalian: 0, sisa: 0 }
                        return (
                          <React.Fragment key={`${row.nama_desa}_${p}`}>
                            <td className="px-3 py-3 text-right tabular-nums border-l border-slate-100/50">{pData.ajuan === 0 ? '-' : pData.ajuan.toLocaleString('id-ID')}</td>
                            <td className="px-3 py-3 text-right tabular-nums font-bold text-[#7a1200]/80">{pData.cair === 0 ? '-' : pData.cair.toLocaleString('id-ID')}</td>
                            <td className="px-3 py-3 text-right tabular-nums font-bold text-amber-600/80">{pData.realisasi === 0 ? '-' : pData.realisasi.toLocaleString('id-ID')}</td>
                            <td className="px-3 py-3 text-right tabular-nums text-rose-500/80">{pData.pengembalian === 0 ? '-' : pData.pengembalian.toLocaleString('id-ID')}</td>
                            <td className="px-3 py-3 text-right tabular-nums border-r border-slate-100/50">
                              <span className={`font-black px-1.5 py-0.5 rounded-md text-xs ${pData.sisa < 0 ? 'bg-rose-100/50 text-rose-600' : 'text-slate-500'}`}>
                                {pData.cair === 0 && pData.ajuan === 0 ? '-' : pData.sisa.toLocaleString('id-ID')}
                              </span>
                            </td>
                          </React.Fragment>
                        )
                      })}
                      <td className="px-3 py-3 text-right tabular-nums font-black border-l border-slate-300 bg-slate-50/50">{row.rowTotal.ajuan.toLocaleString('id-ID')}</td>
                      <td className="px-3 py-3 text-right tabular-nums font-black text-[#7a1200] bg-emerald-50/30">{row.rowTotal.cair.toLocaleString('id-ID')}</td>
                      <td className="px-3 py-3 text-right tabular-nums font-black text-amber-600 bg-amber-50/30">{row.rowTotal.realisasi.toLocaleString('id-ID')}</td>
                      <td className="px-3 py-3 text-right tabular-nums font-black text-rose-500 bg-rose-50/30">{row.rowTotal.pengembalian.toLocaleString('id-ID')}</td>
                      <td className="px-3 py-3 text-right tabular-nums font-black text-indigo-700 bg-indigo-50/50">{row.rowTotal.sisa.toLocaleString('id-ID')}</td>
                    </tr>
                  );

                  const renderGroupNodes = (nodes: any[]) => {
                    let rows: React.ReactNode[] = [];
                    nodes.forEach(node => {
                      rows.push(
                        <tr 
                          key={`group-${node.path}`}
                          className="bg-slate-100/50 hover:bg-slate-100 cursor-pointer transition-colors border-b border-slate-200"
                          onClick={() => toggleGroup(node.path)}
                        >
                          <td colSpan={1 + uniquePrograms.length * 5 + 5} className="px-4 py-3 sticky left-0 z-10 bg-slate-100/90 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                            <div className="flex items-center gap-2 font-black text-slate-800" style={{ paddingLeft: `${node.depth * 1.5}rem` }}>
                              {expandedGroups[node.path] ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                              <span className="uppercase tracking-tight">{node.groupName}</span>
                              <Badge variant="secondary" className="bg-slate-200 text-slate-600 ml-1">{node.itemsCount}</Badge>
                            </div>
                          </td>
                        </tr>
                      );
                      
                      if (expandedGroups[node.path]) {
                        if (node.isLeaf) {
                          node.children.forEach((row: any) => {
                            rows.push(renderDataRow(row));
                          });
                        } else {
                          rows.push(...renderGroupNodes(node.children));
                        }
                      }
                    });
                    return rows;
                  };

                  if (groupedData) {
                    return renderGroupNodes(groupedData);
                  } else if (paginatedData.length === 0) {
                    return (
                      <tr>
                        <td colSpan={1 + uniquePrograms.length * 5 + 5} className="px-4 py-12 text-center text-slate-400">
                          <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                          <p>Tidak ada data</p>
                        </td>
                      </tr>
                    );
                  } else {
                    return paginatedData.map(renderDataRow);
                  }
                })()}
              </tbody>
          </table>
        </div>

        {/* Pagination Setup */}
        {!groupedData && totalPages > 0 && (
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
