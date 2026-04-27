'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { Plus, Trash2, Edit, X, Save, RefreshCw, KeyRound, Shield, MapPin, Search } from 'lucide-react'
import { toast } from 'sonner'
import {
  getMonevList, createMonev, updateMonev, deleteMonev, resetPasswordMonev,
  type MonevRow,
} from './actions'

function emptyForm() {
  return { nama: '', hp: '', email: '' }
}

export function CRUDMonev() {
  const [list, setList] = useState<MonevRow[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [searchQuery, setSearchQuery] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try { setList(await getMonevList()) } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setEditingId(null); setForm(emptyForm()); setIsOpen(true) }
  const openEdit = (row: MonevRow) => {
    setEditingId(row.id)
    setForm({ nama: row.nama, hp: row.hp ?? '', email: row.email ?? '' })
    setIsOpen(true)
  }
  const closeForm = () => { setIsOpen(false); setEditingId(null); setForm(emptyForm()) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const result = editingId
      ? await updateMonev(editingId, { nama: form.nama, hp: form.hp || undefined, email: form.email || undefined })
      : await createMonev({ nama: form.nama, hp: form.hp || undefined, email: form.email })

    if (result.success) {
      toast.success(editingId ? 'Monev berhasil diupdate' : 'Monev berhasil ditambahkan')
      closeForm()
      load()
    } else {
      toast.error(result.error || 'Terjadi kesalahan')
    }
    setSubmitting(false)
  }

  const handleDelete = async (row: MonevRow) => {
    if (!confirm(`Hapus Monev "${row.nama}"? Semua data terkait akan ikut terdampak.`)) return
    const result = await deleteMonev(row.id)
    if (result.success) { toast.success('Monev dihapus'); load() }
    else toast.error(result.error || 'Gagal menghapus')
  }

  const filteredList = list.filter((row) => 
    row.nama.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (row.email && row.email.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center border border-red-100 shadow-sm shadow-[#7a1200]/5">
            <Shield className="w-6 h-6 text-[#7a1200]" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Daftar Monev Administrator</h3>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Total: <span className="text-[#7a1200]">{list.length}</span> Pengguna Aktif</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto mt-4 md:mt-0 flex-wrap md:flex-nowrap">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Cari nama/email..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 rounded-xl"
            />
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="h-10 rounded-xl px-4 border-slate-200 hover:bg-slate-50 text-slate-600 font-bold shadow-sm shrink-0">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={openCreate} style={{ backgroundColor: '#7a1200' }} className="h-10 rounded-xl px-5 text-white font-bold shadow-lg shadow-[#7a1200]/20 hover:shadow-[#7a1200]/30 transition-all active:scale-95 gap-2">
            <Plus className="w-4 h-4" /> Tambah Baru
          </Button>
        </div>
      </div>

      {/* Form Inline */}
      {isOpen && (
        <Card className="border-[#7a1200]/30 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{editingId ? 'Edit Monev' : 'Tambah Monev Baru'}</CardTitle>
              <Button variant="ghost" size="icon" onClick={closeForm}><X className="w-4 h-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <Label>Nama <span className="text-red-500">*</span></Label>
                  <Input required value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Nama Monev" />
                </div>
                <div className="space-y-1.5">
                  <Label>No. HP</Label>
                  <Input value={form.hp} onChange={(e) => setForm({ ...form, hp: e.target.value })} placeholder="08xx-xxxx-xxxx" />
                </div>
                <div className="space-y-1.5">
                  <Label>Email Login {!editingId && <span className="text-red-500">*</span>}</Label>
                  <Input type="email" required={!editingId} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="monev@desaberdaya.id" />
                  {!editingId && <p className="text-xs text-slate-400">Password default: DesaBerdaya2025</p>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting} style={{ backgroundColor: '#7a1200' }} className="text-white gap-1">
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
              <p className="text-slate-400 font-bold italic">Belum ada profil Monev yang terdaftar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto p-4">
              <table className="w-full">
                <thead className="border-b border-slate-100 bg-slate-50/80">
                  <tr>
                    <th className="text-center py-4 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400 w-16 rounded-tl-2xl">No</th>
                    <th className="text-left py-4 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Monev</th>
                    <th className="text-left py-4 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Posisi</th>
                    <th className="text-left py-4 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Email</th>
                    <th className="text-left py-4 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400">No. HP</th>
                    <th className="text-center py-4 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Korwil Binaan</th>
                    <th className="text-center py-4 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400 rounded-tr-2xl">Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((row, i) => (
                    <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4 px-4 text-sm font-bold text-center text-slate-400">{i + 1}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center font-bold text-slate-800 group-hover:bg-[#7a1200] group-hover:text-white transition-colors duration-300 flex-shrink-0">
                            {row.nama.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-semibold text-slate-800 block truncate">{row.nama}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg">Lead Supervisor</span>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm font-semibold text-slate-600">{row.email ?? '-'}</p>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm font-medium text-slate-500">{row.hp ?? '-'}</p>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Badge className="bg-amber-50 text-amber-700 border-amber-200/50 px-3 py-1 font-bold shadow-none rounded-lg">{row.jumlah_korwil} Cabang</Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 justify-center">
                          <Button size="sm" variant="outline" onClick={() => openEdit(row)} className="h-8 rounded-lg px-3 text-xs font-bold border-slate-200 text-slate-600 hover:bg-slate-100 shadow-sm">
                            <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit
                          </Button>
                          <Link href={`/dashboard/manajemen-tim/wilayah/monev/${row.id}`}>
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
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-sm">Tidak ada hasil pencarian.</td>
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
