'use client'

import React, { useState, useEffect, useTransition } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  ChevronLeft, 
  Loader2, 
  Save, 
  X, 
  User,
  Calculator,
  Database,
  Calendar
} from 'lucide-react'
import { getEkonomiUpdateById, updateEkonomiUpdate, getPenerimaManfaatByDesa } from '../../actions'
import { getDesaBerdayaOptions } from '../../../laporan-kegiatan/actions'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { formatIDR, parseFormattedNumber } from '@/lib/utils'

const DATA_CONFIG = {
  "Agrobisnis": {
    "tipe": ["Pertanian", "Peternakan", "Perkebunan", "Perikanan"],
    "program": ["Berbagi Pangan", "Bantuan Kewirausahaan", "Bantuan Modal BUMMas", "Microfinance Berdaya"]
  },
  "Non Agrobisnis": {
    "tipe": ["Fashion/Konveksi", "Jasa", "Makanan/Minuman Kemasan", "Makanan/Minuman Non Kemasan", "Handycraft", "Warung Sembako"],
    "program": ["Berbagi Pangan", "Bantuan Kewirausahaan", "Bantuan Modal BUMMas", "Microfinance Berdaya"]
  }
}

export default function EditEkonomiPage() {
  const router = useRouter()
  const params = useParams()
  const id = Number(params.id)
  
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [pmResults, setPmResults] = useState<any[]>([])
  const [desaOptions, setDesaOptions] = useState<any[]>([])
  const [selectedDesaId, setSelectedDesaId] = useState<number | null>(null)
  
  const [formData, setFormData] = useState({
    tahun: new Date().getFullYear(),
    bulan: new Date().getMonth() + 1,
    checked: true,
    penerima_manfaat_id: 0,
    kategori: 'Agrobisnis',
    tipe: 'Pertanian',
    komoditas_produk: '',
    jumlah_tanggungan: 0,
    modal: 0,
    pengeluaran_operasional: 0,
    omzet: 0,
    pendapatan: 0,
    pendapatan_lainnya: 0,
    status_gk: '',
    nilai_ntp: 0,
    program: 'Berbagi Pangan'
  })

  // Derive selectedPm from pmResults/formData
  const selectedPm = pmResults.find(p => String(p.id) === String(formData.penerima_manfaat_id))

  useEffect(() => {
    async function initData() {
      try {
        const [data, options] = await Promise.all([
          getEkonomiUpdateById(id),
          getDesaBerdayaOptions()
        ])
        
        setDesaOptions(options)
        
        if (data) {
          setFormData({
            tahun: data.tahun,
            bulan: data.bulan,
            checked: data.checked,
            penerima_manfaat_id: data.penerima_manfaat_id,
            kategori: data.kategori || 'Agrobisnis',
            tipe: data.tipe || 'Pertanian',
            komoditas_produk: data.komoditas_produk || '',
            jumlah_tanggungan: data.jumlah_tanggungan || 0,
            modal: Number(data.modal) || 0,
            pengeluaran_operasional: Number(data.pengeluaran_operasional) || 0,
            omzet: Number(data.omzet) || 0,
            pendapatan: Number(data.pendapatan) || 0,
            pendapatan_lainnya: Number(data.pendapatan_lainnya) || 0,
            status_gk: data.status_gk || '',
            nilai_ntp: Number(data.nilai_ntp) || 0,
            program: data.program || 'Berbagi Pangan'
          })
          setSelectedDesaId(data.desa_berdaya_id)
          
          // Fetch PM list for pre-selected desa
          const pms = await getPenerimaManfaatByDesa(data.desa_berdaya_id)
          setPmResults(pms)
        }
      } catch (err) {
        toast.error('Gagal memuat data')
      } finally {
        setLoading(false)
      }
    }
    initData()
  }, [id])

  useEffect(() => {
    const calculateStats = () => {
      // Calculate Nilai NTP / Profitability Ratio
      const totalCost = (formData.modal || 0) + (formData.pengeluaran_operasional || 0)
      let ntp = 0
      if (totalCost > 0) {
        ntp = (formData.omzet / totalCost) * 100
      }
      
      // Calculate Status GK
      const totalIncome = (formData.pendapatan || 0) + (formData.pendapatan_lainnya || 0)
      const perCapitaIncome = totalIncome / ((formData.jumlah_tanggungan || 0) + 1)
      const statusGk = perCapitaIncome < 600000 ? 'Di Bawah GK' : 'Di Atas GK'

      setFormData(prev => ({
        ...prev,
        nilai_ntp: parseFloat(ntp.toFixed(2)),
        status_gk: statusGk
      }))
    }

    calculateStats()
  }, [
    formData.modal, 
    formData.pengeluaran_operasional, 
    formData.omzet, 
    formData.pendapatan, 
    formData.pendapatan_lainnya, 
    formData.jumlah_tanggungan
  ])

  const handleNumericChange = (field: string, value: string) => {
    // Remove all non-numeric characters except for parsing
    const numericValue = parseFormattedNumber(value)
    setFormData(prev => ({ ...prev, [field]: numericValue }))
  }

  const handleDesaChange = async (id: string) => {
    const desaId = parseInt(id)
    setSelectedDesaId(desaId)
    setFormData(prev => ({ ...prev, penerima_manfaat_id: 0 }))
    setPmResults([])

    // Fetch all PMs for this desa for the dropdown
    const pms = await getPenerimaManfaatByDesa(desaId)
    setPmResults(pms)
  }

  const handlePmSelect = (val: string) => {
    const id = parseInt(val)
    setFormData(prev => ({ ...prev, penerima_manfaat_id: id }))
  }

  const handleKategoriChange = (val: string) => {
    const tipeOptions = DATA_CONFIG[val as keyof typeof DATA_CONFIG]?.tipe || []
    setFormData(prev => ({ 
      ...prev, 
      kategori: val, 
      tipe: tipeOptions[0] || ''
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    startTransition(async () => {
      try {
        await updateEkonomiUpdate(id, formData)
        toast.success('Data ekonomi berhasil diperbarui')
        router.push('/dashboard/ekonomi')
      } catch (err) {
        toast.error('Gagal memperbarui data')
      } finally {
        setSubmitting(false)
      }
    })
  }

  if (loading) return <div className="p-8 text-center text-slate-400 font-bold">Memuat data...</div>

  const inputClass = "h-12 rounded-xl border-slate-200 bg-slate-50/50 font-bold focus:ring-[#7a1200]"

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-8 bg-slate-50/50 min-h-screen">
      <div className="flex items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200">
          <ChevronLeft className="w-5 h-5 text-slate-600" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Edit Update Ekonomi</h1>
          <p className="text-slate-500 text-sm font-medium">Ubah data perkembangan ekonomi Penerima Manfaat.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="space-y-6">
          <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden">
            <CardHeader className="bg-[#7a1200] text-white p-6">
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-white/70" />
                <CardTitle className="text-xl font-bold">Periode & PM</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tahun</Label>
                  <Input 
                    type="number"
                    value={formData.tahun}
                    onChange={(e) => setFormData(prev => ({ ...prev, tahun: parseInt(e.target.value) }))}
                    className={inputClass}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bulan</Label>
                  <select 
                    value={formData.bulan}
                    onChange={(e) => setFormData(prev => ({ ...prev, bulan: parseInt(e.target.value) }))}
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50/50 font-bold"
                    required
                  >
                    {[...Array(12)].map((_, i) => (
                      <option key={i+1} value={i+1}>{new Date(0, i).toLocaleString('id-ID', { month: 'long' })}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ganti Desa Binaan (Opsional)</Label>
                <select 
                  value={selectedDesaId || ''}
                  onChange={(e) => handleDesaChange(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50/50 font-bold focus:ring-[#7a1200]"
                >
                  <option value="" disabled>-- Pilih Desa --</option>
                  {desaOptions.map(desa => (
                    <option key={desa.id} value={desa.id}>{desa.nama_desa}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ganti Penerima Manfaat (Opsional)</Label>
                <select 
                  value={formData.penerima_manfaat_id ? String(formData.penerima_manfaat_id) : ''}
                  onChange={(e) => handlePmSelect(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50/50 font-bold focus:ring-[#7a1200]"
                  disabled={!selectedDesaId}
                >
                  <option value="" disabled>{selectedDesaId ? "-- Pilih PM --" : "Pilih desa dulu..."}</option>
                  {pmResults.map(pm => (
                    <option key={pm.id} value={String(pm.id)}>{pm.nama} - {pm.nik}</option>
                  ))}
                </select>
              </div>

              {selectedPm && (
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-4">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-xl">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-bold text-emerald-900 text-sm leading-tight">{selectedPm.nama}</p>
                    <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-widest">{selectedPm.nik}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <Checkbox 
                  id="checked" 
                  checked={formData.checked}
                  onCheckedChange={(c) => setFormData(prev => ({ ...prev, checked: !!c }))}
                />
                <Label htmlFor="checked" className="font-bold text-slate-700 text-sm cursor-pointer">Sudah Diverifikasi / Checked</Label>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="md:col-span-2 space-y-8">
          <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white">
            <CardHeader className="p-8 pb-0 flex flex-row items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <Calculator className="w-6 h-6" />
                </div>
                <CardTitle className="text-2xl font-black text-slate-800 tracking-tight uppercase">Update Ekonomi</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kategori Bisnis</Label>
                  <select 
                    value={formData.kategori}
                    onChange={(e) => handleKategoriChange(e.target.value)}
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50/50 font-bold"
                  >
                    {Object.keys(DATA_CONFIG).map(k => <option key={k} value={k}>{k}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tipe Bisnis</Label>
                  <select 
                    value={formData.tipe}
                    onChange={(e) => setFormData(prev => ({ ...prev, tipe: e.target.value }))}
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50/50 font-bold"
                  >
                    {DATA_CONFIG[formData.kategori as keyof typeof DATA_CONFIG]?.tipe?.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Komoditas / Produk</Label>
                  <Input 
                    value={formData.komoditas_produk}
                    onChange={(e) => setFormData(prev => ({ ...prev, komoditas_produk: e.target.value }))}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Jumlah Tanggungan</Label>
                  <Input 
                    type="number"
                    value={formData.jumlah_tanggungan}
                    onChange={(e) => setFormData(prev => ({ ...prev, jumlah_tanggungan: parseInt(e.target.value) || 0 }))}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pilih Program</Label>
                  <select 
                    value={formData.program}
                    onChange={(e) => setFormData(prev => ({ ...prev, program: e.target.value }))}
                    className="w-full h-12 px-4 rounded-xl border border-slate-200 bg-slate-50/50 font-bold"
                  >
                   {DATA_CONFIG[formData.kategori as keyof typeof DATA_CONFIG]?.program?.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Modal (Rp)</Label>
                  <Input 
                    type="text"
                    value={formatIDR(formData.modal)}
                    onChange={(e) => handleNumericChange('modal', e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pengeluaran Operasional (Rp)</Label>
                  <Input 
                    type="text"
                    value={formatIDR(formData.pengeluaran_operasional)}
                    onChange={(e) => handleNumericChange('pengeluaran_operasional', e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Omzet (Rp)</Label>
                  <Input 
                    type="text"
                    value={formatIDR(formData.omzet)}
                    onChange={(e) => handleNumericChange('omzet', e.target.value)}
                    className={inputClass}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pendapatan (Rp)</Label>
                    <Input 
                      type="text"
                      value={formatIDR(formData.pendapatan)}
                      onChange={(e) => handleNumericChange('pendapatan', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Pend. Lainnya (Rp)</Label>
                    <Input 
                      type="text"
                      value={formatIDR(formData.pendapatan_lainnya)}
                      onChange={(e) => handleNumericChange('pendapatan_lainnya', e.target.value)}
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-emerald-600">Status GK (Auto)</Label>
                    <Input 
                      value={formData.status_gk}
                      readOnly
                      className={`${inputClass} bg-emerald-50/50 border-emerald-100 text-emerald-700`}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-blue-600">Nilai NTP (Auto)</Label>
                    <Input 
                      type="number"
                      step="0.01"
                      value={formData.nilai_ntp}
                      readOnly
                      className={`${inputClass} bg-blue-50/50 border-blue-100 text-blue-700`}
                    />
                  </div>
                </div>
              </div>
            </CardContent>
            
            <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
              <Button 
                type="button"
                variant="outline"
                onClick={() => router.back()}
                className="h-12 rounded-xl px-6 font-bold"
              >
                Discard
              </Button>
              <Button 
                type="submit"
                disabled={submitting}
                className="bg-[#7a1200] hover:bg-[#5a0d00] h-12 rounded-xl px-10 font-black shadow-lg shadow-[#7a1200]/20 flex gap-3"
              >
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save Changes
              </Button>
            </div>
          </Card>
        </div>
      </form>
    </div>
  )
}
