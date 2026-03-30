'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  ChevronLeft, 
  Loader2, 
  Save, 
  Calendar,
  User,
  Activity,
  Heart,
  Baby,
  Stethoscope
} from 'lucide-react'
import { updateKesehatanUpdate, getKesehatanUpdateById, getDesaBerdayaOptions, getPenerimaManfaatByDesa } from '../../actions'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { toast } from 'sonner'
import { useSession } from 'next-auth/react'

const IMUNISASI_ANAK = ["HB0", "DPTHB1", "DPTHB2", "DPTHB3", "Campak", "BCG", "Polio1", "Polio2", "Polio3", "Polio4", "IPV"]
const IMUNISASI_IBU = ["TT1", "TT2", "TT3", "TT4"]
const PENANGGUNG_BIAYA = ["Umum", "BPJS", "Kartu Indonesia Sehat", "Asuransi"]

export default function EditKesehatanPage() {
  const router = useRouter()
  const params = useParams()
  const id = Number(params.id)
  const { data: session } = useSession()
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [desaOptions, setDesaOptions] = useState<any[]>([])
  const [pmResults, setPmResults] = useState<any[]>([])
  const [selectedDesaId, setSelectedDesaId] = useState<number | null>(null)
  
  const [formData, setFormData] = useState<any>({
    tahun: new Date().getFullYear(),
    bulan: new Date().getMonth() + 1,
    checked: true,
    penerima_manfaat_id: 0,
    is_kader: false,
    nama_relawan: '',
    program_kesehatan: 'Desa Bebas Stunting',
    
    is_anak: false,
    is_ibu: false,
    is_lansia: false,

    // Anak
    tgl_pemeriksaan_anak: '',
    anak_tgl_lahir: '',
    anak_bb_lahir: 0,
    anak_tinggi_badan: 0,
    anak_berat_badan: 0,
    anak_nama_ibu: '',
    anak_ke: 0,
    anak_pendampingan_khusus: 'Tidak',
    anak_asi_eksklusif: 1,
    anak_metode_pengukuran: '',
    anak_lingkar_kepala: 0,
    anak_menderita_diare: false,
    anak_imunisasi: [],
    anak_imd: false,

    // Ibu
    tgl_pemeriksaan_ibu: '',
    ibu_nik: '',
    ibu_tgl_lahir: '',
    ibu_bb_sebelum_hamil: 0,
    ibu_tinggi_badan: 0,
    ibu_berat_badan: 0,
    ibu_lila: 0,
    ibu_umur_kehamilan: 0,
    ibu_hb: false,
    ibu_imunisasi: [],

    // Lansia
    tgl_pemeriksaan_lansia: '',
    lansia_tgl_lahir: '',
    lansia_tinggi_badan: 0,
    lansia_berat_badan: 0,
    lansia_tekanan_darah: '',
    lansia_kolesterol: 0,
    lansia_gula: 0,
    lansia_asam_urat: 0,
    lansia_penanggung_biaya: 'Umum',
    lansia_kepemilikan_bpjs: 'Tidak',
    lansia_aktivitas_harian: '',
    lansia_riwayat_penyakit: '',
    lansia_riwayat_pengobatan: ''
  })

  useEffect(() => {
    async function loadInitialData() {
      try {
        const [desas, existingData] = await Promise.all([
          getDesaBerdayaOptions(),
          getKesehatanUpdateById(id)
        ])
        
        setDesaOptions(desas)
        
        if (existingData) {
          // Parse JSON lists if they are strings
          const parsedAnakImun = typeof existingData.anak_imunisasi === 'string' ? JSON.parse(existingData.anak_imunisasi) : existingData.anak_imunisasi
          const parsedIbuImun = typeof existingData.ibu_imunisasi === 'string' ? JSON.parse(existingData.ibu_imunisasi) : existingData.ibu_imunisasi
          
          const sanitizedData = Object.fromEntries(
            Object.entries(existingData).map(([k, v]) => [k, v === null ? '' : v])
          )
          setFormData((prev: any) => ({
            ...prev,
            ...sanitizedData,
            anak_imunisasi: parsedAnakImun || [],
            ibu_imunisasi: parsedIbuImun || [],
            // Format dates for input[type=date]
            anak_tgl_lahir: existingData.anak_tgl_lahir ? new Date(existingData.anak_tgl_lahir).toISOString().split('T')[0] : '',
            tgl_pemeriksaan_anak: existingData.tgl_pemeriksaan_anak ? new Date(existingData.tgl_pemeriksaan_anak).toISOString().split('T')[0] : '',
            ibu_tgl_lahir: existingData.ibu_tgl_lahir ? new Date(existingData.ibu_tgl_lahir).toISOString().split('T')[0] : '',
            tgl_pemeriksaan_ibu: existingData.tgl_pemeriksaan_ibu ? new Date(existingData.tgl_pemeriksaan_ibu).toISOString().split('T')[0] : '',
            lansia_tgl_lahir: existingData.lansia_tgl_lahir ? new Date(existingData.lansia_tgl_lahir).toISOString().split('T')[0] : '',
            tgl_pemeriksaan_lansia: existingData.tgl_pemeriksaan_lansia ? new Date(existingData.tgl_pemeriksaan_lansia).toISOString().split('T')[0] : '',
          }))
          
          if (existingData.desa_berdaya_id) {
            setSelectedDesaId(Number(existingData.desa_berdaya_id))
            const pms = await getPenerimaManfaatByDesa(Number(existingData.desa_berdaya_id))
            setPmResults(pms)
          }
        }
      } catch (err) {
        console.error(err)
        toast.error('Gagal memuat data')
      } finally {
        setLoading(false)
      }
    }
    loadInitialData()
  }, [id])

  useEffect(() => {
    if (session?.user?.name && !formData.nama_relawan) {
      setFormData((prev: any) => ({ ...prev, nama_relawan: session?.user?.name }))
    }
  }, [session?.user?.name])

  const handleDesaChange = async (val: string) => {
    const desaId = parseInt(val)
    setSelectedDesaId(desaId)
    setFormData((prev: any) => ({ ...prev, penerima_manfaat_id: 0 }))
    setPmResults([])
    const pms = await getPenerimaManfaatByDesa(desaId)
    setPmResults(pms)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.penerima_manfaat_id) {
      toast.error('Mohon pilih Penerima Manfaat')
      return
    }

    setSubmitting(true)
    startTransition(async () => {
      try {
        await updateKesehatanUpdate(id, formData)
        toast.success('Data kesehatan berhasil diperbarui')
        router.push(`/dashboard/kesehatan/${id}`)
      } catch (err) {
        console.error(err)
        toast.error('Gagal memperbarui data')
      } finally {
        setSubmitting(false)
      }
    })
  }

  const toggleImunisasiAnak = (item: string) => {
    const current = formData.anak_imunisasi || []
    if (current.includes(item)) {
      setFormData((prev: any) => ({ ...prev, anak_imunisasi: current.filter((i: string) => i !== item) }))
    } else {
      setFormData((prev: any) => ({ ...prev, anak_imunisasi: [...current, item] }))
    }
  }

  const toggleImunisasiIbu = (item: string) => {
    const current = formData.ibu_imunisasi || []
    if (current.includes(item)) {
      setFormData((prev: any) => ({ ...prev, ibu_imunisasi: current.filter((i: string) => i !== item) }))
    } else {
      setFormData((prev: any) => ({ ...prev, ibu_imunisasi: [...current, item] }))
    }
  }

  const inputClass = "h-12 rounded-xl border-slate-200 bg-slate-50/50 font-bold focus:ring-[#7a1200] focus:border-[#7a1200]"

  if (loading) return <div className="p-8 text-center text-slate-400 font-bold animate-pulse">Memuat form edit...</div>

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-8 bg-slate-50/50 min-h-screen">
      <div className="flex items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200">
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Edit Update Kesehatan</h1>
          <p className="text-slate-500 text-sm font-medium">Perbarui data perkembangan kesehatan Penerima Manfaat.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden">
          <CardHeader className="bg-[#7a1200] text-white p-8">
            <div className="flex items-center gap-3">
              <Stethoscope className="w-6 h-6 text-white/70" />
              <CardTitle className="text-2xl font-bold">Informasi Dasar</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pilih Desa Binaan</Label>
                <select 
                  value={selectedDesaId || ''}
                  onChange={(e) => handleDesaChange(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50/50 font-bold focus:ring-[#7a1200]"
                  required
                >
                  <option value="" disabled>-- Pilih Desa --</option>
                  {desaOptions.map(desa => (
                    <option key={desa.id} value={desa.id}>{desa.nama_desa}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pilih Penerima Manfaat</Label>
                <select 
                  value={formData.penerima_manfaat_id ? String(formData.penerima_manfaat_id) : ''}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, penerima_manfaat_id: parseInt(e.target.value) }))}
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50/50 font-bold focus:ring-[#7a1200]"
                  disabled={!selectedDesaId}
                  required
                >
                  <option value="" disabled>{selectedDesaId ? "-- Pilih PM --" : "Pilih desa dulu..."}</option>
                  {pmResults.map(pm => (
                    <option key={pm.id} value={String(pm.id)}>{pm.nama} - {pm.nik}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pilih Program</Label>
                <select 
                  value={formData.program_kesehatan || ''}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, program_kesehatan: e.target.value }))}
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50/50 font-bold focus:ring-[#7a1200]"
                  required
                >
                  <option value="Desa Bebas Stunting">Desa Bebas Stunting</option>
                  <option value="Ramah Lansia">Ramah Lansia</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tahun</Label>
                <Input 
                  type="number"
                  value={formData.tahun}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, tahun: parseInt(e.target.value) }))}
                  className={inputClass}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bulan</Label>
                <select 
                  value={formData.bulan || ''}
                  onChange={(e) => setFormData((prev: any) => ({ ...prev, bulan: parseInt(e.target.value) }))}
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50/50 font-bold focus:ring-[#7a1200]"
                  required
                >
                  {[...Array(12)].map((_, i) => (
                    <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nama Relawan</Label>
                <Input 
                  value={formData.nama_relawan}
                  readOnly
                  className={`${inputClass} bg-slate-100`}
                />
              </div>
              <div className="flex flex-col justify-center space-y-4 pt-4">
                <div className="flex items-center gap-3">
                  <Checkbox 
                    id="checked" 
                    checked={formData.checked}
                    onCheckedChange={(c) => setFormData((prev: any) => ({ ...prev, checked: !!c }))}
                  />
                  <Label htmlFor="checked" className="font-bold text-slate-700 text-sm cursor-pointer">Checked?</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox 
                    id="is_kader" 
                    checked={formData.is_kader}
                    onCheckedChange={(c) => setFormData((prev: any) => ({ ...prev, is_kader: !!c }))}
                  />
                  <Label htmlFor="is_kader" className="font-bold text-slate-700 text-sm cursor-pointer">Kader?</Label>
                </div>
              </div>
            </div>

            <div className="pt-8 border-t border-slate-100">
              <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 block text-center">Pilih Kategori Penerima Manfaat</Label>
              <RadioGroup 
                value={formData.is_anak ? 'anak' : formData.is_ibu ? 'ibu' : formData.is_lansia ? 'lansia' : ''}
                onValueChange={(val) => {
                  setFormData((prev: any) => ({
                    ...prev,
                    is_anak: val === 'anak',
                    is_ibu: val === 'ibu',
                    is_lansia: val === 'lansia'
                  }))
                }}
                className="grid grid-cols-1 md:grid-cols-3 gap-8"
              >
                <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${formData.is_anak ? 'bg-emerald-50 border-emerald-200 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
                  <RadioGroupItem value="anak" id="r_anak" className="border-emerald-500 text-emerald-600" />
                  <div className="flex flex-col">
                    <Label htmlFor="r_anak" className="text-lg font-black text-emerald-900 cursor-pointer flex items-center gap-2">
                      <Baby className="w-5 h-5" /> Anak?
                    </Label>
                    <span className="text-[10px] font-bold text-emerald-600 uppercase">Input form tumbuh kembang</span>
                  </div>
                </div>

                <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${formData.is_ibu ? 'bg-rose-50 border-rose-200 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
                  <RadioGroupItem value="ibu" id="r_ibu" className="border-rose-500 text-rose-600" />
                  <div className="flex flex-col">
                    <Label htmlFor="r_ibu" className="text-lg font-black text-rose-900 cursor-pointer flex items-center gap-2">
                      <Heart className="w-5 h-5" /> Ibu?
                    </Label>
                    <span className="text-[10px] font-bold text-rose-600 uppercase">Input form kesehatan bumil</span>
                  </div>
                </div>

                <div className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${formData.is_lansia ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
                  <RadioGroupItem value="lansia" id="r_lansia" className="border-blue-500 text-blue-600" />
                  <div className="flex flex-col">
                    <Label htmlFor="r_lansia" className="text-lg font-black text-blue-900 cursor-pointer flex items-center gap-2">
                      <Activity className="w-5 h-5" /> Lansia?
                    </Label>
                    <span className="text-[10px] font-bold text-blue-600 uppercase">Input form kesehatan lansia</span>
                  </div>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
        </Card>

        {/* Anak Form */}
        {formData.is_anak && (
          <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white">
            <CardHeader className="bg-emerald-600 text-white p-6">
              <CardTitle className="font-black uppercase tracking-widest text-sm">Form Anak</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tanggal Lahir</Label>
                  <Input type="date" value={formData.anak_tgl_lahir} onChange={(e) => setFormData((prev: any) => ({ ...prev, anak_tgl_lahir: e.target.value }))} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tanggal Pemeriksaan</Label>
                  <Input type="date" value={formData.tgl_pemeriksaan_anak} onChange={(e) => setFormData((prev: any) => ({ ...prev, tgl_pemeriksaan_anak: e.target.value }))} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nama Ibu</Label>
                  <Input value={formData.anak_nama_ibu} onChange={(e) => setFormData((prev: any) => ({ ...prev, anak_nama_ibu: e.target.value }))} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Anak Ke</Label>
                  <Input type="number" value={formData.anak_ke} onChange={(e) => setFormData((prev: any) => ({ ...prev, anak_ke: parseInt(e.target.value) }))} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pendampingan Khusus?</Label>
                  <select value={formData.anak_pendampingan_khusus || ''} onChange={(e) => setFormData((prev: any) => ({ ...prev, anak_pendampingan_khusus: e.target.value }))} className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50/50 font-bold focus:ring-[#7a1200]">
                    <option value="Ya">Ya</option>
                    <option value="Tidak">Tidak</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">ASI Eksklusif (Bulan)</Label>
                  <select value={formData.anak_asi_eksklusif || ''} onChange={(e) => setFormData((prev: any) => ({ ...prev, anak_asi_eksklusif: parseInt(e.target.value) }))} className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50/50 font-bold focus:ring-[#7a1200]">
                    {[1, 2, 3, 4, 5, 6].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4 border-t border-slate-100">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">BB Lahir (kg)</Label>
                  <Input type="number" step="0.01" value={formData.anak_bb_lahir} onChange={(e) => setFormData((prev: any) => ({ ...prev, anak_bb_lahir: parseFloat(e.target.value) }))} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tinggi Badan (cm)</Label>
                  <Input type="number" step="0.1" value={formData.anak_tinggi_badan} onChange={(e) => setFormData((prev: any) => ({ ...prev, anak_tinggi_badan: parseFloat(e.target.value) }))} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Berat Badan (kg)</Label>
                  <Input type="number" step="0.1" value={formData.anak_berat_badan} onChange={(e) => setFormData((prev: any) => ({ ...prev, anak_berat_badan: parseFloat(e.target.value) }))} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Lingkar Kepala (cm)</Label>
                  <Input type="number" step="0.1" value={formData.anak_lingkar_kepala} onChange={(e) => setFormData((prev: any) => ({ ...prev, anak_lingkar_kepala: parseFloat(e.target.value) }))} className={inputClass} />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-slate-100">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Imunisasi Anak</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-4">
                  {IMUNISASI_ANAK.map(item => (
                    <div key={item} className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-sm">
                      <Checkbox id={`imun-${item}`} checked={formData.anak_imunisasi.includes(item)} onCheckedChange={() => toggleImunisasiAnak(item)} />
                      <Label htmlFor={`imun-${item}`} className="text-xs font-bold text-slate-600 cursor-pointer">{item}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-8 pt-4 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <Checkbox id="anak_imd" checked={formData.anak_imd} onCheckedChange={(c) => setFormData((prev: any) => ({ ...prev, anak_imd: !!c }))} />
                  <Label htmlFor="anak_imd" className="font-bold text-slate-700 text-sm cursor-pointer">IMD?</Label>
                </div>
                <div className="flex items-center gap-3">
                  <Checkbox id="anak_menderita_diare" checked={formData.anak_menderita_diare} onCheckedChange={(c) => setFormData((prev: any) => ({ ...prev, anak_menderita_diare: !!c }))} />
                  <Label htmlFor="anak_menderita_diare" className="font-bold text-slate-700 text-sm cursor-pointer">Menderita Diare?</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ibu Form */}
        {formData.is_ibu && (
          <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white">
            <CardHeader className="bg-rose-600 text-white p-6">
              <CardTitle className="font-black uppercase tracking-widest text-sm">Form Ibu</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">NIK</Label>
                  <Input value={formData.ibu_nik} onChange={(e) => setFormData((prev: any) => ({ ...prev, ibu_nik: e.target.value }))} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tanggal Lahir</Label>
                  <Input type="date" value={formData.ibu_tgl_lahir} onChange={(e) => setFormData((prev: any) => ({ ...prev, ibu_tgl_lahir: e.target.value }))} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tanggal Pemeriksaan</Label>
                  <Input type="date" value={formData.tgl_pemeriksaan_ibu} onChange={(e) => setFormData((prev: any) => ({ ...prev, tgl_pemeriksaan_ibu: e.target.value }))} className={inputClass} />
                </div>
              </div>

               <div className="grid grid-cols-1 md:grid-cols-5 gap-6 pt-4 border-t border-slate-100">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">BB Sblm Hamil (kg)</Label>
                  <Input type="number" step="0.1" value={formData.ibu_bb_sebelum_hamil} onChange={(e) => setFormData((prev: any) => ({ ...prev, ibu_bb_sebelum_hamil: parseFloat(e.target.value) }))} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tinggi Badan (cm)</Label>
                  <Input type="number" step="0.1" value={formData.ibu_tinggi_badan} onChange={(e) => setFormData((prev: any) => ({ ...prev, ibu_tinggi_badan: parseFloat(e.target.value) }))} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Berat Badan (kg)</Label>
                  <Input type="number" step="0.1" value={formData.ibu_berat_badan} onChange={(e) => setFormData((prev: any) => ({ ...prev, ibu_berat_badan: parseFloat(e.target.value) }))} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">LILA (cm)</Label>
                  <Input type="number" step="0.1" value={formData.ibu_lila} onChange={(e) => setFormData((prev: any) => ({ ...prev, ibu_lila: parseFloat(e.target.value) }))} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Umur Hamil (Bulan)</Label>
                  <Input type="number" step="0.5" value={formData.ibu_umur_kehamilan} onChange={(e) => setFormData((prev: any) => ({ ...prev, ibu_umur_kehamilan: parseFloat(e.target.value) }))} className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-100">
                <div className="space-y-4">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Imunisasi Ibu</Label>
                  <div className="flex flex-wrap gap-4">
                    {IMUNISASI_IBU.map(item => (
                      <div key={item} className="flex items-center gap-2 bg-slate-50 p-3 rounded-xl border border-slate-100 shadow-sm">
                        <Checkbox id={`imun-ibu-${item}`} checked={formData.ibu_imunisasi.includes(item)} onCheckedChange={() => toggleImunisasiIbu(item)} />
                        <Label htmlFor={`imun-ibu-${item}`} className="text-xs font-bold text-slate-600 cursor-pointer">{item}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-3 pt-6">
                  <Checkbox id="ibu_hb" checked={formData.ibu_hb} onCheckedChange={(c) => setFormData((prev: any) => ({ ...prev, ibu_hb: !!c }))} />
                  <Label htmlFor="ibu_hb" className="font-bold text-slate-700 text-sm cursor-pointer">HB?</Label>
                </div>
              </div>

            </CardContent>
          </Card>
        )}

        {/* Lansia Form */}
        {formData.is_lansia && (
          <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white">
            <CardHeader className="bg-blue-600 text-white p-6">
              <CardTitle className="font-black uppercase tracking-widest text-sm">Form Lansia</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tanggal Lahir</Label>
                  <Input type="date" value={formData.lansia_tgl_lahir} onChange={(e) => setFormData((prev: any) => ({ ...prev, lansia_tgl_lahir: e.target.value }))} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tanggal Pemeriksaan</Label>
                  <Input type="date" value={formData.tgl_pemeriksaan_lansia} onChange={(e) => setFormData((prev: any) => ({ ...prev, tgl_pemeriksaan_lansia: e.target.value }))} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Penanggung Biaya</Label>
                   <select value={formData.lansia_penanggung_biaya || ''} onChange={(e) => setFormData((prev: any) => ({ ...prev, lansia_penanggung_biaya: e.target.value }))} className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50/50 font-bold focus:ring-[#7a1200]">
                    {PENANGGUNG_BIAYA.map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kepemilikan BPJS</Label>
                   <select value={formData.lansia_kepemilikan_bpjs || ''} onChange={(e) => setFormData((prev: any) => ({ ...prev, lansia_kepemilikan_bpjs: e.target.value }))} className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50/50 font-bold focus:ring-[#7a1200]">
                    <option value="Ya">Ya</option>
                    <option value="Tidak">Tidak</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aktivitas Harian</Label>
                  <Input value={formData.lansia_aktivitas_harian} onChange={(e) => setFormData((prev: any) => ({ ...prev, lansia_aktivitas_harian: e.target.value }))} className={inputClass} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-5 gap-6 pt-4 border-t border-slate-100">
                 <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tinggi Badan (cm)</Label>
                  <Input type="number" step="0.1" value={formData.lansia_tinggi_badan} onChange={(e) => setFormData((prev: any) => ({ ...prev, lansia_tinggi_badan: parseFloat(e.target.value) }))} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Berat Badan (kg)</Label>
                  <Input type="number" step="0.1" value={formData.lansia_berat_badan} onChange={(e) => setFormData((prev: any) => ({ ...prev, lansia_berat_badan: parseFloat(e.target.value) }))} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tekanan Darah</Label>
                  <Input placeholder="120/80" value={formData.lansia_tekanan_darah} onChange={(e) => setFormData((prev: any) => ({ ...prev, lansia_tekanan_darah: e.target.value }))} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kolesterol (mg/dL)</Label>
                  <Input type="number" value={formData.lansia_kolesterol} onChange={(e) => setFormData((prev: any) => ({ ...prev, lansia_kolesterol: parseInt(e.target.value) }))} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gula Darah</Label>
                  <Input type="number" value={formData.lansia_gula} onChange={(e) => setFormData((prev: any) => ({ ...prev, lansia_gula: parseInt(e.target.value) }))} className={inputClass} />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Asam Urat</Label>
                  <Input type="number" step="0.1" value={formData.lansia_asam_urat} onChange={(e) => setFormData((prev: any) => ({ ...prev, lansia_asam_urat: parseFloat(e.target.value) }))} className={inputClass} />
                </div>
              </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Riwayat Penyakit</Label>
                  <textarea value={formData.lansia_riwayat_penyakit} onChange={(e) => setFormData((prev: any) => ({ ...prev, lansia_riwayat_penyakit: e.target.value }))} className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50/50 font-bold focus:ring-[#7a1200] min-h-[100px]" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Riwayat Pengobatan</Label>
                  <textarea value={formData.lansia_riwayat_pengobatan} onChange={(e) => setFormData((prev: any) => ({ ...prev, lansia_riwayat_pengobatan: e.target.value }))} className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50/50 font-bold focus:ring-[#7a1200] min-h-[100px]" />
                </div>
              </div>

            </CardContent>
          </Card>
        )}

        <div className="flex justify-end gap-4 pb-12">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => router.back()}
            className="h-14 rounded-[1.5rem] px-8 font-bold border-slate-200 hover:bg-slate-50"
          >
            DISCARD
          </Button>
          <Button 
            type="submit" 
            disabled={submitting}
            className="bg-[#7a1200] hover:bg-[#5a0d00] h-14 rounded-[1.5rem] px-12 font-black text-white shadow-xl shadow-[#7a1200]/20 flex gap-3"
          >
            {submitting ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
            UPDATE DATA
          </Button>
        </div>
      </form>
    </div>
  )
}
