'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Target, LayoutGrid, Search, Filter, X, Check, FileSpreadsheet, Trash2 } from 'lucide-react'
import { getIntervensiPrograms, deleteIntervensiProgram } from './actions'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { cn } from '@/lib/utils'
import ImportExcelModal from '@/components/intervensi/ImportExcelModal'
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog'

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
                    <td colSpan={6} className="px-8 py-12 text-center text-slate-400 font-medium whitespace-nowrap">Memuat data...</td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-8 py-14 text-center">
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
                    <tr key={row.id} className="hover:bg-slate-50/80 transition-colors group">
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
    </div>
  )
}
