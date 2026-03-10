'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Users } from 'lucide-react'
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

import { 
  createKelompok, updateKelompok, deleteKelompok 
} from '@/lib/actions/kelompok'
import { getPenerimaManfaatByDesaId } from '@/app/dashboard/pm/actions'

export default function ClientKelompokMainPanel({ 
  initialKelompok, 
  initialPrograms,
  desaOptions,
  initialMasterKelompok = [],
  defaultDesaId,
}: { 
  initialKelompok: any[],
  initialPrograms: any[],
  desaOptions: any[],
  initialMasterKelompok?: any[],
  defaultDesaId?: number
}) {
  const { toast } = useToast()
  
  // States for Kelompok
  const [isOpenKelompok, setIsOpenKelompok] = useState(false)
  const [isEditKelompok, setIsEditKelompok] = useState(false)
  const [activeKelompokObj, setActiveKelompokObj] = useState<any>(null)
  
  // Form fields
  const [kelompokDesaId, setKelompokDesaId] = useState<string>(defaultDesaId ? defaultDesaId.toString() : '')
  const [namaKelompok, setNamaKelompok] = useState('')
  const [masterKelompokId, setMasterKelompokId] = useState<string>('')
  const [namaPembina, setNamaPembina] = useState('')
  const [tahunKel, setTahunKel] = useState<number>(new Date().getFullYear())
  const [kelompokProgramId, setKelompokProgramId] = useState<string>('')
  
  // PM Lists
  const [desaPMs, setDesaPMs] = useState<any[]>([])
  const [selectedPMs, setSelectedPMs] = useState<number[]>([])
  const [isSubmittingKelompok, setIsSubmittingKelompok] = useState(false)
  const [isLoadingPMs, setIsLoadingPMs] = useState(false)

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
    setMasterKelompokId('')
    setNamaPembina('')
    setTahunKel(new Date().getFullYear())
    setKelompokProgramId('')
    setSelectedPMs([])
    setDesaPMs([])
    setIsOpenKelompok(true)
  }

  const handleOpenEditKelompok = async (kel: any) => {
    setIsEditKelompok(true)
    setActiveKelompokObj(kel)
    setKelompokDesaId(kel.desa_berdaya_id.toString())
    setNamaKelompok(kel.nama_kelompok || '')
    setMasterKelompokId(kel.master_kelompok_id ? kel.master_kelompok_id.toString() : '')
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
    setMasterKelompokId(kel.master_kelompok_id ? kel.master_kelompok_id.toString() : '')
    setNamaPembina(kel.nama_pembina || '')
    setTahunKel(kel.tahun || new Date().getFullYear())
    setKelompokProgramId(kel.program_id ? kel.program_id.toString() : '')
    setSelectedPMs(kel.anggota ? kel.anggota.map((a: any) => a.id) : [])
    await fetchPMsForDesa(kel.desa_berdaya_id.toString())
    setIsOpenKelompok(true)

    // Optional: we can scroll or highlight the anggota section, but opening edit with pre-filled data is the simplest approach
  }

  const handleKategoriKelompokChange = (val: string) => {
    setMasterKelompokId(val)
    if (initialMasterKelompok) {
      const selectedMaster = initialMasterKelompok.find(mk => mk.id.toString() === val)
      if (selectedMaster && selectedMaster.program_id) {
        setKelompokProgramId(selectedMaster.program_id.toString())
      }
    }
  }

  const handleTogglePM = (pmId: number) => {
    setSelectedPMs(prev => 
      prev.includes(pmId) ? prev.filter(id => id !== pmId) : [...prev, pmId]
    )
  }

  const handleSaveKelompok = async () => {
    if (!kelompokDesaId || !namaKelompok.trim() || !masterKelompokId || !namaPembina.trim() || !tahunKel || !kelompokProgramId) {
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
          masterKelompokId ? parseInt(masterKelompokId) : null,
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
          masterKelompokId ? parseInt(masterKelompokId) : null,
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
        <Button onClick={handleOpenAddKelompok} className="!bg-[var(--brand-primary)] hover:brightness-90 text-white shadow-sm transition-all">
          <Plus className="w-4 h-4 mr-2" /> Tambah Kelompok
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {initialKelompok.length === 0 ? (
          <div className="text-center py-12 px-6 border border-dashed border-slate-300 rounded-xl bg-white">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-slate-700 font-medium mb-1">Belum Ada Kelompok</h4>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">Silahkan klik tombol &quot;Tambah Kelompok&quot; untuk membuat kelompok baru.</p>
          </div>
        ) : (
          initialKelompok.map(kel => (
            <div key={kel.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:border-slate-300 transition-colors">
               <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 tracking-tight">{kel.nama_kelompok}</h3>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                         {kel.nama_desa}
                      </span>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                        {kel.nama_kategori_kelompok || kel.nama_program} 
                      </span>
                      {kel.nama_kategori_kelompok && kel.nama_program && (
                        <span className="text-xs text-slate-500">({kel.nama_program})</span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenEditKelompok(kel)} className="h-8">
                       <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDeleteKelompok(kel.id, kel.desa_berdaya_id)} className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                       <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
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
                   <Button variant="ghost" size="sm" onClick={() => handleOpenTambahAnggota(kel)} className="h-7 !text-[var(--brand-primary)] hover:brightness-75 px-2 transition-all">
                     <Plus className="w-3.5 h-3.5 mr-1" /> Tambah Anggota
                   </Button>
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

                <div className="space-y-2">
                  <Label>Kategori Kelompok <span className="text-red-500">*</span></Label>
                  <Select value={masterKelompokId} onValueChange={handleKategoriKelompokChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Kategori Kelompok..." />
                    </SelectTrigger>
                    <SelectContent>
                      {initialMasterKelompok?.map(mk => (
                        <SelectItem key={mk.id} value={mk.id.toString()}>{mk.nama_kelompok}</SelectItem>
                      ))}
                      {(!initialMasterKelompok || initialMasterKelompok.length === 0) && (
                        <div className="p-2 text-sm text-slate-500">Belum ada Kategori Kelompok</div>
                      )}
                    </SelectContent>
                  </Select>
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
                  <Label className="mb-2 block">Pilih Anggota PM <span className="text-slate-400 font-normal text-xs ml-1">Optional</span></Label>
                  {isLoadingPMs ? (
                    <p className="text-sm text-slate-500 p-2 text-center h-[200px] flex items-center justify-center">Loading PM...</p>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 max-h-[200px] overflow-y-auto space-y-2">
                      {desaPMs.length === 0 ? (
                        <p className="text-sm text-slate-500 p-2 text-center">Belum ada data PM di desa ini.</p>
                      ) : (
                        desaPMs.map(pm => (
                           <div key={pm.id} className="flex flex-row items-center space-x-3 bg-white p-2 rounded-md border border-slate-100 shadow-sm">
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
