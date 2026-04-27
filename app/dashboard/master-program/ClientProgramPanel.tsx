'use client'

import React, { useState, useMemo } from 'react'
import { Plus, Edit, Trash2, Search, X } from 'lucide-react'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { 
  createKategoriProgram, updateKategoriProgram, deleteKategoriProgram,
  createProgram, updateProgram, deleteProgram
} from '@/lib/actions/program'
import { MultiSelectGroup } from '@/components/ui/multi-select-group'

export default function ClientProgramPanel({ 
  initialKategori, 
  initialPrograms,
  formCategories
}: { 
  initialKategori: any[], 
  initialPrograms: any[],
  formCategories: any[]
}) {
  const { toast } = useToast()
  
  // States for Kategori Modal
  const [isOpenKategori, setIsOpenKategori] = useState(false)
  const [isEditKategori, setIsEditKategori] = useState(false)
  const [activeKategori, setActiveKategori] = useState<any>(null)
  const [namaKategori, setNamaKategori] = useState('')
  const [isSubmittingKategori, setIsSubmittingKategori] = useState(false)

  // States for Program Modal
  const [isOpenProgram, setIsOpenProgram] = useState(false)
  const [isEditProgram, setIsEditProgram] = useState(false)
  const [activeProgram, setActiveProgram] = useState<any>(null)
  const [kategoriId, setKategoriId] = useState<string>('')
  const [namaProgram, setNamaProgram] = useState('')
  const [formCategoryId, setFormCategoryId] = useState<string>('')
  const [isSubmittingProgram, setIsSubmittingProgram] = useState(false)

  const [searchProg, setSearchProg] = useState('')
  const [filterProg, setFilterProg] = useState({
    kategori: [] as string[],
    tipeForm: [] as string[]
  })

  const progOptions = useMemo(() => {
    const getOptions = (excludeKey: keyof typeof filterProg) => {
      return initialPrograms.filter(prog => {
        const q = searchProg.toLowerCase()
        const matchSearch = !q || (prog.nama_program || '').toLowerCase().includes(q)
        
        const matchKategori = excludeKey === 'kategori' || filterProg.kategori.length === 0 || filterProg.kategori.includes(prog.nama_kategori || 'Tanpa Kategori')
        const tipeFormVal = prog.form_category_name || 'Default'
        const matchTipeForm = excludeKey === 'tipeForm' || filterProg.tipeForm.length === 0 || filterProg.tipeForm.includes(tipeFormVal)

        return matchSearch && matchKategori && matchTipeForm
      })
    }

    return {
      kategori: Array.from(new Set(getOptions('kategori').map(p => p.nama_kategori || 'Tanpa Kategori'))).sort() as string[],
      tipeForm: Array.from(new Set(getOptions('tipeForm').map(p => p.form_category_name || 'Default'))).sort() as string[],
    }
  }, [initialPrograms, searchProg, filterProg])

  const filteredPrograms = useMemo(() => {
    return initialPrograms.filter(prog => {
      const q = searchProg.toLowerCase()
      const matchSearch = !q || (prog.nama_program || '').toLowerCase().includes(q)
      if (!matchSearch) return false
      
      const matchKategori = filterProg.kategori.length === 0 || filterProg.kategori.includes(prog.nama_kategori || 'Tanpa Kategori')
      const tipeFormVal = prog.form_category_name || 'Default'
      const matchTipeForm = filterProg.tipeForm.length === 0 || filterProg.tipeForm.includes(tipeFormVal)

      return matchKategori && matchTipeForm
    })
  }, [initialPrograms, searchProg, filterProg])

  const toggleFilterProg = (type: keyof typeof filterProg, value: string) => {
    setFilterProg(prev => ({
      ...prev,
      [type]: prev[type].includes(value) ? prev[type].filter(v => v !== value) : [...prev[type], value]
    }))
  }

  const hasAnyFilterProg = searchProg !== '' || Object.values(filterProg).some(arr => arr.length > 0)  // Handlers Kategori
  const handleOpenAddKategori = () => {
    setIsEditKategori(false)
    setActiveKategori(null)
    setNamaKategori('')
    setIsOpenKategori(true)
  }

  const handleOpenEditKategori = (cat: any) => {
    setIsEditKategori(true)
    setActiveKategori(cat)
    setNamaKategori(cat.nama_kategori || '')
    setIsOpenKategori(true)
  }

  const handleSaveKategori = async () => {
    if (!namaKategori.trim()) {
      toast({ title: 'Error', description: 'Nama kategori program wajib diisi.', variant: 'destructive' })
      return
    }

    setIsSubmittingKategori(true)
    try {
      let res
      if (isEditKategori && activeKategori) {
        res = await updateKategoriProgram(activeKategori.id, namaKategori)
      } else {
        res = await createKategoriProgram(namaKategori)
      }

      if (res.success) {
        toast({ title: 'Sukses', description: `Kategori berhasil ${isEditKategori ? 'diubah' : 'ditambahkan'}.` })
        setIsOpenKategori(false)
      } else {
        toast({ title: 'Gagal', description: res.error, variant: 'destructive' })
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setIsSubmittingKategori(false)
    }
  }

  const handleDeleteKategori = async (id: number) => {
    if (!confirm('Apakah Yakin ingin menghapus kategori ini? Semua program di dalamnya akan ikut terhapus!')) return
    try {
      const res = await deleteKategoriProgram(id)
      if (res.success) {
        toast({ title: 'Sukses', description: 'Kategori berhasil dihapus.' })
      } else {
        toast({ title: 'Gagal', description: res.error, variant: 'destructive' })
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  // Handlers Program
  const handleOpenAddProgram = () => {
    setIsEditProgram(false)
    setActiveProgram(null)
    setKategoriId('')
    setNamaProgram('')
    setFormCategoryId('')
    setIsOpenProgram(true)
  }

  const handleOpenEditProgram = (prog: any) => {
    setIsEditProgram(true)
    setActiveProgram(prog)
    setKategoriId(prog.kategori_id.toString())
    setNamaProgram(prog.nama_program || '')
    setFormCategoryId(prog.form_category_id?.toString() || '')
    setIsOpenProgram(true)
  }

  const handleSaveProgram = async () => {
    if (!kategoriId || !namaProgram.trim()) {
      toast({ title: 'Error', description: 'Kategori dan nama program wajib diisi.', variant: 'destructive' })
      return
    }

    setIsSubmittingProgram(true)
    try {
      let res
      if (isEditProgram && activeProgram) {
        res = await updateProgram(activeProgram.id, parseInt(kategoriId), namaProgram, {
          form_category_id: formCategoryId ? parseInt(formCategoryId) : undefined
        })
      } else {
        res = await createProgram(parseInt(kategoriId), namaProgram, {
          form_category_id: formCategoryId ? parseInt(formCategoryId) : undefined
        })
      }

      if (res.success) {
        toast({ title: 'Sukses', description: `Program berhasil ${isEditProgram ? 'diubah' : 'ditambahkan'}.` })
        setIsOpenProgram(false)
      } else {
        toast({ title: 'Gagal', description: res.error, variant: 'destructive' })
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setIsSubmittingProgram(false)
    }
  }

  const handleDeleteProgram = async (id: number) => {
    if (!confirm('Apakah Yakin ingin menghapus program ini?')) return
    try {
      const res = await deleteProgram(id)
      if (res.success) {
        toast({ title: 'Sukses', description: 'Program berhasil dihapus.' })
      } else {
        toast({ title: 'Gagal', description: res.error, variant: 'destructive' })
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }



  return (
    <Tabs defaultValue="program" className="w-full">
      <TabsList className="mb-6 grid w-full md:w-[400px] grid-cols-2">
        <TabsTrigger value="program">Daftar Program</TabsTrigger>
        <TabsTrigger value="kategori">Kategori Program</TabsTrigger>
      </TabsList>

      {/* TABS: PROGRAM */}
      <TabsContent value="program" className="space-y-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Daftar Program</h2>
            <p className="text-sm text-slate-500">Kumpulan list program yang akan di assign ke kelompok PM.</p>
          </div>
          <Button onClick={handleOpenAddProgram} className="!bg-[var(--brand-primary)] hover:brightness-90 text-white shadow-sm transition-all">
            <Plus className="w-4 h-4 mr-2" /> Tambah Program
          </Button>
        </div>

        <div className="flex flex-col md:flex-row flex-wrap gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari nama program..." 
              value={searchProg}
              onChange={(e) => setSearchProg(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl h-[42px] text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
          </div>
          <MultiSelectGroup 
            title="Filter Data"
            groups={[
              { key: 'kategori', title: 'Kategori Program', options: progOptions.kategori, selected: filterProg.kategori, onChange: (val) => setFilterProg(f => ({ ...f, kategori: val })) },
              { key: 'tipeForm', title: 'Tipe Form', options: progOptions.tipeForm, selected: filterProg.tipeForm, onChange: (val) => setFilterProg(f => ({ ...f, tipeForm: val })) }
            ]}
          />
          {hasAnyFilterProg && (
            <Button
              variant="ghost"
              size="sm"
              className="h-[42px] px-3 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 font-bold gap-1 transition-colors"
              onClick={() => {
                setSearchProg('')
                setFilterProg({ kategori: [], tipeForm: [] })
              }}
            >
              <X className="w-4 h-4" />
              Reset
            </Button>
          )}
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Kategori Program</th>
                  <th className="px-6 py-4">Nama Program</th>
                  <th className="px-6 py-4">Tipe Form</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPrograms.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                      Belum ada data Program yang ditambahkan atau cocok dengan filter.
                    </td>
                  </tr>
                ) : (
                  filteredPrograms.map((prog) => (
                    <tr key={prog.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-800">{prog.nama_kategori}</td>
                      <td className="px-6 py-4 text-slate-600">{prog.nama_program}</td>
                      <td className="px-6 py-4">
                        {prog.form_category_name ? (
                          <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-teal-50 text-teal-700 border border-teal-100">
                            {prog.form_category_name}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Default</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenEditProgram(prog)} className="h-8">
                          <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteProgram(prog.id)} className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </TabsContent>

      {/* TABS: KATEGORI PROGRAM */}
      <TabsContent value="kategori" className="space-y-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Kategori Program</h2>
            <p className="text-sm text-slate-500">Kelompok kategori untuk filter Program (Kesehatan, Lingkungan, e.t.c)</p>
          </div>
          <Button onClick={handleOpenAddKategori} className="!bg-[var(--brand-primary)] hover:brightness-90 text-white shadow-sm transition-all">
            <Plus className="w-4 h-4 mr-2" /> Tambah Kategori
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 w-16 text-center">No</th>
                  <th className="px-6 py-4">Nama Kategori</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {initialKategori.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                      Belum ada data Kategori Program.
                    </td>
                  </tr>
                ) : (
                  initialKategori.map((cat, idx) => (
                    <tr key={cat.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-center text-slate-500">{idx + 1}</td>
                      <td className="px-6 py-4 font-medium text-slate-800">{cat.nama_kategori}</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenEditKategori(cat)} className="h-8">
                          <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteKategori(cat.id)} className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </TabsContent>



      {/* MODAL KATEGORI */}
      <Dialog open={isOpenKategori} onOpenChange={setIsOpenKategori}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditKategori ? 'Edit Kategori Program' : 'Tambah Kategori Program'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nama Kategori</Label>
              <Input 
                placeholder="Misal: Kesehatan, Lingkungan" 
                value={namaKategori} 
                onChange={(e) => setNamaKategori(e.target.value)} 
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpenKategori(false)} disabled={isSubmittingKategori}>Batal</Button>
            <Button onClick={handleSaveKategori} disabled={isSubmittingKategori}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL PROGRAM */}
      <Dialog open={isOpenProgram} onOpenChange={setIsOpenProgram}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditProgram ? 'Edit Program' : 'Tambah Program'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Kategori Program</Label>
              <Select value={kategoriId} onValueChange={setKategoriId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Kategori..." />
                </SelectTrigger>
                <SelectContent>
                  {initialKategori.map(cat => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>{cat.nama_kategori}</SelectItem>
                  ))}
                  {initialKategori.length === 0 && (
                    <div className="p-2 text-sm text-slate-500">Belum ada kategori</div>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Nama Program</Label>
              <Input 
                placeholder="Misal: Posyandu, Bank Sampah" 
                value={namaProgram} 
                onChange={(e) => setNamaProgram(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label>Hubungkan dengan Tipe Form (Opsional)</Label>
              <Select value={formCategoryId} onValueChange={setFormCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Tipe Form..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">-- Tetap Default --</SelectItem>
                  {formCategories.map((fc: any) => (
                    <SelectItem key={fc.id} value={fc.id.toString()}>{fc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-[10px] text-slate-500">Pilih kategori form dinamis yang akan digunakan untuk pelaporan program ini.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpenProgram(false)} disabled={isSubmittingProgram}>Batal</Button>
            <Button onClick={handleSaveProgram} disabled={isSubmittingProgram}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>





    </Tabs>
  )
}
