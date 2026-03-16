'use client'

import React, { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  Upload, 
  Loader2, 
  FileImage, 
  FileText, 
  CheckCircle2, 
  ChevronLeft,
  Calendar,
  MapPin,
  Users,
  Target,
  ClipboardList,
  X
} from 'lucide-react'
import { 
  getDesaBerdayaOptions, 
  createLaporanKegiatan, 
  uploadBukti,
  getDesaHierarchy,
  getPMCounts,
  getKelompokByDesaAndProgram,
  getKelompokMembers
} from '../actions'
import { getFormCategories, getFormCategoryById } from '@/lib/actions/form-builder'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card'
import { toast } from 'sonner'

export default function TambahLaporanPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  const [desaOptions, setDesaOptions] = useState<any[]>([])
  const [kategoriOptions, setKategoriOptions] = useState<any[]>([])
  const [programOptions, setProgramOptions] = useState<any[]>([])
  const [selectedKategoriId, setSelectedKategoriId] = useState<number>(0)
  const [selectedProgramId, setSelectedProgramId] = useState<number>(0)
  const [selectedDesa, setSelectedDesa] = useState<any>(null)
  const [hierarchy, setHierarchy] = useState<any>(null)
  const [pmCounts, setPmCounts] = useState<any>(null)
  const [customFields, setCustomFields] = useState<any[]>([])
  const [kelompokOptions, setKelompokOptions] = useState<any[]>([])
  const [selectedKelompokId, setSelectedKelompokId] = useState<number>(0)
  const [groupMembers, setGroupMembers] = useState<any[]>([])
  
  const [formData, setFormData] = useState({
    desa_berdaya_id: 0,
    program_id: 0,
    form_category_id: 0,
    judul_kegiatan: '',
    deskripsi: '',
    bukti_url: [] as string[],
    jenis_kegiatan: 'EKONOMI',
    tanggal_kegiatan: new Date().toISOString().split('T')[0],
    sasaran_program: '',
    lokasi_pelaksanaan: '',
    periode_laporan: new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(new Date()),
    is_terdokumentasi: false,
    custom_fields_data: {} as Record<string, any>,
    kelompok_id: 0
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [desas, kategories] = await Promise.all([
          getDesaBerdayaOptions(),
          import('@/lib/actions/program').then(m => m.getKategoriPrograms())
        ])
        setDesaOptions(desas)
        setKategoriOptions(kategories)
        
        if (desas.length > 0) {
          const firstDesa = desas[0]
          setFormData(prev => ({ ...prev, desa_berdaya_id: firstDesa.id }))
          fetchHierarchy(firstDesa.id)
        }
      } catch (err) {
        console.error('Error loading initial data:', err)
        toast.error('Gagal memuat data awal')
      }
    }
    loadInitialData()
  }, [])

  const fetchHierarchy = async (desaId: number) => {
    try {
      const data = await getDesaHierarchy(desaId)
      setHierarchy(data)
      setSelectedDesa(desaOptions.find(d => Number(d.id) === desaId))
    } catch (e) {
      console.error(e)
    }
  }

  const handleDesaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value)
    setFormData(prev => ({ ...prev, desa_berdaya_id: id, kelompok_id: 0 }))
    setKelompokOptions([])
    setGroupMembers([])
    fetchHierarchy(id)
  }

  const handleKategoriChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const katId = Number(e.target.value)
    setSelectedKategoriId(katId)
    setSelectedProgramId(0)
    setProgramOptions([])
    setCustomFields([])
    
    if (katId > 0) {
      try {
        const programs = await import('../actions').then(m => (m as any).getProgramsByCategory(katId))
        setProgramOptions(programs)
      } catch (e) {
        console.error(e)
        toast.error('Gagal memuat daftar program')
      }
    }
  }

  const handleProgramChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const progId = Number(e.target.value)
    setSelectedProgramId(progId)
    setSelectedKelompokId(0)
    setKelompokOptions([])
    setGroupMembers([])
    
    const program = programOptions.find(p => Number(p.id) === progId)
    const categoryName = kategoriOptions.find(k => Number(k.id) === selectedKategoriId)?.nama_kategori

    setLoading(true)
    try {
      if (formData.desa_berdaya_id && progId) {
        const kelompokData = await getKelompokByDesaAndProgram(formData.desa_berdaya_id, progId)
        setKelompokOptions(kelompokData)
      }

      if (program?.form_category_id) {
        const data = await getFormCategoryById(program.form_category_id)
        if (data) {
          setCustomFields(data.fields || [])
          setFormData(prev => ({ 
            ...prev, 
            program_id: progId,
            kelompok_id: 0,
            form_category_id: program.form_category_id,
            jenis_kegiatan: categoryName?.toUpperCase() || 'EKONOMI',
            judul_kegiatan: `Laporan ${program.nama_program}`,
            custom_fields_data: {} 
          }))

          if (formData.desa_berdaya_id) {
            const counts = await getPMCounts(formData.desa_berdaya_id, progId)
            setPmCounts(counts)
          }
        }
      } else {
        setCustomFields([])
        setPmCounts(null)
        setFormData(prev => ({ 
          ...prev, 
          program_id: progId,
          kelompok_id: 0,
          form_category_id: 0,
          jenis_kegiatan: categoryName?.toUpperCase() || 'EKONOMI',
          judul_kegiatan: `Laporan ${program?.nama_program || ''}`,
          custom_fields_data: {} 
        }))
      }
    } catch (e) {
      console.error(e)
      toast.error('Gagal memuat detail program')
    } finally {
      setLoading(false)
    }
  }

  const handleKelompokChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const kId = Number(e.target.value)
    setSelectedKelompokId(kId)
    setFormData(prev => ({ ...prev, kelompok_id: kId }))
    
    if (kId > 0) {
      setLoading(true)
      try {
        const [members, counts] = await Promise.all([
          getKelompokMembers(kId),
          getPMCounts(formData.desa_berdaya_id, selectedProgramId, kId)
        ])
        setGroupMembers(members)
        setPmCounts(counts)
      } catch (e) {
        console.error(e)
        toast.error('Gagal memuat data kelompok')
      } finally {
        setLoading(false)
      }
    } else {
      setGroupMembers([])
      // Refresh program-wide counts if kelompok is de-selected
      if (formData.desa_berdaya_id && selectedProgramId) {
        const counts = await getPMCounts(formData.desa_berdaya_id, selectedProgramId)
        setPmCounts(counts)
      }
    }
  }

  const handleCustomFieldChange = (name: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      custom_fields_data: {
        ...prev.custom_fields_data,
        [name]: value
      }
    }))
  }

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(number)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        const form = new FormData()
        form.append('file', file)
        return uploadBukti(form)
      })

      const urls = await Promise.all(uploadPromises)
      setFormData(prev => ({ 
        ...prev, 
        bukti_url: [...(Array.isArray(prev.bukti_url) ? prev.bukti_url : []), ...urls] 
      }))
      toast.success(`${urls.length} foto berhasil diunggah`)
    } catch (error: any) {
      toast.error(`Gagal mengunggah file bukti: ${error?.message}`)
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemoveFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      bukti_url: prev.bukti_url.filter((_, i) => i !== index)
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (selectedProgramId === 0) {
      toast.error('Pilih Program terlebih dahulu')
      return
    }

    if (!formData.bukti_url || formData.bukti_url.length === 0) {
      toast.error('Mohon unggah minimal satu file bukti!')
      return
    }

    setLoading(true)
    startTransition(async () => {
      try {
        await createLaporanKegiatan({ 
          ...formData, 
          total_realisasi: 0,
          jumlah_pm_laki: pmCounts?.laki || 0,
          jumlah_pm_perempuan: pmCounts?.perempuan || 0,
          jumlah_pm_total: pmCounts?.total || 0,
          jumlah_kelompok_laki: pmCounts?.kelompok_laki || 0,
          jumlah_kelompok_perempuan: pmCounts?.kelompok_perempuan || 0
        })
        toast.success('Laporan berhasil disimpan')
        router.push('/dashboard/laporan-kegiatan')
      } catch (error) {
        console.error(error)
        toast.error('Gagal menyimpan laporan')
      } finally {
        setLoading(false)
      }
    })
  }

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-8 bg-slate-50/50 min-h-screen">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full bg-white shadow-sm border">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">Buat Laporan Kegiatan</h1>
          <p className="text-slate-500 text-sm font-medium">Lengkapi data di bawah untuk melaporkan aktifitas program.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Panel: Information Summary */}
        <div className="space-y-6">
          <Card className="bg-white border-none shadow-xl shadow-slate-200/50 overflow-hidden rounded-[2rem]">
            <CardHeader className="bg-[#7a1200] text-white p-6 border-none">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-white/70 text-[10px] font-bold uppercase tracking-widest">Informasi Wilayah</p>
                  <CardTitle className="font-black text-lg leading-tight text-white">{hierarchy?.nama_desa || 'Pilih Desa'}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-4">
                <InfoRow label="Cabang/Office" value={hierarchy?.cabang} icon={MapPin} />
                <InfoRow label="Monev" value={hierarchy?.nama_monev} icon={MapPin} />
                <InfoRow label="Korwil" value={hierarchy?.nama_korwil} icon={MapPin} />
                <InfoRow label="Relawan" value={hierarchy?.nama_relawan} icon={MapPin} />
              </div>
              
            </CardContent>
          </Card>

          {pmCounts && (pmCounts.total > 0 || pmCounts.kelompok_laki > 0 || pmCounts.kelompok_perempuan > 0) && (
            <Card className="bg-white border-none shadow-xl shadow-slate-200/50 overflow-hidden rounded-[2rem]">
              <CardHeader className="p-6 pb-2 border-none">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                    <Users className="w-5 h-5" />
                  </div>
                  <h3 className="font-black text-sm text-slate-800">Cakupan Manfaat (Otomatis)</h3>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-2 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <StatBox label="PM Laki-laki" value={pmCounts.laki} color="blue" />
                  <StatBox label="PM Perempuan" value={pmCounts.perempuan} color="rose" />
                  <StatBox label="Kelompok Laki" value={pmCounts.kelompok_laki} color="blue" />
                  <StatBox label="Kelompok Perempuan" value={pmCounts.kelompok_perempuan} color="rose" />
                </div>
                <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                  <p className="text-xs text-slate-500 font-bold uppercase">Total PM Terlayani</p>
                  <p className="text-xl font-black text-slate-800 tracking-tight">{pmCounts.total} Jiwa</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Panel: Form Input */}
        <div className="xl:col-span-2">
          <form onSubmit={handleSubmit} className="bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 border-none p-8 space-y-8">
            {/* Standard Fields */}
            <div className="space-y-6">
              <SectionHeader title="Detail Kegiatan & Identitas" icon={ClipboardList} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Desa Binaan *</Label>
                  <select
                    value={formData.desa_berdaya_id}
                    onChange={handleDesaChange}
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#7a1200] focus:border-[#7a1200] bg-slate-50/50 font-bold text-sm"
                    required
                  >
                    <option value={0}>Pilih Desa Binaan</option>
                    {desaOptions.map(desa => (
                      <option key={desa.id} value={desa.id}>{desa.nama_desa}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Kategori Program *</Label>
                  <select
                    value={selectedKategoriId}
                    onChange={handleKategoriChange}
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#7a1200] focus:border-[#7a1200] bg-slate-50/50 font-bold text-sm"
                    required
                  >
                    <option value={0}>Pilih Bidang Program</option>
                    {kategoriOptions.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nama_kategori}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Pilih Program *</Label>
                  <select
                    value={selectedProgramId}
                    onChange={handleProgramChange}
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#7a1200] focus:border-[#7a1200] bg-slate-50/50 font-bold text-sm"
                    required
                    disabled={!selectedKategoriId}
                  >
                    <option value={0}>Pilih Nama Program</option>
                    {programOptions.map(prog => (
                      <option key={prog.id} value={prog.id}>{prog.nama_program}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Pilih Kelompok PM (Opsional)</Label>
                  <select
                    value={selectedKelompokId}
                    onChange={handleKelompokChange}
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#7a1200] focus:border-[#7a1200] bg-slate-50/50 font-bold text-sm"
                    disabled={!selectedProgramId}
                  >
                    <option value={0}>Pilih Kelompok</option>
                    {kelompokOptions.map(kel => (
                      <option key={kel.id} value={kel.id}>{kel.nama_kelompok} ({kel.nama_pembina})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Tanggal Aktifitas *</Label>
                  <div className="relative">
                    <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      type="date"
                      value={formData.tanggal_kegiatan}
                      onChange={(e) => setFormData(prev => ({ ...prev, tanggal_kegiatan: e.target.value }))}
                      className="pl-12 h-12 rounded-xl border-slate-200 bg-slate-50/50 font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Periode Laporan</Label>
                  <Input
                    value={formData.periode_laporan}
                    onChange={(e) => setFormData(prev => ({ ...prev, periode_laporan: e.target.value }))}
                    className="h-12 rounded-xl border-slate-200 bg-slate-50/50 font-bold"
                    placeholder="Contoh: Maret 2025"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Judul Aktifitas *</Label>
                <Input
                  value={formData.judul_kegiatan}
                  onChange={(e) => setFormData(prev => ({ ...prev, judul_kegiatan: e.target.value }))}
                  className="h-12 rounded-xl border-slate-200 bg-slate-50/50 font-bold"
                  placeholder="Nama aktifitas yang dilakukan"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Sasaran Program</Label>
                  <div className="relative">
                    <Target className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={formData.sasaran_program}
                      onChange={(e) => setFormData(prev => ({ ...prev, sasaran_program: e.target.value }))}
                      className="pl-12 h-12 rounded-xl border-slate-200 bg-slate-50/50 font-bold"
                      placeholder="Contoh: UMKM Binaan"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Lokasi Pelaksanaan</Label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                      value={formData.lokasi_pelaksanaan}
                      onChange={(e) => setFormData(prev => ({ ...prev, lokasi_pelaksanaan: e.target.value }))}
                      className="pl-12 h-12 rounded-xl border-slate-200 bg-slate-50/50 font-bold"
                      placeholder="Detail alamat pelaksanaan"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Members Display */}
            {groupMembers.length > 0 && (
              <div className="space-y-4 pt-6 border-t border-slate-100">
                <SectionHeader title="Anggota Kelompok" icon={Users} />
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {groupMembers.map((member) => (
                      <div key={member.id} className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm border border-slate-100">
                        <div className={`p-2 rounded-lg ${member.jenis_kelamin === 'Laki-laki' ? 'bg-blue-50 text-blue-600' : 'bg-rose-50 text-rose-600'}`}>
                          <Users className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-800 truncate">{member.nama}</p>
                          <p className="text-[10px] text-slate-400 font-bold uppercase">{member.jenis_kelamin}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Dynamic Custom Fields */}
            {customFields.length > 0 && (
              <div className="space-y-6 pt-6 border-t border-slate-100">
                <SectionHeader title="Form Spesifik Program" icon={FileText} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {customFields.map((field) => (
                    <div key={field.id} className="space-y-2">
                      <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">
                        {field.field_label} {field.is_required && '*'}
                      </Label>
                      {field.field_type === 'textarea' ? (
                        <textarea
                          value={formData.custom_fields_data[field.field_name] || ''}
                          onChange={(e) => handleCustomFieldChange(field.field_name, e.target.value)}
                          className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#7a1200] focus:border-[#7a1200] bg-slate-50/50 font-bold text-sm min-h-[100px]"
                          required={field.is_required}
                        />
                      ) : (
                        <Input
                          type={field.field_type === 'number' ? 'number' : field.field_type === 'date' ? 'date' : 'text'}
                          value={formData.custom_fields_data[field.field_name] || ''}
                          onChange={(e) => handleCustomFieldChange(field.field_name, e.target.value)}
                          className="h-12 rounded-xl border-slate-200 bg-slate-50/50 font-bold"
                          required={field.is_required}
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Documentation */}
            <div className="space-y-6 pt-6 border-t border-slate-100">
              <SectionHeader title="Dokumentasi" icon={ClipboardList} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                <div className="space-y-4">
                  <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Lampiran Bukti *</Label>
                  
                  {/* Image Grid */}
                  {formData.bukti_url.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                      {formData.bukti_url.map((url, index) => (
                        <div key={index} className="group relative aspect-square rounded-2xl overflow-hidden border-2 border-slate-100 bg-slate-50 shadow-sm transition-all hover:shadow-md hover:border-[#7a1200]/30">
                          <img src={url} alt={`Bukti ${index + 1}`} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <Button type="button" variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-white text-slate-700" asChild>
                              <a href={url} target="_blank" rel="noreferrer"><FileImage className="w-4 h-4" /></a>
                            </Button>
                            <Button 
                              type="button" 
                              variant="destructive" 
                              size="icon" 
                              className="h-8 w-8 rounded-full bg-rose-500 text-white"
                              onClick={() => handleRemoveFile(index)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      
                      {/* Add more button tile if less than limit if any */}
                      <button 
                        type="button" 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploading}
                        className="aspect-square rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 flex flex-col items-center justify-center gap-2 hover:border-[#7a1200] hover:bg-rose-50/30 transition-all group"
                      >
                        {uploading ? <Loader2 className="w-6 h-6 text-slate-400 animate-spin" /> : <Upload className="w-6 h-6 text-slate-400 group-hover:text-[#7a1200]" />}
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest group-hover:text-[#7a1200]">Tambah Foto</span>
                      </button>
                    </div>
                  )}

                  {!formData.bukti_url.length && (
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="h-16 w-full rounded-2xl flex flex-col items-center justify-center gap-1 border-dashed border-2 hover:border-[#7a1200] hover:bg-rose-50/30 font-black transition-all"
                    >
                      {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                      <span>Unggah Foto Dokumentasi</span>
                    </Button>
                  )}
                  
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileUpload} 
                    className="hidden" 
                    accept="image/*" 
                    multiple 
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <Checkbox 
                  id="terdokumentasi" 
                  checked={formData.is_terdokumentasi} 
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_terdokumentasi: !!checked }))}
                />
                <label htmlFor="terdokumentasi" className="text-sm font-bold text-slate-700 cursor-pointer">
                  Kegiatan ini telah terdokumentasi dengan baik (Foto/Video)
                </label>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-black text-slate-400 uppercase tracking-widest">Deskripsi / Catatan Tambahan</Label>
                <textarea
                  value={formData.deskripsi}
                  onChange={(e) => setFormData(prev => ({ ...prev, deskripsi: e.target.value }))}
                  className="w-full p-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-[#7a1200] focus:border-[#7a1200] bg-slate-50/50 font-bold text-sm min-h-[120px]"
                  placeholder="Berikan ringkasan singkat hasil kegiatan..."
                  required
                />
              </div>
            </div>

            <div className="pt-8 border-t flex justify-end">
              <Button type="submit" disabled={loading || uploading} className="h-14 rounded-2xl bg-[#7a1200] hover:bg-[#5a0d00] px-10 font-black text-lg shadow-xl shadow-[#7a1200]/20 active:scale-[0.98] transition-all gap-3">
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                Kirim Laporan
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value, icon: Icon }: any) {
  return (
    <div className="flex items-start gap-4">
      <div className="p-2 bg-slate-50 rounded-lg text-slate-400 flex-shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">{label}</p>
        <p className="font-bold text-slate-700 text-sm truncate">{value || '-'}</p>
      </div>
    </div>
  )
}

function StatBox({ label, value, color }: any) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100'
  }
  return (
    <div className={`p-4 rounded-2xl border ${colors[color]} flex flex-col justify-between`}>
      <p className="text-[9px] font-black uppercase tracking-widest mb-1">{label}</p>
      <p className="text-xl font-black">{value || 0}</p>
    </div>
  )
}

function SectionHeader({ title, icon: Icon }: any) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <div className="p-2 bg-[#7a1200]/5 text-[#7a1200] rounded-lg">
        <Icon className="w-4 h-4" />
      </div>
      <h3 className="font-black text-sm text-slate-800 uppercase tracking-wider">{title}</h3>
    </div>
  )
}
