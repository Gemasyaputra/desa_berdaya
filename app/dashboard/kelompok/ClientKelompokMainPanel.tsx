'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Users, LayoutGrid, List, Download, Search, X } from 'lucide-react'
import * as XLSX from 'xlsx'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useToast } from '@/hooks/use-toast'
import { Checkbox } from '@/components/ui/checkbox'
import { useSession } from 'next-auth/react'

import { 
  createKelompok, updateKelompok, deleteKelompok 
} from '@/lib/actions/kelompok'
import { getPenerimaManfaatByDesaId } from '@/app/dashboard/pm/actions'
import { MultiSelectFilter } from '@/components/multi-select-filter'

export default function ClientKelompokMainPanel({ 
  initialKelompok, 
  initialPrograms,
  desaOptions,
  defaultDesaId,
}: { 
  initialKelompok: any[],
  initialPrograms: any[],
  desaOptions: any[],
  defaultDesaId?: number
}) {
  const { data: session } = useSession()
  const { toast } = useToast()
  
  const role = (session?.user as any)?.role
  const canMod = role === 'RELAWAN' || role === 'PROG_HEAD' || role === 'ADMIN' || role === 'KORWIL'
  
  // States for Kelompok
  const [isOpenKelompok, setIsOpenKelompok] = useState(false)
  const [isEditKelompok, setIsEditKelompok] = useState(false)
  const [activeKelompokObj, setActiveKelompokObj] = useState<any>(null)
  
  // Form fields
  const [kelompokDesaId, setKelompokDesaId] = useState<string>(defaultDesaId ? defaultDesaId.toString() : '')
  const [namaKelompok, setNamaKelompok] = useState('')
  const [namaPembina, setNamaPembina] = useState('')
  const [tahunKel, setTahunKel] = useState<number>(new Date().getFullYear())
  const [kelompokProgramId, setKelompokProgramId] = useState<string>('')
  
  // PM Lists
  const [desaPMs, setDesaPMs] = useState<any[]>([])
  const [selectedPMs, setSelectedPMs] = useState<number[]>([])
  const [isSubmittingKelompok, setIsSubmittingKelompok] = useState(false)
  const [isLoadingPMs, setIsLoadingPMs] = useState(false)
  
  // Filter States
  const [filterUmur, setFilterUmur] = useState<string[]>([])
  const [filterGender, setFilterGender] = useState<string[]>([])

  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  
  // Kelompok list filters
  const [searchKelompok, setSearchKelompok] = useState('')
  const [kelompokFilters, setKelompokFilters] = useState({
    desa: [] as string[],
    program: [] as string[],
    tahun: [] as string[],
    pembina: [] as string[],
    relawan: [] as string[]
  })

  const filterOptions = React.useMemo(() => {
    const getOptions = (excludeKey: keyof typeof kelompokFilters) => {
      return initialKelompok.filter(kel => {
        const q = searchKelompok.toLowerCase()
        const matchesSearch = !q || (
          kel.nama_kelompok?.toLowerCase().includes(q) ||
          kel.nama_pembina?.toLowerCase().includes(q) ||
          kel.nama_relawan?.toLowerCase().includes(q)
        )

        const matchDesa = excludeKey === 'desa' || kelompokFilters.desa.length === 0 || kelompokFilters.desa.includes(kel.nama_desa || 'Tanpa Desa')
        const matchProgram = excludeKey === 'program' || kelompokFilters.program.length === 0 || kelompokFilters.program.includes(kel.nama_program || 'Tanpa Program')
        const matchTahun = excludeKey === 'tahun' || kelompokFilters.tahun.length === 0 || kelompokFilters.tahun.includes((kel.tahun || '').toString())
        const matchPembina = excludeKey === 'pembina' || kelompokFilters.pembina.length === 0 || kelompokFilters.pembina.includes(kel.nama_pembina || 'Tanpa Pembina')
        const matchRelawan = excludeKey === 'relawan' || kelompokFilters.relawan.length === 0 || kelompokFilters.relawan.includes(kel.nama_relawan || 'Tanpa Relawan')

        return matchesSearch && matchDesa && matchProgram && matchTahun && matchPembina && matchRelawan
      })
    }

    return {
      desa: Array.from(new Set(getOptions('desa').map(k => k.nama_desa || 'Tanpa Desa'))).sort() as string[],
      program: Array.from(new Set(getOptions('program').map(k => k.nama_program || 'Tanpa Program'))).sort() as string[],
      tahun: Array.from(new Set(getOptions('tahun').map(k => (k.tahun || '').toString()))).sort((a,b) => Number(b) - Number(a)) as string[],
      pembina: Array.from(new Set(getOptions('pembina').map(k => k.nama_pembina || 'Tanpa Pembina'))).sort() as string[],
      relawan: Array.from(new Set(getOptions('relawan').map(k => k.nama_relawan || 'Tanpa Relawan'))).sort() as string[],
    }
  }, [initialKelompok, searchKelompok, kelompokFilters])

  const filteredKelompok = React.useMemo(() => {
    return initialKelompok.filter(kel => {
      const q = searchKelompok.toLowerCase()
      const matchesSearch = !q || (
        kel.nama_kelompok?.toLowerCase().includes(q) ||
        kel.nama_pembina?.toLowerCase().includes(q) ||
        kel.nama_relawan?.toLowerCase().includes(q)
      )

      const matchDesa = kelompokFilters.desa.length === 0 || kelompokFilters.desa.includes(kel.nama_desa || 'Tanpa Desa')
      const matchProgram = kelompokFilters.program.length === 0 || kelompokFilters.program.includes(kel.nama_program || 'Tanpa Program')
      const matchTahun = kelompokFilters.tahun.length === 0 || kelompokFilters.tahun.includes((kel.tahun || '').toString())
      const matchPembina = kelompokFilters.pembina.length === 0 || kelompokFilters.pembina.includes(kel.nama_pembina || 'Tanpa Pembina')
      const matchRelawan = kelompokFilters.relawan.length === 0 || kelompokFilters.relawan.includes(kel.nama_relawan || 'Tanpa Relawan')

      return matchesSearch && matchDesa && matchProgram && matchTahun && matchPembina && matchRelawan
    })
  }, [initialKelompok, searchKelompok, kelompokFilters])

  const toggleFilter = (type: keyof typeof kelompokFilters, value: string) => {
    setKelompokFilters(prev => ({
      ...prev,
      [type]: prev[type].includes(value)
        ? prev[type].filter(v => v !== value)
        : [...prev[type], value]
    }))
  }

  const clearFilters = () => {
    setSearchKelompok('')
    setKelompokFilters({ desa: [], program: [], tahun: [], pembina: [], relawan: [] })
  }

  const hasAnyFilter = searchKelompok !== '' || Object.values(kelompokFilters).some(arr => arr.length > 0)

  const exportToExcel = () => {
    const dataToExport = filteredKelompok.map((kel: any) => ({
      'Nama Kelompok': kel.nama_kelompok,
      'Desa Binaan': kel.nama_desa,
      'Program': kel.nama_program,
      'Tahun': kel.tahun,
      'Nama Pembina': kel.nama_pembina,
      'Relawan Penanggung Jawab': kel.nama_relawan || '-',
      'Jumlah Anggota': kel.anggota?.length || 0,
      'Daftar Anggota PM': kel.anggota ? kel.anggota.map((a:any) => a.nama_pm).join(', ') : ''
    }))

    const worksheet = XLSX.utils.json_to_sheet(dataToExport)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, "Daftar Kelompok")
    XLSX.writeFile(workbook, "Daftar_Kelompok_PM.xlsx")
  }

  // Helper
  const getAgeCategory = (tanggal_lahir: string | null) => {
    if (!tanggal_lahir) return 'Tanpa Tanggal Lahir'
    const today = new Date()
    const dob = new Date(tanggal_lahir)
    let age = today.getFullYear() - dob.getFullYear()
    const m = today.getMonth() - dob.getMonth()
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
      age--
    }
    if (age < 12) return 'Anak-anak'
    if (age >= 12 && age <= 17) return 'Remaja'
    if (age >= 18 && age <= 59) return 'Dewasa'
    if (age >= 60) return 'Lanjut Usia'
    return 'Lainnya'
  }

  const filteredPMs = desaPMs.filter(pm => {
    let matchUmur = true
    let matchGender = true

    if (filterUmur.length > 0) {
      matchUmur = filterUmur.includes(getAgeCategory(pm.tanggal_lahir))
    }
    if (filterGender.length > 0) {
      matchGender = filterGender.includes(pm.jenis_kelamin?.toUpperCase() || '')
    }

    return matchUmur && matchGender
  })

  useEffect(() => {
    if (defaultDesaId) {
      const desaIdStr = defaultDesaId.toString()
      setKelompokDesaId(desaIdStr)
      fetchPMsForDesa(desaIdStr)
    }
  }, [defaultDesaId])

  // Handlers Kelompok
  const fetchPMsForDesa = async (desaId: string) => {
    setIsLoadingPMs(true)
    try {
      const pms = await getPenerimaManfaatByDesaId(Number(desaId))
      setDesaPMs(pms)
    } catch (e: any) {
      toast({ title: 'Error', description: 'Gagal mengambil data PM', variant: 'destructive' })
    } finally {
      setIsLoadingPMs(false)
    }
  }

  const handleDesaChange = (val: string) => {
    setKelompokDesaId(val)
    fetchPMsForDesa(val)
    
    // Auto-fill nama pembina with relawan's name
    const selectedDesa = desaOptions.find(d => d.id.toString() === val)
    if (selectedDesa && selectedDesa.nama_relawan) {
      setNamaPembina(selectedDesa.nama_relawan)
    }

    setSelectedPMs([]) 
  }

  const handleOpenAddKelompok = () => {
    setIsEditKelompok(false)
    setActiveKelompokObj(null)
    setKelompokDesaId('')
    setNamaKelompok('')
    setNamaPembina('')
    setTahunKel(new Date().getFullYear())
    setKelompokProgramId('')
    setSelectedPMs([])
    setFilterUmur([])
    setFilterGender([])
    setDesaPMs([])
    setIsOpenKelompok(true)
  }

  const handleOpenEditKelompok = async (kel: any) => {
    setIsEditKelompok(true)
    setActiveKelompokObj(kel)
    setKelompokDesaId(kel.desa_berdaya_id.toString())
    setNamaKelompok(kel.nama_kelompok || '')
    setNamaPembina(kel.nama_pembina || '')
    setTahunKel(kel.tahun || new Date().getFullYear())
    setKelompokProgramId(kel.program_id ? kel.program_id.toString() : '')
    setSelectedPMs(kel.anggota ? kel.anggota.map((a: any) => a.id) : [])
    await fetchPMsForDesa(kel.desa_berdaya_id.toString())
    setIsOpenKelompok(true)
  }

  const handleOpenTambahAnggota = async (kel: any) => {
    // Treat as Edit but focus on adding Anggota
    setIsEditKelompok(true)
    setActiveKelompokObj(kel)
    setKelompokDesaId(kel.desa_berdaya_id.toString())
    setNamaKelompok(kel.nama_kelompok || '')
    setNamaPembina(kel.nama_pembina || '')
    setTahunKel(kel.tahun || new Date().getFullYear())
    setKelompokProgramId(kel.program_id ? kel.program_id.toString() : '')
    setSelectedPMs(kel.anggota ? kel.anggota.map((a: any) => a.id) : [])
    await fetchPMsForDesa(kel.desa_berdaya_id.toString())
    setIsOpenKelompok(true)

    // Optional: we can scroll or highlight the anggota section, but opening edit with pre-filled data is the simplest approach
  }

  const handleTogglePM = (pmId: number) => {
    setSelectedPMs(prev => 
      prev.includes(pmId) ? prev.filter(id => id !== pmId) : [...prev, pmId]
    )
  }

  const handleSaveKelompok = async () => {
    if (!kelompokDesaId || !namaKelompok.trim() || !namaPembina.trim() || !tahunKel || !kelompokProgramId) {
      toast({ title: 'Error', description: 'Pastikan form wajib (*) sudah diisi.', variant: 'destructive' })
      return
    }

    setIsSubmittingKelompok(true)
    try {
      let res
      if (isEditKelompok && activeKelompokObj) {
        res = await updateKelompok(
          activeKelompokObj.id,
          parseInt(kelompokDesaId),
          namaKelompok,
          namaPembina,
          tahunKel,
          parseInt(kelompokProgramId),
          selectedPMs
        )
      } else {
        res = await createKelompok(
          parseInt(kelompokDesaId),
          namaKelompok,
          namaPembina,
          tahunKel,
          0, // Relawan dikembalikan otomatis oleh aksi backend dari Desa ID nya
          parseInt(kelompokProgramId),
          selectedPMs
        )
      }

      if (res.success) {
        toast({ title: 'Sukses', description: `Kelompok berhasil ${isEditKelompok ? 'diubah' : 'ditambahkan'}.` })
        setIsOpenKelompok(false)
      } else {
        toast({ title: 'Gagal', description: res.error, variant: 'destructive' })
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setIsSubmittingKelompok(false)
    }
  }

  const handleDeleteKelompok = async (id: number, desa_id: number) => {
    if (!confirm('Apakah Yakin ingin menghapus kelompok ini?')) return
    try {
      const res = await deleteKelompok(id, desa_id)
      if (res.success) {
        toast({ title: 'Sukses', description: 'Kelompok berhasil dihapus.' })
      } else {
        toast({ title: 'Gagal', description: res.error, variant: 'destructive' })
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#7a1200]"/> Daftar Kelompok PM
          </h2>
          <p className="text-sm text-slate-500">Kumpulan kelompok dari semua daftar Desa Binaan Anda.</p>
        </div>
        <div className="flex items-center gap-2">
           <div className="hidden sm:flex items-center bg-slate-100 p-1 rounded-xl mr-2">
              <Button
                variant="ghost"
                size="sm"
                className={`rounded-lg h-8 px-3 ${viewMode === 'grid' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="w-4 h-4 mr-2" /> Grid
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={`rounded-lg h-8 px-3 ${viewMode === 'table' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500 hover:text-slate-700'}`}
                onClick={() => setViewMode('table')}
              >
                <List className="w-4 h-4 mr-2" /> Table
              </Button>
           </div>
           
           <Button variant="outline" size="sm" onClick={exportToExcel} className="h-9 px-3 text-emerald-700 border-emerald-200 hover:bg-emerald-50 rounded-lg">
             <Download className="w-4 h-4 sm:mr-2" />
             <span className="hidden sm:inline">Export Excel</span>
           </Button>

          {canMod && (
            <Button onClick={handleOpenAddKelompok} className="!bg-[var(--brand-primary)] hover:brightness-90 text-white shadow-sm transition-all h-9 rounded-lg">
              <Plus className="w-4 h-4 sm:mr-2" /> <span className="hidden sm:inline">Tambah Kelompok</span>
            </Button>
          )}
        </div>
      </div>

      <div className="flex flex-col md:flex-row flex-wrap gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari kelompok, pembina..."
            value={searchKelompok}
            onChange={(e) => setSearchKelompok(e.target.value)}
            className="w-full pl-9 pr-4 py-2 h-[42px] border border-slate-200 rounded-xl text-sm bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#7a1200]/20 focus:border-[#7a1200] focus:bg-white transition-all"
          />
        </div>

        <MultiSelectFilter 
          label="Desa Binaan" 
          options={filterOptions.desa} 
          selected={kelompokFilters.desa}
          onSelect={(val) => toggleFilter('desa', val)}
          onClear={() => setKelompokFilters(f => ({ ...f, desa: [] }))}
        />
        <MultiSelectFilter 
          label="Program" 
          options={filterOptions.program} 
          selected={kelompokFilters.program}
          onSelect={(val) => toggleFilter('program', val)}
          onClear={() => setKelompokFilters(f => ({ ...f, program: [] }))}
        />
        <MultiSelectFilter 
          label="Tahun" 
          options={filterOptions.tahun} 
          selected={kelompokFilters.tahun}
          onSelect={(val) => toggleFilter('tahun', val)}
          onClear={() => setKelompokFilters(f => ({ ...f, tahun: [] }))}
        />
        <MultiSelectFilter 
          label="Pembina" 
          options={filterOptions.pembina} 
          selected={kelompokFilters.pembina}
          onSelect={(val) => toggleFilter('pembina', val)}
          onClear={() => setKelompokFilters(f => ({ ...f, pembina: [] }))}
        />
        <MultiSelectFilter 
          label="Relawan" 
          options={filterOptions.relawan} 
          selected={kelompokFilters.relawan}
          onSelect={(val) => toggleFilter('relawan', val)}
          onClear={() => setKelompokFilters(f => ({ ...f, relawan: [] }))}
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
      </div>

      {viewMode === 'table' ? (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3 min-w-[200px] sticky left-0 bg-slate-50 z-10 border-r border-slate-100">Nama Kelompok</th>
                  <th className="px-4 py-3 min-w-[150px]">Atribut</th>
                  <th className="px-4 py-3 min-w-[150px]">Kepengurusan</th>
                  <th className="px-4 py-3 min-w-[200px]">Anggota PM</th>
                  {canMod && <th className="px-4 py-3 min-w-[100px] text-right">Aksi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredKelompok.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                      {initialKelompok.length === 0 ? 'Belum Ada Kelompok' : 'Tidak ada kelompok yang cocok dengan filter'}
                    </td>
                  </tr>
                ) : (
                  filteredKelompok.map(kel => (
                    <tr key={kel.id} className="hover:bg-slate-50/50 group/row transition-colors">
                      <td className="px-4 py-3 sticky left-0 bg-white group-hover/row:bg-slate-50 z-10 border-r border-slate-100/50 align-top">
                        <div className="font-bold text-slate-800">{kel.nama_kelompok}</div>
                        <div className="text-[10px] text-slate-500 font-bold mt-1 tracking-wider">TAHUN: {kel.tahun}</div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="flex flex-col items-start gap-1.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border-none">
                            <span className="mr-1 opacity-70">Desa:</span> {kel.nama_desa}
                          </span>
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 border-none">
                            <span className="mr-1 opacity-70">Prog:</span> {kel.nama_program} 
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-top">
                        <div className="text-[11px] font-semibold text-slate-700"><span className="text-slate-400 font-normal">Pembina:</span> {kel.nama_pembina}</div>
                        <div className="text-[11px] font-semibold text-slate-700 mt-1.5"><span className="text-slate-400 font-normal">Relawan:</span> {kel.nama_relawan || '-'}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-between items-center mb-2">
                           <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{kel.anggota?.length || 0} Anggota</span>
                           {canMod && (
                             <button onClick={() => handleOpenTambahAnggota(kel)} className="text-[10px] font-bold text-[var(--brand-primary)] hover:underline flex items-center bg-rose-50 px-2 py-0.5 rounded cursor-pointer">
                               <Plus className="w-3 h-3 mr-0.5"/> Tambah
                             </button>
                           )}
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1 custom-scrollbar">
                           {kel.anggota && kel.anggota.length > 0 ? (
                             kel.anggota.map((a: any) => (
                               <span key={a.id} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200/60">
                                 {a.nama_pm}
                               </span>
                             ))
                           ) : (
                             <span className="text-[10px] text-slate-400 italic font-medium">Belum ada PM</span>
                           )}
                        </div>
                      </td>
                      {canMod && (
                        <td className="px-4 py-3 align-top text-right">
                           <div className="flex justify-end gap-2">
                             <Button variant="ghost" size="icon" onClick={() => handleOpenEditKelompok(kel)} className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50">
                                <Edit className="w-4 h-4" />
                             </Button>
                             <Button variant="ghost" size="icon" onClick={() => handleDeleteKelompok(kel.id, kel.desa_berdaya_id)} className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50">
                                <Trash2 className="w-4 h-4" />
                             </Button>
                           </div>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
      <div className="grid grid-cols-1 gap-4">
        {filteredKelompok.length === 0 ? (
          <div className="text-center py-12 px-6 border border-dashed border-slate-300 rounded-xl bg-white">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-slate-700 font-medium mb-1">
              {initialKelompok.length === 0 ? 'Belum Ada Kelompok' : 'Tidak ada hasil'}
            </h4>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">
              {initialKelompok.length === 0 ? 'Silahkan klik tombol "Tambah Kelompok" untuk membuat kelompok baru.' : 'Tidak ada kelompok yang cocok dengan kriteria filter.'}
            </p>
          </div>
        ) : (
          filteredKelompok.map(kel => (
            <div key={kel.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:border-slate-300 transition-colors">
               <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 tracking-tight">{kel.nama_kelompok}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                         {kel.nama_desa}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                        {kel.nama_program} 
                      </span>
                    </div>
                  </div>
                  {canMod && (
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleOpenEditKelompok(kel)} className="h-8">
                         <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDeleteKelompok(kel.id, kel.desa_berdaya_id)} className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                         <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  )}
               </div>
               
               <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4 text-sm">
                 <div>
                    <span className="block text-slate-500 text-xs font-medium uppercase tracking-wider">Tahun</span>
                    <span className="font-semibold text-slate-700">{kel.tahun}</span>
                 </div>
                 <div>
                    <span className="block text-slate-500 text-xs font-medium uppercase tracking-wider">Pembina</span>
                    <span className="font-semibold text-slate-700">{kel.nama_pembina}</span>
                 </div>
                 <div className="col-span-2">
                    <span className="block text-slate-500 text-xs font-medium uppercase tracking-wider">Relawan Penanggung Jawab</span>
                    <span className="font-semibold text-slate-700">{kel.nama_relawan || '-'}</span>
                 </div>
               </div>

                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-sm font-semibold text-slate-800">Anggota PM ({kel.anggota?.length || 0})</h4>
                    {canMod && (
                      <Button variant="ghost" size="sm" onClick={() => handleOpenTambahAnggota(kel)} className="h-7 !text-[var(--brand-primary)] hover:brightness-75 px-2 transition-all">
                        <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Anggota
                      </Button>
                    )}
                  </div>
                 {kel.anggota && kel.anggota.length > 0 ? (
                   <div className="flex flex-wrap gap-2 mt-1">
                     {kel.anggota.map((a: any) => (
                       <span key={a.id} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                         {a.nama_pm}
                       </span>
                     ))}
                   </div>
                 ) : (
                   <p className="text-xs text-slate-500 italic mt-1 pb-1">Belum ada PM yang dimasukkan ke kelompok ini.</p>
                 )}
               </div>
            </div>
          ))
        )}
      </div>
      )}

      {/* MODAL KELOMPOK */}
      <Dialog open={isOpenKelompok} onOpenChange={setIsOpenKelompok}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{isEditKelompok ? 'Edit Kelompok' : 'Tambah Kelompok'}</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-4 py-4 px-1 pr-3">
            <div className="space-y-2">
              <Label>Desa Berdaya <span className="text-red-500">*</span></Label>
              <Select value={kelompokDesaId} onValueChange={handleDesaChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Desa Binaan..." />
                </SelectTrigger>
                <SelectContent>
                  {desaOptions.map(d => (
                    <SelectItem key={d.id} value={d.id.toString()}>{d.nama_desa}</SelectItem>
                  ))}
                  {desaOptions.length === 0 && (
                    <div className="p-2 text-sm text-slate-500">Tidak ada data Desa.</div>
                  )}
                </SelectContent>
              </Select>
            </div>

            {kelompokDesaId && (
              <>
                <div className="space-y-2">
                  <Label>Nama Kelompok <span className="text-red-500">*</span></Label>
                  <Input 
                    placeholder="Misal: Majelis Taklim Al-Ikhlas" 
                    value={namaKelompok} 
                    onChange={(e) => setNamaKelompok(e.target.value)} 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Nama Pembina <span className="text-red-500">*</span></Label>
                    <Input 
                      placeholder="Misal: Budi" 
                      value={namaPembina} 
                      onChange={(e) => setNamaPembina(e.target.value)} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tahun <span className="text-red-500">*</span></Label>
                    <Input 
                      type="number"
                      placeholder="2024" 
                      value={tahunKel} 
                      onChange={(e) => setTahunKel(parseInt(e.target.value) || 0)} 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Program <span className="text-red-500">*</span></Label>
                  <Select value={kelompokProgramId} onValueChange={setKelompokProgramId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Program..." />
                    </SelectTrigger>
                    <SelectContent>
                      {initialPrograms.map(prog => (
                        <SelectItem key={prog.id} value={prog.id.toString()}>
                          {prog.nama_program} <span className="text-slate-400 text-xs">({prog.nama_kategori})</span>
                        </SelectItem>
                      ))}
                      {initialPrograms.length === 0 && (
                        <div className="p-2 text-sm text-slate-500">Belum ada program di Master Program</div>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="pt-2">
                  <Label className="mb-2 block flex justify-between items-center text-slate-700">
                    Filter Anggota PM
                  </Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 border p-3 rounded-xl bg-slate-50/50 border-slate-200">
                    <div>
                      <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Umur</p>
                      <div className="space-y-2">
                        {['Anak-anak', 'Remaja', 'Dewasa', 'Lanjut Usia'].map(cat => (
                          <div key={cat} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`filter-umur-${cat}`}
                              checked={filterUmur.includes(cat)}
                              onCheckedChange={(checked) => {
                                setFilterUmur(prev => checked ? [...prev, cat] : prev.filter(c => c !== cat))
                              }}
                            />
                            <label htmlFor={`filter-umur-${cat}`} className="text-sm text-slate-700 cursor-pointer font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                              {cat}
                              {cat === 'Anak-anak' && <span className="text-slate-400 font-normal ml-1 text-xs">(0-11 thn)</span>}
                              {cat === 'Remaja' && <span className="text-slate-400 font-normal ml-1 text-xs">(12-17 thn)</span>}
                              {cat === 'Dewasa' && <span className="text-slate-400 font-normal ml-1 text-xs">(18-59 thn)</span>}
                              {cat === 'Lanjut Usia' && <span className="text-slate-400 font-normal ml-1 text-xs">(&gt;60 thn)</span>}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Jenis Kelamin</p>
                      <div className="space-y-2">
                        {['LAKI-LAKI', 'PEREMPUAN'].map(jk => (
                          <div key={jk} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`filter-jk-${jk}`}
                              checked={filterGender.includes(jk)}
                              onCheckedChange={(checked) => {
                                setFilterGender(prev => checked ? [...prev, jk] : prev.filter(c => c !== jk))
                              }}
                            />
                            <label htmlFor={`filter-jk-${jk}`} className="text-sm text-slate-700 cursor-pointer font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{jk === 'LAKI-LAKI' ? 'Laki-laki' : 'Perempuan'}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Label className="mb-2 block flex justify-between items-center">
                    <span>Pilih Anggota PM <span className="text-slate-400 font-normal text-xs ml-1">Optional</span></span>
                    <span className="text-xs font-medium text-[#7a1200] bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                      Menampilkan: {filteredPMs.length} PM
                    </span>
                  </Label>
                  {isLoadingPMs ? (
                    <p className="text-sm text-slate-500 p-2 text-center h-[200px] flex items-center justify-center">Loading PM...</p>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 max-h-[250px] overflow-y-auto space-y-2">
                      {desaPMs.length === 0 ? (
                        <p className="text-sm text-slate-500 p-2 text-center">Belum ada data PM di desa ini.</p>
                      ) : filteredPMs.length === 0 ? (
                        <p className="text-sm text-slate-500 p-2 text-center">Tidak ada PM yang cocok dengan filter yang dipilih.</p>
                      ) : (
                        filteredPMs.map(pm => (
                           <div key={pm.id} className="flex flex-row items-center space-x-3 bg-white p-2.5 rounded-lg border border-slate-100 shadow-sm hover:border-slate-300 transition-colors">
                             <Checkbox 
                               id={`pm-${pm.id}`} 
                               checked={selectedPMs.includes(pm.id)}
                               onCheckedChange={() => handleTogglePM(pm.id)}
                             />
                             <label 
                               htmlFor={`pm-${pm.id}`} 
                               className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                             >
                               {pm.nama} <span className="text-slate-400 text-xs ml-1 font-normal">({pm.nik})</span>
                             </label>
                           </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </>
            )}

          </div>

          <DialogFooter className="pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsOpenKelompok(false)} disabled={isSubmittingKelompok}>Batal</Button>
            <Button onClick={handleSaveKelompok} disabled={!kelompokDesaId || isSubmittingKelompok}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
