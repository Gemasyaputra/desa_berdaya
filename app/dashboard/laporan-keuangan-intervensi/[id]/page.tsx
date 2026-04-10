'use client'

import { useEffect, useState, use } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  ArrowLeft, 
  Receipt, 
  Calendar, 
  Tag, 
  User, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Upload,
  ExternalLink,
  Loader2,
  FileText,
  X,
  Trash2
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getDetailLaporanKeuangan, uploadBuktiCA, verifyCA, updateCatatanRelawan, deleteBuktiCA, uploadBuktiPengembalian, deleteBuktiPengembalian, tolakBuktiPengembalian, verifyPengembalian } from '../actions'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogTitle, DialogHeader, DialogDescription } from '@/components/ui/dialog'

export default function LaporanKeuanganDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [uploadingId, setUploadingId] = useState<number | null>(null)
  const [verifyingId, setVerifyingId] = useState<number | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const [detailAnggaran, setDetailAnggaran] = useState<any>(null)
  const [caUploadDialog, setCaUploadDialog] = useState<{ open: boolean, anggaranId: number | null }>({ open: false, anggaranId: null })
  const [caDeskripsi, setCaDeskripsi] = useState('')
  const [caNominal, setCaNominal] = useState('')
  const [caFiles, setCaFiles] = useState<File[]>([])
  const [rejectDialog, setRejectDialog] = useState<{ open: boolean, anggaranId: number | null, entryId: string | null }>({ open: false, anggaranId: null, entryId: null })
  const [rejectReason, setRejectReason] = useState('')

  const [pengUploadDialog, setPengUploadDialog] = useState<{ open: boolean, anggaranId: number | null }>({ open: false, anggaranId: null })
  const [pengDeskripsi, setPengDeskripsi] = useState('')
  const [pengNominal, setPengNominal] = useState('')
  const [pengFiles, setPengFiles] = useState<File[]>([])
  const [rejectPengDialog, setRejectPengDialog] = useState<{ open: boolean, anggaranId: number | null, entryId: string | null }>({ open: false, anggaranId: null, entryId: null })
  const [rejectPengReason, setRejectPengReason] = useState('')

  const isImage = (url: string) => /\.(jpeg|jpg|gif|png|webp|avif)/i.test(url)
  
  const router = useRouter()
  const { data: session } = useSession()
  const user = session?.user as any
  const isAdminOrFinance = user?.role === 'ADMIN' || user?.role === 'FINANCE' || user?.role === 'MONEV'

  useEffect(() => {
    loadData()
  }, [id])

  async function loadData() {
    try {
      const res = await getDetailLaporanKeuangan(parseInt(id))
      setData(res)
    } catch (e) {
      console.error(e)
      toast.error('Gagal memuat data')
    } finally {
      setLoading(false)
    }
  }

  const handleCustomUpload = async () => {
    if (!caUploadDialog.anggaranId) return
    if (!caDeskripsi.trim()) return toast.error('Isi deskripsi terlebih dahulu')
    if (!caNominal || isNaN(Number(caNominal))) return toast.error('Isi nominal dengan benar')
    if (caFiles.length === 0) return toast.error('Pilih minimal 1 gambar/file')

    const nominalValue = Number(caNominal)
    setUploadingId(caUploadDialog.anggaranId)
    const formData = new FormData()
    for (const f of caFiles) formData.append('files', f)

    try {
      await uploadBuktiCA(caUploadDialog.anggaranId, caDeskripsi, nominalValue, formData)
      toast.success('Bukti CA berhasil di-upload')
      setCaUploadDialog({ open: false, anggaranId: null })
      setCaDeskripsi('')
      setCaNominal('')
      setCaFiles([])
      
      const freshData = await import('../actions').then(m => m.getDetailLaporanKeuangan(parseInt(id)))
      setData(freshData)
      if (detailAnggaran && detailAnggaran.id === caUploadDialog.anggaranId) {
        const freshAnggaran = (freshData as any).anggaran?.find((a: any) => a.id === detailAnggaran.id)
        if (freshAnggaran) setDetailAnggaran(freshAnggaran)
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal upload file')
    } finally {
      setUploadingId(null)
    }
  }

  const handleDeleteFoto = async (anggaranId: number, entryId: string, urlToDelete?: string) => {
    if (!confirm('Hapus item ini?')) return
    try {
      await deleteBuktiCA(anggaranId, entryId, urlToDelete)
      toast.success('Item berhasil dihapus')
      
      const freshData = await import('../actions').then(m => m.getDetailLaporanKeuangan(parseInt(id)))
      setData(freshData)
      if (detailAnggaran && detailAnggaran.id === anggaranId) {
        const freshAnggaran = (freshData as any).anggaran?.find((a: any) => a.id === detailAnggaran.id)
        if (freshAnggaran) setDetailAnggaran(freshAnggaran)
      }
    } catch (err: any) {
      toast.error('Gagal menghapus item')
    }
  }

  const handleRejectCA = async () => {
    if (!rejectDialog.anggaranId || !rejectDialog.entryId) return
    if (!rejectReason.trim()) return toast.error('Alasan penolakan harus diisi')
    
    try {
      await import('../actions').then(m => m.tolakBuktiCA(rejectDialog.anggaranId!, rejectDialog.entryId!, rejectReason))
      toast.success('Laporan CA ditolak')
      setRejectDialog({ open: false, anggaranId: null, entryId: null })
      setRejectReason('')
      
      const freshData = await import('../actions').then(m => m.getDetailLaporanKeuangan(parseInt(id)))
      setData(freshData)
      if (detailAnggaran && detailAnggaran.id === rejectDialog.anggaranId) {
        const freshAnggaran = (freshData as any).anggaran?.find((a: any) => a.id === detailAnggaran.id)
        if (freshAnggaran) setDetailAnggaran(freshAnggaran)
      }
    } catch (err: any) {
      toast.error('Gagal menolak item')
    }
  }

  const handleVerify = async (anggaranId: number, status: any, catatan: string) => {
    setVerifyingId(anggaranId)
    try {
      await verifyCA(anggaranId, status, catatan)
      toast.success('Status verifikasi diperbarui')
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Gagal memperbarui status')
    } finally {
      setVerifyingId(null)
    }
  }

  const handleUpdateCatatan = async (anggaranId: number, catatan: string) => {
    try {
      await updateCatatanRelawan(anggaranId, catatan)
      toast.success('Catatan disimpan')
    } catch (err: any) {
      toast.error('Gagal menyimpan catatan')
    }
  }

  const handlePengembalianUpload = async () => {
    if (!pengUploadDialog.anggaranId) return
    if (!pengDeskripsi.trim()) return toast.error('Isi deskripsi terlebih dahulu')
    if (!pengNominal || isNaN(Number(pengNominal))) return toast.error('Isi nominal dengan benar')
    if (pengFiles.length === 0) return toast.error('Pilih minimal 1 gambar/file')

    const nominalValue = Number(pengNominal)
    setUploadingId(pengUploadDialog.anggaranId)
    const formData = new FormData()
    for (const f of pengFiles) formData.append('files', f)

    try {
      await uploadBuktiPengembalian(pengUploadDialog.anggaranId, pengDeskripsi, nominalValue, formData)
      toast.success('Bukti Pengembalian berhasil di-upload')
      setPengUploadDialog({ open: false, anggaranId: null })
      setPengDeskripsi('')
      setPengNominal('')
      setPengFiles([])
      
      const freshData = await import('../actions').then(m => m.getDetailLaporanKeuangan(parseInt(id)))
      setData(freshData)
      if (detailAnggaran && detailAnggaran.id === pengUploadDialog.anggaranId) {
        const freshAnggaran = (freshData as any).anggaran?.find((a: any) => a.id === detailAnggaran.id)
        if (freshAnggaran) setDetailAnggaran(freshAnggaran)
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal upload file')
    } finally {
      setUploadingId(null)
    }
  }

  const handleDeletePengembalianFoto = async (anggaranId: number, entryId: string, urlToDelete?: string) => {
    if (!confirm('Hapus item ini?')) return
    try {
      await deleteBuktiPengembalian(anggaranId, entryId, urlToDelete)
      toast.success('Item berhasil dihapus')
      
      const freshData = await import('../actions').then(m => m.getDetailLaporanKeuangan(parseInt(id)))
      setData(freshData)
      if (detailAnggaran && detailAnggaran.id === anggaranId) {
        const freshAnggaran = (freshData as any).anggaran?.find((a: any) => a.id === detailAnggaran.id)
        if (freshAnggaran) setDetailAnggaran(freshAnggaran)
      }
    } catch (err: any) {
      toast.error('Gagal menghapus item')
    }
  }

  const handleRejectPengembalian = async () => {
    if (!rejectPengDialog.anggaranId || !rejectPengDialog.entryId) return
    if (!rejectPengReason.trim()) return toast.error('Alasan penolakan harus diisi')
    
    try {
      await import('../actions').then(m => m.tolakBuktiPengembalian(rejectPengDialog.anggaranId!, rejectPengDialog.entryId!, rejectPengReason))
      toast.success('Laporan Pengembalian ditolak')
      setRejectPengDialog({ open: false, anggaranId: null, entryId: null })
      setRejectPengReason('')
      
      const freshData = await import('../actions').then(m => m.getDetailLaporanKeuangan(parseInt(id)))
      setData(freshData)
      if (detailAnggaran && detailAnggaran.id === rejectPengDialog.anggaranId) {
        const freshAnggaran = (freshData as any).anggaran?.find((a: any) => a.id === detailAnggaran.id)
        if (freshAnggaran) setDetailAnggaran(freshAnggaran)
      }
    } catch (err: any) {
      toast.error('Gagal menolak item')
    }
  }

  const handleVerifyPengembalian = async (anggaranId: number, status: any, catatan: string) => {
    setVerifyingId(anggaranId)
    try {
      await verifyPengembalian(anggaranId, status, catatan)
      toast.success('Status pengembalian berhasil diupdate')
      const freshData = await import('../actions').then(m => m.getDetailLaporanKeuangan(parseInt(id)))
      setData(freshData)
      if (detailAnggaran && detailAnggaran.id === anggaranId) {
        const freshAnggaran = (freshData as any).anggaran?.find((a: any) => a.id === detailAnggaran.id)
        if (freshAnggaran) setDetailAnggaran(freshAnggaran)
      }
    } catch (err: any) {
      toast.error(err.message || 'Gagal verifikasi pengembalian')
    } finally {
      setVerifyingId(null)
    }
  }



  const getRealisasiAndSisa = (a: any) => {
    let realisasi = 0;
    if (a.bukti_ca_url && a.status_ca === 'DIVERIFIKASI') {
      try {
        const entries = JSON.parse(a.bukti_ca_url);
        realisasi = entries.filter((e: any) => !e.ditolak).reduce((acc: number, val: any) => acc + (Number(val.nominal) || 0), 0);
      } catch {}
    }
    
    let pengembalian = 0;
    if (a.bukti_pengembalian_url && a.status_pengembalian === 'DIVERIFIKASI') {
      try {
        const entries = JSON.parse(a.bukti_pengembalian_url);
        pengembalian = entries.filter((e: any) => !e.ditolak).reduce((acc: number, val: any) => acc + (Number(val.nominal) || 0), 0);
      } catch {}
    }

    const cair = parseInt(a.anggaran_dicairkan) || 0;
    const sisa = cair - realisasi - pengembalian;
    return { realisasi, sisa, pengembalian };
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Loader2 className="w-12 h-12 text-[#008784] animate-spin" />
      <p className="font-bold text-slate-500">Memuat detail keuangan...</p>
    </div>
  )

  const { header, anggaran } = data
  const uploadedCount = anggaran.filter((a: any) => a.status_ca !== 'BELUM').length
  const totalCount = anggaran.length

  
  const BuktiPengembalianUploader = ({ a, compact = false }: { a: any, compact?: boolean }) => {
    if (!a) return null

    let entries: any[] = []
    if (a.bukti_pengembalian_url) {
      try {
        if (a.bukti_pengembalian_url.trim().startsWith('[')) {
          entries = JSON.parse(a.bukti_pengembalian_url)
        } else {
          entries = []
        }
      } catch {
        entries = []
      }
    }

    if (compact) {
      if (entries.length === 0) {
        return (
          <div className="flex flex-col gap-2 w-full max-w-[140px] mx-auto">
            {!isAdminOrFinance ? (
              <div 
                className="text-[10px] font-black text-rose-500 bg-rose-50 py-2.5 px-3 rounded-xl cursor-pointer hover:bg-rose-100 transition-all text-center flex items-center justify-center gap-2 uppercase tracking-wide border border-rose-200"
                onClick={(e) => { e.stopPropagation(); setPengUploadDialog({ open: true, anggaranId: a.id }) }}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload Refund
              </div>
            ) : (
              <div className="text-[10px] font-bold text-slate-400 py-2.5 px-3 rounded-xl text-center uppercase tracking-wide border border-dashed border-slate-200 bg-white">
                Belum Refund
              </div>
            )}
          </div>
        )
      }

      const hasRejected = entries.some((e: any) => e.ditolak)
      const isVerified = a.status_pengembalian === 'DIVERIFIKASI'
      
      let colorClass = 'text-amber-600 bg-amber-50 hover:bg-amber-100 border-amber-200'
      if (isVerified) {
        colorClass = 'text-[#008784] bg-[#008784]/10 hover:bg-[#008784]/20 border-[#008784]/20'
      }

      return (
        <div className="flex flex-col gap-2 w-full max-w-[140px] mx-auto">
          <div className="relative">
            <div 
              className={`text-[10px] font-black py-2.5 px-3 rounded-xl cursor-pointer transition-all text-center flex items-center justify-center gap-2 uppercase tracking-wide border ${colorClass}`}
              onClick={(e) => { e.stopPropagation(); setDetailAnggaran(a); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            >
              <FileText className="w-3.5 h-3.5" />
              {entries.length} Bukti Refund
            </div>
            {hasRejected && (
              <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-white animate-pulse shadow-sm" title="Ada Laporan yang Ditolak!" />
            )}
          </div>
          {(!isAdminOrFinance && !isVerified) && (
            <button
              onClick={(e) => { e.stopPropagation(); setPengUploadDialog({ open: true, anggaranId: a.id }) }}
              className="text-[9px] font-bold text-slate-500 hover:text-[#008784] py-1.5 text-center w-full rounded-lg border border-dashed border-slate-300 hover:bg-[#008784]/5 transition-colors uppercase tracking-widest mt-1"
            >
              + Tambah Refund
            </button>
          )}
        </div>
      )
    }

    return (
      <div className="flex flex-col gap-3 w-full max-w-[200px]">
        {entries.length > 0 ? (
          <>
            {entries.map((entry: any) => (
              <div key={entry.id} className={`bg-slate-50 border rounded-lg p-3 text-left shadow-sm ${entry.ditolak ? 'border-rose-200 bg-rose-50/50' : 'border-slate-100'}`}>
                {entry.ditolak && (
                  <div className="mb-3 p-2.5 bg-rose-100/50 text-rose-700 text-[10px] rounded border border-rose-200">
                    <span className="font-bold block mb-0.5 uppercase tracking-wide">Ditolak Admin/Finance:</span>
                    <span className="italic leading-tight">{entry.alasan_tolak}</span>
                  </div>
                )}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className={`text-[10px] font-bold truncate min-w-0 ${entry.ditolak ? 'text-rose-700/70 line-through' : 'text-slate-700'}`} title={entry.deskripsi}>{entry.deskripsi}</div>
                  <div className="flex items-center gap-0.5">
                    {isAdminOrFinance && !entry.ditolak && (
                      <button onClick={(e) => { e.stopPropagation(); setRejectPengDialog({ open: true, anggaranId: a.id, entryId: entry.id }) }} className="text-slate-400 hover:text-amber-500 transition-colors p-1 rounded-md flex-shrink-0" title="Tolak Laporan">
                        <AlertCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {(!isAdminOrFinance && a.status_pengembalian !== 'DIVERIFIKASI') && (
                      <button onClick={(e) => { e.stopPropagation(); handleDeletePengembalianFoto(a.id, entry.id) }} className="text-slate-300 hover:text-rose-500 transition-colors p-1 rounded-md flex-shrink-0" title="Hapus Laporan Ini">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                {entry.nominal !== undefined && (
                  <div className={`text-[11px] font-black mb-2 border-b pb-1.5 ${entry.ditolak ? 'text-rose-700/70 border-rose-100/50 line-through' : 'text-[#008784] border-emerald-100/50'}`}>
                    Rp {Number(entry.nominal).toLocaleString('id-ID')}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {entry.urls.map((u: string) => (
                    <div key={u} className="relative group w-10 h-10">
                      {isImage(u) ? (
                        <img src={u} onClick={(e) => { e.stopPropagation(); setPreviewImage(u) }} className="w-full h-full object-cover rounded-md cursor-pointer border border-slate-200" alt="Bukti Refund" />
                      ) : (
                        <a href={u} target="_blank" onClick={(e) => e.stopPropagation()} className="w-full h-full bg-[#008784]/10 text-[#008784] rounded flex items-center justify-center">
                          <FileText className="w-4 h-4" />
                        </a>
                      )}
                      {(!isAdminOrFinance && a.status_pengembalian !== 'DIVERIFIKASI') && (
                        <button onClick={(e) => { e.stopPropagation(); handleDeletePengembalianFoto(a.id, entry.id, u) }} className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm"><X className="w-3 h-3"/></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {(!isAdminOrFinance && a.status_pengembalian !== 'DIVERIFIKASI') && (
              <button
                onClick={(e) => { e.stopPropagation(); setPengUploadDialog({ open: true, anggaranId: a.id }) }}
                className="text-[10px] font-bold text-slate-500 hover:text-[#008784] py-2 text-center w-full rounded-lg border border-dashed border-slate-300 hover:bg-[#008784]/5 transition-colors uppercase tracking-widest mt-1"
              >
                + Tambah Refund
              </button>
            )}
          </>
        ) : (
          <>
            {!isAdminOrFinance ? (
              <div
                onClick={(e) => { e.stopPropagation(); setPengUploadDialog({ open: true, anggaranId: a.id }) }}
                className="p-4 border-2 border-dashed border-slate-200 rounded-xl hover:border-[#008784] hover:bg-[#008784]/5 transition-all text-center flex justify-center cursor-pointer items-center min-h-[80px]"
              >
                {uploadingId === a.id ? <Loader2 className="w-6 h-6 animate-spin text-[#008784]" /> : <Upload className="w-6 h-6 text-slate-300" />}
              </div>
            ) : (
              <div className="p-4 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50 text-slate-400 text-xs text-center flex justify-center items-center min-h-[80px] font-bold uppercase tracking-widest">
                Belum Upload
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  const BuktiCAUploader = ({ a, compact = false }: { a: any, compact?: boolean }) => {
    if (!a) return null

    let entries: any[] = []
    if (a.bukti_ca_url) {
      try {
        if (a.bukti_ca_url.trim().startsWith('[')) {
          entries = JSON.parse(a.bukti_ca_url)
        } else {
          entries = [{ id: 'legacy', deskripsi: 'Upload Sebelumnya', urls: a.bukti_ca_url.split(',').filter(Boolean) }]
        }
      } catch {
        entries = [{ id: 'legacy', deskripsi: 'Upload Sebelumnya', urls: a.bukti_ca_url.split(',').filter(Boolean) }]
      }
    }

    if (compact) {
      if (entries.length === 0) {
        return (
          <div className="flex flex-col gap-2 w-full max-w-[140px] mx-auto">
            {!isAdminOrFinance ? (
              <div 
                className="text-[10px] font-black text-rose-500 bg-rose-50 py-2.5 px-3 rounded-xl cursor-pointer hover:bg-rose-100 transition-all text-center flex items-center justify-center gap-2 uppercase tracking-wide border border-rose-200"
                onClick={(e) => { e.stopPropagation(); setCaUploadDialog({ open: true, anggaranId: a.id }) }}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload CA
              </div>
            ) : (
              <div className="text-[10px] font-bold text-slate-400 py-2.5 px-3 rounded-xl text-center uppercase tracking-wide border border-dashed border-slate-200 bg-white">
                Belum Upload
              </div>
            )}
          </div>
        )
      }

      const hasRejected = entries.some(e => e.ditolak)
      const isVerified = a.status_ca === 'DIVERIFIKASI'
      
      let colorClass = 'text-amber-600 bg-amber-50 hover:bg-amber-100 border-amber-200'
      if (isVerified) {
        colorClass = 'text-[#008784] bg-[#008784]/10 hover:bg-[#008784]/20 border-[#008784]/20'
      }

      return (
        <div className="flex flex-col gap-2 w-full max-w-[140px] mx-auto">
          <div className="relative">
            <div 
              className={`text-[10px] font-black py-2.5 px-3 rounded-xl cursor-pointer transition-all text-center flex items-center justify-center gap-2 uppercase tracking-wide border ${colorClass}`}
              onClick={(e) => { e.stopPropagation(); setDetailAnggaran(a); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
            >
              <FileText className="w-3.5 h-3.5" />
              {entries.length} Laporan CA
            </div>
            {hasRejected && (
              <div className="absolute -top-1.5 -right-1.5 w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-white animate-pulse shadow-sm" title="Ada Laporan yang Ditolak!" />
            )}
          </div>
          {(!isAdminOrFinance && a.status_ca !== 'DIVERIFIKASI') && (
            <button
              onClick={(e) => { e.stopPropagation(); setCaUploadDialog({ open: true, anggaranId: a.id }) }}
              className="text-[9px] font-bold text-slate-500 hover:text-[#008784] py-1.5 text-center w-full rounded-lg border border-dashed border-slate-300 hover:bg-[#008784]/5 transition-colors uppercase tracking-widest mt-1"
            >
              + Tambah CA
            </button>
          )}
        </div>
      )
    }

    return (
      <div className="flex flex-col gap-3 w-full max-w-[200px]">
        {entries.length > 0 ? (
          <>
            {entries.map(entry => (
              <div key={entry.id} className={`bg-slate-50 border rounded-lg p-3 text-left shadow-sm ${entry.ditolak ? 'border-rose-200 bg-rose-50/50' : 'border-slate-100'}`}>
                {entry.ditolak && (
                  <div className="mb-3 p-2.5 bg-rose-100/50 text-rose-700 text-[10px] rounded border border-rose-200">
                    <span className="font-bold block mb-0.5 uppercase tracking-wide">Ditolak Admin/Finance:</span>
                    <span className="italic leading-tight">{entry.alasan_tolak}</span>
                  </div>
                )}
                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className={`text-[10px] font-bold truncate min-w-0 ${entry.ditolak ? 'text-rose-700/70 line-through' : 'text-slate-700'}`} title={entry.deskripsi}>{entry.deskripsi}</div>
                  <div className="flex items-center gap-0.5">
                    {isAdminOrFinance && !entry.ditolak && (
                      <button onClick={(e) => { e.stopPropagation(); setRejectDialog({ open: true, anggaranId: a.id, entryId: entry.id }) }} className="text-slate-400 hover:text-amber-500 transition-colors p-1 rounded-md flex-shrink-0" title="Tolak Laporan">
                        <AlertCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {(!isAdminOrFinance && a.status_ca !== 'DIVERIFIKASI') && (
                      <button onClick={(e) => { e.stopPropagation(); handleDeleteFoto(a.id, entry.id) }} className="text-slate-300 hover:text-rose-500 transition-colors p-1 rounded-md flex-shrink-0" title="Hapus Laporan Ini">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                {entry.nominal !== undefined && (
                  <div className={`text-[11px] font-black mb-2 border-b pb-1.5 ${entry.ditolak ? 'text-rose-700/70 border-rose-100/50 line-through' : 'text-[#008784] border-emerald-100/50'}`}>
                    Rp {Number(entry.nominal).toLocaleString('id-ID')}
                  </div>
                )}
                <div className="flex flex-wrap gap-2">
                  {entry.urls.map((u: string) => (
                    <div key={u} className="relative group w-10 h-10">
                      {isImage(u) ? (
                        <img src={u} onClick={(e) => { e.stopPropagation(); setPreviewImage(u) }} className="w-full h-full object-cover rounded-md cursor-pointer border border-slate-200" alt="Bukti CA" />
                      ) : (
                        <a href={u} target="_blank" onClick={(e) => e.stopPropagation()} className="w-full h-full bg-[#008784]/10 text-[#008784] rounded flex items-center justify-center">
                          <FileText className="w-4 h-4" />
                        </a>
                      )}
                      {(!isAdminOrFinance && a.status_ca !== 'DIVERIFIKASI') && (
                        <button onClick={(e) => { e.stopPropagation(); handleDeleteFoto(a.id, entry.id, u) }} className="absolute -top-1.5 -right-1.5 bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow-sm"><X className="w-3 h-3"/></button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {(!isAdminOrFinance && a.status_ca !== 'DIVERIFIKASI') && (
              <button
                onClick={(e) => { e.stopPropagation(); setCaUploadDialog({ open: true, anggaranId: a.id }) }}
                className="text-[10px] font-bold text-slate-500 hover:text-[#008784] py-2 text-center w-full rounded-lg border border-dashed border-slate-300 hover:bg-[#008784]/5 transition-colors uppercase tracking-widest mt-1"
              >
                + Tambah CA
              </button>
            )}
          </>
        ) : (
          <>
            {!isAdminOrFinance ? (
              <div
                onClick={(e) => { e.stopPropagation(); setCaUploadDialog({ open: true, anggaranId: a.id }) }}
                className="p-4 border-2 border-dashed border-slate-200 rounded-xl hover:border-[#008784] hover:bg-[#008784]/5 transition-all text-center flex justify-center cursor-pointer items-center min-h-[80px]"
              >
                {uploadingId === a.id ? <Loader2 className="w-6 h-6 animate-spin text-[#008784]" /> : <Upload className="w-6 h-6 text-slate-300" />}
              </div>
            ) : (
              <div className="p-4 border-2 border-dashed border-slate-100 rounded-xl bg-slate-50 text-slate-400 text-xs text-center flex justify-center items-center min-h-[80px] font-bold uppercase tracking-widest">
                Belum Upload
              </div>
            )}
          </>
        )}
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col gap-6">
        <Button 
          variant="ghost" 
          className="w-fit gap-2 text-slate-500 font-bold hover:bg-slate-100 rounded-xl"
          onClick={() => router.push('/dashboard/laporan-keuangan-intervensi')}
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Daftar
        </Button>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/40 border border-slate-100 flex flex-col md:flex-row justify-between gap-8 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#008784]/5 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
          
          <div className="flex-1 space-y-6 relative">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-[#008784]/10 border border-[#008784]/20 rounded-2xl flex items-center justify-center transition-transform hover:scale-105">
                <Receipt className="w-8 h-8 text-[#008784]" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">{header.nama_desa}</h1>
                <p className="text-[#008784] font-black uppercase text-xs tracking-widest mt-0.5">{header.nama_program}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="flex items-center gap-3 group">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                  <User className="w-4 h-4 text-indigo-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Relawan</p>
                  <p className="text-sm font-bold text-slate-700">{header.relawan_nama}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 group">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                  <Tag className="w-4 h-4 text-amber-500" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Sumber Dana</p>
                  <p className="text-sm font-bold text-slate-700">{header.sumber_dana || '-'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 group">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100">
                  <Calendar className="w-4 h-4 text-[#008784]" />
                </div>
                <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1.5">Tgl Dibuat</p>
                  <p className="text-sm font-bold text-slate-700">
                    {header.created_at ? new Date(header.created_at).toLocaleDateString('id-ID') : '-'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-50/80 p-6 rounded-[2rem] border border-slate-100 min-w-[240px] flex flex-col justify-center gap-4 relative">
            <div className="space-y-1.5">
              <div className="flex justify-between items-end px-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Progress CA</span>
                <span className="text-sm font-black text-[#008784]">{uploadedCount}/{totalCount}</span>
              </div>
              <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#008784]"
                  style={{ width: `${(uploadedCount/totalCount)*100}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Card className="border-none shadow-2xl shadow-slate-200/40 rounded-[2.5rem] overflow-hidden bg-white">
        <CardHeader className="border-b border-slate-100 px-8 py-6">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Receipt className="w-5 h-5 text-[#008784]" />
            Daftar Anggaran & Bukti CA
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {/* MOBILE VIEW */}
          <div className="md:hidden divide-y divide-slate-100">
             {anggaran.map((a: any) => {
                const rowBgClass = a.status_ca === 'DIVERIFIKASI' ? 'bg-emerald-50/20 hover:bg-emerald-50/50' : a.status_ca === 'UPLOADED' ? 'bg-amber-50/20 hover:bg-amber-50/50' : 'bg-rose-50/20 hover:bg-rose-50/50';
                return (
                  <div key={a.id} className={`p-6 space-y-4 cursor-pointer transition-colors group/card ${rowBgClass}`} onClick={(e) => {
                    if ((e.target as HTMLElement).closest('button, input, textarea, a')) return;
                  setDetailAnggaran(a);
                }}>
                  <div className="flex justify-between items-start">
                    <div className="text-left outline-none">
                      <div className="font-black text-slate-800 transition-colors flex items-center gap-2 group-hover/card:text-[#008784]">
                        {a.bulan}
                        <ExternalLink className="w-3 h-3 opacity-0 group-hover/card:opacity-100 transition-opacity" />
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 transition-colors group-hover/card:text-[#008784]/60">{a.tahun}</div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      {a.status_ca === 'DIVERIFIKASI' ? (
                        <Badge className="bg-emerald-100 text-emerald-700 text-[9px]">DIVERIFIKASI</Badge>
                      ) : a.status_ca === 'UPLOADED' ? (
                        <Badge className="bg-amber-100 text-amber-700 text-[9px]">UPLOADED</Badge>
                      ) : (
                        <Badge className="bg-slate-100 text-slate-500 text-[9px]">BELUM</Badge>
                      )}
                    </div>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl text-xs space-y-2 border border-slate-100">
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Ajuan:</span>
                      <span className="font-bold">Rp {parseInt(a.ajuan_ri).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Cair:</span>
                      <span className="font-black text-[#008784]">Rp {parseInt(a.anggaran_dicairkan).toLocaleString('id-ID')}</span>
                    </div>
                    {(() => {
                      const { realisasi, sisa } = getRealisasiAndSisa(a);
                      return (
                        <>
                          <div className="flex justify-between gap-4 pt-2 mt-2 border-t border-slate-200">
                            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Realisasi:</span>
                            <span className="font-bold text-amber-600">Rp {realisasi.toLocaleString('id-ID')}</span>
                          </div>
                          <div className="flex justify-between gap-4">
                            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Sisa Saldo:</span>
                            <span className={`font-black ${sisa < 0 ? 'text-rose-600' : 'text-slate-700'}`}>Rp {sisa.toLocaleString('id-ID')}</span>
                          </div>
                        </>
                      );
                    })()}
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="shrink-0 min-w-[140px] flex flex-col gap-4 justify-center">
                       <BuktiCAUploader a={a} />
                       <BuktiPengembalianUploader a={a} />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      <textarea 
                        className="w-full text-xs p-2 bg-slate-50 border border-slate-100 rounded-lg min-h-[50px] resize-none"
                        defaultValue={a.catatan_ca || ''}
                        id={`note-mob-${a.id}`}
                        onBlur={(e) => !isAdminOrFinance && handleUpdateCatatan(a.id, e.target.value)}
                        placeholder="Catatan..."
                      />
                      {isAdminOrFinance && (
                        <div className="flex gap-1 flex-col">
                          <Button 
                            size="sm" 
                            className={`h-8 rounded-lg text-[10px] font-bold transition-all ${a.status_ca === 'DIVERIFIKASI' ? 'bg-emerald-50 text-emerald-700 pointer-events-none shadow-none border border-emerald-100' : 'bg-[#008784] hover:bg-[#007370] text-white'}`}
                            onClick={() => {
                              const note = (document.getElementById(`note-mob-${a.id}`) as HTMLTextAreaElement).value
                              handleVerify(a.id, 'DIVERIFIKASI', note)
                            }}
                            disabled={!a.bukti_ca_url || verifyingId === a.id}
                          >
                            {verifyingId === a.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle2 className={`w-3 h-3 mr-1 ${a.status_ca === 'DIVERIFIKASI' ? 'text-emerald-500' : ''}`} />} 
                            {a.status_ca === 'DIVERIFIKASI' ? 'Diverifikasi CA' : 'Verif CA'}
                          </Button>
                          {a.status_ca === 'DIVERIFIKASI' && (
                            <Button variant="ghost" className="h-6 text-[9px] text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg" onClick={() => handleVerify(a.id, 'UPLOADED', '')}>Batalkan</Button>
                          )}
                          {/* Approve Refund */}
                          {a.bukti_pengembalian_url && (
                            <>
                              <div className="border-t border-slate-100 my-1" />
                              <Button 
                                size="sm" 
                                className={`h-8 rounded-lg text-[10px] font-bold transition-all ${
                                  a.status_pengembalian === 'DIVERIFIKASI'
                                    ? 'bg-indigo-50 text-indigo-700 pointer-events-none shadow-none border border-indigo-100'
                                    : 'bg-rose-500 hover:bg-rose-600 text-white'
                                }`}
                                onClick={() => handleVerifyPengembalian(a.id, 'DIVERIFIKASI', '')}
                                disabled={verifyingId === a.id}
                              >
                                {verifyingId === a.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                                {a.status_pengembalian === 'DIVERIFIKASI' ? 'Approved Refund' : 'Approve Refund'}
                              </Button>
                              {a.status_pengembalian === 'DIVERIFIKASI' && (
                                <Button variant="ghost" className="h-6 text-[9px] text-slate-400 hover:bg-slate-50 rounded-lg" onClick={() => handleVerifyPengembalian(a.id, 'UPLOADED', '')}>Batalkan</Button>
                              )}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
             })}
          </div>

          {/* DESKTOP VIEW */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/80 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-5">Bulan</th>
                  <th className="px-8 py-5">Anggaran</th>
                  <th className="px-8 py-5 text-center">Bukti CA</th>
                  <th className="px-8 py-5 text-center">Pengembalian</th>
                  <th className="px-8 py-5 text-center">Status</th>
                  <th className="px-8 py-5">Catatan/Feedback</th>
                  {isAdminOrFinance && <th className="px-8 py-5 text-center">Verifikasi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {anggaran.map((a: any) => {
                  const rowBgClass = a.status_ca === 'DIVERIFIKASI' ? 'bg-emerald-50/30 hover:bg-emerald-50/70 border-b border-emerald-100/50' : a.status_ca === 'UPLOADED' ? 'bg-amber-50/30 hover:bg-amber-50/70 border-b border-amber-100/50' : 'bg-rose-50/20 hover:bg-rose-50/60 border-b border-rose-100/50';
                  return (
                    <tr key={a.id} className={`transition-colors cursor-pointer group/row ${rowBgClass}`} onClick={(e) => {
                      if ((e.target as HTMLElement).closest('button, input, textarea, a')) return;
                    setDetailAnggaran(a);
                  }}>
                    <td className="px-8 py-6">
                      <div className="text-left outline-none">
                        <div className="font-black text-slate-800 transition-colors flex items-center gap-2 group-hover/row:text-[#008784]">
                          {a.bulan}
                          <ExternalLink className="w-3 h-3 opacity-0 group-hover/row:opacity-100 transition-opacity" />
                        </div>
                        <div className="text-[10px] font-bold text-slate-400 transition-colors group-hover/row:text-[#008784]/60">{a.tahun}</div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-xs space-y-1.5 min-w-[150px]">
                        <div className="flex justify-between gap-2">
                          <span className="text-slate-400">Ajuan:</span>
                          <span className="font-bold">Rp {parseInt(a.ajuan_ri).toLocaleString('id-ID')}</span>
                        </div>
                        <div className="flex justify-between gap-2">
                          <span className="text-slate-400">Cair:</span>
                          <span className="font-black text-[#008784]">Rp {parseInt(a.anggaran_dicairkan).toLocaleString('id-ID')}</span>
                        </div>
                        {(() => {
                          const { realisasi, sisa } = getRealisasiAndSisa(a);
                          return (
                            <>
                              <div className="flex justify-between gap-2 border-t border-slate-100 pt-1.5 mt-1">
                                <span className="text-slate-400">Realisasi:</span>
                                <span className="font-bold text-amber-600">Rp {realisasi.toLocaleString('id-ID')}</span>
                              </div>
                              <div className="flex justify-between gap-2">
                                <span className="text-slate-400">Sisa Saldo:</span>
                                <span className={`font-black tracking-tight ${sisa < 0 ? 'text-rose-600' : 'text-slate-700'}`}>Rp {sisa.toLocaleString('id-ID')}</span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center align-top">
                      <BuktiCAUploader a={a} compact={true} />
                    </td>
                    <td className="px-8 py-6 text-center align-top">
                      <BuktiPengembalianUploader a={a} compact={true} />
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col items-center gap-1">
                        {a.status_ca === 'DIVERIFIKASI' ? (
                          <Badge className="bg-emerald-100 text-emerald-700 text-[9px]">DIVERIFIKASI</Badge>
                        ) : a.status_ca === 'UPLOADED' ? (
                          <Badge className="bg-amber-100 text-amber-700 text-[9px]">UPLOADED</Badge>
                        ) : (
                          <Badge className="bg-slate-100 text-slate-500 text-[9px]">BELUM</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <textarea 
                        className="w-full text-xs p-2 bg-slate-50 border border-slate-100 rounded-lg min-h-[50px] resize-none"
                        defaultValue={a.catatan_ca || ''}
                        id={`note-${a.id}`}
                        onBlur={(e) => !isAdminOrFinance && handleUpdateCatatan(a.id, e.target.value)}
                        placeholder="Catatan..."
                      />
                    </td>
                    {isAdminOrFinance && (
                      <td className="px-8 py-6 text-center align-top">
                        <div className="flex flex-col gap-2 min-w-[110px]">
                          {/* Verif CA */}
                          <Button 
                            size="sm" 
                            className={`h-8 rounded-lg text-[10px] font-bold transition-all ${a.status_ca === 'DIVERIFIKASI' ? 'bg-emerald-50 text-emerald-700 pointer-events-none shadow-none border border-emerald-100' : 'bg-[#008784] hover:bg-[#007370] text-white'}`}
                            onClick={() => {
                              const note = (document.getElementById(`note-${a.id}`) as HTMLTextAreaElement).value
                              handleVerify(a.id, 'DIVERIFIKASI', note)
                            }}
                            disabled={!a.bukti_ca_url || verifyingId === a.id}
                          >
                            {verifyingId === a.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle2 className={`w-3 h-3 mr-1 ${a.status_ca === 'DIVERIFIKASI' ? 'text-emerald-500' : ''}`} />}
                            {a.status_ca === 'DIVERIFIKASI' ? 'Verified CA' : 'Verif CA'}
                          </Button>
                          {a.status_ca === 'DIVERIFIKASI' && (
                            <Button variant="ghost" className="h-6 text-[9px] text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg" onClick={() => handleVerify(a.id, 'UPLOADED', '')}>Batalkan</Button>
                          )}
                          {/* Verif Refund — hanya tampil jika ada bukti pengembalian */}
                          {a.bukti_pengembalian_url && (
                            <>
                              <div className="border-t border-slate-100 my-1" />
                              <Button 
                                size="sm" 
                                className={`h-8 rounded-lg text-[10px] font-bold transition-all ${
                                  a.status_pengembalian === 'DIVERIFIKASI'
                                    ? 'bg-indigo-50 text-indigo-700 pointer-events-none shadow-none border border-indigo-100'
                                    : 'bg-rose-500 hover:bg-rose-600 text-white'
                                }`}
                                onClick={() => handleVerifyPengembalian(a.id, 'DIVERIFIKASI', '')}
                                disabled={verifyingId === a.id}
                              >
                                {verifyingId === a.id ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <CheckCircle2 className={`w-3 h-3 mr-1`} />}
                                {a.status_pengembalian === 'DIVERIFIKASI' ? 'Approved Refund' : 'Approve Refund'}
                              </Button>
                              {a.status_pengembalian === 'DIVERIFIKASI' && (
                                <Button variant="ghost" className="h-6 text-[9px] text-slate-400 hover:bg-slate-50 rounded-lg" onClick={() => handleVerifyPengembalian(a.id, 'UPLOADED', '')}>Batalkan</Button>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-4xl p-1 bg-transparent border-none shadow-none focus:outline-none flex justify-center">
          <DialogTitle className="sr-only">Preview Bukti CA</DialogTitle>
          {previewImage && (
            <img src={previewImage} alt="Detail Bukti CA" className="w-full h-auto max-h-[90vh] object-contain rounded-xl" />
          )}
        </DialogContent>
      </Dialog>
      <Dialog open={!!detailAnggaran} onOpenChange={(open) => !open && setDetailAnggaran(null)}>
        <DialogContent className="sm:max-w-2xl bg-white max-h-[90vh] overflow-y-auto w-[95%] border-slate-100 shadow-2xl rounded-2xl p-0 [&>button]:hidden">
          {/* Floating sticky header dengan tombol close */}
          <div className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100 px-6 py-4 flex items-start justify-between rounded-t-2xl">
            <div>
              <DialogTitle className="text-xl font-black text-slate-800">Detail Laporan {detailAnggaran?.bulan} {detailAnggaran?.tahun}</DialogTitle>
              <p className="text-xs font-bold text-slate-400 mt-0.5">Rincian data anggaran dan pencairan.</p>
            </div>
            <button
              onClick={() => setDetailAnggaran(null)}
              className="ml-4 mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-slate-100 hover:bg-rose-100 hover:text-rose-600 flex items-center justify-center transition-all text-slate-500 shadow-sm"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-6 px-6 pt-4 pb-6">
            <div>
              <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider mb-3 border-b border-slate-100 pb-2">Anggaran & Pencairan</h4>
              <div className="grid grid-cols-2 gap-4 gap-y-2 text-sm text-slate-600 mb-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div className="flex gap-2 font-medium">
                  <span className="w-32 font-bold text-slate-800">Desa Berdaya:</span> 
                  {header?.nama_desa}
                </div>
                <div className="flex gap-2 font-medium">
                  <span className="w-32 font-bold text-slate-800">Program:</span> 
                  {header?.nama_program}
                </div>
                <div className="col-span-2 flex gap-2 font-medium">
                  <span className="w-32 font-bold text-slate-800">Kategori Prog.:</span> 
                  {header?.kategori_program}
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 gap-y-6 bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
                <div>
                  <label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Tahun</label>
                  <div className="font-bold text-sm text-slate-700">{detailAnggaran?.tahun}</div>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Bulan</label>
                  <div className="font-bold text-sm text-slate-700">{detailAnggaran?.bulan}</div>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Ajuan RI</label>
                  <div className="font-bold text-sm text-slate-700">Rp {Number(detailAnggaran?.ajuan_ri).toLocaleString('id-ID')}</div>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Anggaran Disetujui</label>
                  <div className="font-bold text-sm text-slate-700">Rp {Number(detailAnggaran?.anggaran_disetujui).toLocaleString('id-ID')}</div>
                </div>
                <div className="bg-slate-50 p-2 rounded-lg -m-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Anggaran Dicairkan</label>
                  <div className="font-bold text-[15px] text-[#008784]">Rp {Number(detailAnggaran?.anggaran_dicairkan).toLocaleString('id-ID')}</div>
                </div>
                {(() => {
                  if (!detailAnggaran) return null;
                  const { realisasi, sisa } = getRealisasiAndSisa(detailAnggaran);
                  return (
                    <>
                      <div className="bg-amber-50 p-2 rounded-lg -m-2 border border-amber-100/50">
                        <label className="text-[10px] uppercase font-black tracking-widest text-amber-600/70">Total Realisasi</label>
                        <div className="font-bold text-[15px] text-amber-600">Rp {realisasi.toLocaleString('id-ID')}</div>
                      </div>
                      <div className={`p-2 rounded-lg -m-2 border ${sisa < 0 ? 'bg-rose-50 border-rose-100/50' : 'bg-slate-50 border-slate-100'}`}>
                        <label className={`text-[10px] uppercase font-black tracking-widest ${sisa < 0 ? 'text-rose-400' : 'text-slate-400'}`}>Sisa Saldo</label>
                        <div className={`font-black text-[15px] ${sisa < 0 ? 'text-rose-600' : 'text-slate-800'}`}>Rp {sisa.toLocaleString('id-ID')}</div>
                      </div>
                    </>
                  );
                })()}
                <div>
                  <label className="text-[10px] uppercase font-black tracking-widest text-slate-400">ID STP</label>
                  <div className="font-bold text-sm text-slate-700">{detailAnggaran?.id_stp || '-'}</div>
                </div>
                <div className="col-span-1 sm:col-span-2">
                  <label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Catatan</label>
                  <div className="font-medium text-sm text-slate-600 bg-slate-50 p-3 rounded-lg mt-1 border border-slate-100 min-h-[40px] whitespace-pre-wrap">{detailAnggaran?.catatan || '-'}</div>
                </div>
                <div className="col-span-1 sm:col-span-2 flex items-center gap-6 pt-2">
                   <div className="flex items-center gap-2">
                     <CheckCircle2 className={`w-5 h-5 ${detailAnggaran?.is_dbf ? 'text-[#008784]' : 'text-slate-200'}`} />
                     <span className={`text-xs font-bold ${detailAnggaran?.is_dbf ? 'text-slate-700' : 'text-slate-400'}`}>Is DBF?</span>
                   </div>
                   <div className="flex items-center gap-2">
                     <CheckCircle2 className={`w-5 h-5 ${detailAnggaran?.is_rz ? 'text-[#008784]' : 'text-slate-200'}`} />
                     <span className={`text-xs font-bold ${detailAnggaran?.is_rz ? 'text-slate-700' : 'text-slate-400'}`}>Is RZ?</span>
                   </div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider mb-3 border-b border-indigo-100 pb-2">Informasi Relawan</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-slate-700 bg-indigo-50/50 p-5 rounded-xl border border-indigo-100/50">
                <div className="space-y-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Relawan</span>
                    <span className="font-bold text-indigo-900">{header?.relawan_nama || '-'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Email</span>
                    <span className="font-medium">{header?.relawan_email || '-'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Telepon / Phone</span>
                    <span className="font-medium">{header?.relawan_telepon || '-'}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Bank Account</span>
                    <span className="font-bold">{header?.relawan_no_rekening || '-'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Nama Bank</span>
                    <span className="font-medium">{header?.relawan_nama_bank || '-'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-400">Atas Nama</span>
                    <span className="font-medium">{header?.relawan_atas_nama || '-'}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Bukti CA Section */}
            <div className="pt-2 rounded-2xl bg-emerald-50 border border-emerald-100 p-4 -mx-1">
              <div className="flex items-center gap-2 mb-4 border-b border-emerald-200/60 pb-2">
                <div className="w-1.5 h-4 rounded-full bg-emerald-400" />
                <h4 className="text-[11px] font-black uppercase text-emerald-600 tracking-wider">Bukti CA &amp; Laporan</h4>
              </div>
              <div className="flex justify-center md:justify-start">
                 <BuktiCAUploader a={detailAnggaran} />
              </div>
            </div>

            {/* Bukti Pengembalian Section - hanya tampil jika ada data */}
            {detailAnggaran?.bukti_pengembalian_url && (
              <div className="pt-2 rounded-2xl bg-rose-50 border border-rose-100 p-4 -mx-1">
                <div className="flex items-center gap-2 mb-4 border-b border-rose-200/60 pb-2">
                  <div className="w-1.5 h-4 rounded-full bg-rose-400" />
                  <h4 className="text-[11px] font-black uppercase text-rose-500 tracking-wider">Bukti Pengembalian Dana</h4>
                </div>
                <div className="flex justify-center md:justify-start">
                   <BuktiPengembalianUploader a={detailAnggaran} />
                </div>
              </div>
            )}

            <div className="flex justify-end pt-4">
               <Button variant="outline" onClick={() => setDetailAnggaran(null)} className="rounded-xl font-bold border-slate-200">
                 Tutup
               </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={caUploadDialog.open} onOpenChange={(open) => !open && setCaUploadDialog({ open: false, anggaranId: null })}>
        <DialogContent className="sm:max-w-md bg-white border-slate-100 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-800">Upload Bukti CA</DialogTitle>
            <DialogDescription className="text-xs font-bold text-slate-500">
              Isi deskripsi untuk detail laporan CA ini dan unggah foto/berkas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Deskripsi Laporan</label>
              <textarea 
                placeholder="Misal: Pembayaran kajian pagi..." 
                className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008784] min-h-[80px] resize-none"
                value={caDeskripsi}
                onChange={(e) => setCaDeskripsi(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Nominal Transaksi (Rp)</label>
              <input 
                type="number" 
                placeholder="Misal: 150000" 
                className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#008784]"
                value={caNominal}
                onChange={(e) => setCaNominal(e.target.value)}
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Foto / File (Bisa Multi)</label>
              <div className="relative group w-full">
                  <input
                    type="file"
                    multiple
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                    onChange={(e) => {
                      if (e.target.files) {
                        setCaFiles(Array.from(e.target.files))
                      }
                    }}
                  />
                  <div className="flex flex-col items-center justify-center gap-2 p-6 border-2 border-dashed border-slate-200 rounded-xl group-hover:border-[#008784] group-hover:bg-[#008784]/5 transition-all text-center">
                    <Upload className="w-6 h-6 text-slate-300 group-hover:text-[#008784] transition-colors" />
                    <span className="text-xs font-bold text-slate-500">
                      {caFiles.length > 0 ? `${caFiles.length} file dipilih` : 'Klik atau seret foto/file ke sini'}
                    </span>
                  </div>
              </div>
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100 mt-4">
              <Button variant="outline" className="rounded-xl" onClick={() => setCaUploadDialog({ open: false, anggaranId: null })}>Batal</Button>
              <Button className="bg-[#008784] hover:bg-[#007370] text-white rounded-xl" disabled={uploadingId === caUploadDialog.anggaranId} onClick={handleCustomUpload}>
                {uploadingId === caUploadDialog.anggaranId ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Simpan & Upload
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={rejectDialog.open} onOpenChange={(open) => !open && setRejectDialog({ open: false, anggaranId: null, entryId: null })}>
        <DialogContent className="sm:max-w-md bg-white border-slate-100 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-rose-600">Tolak Bukti CA</DialogTitle>
            <DialogDescription className="text-xs font-bold text-slate-500">
              Berikan alasan mengapa laporan Bukti CA ini salah atau ditolak agar relawan bisa memperbaikinya.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2 block">Alasan Penolakan</label>
              <textarea 
                placeholder="Misal: Bon kurang jelas, nominal tidak sesuai..." 
                className="w-full p-3 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500 min-h-[100px] resize-none"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
              <Button variant="outline" className="rounded-xl" onClick={() => setRejectDialog({ open: false, anggaranId: null, entryId: null })}>Batal</Button>
              <Button className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl" onClick={handleRejectCA}>Tolak Laporan</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* PENGEMBALIAN UPLOAD DIALOG */}
      <Dialog open={pengUploadDialog.open} onOpenChange={(open) => !open && setPengUploadDialog({ open: false, anggaranId: null })}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-white md:rounded-3xl rounded-2xl border-0 shadow-2xl">
          <DialogHeader className="bg-slate-50 border-b border-slate-100 px-6 py-5">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-slate-800">
              <Upload className="w-5 h-5 text-[#008784]" />
              Upload Bukti Kembalian
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Deskripsi / Keterangan</label>
              <textarea
                value={pengDeskripsi}
                onChange={e => setPengDeskripsi(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-[#008784] focus:ring-4 focus:ring-[#008784]/10 transition-all outline-none resize-none min-h-[80px]"
                placeholder="Ex: Kembalian Sisa Kegiatan"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Nominal Dikembalikan (Rp)</label>
              <input
                type="number"
                value={pengNominal}
                onChange={e => setPengNominal(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl focus:border-[#008784] focus:ring-4 focus:ring-[#008784]/10 transition-all outline-none"
                placeholder="50000"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Foto/File Bukti (Bisa Multi)</label>
              <input
                type="file"
                multiple
                accept="image/*,.pdf"
                onChange={e => setPengFiles(Array.from(e.target.files || []))}
                className="w-full px-4 py-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-black file:bg-[#008784]/10 file:text-[#008784] hover:file:bg-[#008784]/20 transition-all cursor-pointer text-sm text-slate-500"
              />
              {pengFiles.length > 0 && <span className="text-xs font-bold text-[#008784] block mt-1">{pengFiles.length} file terpilih</span>}
            </div>
            <Button
              onClick={handlePengembalianUpload}
              disabled={uploadingId === pengUploadDialog.anggaranId}
              className="w-full bg-[#008784] hover:bg-[#007370] text-white py-6 rounded-xl font-bold shadow-lg shadow-[#008784]/20"
            >
              {uploadingId === pengUploadDialog.anggaranId ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Upload className="w-5 h-5 mr-2" />}
              Upload Kembalian
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* PENGEMBALIAN REJECT DIALOG */}
      <Dialog open={rejectPengDialog.open} onOpenChange={(open) => !open && setRejectPengDialog({ open: false, anggaranId: null, entryId: null })}>
        <DialogContent className="max-w-md p-0 overflow-hidden bg-white md:rounded-3xl rounded-2xl border-0 shadow-2xl">
          <DialogHeader className="bg-rose-50 border-b border-rose-100 px-6 py-5">
            <DialogTitle className="text-xl font-bold flex items-center gap-2 text-rose-700">
              <AlertCircle className="w-5 h-5" />
              Tolak Bukti Kembalian
            </DialogTitle>
          </DialogHeader>
          <div className="p-6 space-y-5">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-rose-700/70 uppercase tracking-widest ml-1">Alasan Penolakan</label>
              <textarea
                value={rejectPengReason}
                onChange={e => setRejectPengReason(e.target.value)}
                className="w-full px-4 py-3 bg-white border border-rose-200 rounded-xl focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10 transition-all outline-none resize-none min-h-[100px] placeholder:text-rose-200"
                placeholder="Ex: Foto buram, tidak dapat terbaca..."
              />
            </div>
            <Button onClick={handleRejectPengembalian} className="w-full bg-rose-500 hover:bg-rose-600 text-white py-6 rounded-xl font-bold shadow-lg shadow-rose-500/20">
              Tolak & Minta Upload Ulang
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
