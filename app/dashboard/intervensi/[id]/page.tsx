'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { ChevronLeft, Save, Plus, X, FileText, CheckCircle2, ListFilter, Briefcase, Trash2, Copy, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { 
  getIntervensiProgramById, 
  updateIntervensiProgram, 
  updateIntervensiStatus, 
  getAnggaranByIntervensi,
  deleteAnggaran,
  getDesaBerdayaOptions,
  getRelawanOptions,
  getProgramOptions,
  getKategoriProgramOptions
} from '../actions'
import { Badge } from '@/components/ui/badge'
import CreateBudgetModal from '@/components/intervensi/CreateBudgetModal'

export default function DetailIntervensiPage() {
  const params = useParams()
  const router = useRouter()
  const idNum = Number(params.id)
  
  const [headerData, setHeaderData] = useState<any>(null)
  const [anggaranData, setAnggaranData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'ANGGARAN'|'KPI'>('ANGGARAN')
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<any>(null)
  const [clipboard, setClipboard] = useState<any>(null)
  const [sortConfig, setSortConfig] = useState<{ key: string; dir: 'asc' | 'desc' } | null>(null)

  // Options
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
    loadAll()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idNum])

  async function loadAll() {
    try {
      setLoading(true)
      const [desas, relawans, programs, kategoris, header, anggaran] = await Promise.all([
        getDesaBerdayaOptions(),
        getRelawanOptions(),
        getProgramOptions(),
        getKategoriProgramOptions(),
        getIntervensiProgramById(idNum),
        getAnggaranByIntervensi(idNum)
      ])
      
      setDesaOptions(desas)
      setRelawanOptions(relawans)
      setProgramOptions(programs)
      setKategoriOptions(kategoris)
      
      if (header) {
        setHeaderData(header)
        setAnggaranData(anggaran)
        
        setFormData({
          desa_berdaya_id: header.desa_berdaya_id || 0,
          kategori_program_id: header.kategori_program_id || 0,
          program_id: header.program_id || 0,
          relawan_id: header.relawan_id || 0,
          deskripsi: header.deskripsi || '',
          sumber_dana: header.sumber_dana || '',
          fundraiser: header.fundraiser || ''
        })
        
        if (header.kategori_program_id > 0) {
          setFilteredPrograms(programs.filter((p: any) => Number(p.kategori_id) === Number(header.kategori_program_id)))
        }
      } else {
        router.push('/dashboard/intervensi')
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  // Auto filter programs when category changes manually
  const handleKategoriChange = (val: number) => {
    setFormData(p => ({ ...p, kategori_program_id: val, program_id: 0 }))
    setFilteredPrograms(programOptions.filter(p => Number(p.kategori_id) === Number(val)))
  }

  const handleUpdateHeader = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.desa_berdaya_id || !formData.kategori_program_id || !formData.program_id || !formData.relawan_id) {
      return
    }
    try {
      const res = await updateIntervensiProgram(idNum, formData)
      if (res.success) {
        import('sonner').then(m => m.toast.success("Perubahan Berhasil Disimpan"))
        loadAll() // Refresh view
      }
    } catch (err) {
      console.error(err)
      import('sonner').then(m => m.toast.error("Gagal menyimpan perubahan"))
    }
  }

  const handleStatusChange = async (status: string) => {
    if (confirm(`Apakah Anda yakin mengubah status menjadi ${status}?`)) {
      try {
        await updateIntervensiStatus(idNum, status)
        import('sonner').then(m => m.toast.success(`Status diubah menjadi ${status}`))
        loadAll()
      } catch (err) {
         import('sonner').then(m => m.toast.error("Gagal mengubah status"))
      }
    }
  }

  const handleDeleteBudget = async (id: number) => {
    if (confirm('Hapus rincian anggaran ini?')) {
      await deleteAnggaran(id)
      const updated = await getAnggaranByIntervensi(idNum)
      setAnggaranData(updated)
    }
  }

  const handleCopyRow = (row: any) => {
    setClipboard(row)
    import('sonner').then(m => m.toast.success(`Anggaran ${row.bulan} ${row.tahun} disalin! Klik 'Paste' untuk menduplikasi.`, {
      action: { label: 'Paste Sekarang', onClick: () => handlePasteRow(row) },
    }))
  }

  const handlePasteRow = (sourceRow?: any) => {
    const source = sourceRow || clipboard
    if (!source) return
    const { id, created_at, updated_at, intervensi_program_id, ...rest } = source
    setEditingBudget({ ...rest, _isCopy: true })
    setIsModalOpen(true)
  }

  const bulanOrder: Record<string, number> = {
    'Januari': 1, 'Februari': 2, 'Maret': 3, 'April': 4, 'Mei': 5, 'Juni': 6,
    'Juli': 7, 'Agustus': 8, 'September': 9, 'Oktober': 10, 'November': 11, 'Desember': 12
  }

  const sortedData = useMemo(() => {
    if (!sortConfig) return anggaranData
    return [...anggaranData].sort((a, b) => {
      let aVal = a[sortConfig.key]
      let bVal = b[sortConfig.key]
      // Special sort for bulan (by calendar order, not alphabetically)
      if (sortConfig.key === 'bulan') {
        aVal = bulanOrder[aVal] ?? 99
        bVal = bulanOrder[bVal] ?? 99
      }
      if (aVal === bVal) return 0
      const cmp = aVal > bVal ? 1 : -1
      return sortConfig.dir === 'asc' ? cmp : -cmp
    })
  }, [anggaranData, sortConfig])

  const handleSort = (key: string) => {
    setSortConfig(prev => {
      if (prev?.key !== key) return { key, dir: 'asc' }
      if (prev.dir === 'asc') return { key, dir: 'desc' }
      return null // third click clears sort
    })
  }

  const SortIcon = ({ colKey }: { colKey: string }) => {
    if (sortConfig?.key !== colKey) return <ArrowUpDown className="w-3 h-3 opacity-30 inline ml-1" />
    return sortConfig.dir === 'asc'
      ? <ArrowUp className="w-3 h-3 text-[#008784] inline ml-1" />
      : <ArrowDown className="w-3 h-3 text-[#008784] inline ml-1" />
  }

  if (loading) return <div className="p-8 text-center text-slate-500">Memuat detail intervensi...</div>
  if (!headerData) return null

  const isLocked = headerData.status !== 'DRAFT'

  return (
    <div className="min-h-screen bg-slate-50/50 pb-20">
      {/* Top Fixed Control Bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-slate-200 shadow-sm px-4 lg:px-8 py-4 flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => router.push('/dashboard/intervensi')} className="rounded-full bg-slate-100 hover:bg-slate-200">
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 hidden sm:block">Intervensi Program / {headerData.id}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3 ml-auto">
          {/* Status Tracker UI like Odoo */}
          <div className="hidden md:flex items-center text-[10px] font-bold tracking-widest uppercase mr-4">
            <div className={`px-4 py-2 ${headerData.status === 'DRAFT' ? 'bg-[#5b3256] text-white rounded-l-xl' : 'bg-slate-100 text-slate-400 rounded-l-xl border-r border-white'}`}>
              DRAFT
            </div>
            <div className={`px-4 py-2 ${headerData.status === 'APPROVED' ? 'bg-[#5b3256] text-white' : 'bg-slate-100 text-slate-400 border-x border-white'}`}>
              APPROVE
            </div>
            <div className={`px-4 py-2 ${headerData.status === 'CANCELLED' ? 'bg-rose-600 text-white rounded-r-xl' : 'bg-slate-100 text-slate-400 rounded-r-xl border-l border-white'}`}>
              CANCEL
            </div>
          </div>

          {!isLocked && (
            <>
              <Button onClick={(e) => handleUpdateHeader(e as any)} variant="outline" className="border-[#008784] text-[#008784] hover:bg-[#008784]/10 rounded-xl font-bold shadow-sm">
                <Save className="w-4 h-4 mr-2" />
                SAVE
              </Button>
              <Button onClick={() => handleStatusChange('APPROVED')} className="bg-[#008784] hover:bg-[#006e6b] text-white rounded-xl font-bold shadow-md shadow-[#008784]/20">
                APPROVE
              </Button>
            </>
          )}
          {headerData.status === 'DRAFT' && (
             <Button onClick={() => handleStatusChange('CANCELLED')} variant="outline" className="text-slate-500 rounded-xl font-bold border-slate-200">
               CANCEL
             </Button>
          )}
          {headerData.status !== 'DRAFT' && (
             <Button onClick={() => handleStatusChange('DRAFT')} variant="outline" className="text-slate-500 rounded-xl font-bold border-slate-200">
               SET TO DRAFT
             </Button>
          )}
        </div>
      </div>

      <div className="p-4 lg:p-8 max-w-6xl mx-auto space-y-6">
        {/* Header Form Card */}
        <Card className="border border-slate-200 shadow-md shadow-slate-200/50 overflow-hidden bg-white">
          <form onSubmit={handleUpdateHeader}>
            <CardContent className="p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-16">
                
                {/* Left Column */}
                <div className="space-y-4">
                  <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                    <Label className="text-right text-slate-500 font-bold text-xs uppercase">Desa</Label>
                    <select 
                      className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:border-slate-400 disabled:bg-slate-50 disabled:text-slate-500 font-semibold"
                      value={formData.desa_berdaya_id}
                      onChange={(e) => setFormData(p => ({ ...p, desa_berdaya_id: Number(e.target.value) }))}
                      disabled={isLocked}
                      required
                    >
                      <option value={0}>Pilih Desa</option>
                      {desaOptions.map(d => <option key={d.id} value={d.id}>{d.nama}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                    <Label className="text-right text-slate-500 font-bold text-xs uppercase">Kategori Program</Label>
                    <select 
                      className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm disabled:bg-slate-50 disabled:text-slate-500 font-semibold"
                      value={formData.kategori_program_id}
                      onChange={(e) => handleKategoriChange(Number(e.target.value))}
                      disabled={isLocked}
                      required
                    >
                      <option value={0}>Pilih Kategori</option>
                      {kategoriOptions.map(k => <option key={k.id} value={k.id}>{k.nama}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                    <Label className="text-right text-slate-500 font-bold text-xs uppercase">Program</Label>
                    <select 
                      className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm disabled:bg-slate-50 border-b-2 border-b-indigo-500 focus-visible:outline-none font-semibold text-indigo-900"
                      value={formData.program_id}
                      onChange={(e) => setFormData(p => ({ ...p, program_id: Number(e.target.value) }))}
                      disabled={isLocked || !formData.kategori_program_id}
                      required
                    >
                      <option value={0}>Pilih Program</option>
                      {filteredPrograms.map(p => <option key={p.id} value={p.id}>{p.nama_program}</option>)}
                    </select>
                  </div>
                  <div className="grid grid-cols-[140px_1fr] items-start gap-4">
                    <Label className="text-right mt-3 text-slate-500 font-bold text-xs uppercase">Deskripsi</Label>
                    <Textarea 
                      className="min-h-[80px] rounded-md disabled:bg-slate-50 border-slate-200 focus-visible:outline-none font-medium text-slate-700"
                      value={formData.deskripsi}
                      onChange={(e) => setFormData(p => ({ ...p, deskripsi: e.target.value }))}
                      disabled={isLocked}
                    />
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                    <Label className="text-right text-slate-500 font-bold text-xs uppercase">Sumber Dana</Label>
                    <select 
                      className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:border-slate-400 disabled:bg-slate-50 disabled:text-slate-500 font-semibold"
                      value={formData.sumber_dana}
                      onChange={(e) => setFormData(p => ({ ...p, sumber_dana: e.target.value }))}
                      disabled={isLocked}
                    >
                      <option value="">Pilih Sumber Dana</option>
                      <option value="Project">Project</option>
                      <option value="Reguler">Reguler</option>
                      <option value="Zakat">Zakat</option>
                      <option value="Infaq">Infaq</option>
                    </select>
                  </div>
                  <div className="grid grid-cols-[140px_1fr] items-center gap-4">
                    <Label className="text-right text-slate-500 font-bold text-xs uppercase">Fundraiser</Label>
                    <Input 
                      className="disabled:bg-slate-50 border-slate-200 font-semibold"
                      value={formData.fundraiser}
                      onChange={(e) => setFormData(p => ({ ...p, fundraiser: e.target.value }))}
                      disabled={isLocked}
                    />
                  </div>
                  <div className="grid grid-cols-[140px_1fr] items-center gap-4 pt-4">
                    <Label className="text-right text-slate-500 font-bold text-xs uppercase">Relawan</Label>
                    <select 
                      className="h-10 w-full rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-500 cursor-not-allowed font-semibold"
                      value={formData.relawan_id}
                      onChange={(e) => setFormData(p => ({ ...p, relawan_id: Number(e.target.value) }))}
                      disabled
                      required
                    >
                      <option value={0}>Pilih Relawan</option>
                      {relawanOptions.map(r => <option key={r.id} value={r.id}>{r.nama}</option>)}
                    </select>
                  </div>
                </div>

              </div>
            </CardContent>
          </form>
        </Card>

        {/* Tab Sub-menu Area */}
        <div className="bg-white border border-slate-200 shadow-sm rounded-[1rem] overflow-hidden min-h-[300px]">
          <div className="flex border-b border-slate-200">
            <button 
              className={`px-6 py-3 text-xs font-bold uppercase transition-colors ${activeTab === 'ANGGARAN' ? 'border-b-2 border-[#008784] text-[#008784] bg-slate-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
              onClick={() => setActiveTab('ANGGARAN')}
            >
              Anggaran
            </button>
            <button 
              className={`px-6 py-3 text-xs font-bold uppercase transition-colors ${activeTab === 'KPI' ? 'border-b-2 border-[#008784] text-[#008784] bg-slate-50/50' : 'text-slate-500 hover:bg-slate-50'}`}
              onClick={() => setActiveTab('KPI')}
            >
              KPI
            </button>
          </div>
          
          <div className="p-0 overflow-x-auto">
            {activeTab === 'ANGGARAN' ? (
              <div className="min-w-[1000px]">
                <table className="w-full text-sm text-left align-middle border-collapse">
                  <thead className="bg-[#f8fafc] text-[10px] uppercase font-bold text-slate-500 tracking-wide border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3 w-16">
                        <button onClick={() => handleSort('tahun')} className="flex items-center gap-0.5 hover:text-slate-800 transition-colors">
                          Tahun <SortIcon colKey="tahun" />
                        </button>
                      </th>
                      <th className="px-4 py-3 w-28">
                        <button onClick={() => handleSort('bulan')} className="flex items-center gap-0.5 hover:text-slate-800 transition-colors">
                          Bulan <SortIcon colKey="bulan" />
                        </button>
                      </th>
                      <th className="px-4 py-3 w-32 text-right">
                        <button onClick={() => handleSort('ajuan_ri')} className="flex items-center gap-0.5 hover:text-slate-800 transition-colors ml-auto">
                          Ajuan RI <SortIcon colKey="ajuan_ri" />
                        </button>
                      </th>
                      <th className="px-4 py-3 w-32 text-right">
                        <button onClick={() => handleSort('anggaran_disetujui')} className="flex items-center gap-0.5 hover:text-slate-800 transition-colors ml-auto">
                          Agg. Disetujui <SortIcon colKey="anggaran_disetujui" />
                        </button>
                      </th>
                      <th className="px-4 py-3 w-32 text-right">
                        <button onClick={() => handleSort('anggaran_dicairkan')} className="flex items-center gap-0.5 hover:text-slate-800 transition-colors ml-auto">
                          Agg. Dicairkan <SortIcon colKey="anggaran_dicairkan" />
                        </button>
                      </th>
                      <th className="px-4 py-3 w-32">
                        <button onClick={() => handleSort('status_pencairan')} className="flex items-center gap-0.5 hover:text-slate-800 transition-colors">
                          Status <SortIcon colKey="status_pencairan" />
                        </button>
                      </th>
                      <th className="px-4 py-3 min-w-[120px]">Catatan</th>
                      <th className="px-2 py-3 w-16 text-center">Is DBF</th>
                      <th className="px-2 py-3 w-16 text-center">Is RZ</th>
                      <th className="px-2 py-3 w-12 text-center"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {sortedData.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50 group transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-700">{row.tahun}</td>
                        <td className="px-4 py-3 font-medium text-slate-600">{row.bulan}</td>
                        <td className="px-4 py-3 text-right tabular-nums">{new Intl.NumberFormat('id-ID').format(row.ajuan_ri)}</td>
                        <td className="px-4 py-3 text-right tabular-nums font-bold text-slate-800">{new Intl.NumberFormat('id-ID').format(row.anggaran_disetujui)}</td>
                        <td className="px-4 py-3 text-right tabular-nums text-emerald-600 font-bold">{new Intl.NumberFormat('id-ID').format(row.anggaran_dicairkan)}</td>
                        <td className="px-4 py-3 font-medium text-slate-500">{row.status_pencairan}</td>
                        <td className="px-4 py-3 text-xs text-slate-500 truncate" title={row.catatan}>{row.catatan || '-'}</td>
                        <td className="px-2 py-3 text-center">{row.is_dbf ? <CheckCircle2 className="w-4 h-4 text-slate-400 mx-auto" /> : ''}</td>
                        <td className="px-2 py-3 text-center">{row.is_rz ? <CheckCircle2 className="w-4 h-4 text-slate-400 mx-auto" /> : ''}</td>
                        <td className="px-2 py-3 text-center">
                          {!isLocked ? (
                            <div className="flex justify-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button 
                                onClick={() => { setEditingBudget(row); setIsModalOpen(true); }}
                                className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded text-xs font-semibold"
                                title="Edit"
                              >
                                Edit
                              </button>
                              <button 
                                onClick={() => handleCopyRow(row)}
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded"
                                title="Copy baris ini"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => handleDeleteBudget(row.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded text-xs font-semibold"
                                title="Hapus"
                              >
                                Del
                              </button>
                            </div>
                          ) : null}
                        </td>
                      </tr>
                    ))}
                    {!isLocked && (
                      <tr>
                        <td colSpan={10} className="p-0">
                          <div className="flex items-center border-t border-slate-100">
                            <button 
                              className="flex-1 text-left px-4 py-3 text-[13px] font-bold text-[#008784] hover:bg-slate-50 flex items-center gap-2 transition-colors"
                              onClick={() => { setEditingBudget(null); setIsModalOpen(true); }}
                            >
                              <Plus className="w-4 h-4" /> Tambah Anggaran
                            </button>
                            {clipboard && (
                              <button
                                className="flex items-center gap-1.5 px-4 py-2 mr-2 text-[12px] font-bold text-amber-600 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors border border-amber-200 mr-4"
                                onClick={() => handlePasteRow()}
                                title={`Paste salinan dari ${clipboard.bulan} ${clipboard.tahun}`}
                              >
                                <Copy className="w-3.5 h-3.5" />
                                Paste: {clipboard.bulan} {clipboard.tahun}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 flex flex-col items-center gap-4">
                <ListFilter className="w-12 h-12 text-slate-200" />
                <p className="font-medium text-sm">Key Performance Indicators akan diimplementasikan pada fase berikutnya.</p>
              </div>
            )}
          </div>
        </div>

      </div>

      {isModalOpen && (
        <CreateBudgetModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSaved={async () => {
             const updated = await getAnggaranByIntervensi(idNum)
             setAnggaranData(updated)
          }}
          headerData={headerData}
          editData={editingBudget}
        />
      )}
    </div>
  )
}
