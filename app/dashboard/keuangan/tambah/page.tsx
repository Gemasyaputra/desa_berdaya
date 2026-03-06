'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Upload, Loader2, FileImage, FileText, CheckCircle2 } from 'lucide-react'
import { getDesaBerdayaOptions, createLaporanKeuangan, uploadBukti } from '../actions'

export default function TambahLaporanPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  const [desaOptions, setDesaOptions] = useState<any[]>([])
  const [selectedDesa, setSelectedDesa] = useState<any>(null)
  
  const [formData, setFormData] = useState({
    desa_berdaya_id: 0,
    judul_kegiatan: '',
    deskripsi: '',
    total_realisasi: '',
    bukti_url: '',
    jenis_kegiatan: 'EKONOMI',
  })

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    // Di aplikasi nyata, panggil dari database sesuai relawan
    getDesaBerdayaOptions().then(options => {
      setDesaOptions(options)
      if(options.length > 0) {
        setFormData(prev => ({ ...prev, desa_berdaya_id: options[0].id }))
        setSelectedDesa(options[0])
      }
    })
  }, [])

  const handleDesaChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = Number(e.target.value)
    setFormData(prev => ({ ...prev, desa_berdaya_id: id }))
    const desa = desaOptions.find(d => d.id === id)
    setSelectedDesa(desa)
  }

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(number)
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      
      const url = await uploadBukti(form)
      console.log('Upload success:', url)
      setFormData(prev => ({ ...prev, bukti_url: url }))
    } catch (error: any) {
      console.error('Upload Error Detailed:', error)
      alert(`Gagal mengunggah file bukti: ${error?.message || 'Unknown error'}`)
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const realisasiNum = Number(formData.total_realisasi.replace(/\D/g, ''))
    if (!realisasiNum || realisasiNum <= 0) {
      alert('Masukkan Total Realisasi yang valid!')
      return
    }

    if (selectedDesa && realisasiNum > selectedDesa.alokasi_anggaran) {
      alert(`Total Realisasi (Rp ${realisasiNum}) tidak boleh melebihi plafon Alokasi Anggaran (Rp ${selectedDesa.alokasi_anggaran})!`)
      return
    }

    if (!formData.bukti_url) {
      alert('Mohon unggah file bukti (Foto/Kwitansi)!')
      return
    }

    try {
      setLoading(true)
      await createLaporanKeuangan({ 
        ...formData, 
        total_realisasi: realisasiNum 
      })
      alert('Laporan Kegiatan & Keuangan berhasil disubmit!')
      // Kembali ke tabel list
      router.push('/dashboard/keuangan')
    } catch (error) {
      console.error(error)
      alert('Gagal menyimpan Laporan!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Kegiatan & Keuangan</h1>
          <p className="text-slate-500 text-sm mt-1">Buat pelaporan realisasi kegiatan di Desa Binaan.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="col-span-1 lg:col-span-4 space-y-4">
          <div className="bg-[#5a0d00] rounded-xl p-5 text-white shadow-sm flex flex-col justify-between h-full">
            <div>
              <p className="text-teal-100 text-sm mb-1">Informasi Anggaran</p>
              <h3 className="font-semibold text-lg">{selectedDesa?.nama_desa || 'Pilih Desa'}</h3>
            </div>
            
            <div className="mt-6 flex flex-col gap-3">
              <div className="bg-[#420900]/50 p-3 rounded-lg border border-[#7a1200]/50">
                <p className="text-teal-200 text-xs mb-1">Plafon Alokasi Aktif</p>
                <p className="font-mono text-xl font-bold">
                  {selectedDesa ? formatRupiah(selectedDesa.alokasi_anggaran) : 'Rp 0'}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="col-span-1 lg:col-span-8">
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 space-y-5">
            <h2 className="text-sm font-semibold text-slate-700 border-b pb-3">Form Laporan Realisasi</h2>
            
            <div className="grid gap-5">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Desa Binaan</label>
                <select
                  value={formData.desa_berdaya_id}
                  onChange={handleDesaChange}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-[#7a1200] bg-white"
                  required
                >
                  <option value={0} disabled>Pilih Desa Binaan</option>
                  {desaOptions.map(desa => (
                    <option key={desa.id} value={desa.id}>{desa.nama_desa}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Rumpun Kegiatan</label>
                <select
                  value={formData.jenis_kegiatan}
                  onChange={(e) => setFormData(prev => ({ ...prev, jenis_kegiatan: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-[#7a1200] bg-white"
                >
                  <option value="EKONOMI">Pengembangan Ekonomi</option>
                  <option value="KESEHATAN">Pemberdayaan Kesehatan</option>
                  <option value="PENDIDIKAN">Pendidikan Anak</option>
                  <option value="LINGKUNGAN">Infrastruktur Lingkungan</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Judul Laporan</label>
                <input
                  type="text"
                  value={formData.judul_kegiatan}
                  onChange={(e) => setFormData(prev => ({ ...prev, judul_kegiatan: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-[#7a1200]"
                  placeholder="Contoh: Pemberian Modal Usaha Kelompok Tani"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Total Realisasi Dana</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-medium font-mono">Rp</span>
                  <input
                    type="text"
                    value={formData.total_realisasi}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '')
                      const formatted = val ? new Intl.NumberFormat('id-ID').format(Number(val)) : ''
                      setFormData(prev => ({ ...prev, total_realisasi: formatted }))
                    }}
                    className="w-full pl-12 pr-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-[#7a1200] font-mono text-lg"
                    placeholder="0"
                    required
                  />
                </div>
                <p className="text-xs text-red-500 mt-1">Realisasi dilarang melebihi pagu anggaran.</p>
              </div>

              <div className="space-y-2 pt-2">
                <label className="text-sm font-medium text-slate-700 flex items-center justify-between">
                  Bukti Transaksi (Kwitansi/Nota)
                  {formData.bukti_url && <span className="text-xs text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Berhasil Diunggah</span>}
                </label>
                <div className="flex items-center gap-3">
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="border-slate-300 flex-shrink-0"
                  >
                    {uploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Upload className="w-4 h-4 mr-2" />}
                    {uploading ? 'Mengunggah...' : 'Pilih File'}
                  </Button>
                  <input 
                    type="file" 
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="image/*,application/pdf"
                  />
                  <span className="text-sm text-slate-500 truncate min-w-0 flex-1">
                    {formData.bukti_url ? <a href={formData.bukti_url} target="_blank" className="text-[#7a1200] hover:underline flex items-center gap-1"><FileImage className="w-4 h-4" /> Lihat Bukti</a> : 'Belum ada file terpilih'}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Deskripsi Lengkap Kegiatan</label>
                <textarea
                  value={formData.deskripsi}
                  onChange={(e) => setFormData(prev => ({ ...prev, deskripsi: e.target.value }))}
                  rows={4}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-[#7a1200] resize-none"
                  placeholder="Jelaskan detail pengeluaran & pelaksanaan secara komprehensif..."
                  required
                />
              </div>

            </div>

            <div className="pt-6 border-t flex justify-end">
              <Button type="submit" disabled={loading || uploading} className="bg-[#7a1200] hover:bg-[#5a0d00] px-6">
                {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <FileText className="w-5 h-5 mr-2" />}
                Submit & Simpan Laporan
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
