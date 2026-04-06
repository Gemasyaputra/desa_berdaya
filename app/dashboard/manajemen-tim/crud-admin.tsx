'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Shield, Plus, Trash2, Edit, X, Save, RefreshCw, KeyRound, Search } from 'lucide-react'
import { toast } from 'sonner'
import {
  getAdminList, createAdmin, updateAdmin, deleteAdmin,
  type AdminRow
} from './actions'

function emptyForm() {
  return { email: '' }
}

export function CRUDAdmin() {
  const [list, setList] = useState<AdminRow[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm())
  const [searchQuery, setSearchQuery] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try { 
      setList(await getAdminList())
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setEditingId(null); setForm(emptyForm()); setIsOpen(true) }
  const openEdit = (row: AdminRow) => {
    setEditingId(row.id)
    setForm({ email: row.email })
    setIsOpen(true)
  }
  const closeForm = () => { setIsOpen(false); setEditingId(null); setForm(emptyForm()) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    const result = editingId
      ? await updateAdmin(editingId, { email: form.email })
      : await createAdmin({ email: form.email })

    if (result.success) {
      toast.success(editingId ? 'Admin berhasil diupdate' : 'Admin berhasil ditambahkan')
      closeForm()
      load()
    } else {
      toast.error(result.error || 'Terjadi kesalahan')
    }
    setSubmitting(false)
  }

  const handleDelete = async (row: AdminRow) => {
    if (!confirm(`Hapus Admin "${row.email}"?`)) return
    const result = await deleteAdmin(row.id)
    if (result.success) { toast.success('Admin dihapus'); load() }
    else toast.error(result.error || 'Gagal menghapus')
  }

  const filteredList = list.filter((row) => 
    row.email?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] mb-6 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center border border-slate-200 shadow-sm">
            <Shield className="w-6 h-6 text-slate-700" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Daftar Administrator</h3>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Total: <span className="text-slate-700">{filteredList.length}</span> Pengguna</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative w-full md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input 
              placeholder="Cari email admin..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 rounded-xl"
            />
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading} className="h-10 rounded-xl px-4 border-slate-200 hover:bg-slate-50 text-slate-600 font-bold shadow-sm shrink-0">
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={openCreate} className="h-10 rounded-xl px-5 bg-slate-800 hover:bg-slate-900 text-white font-bold shadow-lg shadow-slate-800/20 transition-all active:scale-95 gap-2 shrink-0">
            <Plus className="w-4 h-4" /> Tambah Admin
          </Button>
        </div>
      </div>

      {isOpen && (
        <Card className="border-slate-800/30 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{editingId ? 'Edit Akses Admin' : 'Tambah Admin Baru'}</CardTitle>
              <Button variant="ghost" size="icon" onClick={closeForm}><X className="w-4 h-4" /></Button>
            </div>
            {!editingId && (
              <p className="text-xs text-slate-500 mt-1">
                Catatan: Akun admin baru akan dibuat dengan password default <code className="bg-slate-100 px-1 rounded">DesaBerdaya2025</code>. Pengguna dianjurkan login via Google (SSO) agar lebih aman.
              </p>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5 md:col-span-2">
                  <Label>Email</Label>
                  <Input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="email@contoh.com" />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" disabled={submitting} className="bg-slate-800 hover:bg-slate-900 text-white gap-1">
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
              <p className="text-slate-400 font-bold italic">Belum ada Admin yang terdaftar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto p-4">
              <table className="w-full">
                <thead className="border-b border-slate-100 bg-slate-50/80">
                  <tr>
                    <th className="text-center py-4 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400 w-16 rounded-tl-2xl">No</th>
                    <th className="text-left py-4 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Akun Admin</th>
                    <th className="text-center py-4 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Status</th>
                    <th className="text-center py-4 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400 rounded-tr-2xl">Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((row, i) => (
                    <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4 text-sm font-bold text-center text-slate-400">{i + 1}</td>
                      <td className="py-4 px-4">
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-800">{row.email}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200">Admin Utama</Badge>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center gap-2 justify-center">
                          <Button size="sm" variant="outline" onClick={() => openEdit(row)} className="h-8 rounded-lg px-3 text-xs font-bold border-slate-200 text-slate-600 hover:bg-slate-100 shadow-sm">
                            <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(row)} className="h-8 rounded-lg px-3 text-xs font-bold shadow-sm">
                            <Trash2 className="w-3.5 h-3.5 mr-1.5" /> Hapus
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredList.length === 0 && list.length > 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 text-sm">Tidak ada hasil pencarian.</td>
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
