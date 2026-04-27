'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  FileSpreadsheet, Download, Upload, ChevronRight, ChevronLeft,
  CheckCircle2, AlertCircle, X, Loader2, Table2, Filter, Check
} from 'lucide-react'
import {
  getDesaBerdayaOptions,
  getProgramOptions,
  getKategoriProgramOptions,
  importIntervensiProgramUniversal
} from '@/app/dashboard/intervensi/actions'
import { cn } from '@/lib/utils'

interface ImportExcelModalProps {
  isOpen: boolean
  onClose: () => void
  onImported: () => void
}

const BULAN_OPTIONS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

const STATUS_OPTIONS = ['Dialokasikan', 'Pending', 'Dicairkan', 'Dikembalikan', 'Batal']
const SUMBER_DANA_OPTIONS = ['Project', 'Reguler', 'Zakat', 'Infaq']

// Row 8 (0-indexed: 7) = data start row in template
const DATA_START_ROW = 8

export default function ImportExcelModal({ isOpen, onClose, onImported }: ImportExcelModalProps) {
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [importing, setImporting] = useState(false)

  // Options data
  const [desaOptions, setDesaOptions] = useState<any[]>([])
  const [programOptions, setProgramOptions] = useState<any[]>([])
  const [kategoriOptions, setKategoriOptions] = useState<any[]>([])

  // Step 1: Desa
  const [selectedDesaId, setSelectedDesaId] = useState('')
  const selectedDesa = desaOptions.find(d => String(d.id) === selectedDesaId)

  // Step 2: Program
  const [selectedKategoriId, setSelectedKategoriId] = useState('')
  const [selectedProgramId, setSelectedProgramId] = useState('')
  const [selectedSumberDana, setSelectedSumberDana] = useState('')
  const [selectedFundraiser, setSelectedFundraiser] = useState('')
  
  // For Banyak Desa mode
  const [targetBulanIds, setTargetBulanIds] = useState<Set<string>>(new Set([BULAN_OPTIONS[new Date().getMonth()]]))
  const [selectedTahun, setSelectedTahun] = useState(new Date().getFullYear().toString())
  const [targetDesaMode, setTargetDesaMode] = useState<'semua' | 'pilih'>('semua')
  const [targetDesaIds, setTargetDesaIds] = useState<Set<number>>(new Set())
  const [desaSearchQuery, setDesaSearchQuery] = useState('')

  const filteredPrograms = programOptions.filter(p => String(p.kategori_id) === selectedKategoriId)
  const selectedProgram = programOptions.find(p => String(p.id) === selectedProgramId)
  const selectedKategori = kategoriOptions.find(k => String(k.id) === selectedKategoriId)

  const searchedDesas = desaOptions.filter(d => 
    d.nama.toLowerCase().includes(desaSearchQuery.toLowerCase()) || 
    (d.relawan_nama && d.relawan_nama.toLowerCase().includes(desaSearchQuery.toLowerCase()))
  )

  const activeTargetDesas = targetDesaMode === 'semua' 
    ? desaOptions 
    : desaOptions.filter(d => targetDesaIds.has(d.id))

  // Step 3: Upload
  const [uploadError, setUploadError] = useState('')
  const [parsedMeta, setParsedMeta] = useState<any>(null)
  const [previewRows, setPreviewRows] = useState<any[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      setLoading(true)
      Promise.all([getDesaBerdayaOptions(), getProgramOptions(), getKategoriProgramOptions()])
        .then(([d, p, k]) => {
          setDesaOptions(d)
          setProgramOptions(p)
          setKategoriOptions(k)
        })
        .finally(() => setLoading(false))
      // Reset state on open
      setStep(1)
      setSelectedDesaId('')
      setSelectedKategoriId('')
      setSelectedProgramId('')
      setSelectedSumberDana('')
      setSelectedFundraiser('')
      setUploadError('')
      setParsedMeta(null)
      setPreviewRows([])
      setTargetDesaMode('semua')
      setTargetDesaIds(new Set())
      setDesaSearchQuery('')
    }
  }, [isOpen])

  // ── TEMPLATE DOWNLOAD ──────────────────────────────────────────────
  const handleDownloadTemplate = async () => {
    if (!selectedProgram || !selectedKategori || targetBulanIds.size === 0 || !selectedTahun) return

    const XLSX = await import('xlsx')
    const tahun = Number(selectedTahun)
    let wsData: any[][] = []

    wsData = [
      ['⚠ JANGAN UBAH BARIS 1-2. Isi data mulai baris 3 ke bawah.'],
      [
        'kategori_program_id', 'program_id', 'desa_berdaya_id', 'relawan_id',
        'nama_program', 'nama_desa', 'nama_relawan',
        'tahun', 'bulan', 'sumber_dana', 'fundraiser', 'deskripsi',
        'ajuan_ri', 'anggaran_disetujui', 'anggaran_dicairkan', 'status_pencairan',
        'id_stp', 'catatan', 'is_dbf', 'is_rz'
      ],
      ...activeTargetDesas.flatMap(d => Array.from(targetBulanIds).map(b => [
        Number(selectedKategoriId), selectedProgram?.id, d.id, d.relawan_id,
        selectedProgram?.nama_program, d.nama, d.relawan_nama || '',
        tahun, b, '', '', '',
        0, 0, 0, 'Dialokasikan',
        '', '', 'FALSE', 'FALSE'
      ]))
    ]

    const ws = XLSX.utils.aoa_to_sheet(wsData)

    ws['!cols'] = [
      { wch: 10 }, { wch: 10 }, { wch: 10 }, { wch: 10 },
      { wch: 20 }, { wch: 25 }, { wch: 20 },
      { wch: 10 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 25 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
      { wch: 20 }, { wch: 10 }, { wch: 10 }, { wch: 10 }
    ]
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 19 } }]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Intervensi Import')

    const safeName = `BanyakDesa_${selectedProgram?.nama_program}_${Array.from(targetBulanIds).join('-')}`.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 40)
    
    XLSX.writeFile(wb, `template_intervensi_${safeName}.xlsx`)
  }

  // ── FILE PARSING ───────────────────────────────────────────────────
  const parseFile = async (file: File) => {
    setUploadError('')
    setParsedMeta(null)
    setPreviewRows([])

    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      setUploadError('File harus berformat .xlsx atau .xls')
      return
    }

    try {
      const XLSX = await import('xlsx')
      const arrayBuffer = await file.arrayBuffer()
      const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const aoa = XLSX.utils.sheet_to_json<any[]>(sheet, { header: 1, defval: '' })

      // Unified parse for ALL modes because format is now exactly the same
      const dataRows: any[] = []
      let parsedKategoriId = 0
      let parsedProgramId = 0
      let parsedTahun = 0
      let parsedBulan = ''
      let parsedNamaProgram = ''
      let parsedNamaDesa = ''
      
      for (let i = 2; i < aoa.length; i++) {
        const r = aoa[i]
        if (!r || !r[0]) continue
        const kId = Number(r[0])
        const pId = Number(r[1])
        const dId = Number(r[2])
        if (!kId || !pId || !dId) continue

        if (!parsedKategoriId) parsedKategoriId = kId
        if (!parsedProgramId) parsedProgramId = pId
        if (!parsedNamaProgram) parsedNamaProgram = String(r[4] || '')
        if (!parsedTahun) parsedTahun = Number(r[7])
        if (!parsedBulan) parsedBulan = String(r[8] || '')
        if (!parsedNamaDesa) parsedNamaDesa = String(r[5] || '')

        dataRows.push({
          kategori_program_id: kId,
          program_id: pId,
          desa_berdaya_id: dId,
          relawan_id: Number(r[3]) || 0,
          namaDesa: String(r[5] || ''),
          namaRelawan: String(r[6] || ''),
          tahun: Number(r[7]),
          bulan: String(r[8] || ''),
          sumber_dana: String(r[9] || ''),
          fundraiser: String(r[10] || ''),
          deskripsi: String(r[11] || ''),
          ajuan_ri: Number(r[12]) || 0,
          anggaran_disetujui: Number(r[13]) || 0,
          anggaran_dicairkan: Number(r[14]) || 0,
          status_pencairan: String(r[15] || 'Dialokasikan').trim(),
          id_stp: String(r[16] || '').trim(),
          catatan: String(r[17] || '').trim(),
          is_dbf: String(r[18]).toUpperCase() === 'TRUE',
          is_rz: String(r[19]).toUpperCase() === 'TRUE',
        })
      }

      if (dataRows.length === 0) {
        setUploadError('Tidak ada baris data yang valid ditemukan (mulai baris 3). Pastikan kolom ID diisi.')
        return
      }

      setParsedMeta({
        mode: 'banyak-desa',
        kategoriId: parsedKategoriId,
        programId: parsedProgramId,
        tahun: parsedTahun,
        bulan: parsedBulan,
        namaProgram: parsedNamaProgram,
        namaDesa: parsedNamaDesa
      })

      setPreviewRows(dataRows)

    } catch (err) {
      setUploadError('Gagal membaca file. Pastikan format file valid.')
      console.error(err)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) parseFile(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) parseFile(file)
  }

  // ── IMPORT ─────────────────────────────────────────────────────────
  const handleImport = async () => {
    if (!parsedMeta || previewRows.length === 0) return
    setImporting(true)
    try {
      const res = await importIntervensiProgramUniversal(previewRows)

      if (res.success) {
        const { toast } = await import('sonner')
        toast.success(`Import berhasil! ${res.inserted} baris anggaran ditambahkan.`)
        onImported()
        onClose()
      }
    } catch (err: any) {
      const { toast } = await import('sonner')
      toast.error(err.message || 'Import gagal')
    } finally {
      setImporting(false)
    }
  }

  // ── RENDER ─────────────────────────────────────────────────────────
  const fmt = (n: number) => new Intl.NumberFormat('id-ID').format(n)

  const canGoStep2 = !!selectedProgramId
  const canGoStep3 = !!selectedTahun && targetBulanIds.size > 0 && (targetDesaMode === 'semua' || targetDesaIds.size > 0)
  const canImport = !!parsedMeta && previewRows.length > 0

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-3xl bg-white max-h-[90vh] overflow-y-auto w-[95%] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#7a1200]/10 border border-[#7a1200]/20 rounded-xl flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-[#7a1200]" />
            </div>
            Import dari Excel
          </DialogTitle>
          <DialogDescription>
            Import data Intervensi Program baru beserta anggaran bulanannya dari file Excel.
          </DialogDescription>
        </DialogHeader>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mt-4 mb-4">
          {[
            { n: 1, label: 'Pilih Program' },
            { n: 2, label: 'Pilih Waktu' },
            { n: 3, label: 'Upload & Import' },
          ].map((s, i) => (
            <React.Fragment key={s.n}>
              <div className={`flex items-center gap-2 text-sm font-bold px-3 py-1.5 rounded-full transition-colors ${
                step === s.n ? 'bg-[#7a1200] text-white' :
                step > s.n ? 'bg-[#7a1200]/10 text-[#7a1200]' : 'bg-slate-100 text-slate-400'
              }`}>
                {step > s.n ? <CheckCircle2 className="w-4 h-4" /> : <span className="text-xs w-4 text-center">{s.n}</span>}
                <span className="text-xs">{s.label}</span>
              </div>
              {i < 2 && <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />}
            </React.Fragment>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-slate-400 gap-3">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm font-medium">Memuat data...</span>
          </div>
        ) : (
          <div className="space-y-6">

            {/* ── STEP 1: PILIH DESA / PROGRAM ─────────────────────── */}
            {step === 1 && (
              <div className="space-y-5">
                <div className="bg-[#7a1200]/5 border border-[#7a1200]/15 rounded-xl p-4 text-sm text-[#7a1200] font-medium flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  Pilih Program yang akan didistribusikan ke banyak desa sekaligus.
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Kategori Program <span className="text-rose-500">*</span></Label>
                    <select
                      className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#7a1200]/40 cursor-pointer shadow-sm"
                      value={selectedKategoriId}
                      onChange={e => { setSelectedKategoriId(e.target.value); setSelectedProgramId('') }}
                    >
                      <option value="">— Pilih Kategori —</option>
                      {kategoriOptions.map(k => (
                        <option key={k.id} value={k.id}>{k.nama}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Program <span className="text-rose-500">*</span></Label>
                    <select
                      className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#7a1200] focus:outline-none focus:ring-2 focus:ring-[#7a1200]/40 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                      value={selectedProgramId}
                      onChange={e => setSelectedProgramId(e.target.value)}
                      disabled={!selectedKategoriId}
                    >
                      <option value="">— Pilih Program —</option>
                      {filteredPrograms.map(p => (
                        <option key={p.id} value={p.id}>{p.nama_program}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#7a1200] flex-shrink-0" />
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Program terpilih:</span>
                    <span className="ml-2 font-bold text-[#7a1200]">{selectedProgram?.nama_program}</span>
                  </div>
                </div>

                <div className="space-y-3 border border-slate-100 bg-white rounded-xl p-4">
                  <Label className="font-bold text-slate-700">Pilihan Desa Binaan <span className="text-rose-500">*</span></Label>
                  
                  {/* Mode Toggle Pills */}
                  <div className="flex gap-2 bg-slate-50 p-1.5 rounded-xl w-fit border border-slate-100">
                    <button
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
                        targetDesaMode === 'semua'
                          ? "bg-white text-[#7a1200] shadow-sm ring-1 ring-slate-200"
                          : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
                      )}
                      onClick={() => setTargetDesaMode('semua')}
                    >
                      <CheckCircle2 className={cn("w-4 h-4", targetDesaMode === 'semua' ? "text-[#7a1200]" : "text-transparent")} />
                      Semua Desa ({desaOptions.length})
                    </button>
                    <button
                      className={cn(
                        "px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center gap-2",
                        targetDesaMode === 'pilih'
                          ? "bg-white text-orange-600 shadow-sm ring-1 ring-orange-200"
                          : "text-slate-500 hover:text-slate-700 hover:bg-slate-100/50"
                      )}
                      onClick={() => setTargetDesaMode('pilih')}
                    >
                      Pilih Desa Tertentu
                      {targetDesaMode === 'pilih' && targetDesaIds.size > 0 && (
                        <Badge className="ml-1 bg-orange-100 text-orange-700 border-none px-1.5 py-0 h-5 font-bold text-xs">{targetDesaIds.size}</Badge>
                      )}
                    </button>
                  </div>

                  {targetDesaMode === 'pilih' && (
                    <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm flex flex-col h-72">
                      <div className="p-2 border-b border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
                        <div className="relative flex-1">
                          <Filter className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input 
                            type="text" 
                            placeholder="Cari desa atau relawan..." 
                            value={desaSearchQuery}
                            onChange={(e) => setDesaSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#7a1200]/40"
                          />
                        </div>
                        <div className="flex items-center gap-2 text-xs shrink-0">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-9 px-3 rounded-lg border-slate-200 text-slate-600 hover:text-[#7a1200] hover:bg-[#7a1200]/10 font-bold"
                            onClick={() => setTargetDesaIds(new Set(desaOptions.map(d => d.id)))}
                          >
                            Pilih Semua
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-9 px-3 rounded-lg text-rose-500 hover:text-rose-600 hover:bg-rose-50 font-bold"
                            onClick={() => setTargetDesaIds(new Set())}
                          >
                            Reset
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto p-2 space-y-1 relative">
                        {searchedDesas.length === 0 ? (
                          <div className="text-center py-8 text-slate-400 text-sm font-medium">Desa tidak ditemukan</div>
                        ) : (
                          searchedDesas.map(d => {
                            const isSelected = targetDesaIds.has(d.id);
                            return (
                              <div 
                                key={d.id} 
                                onClick={() => {
                                  const newSet = new Set(targetDesaIds)
                                  if (isSelected) newSet.delete(d.id)
                                  else newSet.add(d.id)
                                  setTargetDesaIds(newSet)
                                }}
                                className={cn(
                                  "flex items-center justify-between p-2.5 rounded-lg cursor-pointer border transition-colors",
                                  isSelected 
                                    ? "bg-[#7a1200]/5 border-[#7a1200]/30" 
                                    : "bg-white border-transparent hover:bg-slate-50 hover:border-slate-200"
                                )}
                              >
                                <div>
                                  <div className={cn("text-sm font-bold", isSelected ? "text-[#7a1200]" : "text-slate-700")}>{d.nama}</div>
                                  <div className="text-xs text-slate-400 font-medium">{d.relawan_nama || 'Tanpa Relawan'}</div>
                                </div>
                                <div className={cn(
                                  "w-5 h-5 rounded-md border flex items-center justify-center transition-colors shrink-0",
                                  isSelected ? "bg-[#7a1200] border-[#7a1200]" : "border-slate-300 bg-white"
                                )}>
                                  {isSelected && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                                </div>
                              </div>
                            )
                          })
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Tahun <span className="text-rose-500">*</span></Label>
                    <select
                      className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#7a1200]/40 cursor-pointer shadow-sm"
                      value={selectedTahun}
                      onChange={e => setSelectedTahun(e.target.value)}
                    >
                      {Array.from({ length: 5 }).map((_, i) => {
                        const year = new Date().getFullYear() - 1 + i
                        return <option key={year} value={year}>{year}</option>
                      })}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700 flex justify-between items-center">
                      <span>Bulan <span className="text-rose-500">*</span></span>
                      {targetBulanIds.size > 0 && <Badge className="bg-[#7a1200]/10 text-[#7a1200] border-none px-1.5 py-0 h-5 text-xs">{targetBulanIds.size} dipilih</Badge>}
                    </Label>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {BULAN_OPTIONS.map(b => (
                        <div 
                          key={b}
                          onClick={() => {
                            const newSet = new Set(targetBulanIds)
                            if (newSet.has(b)) newSet.delete(b)
                            else newSet.add(b)
                            setTargetBulanIds(newSet)
                          }}
                          className={cn(
                            "flex items-center justify-center py-2 px-1 text-xs font-bold rounded-lg border cursor-pointer transition-colors text-center",
                            targetBulanIds.has(b)
                              ? "bg-[#7a1200]/5 border-[#7a1200]/30 text-[#7a1200]"
                              : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:bg-slate-50"
                          )}
                        >
                          {b.substring(0, 3)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3: DOWNLOAD TEMPLATE & UPLOAD ────── */}
            {step === 3 && (
              <div className="space-y-5">
                <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Program:</span>
                    <span className="font-bold text-[#7a1200]">{selectedProgram?.nama_program}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Target Desa:</span>
                    <span className="font-bold text-slate-800">{activeTargetDesas.length} Desa</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Waktu:</span>
                    <span className="font-bold text-slate-800">{targetBulanIds.size} Bulan, {selectedTahun}</span>
                  </div>
                </div>

                {/* 1. Download template */}
                <div className="border border-dashed border-[#7a1200]/25 bg-[#7a1200]/5 rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#7a1200]/15 text-[#7a1200] font-black text-xs flex items-center justify-center flex-shrink-0">1</div>
                    <h4 className="font-bold text-slate-800 text-sm">Download Template Excel</h4>
                  </div>
                  <p className="text-xs text-slate-500 ml-9">
                    Template sudah berisi format yang tepat. Isi kolom data untuk setiap desa yang dituju.
                  </p>
                  <div className="ml-9">
                    <Button
                      onClick={handleDownloadTemplate}
                      variant="outline"
                      className="border-[#7a1200]/40 text-[#7a1200] hover:bg-[#7a1200]/5 font-bold rounded-xl gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download Template .xlsx
                    </Button>
                  </div>
                </div>

                {/* 2. Upload file */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#7a1200]/10 text-[#7a1200] font-black text-xs flex items-center justify-center flex-shrink-0">2</div>
                    <h4 className="font-bold text-slate-800 text-sm">Upload File yang Sudah Diisi</h4>
                  </div>
                  <div
                    className={`ml-9 border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                      isDragging ? 'border-[#7a1200] bg-[#7a1200]/5' : 'border-slate-200 hover:border-[#7a1200]/40 hover:bg-slate-50'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                  >
                    <Upload className={`w-8 h-8 mx-auto mb-3 transition-colors ${isDragging ? 'text-[#7a1200]' : 'text-slate-300'}`} />
                    <p className="text-sm font-semibold text-slate-600">Drag & drop file di sini, atau <span className="text-[#7a1200] underline">browse</span></p>
                    <p className="text-xs text-slate-400 mt-1">Format: .xlsx atau .xls</p>
                    <input ref={fileInputRef} type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
                  </div>

                  {uploadError && (
                    <div className="ml-9 flex items-start gap-2 text-rose-600 bg-rose-50 border border-rose-100 rounded-xl p-3">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span className="text-sm font-medium">{uploadError}</span>
                    </div>
                  )}
                </div>

                {/* 3. Preview */}
                {parsedMeta && previewRows.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-slate-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0">3</div>
                      <h4 className="font-bold text-slate-800 text-sm">Preview Data</h4>
                      <Badge className="bg-[#7a1200]/10 text-[#7a1200] font-bold text-xs border-none">{previewRows.length} baris</Badge>
                    </div>

                    {/* Header meta preview */}
                    <div className="ml-9 bg-[#7a1200]/5 border border-[#7a1200]/15 rounded-xl p-3 text-xs space-y-1">
                      <div className="text-[#7a1200] font-bold uppercase tracking-wider text-[10px] mb-1.5">Header Intervensi</div>
                      <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-slate-600">
                        <span><b className="text-slate-500">Program:</b> {parsedMeta.namaProgram}</span>
                        <span><b className="text-slate-500">Bulan/Tahun:</b> {parsedMeta.bulan} {parsedMeta.tahun}</span>
                      </div>
                    </div>

                    {/* Rows preview table */}
                    <div className="ml-9 border border-slate-200 rounded-xl overflow-hidden">
                      <div className="overflow-x-auto max-h-52">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider sticky top-0">
                            <tr>
                                <th className="px-3 py-2">Desa Tujuan</th>
                              <th className="px-3 py-2 text-right">Ajuan RI</th>
                              <th className="px-3 py-2 text-right">Disetujui</th>
                              <th className="px-3 py-2 text-right">Dicairkan</th>
                              <th className="px-3 py-2">Status</th>
                              <th className="px-3 py-2">Catatan</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {previewRows.map((row, i) => (
                              <tr key={i} className="hover:bg-slate-50">
                                <td className="px-3 py-2 font-semibold text-slate-700">{row.namaDesa}</td>
                                <td className="px-3 py-2 text-right tabular-nums">{fmt(row.ajuan_ri)}</td>
                                <td className="px-3 py-2 text-right tabular-nums font-bold">{fmt(row.anggaran_disetujui)}</td>
                                <td className="px-3 py-2 text-right tabular-nums text-[#7a1200] font-bold">{fmt(row.anggaran_dicairkan)}</td>
                                <td className="px-3 py-2 text-slate-500">{row.status_pencairan}</td>
                                <td className="px-3 py-2 text-slate-400">{row.catatan || '-'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

              {/* Navigation buttons */}
              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <Button
                  variant="ghost"
                  size="sm"
                  className="rounded-xl text-slate-500 font-semibold"
                  onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  {step > 1 ? 'Kembali' : 'Batal'}
                </Button>

                <div className="flex gap-2">
                  {step < 3 && (
                    <Button
                      className="bg-[#7a1200] hover:bg-[#5c0e00] text-white rounded-xl font-bold px-6 gap-2 shadow-md shadow-[#7a1200]/20"
                      disabled={
                        (step === 1 && !canGoStep2) || 
                        (step === 2 && (!selectedTahun || (targetDesaMode === 'pilih' && targetDesaIds.size === 0) || targetBulanIds.size === 0))
                      }
                      onClick={() => setStep(s => s + 1)}
                    >
                      Selanjutnya <ChevronRight className="w-4 h-4" />
                    </Button>
                  )}
                  {step === 3 && (
                    <Button
                      className="bg-[#7a1200] hover:bg-[#5c0e00] text-white rounded-xl font-bold px-6 gap-2 shadow-md shadow-[#7a1200]/20 disabled:opacity-50"
                      disabled={!canImport || importing}
                      onClick={handleImport}
                    >
                      {importing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {importing ? 'Mengimport...' : `Import ${previewRows.length} Baris`}
                    </Button>
                  )}
                </div>
              </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
