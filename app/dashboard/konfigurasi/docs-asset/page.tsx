'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Upload, Check, Copy, ImageIcon, Loader2, X, ExternalLink, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'

// ─── Struktur per Role → Tahap ───────────────────────────────────────────────
const STRUCTURE = [
  {
    role: 'Admin', color: 'violet',
    tahaps: [
      { id: 'admin-t1', label: 'Tahap 1 — Login & Orientasi Dashboard' },
      { id: 'admin-t2', label: 'Tahap 2 — Setup Master Data Program' },
      { id: 'admin-t3', label: 'Tahap 3 — Setup Intervensi Program ke Desa' },
      { id: 'admin-t4', label: 'Tahap 4 — Manajemen Tim' },
      { id: 'admin-t5', label: 'Tahap 5 — Monitoring & Evaluasi' },
      { id: 'admin-t6', label: 'Tahap 6 — Konfigurasi Sistem' },
    ],
  },
  {
    role: 'Monev', color: 'blue',
    tahaps: [
      { id: 'monev-t1', label: 'Tahap 1 — Login & Review Dashboard' },
      { id: 'monev-t2', label: 'Tahap 2 — Review Laporan Kegiatan' },
      { id: 'monev-t3', label: 'Tahap 3 — Evaluasi Update Capaian' },
      { id: 'monev-t4', label: 'Tahap 4 — Evaluasi Keuangan' },
    ],
  },
  {
    role: 'Prog_Head', color: 'indigo',
    tahaps: [
      { id: 'proghead-t1', label: 'Tahap 1 — Login & Monitoring Program' },
      { id: 'proghead-t2', label: 'Tahap 2 — Evaluasi Capaian Per Program' },
      { id: 'proghead-t3', label: 'Tahap 3 — Tindak Lanjut' },
    ],
  },
  {
    role: 'Finance', color: 'emerald',
    tahaps: [
      { id: 'finance-t1', label: 'Tahap 1 — Identifikasi Transaksi Pending' },
      { id: 'finance-t2', label: 'Tahap 2 — Verifikasi Bukti Cash Advance' },
      { id: 'finance-t3', label: 'Tahap 3 — Rekap Bulanan' },
    ],
  },
  {
    role: 'Office User', color: 'orange',
    tahaps: [
      { id: 'office-t1', label: 'Tahap 1 — Login & Orientasi' },
      { id: 'office-t2', label: 'Tahap 2 — Administrasi Data PM & Kelompok' },
      { id: 'office-t3', label: 'Tahap 3 — Input & Monitoring Laporan Kegiatan' },
    ],
  },
  {
    role: 'Relawan', color: 'amber',
    tahaps: [
      { id: 'relawan-t1', label: 'Tahap 1 — Onboarding Penerima Manfaat (PM) Baru' },
      { id: 'relawan-t2', label: 'Tahap 2 — Mengelola Kelompok PM' },
      { id: 'relawan-t3', label: 'Tahap 3 — Input Laporan Kegiatan' },
      { id: 'relawan-t4', label: 'Tahap 4 — Update Capaian PM' },
      { id: 'relawan-t5', label: 'Tahap 5 — Upload Laporan Keuangan (CA)' },
      { id: 'relawan-t6', label: 'Tahap 6 — Pembaruan Profil' },
    ],
  },
  {
    role: 'Korwil', color: 'rose',
    tahaps: [
      { id: 'korwil-t1', label: 'Tahap 1 — Login & Overview Wilayah' },
      { id: 'korwil-t2', label: 'Tahap 2 — Koordinasi & Pengawasan Relawan' },
      { id: 'korwil-t3', label: 'Tahap 3 — Eksekusi Tugas Lapangan' },
      { id: 'korwil-t4', label: 'Tahap 4 — Review Laporan Bawahan' },
    ],
  },
]

const ROLE_BADGE: Record<string, string> = {
  Admin:      'bg-violet-100 text-violet-700 border-violet-200',
  Monev:      'bg-blue-100 text-blue-700 border-blue-200',
  Prog_Head:  'bg-indigo-100 text-indigo-700 border-indigo-200',
  Finance:    'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Office User': 'bg-orange-100 text-orange-700 border-orange-200',
  Relawan:    'bg-amber-100 text-amber-700 border-amber-200',
  Korwil:     'bg-rose-100 text-rose-700 border-rose-200',
}

const LS_KEY = 'docs-asset-uploads-v2'

interface UploadedImage {
  uid: string
  url: string
  previewUrl: string  // sama dengan url (Vercel Blob) agar survive refresh
  filename: string
}

function loadFromStorage(): Record<string, UploadedImage[]> {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveToStorage(uploads: Record<string, UploadedImage[]>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(uploads))
  } catch {}
}

