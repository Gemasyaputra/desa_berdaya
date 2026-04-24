'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  FileSpreadsheet, Download, Upload, ChevronRight, ChevronLeft,
  CheckCircle2, AlertCircle, X, Loader2, Table2
} from 'lucide-react'
import {
  getDesaBerdayaOptions,
  getProgramOptions,
  getKategoriProgramOptions,
  importIntervensiProgramUniversal
} from '@/app/dashboard/intervensi/actions'

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
  const [importMode, setImportMode] = useState<'banyak-bulan' | 'banyak-desa'>('banyak-bulan')

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
  const [selectedBulan, setSelectedBulan] = useState(BULAN_OPTIONS[new Date().getMonth()])
  const [selectedTahun, setSelectedTahun] = useState(new Date().getFullYear().toString())
  const [targetDesaMode, setTargetDesaMode] = useState<'semua' | 'pilih'>('semua')
  const [targetDesaIds, setTargetDesaIds] = useState<Set<number>>(new Set())

  const filteredPrograms = programOptions.filter(p => String(p.kategori_id) === selectedKategoriId)
  const selectedProgram = programOptions.find(p => String(p.id) === selectedProgramId)
  const selectedKategori = kategoriOptions.find(k => String(k.id) === selectedKategoriId)

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
    }
  }, [isOpen])

  // ── TEMPLATE DOWNLOAD ──────────────────────────────────────────────
  const handleDownloadTemplate = async () => {
    if (importMode === 'banyak-bulan' && (!selectedDesa || !selectedProgram || !selectedKategori)) return
    if (importMode === 'banyak-desa' && (!selectedProgram || !selectedKategori || !selectedBulan || !selectedTahun)) return

    const XLSX = await import('xlsx')
    const tahun = importMode === 'banyak-bulan' ? new Date().getFullYear() : Number(selectedTahun)
    let wsData: any[][] = []

    if (importMode === 'banyak-bulan') {
      wsData = [
        ['⚠ JANGAN UBAH BARIS 1-2. Isi data mulai baris 3 ke bawah.'],
        [
          '[METADATA] kategori_program_id', '[METADATA] program_id', '[METADATA] desa_berdaya_id', '[METADATA] relawan_id',
          '[READONLY] nama_program', '[READONLY] nama_desa', '[READONLY] nama_relawan',
          'tahun', 'bulan', 'sumber_dana', 'fundraiser', 'deskripsi',
          'ajuan_ri', 'anggaran_disetujui', 'anggaran_dicairkan', 'status_pencairan',
          'id_stp', 'catatan', 'is_dbf', 'is_rz'
        ],
        ...BULAN_OPTIONS.map(bulan => [
          Number(selectedKategoriId), selectedProgram?.id, selectedDesa?.id, selectedDesa?.relawan_id,
          selectedProgram?.nama_program, selectedDesa?.nama, selectedDesa?.relawan_nama || '',
          tahun, bulan, selectedSumberDana || '', selectedFundraiser || '', '',
          0, 0, 0, 'Dialokasikan',
          '', '', 'FALSE', 'FALSE'
        ])
      ]
    } else {
      wsData = [
        ['⚠ JANGAN UBAH BARIS 1-2. Isi data mulai baris 3 ke bawah.'],
        [
          '[METADATA] kategori_program_id', '[METADATA] program_id', '[METADATA] desa_berdaya_id', '[METADATA] relawan_id',
          '[READONLY] nama_program', '[READONLY] nama_desa', '[READONLY] nama_relawan',
          'tahun', 'bulan', 'sumber_dana', 'fundraiser', 'deskripsi',
          'ajuan_ri', 'anggaran_disetujui', 'anggaran_dicairkan', 'status_pencairan',
          'id_stp', 'catatan', 'is_dbf', 'is_rz'
        ],
        ...activeTargetDesas.map(d => [
          Number(selectedKategoriId), selectedProgram?.id, d.id, d.relawan_id,
          selectedProgram?.nama_program, d.nama, d.relawan_nama || '',
          tahun, selectedBulan, '', '', '',
          0, 0, 0, 'Dialokasikan',
          '', '', 'FALSE', 'FALSE'
        ])
      ]
    }

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

    const safeName = importMode === 'banyak-bulan' 
      ? `${selectedDesa?.nama}_${selectedProgram?.nama_program}`.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 40)
      : `BanyakDesa_${selectedProgram?.nama_program}_${selectedBulan}`.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 40)
    
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
        mode: importMode,
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

  const canGoStep2 = !!selectedDesaId
  const canGoStep3 = !!selectedProgramId
  const canImport = !!parsedMeta && previewRows.length > 0

  return (
    <Dialog open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-3xl bg-white max-h-[90vh] overflow-y-auto w-[95%] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2.5">
            <div className="w-9 h-9 bg-[#008784]/10 border border-[#008784]/20 rounded-xl flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5 text-[#008784]" />
            </div>
            Import dari Excel
          </DialogTitle>
          <DialogDescription>
            Import data Intervensi Program baru beserta anggaran bulanannya dari file Excel.
          </DialogDescription>
        </DialogHeader>

        {/* Mode Toggle */}
        <div className="flex gap-2 bg-slate-100 p-1 rounded-xl mt-4 mb-4">
          <button 
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${importMode === 'banyak-bulan' ? 'bg-white text-[#008784] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => { setImportMode('banyak-bulan'); setStep(1); setParsedMeta(null); setPreviewRows([]); }}
          >
            1 Program, 1 Desa (Banyak Bulan)
          </button>
          <button 
            className={`flex-1 py-2 text-sm font-bold rounded-lg transition-colors ${importMode === 'banyak-desa' ? 'bg-white text-[#008784] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            onClick={() => { setImportMode('banyak-desa'); setStep(1); setParsedMeta(null); setPreviewRows([]); }}
          >
            1 Program, Banyak Desa (1 Bulan)
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mt-2 mb-4">
          {[
            { n: 1, label: importMode === 'banyak-bulan' ? 'Pilih Desa' : 'Pilih Program' },
            { n: 2, label: importMode === 'banyak-bulan' ? 'Pilih Program' : 'Pilih Waktu' },
            { n: 3, label: 'Upload & Import' },
          ].map((s, i) => (
            <React.Fragment key={s.n}>
              <div className={`flex items-center gap-2 text-sm font-bold px-3 py-1.5 rounded-full transition-colors ${
                step === s.n ? 'bg-[#008784] text-white' :
                step > s.n ? 'bg-[#008784]/10 text-[#008784]' : 'bg-slate-100 text-slate-400'
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
            {step === 1 && importMode === 'banyak-bulan' && (
              <div className="space-y-5">
                <div className="bg-[#008784]/5 border border-[#008784]/15 rounded-xl p-4 text-sm text-[#008784] font-medium flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  Pilih Desa Binaan yang ingin dibuatkan Intervensi Program baru.
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-slate-700">Desa Binaan <span className="text-rose-500">*</span></Label>
                  <select
                    className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#008784]/40 cursor-pointer shadow-sm"
                    value={selectedDesaId}
                    onChange={e => setSelectedDesaId(e.target.value)}
                  >
                    <option value="">— Pilih Desa Binaan —</option>
                    {desaOptions.map(d => (
                      <option key={d.id} value={d.id}>{d.nama} {d.relawan_nama ? `(${d.relawan_nama})` : ''}</option>
                    ))}
                  </select>
                </div>

                {selectedDesa && (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm space-y-1">
                    <div className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Info Desa</div>
                    <div className="flex gap-3"><span className="text-slate-500 w-24">Desa</span><span className="font-semibold text-slate-800">{selectedDesa.nama}</span></div>
                    <div className="flex gap-3"><span className="text-slate-500 w-24">Relawan</span><span className="font-semibold text-slate-800">{selectedDesa.relawan_nama || '-'}</span></div>
                    <div className="flex gap-3"><span className="text-slate-500 w-24">ID Desa</span><span className="font-mono text-slate-600 bg-slate-100 px-2 py-0.5 rounded text-xs">{selectedDesa.id}</span></div>
                  </div>
                )}
              </div>
            )}

            {step === 1 && importMode === 'banyak-desa' && (
              <div className="space-y-5">
                <div className="bg-[#008784]/5 border border-[#008784]/15 rounded-xl p-4 text-sm text-[#008784] font-medium flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  Pilih Program yang akan didistribusikan ke banyak desa sekaligus.
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Kategori Program <span className="text-rose-500">*</span></Label>
                    <select
                      className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#008784]/40 cursor-pointer shadow-sm"
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
                      className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#008784] focus:outline-none focus:ring-2 focus:ring-[#008784]/40 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* ── STEP 2: PILIH PROGRAM / WAKTU ──────────────────── */}
            {step === 2 && importMode === 'banyak-bulan' && (
              <div className="space-y-5">
                <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#008784] flex-shrink-0" />
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Desa terpilih:</span>
                    <span className="ml-2 font-bold text-slate-800">{selectedDesa?.nama}</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Kategori Program <span className="text-rose-500">*</span></Label>
                    <select
                      className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#008784]/40 cursor-pointer shadow-sm"
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
                      className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-[#008784] focus:outline-none focus:ring-2 focus:ring-[#008784]/40 cursor-pointer shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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

                {selectedProgram && selectedDesa && (
                  <>
                    {/* Sumber Dana & Fundraiser */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="font-bold text-slate-700">Sumber Dana</Label>
                        <select
                          className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#008784]/40 cursor-pointer shadow-sm"
                          value={selectedSumberDana}
                          onChange={e => setSelectedSumberDana(e.target.value)}
                        >
                          <option value="">— Pilih Sumber Dana —</option>
                          {SUMBER_DANA_OPTIONS.map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label className="font-bold text-slate-700">Fundraiser</Label>
                        <input
                          type="text"
                          placeholder="Nama fundraiser..."
                          className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 placeholder:font-normal placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#008784]/40 shadow-sm"
                          value={selectedFundraiser}
                          onChange={e => setSelectedFundraiser(e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Ringkasan template */}
                    <div className="bg-[#008784]/5 border border-[#008784]/15 rounded-xl p-4 text-sm space-y-2">
                      <div className="text-xs text-[#008784] font-bold uppercase tracking-wider mb-2">Ringkasan Template</div>
                      <div className="grid grid-cols-2 gap-2">
                        <div><span className="text-slate-500">Desa ID:</span> <code className="bg-white px-2 py-0.5 rounded text-xs font-mono border border-slate-200">{selectedDesa.id}</code></div>
                        <div><span className="text-slate-500">Program ID:</span> <code className="bg-white px-2 py-0.5 rounded text-xs font-mono border border-slate-200">{selectedProgram.id}</code></div>
                        <div><span className="text-slate-500">Kategori ID:</span> <code className="bg-white px-2 py-0.5 rounded text-xs font-mono border border-slate-200">{selectedKategoriId}</code></div>
                        <div><span className="text-slate-500">Relawan ID:</span> <code className="bg-white px-2 py-0.5 rounded text-xs font-mono border border-slate-200">{selectedDesa.relawan_id}</code></div>
                        {selectedSumberDana && <div><span className="text-slate-500">Sumber Dana:</span> <span className="font-semibold text-slate-700">{selectedSumberDana}</span></div>}
                        {selectedFundraiser && <div><span className="text-slate-500">Fundraiser:</span> <span className="font-semibold text-slate-700">{selectedFundraiser}</span></div>}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {step === 2 && importMode === 'banyak-desa' && (
              <div className="space-y-5">
                <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-[#008784] flex-shrink-0" />
                  <div>
                    <span className="text-xs text-slate-400 uppercase font-bold tracking-wider">Program terpilih:</span>
                    <span className="ml-2 font-bold text-[#008784]">{selectedProgram?.nama_program}</span>
                  </div>
                </div>

                <div className="space-y-3 border border-slate-100 bg-white rounded-xl p-4">
                  <Label className="font-bold text-slate-700">Pilihan Desa Binaan <span className="text-rose-500">*</span></Label>
                  <div className="flex flex-col gap-2">
                    <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <input 
                        type="radio" 
                        name="targetDesa"
                        checked={targetDesaMode === 'semua'} 
                        onChange={() => setTargetDesaMode('semua')}
                        className="text-[#008784] focus:ring-[#008784] w-4 h-4"
                      />
                      <span className="font-medium text-slate-700">Semua Desa Binaan ({desaOptions.length} Desa)</span>
                    </label>
                    <label className="flex items-center gap-2 text-sm cursor-pointer hover:bg-slate-50 p-2 rounded-lg border border-slate-100">
                      <input 
                        type="radio" 
                        name="targetDesa"
                        checked={targetDesaMode === 'pilih'} 
                        onChange={() => setTargetDesaMode('pilih')}
                        className="text-[#008784] focus:ring-[#008784] w-4 h-4"
                      />
                      <span className="font-medium text-slate-700">Pilih Desa Tertentu</span>
                    </label>
                  </div>

                  {targetDesaMode === 'pilih' && (
                    <div className="mt-3 border border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 text-xs font-bold text-slate-500 flex justify-between items-center">
                        <span>Pilih Desa (terpilih: {targetDesaIds.size})</span>
                        <div className="flex gap-2">
                          <button 
                            className="text-[#008784] hover:underline"
                            onClick={() => setTargetDesaIds(new Set(desaOptions.map(d => d.id)))}
                          >
                            Pilih Semua
                          </button>
                          <span className="text-slate-300">|</span>
                          <button 
                            className="text-slate-500 hover:underline"
                            onClick={() => setTargetDesaIds(new Set())}
                          >
                            Reset
                          </button>
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto p-2 grid grid-cols-1 sm:grid-cols-2 gap-1 bg-white">
                        {desaOptions.map(d => (
                          <label key={d.id} className="flex items-center gap-2 text-xs p-1.5 hover:bg-slate-50 rounded cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={targetDesaIds.has(d.id)}
                              onChange={(e) => {
                                const newSet = new Set(targetDesaIds)
                                if (e.target.checked) newSet.add(d.id)
                                else newSet.delete(d.id)
                                setTargetDesaIds(newSet)
                              }}
                              className="text-[#008784] focus:ring-[#008784] rounded-sm"
                            />
                            <span className="truncate">{d.nama}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="font-bold text-slate-700">Tahun <span className="text-rose-500">*</span></Label>
                    <select
                      className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#008784]/40 cursor-pointer shadow-sm"
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
                    <Label className="font-bold text-slate-700">Bulan <span className="text-rose-500">*</span></Label>
                    <select
                      className="w-full h-12 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#008784]/40 cursor-pointer shadow-sm"
                      value={selectedBulan}
                      onChange={e => setSelectedBulan(e.target.value)}
                    >
                      {BULAN_OPTIONS.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* ── STEP 3: DOWNLOAD TEMPLATE & UPLOAD ────── */}
            {step === 3 && (
              <div className="space-y-5">
                {/* Info summary */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
                  {importMode === 'banyak-bulan' && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Desa:</span>
                      <span className="font-bold text-slate-800">{selectedDesa?.nama}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Program:</span>
                    <span className="font-bold text-[#008784]">{selectedProgram?.nama_program}</span>
                  </div>
                  {importMode === 'banyak-desa' && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Target Desa:</span>
                      <span className="font-bold text-slate-800">{activeTargetDesas.length} Desa</span>
                    </div>
                  )}
                  {importMode === 'banyak-desa' && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Waktu:</span>
                      <span className="font-bold text-slate-800">{selectedBulan} {selectedTahun}</span>
                    </div>
                  )}
                </div>

                {/* 1. Download template */}
                <div className="border border-dashed border-[#008784]/25 bg-[#008784]/5 rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#008784]/15 text-[#008784] font-black text-xs flex items-center justify-center flex-shrink-0">1</div>
                    <h4 className="font-bold text-slate-800 text-sm">Download Template Excel</h4>
                  </div>
                  <p className="text-xs text-slate-500 ml-9">
                    Template sudah berisi format yang tepat. {importMode === 'banyak-bulan' ? 'Isi data anggaran per bulan.' : 'Isi kolom data untuk setiap desa yang dituju.'}
                  </p>
                  <div className="ml-9">
                    <Button
                      onClick={handleDownloadTemplate}
                      variant="outline"
                      className="border-[#008784]/40 text-[#008784] hover:bg-[#008784]/5 font-bold rounded-xl gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Download Template .xlsx
                    </Button>
                  </div>
                </div>

                {/* 2. Upload file */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#008784]/10 text-[#008784] font-black text-xs flex items-center justify-center flex-shrink-0">2</div>
                    <h4 className="font-bold text-slate-800 text-sm">Upload File yang Sudah Diisi</h4>
                  </div>
                  <div
                    className={`ml-9 border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all ${
                      isDragging ? 'border-[#008784] bg-[#008784]/5' : 'border-slate-200 hover:border-[#008784]/40 hover:bg-slate-50'
                    }`}
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                  >
                    <Upload className={`w-8 h-8 mx-auto mb-3 transition-colors ${isDragging ? 'text-[#008784]' : 'text-slate-300'}`} />
                    <p className="text-sm font-semibold text-slate-600">Drag & drop file di sini, atau <span className="text-[#008784] underline">browse</span></p>
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
                      <Badge className="bg-[#008784]/10 text-[#008784] font-bold text-xs border-none">{previewRows.length} baris</Badge>
                    </div>

                    {/* Header meta preview */}
                    <div className="ml-9 bg-[#008784]/5 border border-[#008784]/15 rounded-xl p-3 text-xs space-y-1">
                      <div className="text-[#008784] font-bold uppercase tracking-wider text-[10px] mb-1.5">Header Intervensi</div>
                      {parsedMeta.mode === 'banyak-bulan' ? (
                        <div className="grid grid-cols-3 gap-x-4 gap-y-0.5 text-slate-600">
                          <span><b className="text-slate-500">Desa:</b> {parsedMeta.namaDesa}</span>
                          <span><b className="text-slate-500">Program:</b> {parsedMeta.namaProgram}</span>
                          <span><b className="text-slate-500">Sumber Dana:</b> {parsedMeta.sumber_dana || '-'}</span>
                          <span><b className="text-slate-500">Fundraiser:</b> {parsedMeta.fundraiser || '-'}</span>
                          <span className="col-span-2"><b className="text-slate-500">Deskripsi:</b> {parsedMeta.deskripsi || '-'}</span>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-slate-600">
                          <span><b className="text-slate-500">Program:</b> {parsedMeta.namaProgram}</span>
                          <span><b className="text-slate-500">Bulan/Tahun:</b> {parsedMeta.bulan} {parsedMeta.tahun}</span>
                        </div>
                      )}
                    </div>

                    {/* Rows preview table */}
                    <div className="ml-9 border border-slate-200 rounded-xl overflow-hidden">
                      <div className="overflow-x-auto max-h-52">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider sticky top-0">
                            <tr>
                              {parsedMeta.mode === 'banyak-bulan' ? (
                                <>
                                  <th className="px-3 py-2">Tahun</th>
                                  <th className="px-3 py-2">Bulan</th>
                                </>
                              ) : (
                                <th className="px-3 py-2">Desa Tujuan</th>
                              )}
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
                                {parsedMeta.mode === 'banyak-bulan' ? (
                                  <>
                                    <td className="px-3 py-2 font-semibold text-slate-700">{row.tahun}</td>
                                    <td className="px-3 py-2 text-slate-600">{row.bulan}</td>
                                  </>
                                ) : (
                                  <td className="px-3 py-2 font-semibold text-slate-700">{row.namaDesa}</td>
                                )}
                                <td className="px-3 py-2 text-right tabular-nums">{fmt(row.ajuan_ri)}</td>
                                <td className="px-3 py-2 text-right tabular-nums font-bold">{fmt(row.anggaran_disetujui)}</td>
                                <td className="px-3 py-2 text-right tabular-nums text-[#008784] font-bold">{fmt(row.anggaran_dicairkan)}</td>
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
                      className="bg-[#008784] hover:bg-[#006e6b] text-white rounded-xl font-bold px-6 gap-2 shadow-md shadow-[#008784]/20"
                      disabled={
                        importMode === 'banyak-bulan' 
                          ? ((step === 1 && !canGoStep2) || (step === 2 && !canGoStep3)) 
                          : ((step === 1 && !canGoStep3) || (step === 2 && (!selectedBulan || !selectedTahun || (targetDesaMode === 'pilih' && targetDesaIds.size === 0))))
                      }
                      onClick={() => setStep(s => s + 1)}
                    >
                      Selanjutnya <ChevronRight className="w-4 h-4" />
                    </Button>
                  )}
                  {step === 3 && (
                    <Button
                      className="bg-[#008784] hover:bg-[#006e6b] text-white rounded-xl font-bold px-6 gap-2 shadow-md shadow-[#008784]/20 disabled:opacity-50"
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
