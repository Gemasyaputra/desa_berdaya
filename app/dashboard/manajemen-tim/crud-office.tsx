'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Building2, Plus, Trash2, Edit, X, Save, RefreshCw, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import {
  getOffices, createOffice, updateOffice, deleteOffice,
  type OfficeWithStats
} from '@/lib/actions/office'
import { getProvinsi, getKotaKabupaten, getKecamatan } from '@/app/dashboard/desa/actions'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

function emptyForm() {
  return { 
    nama_office: '', 
    alamat: '',
    provinsi_id: undefined as number | undefined,
    kota_id: undefined as number | undefined,
    kecamatan_id: undefined as number | undefined
  }
}

export function CRUDOffice() {
  const [list, setList] = useState<OfficeWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm())

  // Wilayah Data
  const [provinsis, setProvinsis] = useState<any[]>([])
  const [kotas, setKotas] = useState<any[]>([])
  const [kecamatans, setKecamatans] = useState<any[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    try { 
      setList(await getOffices())
      setProvinsis(await getProvinsi())
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  // Cascading logic
  useEffect(() => {
    if (form.provinsi_id) {
      getKotaKabupaten(form.provinsi_id).then(setKotas)
    } else {
      setKotas([])
    }
    // Reset lower fields if provinsi changes
    if (!form.provinsi_id || (kotas.length > 0 && form.kota_id && !kotas.some(k => k.id === form.kota_id))) {
       // Only reset if it's a change from a valid ID
    }
  }, [form.provinsi_id])

  useEffect(() => {
    if (form.kota_id) {
      getKecamatan(form.kota_id).then(setKecamatans)
    } else {
      setKecamatans([])
    }
  }, [form.kota_id])

  const openCreate = () => { setEditingId(null); setForm(emptyForm()); setIsOpen(true) }
  const openEdit = (row: OfficeWithStats) => {
    setEditingId(row.id)
    setForm({ 
      nama_office: row.nama_office, 
      alamat: row.alamat || '',
      provinsi_id: row.provinsi_id || undefined,
      kota_id: row.kota_id || undefined,
      kecamatan_id: row.kecamatan_id || undefined
    })
    setIsOpen(true)
  }
  const closeForm = () => { setIsOpen(false); setEditingId(null); setForm(emptyForm()) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const result = editingId
      ? await updateOffice(editingId, form.nama_office, form.alamat || null, form.provinsi_id, form.kota_id, form.kecamatan_id)
      : await createOffice(form.nama_office, form.alamat || null, form.provinsi_id, form.kota_id, form.kecamatan_id)

    if (result.success) {
      toast.success(editingId ? 'Office berhasil diupdate' : 'Office berhasil ditambahkan')
      closeForm()
      load()
    } else {
      toast.error(result.error || 'Terjadi kesalahan')
    }
    setSubmitting(false)
  }

  const handleDelete = async (row: OfficeWithStats) => {
    if (!confirm(`Hapus Office "${row.nama_office}"? Semua data terkait (termasuk relasi ke pengguna) akan ikut terhapus.`)) return
    const result = await deleteOffice(row.id)
    if (result.success) { toast.success('Office dihapus'); load() }
    else toast.error(result.error || 'Gagal menghapus')
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center border border-indigo-100 shadow-sm shadow-indigo-100">
            <Building2 className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Daftar Kantor Regional (Office)</h3>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Total: <span className="text-indigo-600">{list.length}</span> Kantor Aktif</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="h-10 rounded-xl px-4 border-slate-200 hover:bg-slate-50 text-slate-600 font-bold shadow-sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={openCreate} className="h-10 rounded-xl px-5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/30 transition-all active:scale-95 gap-2">
            <Plus className="w-4 h-4" /> Tambah Office
          </Button>
        </div>
      </div>

      {/* Form Inline */}
      {isOpen && (
        <Card className="border-indigo-600/30 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{editingId ? 'Edit Kantor Regional' : 'Tambah Kantor Baru'}</CardTitle>
              <Button variant="ghost" size="icon" onClick={closeForm}><X className="w-4 h-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Nama Office <span className="text-red-500">*</span></Label>
                  <Input required value={form.nama_office} onChange={(e) => setForm({ ...form, nama_office: e.target.value })} placeholder="Misal: Kantor Regional Jabar" />
                </div>
                <div className="space-y-1.5">
                  <Label>Provinsi</Label>
                  <Select 
                    value={form.provinsi_id?.toString()} 
                    onValueChange={(v) => setForm({ ...form, provinsi_id: Number(v), kota_id: undefined, kecamatan_id: undefined })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Provinsi" />
                    </SelectTrigger>
                    <SelectContent>
                      {provinsis.map(p => (
                        <SelectItem key={p.id} value={p.id.toString()}>{p.nama_provinsi}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Kota/Kabupaten</Label>
                  <Select 
                    disabled={!form.provinsi_id}
                    value={form.kota_id?.toString()} 
                    onValueChange={(v) => setForm({ ...form, kota_id: Number(v), kecamatan_id: undefined })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Kota/Kabupaten" />
                    </SelectTrigger>
                    <SelectContent>
                      {kotas.map(k => (
                        <SelectItem key={k.id} value={k.id.toString()}>{k.nama_kota}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Kecamatan</Label>
                  <Select 
                    disabled={!form.kota_id}
                    value={form.kecamatan_id?.toString()} 
                    onValueChange={(v) => setForm({ ...form, kecamatan_id: Number(v) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih Kecamatan" />
                    </SelectTrigger>
                    <SelectContent>
                      {kecamatans.map(k => (
                        <SelectItem key={k.id} value={k.id.toString()}>{k.nama_kecamatan}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <Label>Alamat Lengkap (Jalan, No. Bangunan, dll)</Label>
                  <Input value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })} placeholder="Jl. Raya Desa Berdaya No.1" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting} className="bg-indigo-600 hover:bg-indigo-700 text-white gap-1">
                  <Save className="w-4 h-4" /> {submitting ? 'Menyimpan...' : 'Simpan'}
                </Button>
                <Button type="button" variant="outline" onClick={closeForm}>Batal</Button>
              </div>
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
              <p className="text-slate-400 font-bold italic">Belum ada Kantor Regional yang didaftarkan.</p>
            </div>
          ) : (
            <div className="overflow-x-auto p-4">
              <table className="w-full">
                <thead className="border-b border-slate-100 bg-slate-50/80">
                  <tr>
                    <th className="text-center py-4 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400 w-16 rounded-tl-2xl">No</th>
                    <th className="text-left py-4 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Identitas Kantor</th>
                    <th className="text-center py-4 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Jumlah User</th>
                    <th className="text-center py-4 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Desa Binaan</th>
                    <th className="text-center py-4 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400 rounded-tr-2xl">Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((row, i) => (
                    <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4 px-4 text-sm font-bold text-center text-slate-400">{i + 1}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center font-black text-slate-800 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300 flex-shrink-0">
                            {row.nama_office.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-sm font-black text-slate-800 block truncate leading-none mb-1">{row.nama_office}</span>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex flex-wrap gap-x-2">
                               {row.nama_kecamatan && <span>{row.nama_kecamatan},</span>}
                               {row.nama_kota && <span>{row.nama_kota}</span>}
                               {row.nama_provinsi && <span>({row.nama_provinsi})</span>}
                            </div>
                            <span className="text-[10px] font-medium text-slate-300 line-clamp-1 italic">{row.alamat || 'Detail alamat tidak diinput'}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Badge className="bg-blue-50 text-blue-700 border-blue-200/50 px-3 py-1 font-bold shadow-none rounded-lg">{row.jumlah_user} Pengguna</Badge>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200/50 px-3 py-1 font-bold shadow-none rounded-lg">{row.jumlah_desa} Titik</Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 justify-center">
                          <Button size="sm" variant="outline" onClick={() => openEdit(row)} className="h-8 rounded-lg px-3 text-xs font-bold border-slate-200 text-slate-600 hover:bg-slate-100 shadow-sm">
                            <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit
                          </Button>
                          <Link href={`/dashboard/manajemen-tim/wilayah/office/${row.id}`}>
                            <Button size="sm" variant="outline" className="h-8 rounded-lg px-3 text-xs font-bold border-indigo-200 text-indigo-700 hover:bg-indigo-50 shadow-sm">
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
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
