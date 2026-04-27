'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { 
  Receipt, 
  ArrowLeft,
  Search,
  FileText,
  Building2,
  Target,
  User,
  ExternalLink,
  Loader2,
  CheckCircle2,
  X,
  Link2,
  ChevronDown,
  ChevronRight,
  Layers
} from 'lucide-react'
import { MultiSelectGroup } from '@/components/ui/multi-select-group'
import { FavoriteGroupSelector } from '@/components/favorite-group-selector'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  getAllLaporanKeuanganEntries,
  verifyCA,
  verifyPengembalian,
  updateCatatanRelawan
} from '../actions'

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

export default function SemuaLaporanKeuanganPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState<string>('Semua')
  const [sortBulan, setSortBulan] = useState<'asc' | 'desc'>('asc')
  
  const [groupBys, setGroupBys] = useState<string[]>([])
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({})
  
  const [filters, setFilters] = useState({
    desa: [] as string[],
    program: [] as string[],
    relawan: [] as string[],
    sumber_dana: [] as string[],
    tahun: [] as string[],
  })
  
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [verifyingId, setVerifyingId] = useState<number | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const router = useRouter()
  const { data: session } = useSession()
  const user = session?.user as any
  const isAdminOrFinance = user?.role === 'ADMIN' || user?.role === 'FINANCE' || user?.role === 'MONEV'

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const res = await getAllLaporanKeuanganEntries()
      setData(res)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (anggaranId: number, status: any, catatan: string) => {
    setVerifyingId(anggaranId)
    try {
      await verifyCA(anggaranId, status, catatan)
      toast.success('Status verifikasi diperbarui')
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Gagal memperbarui status')
    } finally {
      setVerifyingId(null)
    }
  }

  const handleVerifyPengembalian = async (anggaranId: number, status: any, catatan: string) => {
    setVerifyingId(anggaranId)
    try {
      await verifyPengembalian(anggaranId, status, catatan)
      toast.success('Status pengembalian berhasil diupdate')
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Gagal verifikasi pengembalian')
    } finally {
      setVerifyingId(null)
    }
  }

  const handleUpdateCatatan = async (anggaranId: number, catatan: string) => {
    try {
      await updateCatatanRelawan(anggaranId, catatan)
      toast.success('Catatan disimpan')
    } catch (err: any) {
      toast.error('Gagal menyimpan catatan')
    }
  }

  const isImage = (url: string) => /\.(jpeg|jpg|gif|png|webp|avif)/i.test(url)

  const renderBukti = (urlStr: string) => {
    if (!urlStr) return <span className="text-[10px] font-bold text-slate-300">-</span>
    
    let entries: any[] = []
    try {
      if (urlStr.trim().startsWith('[')) {
        entries = JSON.parse(urlStr)
      } else {
        entries = [{ id: 'legacy', deskripsi: 'Upload Sebelumnya', urls: urlStr.split(',').filter(Boolean) }]
      }
    } catch {
      entries = []
    }

    const allUrls = entries.flatMap(e => e.urls || [])
    if (allUrls.length === 0) return <span className="text-[10px] font-bold text-slate-300">-</span>

    const hasRejected = entries.some(e => e.ditolak)

    return (
      <div className="flex flex-col items-center justify-center gap-1.5">
        <div className="relative">
          <button 
            className="inline-flex items-center justify-center gap-1.5 text-[10px] font-bold py-1.5 px-2.5 rounded-md transition-colors border whitespace-nowrap text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200"
          >
            <FileText className="w-3 h-3" />
            {entries.length} File
          </button>
          {hasRejected && (
            <div className="absolute -top-1 -right-1 flex h-2.5 w-2.5" title="Ada Laporan yang Ditolak!">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </div>
          )}
        </div>
      </div>
    )
  }

  const getRealisasiAndSisa = (a: any) => {
    let realisasi = 0;
    if (a.bukti_ca_url) {
      try {
        const entries = JSON.parse(a.bukti_ca_url);
        realisasi = entries.filter((e: any) => !e.ditolak).reduce((acc: number, val: any) => acc + (Number(val.nominal) || 0), 0);
      } catch {}
    }
    
    let pengembalian = 0;
    if (a.bukti_pengembalian_url) {
      try {
        const entries = JSON.parse(a.bukti_pengembalian_url);
        pengembalian = entries.filter((e: any) => !e.ditolak).reduce((acc: number, val: any) => acc + (Number(val.nominal) || 0), 0);
      } catch {}
    }

    const cair = parseInt(a.anggaran_dicairkan) || 0;
    const sisa = cair - realisasi - pengembalian;
    return { realisasi, sisa, pengembalian };
  }

  const filterOptions = useMemo(() => {
    const getOptions = (excludeKey: keyof typeof filters) => {
      return data.filter(item => {
        const term = search.toLowerCase()
        const matchSearch = !term || (
          (item.nama_desa || '').toLowerCase().includes(term) ||
          (item.nama_program || '').toLowerCase().includes(term) ||
          (item.nama_relawan || '').toLowerCase().includes(term) ||
          (item.sumber_dana || '').toLowerCase().includes(term)
        )

        const matchStatus = filterStatus === 'Semua' || item.status_ca === filterStatus

        const matchDesa = excludeKey === 'desa' || filters.desa.length === 0 || filters.desa.includes(item.nama_desa || 'Tanpa Desa')
        const matchProgram = excludeKey === 'program' || filters.program.length === 0 || filters.program.includes(item.nama_program || 'Tanpa Program')
        const matchRelawan = excludeKey === 'relawan' || filters.relawan.length === 0 || filters.relawan.includes(item.nama_relawan || 'Tanpa Relawan')
        const matchSumber = excludeKey === 'sumber_dana' || filters.sumber_dana.length === 0 || filters.sumber_dana.includes(item.sumber_dana || 'Tidak Ada')
        const matchTahun = excludeKey === 'tahun' || filters.tahun.length === 0 || filters.tahun.includes((item.tahun || '').toString())

        return matchSearch && matchStatus && matchDesa && matchProgram && matchRelawan && matchSumber && matchTahun
      })
    }

    return {
      desa: Array.from(new Set(getOptions('desa').map(i => i.nama_desa || 'Tanpa Desa'))).sort() as string[],
      program: Array.from(new Set(getOptions('program').map(i => i.nama_program || 'Tanpa Program'))).sort() as string[],
      relawan: Array.from(new Set(getOptions('relawan').map(i => i.nama_relawan || 'Tanpa Relawan'))).sort() as string[],
      sumber_dana: Array.from(new Set(getOptions('sumber_dana').map(i => i.sumber_dana || 'Tidak Ada'))).sort() as string[],
      tahun: Array.from(new Set(getOptions('tahun').map(i => (i.tahun || '').toString()))).sort((a,b) => Number(b) - Number(a)) as string[],
    }
  }, [data, search, filterStatus, filters])

  let filtered = data.filter(item => {
    const term = search.toLowerCase()
    const matchSearch = !term || (
      (item.nama_desa || '').toLowerCase().includes(term) ||
      (item.nama_program || '').toLowerCase().includes(term) ||
      (item.nama_relawan || '').toLowerCase().includes(term) ||
      (item.sumber_dana || '').toLowerCase().includes(term)
    )
    if (!matchSearch) return false

    if (filterStatus !== 'Semua' && item.status_ca !== filterStatus) return false
    
    const matchDesa = filters.desa.length === 0 || filters.desa.includes(item.nama_desa || 'Tanpa Desa')
    const matchProgram = filters.program.length === 0 || filters.program.includes(item.nama_program || 'Tanpa Program')
    const matchRelawan = filters.relawan.length === 0 || filters.relawan.includes(item.nama_relawan || 'Tanpa Relawan')
    const matchSumber = filters.sumber_dana.length === 0 || filters.sumber_dana.includes(item.sumber_dana || 'Tidak Ada')
    const matchTahun = filters.tahun.length === 0 || filters.tahun.includes((item.tahun || '').toString())

    return matchDesa && matchProgram && matchRelawan && matchSumber && matchTahun
  })

  const toggleFilter = (type: keyof typeof filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter(v => v !== value)
        : [...prev[type], value]
    }))
    setCurrentPage(1)
  }

  const hasAnyFilter = search !== '' || filterStatus !== 'Semua' || Object.values(filters).some(arr => arr.length > 0)

  const uniqueTahun = Array.from(new Set(data.map((a: any) => a.tahun))).sort()
  
  const monthOrder: Record<string, number> = {
    'Januari': 1, 'Februari': 2, 'Maret': 3, 'April': 4, 'Mei': 5, 'Juni': 6,
    'Juli': 7, 'Agustus': 8, 'September': 9, 'Oktober': 10, 'November': 11, 'Desember': 12
  };
  
  filtered = [...filtered].sort((a, b) => {
    const monthA = isNaN(Number(a.bulan)) ? (monthOrder[a.bulan] || 0) : Number(a.bulan);
    const monthB = isNaN(Number(b.bulan)) ? (monthOrder[b.bulan] || 0) : Number(b.bulan);
    if (sortBulan === 'asc') return monthA - monthB;
    return monthB - monthA;
  });

  const buildGroups = (data: any[], keys: string[], depth: number = 0, path: string = ''): any[] => {
    if (depth >= keys.length || keys.length === 0) return data;
    const keyType = keys[depth];
    const map = new Map<string, any[]>();
    
    data.forEach(item => {
      let val = 'Lain-lain';
      if (keyType === 'relawan') val = item.nama_relawan || 'Tanpa Relawan';
      else if (keyType === 'desa') val = item.nama_desa || 'Tanpa Desa';
      else if (keyType === 'program') val = item.nama_program || 'Tanpa Program';
      else if (keyType === 'sumber_dana') val = item.sumber_dana || 'Tidak Ada';
      else if (keyType === 'tahun') val = (item.tahun || '').toString() || 'Tidak Ada Tahun';
      
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

  const groupedData = useMemo(() => {
    if (groupBys.length === 0) return null;
    return buildGroups(filtered, groupBys);
  }, [filtered, groupBys]);

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages);
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 bg-slate-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl border-slate-200 shrink-0" onClick={() => router.push('/dashboard/laporan-keuangan-intervensi')}>
            <ArrowLeft className="w-6 h-6 text-slate-600" />
          </Button>
          <div className="w-14 h-14 bg-[#7a1200]/10 border border-[#7a1200]/20 rounded-2xl flex items-center justify-center shrink-0">
            <Receipt className="w-7 h-7 text-[#7a1200]" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800">Semua Detail Anggaran & Laporan</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">Lihat seluruh riwayat laporan keuangan dari semua desa & program</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative w-full md:w-64 group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#7a1200] transition-colors" />
            <Input
              placeholder="Cari desa, program, relawan..."
              className="pl-11 h-10 w-full rounded-2xl border-slate-200 bg-white text-sm shadow-sm focus:border-[#7a1200]/40 focus:ring-4 focus:ring-[#7a1200]/5 transition-all"
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
            />
          </div>
        </div>
      </div>


      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
          <Loader2 className="w-10 h-10 text-[#7a1200] animate-spin" />
          <p className="text-slate-500 font-medium">Memuat semua data laporan keuangan...</p>
        </div>
      ) : (
        <Card className="border-none shadow-2xl shadow-slate-200/40 rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-100 px-8 py-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#7a1200]/10 flex items-center justify-center">
                <Receipt className="w-4 h-4 text-[#7a1200]" />
              </div>
              <CardTitle className="text-lg font-bold text-slate-800">Daftar Anggaran &amp; Bukti CA</CardTitle>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Status Pill Group */}
              <div className="flex items-center bg-slate-100 p-1 rounded-2xl gap-0.5">
                {[
                  { key: 'Semua',        label: 'Semua',        dot: 'bg-slate-400' },
                  { key: 'BELUM',        label: 'Belum Upload', dot: 'bg-rose-400' },
                  { key: 'UPLOADED',     label: 'Uploaded',     dot: 'bg-amber-400' },
                  { key: 'DIVERIFIKASI', label: 'Diverifikasi', dot: 'bg-emerald-500' },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => { setFilterStatus(opt.key); setCurrentPage(1) }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap ${
                      filterStatus === opt.key
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${opt.dot}`} />
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="h-6 w-px bg-slate-200 hidden sm:block" />

              <MultiSelectGroup 
                title="Filter Data"
                groups={[
                  { key: 'desa', title: 'Desa', options: filterOptions.desa, selected: filters.desa, onChange: (val) => { setFilters(f => ({ ...f, desa: val })); setCurrentPage(1) } },
                  { key: 'program', title: 'Program', options: filterOptions.program, selected: filters.program, onChange: (val) => { setFilters(f => ({ ...f, program: val })); setCurrentPage(1) } },
                  { key: 'relawan', title: 'Relawan', options: filterOptions.relawan, selected: filters.relawan, onChange: (val) => { setFilters(f => ({ ...f, relawan: val })); setCurrentPage(1) } },
                  { key: 'sumber_dana', title: 'Sumber Dana', options: filterOptions.sumber_dana, selected: filters.sumber_dana, onChange: (val) => { setFilters(f => ({ ...f, sumber_dana: val })); setCurrentPage(1) } },
                  { key: 'tahun', title: 'Tahun', options: filterOptions.tahun, selected: filters.tahun, onChange: (val) => { setFilters(f => ({ ...f, tahun: val })); setCurrentPage(1) } }
                ]}
              />
              
              {hasAnyFilter && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-9 px-3 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 font-bold gap-1 transition-colors"
                  onClick={() => {
                    setSearch('')
                    setFilterStatus('Semua')
                    setFilters({ desa: [], program: [], relawan: [], sumber_dana: [], tahun: [] })
                    setCurrentPage(1)
                  }}
                >
                  <X className="w-4 h-4" />
                  Reset
                </Button>
              )}

              <div className="h-6 w-px bg-slate-200 hidden sm:block" />

              {/* Sort Select */}
              <div className="relative">
                <select
                  value={sortBulan}
                  onChange={(e) => setSortBulan(e.target.value as 'asc' | 'desc')}
                  className="appearance-none pl-3 pr-8 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#7a1200]/20 focus:border-[#7a1200]/40 cursor-pointer transition-all"
                >
                  <option value="asc">↑ Jan → Des</option>
                  <option value="desc">↓ Des → Jan</option>
                </select>
                <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>
              {/* Group By Select */}
              <div className="flex items-center gap-2">
                <Select
                  value="none"
                  onValueChange={(val) => {
                    if (val !== 'none' && !groupBys.includes(val)) {
                      setGroupBys(prev => [...prev, val]);
                      setExpandedGroups({});
                    }
                  }}
                >
                  <SelectTrigger className="w-[180px] h-9 text-xs rounded-xl border-slate-200">
                    <SelectValue placeholder="Tambah Group By..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Tambah Group By...</SelectItem>
                    <SelectItem value="relawan">Berdasarkan Relawan</SelectItem>
                    <SelectItem value="desa">Berdasarkan Desa</SelectItem>
                    <SelectItem value="program">Berdasarkan Program</SelectItem>
                    <SelectItem value="sumber_dana">Berdasarkan Sumber Dana</SelectItem>
                    <SelectItem value="tahun">Berdasarkan Tahun</SelectItem>
                  </SelectContent>
                </Select>
                <FavoriteGroupSelector 
                  moduleName="laporan_keuangan_semua" 
                  currentGroupBys={groupBys} 
                  onApplyFavorite={(groups) => {
                    setGroupBys(groups)
                    setExpandedGroups({})
                  }} 
                />
              </div>
            </div>
            
            {/* Active Group Bys Row */}
            {groupBys.length > 0 && (
              <div className="flex flex-wrap gap-1 items-center pt-2 border-t border-slate-100 w-full mt-3">
                {groupBys.map((g, idx) => (
                  <div key={g} className="flex items-center gap-1">
                    <div className="bg-slate-200 text-slate-700 text-[10px] uppercase font-bold px-2 py-1 rounded flex items-center gap-1">
                      {g} 
                      <button onClick={() => {
                          setGroupBys(prev => prev.filter(v => v !== g));
                          setExpandedGroups({});
                      }} className="hover:bg-slate-300 p-0.5 rounded-full transition-colors">
                        <X className="w-3 h-3 hover:text-rose-600"/>
                      </button>
                    </div>
                    {idx < groupBys.length - 1 && <ChevronRight className="w-3 h-3 text-slate-300" />}
                  </div>
                ))}
              </div>
            )}
          </CardHeader>
          
          <CardContent className="p-0">
            {paginatedData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Receipt className="w-12 h-12 text-slate-300" />
                <p className="font-bold text-slate-600">Tidak ada data ditemukan</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-b-[2rem] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] relative">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase tracking-widest sticky top-0 z-30 shadow-sm">
                    <tr>
                      <th className="px-4 py-3 sticky left-0 z-40 bg-slate-50 shadow-[1px_0_0_#f1f5f9]">Bulan</th>
                      <th className="px-4 py-3">Desa & Program</th>
                      <th className="px-4 py-3">Ajuan</th>
                      <th className="px-4 py-3">Cair</th>
                      <th className="px-4 py-3">Realisasi</th>
                      <th className="px-4 py-3">Sisa Saldo</th>
                      <th className="px-4 py-3 text-center">Bukti CA</th>
                      <th className="px-4 py-3 text-center">Pengembalian</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3">Catatan/Feedback</th>
                      {isAdminOrFinance && (
                        <>
                          <th className="px-4 py-3 text-center">Verif CA</th>
<th className="px-4 py-3 text-center">Verif Refund</th>
                        </>
                      )}
                      <th className="px-4 py-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(() => {
                      const renderDataRow = (a: any) => {
                        const { realisasi, sisa } = getRealisasiAndSisa(a);
                        const rowBg = a.status_ca === 'DIVERIFIKASI' ? 'bg-emerald-50' : a.status_ca === 'UPLOADED' ? 'bg-amber-50' : 'bg-rose-50';
                        const rowHoverBg = a.status_ca === 'DIVERIFIKASI' ? 'hover:bg-emerald-100' : a.status_ca === 'UPLOADED' ? 'hover:bg-amber-100' : 'hover:bg-rose-100';
                        const statusShadow = a.status_ca === 'DIVERIFIKASI' ? 'shadow-[inset_4px_0_0_0_#10b981,1px_0_0_0_#f1f5f9]' : a.status_ca === 'UPLOADED' ? 'shadow-[inset_4px_0_0_0_#f59e0b,1px_0_0_0_#f1f5f9]' : 'shadow-[inset_4px_0_0_0_#f43f5e,1px_0_0_0_#f1f5f9]';
                        const monthName = isNaN(Number(a.bulan)) ? a.bulan : (MONTHS[Number(a.bulan) - 1] || a.bulan);
                        
                        return (
                          <tr key={a.id} className={`${rowBg} ${rowHoverBg} border-b border-slate-100 transition-colors`}>
                            <td className={`px-4 py-3 sticky left-0 z-10 ${rowBg} ${rowHoverBg} ${statusShadow}`}>
                              <div className="text-left outline-none min-w-[80px]">
                                <div className="font-black text-slate-800 transition-colors flex items-center gap-2">
                                  {monthName}
                                </div>
                                <div className="text-[10px] font-bold text-slate-400 transition-colors">{a.tahun}</div>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="text-left flex flex-col gap-1 w-[200px]">
                                <div className="flex items-center gap-1.5">
                                  <Building2 className="w-3.5 h-3.5 text-[#7a1200] shrink-0" />
                                  <span className="font-bold text-slate-800 uppercase tracking-tight truncate">{a.nama_desa}</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                  <Target className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                  <span className="text-xs font-medium text-slate-600 truncate">{a.nama_program}</span>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 font-bold text-slate-700 whitespace-nowrap">
                              Rp {parseInt(a.ajuan_ri || '0').toLocaleString('id-ID')}
                            </td>
                            <td className="px-4 py-3 font-black text-[#7a1200] whitespace-nowrap">
                              Rp {parseInt(a.anggaran_dicairkan || '0').toLocaleString('id-ID')}
                            </td>
                            <td className="px-4 py-3 font-bold text-amber-600 whitespace-nowrap">
                              Rp {realisasi.toLocaleString('id-ID')}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`font-black tracking-tight ${sisa < 0 ? 'text-rose-600' : 'text-slate-700'}`}>Rp {sisa.toLocaleString('id-ID')}</span>
                            </td>
                            <td className="px-4 py-3 text-center align-middle">
                              {renderBukti(a.bukti_ca_url)}
                            </td>
                            <td className="px-4 py-3 text-center align-middle">
                              {renderBukti(a.bukti_pengembalian_url)}
                            </td>
                            <td className="px-4 py-3 align-middle">
                              <div className="flex flex-col items-center gap-1">
                                {a.status_ca === 'DIVERIFIKASI' ? (
                                  <Badge className="bg-emerald-100 text-emerald-700 text-[9px]">DIVERIFIKASI</Badge>
                                ) : a.status_ca === 'UPLOADED' ? (
                                  <Badge className="bg-amber-100 text-amber-700 text-[9px]">UPLOADED</Badge>
                                ) : (
                                  <Badge className="bg-slate-100 text-slate-500 text-[9px]">BELUM</Badge>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3 align-middle min-w-[150px]">
                              <textarea 
                                className="w-full text-xs p-2 bg-slate-50 border border-slate-100 rounded-lg min-h-[50px] resize-none"
                                defaultValue={a.catatan_ca || ''}
                                id={`note-${a.id}`}
                                onBlur={(e) => !isAdminOrFinance && handleUpdateCatatan(a.id, e.target.value)}
                                placeholder="Catatan..."
                              />
                            </td>
                            {isAdminOrFinance && (
                              <>
                                <td className="px-4 py-3 text-center align-middle">
                                  <div className="flex flex-row gap-1 justify-center items-center">
                                    {a.status_ca === 'DIVERIFIKASI' ? (
                                      <>
                                        <Button size="sm" className="h-8 w-8 p-0 rounded-lg bg-emerald-50 text-emerald-700 pointer-events-none shadow-none border border-emerald-100">
                                          <CheckCircle2 className="w-5 h-5" />
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-lg" onClick={() => handleVerify(a.id, 'UPLOADED', '')}>
                                          <X className="w-5 h-5" />
                                        </Button>
                                      </>
                                    ) : (
                                      <Button size="sm" className="h-8 w-8 p-0 rounded-lg transition-all bg-[#7a1200] hover:bg-[#007370] text-white"
                                        onClick={() => {
                                          const note = (document.getElementById(`note-${a.id}`) as HTMLTextAreaElement).value
                                          handleVerify(a.id, 'DIVERIFIKASI', note)
                                        }}
                                        disabled={!a.bukti_ca_url || verifyingId === a.id}
                                      >
                                        {verifyingId === a.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                      </Button>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-center align-middle">
                                  <div className="flex flex-row gap-1 justify-center items-center">
                                    {a.bukti_pengembalian_url ? (
                                      a.status_pengembalian === 'DIVERIFIKASI' ? (
                                        <>
                                          <Button size="sm" className="h-8 w-8 p-0 rounded-lg bg-indigo-50 text-indigo-700 pointer-events-none shadow-none border border-indigo-100">
                                            <CheckCircle2 className="w-5 h-5" />
                                          </Button>
                                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:bg-slate-50 hover:text-rose-500 rounded-lg" onClick={() => handleVerifyPengembalian(a.id, 'UPLOADED', '')}>
                                            <X className="w-5 h-5" />
                                          </Button>
                                        </>
                                      ) : (
                                        <Button size="sm" className="h-8 w-8 p-0 rounded-lg transition-all bg-rose-500 hover:bg-rose-600 text-white" onClick={() => handleVerifyPengembalian(a.id, 'DIVERIFIKASI', '')} disabled={verifyingId === a.id}>
                                          {verifyingId === a.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                        </Button>
                                      )
                                    ) : (
                                      <span className="text-[10px] font-bold text-slate-300">-</span>
                                    )}
                                  </div>
                                </td>
                              </>
                            )}
                            <td className="px-4 py-3 text-center align-middle">
                              <Button 
                                size="sm"
                                variant="outline"
                                className="text-[#7a1200] border-[#7a1200]/30 hover:bg-[#7a1200] hover:text-white transition-colors h-8 text-[10px] px-2"
                                onClick={() => router.push(`/dashboard/laporan-keuangan-intervensi/${a.ip_id}`)}
                              >
                                Detail <ExternalLink className="w-3 h-3 ml-1" />
                              </Button>
                            </td>
                          </tr>
                        );
                      };

                      const renderGroupNodes = (nodes: any[]) => {
                        let rows: React.ReactNode[] = [];
                        
                        nodes.forEach(node => {
                          rows.push(
                            <tr 
                              key={`group-${node.path}`}
                              className="bg-slate-100/50 hover:bg-slate-100 cursor-pointer transition-colors border-b border-slate-200"
                              onClick={() => toggleGroup(node.path)}
                            >
                              <td colSpan={isAdminOrFinance ? 13 : 11} className="px-4 py-3">
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
                              node.children.forEach((a: any) => {
                                rows.push(renderDataRow(a));
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
                        return paginatedData.map(renderDataRow);
                      }
                    })()}
                  </tbody>
                </table>
              </div>
            )}
            {!groupedData && totalPages > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-50 p-4 border-t border-slate-100 gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-500">
                    Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filtered.length)} dari {filtered.length} data
                  </span>
                  <select
                    value={itemsPerPage.toString()}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                    className="px-2 py-1 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7a1200] cursor-pointer"
                  >
                    <option value="6">6 Baris</option>
                    <option value="12">12 Baris</option>
                    <option value="24">24 Baris</option>
                    <option value="48">48 Baris</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="font-bold border-slate-200">Prev</Button>
                  <div className="flex items-center justify-center px-3 font-bold text-sm text-slate-600">{currentPage} / {totalPages}</div>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="font-bold border-slate-200">Next</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-4xl p-1 bg-transparent border-none shadow-none focus:outline-none flex justify-center">
          <DialogTitle className="sr-only">Preview</DialogTitle>
          {previewImage && (
            <img src={previewImage} alt="Detail" className="w-full h-auto max-h-[90vh] object-contain rounded-xl" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
