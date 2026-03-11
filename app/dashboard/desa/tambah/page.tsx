'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Loader2, Save, X, MapPin } from 'lucide-react'
import dynamic from 'next/dynamic'

const MapPicker = dynamic(() => import('../MapPicker'), {
  ssr: false,
  loading: () => <div className="h-64 w-full bg-slate-100 animate-pulse rounded-lg border border-slate-200 flex items-center justify-center text-slate-400">Memuat Peta...</div>
})
import { 
  getProvinsi, getKotaKabupaten, getKecamatan, getDesaConfig, 
  getRelawanBawahan, createDesaBinaan, getOfficeOptions
} from '../actions'

export default function TambahDesaBinaanPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)

  const [provinsiOptions, setProvinsiOptions] = useState<any[]>([])
  const [kotaOptions, setKotaOptions] = useState<any[]>([])
  const [kecamatanOptions, setKecamatanOptions] = useState<any[]>([])
  const [desaConfigOptions, setDesaConfigOptions] = useState<any[]>([])
  const [relawanOptions, setRelawanOptions] = useState<any[]>([])
  const [officeOptions, setOfficeOptions] = useState<any[]>([])

  const [formData, setFormData] = useState({
    provinsi_id: '',
    kota_id: '',
    kecamatan_id: '',
    desa_id: '',
    office_id: '',
    relawan_id: '',
    latitude: '',
    longitude: '',
    potensi_desa: '',
    status_aktif: true
  })

  // Load Initial Data (Provinsi & Relawan)
  useEffect(() => {
    async function loadInitial() {
      try {
        const [provList, relawanList, officeList] = await Promise.all([
          getProvinsi(),
          getRelawanBawahan(),
          getOfficeOptions()
        ])
        setProvinsiOptions(provList)
        setRelawanOptions(relawanList)
        setOfficeOptions(officeList)
      } catch (err) {
        console.error('Failed to load initial data:', err)
      } finally {
        setInitialLoading(false)
      }
    }
    loadInitial()
  }, [])

  // Handle Provinsi Change -> Load Kota
  useEffect(() => {
    if (formData.provinsi_id) {
      getKotaKabupaten(Number(formData.provinsi_id)).then(setKotaOptions)
      setFormData(prev => ({ ...prev, kota_id: '', kecamatan_id: '', desa_id: '' }))
      setKecamatanOptions([])
      setDesaConfigOptions([])
    }
  }, [formData.provinsi_id])

  // Handle Kota Change -> Load Kecamatan
  useEffect(() => {
    if (formData.kota_id) {
      getKecamatan(Number(formData.kota_id)).then(setKecamatanOptions)
      setFormData(prev => ({ ...prev, kecamatan_id: '', desa_id: '' }))
      setDesaConfigOptions([])
    }
  }, [formData.kota_id])

  // Handle Kecamatan Change -> Load Desa Config
  useEffect(() => {
    if (formData.kecamatan_id) {
      getDesaConfig(Number(formData.kecamatan_id)).then(setDesaConfigOptions)
      setFormData(prev => ({ ...prev, desa_id: '' }))
    }
  }, [formData.kecamatan_id])

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const [autoSearchQuery, setAutoSearchQuery] = useState<string>('')

  // Construct auto search query whenever a region is fully selected
  useEffect(() => {
    if (formData.desa_id && formData.kecamatan_id && formData.kota_id && formData.provinsi_id) {
      const d = desaConfigOptions.find(opt => opt.id.toString() === formData.desa_id)?.nama_desa || ''
      const kec = kecamatanOptions.find(opt => opt.id.toString() === formData.kecamatan_id)?.nama_kecamatan || ''
      const kot = kotaOptions.find(opt => opt.id.toString() === formData.kota_id)?.nama_kota || ''
      const prov = provinsiOptions.find(opt => opt.id.toString() === formData.provinsi_id)?.nama_provinsi || ''
      
      if (d && kec && kot && prov) {
        setAutoSearchQuery(`${d} ${kec} ${kot} ${prov}`)
      }
    } else {
      setAutoSearchQuery('')
    }
  }, [formData.desa_id, formData.kecamatan_id, formData.kota_id, formData.provinsi_id, desaConfigOptions, kecamatanOptions, kotaOptions, provinsiOptions])

  const [locating, setLocating] = useState(false)

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      alert("Browser Anda tidak mendukung fitur Geolocation.");
      return;
    }
    
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setFormData(prev => ({
          ...prev,
          latitude: position.coords.latitude.toString(),
          longitude: position.coords.longitude.toString()
        }));
        setLocating(false);
      },
      (error) => {
        console.error("Error getting location: ", error);
        alert("Gagal mendapatkan lokasi. Pastikan Anda memberikan izin akses lokasi untuk browser ini.");
        setLocating(false);
      },
      { enableHighAccuracy: true }
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Validasi manual jika select belum dipilih
    if (!formData.provinsi_id || !formData.kota_id || !formData.kecamatan_id || !formData.desa_id || !formData.relawan_id) {
      alert('Mohon lengkapi data hierarki wilayah dan relawan.')
      return
    }

    try {
      setLoading(true)
      await createDesaBinaan({
        ...formData,
        provinsi_id: Number(formData.provinsi_id),
        kota_id: Number(formData.kota_id),
        kecamatan_id: Number(formData.kecamatan_id),
        desa_id: Number(formData.desa_id),
        office_id: formData.office_id ? Number(formData.office_id) : undefined,
        relawan_id: Number(formData.relawan_id),
        latitude: parseFloat(formData.latitude) || null,
        longitude: parseFloat(formData.longitude) || null,
      })
      alert('Desa Binaan berhasil ditambahkan!')
      router.push('/dashboard/desa')
    } catch (error: any) {
      console.error(error)
      alert('Gagal menambahkan desa binaan: ' + (error.message || 'Unknown error'))
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return <div className="p-8 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-[#7a1200]" /></div>
  }

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Tambah Desa Binaan</h1>
          <p className="text-slate-500 text-sm mt-1">Lengkapi form wilayah dan tunjuk relawan penanggung jawab.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-teal-800 border-b pb-2">Hierarki Wilayah</h2>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Provinsi <span className="text-red-500">*</span></label>
                <select name="provinsi_id" value={formData.provinsi_id} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500" required>
                  <option value="" disabled>Pilih Provinsi</option>
                  {provinsiOptions.map((p) => <option key={p.id} value={p.id}>{p.nama_provinsi}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Kota/Kabupaten <span className="text-red-500">*</span></label>
                <select name="kota_id" value={formData.kota_id} onChange={handleChange} disabled={!formData.provinsi_id} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 disabled:bg-slate-50 disabled:text-slate-400" required>
                  <option value="" disabled>Pilih Kota/Kab</option>
                  {kotaOptions.map((k) => <option key={k.id} value={k.id}>{k.nama_kota}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Kecamatan <span className="text-red-500">*</span></label>
                <select name="kecamatan_id" value={formData.kecamatan_id} onChange={handleChange} disabled={!formData.kota_id} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 disabled:bg-slate-50 disabled:text-slate-400" required>
                  <option value="" disabled>Pilih Kecamatan</option>
                  {kecamatanOptions.map((k) => <option key={k.id} value={k.id}>{k.nama_kecamatan}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Desa/Kelurahan Target <span className="text-red-500">*</span></label>
                <select name="desa_id" value={formData.desa_id} onChange={handleChange} disabled={!formData.kecamatan_id} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 disabled:bg-slate-50 disabled:text-slate-400" required>
                  <option value="" disabled>Pilih Desa</option>
                  {desaConfigOptions.map((d) => <option key={d.id} value={d.id}>{d.nama_desa}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-semibold text-teal-800 border-b pb-2">Data Operasional</h2>
              
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Relawan Bertugas <span className="text-red-500">*</span></label>
                <select name="relawan_id" value={formData.relawan_id} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500" required>
                  <option value="" disabled>Pilih Relawan...</option>
                  {relawanOptions.map((r) => <option key={r.id} value={r.id}>{r.nama}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Kantor Office (Opsi jika ikut Region)</label>
                <select name="office_id" value={formData.office_id} onChange={handleChange} className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500">
                  <option value="">-- Tidak Ditugaskan ke Office (Default) --</option>
                  {officeOptions.map((o) => <option key={o.id} value={o.id}>{o.nama_office}</option>)}
                </select>
              </div>

              <div className="space-y-3">
                 <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700">Titik Koordinat Lokasi (Opsi)</label>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={handleGetLocation} 
                    disabled={locating}
                    className="text-[#7a1200] border-red-200 hover:bg-red-50 text-xs py-1 h-8"
                  >
                    {locating ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5 mr-1.5" />}
                    {locating ? 'Mencari...' : 'Gunakan GPS Perangkat'}
                  </Button>
                </div>
                
                <MapPicker 
                  defaultLat={formData.latitude ? Number(formData.latitude) : null} 
                  defaultLng={formData.longitude ? Number(formData.longitude) : null} 
                  autoSearchQuery={autoSearchQuery}
                  onChange={(lat, lng) => setFormData(prev => ({ ...prev, latitude: lat.toString(), longitude: lng.toString() }))}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Potensi Desa</label>
                <textarea rows={3} name="potensi_desa" value={formData.potensi_desa} onChange={handleChange} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 resize-none" placeholder="Deskripsikan potensi utama desa (cth: Wisata, Pertanian)..." />
              </div>

              <div className="flex items-center gap-2 mt-4">
                <input type="checkbox" id="status_aktif" name="status_aktif" checked={formData.status_aktif} onChange={handleChange} className="w-4 h-4 text-[#7a1200] focus:ring-teal-500 border-gray-300 rounded" />
                <label htmlFor="status_aktif" className="text-sm font-medium text-slate-700 cursor-pointer">Desa Binaan Aktif</label>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.push('/dashboard/desa')} className="px-6">
            <X className="w-4 h-4 mr-2" /> Batal
          </Button>
          <Button type="submit" disabled={loading} className="bg-[#7a1200] hover:bg-[#5a0d00] text-white px-6">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Simpan Desa
          </Button>
        </div>
      </form>
    </div>
  )
}
