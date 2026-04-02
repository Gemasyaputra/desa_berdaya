'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { BriefcaseBusiness, Plus, Trash2, Edit, X, Save, RefreshCw, KeyRound } from 'lucide-react'
import { toast } from 'sonner'
import {
  getOfficeUsers, createOfficeUser, updateOfficeUser, deleteOfficeUser,
  type OfficeUserType
} from '@/lib/actions/office-user'
import { getOffices, type OfficeWithStats } from '@/lib/actions/office'
import { resetPasswordMonev } from './actions' // We can reuse the same reset password logic since it just targets users.id

function emptyForm() {
  return { nama: '', hp: '', email: '', jabatan: '', office_id: '' }
}

export function CRUDOfficeUser() {
  const [list, setList] = useState<OfficeUserType[]>([])
  const [offices, setOffices] = useState<OfficeWithStats[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingUserId, setEditingUserId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm())

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [users, orgs] = await Promise.all([getOfficeUsers(), getOffices()])
      setList(users)
      setOffices(orgs)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => { 
    setEditingId(null)
    setEditingUserId(null)
    setForm(emptyForm())
    setIsOpen(true) 
  }
  const openEdit = (row: OfficeUserType) => {
    setEditingId(row.id)
    setEditingUserId(row.user_id)
    setForm({ 
      nama: row.nama, 
      hp: row.hp || '', 
      email: row.email || '', 
      jabatan: row.jabatan || '',
      office_id: row.office_id ? row.office_id.toString() : ''
    })
    setIsOpen(true)
  }
  const closeForm = () => { setIsOpen(false); setEditingId(null); setEditingUserId(null); setForm(emptyForm()) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const payload = {
      nama: form.nama,
      email: form.email,
      hp: form.hp || null,
      jabatan: form.jabatan,
      office_id: form.office_id ? parseInt(form.office_id) : null,
      password: editingId ? undefined : 'DesaBerdaya2025' // Default password untuk new user
    }

    const result = editingId && editingUserId
      ? await updateOfficeUser(editingId, editingUserId, payload)
      : await createOfficeUser(payload)

    if (result.success) {
      toast.success(editingId ? 'Office User diupdate' : 'Office User ditambahkan')
      closeForm()
      load()
    } else {
      toast.error(result.error || 'Terjadi kesalahan')
    }
    setSubmitting(false)
  }

  const handleDelete = async (row: OfficeUserType) => {
    if (!confirm(`Hapus Profil "${row.nama}"? Akun login dari pengguna ini akan hangus.`)) return
    const result = await deleteOfficeUser(row.user_id)
    if (result.success) { toast.success('Pengguna dihapus'); load() }
    else toast.error(result.error || 'Gagal menghapus')
  }



  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-100 shadow-sm shadow-amber-100">
            <BriefcaseBusiness className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Daftar Pengguna Kantor (Office User)</h3>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Total: <span className="text-amber-600">{list.length}</span> Pengguna Aktif</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="h-10 rounded-xl px-4 border-slate-200 hover:bg-slate-50 text-slate-600 font-bold shadow-sm">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={openCreate} className="h-10 rounded-xl px-5 bg-amber-600 hover:bg-amber-700 text-white font-bold shadow-lg shadow-amber-600/20 hover:shadow-amber-600/30 transition-all active:scale-95 gap-2">
            <Plus className="w-4 h-4" /> Tambah Karyawan
          </Button>
        </div>
      </div>

      {/* Form Inline */}
      {isOpen && (
        <Card className="border-amber-600/30 shadow-sm">
          <CardHeader className="pb-3 border-b border-amber-50 mb-4 bg-amber-50/20 rounded-t-xl">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{editingId ? 'Edit Karyawan Office' : 'Tambah Karyawan Baru'}</CardTitle>
              <Button variant="ghost" size="icon" onClick={closeForm}><X className="w-4 h-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label>Nama Lengkap <span className="text-red-500">*</span></Label>
                  <Input required value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Nama Lengkap" />
                </div>
                <div className="space-y-1.5">
                  <Label>No. HP</Label>
                  <Input value={form.hp} onChange={(e) => setForm({ ...form, hp: e.target.value })} placeholder="08xx-xxxx-xxxx" />
                </div>
                <div className="space-y-1.5">
                  <Label>Jabatan Staf <span className="text-red-500">*</span></Label>
                  <Select 
                    value={form.jabatan} 
                    onValueChange={(val) => setForm({ ...form, jabatan: val })}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih Jabatan..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Finance of Program">Finance of Program</SelectItem>
                      <SelectItem value="Program Head">Program Head</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Email Akun Login <span className="text-red-500">*</span></Label>
                  <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="office@desaberdaya.id" />
                </div>
                <div className="space-y-1.5 lg:col-span-2">
                  <Label>Hubungkan Ke Kantor Regional (Opsional)</Label>
                  <Select value={form.office_id} onValueChange={(val) => setForm({ ...form, office_id: val })}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Pilih Office Penugasan..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none" className="text-red-600 font-bold">-- Lepas dari Office --</SelectItem>
                      {offices.map((o) => (
                        <SelectItem key={o.id} value={o.id.toString()}>{o.nama_office}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {!editingId && (
                  <div className="space-y-1.5 lg:col-span-2 flex items-center bg-slate-50 border border-slate-100 rounded-lg px-4 mt-1.5">
                    <p className="text-xs text-slate-500"><span className="font-bold text-slate-700">Info:</span> Password awal (default) untuk user baru adalah <strong className="text-amber-700">DesaBerdaya2025</strong></p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <Button type="submit" disabled={submitting} className="bg-amber-600 hover:bg-amber-700 text-white gap-1 font-bold">
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
              <p className="text-slate-400 font-bold italic">Belum ada Karyawan/User Office yang didaftarkan.</p>
            </div>
          ) : (
            <div className="overflow-x-auto p-4">
              <table className="w-full">
                <thead className="border-b border-slate-100 bg-slate-50/80">
                  <tr>
                    <th className="text-left py-4 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400 w-16 rounded-tl-2xl">No</th>
                    <th className="text-left py-4 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Identitas Staf</th>
                    <th className="text-left py-4 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Posis & Kontak</th>
                    <th className="text-left py-4 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Penugasan Regional</th>
                    <th className="text-center py-4 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400 rounded-tr-2xl w-[260px]">Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((row, i) => (
                    <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4 px-4 text-sm font-bold text-center text-slate-400">{i + 1}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center font-black text-slate-800 group-hover:bg-amber-600 group-hover:text-white transition-colors duration-300 flex-shrink-0">
                            {row.nama.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-sm font-black text-slate-800 block truncate leading-none mb-1">{row.nama}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest line-clamp-1">{row.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <Badge className="bg-slate-100 text-slate-700 border-slate-200/50 px-2.5 py-0.5 font-bold shadow-none rounded-md mb-1">{row.jabatan}</Badge>
                        <p className="text-[11px] font-medium text-slate-400">{row.hp || 'Belum set HP'}</p>
                      </td>
                      <td className="py-4 px-4">
                        {row.office_id ? (
                           <Badge className="bg-blue-50 text-blue-700 border-blue-200/50 px-3 py-1 font-bold shadow-none rounded-lg">{row.nama_office}</Badge>
                        ) : (
                           <span className="text-xs italic text-slate-400">Belum di-assign</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 justify-center">
                          <Button size="sm" variant="outline" onClick={() => openEdit(row)} className="h-8 rounded-lg px-3 text-xs font-bold border-slate-200 text-slate-600 hover:bg-slate-100 shadow-sm">
                            <Edit className="w-3.5 h-3.5 mr-1" /> Edit
                          </Button>

                          <Button size="sm" variant="destructive" onClick={() => handleDelete(row)} className="h-8 rounded-lg px-2 text-xs font-bold shadow-sm">
                            <Trash2 className="w-3.5 h-3.5" />
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
