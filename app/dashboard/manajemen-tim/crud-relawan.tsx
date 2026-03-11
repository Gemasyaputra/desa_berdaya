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
import { Plus, Trash2, Edit, X, Save, RefreshCw, KeyRound, Users, MapPin, UserCheck } from 'lucide-react'
import { toast } from 'sonner'
import {
  getRelawanList, createRelawan, updateRelawan, deleteRelawan, resetPasswordRelawan,
  getKorwilOptions,
  type RelawanRow, type OptionItem,
} from './actions'
import { KelolaDesaRelawanSheet, GantiRelawanDesaSheet } from './desa-assign-sheet'

function emptyForm() {
  return { nama: '', hp: '', email: '', korwil_id: '' }
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

  const openCreate = () => { setEditingId(null); setForm(emptyForm()); setIsOpen(true) }
  const openEdit = (row: RelawanRow) => {
    setEditingId(row.id)
    setForm({
      nama: row.nama,
      hp: row.hp ?? '',
      email: row.email ?? '',
      korwil_id: row.korwil_id ? String(row.korwil_id) : '',
    })
    setIsOpen(true)
  }
  const closeForm = () => { setIsOpen(false); setEditingId(null); setForm(emptyForm()) }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (canSelectKorwil && !form.korwil_id) {
      toast.error('Pilih Korwil terlebih dahulu')
      return
    }
    setSubmitting(true)
    const result = editingId
      ? await updateRelawan(editingId, {
          nama: form.nama,
          hp: form.hp || undefined,
          email: form.email || undefined,
          korwil_id: canSelectKorwil && form.korwil_id ? Number(form.korwil_id) : undefined,
        })
      : await createRelawan({
          nama: form.nama,
          hp: form.hp || undefined,
          email: form.email,
          korwil_id: Number(form.korwil_id),
        })

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

  const handleReset = async (row: RelawanRow) => {
    if (!confirm(`Reset password "${row.nama}" ke default?`)) return
    const result = await resetPasswordRelawan(row.id)
    if (result.success) toast.success('Password direset ke DesaBerdaya2025')
    else toast.error(result.error || 'Gagal reset password')
  }

  const filteredList = list.filter((row) => {
    if (sortBy === 'tanpa-desa') return row.jumlah_desa === 0
    return true
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
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[140px] h-10 rounded-xl font-bold text-slate-600 shadow-sm border-slate-200 hover:bg-slate-50">
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
        <Card className="border-[#7a1200]/30 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm">{editingId ? 'Edit Relawan' : 'Tambah Relawan Baru'}</CardTitle>
              <Button variant="ghost" size="icon" onClick={closeForm}><X className="w-4 h-4" /></Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <Label>Nama <span className="text-red-500">*</span></Label>
                  <Input required value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })} placeholder="Nama Relawan" />
                </div>
                <div className="space-y-1.5">
                  <Label>No. HP</Label>
                  <Input value={form.hp} onChange={(e) => setForm({ ...form, hp: e.target.value })} placeholder="08xx-xxxx-xxxx" />
                </div>
                <div className="space-y-1.5">
                  <Label>Email Login {!editingId && <span className="text-red-500">*</span>}</Label>
                  <Input type="email" required={!editingId} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="relawan@desaberdaya.id" />
                </div>
                {canSelectKorwil && (
                  <div className="space-y-1.5">
                    <Label>Korwil <span className="text-red-500">*</span></Label>
                    <Select value={form.korwil_id} onValueChange={(v) => setForm({ ...form, korwil_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Pilih Korwil" /></SelectTrigger>
                      <SelectContent>
                        {korwilOptions.map((k) => (
                          <SelectItem key={k.id} value={String(k.id)}>{k.nama}</SelectItem>
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
              <p className="text-slate-400 font-bold italic">Belum ada profil Relawan yang terdaftar.</p>
            </div>
          ) : (
            <div className="overflow-x-auto p-4">
              <table className="w-full">
                <thead className="border-b border-slate-100 bg-slate-50/80">
                  <tr>
                    <th className="text-center py-4 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400 w-16 rounded-tl-2xl">No</th>
                    <th className="text-left py-4 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Identitas</th>
                    <th className="text-left py-4 px-4 text-[11px] font-black uppercase tracking-widest text-slate-400">Kontak</th>
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
                          <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center font-black text-slate-800 group-hover:bg-blue-600 group-hover:border-blue-600 group-hover:text-white transition-colors duration-300 flex-shrink-0">
                            {row.nama.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="text-sm font-black text-slate-800 block truncate leading-none mb-1">{row.nama}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Relawan Berpijak</span>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <p className="text-sm font-semibold text-slate-600 mb-0.5">{row.email ?? '-'}</p>
                        <p className="text-[11px] font-medium text-slate-400">{row.hp ?? '-'}</p>
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
