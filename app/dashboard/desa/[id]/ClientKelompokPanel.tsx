'use client'

import { useState } from 'react'
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

export function ClientKelompokPanel({ 
  desaId, 
  initialKelompok,
  programs,
  kategoriPrograms,
  penerimaManfaat,
  relawanId
}: { 
  desaId: number,
  initialKelompok: any[],
  programs: any[],
  kategoriPrograms: any[],
  penerimaManfaat: any[],
  relawanId: number | null
}) {
  const { toast } = useToast()
  
  const [isOpen, setIsOpen] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [activeKelompok, setActiveKelompok] = useState<any>(null)
  
  // Form States
  const [namaKelompok, setNamaKelompok] = useState('')
  const [namaPembina, setNamaPembina] = useState('')
  const [tahun, setTahun] = useState<number>(new Date().getFullYear())
  const [programId, setProgramId] = useState<string>('')
  const [selectedPMs, setSelectedPMs] = useState<number[]>([])
  
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filter States
  const [filterUmur, setFilterUmur] = useState<string[]>([])
  const [filterGender, setFilterGender] = useState<string[]>([])

  // Helper
  const getAgeCategory = (tanggal_lahir: string | null | undefined) => {
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

  const filteredPMs = penerimaManfaat.filter(pm => {
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

  const handleOpenAdd = () => {
    setIsEdit(false)
    setActiveKelompok(null)
    setNamaKelompok('')
    setNamaPembina('')
    setTahun(new Date().getFullYear())
    setProgramId('')
    setSelectedPMs([])
    setFilterUmur([])
    setFilterGender([])
    setIsOpen(true)
  }

  const handleOpenEdit = (kel: any) => {
    setIsEdit(true)
    setActiveKelompok(kel)
    setNamaKelompok(kel.nama_kelompok || '')
    setNamaPembina(kel.nama_pembina || '')
    setTahun(kel.tahun || new Date().getFullYear())
    setProgramId(kel.program_id ? kel.program_id.toString() : '')
    setSelectedPMs(kel.anggota ? kel.anggota.map((a: any) => a.id) : [])
    setIsOpen(true)
  }

  const handleTogglePM = (pmId: number) => {
    setSelectedPMs(prev => 
      prev.includes(pmId) ? prev.filter(id => id !== pmId) : [...prev, pmId]
    )
  }

  const handleSave = async () => {
    if (!namaKelompok.trim() || !namaPembina.trim() || !tahun || !programId) {
      toast({ title: 'Error', description: 'Semua field wajib diisi.', variant: 'destructive' })
      return
    }

    if (!relawanId) {
      toast({ title: 'Error', description: 'Desa belum memiliki Relawan Pendamping.', variant: 'destructive' })
      return
    }

    setIsSubmitting(true)
    try {
      let res
      if (isEdit && activeKelompok) {
        res = await updateKelompok(
          activeKelompok.id,
          desaId,
          namaKelompok,
          namaPembina,
          tahun,
          parseInt(programId),
          selectedPMs
        )
      } else {
        res = await createKelompok(
          desaId,
          namaKelompok,
          namaPembina,
          tahun,
          relawanId,
          parseInt(programId),
          selectedPMs
        )
      }

      if (res.success) {
        toast({ title: 'Sukses', description: `Kelompok berhasil ${isEdit ? 'diubah' : 'ditambahkan'}.` })
        setIsOpen(false)
      } else {
        toast({ title: 'Gagal', description: res.error, variant: 'destructive' })
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Apakah Yakin ingin menghapus kelompok ini?')) return
    try {
      const res = await deleteKelompok(id, desaId)
      if (res.success) {
        toast({ title: 'Sukses', description: 'Kelompok berhasil dihapus.' })
      } else {
        toast({ title: 'Gagal', description: res.error, variant: 'destructive' })
      }
    } catch (e: any) {
      toast({ title: 'Error', description: e.message, variant: 'destructive' })
    }
  }

  // Get Kategori Program Name based on selected Program
  const selectedProgramObj = programs.find(p => p.id.toString() === programId)
  const selectedKategoriObj = selectedProgramObj 
    ? kategoriPrograms.find(k => k.id === selectedProgramObj.kategori_id)
    : null

  return (
    <div className="space-y-6 mt-6">
      <div className="flex justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-[#7a1200]"/> Manajemen Kelompok
          </h2>
          <p className="text-sm text-slate-500 mt-1">Kelola pembagian PM ke dalam kelompok program.</p>
        </div>
        <Button onClick={handleOpenAdd} className="!bg-[var(--brand-primary)] hover:brightness-90 text-white shadow-sm transition-all">
          <Plus className="w-4 h-4 mr-2" /> Tambah Kelompok
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {initialKelompok.length === 0 ? (
          <div className="text-center py-12 px-6 border border-dashed border-slate-300 rounded-xl bg-white">
            <Users className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h4 className="text-slate-700 font-medium mb-1">Belum Ada Kelompok</h4>
            <p className="text-sm text-slate-500 max-w-sm mx-auto">Silahkan klik tombol &quot;Tambah Kelompok&quot; untuk membuat kelompok baru untuk PM di desa ini.</p>
          </div>
        ) : (
          initialKelompok.map(kel => (
            <div key={kel.id} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 hover:border-slate-300 transition-colors">
               <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-slate-800 tracking-tight">{kel.nama_kelompok}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-100">
                        {kel.nama_program} 
                      </span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleOpenEdit(kel)} className="h-8">
                       <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(kel.id)} className="h-8 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200">
                       <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
               </div>
               
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 text-sm">
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
                 <h4 className="text-sm font-semibold text-slate-800 mb-2">Anggota PM ({kel.anggota?.length || 0})</h4>
                 {kel.anggota && kel.anggota.length > 0 ? (
                   <div className="flex flex-wrap gap-2">
                     {kel.anggota.map((a: any) => (
                       <span key={a.id} className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                         {a.nama_pm}
                       </span>
                     ))}
                   </div>
                 ) : (
                   <p className="text-xs text-slate-500 italic">Belum ada PM yang dimasukkan ke kelompok ini.</p>
                 )}
               </div>
            </div>
          ))
        )}
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit Kelompok' : 'Tambah Kelompok'}</DialogTitle>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto space-y-4 py-4 px-1 pr-3">
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
                  value={tahun} 
                  onChange={(e) => setTahun(parseInt(e.target.value) || 0)} 
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Program <span className="text-red-500">*</span></Label>
              <Select value={programId} onValueChange={setProgramId}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih Program..." />
                </SelectTrigger>
                <SelectContent>
                  {programs.map(prog => (
                    <SelectItem key={prog.id} value={prog.id.toString()}>
                      {prog.nama_program} <span className="text-slate-400 text-xs">({prog.nama_kategori})</span>
                    </SelectItem>
                  ))}
                  {programs.length === 0 && (
                    <div className="p-2 text-sm text-slate-500">Belum ada program di Master Program</div>
                  )}
                </SelectContent>
              </Select>
            </div>
            
            {programId && selectedKategoriObj && (
              <div className="px-3 py-2 bg-slate-50 rounded-md border border-slate-100 text-sm">
                <span className="text-slate-500">Kategori Kelompok ini akan masuk ke:</span> <strong className="text-slate-800">{selectedKategoriObj.nama_kategori}</strong>
              </div>
            )}

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
                <span>Pilih PM (List Penerima Manfaat) <span className="text-slate-400 font-normal text-xs ml-1">Optional</span></span>
                <span className="text-xs font-medium text-[#7a1200] bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                  Menampilkan: {filteredPMs.length} PM
                </span>
              </Label>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-2 max-h-[250px] overflow-y-auto space-y-2">
                {penerimaManfaat.length === 0 ? (
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
            </div>

          </div>

          <DialogFooter className="pt-4 border-t border-slate-100">
            <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isSubmitting}>Batal</Button>
            <Button onClick={handleSave} disabled={isSubmitting}>Simpan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
