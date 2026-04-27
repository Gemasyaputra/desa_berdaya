'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus, Trash2, Edit, X, Save, RefreshCw, Users, MapPin, UserCheck, CheckCircle2, UploadCloud, Loader2, Search } from 'lucide-react'
import { upload } from '@vercel/blob/client'
import { toast } from 'sonner'
import {
  getRelawanList, createRelawan, updateRelawan, deleteRelawan,
  getKorwilOptions,
  type RelawanRow, type OptionItem,
} from './actions'
import { KelolaDesaRelawanSheet, GantiRelawanDesaSheet } from './desa-assign-sheet'

function emptyForm() {
  return { 
    nama: '', hp: '', email: '', korwil_id: '',
    foto_url: '', status_relawan: 'Aktif', cabang_dbf: '', tipe_relawan: '',
    tempat_lahir: '', tanggal_lahir: '', jenis_kelamin: '', alamat: '', nomor_induk: '', ketokohan: '',
    bank: '', nomor_rekening: '', atas_nama: '',
    nomor_ktp: '', nomor_kk: '', pendidikan: '', pekerjaan: '',
    jabatan_desa: '', keahlian: '', status_edukasi: '', coa_kafalah: '', nama_coa_kafalah: '',
    akun_facebook: '', akun_twitter: '', akun_instagram: ''
  }
}