export default function DocsAssetUploaderPage() {
  const [uploads, setUploads] = useState<Record<string, UploadedImage[]>>({})
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const [draggingOver, setDraggingOver] = useState<string | null>(null)
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({})

  // Hydrate dari localStorage sekali saat mount
  useEffect(() => {
    setUploads(loadFromStorage())
  }, [])

  const toggleRole = (role: string) =>
    setCollapsed(prev => ({ ...prev, [role]: !prev[role] }))

  const uploadFiles = useCallback(async (tahapId: string, files: File[]) => {
    if (!files.length) return
    setUploading(prev => ({ ...prev, [tahapId]: true }))
    try {
      const current = loadFromStorage()
      const existing = current[tahapId]?.length ?? 0
      const results = await Promise.all(
        files.map(async (file, i) => {
          const slug = `${tahapId}-${existing + i + 1}-${Date.now()}`
          const form = new FormData()
          form.append('file', file)
          form.append('slug', slug)
          const res = await fetch('/api/upload/docs-asset', { method: 'POST', body: form })
          const data = await res.json()
          if (!res.ok) throw new Error(data?.error || 'Gagal upload')
          // Gunakan url Vercel Blob sebagai preview agar tidak hilang saat refresh
          return { uid: slug, url: data.url, previewUrl: data.url, filename: file.name } as UploadedImage
        })
      )
      setUploads(prev => {
        const next = {
          ...prev,
          [tahapId]: [...(prev[tahapId] ?? []), ...results],
        }
        saveToStorage(next)
        return next
      })
      toast.success(`✅ ${results.length} gambar berhasil diupload`)
    } catch (e: any) {
      toast.error(e?.message || 'Gagal upload')
    } finally {
      setUploading(prev => ({ ...prev, [tahapId]: false }))
    }
  }, [])

  const removeImage = (tahapId: string, uid: string) => {
    setUploads(prev => {
      const next = {
        ...prev,
        [tahapId]: (prev[tahapId] ?? []).filter(img => img.uid !== uid),
      }
      saveToStorage(next)
      return next
    })
  }

  const clearAll = () => {
    if (!confirm('Hapus semua data upload yang tersimpan?')) return
    localStorage.removeItem(LS_KEY)
    setUploads({})
    toast.success('Semua data upload dihapus')
  }

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} tersalin!`)
  }

  const copyAllMdx = (tahapId: string, tahapLabel: string) => {
    const images = uploads[tahapId] ?? []
    if (!images.length) return
    const text = images.map((img, i) => `![${tahapLabel} - Screenshot ${i + 1}](${img.url})`).join('\n')
    navigator.clipboard.writeText(text)
    toast.success('Semua tag MDX tersalin!')
  }

  const handleDrop = (tahapId: string) => (e: React.DragEvent) => {
    e.preventDefault()
    setDraggingOver(null)
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'))
    uploadFiles(tahapId, files)
  }

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Upload Screenshot Dokumentasi</h1>
          <p className="text-slate-500 text-sm">
            Upload <strong>beberapa gambar</strong> per tahap untuk setiap role. Setelah upload, salin tag MDX dan paste ke <code className="bg-slate-100 px-1 rounded">pages/roles.mdx</code>.
          </p>
          <div className="flex items-center gap-1.5 pt-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] text-emerald-600 font-semibold">Gambar tersimpan otomatis — aman di-refresh</span>
          </div>
        </div>
        <button
          onClick={clearAll}
          className="flex-shrink-0 flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl hover:bg-rose-100 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Reset Semua
        </button>
      </div>

      {/* Role sections */}
      {STRUCTURE.map(({ role, tahaps }) => {
        const isCollapsed = collapsed[role]
        const totalUploaded = tahaps.reduce((sum, t) => sum + (uploads[t.id]?.length ?? 0), 0)

        return (
          <div key={role} className="rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            {/* Role header */}
            <button
              onClick={() => toggleRole(role)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${ROLE_BADGE[role]}`}>
                  {role}
                </span>
                <span className="font-semibold text-slate-700 text-sm">{tahaps.length} Tahap</span>
                {totalUploaded > 0 && (
                  <span className="bg-emerald-100 text-emerald-700 text-xs font-bold px-2 py-0.5 rounded-full">
                    {totalUploaded} gambar
                  </span>
                )}
              </div>
              {isCollapsed ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronUp className="w-4 h-4 text-slate-400" />}
            </button>

            {/* Tahaps */}
            {!isCollapsed && (
              <div className="border-t border-slate-100 divide-y divide-slate-100">
                {tahaps.map(tahap => {
                  const images = uploads[tahap.id] ?? []
                  const isUploading = uploading[tahap.id]
                  const isDragging = draggingOver === tahap.id

                  return (
                    <div key={tahap.id} className="p-5 space-y-4">
                      {/* Tahap label */}
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{tahap.label}</p>
                          <p className="text-[10px] font-mono text-slate-400 mt-0.5">{tahap.id}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {images.length > 0 && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs gap-1"
                              onClick={() => copyAllMdx(tahap.id, tahap.label)}
                            >
                              <Copy className="w-3 h-3" /> Salin Semua MDX
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={isUploading}
                            className="h-7 text-xs gap-1"
                            onClick={() => fileInputRefs.current[tahap.id]?.click()}
                          >
                            {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                            Tambah Foto
                          </Button>
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            multiple
                            className="hidden"
                            ref={el => { fileInputRefs.current[tahap.id] = el }}
                            onChange={e => {
                              const files = Array.from(e.target.files ?? [])
                              if (files.length) uploadFiles(tahap.id, files)
                              e.target.value = ''
                            }}
                          />
                        </div>
                      </div>

                      {/* Drop zone + image grid */}
                      <div
                        className={`rounded-xl border-2 border-dashed transition-all p-3 min-h-[80px] flex flex-wrap gap-3 items-start
                          ${isDragging ? 'border-[#7a1200] bg-rose-50/40' : images.length ? 'border-slate-100 bg-slate-50/50' : 'border-slate-200 bg-slate-50'}`}
                        onDragOver={e => { e.preventDefault(); setDraggingOver(tahap.id) }}
                        onDragLeave={() => setDraggingOver(null)}
                        onDrop={handleDrop(tahap.id)}
                      >
                        {images.length === 0 && !isUploading && (
                          <div
                            className="flex-1 flex flex-col items-center justify-center gap-2 cursor-pointer py-4"
                            onClick={() => fileInputRefs.current[tahap.id]?.click()}
                          >
                            <ImageIcon className="w-6 h-6 text-slate-300" />
                            <p className="text-xs text-slate-400 font-medium">
                              {isDragging ? 'Lepas untuk upload' : 'Klik atau drag & drop gambar di sini'}
                            </p>
                          </div>
                        )}

                        {isUploading && (
                          <div className="flex items-center gap-2 text-xs text-slate-500 py-2 px-3">
                            <Loader2 className="w-4 h-4 animate-spin" /> Mengupload...
                          </div>
                        )}

                        {images.map((img, idx) => (
                          <div key={img.uid} className="relative group w-36 flex-shrink-0">
                            {/* Preview */}
                            <div className="aspect-video rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                              <img src={img.previewUrl} alt={img.filename} className="w-full h-full object-cover" />
                            </div>
                            {/* Index badge */}
                            <span className="absolute top-1 left-1 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                              #{idx + 1}
                            </span>
                            {/* Remove btn */}
                            <button
                              onClick={() => removeImage(tahap.id, img.uid)}
                              className="absolute top-1 right-1 bg-white/80 backdrop-blur rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity text-slate-600 hover:text-rose-600"
                            >
                              <X className="w-3 h-3" />
                            </button>
                            {/* Action row */}
                            <div className="flex gap-1 mt-1.5">
                              <button
                                title="Salin MDX tag"
                                onClick={() => copyText(`![${tahap.label} - Screenshot ${idx + 1}](${img.url})`, 'MDX tag')}
                                className="flex-1 bg-slate-900 text-emerald-400 font-mono text-[9px] rounded px-1.5 py-1 truncate hover:bg-slate-800 transition-colors text-left"
                              >
                                Salin MDX #{idx + 1}
                              </button>
                              <button
                                title="Buka di tab baru"
                                onClick={() => window.open(img.url, '_blank')}
                                className="bg-slate-100 hover:bg-slate-200 rounded p-1 text-slate-500 transition-colors"
                              >
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}

                        {/* Add more tile (if already has images) */}
                        {images.length > 0 && (
                          <div
                            onClick={() => fileInputRefs.current[tahap.id]?.click()}
                            className="w-36 flex-shrink-0 aspect-video rounded-lg border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-1 cursor-pointer hover:border-[#7a1200] hover:bg-rose-50/30 transition-all group"
                          >
                            <Plus className="w-4 h-4 text-slate-300 group-hover:text-[#7a1200]" />
                            <span className="text-[9px] text-slate-400 group-hover:text-[#7a1200]">Tambah</span>
                          </div>
                        )}
                      </div>

                      {/* MDX snippets list */}
                      {images.length > 0 && (
                        <div className="space-y-1">
                          {images.map((img, idx) => (
                            <button
                              key={img.uid}
                              onClick={() => copyText(`![${tahap.label} - Screenshot ${idx + 1}](${img.url})`, 'MDX tag')}
                              className="w-full text-left bg-slate-900 text-emerald-400 font-mono text-[10px] rounded-lg px-3 py-2 hover:bg-slate-800 transition-colors flex items-center gap-2"
                            >
                              <Check className="w-3 h-3 flex-shrink-0 text-emerald-500" />
                              <span className="truncate">{`![${tahap.label} - Screenshot ${idx + 1}](${img.url})`}</span>
                              <Copy className="w-3 h-3 flex-shrink-0 text-slate-500 ml-auto" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}

      {/* Guide */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white space-y-2">
        <p className="text-sm font-bold text-slate-300">Cara pakai</p>
        <ol className="text-xs text-slate-400 space-y-1 list-decimal list-inside">
          <li>Upload gambar ke tahap yang sesuai (bisa langsung banyak sekaligus).</li>
          <li>Klik snippet <span className="text-emerald-400 font-mono">MDX #n</span> di bawah gambar untuk menyalin tag.</li>
          <li>Paste tag tersebut ke <span className="text-emerald-400 font-mono">pages/roles.mdx</span> di bawah paragraf tahap yang sesuai.</li>
        </ol>
      </div>
    </div>
  )
}
