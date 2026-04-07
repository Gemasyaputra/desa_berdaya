'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Target, LayoutGrid, Search, Filter, X, Check, FileSpreadsheet, Trash2, Download, Loader2 } from 'lucide-react'
import { getIntervensiPrograms, deleteIntervensiProgram, getIntervensiExportData, duplicateIntervensiProgram, getDesaBerdayaOptions, getProgramOptions } from './actions'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { cn } from '@/lib/utils'
import ImportExcelModal from '@/components/intervensi/ImportExcelModal'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Copy } from 'lucide-react'

interface MultiSelectFilterProps {
  label: string
  options: string[]
  selected: string[]
  onSelect: (value: string) => void
  onClear: () => void
  icon?: React.ReactNode
}

function MultiSelectFilter({ label, options, selected, onSelect, onClear, icon }: MultiSelectFilterProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          size="sm" 
          className={cn(
            "h-10 rounded-xl border-slate-200 font-medium text-slate-600 hover:bg-slate-50 gap-2 px-3 transition-all",
            selected.length > 0 && "border-[#008784]/30 bg-[#008784]/5 text-[#008784] hover:bg-[#008784]/10"
          )}
        >
          {icon || <Filter className="w-4 h-4 text-slate-400" />}
          {label}
          {selected.length > 0 && (
            <Badge variant="secondary" className="ml-1 px-1.5 py-0 h-5 bg-[#008784]/10 text-[#008784] border-none font-bold text-[10px]">
              {selected.length}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-0 rounded-2xl border-slate-100 shadow-2xl" align="start">
        <Command className="rounded-2xl">
          <CommandInput placeholder={`Cari ${label.toLowerCase()}...`} className="h-10 border-none focus:ring-0" />
          <CommandList className="max-h-64">
            <CommandEmpty className="py-4 text-sm text-slate-400 text-center">Data tidak ditemukan</CommandEmpty>
            <CommandGroup className="p-2">
              {options.map((option) => (
                <CommandItem
                  key={option}
                  onSelect={() => onSelect(option)}
                  className="rounded-lg cursor-pointer py-2 px-3 data-[selected=true]:bg-slate-50 group"
                >
                  <div className={cn(
                    "mr-3 flex h-4 w-4 items-center justify-center rounded border border-slate-300 transition-colors group-hover:border-[#008784]/50",
                    selected.includes(option) ? "bg-[#008784] border-[#008784]" : "bg-white"
                  )}>
                    {selected.includes(option) && <Check className="h-3 w-3 text-white stroke-[3px]" />}
                  </div>
                  <span className={cn(
                    "text-sm font-medium transition-colors",
                    selected.includes(option) ? "text-[#008784] font-bold" : "text-slate-600"
                  )}>
                    {option}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          {selected.length > 0 && (
            <div className="border-t border-slate-50 p-2 bg-slate-50/50">
              <Button 
                variant="ghost" 
                size="sm" 
                className="w-full h-8 text-[11px] font-bold text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg uppercase tracking-wider"
                onClick={(e) => {
                  e.stopPropagation()
                  onClear()
                }}
              >
                Reset {label}
              </Button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export default function IntervensiListPage() {
  const router = useRouter()
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState({
    desa: [] as string[],
    program: [] as string[],
    relawan: [] as string[],
    status: [] as string[]
  })
  const [isImportOpen, setIsImportOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<any>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set())

  // Duplicate states
  const [duplicateTarget, setDuplicateTarget] = useState<any>(null)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [desaOptions, setDesaOptions] = useState<any[]>([])
  const [programOptions, setProgramOptions] = useState<any[]>([])
  const [duplicateForm, setDuplicateForm] = useState({
    desa_id: '',
    program_id: ''
  })


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

  // Extract unique options for filters
  const filterOptions = useMemo(() => {
    const desas = Array.from(new Set(data.map(row => row.nama_desa).filter(Boolean))) as string[]
    const programs = Array.from(new Set(data.map(row => row.nama_program).filter(Boolean))) as string[]
    const relawans = Array.from(new Set(data.map(row => row.nama_relawan).filter(Boolean))) as string[]
    const statuses = ['DRAFT', 'APPROVED', 'CANCELLED']
    
    return {
      desa: desas.sort(),
      program: programs.sort(),
      relawan: relawans.sort(),
      status: statuses
    }
  }, [data])

  const filtered = useMemo(() => {
    return data.filter(row => {
      // 1. Search filter
      const q = search.toLowerCase()
      const matchesSearch = !q || (
        (row.nama_desa || '').toLowerCase().includes(q) ||
        (row.nama_program || '').toLowerCase().includes(q) ||
        (row.nama_relawan || '').toLowerCase().includes(q) ||
        (row.sumber_dana || '').toLowerCase().includes(q) ||
        (row.fundraiser || '').toLowerCase().includes(q)
      )
      
      // 2. Multi-select filters
      const matchesDesa = filters.desa.length === 0 || filters.desa.includes(row.nama_desa)
      const matchesProgram = filters.program.length === 0 || filters.program.includes(row.nama_program)
      const matchesRelawan = filters.relawan.length === 0 || filters.relawan.includes(row.nama_relawan)
      const matchesStatus = filters.status.length === 0 || filters.status.includes(row.status)
      
      return matchesSearch && matchesDesa && matchesProgram && matchesRelawan && matchesStatus
    })
  }, [data, search, filters])

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
    setFilters({
      desa: [],
      program: [],
      relawan: [],
      status: []
    })
  }

  const hasAnyFilter = search !== '' || 
    filters.desa.length > 0 || 
    filters.program.length > 0 || 
    filters.relawan.length > 0 || 
    filters.status.length > 0

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 uppercase text-[10px] font-bold tracking-wider">APPROVED</Badge>
      case 'CANCELLED': return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 uppercase text-[10px] font-bold tracking-wider">CANCELLED</Badge>
      default: return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 uppercase text-[10px] font-bold tracking-wider">DRAFT</Badge>
    }
  }

  const handleDelete = (row: any) => {
    setDeleteTarget(row)
  }

  // ── Selection helpers ───────────────────────────────────────────────
  const allFilteredSelected = filtered.length > 0 && filtered.every(r => selectedIds.has(r.id))
  const someFilteredSelected = filtered.some(r => selectedIds.has(r.id))

  const toggleRow = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const toggleAllFiltered = () => {
    if (allFilteredSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev)
        filtered.forEach(r => next.delete(r.id))
        return next
      })
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev)
        filtered.forEach(r => next.add(r.id))
        return next
      })
    }
  }

  const clearSelection = () => setSelectedIds(new Set())

  const handleExport = async () => {
    if (selectedIds.size === 0) return
    setIsExporting(true)
    try {
      const ids = Array.from(selectedIds)
      const rows = (await getIntervensiExportData(ids)) as any[]
      const XLSX = await import('xlsx')

      const BULAN_ORDER = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
      const fmt = (n: any) => (n === null || n === undefined || n === '') ? 0 : Number(n)
      const fmtBool = (v: any) => (String(v).toLowerCase() === 'true' || v === true) ? 'Ya' : 'Tidak'

      const wb = XLSX.utils.book_new()

      const flatData = rows.map(r => ({
        'ID': r.intervensi_id,
        'Nama Desa': r.nama_desa || '-',
        'Kategori Program': r.kategori_program || '-',
        'Program': r.nama_program || '-',
        'Relawan': r.nama_relawan || '-',
        'Sumber Dana': r.sumber_dana || '-',
        'Fundraiser': r.fundraiser || '-',
        'Deskripsi': r.deskripsi || '-',
        'Status': r.status || '-',
        'Tanggal Dibuat': r.created_at ? new Date(r.created_at).toLocaleDateString('id-ID') : '-',
        'Tahun': r.tahun || '-',
        'Bulan': r.bulan || '-',
        'Ajuan RI': fmt(r.ajuan_ri),
        'Agg. Disetujui': fmt(r.anggaran_disetujui),
        'Agg. Dicairkan': fmt(r.anggaran_dicairkan),
        'Status Pencairan': r.status_pencairan || '-',
        'ID STP': r.id_stp || '-',
        'Catatan': r.catatan || '-',
        'Is DBF': fmtBool(r.is_dbf),
        'Is RZ': fmtBool(r.is_rz),
      }))

      const ws = XLSX.utils.json_to_sheet(flatData)
      
      ws['!cols'] = [
        {wch:6},{wch:20},{wch:18},{wch:24},{wch:20},{wch:14},{wch:20},{wch:30},{wch:12},{wch:15},
        {wch:10},{wch:12},{wch:18},{wch:18},{wch:18},{wch:18},{wch:12},{wch:24},{wch:8},{wch:8}
      ]

      XLSX.utils.book_append_sheet(wb, ws, 'Data Intervensi')

      const now = new Date().toISOString().slice(0, 10)
      XLSX.writeFile(wb, `export_intervensi_${now}.xlsx`)

      const { toast } = await import('sonner')
      const totalIntervensi = new Set(rows.map(r => r.intervensi_id)).size
      const totalAnggaran = rows.filter(r => r.anggaran_id != null).length
      toast.success(`Export berhasil! ${totalIntervensi} Intervensi disusun dalam 1 sheet.`)
    } catch (err: any) {
      const { toast } = await import('sonner')
      toast.error(err.message || 'Export gagal')
    } finally {
      setIsExporting(false)
    }
  }

  const executeDelete = async () => {
    if (!deleteTarget) return
    try {
      await deleteIntervensiProgram(deleteTarget.id)
      import('sonner').then(m => m.toast.success('Intervensi berhasil dihapus.'))
      loadData()
    } catch (err: any) {
      import('sonner').then(m => m.toast.error(err.message || 'Gagal menghapus intervensi'))
    } finally {
      setDeleteTarget(null)
    }
  }

  const handleDuplicateClick = async (row: any) => {
    setDuplicateTarget(row)
    setDuplicateForm({ desa_id: '', program_id: '' })
    if (desaOptions.length === 0 || programOptions.length === 0) {
      try {
        const [desas, progs] = await Promise.all([
          getDesaBerdayaOptions(),
          getProgramOptions()
        ])
        setDesaOptions(desas)
        setProgramOptions(progs)
      } catch (err) {
        import('sonner').then(m => m.toast.error('Gagal memuat opsi desa & program'))
      }
    }
  }

  const executeDuplicate = async () => {
    if (!duplicateTarget || !duplicateForm.desa_id || !duplicateForm.program_id) return
    setIsDuplicating(true)
    try {
      const selectedDesa = desaOptions.find(d => d.id === Number(duplicateForm.desa_id))
      const selectedProg = programOptions.find(p => p.id === Number(duplicateForm.program_id))
      
      const payload = {
        desa_berdaya_id: Number(duplicateForm.desa_id),
        program_id: Number(duplicateForm.program_id),
        kategori_program_id: selectedProg?.kategori_id,
        relawan_id: selectedDesa?.relawan_id // Automatically inherited from the chosen Desa
      }

      await duplicateIntervensiProgram(duplicateTarget.id, payload)
      import('sonner').then(m => m.toast.success('Intervensi berhasil diduplikasi ke DRAFT.'))
      loadData()
      setDuplicateTarget(null)
    } catch (err: any) {
      import('sonner').then(m => m.toast.error(err.message || 'Gagal menduplikasi intervensi'))
    } finally {
      setIsDuplicating(false)
    }
  }

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#008784]/10 border border-[#008784]/20 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform hover:scale-105">
            <Target className="w-7 h-7 text-[#008784]" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800">Intervensi Program</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">Perencanaan dan alokasi anggaran program desa</p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Button
            variant="outline"
            className="border-[#008784]/40 text-[#008784] hover:bg-[#008784]/5 shadow-sm px-5 h-auto py-2 rounded-xl transition-all w-full sm:w-auto gap-2 items-start"
            onClick={() => setIsImportOpen(true)}
          >
            <FileSpreadsheet className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div className="flex flex-col text-left">
              <span className="font-bold text-sm leading-tight">Import Excel</span>
              <span className="text-[10px] font-medium text-[#008784]/60 leading-tight mt-0.5">Template tersedia di dalam</span>
            </div>
          </Button>
          <Button
            variant="outline"
            className="border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 shadow-sm px-5 h-auto py-2 rounded-xl transition-all w-full sm:w-auto gap-2 items-start disabled:opacity-60"
            onClick={handleExport}
            disabled={isExporting || selectedIds.size === 0}
          >
            {isExporting
              ? <Loader2 className="w-4 h-4 mt-0.5 flex-shrink-0 animate-spin" />
              : <Download className="w-4 h-4 mt-0.5 flex-shrink-0" />
            }
            <div className="flex flex-col text-left">
              <span className="font-bold text-sm leading-tight">{isExporting ? 'Mengexport...' : 'Export Excel'}</span>
              <span className="text-[10px] font-medium text-slate-400 leading-tight mt-0.5">
                {selectedIds.size > 0 ? `${selectedIds.size} dipilih` : 'Pilih baris dulu'}
              </span>
            </div>
          </Button>
          <Button 
            className="bg-[#008784] hover:bg-[#006e6b] text-white shadow-lg shadow-[#008784]/20 px-6 h-12 rounded-xl font-bold transition-all w-full md:w-auto active:scale-95"
            onClick={() => router.push('/dashboard/intervensi/tambah')}
          >
            <Plus className="w-5 h-5 mr-2" />
            Tambah Intervensi
          </Button>
        </div>
      </div>

      <Card className="border-none shadow-xl shadow-slate-200/40 rounded-[2rem] overflow-hidden bg-white">
        <CardHeader className="bg-white border-b border-slate-100 px-8 py-6">
          <div className="flex flex-col xl:flex-row gap-6 items-start xl:items-center justify-between">
            <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <LayoutGrid className="w-5 h-5 text-[#008784]" /> 
              Daftar Intervensi Program
              {!loading && (
                <span className="text-sm font-semibold text-slate-400 ml-1">
                  ({filtered.length}/{data.length})
                </span>
              )}
            </CardTitle>

            {/* Selection action bar */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-3 bg-[#008784]/5 border border-[#008784]/20 rounded-2xl px-4 py-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 bg-[#008784] rounded-md flex items-center justify-center">
                    <Check className="w-3 h-3 text-white stroke-[3px]" />
                  </div>
                  <span className="text-sm font-bold text-[#008784]">{selectedIds.size} dipilih</span>
                </div>
                <div className="w-px h-4 bg-[#008784]/20" />
                <button
                  className="text-xs font-semibold text-slate-500 hover:text-slate-700 transition-colors"
                  onClick={clearSelection}
                >
                  Batal pilih
                </button>
                <Button
                  size="sm"
                  className="bg-[#008784] hover:bg-[#006e6b] text-white rounded-xl font-bold px-4 h-8 gap-1.5 shadow-sm shadow-[#008784]/20"
                  disabled={isExporting}
                  onClick={handleExport}
                >
                  {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                  Export {selectedIds.size} data
                </Button>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
              {/* Search box */}
              <div className="relative flex-grow sm:flex-grow-0">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <Input
                  placeholder="Cari desa, program, relawan..."
                  className="pl-9 h-10 w-full sm:w-64 rounded-xl border-slate-200 text-sm shadow-sm focus:border-[#008784]/40 focus:ring-4 focus:ring-[#008784]/10 transition-all"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {/* Multi Filters */}
                <MultiSelectFilter 
                  label="Desa" 
                  options={filterOptions.desa} 
                  selected={filters.desa}
                  onSelect={(val) => toggleFilter('desa', val)}
                  onClear={() => setFilters(f => ({ ...f, desa: [] }))}
                />

                <MultiSelectFilter 
                  label="Program" 
                  options={filterOptions.program} 
                  selected={filters.program}
                  onSelect={(val) => toggleFilter('program', val)}
                  onClear={() => setFilters(f => ({ ...f, program: [] }))}
                />

                <MultiSelectFilter 
                  label="Relawan" 
                  options={filterOptions.relawan} 
                  selected={filters.relawan}
                  onSelect={(val) => toggleFilter('relawan', val)}
                  onClear={() => setFilters(f => ({ ...f, relawan: [] }))}
                />

                <MultiSelectFilter 
                  label="Status" 
                  options={filterOptions.status} 
                  selected={filters.status}
                  onSelect={(val) => toggleFilter('status', val)}
                  onClear={() => setFilters(f => ({ ...f, status: [] }))}
                />

                {/* Clear all filters */}
                {hasAnyFilter && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 px-3 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 font-bold gap-1 transition-colors"
                    onClick={clearFilters}
                  >
                    <X className="w-4 h-4" />
                    Reset
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-[#f8fafc] text-[11px] uppercase font-bold text-slate-500 tracking-wider">
                <tr>
                  {/* Select-all checkbox */}
                  <th className="px-5 py-4 w-10">
                    <div
                      className={`w-4 h-4 rounded border-2 cursor-pointer flex items-center justify-center transition-colors ${
                        allFilteredSelected
                          ? 'bg-[#008784] border-[#008784]'
                          : someFilteredSelected
                          ? 'bg-[#008784]/30 border-[#008784]'
                          : 'border-slate-300 hover:border-[#008784]/60'
                      }`}
                      onClick={toggleAllFiltered}
                      title={allFilteredSelected ? 'Batal pilih semua' : 'Pilih semua'}
                    >
                      {(allFilteredSelected || someFilteredSelected) && (
                        <Check className="w-2.5 h-2.5 text-white stroke-[3.5px]" />
                      )}
                    </div>
                  </th>
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
                    <td colSpan={7} className="px-8 py-12 text-center text-slate-400 font-medium whitespace-nowrap">Memuat data...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-8 py-14 text-center">
                      <div className="flex flex-col items-center gap-3 text-slate-400">
                        <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center">
                          <Search className="w-6 h-6 opacity-30" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold text-slate-600">Data tidak ditemukan</p>
                          <p className="text-xs text-slate-400">Coba ubah kata kunci atau bersihkan filter</p>
                        </div>
                        {hasAnyFilter && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="mt-2 rounded-xl text-indigo-600 border-indigo-100 hover:bg-indigo-50 font-bold px-4" 
                            onClick={clearFilters}
                          >
                            Reset Semua Filter
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filtered.map((row) => (
                    <tr
                      key={row.id}
                      className={`hover:bg-slate-50/80 transition-colors group ${
                        selectedIds.has(row.id) ? 'bg-[#008784]/5' : ''
                      }`}
                    >
                      {/* Per-row checkbox */}
                      <td className="px-5 py-5">
                        <div
                          className={`w-4 h-4 rounded border-2 cursor-pointer flex items-center justify-center transition-colors ${
                            selectedIds.has(row.id)
                              ? 'bg-[#008784] border-[#008784]'
                              : 'border-slate-300 hover:border-[#008784]/60'
                          }`}
                          onClick={() => toggleRow(row.id)}
                        >
                          {selectedIds.has(row.id) && (
                            <Check className="w-2.5 h-2.5 text-white stroke-[3.5px]" />
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-5">
                        <div className="font-bold text-slate-800 mb-1 group-hover:text-[#008784] transition-colors">{row.nama_desa || '-'}</div>
                        <div className="text-xs font-semibold text-slate-500 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#008784]"></span>
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
                      <td className="px-8 py-5">
                        <div className="flex items-center justify-center gap-2">
                          <Button 
                            variant="outline"
                            size="sm"
                            className="rounded-xl border-slate-200 text-slate-600 hover:text-[#008784] hover:border-[#008784]/30 hover:bg-[#008784]/5 font-bold px-4 transition-all active:scale-95"
                            onClick={() => router.push(`/dashboard/intervensi/${row.id}`)}
                          >
                            Detail
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 px-2 transition-all active:scale-95 group/copy relative"
                            onClick={() => handleDuplicateClick(row)}
                            title="Duplikasi Program"
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                          {row.status === 'DRAFT' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="rounded-xl text-slate-300 hover:text-rose-500 hover:bg-rose-50 px-2 transition-all active:scale-95"
                              onClick={() => handleDelete(row)}
                              title="Hapus intervensi"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <ImportExcelModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImported={() => { loadData(); setIsImportOpen(false) }}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent className="rounded-2xl max-w-md bg-white">
          <AlertDialogHeader>
            <div className="w-12 h-12 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mb-2">
              <Trash2 className="w-6 h-6 text-rose-500" />
            </div>
            <AlertDialogTitle className="text-lg font-black text-slate-800">
              Hapus Intervensi Program?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-slate-500 space-y-2">
              <span className="block">Anda akan menghapus:</span>
              <span className="block bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-slate-800 font-semibold">
                {deleteTarget?.nama_desa} — {deleteTarget?.nama_program}
              </span>
              <span className="block text-rose-500 font-medium">
                ⚠ Semua data anggaran yang terkait juga akan ikut dihapus. Tindakan ini tidak dapat dibatalkan.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-2 gap-2">
            <AlertDialogCancel className="rounded-xl border-slate-200 font-semibold text-slate-600 hover:bg-slate-50">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              className="rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-bold shadow-md shadow-rose-500/20 gap-2"
              onClick={executeDelete}
            >
              <Trash2 className="w-4 h-4" />
              Ya, Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Duplicate Modal */}
      <Dialog open={!!duplicateTarget} onOpenChange={(open) => !open && setDuplicateTarget(null)}>
        <DialogContent className="rounded-2xl max-w-lg bg-white p-6 shadow-2xl border-none">
          <DialogHeader className="mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <Copy className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <DialogTitle className="text-xl font-black text-slate-800">Duplikasi Intervensi</DialogTitle>
                <DialogDescription className="text-xs font-semibold text-slate-500">
                  Salin kerangka anggaran ke desa binaan baru.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
              <div className="text-[10px] uppercase font-black tracking-widest text-slate-400">Data Asal:</div>
              <div className="font-bold text-slate-700 text-sm">{duplicateTarget?.nama_desa}</div>
              <div className="font-medium text-slate-600 text-xs">Program: {duplicateTarget?.nama_program}</div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Pilih Desa Binaan Baru <span className="text-rose-500">*</span></label>
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#008784]/20 focus:border-[#008784] hover:bg-slate-50/50 cursor-pointer transition-colors"
                  value={duplicateForm.desa_id}
                  onChange={(e) => setDuplicateForm(prev => ({...prev, desa_id: e.target.value}))}
                >
                  <option value="" disabled>-- Pilih Desa --</option>
                  {desaOptions.map(d => <option key={d.id} value={d.id}>{d.nama} {d.relawan_nama ? `— (${d.relawan_nama})` : ''}</option>)}
                </select>
                <p className="text-[10px] font-medium text-slate-400">Relawan akan otomatis mengikuti nama relawan yang terdaftar di Desa ini.</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700">Pilih Program Baru <span className="text-rose-500">*</span></label>
                <select 
                  className="flex h-10 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#008784]/20 focus:border-[#008784] hover:bg-slate-50/50 cursor-pointer transition-colors"
                  value={duplicateForm.program_id}
                  onChange={(e) => setDuplicateForm(prev => ({...prev, program_id: e.target.value}))}
                >
                  <option value="" disabled>-- Pilih Program --</option>
                  {programOptions.map(p => <option key={p.id} value={p.id}>{p.nama_program}</option>)}
                </select>
              </div>
            </div>
          </div>

          <DialogFooter className="mt-6 gap-2">
            <Button variant="ghost" className="rounded-xl font-semibold text-slate-600 hover:bg-slate-100" onClick={() => setDuplicateTarget(null)}>
              Batal
            </Button>
            <Button 
              className="rounded-xl shadow-lg shadow-indigo-500/20 bg-indigo-500 hover:bg-indigo-600 text-white font-bold gap-2 px-6"
              onClick={executeDuplicate}
              disabled={isDuplicating || !duplicateForm.desa_id || !duplicateForm.program_id}
            >
              {isDuplicating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Copy className="w-4 h-4" />}
              {isDuplicating ? 'Memproses...' : 'Duplikasi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
