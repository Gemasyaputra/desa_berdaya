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
  importIntervensiProgram
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
  const filteredPrograms = programOptions.filter(p => String(p.kategori_id) === selectedKategoriId)
  const selectedProgram = programOptions.find(p => String(p.id) === selectedProgramId)
  const selectedKategori = kategoriOptions.find(k => String(k.id) === selectedKategoriId)

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
    }
  }, [isOpen])

  // ── TEMPLATE DOWNLOAD ──────────────────────────────────────────────
  const handleDownloadTemplate = async () => {
    if (!selectedDesa || !selectedProgram || !selectedKategori) return
    const XLSX = await import('xlsx')

    const tahun = new Date().getFullYear()

    // Build sheet data as array-of-arrays
    const wsData: any[][] = [
      // Row 1: Instructions
      ['⚠ JANGAN UBAH BARIS 1-8. Isi data mulai baris 9 ke bawah.'],
      // Row 2: Blank
      [],
      // Row 3: Metadata header
      ['[METADATA] desa_berdaya_id', 'program_id', 'kategori_program_id', 'relawan_id', 'nama_desa', 'nama_program'],
      // Row 4: Metadata values (pre-filled, locked)
      [selectedDesa.id, selectedProgram.id, Number(selectedKategoriId), selectedDesa.relawan_id, selectedDesa.nama, selectedProgram.nama_program],
      // Row 5: Blank
      [],
      // Row 6: Header data labels
      ['[HEADER] sumber_dana', 'fundraiser', 'deskripsi'],
      // Row 7: Header data values (pre-filled from wizard selection)
      [selectedSumberDana || '', selectedFundraiser || '', ''],
      // Row 8: Anggaran column headers
      ['tahun', 'bulan', 'ajuan_ri', 'anggaran_disetujui', 'anggaran_dicairkan', 'status_pencairan', 'id_stp', 'catatan', 'is_dbf', 'is_rz'],
      // Row 9-20: 12 months sample (all with 0 values)
      ...BULAN_OPTIONS.map(bulan => [tahun, bulan, 0, 0, 0, 'Dialokasikan', '', '', 'FALSE', 'FALSE'])
    ]

    const ws = XLSX.utils.aoa_to_sheet(wsData)

    // Column widths
    ws['!cols'] = [
      { wch: 30 }, { wch: 15 }, { wch: 18 }, { wch: 18 },
      { wch: 18 }, { wch: 15 }, { wch: 15 }, { wch: 25 },
      { wch: 10 }, { wch: 10 }
    ]

    // Style instruction row (merge A1 across all columns)
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 9 } }]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Intervensi Import')

    const safeName = `${selectedDesa.nama}_${selectedProgram.nama_program}`.replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 40)
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

      // Row 4 (index 3): metadata values
      const metaRow = aoa[3] || []
      const desaId = Number(metaRow[0])
      const programId = Number(metaRow[1])
      const kategoriId = Number(metaRow[2])
      const relawanId = Number(metaRow[3])
      const namaDesa = String(metaRow[4] || '')
      const namaProgram = String(metaRow[5] || '')

      if (!desaId || !programId || !relawanId) {
        setUploadError('File tidak valid: metadata desa/program tidak ditemukan. Gunakan template yang sudah disediakan.')
        return
      }

      // Row 7 (index 6): header data values
      const headerRow = aoa[6] || []
      const sumber_dana = String(headerRow[0] || '')
      const fundraiser = String(headerRow[1] || '')
      const deskripsi = String(headerRow[2] || '')

      setParsedMeta({ desaId, programId, kategoriId, relawanId, namaDesa, namaProgram, sumber_dana, fundraiser, deskripsi })

      // From Row 9 (index 8): anggaran data rows
      const dataRows: any[] = []
      for (let i = DATA_START_ROW; i < aoa.length; i++) {
        const r = aoa[i]
        if (!r || !r[0] || !r[1]) continue // skip empty rows
        const tahun = Number(r[0])
        const bulan = String(r[1]).trim()
        if (!tahun || !BULAN_OPTIONS.includes(bulan)) continue

        dataRows.push({
          tahun,
          bulan,
          ajuan_ri: Number(r[2]) || 0,
          anggaran_disetujui: Number(r[3]) || 0,
          anggaran_dicairkan: Number(r[4]) || 0,
          status_pencairan: String(r[5] || 'Dialokasikan').trim(),
          id_stp: String(r[6] || '').trim(),
          catatan: String(r[7] || '').trim(),
          is_dbf: String(r[8]).toUpperCase() === 'TRUE',
          is_rz: String(r[9]).toUpperCase() === 'TRUE',
        })
      }

      if (dataRows.length === 0) {
        setUploadError('Tidak ada baris data anggaran yang valid ditemukan (mulai baris 9).')
        return
      }

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
      const res = await importIntervensiProgram({
        desa_berdaya_id: parsedMeta.desaId,
        kategori_program_id: parsedMeta.kategoriId,
        program_id: parsedMeta.programId,
        relawan_id: parsedMeta.relawanId,
        sumber_dana: selectedSumberDana || parsedMeta.sumber_dana || undefined,
        fundraiser: selectedFundraiser || parsedMeta.fundraiser || undefined,
        deskripsi: parsedMeta.deskripsi || undefined,
        rows: previewRows,
      })
      if (res.success) {
        const { toast } = await import('sonner')
        toast.success(`Import berhasil! ${res.inserted} baris anggaran ditambahkan.`, {
          description: `ID Intervensi Baru: #${res.id}`
        })
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

        {/* Step indicator */}
        <div className="flex items-center gap-2 mt-2 mb-4">
          {[
            { n: 1, label: 'Pilih Desa' },
            { n: 2, label: 'Pilih Program' },
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

            {/* ── STEP 1: PILIH DESA ─────────────────────── */}
            {step === 1 && (
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

            {/* ── STEP 2: PILIH PROGRAM ──────────────────── */}
            {step === 2 && (
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

            {/* ── STEP 3: DOWNLOAD TEMPLATE & UPLOAD ────── */}
            {step === 3 && (
              <div className="space-y-5">
                {/* Info summary */}
                <div className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 flex flex-wrap items-center gap-x-6 gap-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Desa:</span>
                    <span className="font-bold text-slate-800">{selectedDesa?.nama}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Program:</span>
                    <span className="font-bold text-[#008784]">{selectedProgram?.nama_program}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">Kategori:</span>
                    <span className="font-semibold text-slate-700">{selectedKategori?.nama}</span>
                  </div>
                </div>

                {/* 1. Download template */}
                <div className="border border-dashed border-[#008784]/25 bg-[#008784]/5 rounded-xl p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#008784]/15 text-[#008784] font-black text-xs flex items-center justify-center flex-shrink-0">1</div>
                    <h4 className="font-bold text-slate-800 text-sm">Download Template Excel</h4>
                  </div>
                  <p className="text-xs text-slate-500 ml-9">
                    Template sudah berisi ID Desa, ID Program, dan 12 baris bulan (Januari–Desember). Isi kolom <strong>sumber_dana</strong>, <strong>fundraiser</strong>, dan data <strong>anggaran</strong>, lalu upload kembali.
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
                      <div className="grid grid-cols-3 gap-x-4 gap-y-0.5 text-slate-600">
                        <span><b className="text-slate-500">Desa:</b> {parsedMeta.namaDesa}</span>
                        <span><b className="text-slate-500">Program:</b> {parsedMeta.namaProgram}</span>
                        <span><b className="text-slate-500">Sumber Dana:</b> {parsedMeta.sumber_dana || '-'}</span>
                        <span><b className="text-slate-500">Fundraiser:</b> {parsedMeta.fundraiser || '-'}</span>
                        <span className="col-span-2"><b className="text-slate-500">Deskripsi:</b> {parsedMeta.deskripsi || '-'}</span>
                      </div>
                    </div>

                    {/* Rows preview table */}
                    <div className="ml-9 border border-slate-200 rounded-xl overflow-hidden">
                      <div className="overflow-x-auto max-h-52">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 tracking-wider sticky top-0">
                            <tr>
                              <th className="px-3 py-2">Tahun</th>
                              <th className="px-3 py-2">Bulan</th>
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
                                <td className="px-3 py-2 font-semibold text-slate-700">{row.tahun}</td>
                                <td className="px-3 py-2 text-slate-600">{row.bulan}</td>
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
                    disabled={(step === 1 && !canGoStep2) || (step === 2 && !canGoStep3)}
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
