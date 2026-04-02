'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ChevronLeft, Save } from 'lucide-react'
import { getDesaBerdayaOptions, getRelawanOptions, getProgramOptions, getKategoriProgramOptions, createIntervensiProgram } from '../actions'

export default function TambahIntervensiPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [desaOptions, setDesaOptions] = useState<any[]>([])
  const [relawanOptions, setRelawanOptions] = useState<any[]>([])
  const [programOptions, setProgramOptions] = useState<any[]>([])
  const [kategoriOptions, setKategoriOptions] = useState<any[]>([])
  const [filteredPrograms, setFilteredPrograms] = useState<any[]>([])

  const [formData, setFormData] = useState({
    desa_berdaya_id: 0,
    kategori_program_id: 0,
    program_id: 0,
    relawan_id: 0,
    deskripsi: '',
    sumber_dana: '',
    fundraiser: ''
  })

  useEffect(() => {
    async function init() {
      const [desas, relawans, programs, kategoris] = await Promise.all([
        getDesaBerdayaOptions(),
        getRelawanOptions(),
        getProgramOptions(),
        getKategoriProgramOptions()
      ])
      setDesaOptions(desas)
      setRelawanOptions(relawans)
      setProgramOptions(programs)
      setKategoriOptions(kategoris)
    }
    init()
  }, [])

  // Auto set relawan when desa changes
  useEffect(() => {
    if (formData.desa_berdaya_id && formData.desa_berdaya_id !== 0) {
      const selectedDesa = desaOptions.find(d => String(d.id) === String(formData.desa_berdaya_id))
      if (selectedDesa && selectedDesa.relawan_id) {
        setFormData(prev => ({ ...prev, relawan_id: Number(selectedDesa.relawan_id) }))
      } else {
        setFormData(prev => ({ ...prev, relawan_id: 0 }))
      }
    }
  }, [formData.desa_berdaya_id, desaOptions])

  // Filter programs when category changes
  useEffect(() => {
    if (formData.kategori_program_id && formData.kategori_program_id !== 0) {
      setFilteredPrograms(programOptions.filter(p => Number(p.kategori_id) === Number(formData.kategori_program_id)))
    } else {
      setFilteredPrograms(programOptions)
    }
    // reset program
    setFormData(prev => ({ ...prev, program_id: 0 }))
  }, [formData.kategori_program_id, programOptions])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.desa_berdaya_id || !formData.kategori_program_id || !formData.program_id || !formData.relawan_id) {
      alert("Harap lengkapi field wajib: Desa, Kategori Program, Program, dan Relawan")
      return
    }

    setLoading(true)
    try {
      const res = await createIntervensiProgram(formData)
      if (res.success) {
        import('sonner').then(m => m.toast.success("Intervensi Program berhasil dibuat (DRAFT)"))
        router.push(`/dashboard/intervensi/${res.id}`)
      }
    } catch (err) {
      console.error(err)
      import('sonner').then(m => m.toast.error("Gagal menyimpan data"))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto space-y-6 min-h-screen bg-slate-50/50">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full bg-white shadow-sm border">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800">Intervensi Program / Baru</h1>
          <p className="text-sm font-medium text-slate-500">Isi informasi awal program intervensi</p>
        </div>
      </div>

      <Card className="border-none shadow-xl shadow-slate-200/40 rounded-[2rem] overflow-hidden bg-white">
        <form onSubmit={handleSubmit}>
          <CardHeader className="border-b border-slate-100 bg-slate-50/50 p-6">
            <CardTitle className="text-lg font-bold text-slate-800">Informasi Utama</CardTitle>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Desa Berdaya <span className="text-rose-500">*</span></Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.desa_berdaya_id}
                    onChange={(e) => setFormData(p => ({ ...p, desa_berdaya_id: Number(e.target.value) }))}
                    required
                  >
                    <option value={0}>Pilih Desa</option>
                    {desaOptions.map(d => <option key={d.id} value={d.id}>{d.nama}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Kategori Program <span className="text-rose-500">*</span></Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.kategori_program_id}
                    onChange={(e) => setFormData(p => ({ ...p, kategori_program_id: Number(e.target.value) }))}
                    required
                  >
                    <option value={0}>Pilih Kategori</option>
                    {kategoriOptions.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Program Spesifik <span className="text-rose-500">*</span></Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.program_id}
                    onChange={(e) => setFormData(p => ({ ...p, program_id: Number(e.target.value) }))}
                    disabled={!formData.kategori_program_id}
                    required
                  >
                    <option value={0}>Pilih Program</option>
                    {filteredPrograms.map(p => <option key={p.id} value={p.id}>{p.nama_program}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Relawan PJ <span className="text-rose-500">*</span></Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 cursor-not-allowed"
                    value={formData.relawan_id}
                    onChange={(e) => setFormData(p => ({ ...p, relawan_id: Number(e.target.value) }))}
                    disabled
                    required
                  >
                    <option value={0}>Pilih Relawan</option>
                    {relawanOptions.map(r => <option key={r.id} value={r.id}>{r.nama}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Sumber Dana</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.sumber_dana}
                    onChange={(e) => setFormData(p => ({ ...p, sumber_dana: e.target.value }))}
                  >
                    <option value="">Pilih Sumber Dana</option>
                    <option value="Project">Project</option>
                    <option value="Reguler">Reguler</option>
                    <option value="Zakat">Zakat</option>
                    <option value="Infaq">Infaq</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Fundraiser</Label>
                  <Input 
                    placeholder="Nama Fundraiser"
                    value={formData.fundraiser}
                    onChange={(e) => setFormData(p => ({ ...p, fundraiser: e.target.value }))}
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-4">
              <Label>Deskripsi / Tujuan Intervensi</Label>
              <Textarea 
                placeholder="Jelaskan secara singkat apa tujuan program ini..."
                className="min-h-[100px] rounded-xl"
                value={formData.deskripsi}
                onChange={(e) => setFormData(p => ({ ...p, deskripsi: e.target.value }))}
              />
            </div>
          </CardContent>
          <CardFooter className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()} className="rounded-xl px-6 font-bold text-slate-500">Batal</Button>
            <Button type="submit" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl px-8 font-bold shadow-lg shadow-indigo-600/20 gap-2">
              <Save className="w-4 h-4" />
              {loading ? 'Menyimpan...' : 'Simpan Draft'}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
