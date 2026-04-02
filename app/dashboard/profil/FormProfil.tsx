'use client'

import { useState, useRef, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Users, Save, UploadCloud, Loader2 } from 'lucide-react'
import { upload } from '@vercel/blob/client'
import { toast } from 'sonner'
import { updateMyProfile } from './actions'

export default function FormProfil({ initialData }: { initialData: any }) {
  const [form, setForm] = useState(initialData)
  const [submitting, setSubmitting] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingImage(true)
      const newBlob = await upload(`relawan-foto-${Date.now()}-${file.name}`, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
      })
      const finalForm = { ...form, foto_url: newBlob.url }
      setForm(finalForm)
      
      toast.success('Foto terpilih! Klik "Simpan Profil Sekarang" untuk menyimpan permanen.')
      
    } catch (error: any) {
      toast.error('Gagal mengunggah gambar: ' + error.message)
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const result = await updateMyProfile(form)
    if (result.success) {
      toast.success('Profil berhasil diperbarui')
      
      // Refresh halaman agar sidebar kiri juga langsung ikut terupdate dengan foto/data terbaru
      setTimeout(() => {
        window.location.reload()
      }, 1000)
    } else {
      toast.error(result.error || 'Terjadi kesalahan')
    }
    setSubmitting(false)
  }

  if (!mounted) {
    return <div className="animate-pulse h-[800px] w-full bg-slate-100 rounded-[2rem] border-0 shadow-sm" />
  }

  return (
    <Card className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.03)] overflow-hidden ring-1 ring-slate-100 rounded-[2rem]">
      <CardContent className="p-0">
        <form onSubmit={handleSubmit}>
          <Tabs defaultValue="utama" className="w-full">
            <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-8 pt-4">
              <TabsList className="bg-transparent space-x-2 h-auto p-0 flex flex-wrap gap-y-2">
                <TabsTrigger value="utama" className="data-[state=active]:bg-white data-[state=active]:text-[#7a1200] data-[state=active]:shadow-sm data-[state=active]:border-slate-200 border border-transparent rounded-t-lg px-4 sm:px-6 py-2.5 font-bold uppercase tracking-widest text-[11px] text-slate-500">
                  Profil Utama
                </TabsTrigger>
                <TabsTrigger value="biodata" className="data-[state=active]:bg-white data-[state=active]:text-[#7a1200] data-[state=active]:shadow-sm data-[state=active]:border-slate-200 border border-transparent rounded-t-lg px-4 sm:px-6 py-2.5 font-bold uppercase tracking-widest text-[11px] text-slate-500">
                  Biodata
                </TabsTrigger>
                <TabsTrigger value="tambahan" className="data-[state=active]:bg-white data-[state=active]:text-[#7a1200] data-[state=active]:shadow-sm data-[state=active]:border-slate-200 border border-transparent rounded-t-lg px-4 sm:px-6 py-2.5 font-bold uppercase tracking-widest text-[11px] text-slate-500">
                  Info Tambahan
                </TabsTrigger>
                <TabsTrigger value="bank_sosmed" className="data-[state=active]:bg-white data-[state=active]:text-[#7a1200] data-[state=active]:shadow-sm data-[state=active]:border-slate-200 border border-transparent rounded-t-lg px-4 sm:px-6 py-2.5 font-bold uppercase tracking-widest text-[11px] text-slate-500">
                  Bank & Sosmed
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="p-4 sm:p-8">
              <TabsContent value="utama" className="m-0 space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2 col-span-1 md:col-span-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Nama Lengkap Sesuai ID</Label>
                    <Input disabled value={form.nama} className="h-12 rounded-xl bg-slate-100 border-slate-200 text-slate-500 cursor-not-allowed" />
                    <p className="text-[10px] text-amber-600 font-semibold mt-1">*Nama terkunci dari sistem pusat.</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Email Utama (Google Login)</Label>
                    <Input disabled value={form.email} className="h-12 rounded-xl bg-slate-100 border-slate-200 text-slate-500 font-medium cursor-not-allowed" />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Role Terdaftar</Label>
                    <Input disabled value={form.tipe_relawan || 'Relawan Reguler'} className="h-12 rounded-xl bg-slate-100 text-slate-500 border-slate-200 font-medium cursor-not-allowed capitalize" />
                  </div>

                  <div className="space-y-2 lg:col-span-2 bg-white p-5 border border-slate-200 rounded-2xl relative shadow-sm">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-3 block">Foto / Avatar Profil</Label>
                    <div className="flex flex-col sm:flex-row gap-5 items-center sm:items-start">
                      <div className="w-24 h-24 rounded-full border-4 border-slate-100 bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center relative shadow-sm">
                        {form.foto_url ? (
                          <img src={form.foto_url} alt="Foto" className="w-full h-full object-cover" />
                        ) : (
                          <Users className="w-10 h-10 text-slate-300" />
                        )}
                      </div>
                      <div className="flex-1 space-y-2 text-center sm:text-left pt-2">
                        <p className="text-sm text-slate-500 font-medium leading-relaxed">
                          Unggah foto profil Anda. Tampilan ini akan terlihat oleh tim pusat.
                        </p>
                        <input 
                          type="file" accept="image/png, image/jpeg, image/webp" 
                          ref={fileInputRef} className="hidden"
                          onChange={handleUploadImage}
                        />
                        <Button 
                          type="button" onClick={() => fileInputRef.current?.click()} 
                          disabled={uploadingImage} variant="outline"
                          className="bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200 h-10 shrink-0 mx-auto sm:mx-0 font-bold"
                        >
                          {uploadingImage ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mengunggah...</>
                          ) : (
                            <><UploadCloud className="w-4 h-4 mr-2" /> Ganti Foto Profil</>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="biodata" className="m-0 space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2 lg:col-span-3">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Alamat Lengkap</Label>
                    <Input value={form.alamat || ''} onChange={(e) => setForm({ ...form, alamat: e.target.value })} placeholder="Isi alamat Anda..." className="h-12 rounded-xl bg-slate-50 hover:bg-white focus:bg-white transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Tempat Lahir</Label>
                    <Input value={form.tempat_lahir || ''} onChange={(e) => setForm({ ...form, tempat_lahir: e.target.value })} placeholder="Kota Lahir" className="h-12 rounded-xl bg-slate-50 hover:bg-white focus:bg-white transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Tanggal Lahir</Label>
                    <Input type="date" value={form.tanggal_lahir || ''} onChange={(e) => setForm({ ...form, tanggal_lahir: e.target.value })} className="h-12 rounded-xl bg-slate-50 hover:bg-white focus:bg-white transition-colors" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Jenis Kelamin</Label>
                    <Select value={form.jenis_kelamin || ''} onValueChange={(v) => setForm({ ...form, jenis_kelamin: v })}>
                      <SelectTrigger className="h-12 rounded-xl bg-slate-50 hover:bg-white focus:bg-white transition-colors font-medium text-slate-700"><SelectValue placeholder="Pilih Gender" /></SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="Laki-laki" className="font-semibold">Laki-laki</SelectItem>
                        <SelectItem value="Perempuan" className="font-semibold">Perempuan</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Ketokohan / Gelar</Label>
                    <Input value={form.ketokohan || ''} onChange={(e) => setForm({ ...form, ketokohan: e.target.value })} placeholder="Contoh: Tokoh Masyarakat" className="h-12 rounded-xl bg-slate-50" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="tambahan" className="m-0 space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">No. Induk (NIK Pekerja)</Label>
                    <Input value={form.nomor_induk || ''} onChange={(e) => setForm({ ...form, nomor_induk: e.target.value })} placeholder="Opsional" className="h-12 rounded-xl bg-slate-50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Nomor KTP (16 Digit)</Label>
                    <Input value={form.nomor_ktp || ''} onChange={(e) => setForm({ ...form, nomor_ktp: e.target.value })} placeholder="16 digit Angka" className="h-12 rounded-xl bg-slate-50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Nomor Kartu Keluarga (KK)</Label>
                    <Input value={form.nomor_kk || ''} onChange={(e) => setForm({ ...form, nomor_kk: e.target.value })} placeholder="16 digit KK" className="h-12 rounded-xl bg-slate-50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Pendidikan Terakhir</Label>
                    <Input value={form.pendidikan || ''} onChange={(e) => setForm({ ...form, pendidikan: e.target.value })} placeholder="SMA, S1, S2 dsb" className="h-12 rounded-xl bg-slate-50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Status Edukasi</Label>
                    <Input value={form.status_edukasi || ''} onChange={(e) => setForm({ ...form, status_edukasi: e.target.value })} placeholder="Terverifikasi/Selesai" className="h-12 rounded-xl bg-slate-50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Pekerjaan</Label>
                    <Input value={form.pekerjaan || ''} onChange={(e) => setForm({ ...form, pekerjaan: e.target.value })} placeholder="Pekerjaan saat ini" className="h-12 rounded-xl bg-slate-50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Keahlian Pendukung</Label>
                    <Input value={form.keahlian || ''} onChange={(e) => setForm({ ...form, keahlian: e.target.value })} placeholder="Contoh: Digital Marketing" className="h-12 rounded-xl bg-slate-50" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Jabatan di Desa</Label>
                    <Input value={form.jabatan_desa || ''} onChange={(e) => setForm({ ...form, jabatan_desa: e.target.value })} placeholder="Contoh: Kepala Dusun" className="h-12 rounded-xl bg-slate-50" />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="bank_sosmed" className="m-0 space-y-8 animate-in fade-in duration-300">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-6 w-1 bg-blue-500 rounded-full"></div>
                    <h4 className="text-sm font-black text-slate-800 tracking-tight">INFORMASI BANK (U/ PENGGAJIAN)</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Nama Bank</Label>
                      <Input value={form.bank || ''} onChange={(e) => setForm({ ...form, bank: e.target.value })} placeholder="Contoh: BSI, BCA, BRI" className="h-12 rounded-xl bg-slate-50 hover:bg-white focus:bg-white transition-colors" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Nomor Rekening</Label>
                      <Input value={form.nomor_rekening || ''} onChange={(e) => setForm({ ...form, nomor_rekening: e.target.value })} placeholder="Nomor Rekening Anda" className="h-12 rounded-xl bg-slate-50 hover:bg-white focus:bg-white transition-colors" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Atas Nama Rekening</Label>
                      <Input value={form.atas_nama || ''} onChange={(e) => setForm({ ...form, atas_nama: e.target.value })} placeholder="Sesuai buku tabungan" className="h-12 rounded-xl bg-slate-50 hover:bg-white focus:bg-white transition-colors" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-6 w-1 bg-rose-500 rounded-full"></div>
                    <h4 className="text-sm font-black text-slate-800 tracking-tight">MEDIA SOSIAL PRIBADI</h4>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Facebook</Label>
                      <Input value={form.akun_facebook || ''} onChange={(e) => setForm({ ...form, akun_facebook: e.target.value })} placeholder="@username atau /link" className="h-12 rounded-xl bg-slate-50" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Twitter</Label>
                      <Input value={form.akun_twitter || ''} onChange={(e) => setForm({ ...form, akun_twitter: e.target.value })} placeholder="@username" className="h-12 rounded-xl bg-slate-50" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Instagram</Label>
                      <Input value={form.akun_instagram || ''} onChange={(e) => setForm({ ...form, akun_instagram: e.target.value })} placeholder="@username" className="h-12 rounded-xl bg-slate-50" />
                    </div>
                  </div>
                </div>
              </TabsContent>
            </div>

            <div className="px-4 sm:px-8 py-5 bg-white border-t border-slate-100 flex items-center justify-end rounded-b-[2rem] sticky bottom-0 z-10 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.02)]">
              <Button type="submit" disabled={submitting} className="h-12 rounded-xl px-10 text-white font-bold text-sm shadow-xl shadow-[#7a1200]/20 hover:shadow-[#7a1200]/30 transition-all active:scale-95 gap-3" style={{ backgroundColor: '#7a1200' }}>
                {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {submitting ? 'Menyimpan...' : 'Simpan Profil Sekarang'}
              </Button>
            </div>
          </Tabs>
        </form>
      </CardContent>
    </Card>
  )
}
