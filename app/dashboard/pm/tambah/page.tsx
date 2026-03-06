'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Upload, Loader2, Camera, CheckCircle2 } from 'lucide-react'
import { createPenerimaManfaat, getDesaBerdayaOptions } from '../actions'

export default function TambahPMPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [scanStatus, setScanStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle')
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  
  const [desaOptions, setDesaOptions] = useState<{id: number, nama_desa: string}[]>([])
  const [formData, setFormData] = useState({
    desa_berdaya_id: 0,
    nik: '',
    nama: '',
    alamat: '',
    kategori_pm: 'EKONOMI',
  })

  React.useEffect(() => {
    getDesaBerdayaOptions().then(options => {
      setDesaOptions(options)
      if (options.length > 0) {
        setFormData(prev => ({ ...prev, desa_berdaya_id: options[0].id }))
      }
    }).catch(console.error)
  }, [])

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Show Preview
    const objectUrl = URL.createObjectURL(file)
    setPreviewImage(objectUrl)
    
    // Auto Scan
    await handleScanKTP(file)
  }

  const handleScanKTP = async (file: File) => {
    try {
      setScanStatus('scanning')
      const formDataUpload = new FormData()
      formDataUpload.append('image', file)

      const response = await fetch('/api/scan-ktp', {
        method: 'POST',
        body: formDataUpload,
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || 'Gagal memindai KTP')
      }

      const { data } = result
      setFormData((prev) => ({
        ...prev,
        nik: data.nik || prev.nik,
        nama: data.nama || prev.nama,
        alamat: data.alamat || prev.alamat,
      }))
      setScanStatus('success')
    } catch (error) {
      console.error(error)
      setScanStatus('error')
      alert(error instanceof Error ? error.message : 'Gagal memindai KTP')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.desa_berdaya_id || !formData.nik || !formData.nama || !formData.alamat) {
      alert('Mohon lengkapi Desa Binaan, NIK, Nama, dan Alamat!')
      return
    }
    
    try {
      setLoading(true)
      await createPenerimaManfaat(formData)
      alert('Data Penerima Manfaat berhasil disimpan!')
      router.push('/dashboard/pm')
    } catch (error: any) {
      console.error(error)
      alert(error.message || 'Gagal menyimpan data')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Tambah Penerima Manfaat</h1>
        <p className="text-slate-500 text-sm mt-1">Gunakan fitur pemindai KTP AI untuk pengisian data otomatis.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* KTP Scanner Section */}
        <div className="col-span-1 lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
            <h2 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
              <Camera className="w-4 h-4" />
              Upload & Scan KTP
            </h2>
            
            <label className="cursor-pointer group block">
              <input 
                type="file" 
                accept="image/jpeg, image/png, image/webp" 
                className="hidden" 
                onChange={handleImageChange}
              />
              <div className={`relative border-2 border-dashed rounded-xl overflow-hidden aspect-[1.6/1] flex flex-col items-center justify-center transition-all bg-slate-50 hover:bg-slate-100 ${scanStatus === 'scanning' ? 'border-teal-400 bg-teal-50' : 'border-slate-300'}`}>
                
                {previewImage ? (
                  <div className="absolute inset-0">
                    <Image src={previewImage} alt="KTP Preview" fill className="object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
                    {scanStatus === 'scanning' && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-sm">
                        <div className="text-white text-center flex flex-col items-center">
                          <Loader2 className="w-8 h-8 animate-spin mb-2" />
                          <span className="text-sm font-medium">Memindai AI...</span>
                        </div>
                      </div>
                    )}
                    {scanStatus === 'success' && (
                      <div className="absolute top-2 right-2 bg-green-500 rounded-full p-1 shadow-md">
                        <CheckCircle2 className="w-5 h-5 text-white" />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center p-6">
                    <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition-transform text-slate-400">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-medium text-slate-600">Pilih Foto KTP</p>
                    <p className="text-xs text-slate-400 mt-1">Tap untuk upload</p>
                  </div>
                )}
              </div>
            </label>
            
            {scanStatus === 'success' && (
              <div className="mt-4 bg-green-50 border border-green-200 text-green-700 text-xs p-3 rounded-lg flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <p>Data berhasil diekstrak! Silakan periksa dan perbaiki jika ada kesalahan pembacaan OCR.</p>
              </div>
            )}
          </div>
        </div>

        {/* Form Section */}
        <div className="col-span-1 lg:col-span-7">
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-5">
            <h2 className="text-sm font-semibold text-slate-700 border-b pb-3">Informasi Biodata</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Desa Binaan</label>
                <select
                  value={formData.desa_berdaya_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, desa_berdaya_id: Number(e.target.value) }))}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                  required
                >
                  <option value={0} disabled>Pilih Desa Binaan</option>
                  {desaOptions.map(desa => (
                    <option key={desa.id} value={desa.id}>{desa.nama_desa}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">NIK (Nomor Induk Kependudukan)</label>
                <input
                  type="text"
                  maxLength={16}
                  value={formData.nik}
                  onChange={(e) => setFormData(prev => ({ ...prev, nik: e.target.value.replace(/\D/g, '') }))}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="327xxxxxxxxxxxxX"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Nama Sesuai KTP</label>
                <input
                  type="text"
                  value={formData.nama}
                  onChange={(e) => setFormData(prev => ({ ...prev, nama: e.target.value.toUpperCase() }))}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                  placeholder="NAMA LENGKAP"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Alamat Lengkap</label>
                <textarea
                  value={formData.alamat}
                  onChange={(e) => setFormData(prev => ({ ...prev, alamat: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
                  placeholder="Jl. / RT / RW / Desa / Kec"
                  required
                />
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium text-slate-700">Kategori Bantuan</label>
                <select
                  value={formData.kategori_pm}
                  onChange={(e) => setFormData(prev => ({ ...prev, kategori_pm: e.target.value }))}
                  className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white"
                >
                  <option value="EKONOMI">Bantuan Ekonomi / Modal Usaha</option>
                  <option value="LANSIA">Bantuan Lansia</option>
                  <option value="BUMIL">Bantuan Ibu Hamil (Bumil)</option>
                  <option value="BALITA">Bantuan Balita / Stunting</option>
                </select>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3 border-t mt-6">
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Batal
              </Button>
              <Button type="submit" disabled={loading || scanStatus === 'scanning'} className="bg-teal-600 hover:bg-teal-700 text-white min-w-[120px]">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Simpan Data'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