export function CRUDRelawan({
  isAdmin,
  isMonev,
  isKorwil,
  monevId,
}: {
  isAdmin: boolean
  isMonev: boolean
  isKorwil: boolean
  monevId?: number | null
}) {
  const [list, setList] = useState<RelawanRow[]>([])
  const [korwilOptions, setKorwilOptions] = useState<OptionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [sortBy, setSortBy] = useState('default')
  const [searchQuery, setSearchQuery] = useState('')
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

  const canSelectKorwil = isAdmin || isMonev

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [data, opts] = await Promise.all([
        getRelawanList(),
        canSelectKorwil ? getKorwilOptions(isMonev ? monevId : null) : Promise.resolve([]),
      ])
      setList(data)
      setKorwilOptions(opts)
    } finally { setLoading(false) }
  }, [canSelectKorwil, isMonev, monevId])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setEditingId(null); setForm(emptyForm()); setIsOpen(true); window.scrollTo({top: 0, behavior: 'smooth'}) }
  const openEdit = (row: RelawanRow) => {
    setEditingId(row.id)
    setForm({
      nama: row.nama, hp: row.hp ?? '', email: row.email ?? '', korwil_id: row.korwil_id ? String(row.korwil_id) : '',
      foto_url: row.foto_url ?? '', status_relawan: row.status_relawan ?? 'Aktif', cabang_dbf: row.cabang_dbf ?? '', tipe_relawan: row.tipe_relawan ?? '',
      tempat_lahir: row.tempat_lahir ?? '', tanggal_lahir: row.tanggal_lahir ?? '', jenis_kelamin: row.jenis_kelamin ?? '', alamat: row.alamat ?? '', nomor_induk: row.nomor_induk ?? '', ketokohan: row.ketokohan ?? '',
      bank: row.bank ?? '', nomor_rekening: row.nomor_rekening ?? '', atas_nama: row.atas_nama ?? '',
      nomor_ktp: row.nomor_ktp ?? '', nomor_kk: row.nomor_kk ?? '', pendidikan: row.pendidikan ?? '', pekerjaan: row.pekerjaan ?? '',
      jabatan_desa: row.jabatan_desa ?? '', keahlian: row.keahlian ?? '', status_edukasi: row.status_edukasi ?? '', coa_kafalah: row.coa_kafalah ?? '', nama_coa_kafalah: row.nama_coa_kafalah ?? '',
      akun_facebook: row.akun_facebook ?? '', akun_twitter: row.akun_twitter ?? '', akun_instagram: row.akun_instagram ?? ''
    })
    setIsOpen(true)
    window.scrollTo({top: 0, behavior: 'smooth'})
  }
  const closeForm = () => { setIsOpen(false); setEditingId(null); setForm(emptyForm()) }

  const handleUploadImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      setUploadingImage(true)
      const newBlob = await upload(`relawan-foto-${Date.now()}-${file.name}`, file, {
        access: 'public',
        handleUploadUrl: '/api/upload',
      })
      setForm({ ...form, foto_url: newBlob.url })
      toast.success('Foto berhasil diunggah')
    } catch (error: any) {
      toast.error('Gagal mengunggah gambar: ' + error.message)
    } finally {
      setUploadingImage(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (canSelectKorwil && !form.korwil_id) {
      toast.error('Pilih Korwil terlebih dahulu')
      return
    }
    setSubmitting(true)
    const basePayload = {
      nama: form.nama, hp: form.hp || undefined,
      korwil_id: canSelectKorwil && form.korwil_id ? Number(form.korwil_id) : undefined,
      foto_url: form.foto_url || undefined,
      status_relawan: form.status_relawan || undefined,
      cabang_dbf: form.cabang_dbf || undefined,
      tipe_relawan: form.tipe_relawan || undefined,
      tempat_lahir: form.tempat_lahir || undefined,
      tanggal_lahir: form.tanggal_lahir || undefined,
      jenis_kelamin: form.jenis_kelamin || undefined,
      alamat: form.alamat || undefined,
      nomor_induk: form.nomor_induk || undefined,
      ketokohan: form.ketokohan || undefined,
      bank: form.bank || undefined,
      nomor_rekening: form.nomor_rekening || undefined,
      atas_nama: form.atas_nama || undefined,
      nomor_ktp: form.nomor_ktp || undefined,
      nomor_kk: form.nomor_kk || undefined,
      pendidikan: form.pendidikan || undefined,
      pekerjaan: form.pekerjaan || undefined,
      jabatan_desa: form.jabatan_desa || undefined,
      keahlian: form.keahlian || undefined,
      status_edukasi: form.status_edukasi || undefined,
      coa_kafalah: form.coa_kafalah || undefined,
      nama_coa_kafalah: form.nama_coa_kafalah || undefined,
      akun_facebook: form.akun_facebook || undefined,
      akun_twitter: form.akun_twitter || undefined,
      akun_instagram: form.akun_instagram || undefined,
    }

    const result = editingId
      ? await updateRelawan(editingId, { ...basePayload, email: form.email || undefined })
      : await createRelawan({ ...basePayload, email: form.email, korwil_id: Number(form.korwil_id) })

    if (result.success) {
      toast.success(editingId ? 'Relawan berhasil diupdate' : 'Relawan berhasil ditambahkan')
      closeForm(); load()
    } else {
      toast.error(result.error || 'Terjadi kesalahan')
    }
    setSubmitting(false)
  }

  const handleDelete = async (row: RelawanRow) => {
    if (!confirm(`Hapus Relawan "${row.nama}"? Data desa binaan tidak akan ikut terhapus.`)) return
    const result = await deleteRelawan(row.id)
    if (result.success) { toast.success('Relawan dihapus'); load() }
    else toast.error(result.error || 'Gagal menghapus')
  }

  const filteredList = list.filter((row) => {
    let matchesSort = true
    if (sortBy === 'tanpa-desa') matchesSort = row.jumlah_desa === 0

    const matchesSearch = row.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (row.email && row.email.toLowerCase().includes(searchQuery.toLowerCase()))

    return matchesSort && matchesSearch
  })

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] mb-6 gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100 shadow-sm shadow-blue-500/5">
            <Users className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Daftar Relawan Desa Berpijak</h3>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Total: <span className="text-blue-600">{filteredList.length}</span> Pengguna Aktif</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap justify-end">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Cari nama/email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 rounded-xl"
            />
          </div>
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[165px] h-10 rounded-xl font-bold text-slate-600 shadow-sm border-slate-200 hover:bg-slate-50">
              <SelectValue placeholder="Sortir" />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="default" className="font-semibold">Semua Relawan</SelectItem>
              <SelectItem value="tanpa-desa" className="font-semibold">Tanpa Desa</SelectItem>
            </SelectContent>
          </Select>
          {(isAdmin || isMonev) && <GantiRelawanDesaSheet />}
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="h-10 rounded-xl px-4 border-slate-200 hover:bg-slate-50 text-slate-600 font-bold shadow-sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={openCreate} style={{ backgroundColor: '#7a1200' }} className="h-10 rounded-xl px-5 text-white font-bold shadow-lg shadow-[#7a1200]/20 hover:shadow-[#7a1200]/30 transition-all active:scale-95 gap-2">
            <Plus className="w-4 h-4" /> Tambah Baru
          </Button>
        </div>
      </div>

      {isOpen && (
        <Card className="border-[#7a1200]/30 shadow-lg mb-8 ring-1 ring-slate-100 overflow-hidden">
          <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#7a1200]/10 flex items-center justify-center">
                    <Edit className="w-4 h-4 text-[#7a1200]" />
                  </div>
                  {editingId ? 'Edit Profil Relawan' : 'Tambah Relawan Baru'}
                </CardTitle>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Isi informasi lengkap relawan di bawah ini</p>
              </div>
              <Button variant="ghost" size="icon" onClick={closeForm} className="hover:bg-red-50 hover:text-red-500 transition-colors"><X className="w-5 h-5" /></Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <form onSubmit={handleSubmit}>
              <Tabs defaultValue="utama" className="w-full">
                <div className="bg-slate-50 border-b border-slate-200 px-6 pt-2">
                  <TabsList className="bg-transparent space-x-2 h-auto p-0">
                    <TabsTrigger value="utama" className="data-[state=active]:bg-white data-[state=active]:text-[#7a1200] data-[state=active]:shadow-sm data-[state=active]:border-slate-200 border border-transparent rounded-t-lg px-6 py-2.5 font-bold uppercase tracking-widest text-[11px] text-slate-500">Profil Utama</TabsTrigger>
                    <TabsTrigger value="biodata" className="data-[state=active]:bg-white data-[state=active]:text-[#7a1200] data-[state=active]:shadow-sm data-[state=active]:border-slate-200 border border-transparent rounded-t-lg px-6 py-2.5 font-bold uppercase tracking-widest text-[11px] text-slate-500">Biodata Lengkap</TabsTrigger>
                    <TabsTrigger value="tambahan" className="data-[state=active]:bg-white data-[state=active]:text-[#7a1200] data-[state=active]:shadow-sm data-[state=active]:border-slate-200 border border-transparent rounded-t-lg px-6 py-2.5 font-bold uppercase tracking-widest text-[11px] text-slate-500">Info Tambahan</TabsTrigger>
                    <TabsTrigger value="bank_sosmed" className="data-[state=active]:bg-white data-[state=active]:text-[#7a1200] data-[state=active]:shadow-sm data-[state=active]:border-slate-200 border border-transparent rounded-t-lg px-6 py-2.5 font-bold uppercase tracking-widest text-[11px] text-slate-500">Bank & Sosmed</TabsTrigger>
                  </TabsList>
                </div>

                <div className="p-6">
                  <TabsContent value="utama" className="m-0 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                      <div className="space-y-2 col-span-1 md:col-span-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Nama Lengkap <span className="text-red-500">*</span></Label>
                        <Input required value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Nama Relawan" className="h-11 rounded-xl bg-slate-50/50" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Email Login {!editingId && <span className="text-red-500">*</span>}</Label>
                        <Input type="email" required={!editingId} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="relawan@desaberdaya.id" className="h-11 rounded-xl bg-slate-50/50" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Nomor Telepon / HP</Label>
                        <Input value={form.hp} onChange={(e) => setForm({ ...form, hp: e.target.value })} placeholder="08xx-xxxx-xxxx" className="h-11 rounded-xl bg-slate-50/50" />
                      </div>
                      
                      {canSelectKorwil && (
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Atasan Korwil <span className="text-red-500">*</span></Label>
                          <Select value={form.korwil_id} onValueChange={(v) => setForm({ ...form, korwil_id: v })}>
                            <SelectTrigger className="h-11 rounded-xl bg-slate-50/50"><SelectValue placeholder="Pilih Korwil" /></SelectTrigger>
                            <SelectContent className="rounded-xl">
                              {korwilOptions.map((k) => (
                                <SelectItem key={k.id} value={String(k.id)} className="font-medium">{k.nama}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Status Relawan</Label>
                        <Select value={form.status_relawan} onValueChange={(v) => setForm({ ...form, status_relawan: v })}>
                          <SelectTrigger className="h-11 rounded-xl bg-slate-50/50"><SelectValue placeholder="Pilih Status" /></SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="Aktif" className="font-medium">Aktif</SelectItem>
                            <SelectItem value="Tidak Aktif" className="font-medium">Tidak Aktif</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Tipe Relawan</Label>
                        <Input value={form.tipe_relawan} onChange={(e) => setForm({ ...form, tipe_relawan: e.target.value })} placeholder="Contoh: Relawan Inspirasi" className="h-11 rounded-xl bg-slate-50/50" />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Cabang DBF</Label>
                        <Input value={form.cabang_dbf} onChange={(e) => setForm({ ...form, cabang_dbf: e.target.value })} placeholder="Contoh: Bandung" className="h-11 rounded-xl bg-slate-50/50" />
                      </div>
                      
                      <div className="space-y-2 xl:col-span-4 bg-white p-4 border border-slate-200 rounded-xl relative">
                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-2 block">Foto / Avatar Profil</Label>
                        <div className="flex flex-col sm:flex-row gap-4 items-center sm:items-start">
                          <div className="w-20 h-20 rounded-full border-2 border-slate-200 bg-slate-50 overflow-hidden shrink-0 flex items-center justify-center relative">
                            {form.foto_url ? (
                              <img src={form.foto_url} alt="Foto" className="w-full h-full object-cover" />
                            ) : (
                              <Users className="w-8 h-8 text-slate-300" />
                            )}
                          </div>
                          <div className="flex-1 space-y-2 text-center sm:text-left">
                            <p className="text-xs text-slate-500">
                              Unggah foto profil terbaru. Format JPG, PNG, atau WEBP maks 4MB.
                            </p>
                            <input 
                              type="file" 
                              accept="image/png, image/jpeg, image/webp" 
                              ref={fileInputRef}
                              className="hidden"
                              onChange={handleUploadImage}
                            />
                            <Button 
                              type="button"
                              onClick={() => fileInputRef.current?.click()} 
                              disabled={uploadingImage}
                              variant="outline"
                              size="sm"
                              className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border-indigo-200 h-9 shrink-0 mx-auto sm:mx-0"
                            >
                              {uploadingImage ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Mengunggah...</>
                              ) : (
                                <><UploadCloud className="w-4 h-4 mr-2" /> Pilih Foto</>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="biodata" className="m-0 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      <div className="space-y-2 md:col-span-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Alamat Rumah</Label>
                        <Input value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} placeholder="Jln. Raya No 1..." className="h-11 rounded-xl bg-slate-50/50" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Nomor Induk</Label>
                        <Input value={form.nomor_induk} onChange={(e) => setForm({ ...form, nomor_induk: e.target.value })} placeholder="200201..." className="h-11 rounded-xl bg-slate-50/50" />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Tempat Lahir</Label>
                        <Input value={form.tempat_lahir} onChange={(e) => setForm({ ...form, tempat_lahir: e.target.value })} placeholder="Kota..." className="h-11 rounded-xl bg-slate-50/50" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Tanggal Lahir</Label>
                        <Input type="date" value={form.tanggal_lahir} onChange={(e) => setForm({ ...form, tanggal_lahir: e.target.value })} className="h-11 rounded-xl bg-slate-50/50" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Jenis Kelamin</Label>
                        <Select value={form.jenis_kelamin} onValueChange={(v) => setForm({ ...form, jenis_kelamin: v })}>
                          <SelectTrigger className="h-11 rounded-xl bg-slate-50/50"><SelectValue placeholder="Pilih Gender" /></SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="Laki-laki" className="font-medium">Laki-laki</SelectItem>
                            <SelectItem value="Perempuan" className="font-medium">Perempuan</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Ketokohan</Label>
                        <Input value={form.ketokohan} onChange={(e) => setForm({ ...form, ketokohan: e.target.value })} placeholder="Gelar/Tokoh Masyarakat" className="h-11 rounded-xl bg-slate-50/50" />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="tambahan" className="m-0 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Nomor KTP (NIK)</Label>
                        <Input value={form.nomor_ktp} onChange={(e) => setForm({ ...form, nomor_ktp: e.target.value })} placeholder="16 digit" className="h-11 rounded-xl bg-slate-50/50" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Nomor KK</Label>
                        <Input value={form.nomor_kk} onChange={(e) => setForm({ ...form, nomor_kk: e.target.value })} placeholder="16 digit" className="h-11 rounded-xl bg-slate-50/50" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Status Edukasi</Label>
                        <Input value={form.status_edukasi} onChange={(e) => setForm({ ...form, status_edukasi: e.target.value })} placeholder="Contoh: Terverifikasi" className="h-11 rounded-xl bg-slate-50/50" />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Pendidikan Terakhir</Label>
                        <Input value={form.pendidikan} onChange={(e) => setForm({ ...form, pendidikan: e.target.value })} placeholder="S1, SMA, dll" className="h-11 rounded-xl bg-slate-50/50" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Pekerjaan</Label>
                        <Input value={form.pekerjaan} onChange={(e) => setForm({ ...form, pekerjaan: e.target.value })} placeholder="PNS, Wiraswasta, dll" className="h-11 rounded-xl bg-slate-50/50" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Keahlian Pendukung</Label>
                        <Input value={form.keahlian} onChange={(e) => setForm({ ...form, keahlian: e.target.value })} placeholder="Pertanian, Digital, dll" className="h-11 rounded-xl bg-slate-50/50" />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Jabatan di Desa</Label>
                        <Input value={form.jabatan_desa} onChange={(e) => setForm({ ...form, jabatan_desa: e.target.value })} placeholder="Kadus, RT, Relawan" className="h-11 rounded-xl bg-slate-50/50" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Code COA Kafalah</Label>
                        <Input value={form.coa_kafalah} onChange={(e) => setForm({ ...form, coa_kafalah: e.target.value })} placeholder="501.xx.xx.xx" className="h-11 rounded-xl bg-slate-50/50" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Nama COA Kafalah</Label>
                        <Input value={form.nama_coa_kafalah} onChange={(e) => setForm({ ...form, nama_coa_kafalah: e.target.value })} placeholder="Beban Gaji" className="h-11 rounded-xl bg-slate-50/50" />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="bank_sosmed" className="m-0 space-y-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-6 w-1 bg-blue-500 rounded-full"></div>
                        <h4 className="text-sm font-semibold text-slate-800 tracking-tight">INFORMASI BANK</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Nama Bank</Label>
                          <Input value={form.bank} onChange={(e) => setForm({ ...form, bank: e.target.value })} placeholder="BRI, BNI, BCA..." className="h-11 rounded-xl bg-slate-50/50" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Nomor Rekening</Label>
                          <Input value={form.nomor_rekening} onChange={(e) => setForm({ ...form, nomor_rekening: e.target.value })} placeholder="1234567890" className="h-11 rounded-xl bg-slate-50/50" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Atas Nama</Label>
                          <Input value={form.atas_nama} onChange={(e) => setForm({ ...form, atas_nama: e.target.value })} placeholder="HARYO BIMO" className="h-11 rounded-xl bg-slate-50/50" />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="h-6 w-1 bg-rose-500 rounded-full"></div>
                        <h4 className="text-sm font-semibold text-slate-800 tracking-tight">SOCIAL MEDIA</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Facebook URL</Label>
                          <Input value={form.akun_facebook} onChange={(e) => setForm({ ...form, akun_facebook: e.target.value })} placeholder="@username atau /link" className="h-11 rounded-xl bg-slate-50/50" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Twitter URL</Label>
                          <Input value={form.akun_twitter} onChange={(e) => setForm({ ...form, akun_twitter: e.target.value })} placeholder="@username" className="h-11 rounded-xl bg-slate-50/50" />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-xs font-bold uppercase tracking-widest text-slate-500">Instagram URL</Label>
                          <Input value={form.akun_instagram} onChange={(e) => setForm({ ...form, akun_instagram: e.target.value })} placeholder="@username" className="h-11 rounded-xl bg-slate-50/50" />
                        </div>
                      </div>
                    </div>
                  </TabsContent>
                </div>

                <div className="p-6 bg-slate-50/80 border-t border-slate-100 flex items-center justify-end">
                  <div className="flex gap-3">
                    <Button type="button" variant="outline" onClick={closeForm} className="h-11 rounded-xl px-6 border-slate-200 font-bold text-slate-600 hover:bg-white shadow-sm">Batal</Button>
                    <Button type="submit" disabled={submitting} style={{ backgroundColor: '#7a1200' }} className="h-11 rounded-xl px-8 text-white font-bold shadow-lg shadow-[#7a1200]/20 hover:shadow-[#7a1200]/30 transition-all active:scale-95 gap-2">
                      <Save className="w-4 h-4" /> {submitting ? 'Menyimpan...' : 'Simpan Perubahan'}
                    </Button>
                  </div>
                </div>
              </Tabs>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Tabel */}
      <Card className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-[2rem] bg-white overflow-hidden ring-1 ring-slate-100">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm font-medium">Memuat data...</div>
          ) : list.length === 0 ? (
            <div className="p-12 text-center bg-slate-50/50 m-6 rounded-3xl border border-dashed border-slate-200">
              <p className="text-slate-400 font-bold italic">Belum ada profil Relawan yang terdaftar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto p-4">
              <table className="w-full">
                <thead className="border-b border-slate-100 bg-slate-50/80">
                  <tr>
                    <th className="text-center py-4 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400 w-16 rounded-tl-2xl">No</th>
                    <th className="text-left py-4 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Relawan</th>
                    <th className="text-left py-4 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Posisi</th>
                    <th className="text-left py-4 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Email</th>
                    <th className="text-left py-4 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400">No. HP</th>
                    <th className="text-left py-4 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Koordinator Binaan</th>
                    <th className="text-center py-4 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Total Desa</th>
                    <th className="text-center py-4 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400 rounded-tr-2xl">Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((row, i) => (
                    <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4 px-4 text-sm font-bold text-center text-slate-400">{i + 1}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center font-bold text-slate-800 group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white transition-colors duration-300 flex-shrink-0 overflow-hidden">
                            {row.foto_url ? (
                              <img src={row.foto_url} alt={row.nama} className="w-full h-full object-cover" />
                            ) : (
                              row.nama.charAt(0).toUpperCase()
                            )}
                          </div>
                          <span className="text-sm font-semibold text-slate-800 block truncate">{row.nama}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">{row.tipe_relawan || 'Relawan'}</span>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm font-semibold text-slate-600">{row.email ?? '-'}</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm font-medium text-slate-500">{row.hp ?? '-'}</p>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <UserCheck className="w-3.5 h-3.5 text-amber-600" />
                          <span className="text-sm font-semibold text-slate-700">{row.korwil_nama ?? '-'}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200/50 px-3 py-1 font-bold shadow-none rounded-lg">{row.jumlah_desa} Titik</Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 justify-center">
                          <Button size="sm" variant="outline" onClick={() => openEdit(row)} className="h-8 rounded-lg px-3 text-xs font-bold border-slate-200 text-slate-600 hover:bg-slate-100 shadow-sm">
                            <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit
                          </Button>
                          <KelolaDesaRelawanSheet relawanId={row.id} relawanNama={row.nama} onRefresh={load} />
                          <Link href={`/dashboard/manajemen-tim/wilayah/relawan/${row.id}`}>
                            <Button size="sm" variant="outline" className="h-8 rounded-lg px-3 text-xs font-bold border-emerald-200 text-emerald-700 hover:bg-emerald-50 shadow-sm">
                              <MapPin className="w-3.5 h-3.5 mr-1.5" /> Wilayah
                            </Button>
                          </Link>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(row)} className="h-8 rounded-lg px-3 text-xs font-bold shadow-sm">
                            <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Hapus
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredList.length === 0 && list.length > 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400 text-sm">Tidak ada hasil pencarian.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
