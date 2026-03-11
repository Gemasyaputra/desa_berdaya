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
import { Plus, Trash2, Edit, X, Save, RefreshCw, KeyRound, UserCheck, MapPin, Shield } from 'lucide-react'
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
      {/* Header */}
      <div className="flex items-center justify-between bg-white p-6 rounded-[2rem] border border-slate-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center border border-amber-100 shadow-sm shadow-amber-500/5">
            <UserCheck className="w-6 h-6 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 tracking-tight">Daftar Koordinator Wilayah (Korwil)</h3>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Total: <span className="text-amber-600">{list.length}</span> Pengguna Aktif</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
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

      {/* Tabel */}
      <Card className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-[2rem] bg-white overflow-hidden ring-1 ring-slate-100">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center text-slate-400 text-sm font-medium">Memuat data...</div>
          ) : list.length === 0 ? (
            <div className="p-12 text-center bg-slate-50/50 m-6 rounded-3xl border border-dashed border-slate-200">
              <p className="text-slate-400 font-bold italic">Belum ada profil Korwil yang terdaftar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto p-4">
              <table className="w-full">
                <thead className="border-b border-slate-100 bg-slate-50/80">
                  <tr>
                    <th className="text-center py-4 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400 w-16 rounded-tl-2xl">No</th>
                    <th className="text-left py-4 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Identitas</th>
                    <th className="text-left py-4 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Kontak</th>
                    {isAdmin && <th className="text-left py-4 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Atasan (Monev)</th>}
                    <th className="text-center py-4 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Relawan Binaan</th>
                    <th className="text-center py-4 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400 rounded-tr-2xl">Tindakan</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((row, i) => (
                    <tr key={row.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors group">
                      <td className="py-4 px-4 text-sm font-bold text-center text-slate-400">{i + 1}</td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center font-black text-slate-800 group-hover:bg-amber-500 group-hover:border-amber-500 group-hover:text-white transition-colors duration-300 flex-shrink-0">
                            {row.nama.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-sm font-black text-slate-800 block truncate leading-none mb-1">{row.nama}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Koordinator Wilayah</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm font-semibold text-slate-600 mb-0.5">{row.email ?? '-'}</p>
                        <p className="text-[11px] font-medium text-slate-400">{row.hp ?? '-'}</p>
                      </td>
                      {isAdmin && (
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <Shield className="w-3.5 h-3.5 text-rose-600" />
                            <span className="text-sm font-semibold text-slate-700">{row.monev_nama ?? '-'}</span>
                          </div>
                        </td>
                      )}
                      <td className="py-4 px-4 text-center">
                        <Badge className="bg-blue-50 text-blue-700 border-blue-200/50 px-3 py-1 font-bold shadow-none rounded-lg">{row.jumlah_relawan} Orang</Badge>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2 justify-center">
                          <Button size="sm" variant="outline" onClick={() => openEdit(row)} className="h-8 rounded-lg px-3 text-xs font-bold border-slate-200 text-slate-600 hover:bg-slate-100 shadow-sm">
                            <Edit className="w-3.5 h-3.5 mr-1.5" /> Edit
                          </Button>
                          <Link href={`/dashboard/manajemen-tim/wilayah/korwil/${row.id}`}>
                            <Button size="sm" variant="outline" className="h-8 rounded-lg px-3 text-xs font-bold border-emerald-200 text-emerald-700 hover:bg-emerald-50 shadow-sm">
                              <MapPin className="w-3.5 h-3.5 mr-1.5" /> Wilayah
                            </Button>
                          </Link>
                          <Button size="sm" variant="outline" onClick={() => handleReset(row)} className="h-8 rounded-lg px-3 text-xs font-bold border-amber-200 text-amber-600 hover:bg-amber-50 shadow-sm">
                            <KeyRound className="w-3.5 h-3.5 mr-1.5" /> Reset
                          </Button>
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
