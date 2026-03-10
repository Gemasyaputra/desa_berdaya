'use client'

import Link from 'next/link'
import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Plus, Trash2, Edit, X, Save, RefreshCw, KeyRound, UserCheck, MapPin } from 'lucide-react'
import { toast } from 'sonner'
import {
  getKorwilList, createKorwil, updateKorwil, deleteKorwil, resetPasswordKorwil,
  getMonevOptions,
  type KorwilRow, type OptionItem,
} from './actions'

function emptyForm() {
  return { nama: '', hp: '', email: '', monev_id: '' }
}

export function CRUDKorwil({ isAdmin, isMonev }: { isAdmin: boolean; isMonev: boolean }) {
  const [list, setList] = useState<KorwilRow[]>([])
  const [monevOptions, setMonevOptions] = useState<OptionItem[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [form, setForm] = useState(emptyForm())

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [data, opts] = await Promise.all([
        getKorwilList(),
        isAdmin ? getMonevOptions() : Promise.resolve([]),
      ])
      setList(data)
      setMonevOptions(opts)
    } finally { setLoading(false) }
  }, [isAdmin])

  useEffect(() => { load() }, [load])

  const openCreate = () => { setEditingId(null); setForm(emptyForm()); setIsOpen(true) }
  const openEdit = (row: KorwilRow) => {
    setEditingId(row.id)
    setForm({
      nama: row.nama,
      hp: row.hp ?? '',
      email: row.email ?? '',
      monev_id: row.monev_id ? String(row.monev_id) : '',
    })
    setIsOpen(true)
  }
  const closeForm = () => { setIsOpen(false); setEditingId(null); setForm(emptyForm()) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isAdmin && !editingId && !form.monev_id) {
      toast.error('Pilih Monev terlebih dahulu')
      return
    }
    setSubmitting(true)
    const result = editingId
      ? await updateKorwil(editingId, {
          nama: form.nama,
          hp: form.hp || undefined,
          email: form.email || undefined,
          monev_id: form.monev_id ? Number(form.monev_id) : undefined,
        })
      : await createKorwil({
          nama: form.nama,
          hp: form.hp || undefined,
          email: form.email,
          monev_id: Number(form.monev_id),
        })

    if (result.success) {
      toast.success(editingId ? 'Korwil berhasil diupdate' : 'Korwil berhasil ditambahkan')
      closeForm(); load()
    } else {
      toast.error(result.error || 'Terjadi kesalahan')
    }
    setSubmitting(false)
  }

  const handleDelete = async (row: KorwilRow) => {
    if (!confirm(`Hapus Korwil "${row.nama}"? Relawan di bawahnya akan kehilangan Korwil.`)) return
    const result = await deleteKorwil(row.id)
    if (result.success) { toast.success('Korwil dihapus'); load() }
    else toast.error(result.error || 'Gagal menghapus')
  }

  const handleReset = async (row: KorwilRow) => {
    if (!confirm(`Reset password "${row.nama}" ke default?`)) return
    const result = await resetPasswordKorwil(row.id)
    if (result.success) toast.success('Password direset ke DesaBerdaya2025')
    else toast.error(result.error || 'Gagal reset password')
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-[#7a1200]" />
          <h3 className="text-base font-semibold text-slate-800">Daftar Korwil</h3>
          <Badge className="bg-amber-100 text-amber-700">{list.length}</Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button size="sm" onClick={openCreate} style={{ backgroundColor: '#7a1200' }} className="text-white gap-1">
            <Plus className="w-4 h-4" /> Tambah Korwil
          </Button>
        </div>
      </div>

      {isOpen && (
        <Card className="border-[#7a1200]/30 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{editingId ? 'Edit Korwil' : 'Tambah Korwil Baru'}</CardTitle>
              <Button variant="ghost" size="icon" onClick={closeForm}><X className="w-4 h-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label>Nama <span className="text-red-500">*</span></Label>
                  <Input required value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Nama Korwil" />
                </div>
                <div className="space-y-1.5">
                  <Label>No. HP</Label>
                  <Input value={form.hp} onChange={(e) => setForm({ ...form, hp: e.target.value })} placeholder="08xx-xxxx-xxxx" />
                </div>
                <div className="space-y-1.5">
                  <Label>Email Login {!editingId && <span className="text-red-500">*</span>}</Label>
                  <Input type="email" required={!editingId} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="korwil@desaberdaya.id" />
                </div>
                {isAdmin && (
                  <div className="space-y-1.5">
                    <Label>Monev <span className="text-red-500">*</span></Label>
                    <Select value={form.monev_id} onValueChange={(v) => setForm({ ...form, monev_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Pilih Monev" /></SelectTrigger>
                      <SelectContent>
                        {monevOptions.map((m) => (
                          <SelectItem key={m.id} value={String(m.id)}>{m.nama}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              {!editingId && <p className="text-xs text-slate-400">Password default: DesaBerdaya2025</p>}
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

      <Card className="border-0 shadow-sm">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-slate-400 text-sm">Memuat data...</div>
          ) : list.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">Belum ada data Korwil</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="border-b border-slate-200 bg-slate-50">
                  <tr>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500 w-12">No</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">Nama</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">Email</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">HP</th>
                    {isAdmin && <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500">Monev</th>}
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500">Relawan</th>
                    <th className="text-center py-3 px-4 text-xs font-semibold text-slate-500">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((row, i) => (
                    <tr key={row.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-sm text-center text-slate-400">{i + 1}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-amber-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {row.nama.charAt(0).toUpperCase()}
                          </div>
                          <span className="text-sm font-medium text-slate-800">{row.nama}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">{row.email ?? '-'}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{row.hp ?? '-'}</td>
                      {isAdmin && <td className="py-3 px-4 text-sm text-slate-600">{row.monev_nama ?? '-'}</td>}
                      <td className="py-3 px-4 text-center">
                        <Badge className="bg-blue-100 text-blue-700">{row.jumlah_relawan} Relawan</Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 justify-center">
                          <Button size="sm" variant="outline" onClick={() => openEdit(row)} className="h-7 px-2 text-xs">
                            <Edit className="w-3 h-3 mr-1" /> Edit
                          </Button>
                          <Link href={`/dashboard/manajemen-tim/wilayah/korwil/${row.id}`}>
                            <Button size="sm" variant="outline" className="h-7 px-2 text-xs text-emerald-700 border-emerald-200 hover:bg-emerald-50">
                              <MapPin className="w-3 h-3 mr-1" /> Wilayah
                            </Button>
                          </Link>
                          <Button size="sm" variant="outline" onClick={() => handleReset(row)} className="h-7 px-2 text-xs text-amber-600 border-amber-200 hover:bg-amber-50">
                            <KeyRound className="w-3 h-3 mr-1" /> Reset
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(row)} className="h-7 px-2 text-xs">
                            <Trash2 className="w-3 h-3 mr-1" /> Hapus
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
