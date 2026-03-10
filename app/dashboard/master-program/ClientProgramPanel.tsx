'use client'

import { useState } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
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

import {
  createMasterKelompok, updateMasterKelompok, deleteMasterKelompok
} from '@/lib/actions/kelompok'

export default function ClientProgramPanel({ 
  initialKategori, 
  initialPrograms,
  initialMasterKelompok = []
}: { 
  initialKategori: any[], 
  initialPrograms: any[],
  initialMasterKelompok?: any[]
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
  const [isSubmittingProgram, setIsSubmittingProgram] = useState(false)

  // States for Master Kelompok Modal
  const [isOpenKelompok, setIsOpenKelompok] = useState(false)
  const [isEditKelompok, setIsEditKelompok] = useState(false)
  const [activeKelompok, setActiveKelompok] = useState<any>(null)
  const [namaMasterKelompok, setNamaMasterKelompok] = useState('')
  const [kelompokProgramId, setKelompokProgramId] = useState<string>('')
  const [isSubmittingKelompok, setIsSubmittingKelompok] = useState(false)

  // Handlers Kategori
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
    setIsOpenProgram(true)
  }

  const handleOpenEditProgram = (prog: any) => {
    setIsEditProgram(true)
    setActiveProgram(prog)
    setKategoriId(prog.kategori_id.toString())
    setNamaProgram(prog.nama_program || '')
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
        res = await updateProgram(activeProgram.id, parseInt(kategoriId), namaProgram)
      } else {
        res = await createProgram(parseInt(kategoriId), namaProgram)
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

  // Handlers Master Kelompok
  const handleOpenAddKelompok = () => {
    setIsEditKelompok(false)
    setActiveKelompok(null)
    setNamaMasterKelompok('')
    setKelompokProgramId('')
    setIsOpenKelompok(true)
  }

  const handleOpenEditKelompok = (kel: any) => {
    setIsEditKelompok(true)
    setActiveKelompok(kel)
    setNamaMasterKelompok(kel.nama_kelompok || '')
    setKelompokProgramId(kel.program_id ? kel.program_id.toString() : '')
    setIsOpenKelompok(true)
  }

  const handleSaveKelompok = async () => {
    if (!namaMasterKelompok.trim() || !kelompokProgramId) {
      toast({ title: 'Error', description: 'Nama kelompok dan Program wajib diisi.', variant: 'destructive' })
      return
    }

    setIsSubmittingKelompok(true)
    try {
      let res
      if (isEditKelompok && activeKelompok) {
        res = await updateMasterKelompok(activeKelompok.id, namaMasterKelompok, parseInt(kelompokProgramId))
      } else {
        res = await createMasterKelompok(namaMasterKelompok, parseInt(kelompokProgramId))
      }

      if (res.success) {
        toast({ title: 'Sukses', description: `Master Kelompok berhasil ${isEditKelompok ? 'diubah' : 'ditambahkan'}.` })
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

  const handleDeleteKelompok = async (id: number) => {
    if (!confirm('Apakah Yakin ingin menghapus nama kelompok ini?')) return
    try {
      const res = await deleteMasterKelompok(id)
      if (res.success) {
        toast({ title: 'Sukses', description: 'Nama Kelompok berhasil dihapus.' })
      } else {
        toast({ title: 'Gagal', description: res.error, variant: 'destructive' })
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  return (
    <Tabs defaultValue="program" className="w-full">
      <TabsList className="mb-6 grid w-full md:w-[600px] grid-cols-3">
        <TabsTrigger value="program">Daftar Program</TabsTrigger>
        <TabsTrigger value="kategori">Kategori Program</TabsTrigger>
        <TabsTrigger value="kelompok">Kategori Kelompok</TabsTrigger>
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

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Kategori Program</th>
                  <th className="px-6 py-4">Nama Program</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {initialPrograms.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-slate-500">
                      Belum ada data Program yang ditambahkan.
                    </td>
                  </tr>
                ) : (
                  initialPrograms.map((prog) => (
                    <tr key={prog.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-800">{prog.nama_kategori}</td>
                      <td className="px-6 py-4 text-slate-600">{prog.nama_program}</td>
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

      {/* TABS: MASTER KELOMPOK */}
      <TabsContent value="kelompok" className="space-y-6">
        <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Daftar Kategori Kelompok</h2>
            <p className="text-sm text-slate-500">Kumpulan list kategori kelompok yang dapat dipilih saat membuat Kelompok PM.</p>
          </div>
          <Button onClick={handleOpenAddKelompok} className="!bg-[var(--brand-primary)] hover:brightness-90 text-white shadow-sm transition-all">
            <Plus className="w-4 h-4 mr-2" /> Tambah Kelompok
          </Button>
        </div>

        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50 text-slate-600 font-medium border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 w-16 text-center">No</th>
                  <th className="px-6 py-4">Kategori Kelompok</th>
                  <th className="px-6 py-4">Daftar Program</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {initialMasterKelompok && initialMasterKelompok.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                      Belum ada data Kategori Kelompok.
                    </td>
                  </tr>
                ) : (
                  initialMasterKelompok?.map((kel, idx) => (
                    <tr key={kel.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 text-center text-slate-500">{idx + 1}</td>
                      <td className="px-6 py-4 font-medium text-slate-800">{kel.nama_kelompok}</td>
                      <td className="px-6 py-4 text-slate-600">{kel.nama_program || '-'}</td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Button variant="outline" size="sm" onClick={() => handleOpenEditKelompok(kel)} className="h-8">
                          <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handleDeleteKelompok(kel.id)} className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpenProgram(false)} disabled={isSubmittingProgram}>Batal</Button>
            <Button onClick={handleSaveProgram} disabled={isSubmittingProgram}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL MASTER KELOMPOK */}
      <Dialog open={isOpenKelompok} onOpenChange={setIsOpenKelompok}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditKelompok ? 'Edit Kategori Kelompok' : 'Tambah Kategori Kelompok'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Kategori Kelompok</Label>
              <Input 
                placeholder="Misal: Pembinaan Pekan, Bina Mandiri" 
                value={namaMasterKelompok} 
                onChange={(e) => setNamaMasterKelompok(e.target.value)} 
              />
            </div>
            <div className="space-y-2">
              <Label>Program</Label>
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
                    <div className="p-2 text-sm text-slate-500">Belum ada program</div>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsOpenKelompok(false)} disabled={isSubmittingKelompok}>Batal</Button>
            <Button onClick={handleSaveKelompok} disabled={isSubmittingKelompok}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>



    </Tabs>
  )
}
