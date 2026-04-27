'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { PlusCircle, Search, MapPin, UserSquare2, Users, ChevronRight, ChevronDown, Upload, Download, FileSpreadsheet, Layers } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useToast } from '@/hooks/use-toast'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import DeletePMButton from './DeletePMButton'
import ShortcutUploadKtp from './ShortcutUploadKtp'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getPenerimaManfaatList, getDesaBerdayaOptions, importPemerimaManfaatExcel } from './actions'
import { useSession } from 'next-auth/react'
import * as xlsx from 'xlsx'
import { MultiSelectFilter } from '@/components/multi-select-filter'
import { FavoriteGroupSelector } from '@/components/favorite-group-selector'
import { X } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default function PenerimaManfaatPage() {
  const { data: session } = useSession()
  const { toast } = useToast()
  const [list, setList] = useState<any[]>([])
  const [filtered, setFiltered] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [desaOptions, setDesaOptions] = useState<any[]>([])
  const [isImporting, setIsImporting] = useState(false)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false)
  const [filterKtpStatus, setFilterKtpStatus] = useState('all')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filters, setFilters] = useState({
    desa: [] as string[],
    kategori: [] as string[]
  })
  const [groupBys, setGroupBys] = useState<string[]>([])
  const [expandedTableGroups, setExpandedTableGroups] = useState<Record<string, boolean>>({})
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const role = (session?.user as any)?.role
  const canAdd = role === 'RELAWAN' || role === 'PROG_HEAD'
  const canMod = role === 'RELAWAN' || role === 'PROG_HEAD' || role === 'ADMIN' || role === 'KORWIL'

  const fetchData = async () => {
    setLoading(true)
    try {
      const pms = await getPenerimaManfaatList()
      setList(pms)
      setFiltered(pms)
      const desas = await getDesaBerdayaOptions()
      setDesaOptions(desas)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!session?.user) return
    fetchData()
  }, [session])

  const filterOptions = useMemo(() => {
    const getOptions = (excludeKey: keyof typeof filters) => {
      return list.filter(pm => {
        const q = search.toLowerCase()
        const matchesSearch = !q || (
          pm.nama?.toLowerCase().includes(q) ||
          pm.nik?.toLowerCase().includes(q) ||
          pm.nama_desa?.toLowerCase().includes(q) ||
          pm.kategori_pm?.toLowerCase().includes(q)
        )
        
        const hasKtp = !!pm.foto_ktp_url
        const matchesKtp = filterKtpStatus === 'all' 
          ? true 
          : filterKtpStatus === 'uploaded' ? hasKtp : !hasKtp

        const matchesDesa = excludeKey === 'desa' || filters.desa.length === 0 || filters.desa.includes(pm.nama_desa)
        const matchesKategori = excludeKey === 'kategori' || filters.kategori.length === 0 || filters.kategori.includes(pm.kategori_pm)

        return matchesSearch && matchesKtp && matchesDesa && matchesKategori
      })
    }

    const desas = Array.from(new Set(getOptions('desa').map(row => row.nama_desa).filter(Boolean))) as string[]
    const kategoris = Array.from(new Set(getOptions('kategori').map(row => row.kategori_pm).filter(Boolean))) as string[]

    return {
      desa: desas.sort(),
      kategori: kategoris.sort()
    }
  }, [list, search, filterKtpStatus, filters])

  useEffect(() => {
    const q = search.toLowerCase()
    setFiltered(
      list.filter((pm) => {
        const matchesSearch = pm.nama?.toLowerCase().includes(q) ||
          pm.nik?.toLowerCase().includes(q) ||
          pm.nama_desa?.toLowerCase().includes(q) ||
          pm.kategori_pm?.toLowerCase().includes(q)
        
        const hasKtp = !!pm.foto_ktp_url
        const matchesKtp = filterKtpStatus === 'all' 
          ? true 
          : filterKtpStatus === 'uploaded' ? hasKtp : !hasKtp

        const matchesDesa = filters.desa.length === 0 || filters.desa.includes(pm.nama_desa)
        const matchesKategori = filters.kategori.length === 0 || filters.kategori.includes(pm.kategori_pm)

        return matchesSearch && matchesKtp && matchesDesa && matchesKategori
      })
    )
  }, [search, filterKtpStatus, filters, list])

  const toggleFilter = (type: keyof typeof filters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter(v => v !== value)
        : [...prev[type], value]
    }))
  }

  const clearFilters = () => {
    setSearch('')
    setFilterKtpStatus('all')
    setFilters({
      desa: [],
      kategori: []
    })
  }

  const hasAnyFilter = search !== '' || filterKtpStatus !== 'all' || filters.desa.length > 0 || filters.kategori.length > 0

  const buildGroups = (data: any[], keys: string[], depth: number = 0, path: string = ''): any[] => {
    if (depth >= keys.length || keys.length === 0) return data;
    const keyType = keys[depth];
    const map = new Map<string, any[]>();
    
    data.forEach(item => {
      let val = 'Lain-lain';
      if (keyType === 'desa') val = item.nama_desa || 'Tanpa Desa';
      else if (keyType === 'kategori') val = item.kategori_pm || 'Tidak Ada';
      else if (keyType === 'ktp') val = item.foto_ktp_url ? 'Ada KTP' : 'Belum Ada KTP';
      
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

  const toggleTableGroup = (path: string) => {
    setExpandedTableGroups(prev => ({ ...prev, [path]: !prev[path] }))
  }

  const handleDownloadTemplate = (desa: any) => {
    const wsData = [
      ['desa_berdaya_id', 'nama_desa', 'nik', 'nama', 'tempat_lahir', 'tanggal_lahir', 'jenis_kelamin', 'golongan_darah', 'alamat', 'rt_rw', 'kel_desa', 'kecamatan', 'agama', 'status_perkawinan', 'pekerjaan', 'kewarganegaraan', 'kategori_pm'],
      [desa.id, desa.nama_desa, '1234567890123456', 'Contoh Nama', 'Jakarta', '1990-01-01', 'Laki-Laki', 'O', 'Jl. Contoh No. 123', '01/02', 'Desa Contoh', 'Kec Contoh', 'Islam', 'Belum Kawin', 'Petani', 'WNI', 'Umum'],
    ]

    const ws = xlsx.utils.aoa_to_sheet(wsData)
    const wb = xlsx.utils.book_new()
    xlsx.utils.book_append_sheet(wb, ws, 'TemplatePM')
    xlsx.writeFile(wb, `Template_Import_PM_${desa.nama_desa.replace(/\s+/g, '_')}.xlsx`)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setSelectedFile(file)
  }

  const handleDoUpload = async () => {
    if (!selectedFile) return

    setIsImporting(true)
    const reader = new FileReader()
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result
        const wb = xlsx.read(bstr, { type: 'binary' })
        const wsname = wb.SheetNames[0]
        const ws = wb.Sheets[wsname]
        const data = xlsx.utils.sheet_to_json(ws)

        if (data.length === 0) {
          toast({ title: 'Error', description: 'File excel kosong.', variant: 'destructive' })
          setIsImporting(false)
          return
        }

        const formattedData = data.map((row: any) => ({
          desa_berdaya_id: parseInt(row.desa_berdaya_id),
          nik: String(row.nik || '').trim(),
          nama: row.nama,
          tempat_lahir: row.tempat_lahir,
          tanggal_lahir: row.tanggal_lahir ? new Date(row.tanggal_lahir).toISOString() : null,
          jenis_kelamin: row.jenis_kelamin,
          golongan_darah: row.golongan_darah,
          alamat: row.alamat,
          rt_rw: row.rt_rw,
          kel_desa: row.kel_desa,
          kecamatan: row.kecamatan,
          agama: row.agama,
          status_perkawinan: row.status_perkawinan,
          pekerjaan: row.pekerjaan,
          kewarganegaraan: row.kewarganegaraan,
          kategori_pm: row.kategori_pm
        }))

        const res = await importPemerimaManfaatExcel(formattedData)
        if (res.success) {
          toast({ 
            title: 'Import Berhasil', 
            description: `${res.successCount} data berhasil diimport.${res.errorCount > 0 ? ` ${res.errorCount} data gagal.` : ''}` 
          })
          setSelectedFile(null)
          fetchData()
          setIsImportModalOpen(false)
        } else {
          toast({ title: 'Import Gagal', description: 'Gagal mengimport data.', variant: 'destructive' })
        }
        
        if (res.errors && res.errors.length > 0) {
          console.error("Import errors:", res.errors)
        }
      } catch (err: any) {
        toast({ title: 'Error', description: err.message || 'Gagal memproses file.', variant: 'destructive' })
      } finally {
        setIsImporting(false)
      }
    }
    reader.readAsBinaryString(selectedFile)
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 lg:px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Penerima Manfaat</h1>
            <p className="text-slate-500 text-xs mt-0.5">Kelola data penerima manfaat per desa binaan</p>
          </div>
          {mounted && canAdd && (
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => setIsImportModalOpen(true)} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 gap-1 shrink-0">
                <Upload className="w-4 h-4" /> Import Excel
              </Button>
              <Link href="/dashboard/pm/tambah">
                <Button size="sm" style={{ backgroundColor: '#7a1200' }} className="text-white gap-1 shrink-0">
                  <PlusCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Tambah PM</span>
                </Button>
              </Link>
            </div>
          )}
        </div>
      </header>

      <div className="p-4 lg:p-6 max-w-7xl mx-auto space-y-3">
        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama, NIK, desa, kategori..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 h-[42px] py-2.5 border border-slate-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#7a1200]/20 focus:border-[#7a1200]"
            />
          </div>
          
          <Select value={filterKtpStatus} onValueChange={setFilterKtpStatus}>
            <SelectTrigger className="w-full sm:w-[200px] h-[42px] border-slate-200 rounded-xl bg-white focus:ring-2 focus:ring-[#7a1200]/20 focus:outline-none focus:border-[#7a1200] text-sm font-normal">
              <SelectValue placeholder="Status KTP" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200">
              <SelectItem value="all" className="rounded-lg">Semua Status KTP</SelectItem>
              <SelectItem value="uploaded" className="rounded-lg">Sudah Upload KTP</SelectItem>
              <SelectItem value="missing" className="rounded-lg text-red-600 focus:text-red-700">Belum Upload KTP</SelectItem>
            </SelectContent>
          </Select>

          <MultiSelectFilter 
            label="Desa" 
            options={filterOptions.desa} 
            selected={filters.desa}
            onSelect={(val) => toggleFilter('desa', val)}
            onClear={() => setFilters(f => ({ ...f, desa: [] }))}
          />

          <MultiSelectFilter 
            label="Kategori" 
            options={filterOptions.kategori} 
            selected={filters.kategori}
            onSelect={(val) => toggleFilter('kategori', val)}
            onClear={() => setFilters(f => ({ ...f, kategori: [] }))}
          />

          {hasAnyFilter && (
            <Button
              variant="ghost"
              size="sm"
              className="h-[42px] px-3 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 font-bold gap-1 transition-colors"
              onClick={clearFilters}
            >
              <X className="w-4 h-4" />
              Reset
            </Button>
          )}

          <div className="hidden md:flex items-center gap-2 ml-auto shrink-0">
            <Select value="none" onValueChange={(val) => { 
              if (val !== 'none' && !groupBys.includes(val)) {
                setGroupBys(prev => [...prev, val]);
                setExpandedTableGroups({}); 
              }
            }}>
              <SelectTrigger className="w-[180px] bg-white border-slate-200 rounded-xl h-[42px] font-bold text-slate-600">
                <div className="flex items-center gap-2">
                  <Layers className="w-4 h-4 text-slate-400" />
                  <SelectValue placeholder="Tambah Group By" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Tambah Group By...</SelectItem>
                <SelectItem value="desa">Berdasarkan Desa</SelectItem>
                <SelectItem value="kategori">Berdasarkan Kategori</SelectItem>
                <SelectItem value="ktp">Berdasarkan Status KTP</SelectItem>
              </SelectContent>
            </Select>
            <FavoriteGroupSelector 
              moduleName="pm" 
              currentGroupBys={groupBys} 
              onApplyFavorite={(groups) => {
                setGroupBys(groups)
                setExpandedTableGroups({})
              }} 
            />
          </div>
        </div>

        {/* Group By Chips (Desktop Only) */}
        <div className="hidden md:flex">
          {groupBys.length > 0 && (
            <div className="flex flex-wrap gap-1 items-center">
              {groupBys.map((g, idx) => (
                <div key={g} className="flex items-center gap-1">
                  <div className="bg-slate-200 text-slate-700 text-[10px] uppercase font-bold px-2 py-1 rounded flex items-center gap-1">
                    {g} 
                    <button onClick={() => {
                        setGroupBys(prev => prev.filter(v => v !== g));
                        setExpandedTableGroups({});
                    }} className="hover:bg-slate-300 p-0.5 rounded-full transition-colors">
                      <X className="w-3 h-3 hover:text-rose-600"/>
                    </button>
                  </div>
                  {idx < groupBys.length - 1 && <ChevronRight className="w-3 h-3 text-slate-300" />}
                </div>
              ))}
            </div>
          )}
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
                      {pm.foto_ktp_url ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                          KTP: Ada
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                          KTP: Belum
                        </span>
                      )}
                      <div className="flex items-center gap-1 text-xs text-slate-500">
                        <MapPin className="w-3 h-3 shrink-0" />
                        <span className="truncate">{pm.nama_desa}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-100 px-4 py-2.5 flex items-center justify-end gap-2">
                {!pm.foto_ktp_url && canAdd && (
                  <ShortcutUploadKtp pmId={pm.id} onSuccess={fetchData} />
                )}
                <Link href={`/dashboard/pm/${pm.id}`}>
                  <Button variant="outline" size="sm" className="text-[#7a1200] border-red-200 hover:bg-red-50 h-8 text-xs gap-1">
                    Detail <ChevronRight className="w-3 h-3" />
                  </Button>
                </Link>
                {canMod && (
                  <>
                    <Link href={`/dashboard/pm/${pm.id}/edit`}>
                      <Button variant="ghost" size="sm" className="text-slate-600 hover:bg-slate-100 h-8 text-xs">Edit</Button>
                    </Link>
                    <DeletePMButton 
                      id={pm.id} 
                      onDeleted={(deletedId) => {
                        setList(prev => prev.filter((item) => item.id !== deletedId))
                        setFiltered(prev => prev.filter((item) => item.id !== deletedId))
                      }} 
                    />
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
                ) : (() => {
                  const renderDataRow = (pm: any) => (
                    <tr key={pm.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center text-[#7a1200] shrink-0">
                            <UserSquare2 className="w-5 h-5" />
                          </div>
                          <div>
                            <p className="font-semibold text-slate-800 flex items-center gap-2">
                              {pm.nama}
                              {pm.foto_ktp_url ? (
                                 <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100" title="Foto KTP Tersedia">
                                   KTP
                                 </span>
                              ) : (
                                 <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-red-50 text-red-700 border border-red-100" title="Foto KTP Belum Diupload">
                                   No KTP
                                 </span>
                              )}
                            </p>
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
                          {!pm.foto_ktp_url && canAdd && (
                            <ShortcutUploadKtp pmId={pm.id} onSuccess={fetchData} />
                          )}
                          <Link href={`/dashboard/pm/${pm.id}`}>
                            <Button variant="ghost" size="sm" className="text-[#7a1200] hover:bg-red-50">Detail</Button>
                          </Link>
                          {canMod && (
                            <>
                              <Link href={`/dashboard/pm/${pm.id}/edit`}>
                                <Button variant="ghost" size="sm" className="text-slate-600 hover:bg-slate-100">Edit</Button>
                              </Link>
                              <DeletePMButton 
                                id={pm.id} 
                                onDeleted={(deletedId) => {
                                  setList(prev => prev.filter((item) => item.id !== deletedId))
                                  setFiltered(prev => prev.filter((item) => item.id !== deletedId))
                                }} 
                              />
                            </>
                          )}
                        </div>
                      </td>
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
                          <td colSpan={4} className="px-6 py-3 sticky left-0 z-20 bg-slate-50/90">
                            <div className="flex items-center gap-2 font-black text-slate-800" style={{ paddingLeft: `${node.depth * 1.5}rem` }}>
                              {expandedTableGroups[node.path] ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                              <span className="uppercase tracking-tight">{node.groupName}</span>
                              <div className="bg-slate-200 text-slate-600 ml-1 px-2 py-0.5 rounded text-xs">{node.itemsCount}</div>
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
                    return filtered.map(renderDataRow);
                  }
                })()}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Import Modal */}
      <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Import Penerima Manfaat</DialogTitle>
            <DialogDescription>
              Ikuti langkah berikut untuk memasukkan data Penerima Manfaat sekaligus.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <span className="flex items-center justify-center bg-slate-100 rounded-full w-5 h-5 text-xs">1</span> 
                Download Template
              </Label>
              <p className="text-sm text-slate-500 pl-7">
                Pilih desa di bawah ini untuk mengunduh template Excel yang sudah diisi dengan ID Desa yang sesuai.
              </p>
              <div className="pl-7 space-y-2">
                {desaOptions.length === 0 ? (
                  <p className="text-xs text-red-500">Anda tidak memiliki akses ke desa binaan manapun.</p>
                ) : (
                  desaOptions.map((desa) => (
                    <Button 
                      key={desa.id} 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleDownloadTemplate(desa)} 
                      className="w-full justify-start text-slate-600"
                    >
                      <Download className="w-4 h-4 mr-2 text-blue-500" />
                      Template untuk Desa {desa.nama_desa}
                    </Button>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t border-slate-100">
              <Label className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                <span className="flex items-center justify-center bg-slate-100 rounded-full w-5 h-5 text-xs">2</span> 
                Upload File Excel
              </Label>
              <p className="text-sm text-slate-500 pl-7">
                Pastikan data sudah diisi sesuai format di dalam template sebelum diupload.
              </p>
              <div className="pl-7">
                {/* Drop zone / file picker */}
                <div className="relative">
                  <input 
                    type="file" 
                    accept=".xlsx, .xls"
                    onChange={handleFileSelect}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    disabled={isImporting || desaOptions.length === 0}
                    title="Pilih file Excel"
                  />
                  <div className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 transition-colors ${
                    selectedFile
                      ? 'bg-emerald-50 border-emerald-400'
                      : isImporting
                        ? 'bg-slate-50 border-slate-200'
                        : 'bg-slate-50/50 border-emerald-200 hover:bg-emerald-50'
                  }`}>
                    {isImporting ? (
                      <div className="text-center">
                        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                        <p className="text-sm text-emerald-700 font-medium">Sedang memproses...</p>
                      </div>
                    ) : selectedFile ? (
                      <div className="text-center">
                        <FileSpreadsheet className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                        <p className="text-sm font-semibold text-emerald-800 truncate max-w-[200px]">{selectedFile.name}</p>
                        <p className="text-xs text-emerald-600/70 mt-1">{(selectedFile.size / 1024).toFixed(1)} KB · Klik untuk ganti file</p>
                      </div>
                    ) : (
                      <div className="text-center">
                        <FileSpreadsheet className="w-8 h-8 text-emerald-500 mx-auto mb-3" />
                        <p className="text-sm font-medium text-emerald-700">Pilih / Tarik File ke Sini</p>
                        <p className="text-xs text-emerald-600/70 mt-1">Format: .xlsx</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tombol upload — hanya muncul setelah file dipilih */}
                {selectedFile && !isImporting && (
                  <div className="mt-3 flex items-center gap-2">
                    <Button
                      onClick={handleDoUpload}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Sekarang
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => setSelectedFile(null)}
                      className="text-slate-500 border-slate-200"
                    >
                      Batal
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsImportModalOpen(false)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
