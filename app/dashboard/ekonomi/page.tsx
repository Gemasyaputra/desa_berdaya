'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  Plus, 
  Search, 
  TrendingUp, 
  Calendar, 
  User, 
  ExternalLink,
  ChevronRight,
  ChevronDown,
  Filter,
  Trash2,
  Edit,
  Check,
  LayoutGrid,
  List,
  Download,
  Clock
} from 'lucide-react'
import { getEkonomiUpdates, deleteEkonomiUpdate } from './actions'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MultiSelectGroup } from '@/components/ui/multi-select-group'
import { FavoriteGroupSelector } from '@/components/favorite-group-selector'
import { X, Layers } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from 'sonner'
import * as XLSX from 'xlsx'

export default function EkonomiPage() {
  const router = useRouter()
  const [updates, setUpdates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'selesai'>('all')
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [filters, setFilters] = useState({
    kelompok: [] as string[],
    bulan: [] as string[],
    kategori: [] as string[],
    tipe: [] as string[],
    program: [] as string[]
  })
  const [groupBys, setGroupBys] = useState<string[]>([])
  const [expandedTableGroups, setExpandedTableGroups] = useState<Record<string, boolean>>({})
  const [itemsPerPage, setItemsPerPage] = useState<number>(50)
  const [currentPage, setCurrentPage] = useState<number>(1)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter, filters, itemsPerPage])

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const data = await getEkonomiUpdates()
      setUpdates(data)
    } catch (err) {
      console.error(err)
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return
    try {
      await deleteEkonomiUpdate(id)
      toast.success('Data berhasil dihapus')
      loadData()
    } catch (err) {
      toast.error('Gagal menghapus data')
    }
  }

  const getBulanName = (month: number) => {
    const names = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]
    return names[month - 1] || '-'
  }

  const filterOptions = React.useMemo(() => {
    const getOptions = (excludeKey: keyof typeof filters) => {
      return updates.filter(u => {
        const matchSearch = u.nama_pm.toLowerCase().includes(searchQuery.toLowerCase()) || u.nik_pm.includes(searchQuery)
        const matchStatus = statusFilter === 'all' ? true : (statusFilter === 'pending' ? !u.checked : u.checked)
        
        const kelompokStr = u.nama_kelompok || 'Tanpa Kelompok'
        const matchKelompok = excludeKey === 'kelompok' || filters.kelompok.length === 0 || filters.kelompok.includes(kelompokStr)
        
        const bulanStr = getBulanName(u.bulan)
        const matchBulan = excludeKey === 'bulan' || filters.bulan.length === 0 || filters.bulan.includes(bulanStr)
        
        const kategoriStr = u.kategori || 'Tidak Ada'
        const matchKategori = excludeKey === 'kategori' || filters.kategori.length === 0 || filters.kategori.includes(kategoriStr)
        
        const tipeStr = u.tipe || 'Tidak Ada'
        const matchTipe = excludeKey === 'tipe' || filters.tipe.length === 0 || filters.tipe.includes(tipeStr)

        const progStr = u.program || 'Tidak Ada'
        const matchProgram = excludeKey === 'program' || filters.program.length === 0 || filters.program.includes(progStr)

        return matchSearch && matchStatus && matchKelompok && matchBulan && matchKategori && matchTipe && matchProgram
      })
    }

    return {
      kelompok: Array.from(new Set(getOptions('kelompok').map(u => u.nama_kelompok || 'Tanpa Kelompok'))).sort() as string[],
      bulan: Array.from(new Set(getOptions('bulan').map(u => getBulanName(u.bulan)))).sort((a,b) => {
         const months = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
         return months.indexOf(a) - months.indexOf(b)
      }) as string[],
      kategori: Array.from(new Set(getOptions('kategori').map(u => u.kategori || 'Tidak Ada'))).sort() as string[],
      tipe: Array.from(new Set(getOptions('tipe').map(u => u.tipe || 'Tidak Ada'))).sort() as string[],
      program: Array.from(new Set(getOptions('program').map(u => u.program || 'Tidak Ada'))).sort() as string[],
    }
  }, [updates, searchQuery, statusFilter, filters])

  const filteredUpdates = updates.filter(u => {
    const matchSearch = u.nama_pm.toLowerCase().includes(searchQuery.toLowerCase()) || u.nik_pm.includes(searchQuery)
    const matchStatus = statusFilter === 'all' ? true : (statusFilter === 'pending' ? !u.checked : u.checked)
    
    const kelompokStr = u.nama_kelompok || 'Tanpa Kelompok'
    const matchKelompok = filters.kelompok.length === 0 || filters.kelompok.includes(kelompokStr)
    
    const bulanStr = getBulanName(u.bulan)
    const matchBulan = filters.bulan.length === 0 || filters.bulan.includes(bulanStr)
    
    const kategoriStr = u.kategori || 'Tidak Ada'
    const matchKategori = filters.kategori.length === 0 || filters.kategori.includes(kategoriStr)
    
    const tipeStr = u.tipe || 'Tidak Ada'
    const matchTipe = filters.tipe.length === 0 || filters.tipe.includes(tipeStr)

    const progStr = u.program || 'Tidak Ada'
    const matchProgram = filters.program.length === 0 || filters.program.includes(progStr)

    return matchSearch && matchStatus && matchKelompok && matchBulan && matchKategori && matchTipe && matchProgram
  })

  const toggleFilter = (type: keyof typeof filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter(v => v !== value)
        : [...prev[type], value]
    }))
  }

  const clearFilters = () => {
    setFilters({ kelompok: [], bulan: [], kategori: [], tipe: [], program: [] })
  }

  const hasAnyFilter = Object.values(filters).some(arr => arr.length > 0)

  // Pagination for table mode
  const totalPages = Math.max(1, Math.ceil(filteredUpdates.length / itemsPerPage))
  const displayTableUpdates = filteredUpdates.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  const buildGroups = (data: any[], keys: string[], depth: number = 0, path: string = ''): any[] => {
    if (depth >= keys.length || keys.length === 0) return data;
    const keyType = keys[depth];
    const map = new Map<string, any[]>();
    
    data.forEach(item => {
      let val = 'Lain-lain';
      if (keyType === 'kelompok') val = item.nama_kelompok || 'Tanpa Kelompok';
      else if (keyType === 'bulan') val = getBulanName(item.bulan);
      else if (keyType === 'kategori') val = item.kategori || 'Tidak Ada';
      else if (keyType === 'tipe') val = item.tipe || 'Tidak Ada';
      else if (keyType === 'program') val = item.program || 'Tidak Ada';
      
      if (!map.has(val)) map.set(val, []);
      map.get(val)!.push(item);
    });

    const groups = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
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

  const groupedData = React.useMemo(() => {
    if (groupBys.length === 0) return null;
    return buildGroups(filteredUpdates, groupBys);
  }, [filteredUpdates, groupBys]);

  const toggleTableGroup = (path: string) => {
    setExpandedTableGroups(prev => ({ ...prev, [path]: !prev[path] }))
  }

  const groupedByKelompok = filteredUpdates.reduce((acc, curr) => {
    const kId = curr.kelompok_id || 'tanpa_kelompok'
    const kNama = curr.nama_kelompok || 'Tanpa Kelompok'
    
    if (!acc[kId]) {
      acc[kId] = {
        kelompok_id: kId,
        nama_kelompok: kNama,
        members: {}
      }
    }
    
    const pmId = curr.penerima_manfaat_id
    if (!acc[kId].members[pmId]) {
      acc[kId].members[pmId] = {
        penerima_manfaat_id: pmId,
        nama_pm: curr.nama_pm,
        nik_pm: curr.nik_pm,
        kategori: curr.kategori,
        updates: Array(12).fill(null)
      }
    }
    
    acc[kId].members[pmId].updates[curr.bulan - 1] = curr
    return acc
  }, {} as Record<string, any>)

  const groupsArray = Object.values(groupedByKelompok).map((g: any) => ({
    ...g,
    membersArray: Object.values(g.members)
  }))

  const toggleGroup = (kId: string) => {
    setExpandedGroups(prev => ({ ...prev, [kId]: !prev[kId] }))
  }



  const exportToExcel = () => {
    const dataToExport = filteredUpdates.map((u: any) => ({
      'Kelompok': u.nama_kelompok || 'Tanpa Kelompok',
      'Nama PM': u.nama_pm,
      'NIK': u.nik_pm,
      'Tahun': u.tahun,
      'Bulan': getBulanName(u.bulan),
      'Status Verifikasi': u.checked ? 'Selesai' : 'Draft',
      'Kategori': u.kategori || '',
      'Tipe Usaha': u.tipe || '',
      'Komoditas/Produk': u.komoditas_produk || '',
      'Program': u.program || '',
      'Jumlah Tanggungan': u.jumlah_tanggungan || 0,
      'Modal (Rp)': u.modal || 0,
      'Pengeluaran Operasional (Rp)': u.pengeluaran_operasional || 0,
      'Omzet (Rp)': u.omzet || 0,
      'Pendapatan Utama (Rp)': u.pendapatan || 0,
      'Pendapatan Lainnya (Rp)': u.pendapatan_lainnya || 0,
      'Status Golongan Kemiskinan': u.status_gk || '',
      'Nilai NTP': u.nilai_ntp || 0
    }))

    const worksheet = XLSX.utils.json_to_sheet(dataToExport)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Ekonomi")
    XLSX.writeFile(workbook, "Data_Ekonomi_Detail.xlsx")
  }

  return (
    <div className="p-4 lg:p-8 max-w-screen-2xl mx-auto space-y-8 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Update Ekonomi</h1>
            <p className="text-slate-500 text-sm font-medium">Monitoring Status Ekonomi Penerima Manfaat Secara Berkala.</p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
          <div className="flex items-center gap-4 px-5 py-2.5 bg-slate-50 border border-slate-100 rounded-2xl">
             <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
               <TrendingUp className="w-5 h-5" />
             </div>
             <div>
               <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-0.5">Update Bulan Ini</p>
               <p className="text-lg font-black text-slate-700 leading-none">
                 {updates.filter(u => u.bulan === new Date().getMonth() + 1).length} <span className="text-xs font-bold text-slate-400">Total</span>
               </p>
             </div>
          </div>
          <Button 
            onClick={() => router.push('/dashboard/ekonomi/tambah')}
            className="bg-[#7a1200] hover:bg-[#5a0d00] rounded-2xl px-6 h-full min-h-[3rem] font-bold shadow-lg shadow-[#7a1200]/20 gap-2 shrink-0"
          >
            <Plus className="w-5 h-5" />
            Tambah Update
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 overflow-hidden border-none p-6">
            <div className="flex flex-col md:flex-row flex-wrap gap-4 mb-6">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-4 w-5 h-5 text-slate-400 pointer-events-none top-1/2 -translate-y-1/2" />
                <input 
                  type="text" 
                  placeholder="Cari nama atau NIK..."
                  className="w-full bg-slate-50 rounded-xl pl-12 pr-4 h-[42px] border border-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all text-sm font-medium text-slate-800 placeholder:text-slate-400"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <MultiSelectGroup 
                title="Filter Data"
                groups={[
                  { key: 'kelompok', title: 'Kelompok', options: filterOptions.kelompok, selected: filters.kelompok, onChange: (val) => setFilters(f => ({ ...f, kelompok: val })) },
                  { key: 'bulan', title: 'Bulan', options: filterOptions.bulan, selected: filters.bulan, onChange: (val) => setFilters(f => ({ ...f, bulan: val })) },
                  { key: 'kategori', title: 'Kategori', options: filterOptions.kategori, selected: filters.kategori, onChange: (val) => setFilters(f => ({ ...f, kategori: val })) },
                  { key: 'tipe', title: 'Tipe Usaha', options: filterOptions.tipe, selected: filters.tipe, onChange: (val) => setFilters(f => ({ ...f, tipe: val })) },
                  { key: 'program', title: 'Program', options: filterOptions.program, selected: filters.program, onChange: (val) => setFilters(f => ({ ...f, program: val })) }
                ]}
              />

              {hasAnyFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-[42px] px-3 rounded-xl text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 font-bold gap-1 transition-colors"
                  onClick={clearFilters}
                >
                  <X className="w-4 h-4" />
                  Reset
                </Button>
              )}
              
              {viewMode === 'table' && (
                <div className="flex flex-col gap-2 w-full lg:w-auto ml-auto">
                  <Select value="none" onValueChange={(val) => { 
                    if (val !== 'none' && !groupBys.includes(val)) {
                      setGroupBys(prev => [...prev, val]);
                      setExpandedTableGroups({}); 
                    }
                  }}>
                    <SelectTrigger className="w-full lg:w-[220px] bg-white border-slate-200 rounded-xl h-[42px] font-bold text-slate-600">
                      <div className="flex items-center gap-2">
                        <Layers className="w-4 h-4 text-slate-400" />
                        <SelectValue placeholder="Tambah Group By..." />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Tambah Group By...</SelectItem>
                      <SelectItem value="kelompok">Berdasarkan Kelompok</SelectItem>
                      <SelectItem value="bulan">Berdasarkan Bulan</SelectItem>
                      <SelectItem value="kategori">Berdasarkan Kategori</SelectItem>
                      <SelectItem value="tipe">Berdasarkan Tipe Usaha</SelectItem>
                      <SelectItem value="program">Berdasarkan Program</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="w-full lg:w-[220px]">
                    <FavoriteGroupSelector 
                      moduleName="ekonomi" 
                      currentGroupBys={groupBys} 
                      onApplyFavorite={(groups) => {
                        setGroupBys(groups)
                        setExpandedTableGroups({})
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
                                setExpandedTableGroups({});
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
              )}

              <select 
                className="bg-slate-50 rounded-xl px-4 h-[42px] border border-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-sm font-medium text-slate-800"
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
              >
                <option value={10}>10 Baris</option>
                <option value={20}>20 Baris</option>
                <option value={50}>50 Baris</option>
                <option value={100}>100 Baris</option>
                <option value={999999}>Semua Data</option>
              </select>
            </div>
            <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
              <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-xl">
                <Button 
                  variant={statusFilter === 'all' ? 'default' : 'ghost'} 
                  size="sm" 
                  onClick={() => setStatusFilter('all')}
                  className={`rounded-lg h-8 px-4 ${statusFilter === 'all' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >Semua</Button>
                <Button 
                  variant={statusFilter === 'pending' ? 'default' : 'ghost'} 
                  size="sm" 
                  onClick={() => setStatusFilter('pending')}
                  className={`rounded-lg h-8 px-4 ${statusFilter === 'pending' ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm' : 'text-slate-500 hover:text-amber-600'}`}
                >Pending</Button>
                <Button 
                  variant={statusFilter === 'selesai' ? 'default' : 'ghost'} 
                  size="sm" 
                  onClick={() => setStatusFilter('selesai')}
                  className={`rounded-lg h-8 px-4 ${statusFilter === 'selesai' ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm' : 'text-slate-500 hover:text-emerald-600'}`}
                >Selesai</Button>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="flex items-center bg-slate-100 p-1 rounded-xl">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`rounded-lg h-8 px-3 ${viewMode === 'grid' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                    onClick={() => setViewMode('grid')}
                  >
                    <LayoutGrid className="w-4 h-4 mr-2" />
                    Grid
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`rounded-lg h-8 px-3 ${viewMode === 'table' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                    onClick={() => setViewMode('table')}
                  >
                    <List className="w-4 h-4 mr-2" />
                    Table
                  </Button>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={exportToExcel}
                  className="rounded-xl border-emerald-200 text-emerald-700 hover:bg-emerald-50 h-10 px-4"
                >
                  <Download className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Export Excel</span>
                </Button>
              </div>
            </div>

            {loading ? (
              <div className="py-12 text-center text-slate-400 font-medium">Memuat data...</div>
            ) : filteredUpdates.length === 0 ? (
              <div className="py-12 text-center text-slate-400 font-medium italic">Tidak ada data ditemukan</div>
            ) : viewMode === 'table' ? (
              <div className="space-y-4">
                <div className="overflow-x-auto border border-slate-300 bg-white">
                <table className="w-full text-sm text-left border-collapse whitespace-nowrap">
                  <thead className="bg-[#f8f9fa] text-[11px] font-bold text-slate-700 border-b-2 border-slate-300">
                    <tr>
                      <th className="px-3 py-2 min-w-[80px] sticky left-0 bg-[#f8f9fa] z-20 border border-slate-300 text-center">Aksi</th>
                      <th className="px-3 py-2 min-w-[200px] sticky left-[80px] bg-[#f8f9fa] z-20 border border-slate-300 shadow-[2px_0_0_0_#cbd5e1]">Kelompok & PM</th>
                      <th className="px-3 py-2 min-w-[80px] border border-slate-300 text-center">Tahun</th>
                      <th className="px-3 py-2 min-w-[100px] border border-slate-300 text-center">Bulan</th>
                      <th className="px-3 py-2 min-w-[100px] border border-slate-300 text-center">Status</th>
                      <th className="px-3 py-2 min-w-[120px] border border-slate-300">Kategori</th>
                      <th className="px-3 py-2 min-w-[120px] border border-slate-300">Tipe Usaha</th>
                      <th className="px-3 py-2 min-w-[150px] border border-slate-300">Komoditas/Produk</th>
                      <th className="px-3 py-2 min-w-[150px] border border-slate-300">Program</th>
                      <th className="px-3 py-2 min-w-[100px] border border-slate-300 text-right">Jml Tanggungan</th>
                      <th className="px-3 py-2 min-w-[120px] border border-slate-300 text-right">Modal (Rp)</th>
                      <th className="px-3 py-2 min-w-[150px] border border-slate-300 text-right">Pengeluaran (Rp)</th>
                      <th className="px-3 py-2 min-w-[120px] border border-slate-300 text-right">Omzet (Rp)</th>
                      <th className="px-3 py-2 min-w-[150px] border border-slate-300 text-right">Pend. Utama (Rp)</th>
                      <th className="px-3 py-2 min-w-[150px] border border-slate-300 text-right">Pend. Lainnya (Rp)</th>
                      <th className="px-3 py-2 min-w-[120px] border border-slate-300">Status GK</th>
                      <th className="px-3 py-2 min-w-[100px] border border-slate-300 text-right">Nilai NTP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {(() => {
                      const renderDataRow = (update: any) => (
                        <tr key={update.id} className="hover:bg-emerald-50/50 transition-colors group/row">
                          <td className="px-3 py-2 sticky left-0 bg-white group-hover/row:bg-emerald-50/50 z-10 border border-slate-300 text-center">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100"
                              onClick={() => router.push(`/dashboard/ekonomi/${update.id}/edit`)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                          </td>
                          <td className="px-3 py-2 sticky left-[80px] bg-white group-hover/row:bg-emerald-50/50 z-10 border border-slate-300 shadow-[2px_0_0_0_#cbd5e1]">
                            <div className="font-semibold text-slate-800">{update.nama_pm}</div>
                            <div className="text-[10px] text-slate-500 font-medium">{update.nik_pm}</div>
                            <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">{update.nama_kelompok || 'Tanpa Kelompok'}</div>
                          </td>
                          <td className="px-3 py-2 border border-slate-300 text-center">{update.tahun}</td>
                          <td className="px-3 py-2 border border-slate-300 text-center font-medium">{getBulanName(update.bulan)}</td>
                          <td className="px-3 py-2 border border-slate-300 text-center">
                            {update.checked ? (
                              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 font-bold text-[10px]">Selesai</Badge>
                            ) : (
                              <Badge variant="secondary" className="bg-amber-100 text-amber-700 font-bold text-[10px]">Draft</Badge>
                            )}
                          </td>
                          <td className="px-3 py-2 border border-slate-300">{update.kategori || '-'}</td>
                          <td className="px-3 py-2 border border-slate-300">{update.tipe || '-'}</td>
                          <td className="px-3 py-2 border border-slate-300">{update.komoditas_produk || '-'}</td>
                          <td className="px-3 py-2 border border-slate-300">{update.program || '-'}</td>
                          <td className="px-3 py-2 border border-slate-300 text-right">{update.jumlah_tanggungan || 0}</td>
                          <td className="px-3 py-2 border border-slate-300 text-right">{update.modal?.toLocaleString('id-ID') || 0}</td>
                          <td className="px-3 py-2 border border-slate-300 text-right">{update.pengeluaran_operasional?.toLocaleString('id-ID') || 0}</td>
                          <td className="px-3 py-2 border border-slate-300 text-right">{update.omzet?.toLocaleString('id-ID') || 0}</td>
                          <td className="px-3 py-2 border border-slate-300 text-right">{update.pendapatan?.toLocaleString('id-ID') || 0}</td>
                          <td className="px-3 py-2 border border-slate-300 text-right">{update.pendapatan_lainnya?.toLocaleString('id-ID') || 0}</td>
                          <td className="px-3 py-2 border border-slate-300">{update.status_gk || '-'}</td>
                          <td className="px-3 py-2 border border-slate-300 text-right">{update.nilai_ntp || 0}</td>
                        </tr>
                      );

                      const renderGroupNodes = (nodes: any[]) => {
                        let rows: React.ReactNode[] = [];
                        nodes.forEach(node => {
                          rows.push(
                            <tr 
                              key={`group-${node.path}`}
                              className="bg-slate-50/50 hover:bg-slate-100 cursor-pointer transition-colors border-b border-slate-200"
                              onClick={() => toggleTableGroup(node.path)}
                            >
                              <td colSpan={17} className="px-3 py-2 sticky left-0 z-20 bg-slate-50/90 shadow-[2px_0_0_0_#cbd5e1]">
                                <div className="flex items-center gap-2 font-black text-slate-800" style={{ paddingLeft: `${node.depth * 1.5}rem` }}>
                                  {expandedTableGroups[node.path] ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                                  <span className="uppercase tracking-tight">{node.groupName}</span>
                                  <Badge variant="secondary" className="bg-slate-200 text-slate-600 ml-1">{node.itemsCount}</Badge>
                                </div>
                              </td>
                            </tr>
                          );
                          
                          if (expandedTableGroups[node.path]) {
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
                      } else {
                        return displayTableUpdates.map(renderDataRow);
                      }
                    })()}
                  </tbody>
                </table>
              </div>
              {(!groupedData || groupBys.length === 0) && (
                <div className="flex items-center justify-between text-sm text-slate-500 py-4">
                  <div>
                    Menampilkan {displayTableUpdates.length} dari {filteredUpdates.length} data
                  </div>
                  {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 shadow-sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Sebelumnya
                    </Button>
                    <span className="font-medium px-2">Page {currentPage} of {totalPages}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 shadow-sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Selanjutnya
                    </Button>
                  </div>
                )}
              </div>
              )}
            </div>
            ) : (
              <div className="space-y-6">
                {groupsArray.map((group: any) => {
                  const isExpanded = expandedGroups[group.kelompok_id]
                  return (
                    <div key={group.kelompok_id} className="bg-white border text-black border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                      {/* Accordion Header */}
                      <div 
                        onClick={() => toggleGroup(group.kelompok_id)}
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <TrendingUp className="w-5 h-5" />
                          </div>
                          <div>
                            <h2 className="font-bold text-slate-800 text-lg">{group.nama_kelompok}</h2>
                            <p className="text-xs text-slate-500 font-medium">{group.membersArray.length} Anggota PM</p>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-slate-600 pointer-events-none">
                          {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                        </Button>
                      </div>

                      {/* Accordion Content */}
                      {isExpanded && (
                        <div className="p-4 pt-0 border-t border-slate-100 bg-slate-50/50">
                          <div className="space-y-4 mt-4">
                            {group.membersArray.map((person: any) => (
                              <div key={person.penerima_manfaat_id} className="p-5 bg-white rounded-xl border border-slate-200 hover:border-emerald-200 hover:shadow-md transition-all">
                                <div className="flex items-center gap-4 mb-4">
                                  <div className="w-12 h-12 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 font-bold text-xs group-hover:bg-emerald-50 group-hover:text-emerald-600 transition-colors uppercase">
                                    #PM
                                  </div>
                                  <div>
                                    <h3 className="font-bold text-slate-800 tracking-tight">{person.nama_pm}</h3>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{person.nik_pm}</p>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                      <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 font-bold text-[10px] px-2 py-0 border-none">
                                        {person.kategori || 'Ekonomi'}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                
                                <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 mt-4 pt-4 border-t border-slate-50">
                                  {person.updates.map((update: any, idx: number) => {
                                    const monthName = getBulanName(idx + 1).substring(0, 3)
                                    if (!update) {
                                      return (
                                        <div key={`empty-${idx}`} className="flex flex-col items-center justify-center py-2 rounded-xl bg-slate-50 border border-slate-100 opacity-50">
                                          <span className="text-[10px] font-bold text-slate-400">{monthName}</span>
                                          <div className="w-2 h-2 rounded-full bg-slate-300 mt-1"></div>
                                        </div>
                                      )
                                    }
                                    return (
                                      <div 
                                        key={`update-${update.id}`}
                                        onClick={() => router.push(`/dashboard/ekonomi/${update.id}/edit`)}
                                        className={`group flex flex-col items-center justify-center py-2 rounded-xl border cursor-pointer transition-all hover:scale-105 shadow-sm ${
                                          update.checked 
                                            ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100 hover:border-emerald-300 border-solid' 
                                            : (update.kategori && update.kategori !== '-'
                                                ? 'bg-amber-50 border-amber-200 hover:bg-amber-100 hover:border-amber-300 border-solid'
                                                : 'bg-white border-slate-200 border-dashed hover:border-amber-400 hover:bg-amber-50/50 border-2')
                                        }`}
                                        title={update.checked ? 'Selesai' : (update.kategori && update.kategori !== '-' ? 'Sudah Diisi (Draft) - Perlu Verify' : 'Belum Diisi - Klik untuk isi')}
                                      >
                                        <span className={`text-[10px] font-bold transition-colors ${update.checked ? 'text-emerald-700' : (update.kategori && update.kategori !== '-' ? 'text-amber-700' : 'text-slate-400 group-hover:text-amber-600')}`}>{monthName}</span>
                                        {update.checked ? (
                                          <Check className="w-3 h-3 text-emerald-500 mt-0.5 transition-colors" strokeWidth={4} />
                                        ) : (
                                          update.kategori && update.kategori !== '-' ? (
                                            <div className="w-2 h-2 rounded-full mt-1 bg-amber-500 transition-colors"></div>
                                          ) : (
                                            <Plus className="w-3 h-3 text-slate-300 group-hover:text-amber-500 mt-0.5 transition-colors" strokeWidth={4} />
                                          )
                                        )}
                                      </div>
                                    )
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
      </div>
    </div>
  )
}
