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
  X
} from 'lucide-react'
import { useRouter } from 'next/navigation'
import { getDetailLaporanKeuangan, uploadBuktiCA, verifyCA, updateCatatanRelawan, deleteBuktiCA } from '../actions'
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

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, anggaranId: number) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploadingId(anggaranId)
    const formData = new FormData()
    for (let i = 0; i < files.length; i++) {
      formData.append('files', files[i])
    }

    try {
      await uploadBuktiCA(anggaranId, formData)
      toast.success('Bukti CA berhasil di-upload')
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Gagal upload file')
    } finally {
      setUploadingId(null)
    }
  }

  const handleDeleteFoto = async (anggaranId: number, urlToDelete: string) => {
    if (!confirm('Hapus foto ini?')) return
    try {
      await deleteBuktiCA(anggaranId, urlToDelete)
      toast.success('Foto berhasil dihapus')
      loadData()
    } catch (err: any) {
      toast.error('Gagal menghapus foto')
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

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <Loader2 className="w-12 h-12 text-[#008784] animate-spin" />
      <p className="font-bold text-slate-500">Memuat detail keuangan...</p>
    </div>
  )

  const { header, anggaran } = data
  const uploadedCount = anggaran.filter((a: any) => a.status_ca !== 'BELUM').length
  const totalCount = anggaran.length

  const BuktiCAUploader = ({ a }: { a: any }) => (
    <>
      {a.bukti_ca_url ? (
        <div className="flex flex-col items-center gap-2">
          <div className="flex flex-wrap justify-center gap-2 w-[140px]">
            {a.bukti_ca_url.split(',').filter(Boolean).map((u: string, idx: number) => (
               <div key={idx} className="relative group">
                 {isImage(u) ? (
                   <div 
                     onClick={(e) => {
                       e.stopPropagation()
                       setPreviewImage(u)
                     }}
                     className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 cursor-pointer shadow-sm hover:shadow-md hover:border-[#008784] transition-all"
                   >
                     <img src={u} alt="Bukti CA" className="object-cover w-full h-full" />
                   </div>
                 ) : (
                   <a 
                     href={u} 
                     target="_blank" 
                     onClick={(e) => e.stopPropagation()}
                     className="p-3 bg-[#008784]/10 text-[#008784] rounded-lg hover:bg-[#008784]/20 transition-all block w-12 h-12 flex items-center justify-center"
                   >
                     <FileText className="w-5 h-5" />
                   </a>
                 )}
                 {(!isAdminOrFinance || a.status_ca !== 'DIVERIFIKASI') && (
                   <button 
                     onClick={() => handleDeleteFoto(a.id, u)}
                     className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity z-10"
                     title="Hapus foto"
                   >
                     <X className="w-3 h-3" />
                   </button>
                 )}
               </div>
            ))}
          </div>
          <div className="relative mt-1">
            <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer w-full z-10" onChange={(e) => handleFileChange(e, a.id)} title="Tambah bukti" />
            <span className="text-[9px] font-bold text-slate-400 underline uppercase hover:text-[#008784] transition-colors cursor-pointer block text-center">
              + Tambah Foto
            </span>
          </div>
        </div>
      ) : (
        <div className="relative inline-block group">
          <input type="file" multiple className="absolute inset-0 opacity-0 cursor-pointer w-full z-10" onChange={(e) => handleFileChange(e, a.id)} />
          <div className="p-3 border-2 border-dashed border-slate-200 rounded-xl group-hover:border-[#008784] group-hover:bg-[#008784]/5 transition-all text-center flex justify-center">
            {uploadingId === a.id ? <Loader2 className="w-5 h-5 animate-spin text-[#008784]" /> : <Upload className="w-5 h-5 text-slate-300 group-hover:text-[#008784]" />}
          </div>
        </div>
      )}
    </>
  )

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
             {anggaran.map((a: any) => (
                <div key={a.id} className="p-6 space-y-4 cursor-pointer hover:bg-slate-50 transition-colors group/card" onClick={(e) => {
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
                      <span className="font-bold">Rp {parseInt(a.ajuan_ri).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between gap-4">
                      <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">Cair:</span>
                      <span className="font-black text-[#008784]">Rp {parseInt(a.anggaran_dicairkan).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex gap-4 items-start">
                    <div className="shrink-0 w-[140px] flex justify-center">
                       <BuktiCAUploader a={a} />
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
                            {a.status_ca === 'DIVERIFIKASI' ? 'Diverifikasi' : 'Verif'}
                          </Button>
                          {a.status_ca === 'DIVERIFIKASI' && (
                            <Button variant="ghost" className="h-6 text-[9px] text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg" onClick={() => handleVerify(a.id, 'UPLOADED', '')}>Batalkan</Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
             ))}
          </div>

          {/* DESKTOP VIEW */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-slate-50/80 text-[11px] font-black text-slate-500 uppercase tracking-widest">
                <tr>
                  <th className="px-8 py-5">Bulan</th>
                  <th className="px-8 py-5">Anggaran</th>
                  <th className="px-8 py-5 text-center">Bukti CA</th>
                  <th className="px-8 py-5 text-center">Status</th>
                  <th className="px-8 py-5">Catatan/Feedback</th>
                  {isAdminOrFinance && <th className="px-8 py-5 text-center">Verifikasi</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {anggaran.map((a: any) => (
                  <tr key={a.id} className="hover:bg-slate-50/50 transition-colors cursor-pointer group/row" onClick={(e) => {
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
                      <div className="text-xs space-y-1">
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-400">Ajuan:</span>
                          <span className="font-bold">Rp {parseInt(a.ajuan_ri).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                          <span className="text-slate-400">Cair:</span>
                          <span className="font-black text-[#008784]">Rp {parseInt(a.anggaran_dicairkan).toLocaleString()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center flex justify-center items-center">
                      <BuktiCAUploader a={a} />
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
                      <td className="px-8 py-6 text-center">
                        <div className="flex flex-col gap-1">
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
                            {a.status_ca === 'DIVERIFIKASI' ? 'Diverifikasi' : 'Verif'}
                          </Button>
                          {a.status_ca === 'DIVERIFIKASI' && (
                            <Button variant="ghost" className="h-6 text-[9px] text-rose-500 hover:bg-rose-50 hover:text-rose-600 rounded-lg" onClick={() => handleVerify(a.id, 'UPLOADED', '')}>Batalkan</Button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
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
        <DialogContent className="sm:max-w-2xl bg-white max-h-[90vh] overflow-y-auto w-[95%] border-slate-100 shadow-2xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-slate-800">Detail Laporan {detailAnggaran?.bulan} {detailAnggaran?.tahun}</DialogTitle>
            <DialogDescription className="text-xs font-bold text-slate-500">
              Rincian data anggaran dan pencairan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 pt-4 pb-2">
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
                  <div className="font-bold text-sm text-slate-700">Rp {detailAnggaran?.ajuan_ri?.toLocaleString()}</div>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Anggaran Disetujui</label>
                  <div className="font-bold text-sm text-slate-700">Rp {detailAnggaran?.anggaran_disetujui?.toLocaleString()}</div>
                </div>
                <div>
                  <label className="text-[10px] uppercase font-black tracking-widest text-slate-400">Anggaran Dicairkan</label>
                  <div className="font-bold text-sm text-[#008784]">Rp {detailAnggaran?.anggaran_dicairkan?.toLocaleString()}</div>
                </div>
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
            <div className="pt-2">
              <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-wider mb-3 border-b border-slate-100 pb-2">Bukti CA</h4>
              <div className="space-y-3">
                {detailAnggaran?.bukti_ca_url ? (
                  <div className="flex flex-wrap gap-3">
                    {detailAnggaran.bukti_ca_url.split(',').filter(Boolean).map((u: string, idx: number) => (
                      <div key={idx} className="relative group">
                        {isImage(u) ? (
                          <div
                            onClick={() => setPreviewImage(u)}
                            className="w-20 h-20 rounded-xl overflow-hidden border border-slate-200 cursor-pointer shadow-sm hover:shadow-md hover:border-[#008784] transition-all"
                          >
                            <img src={u} alt="Bukti CA" className="object-cover w-full h-full" />
                          </div>
                        ) : (
                          <a href={u} target="_blank" className="p-4 bg-[#008784]/10 text-[#008784] rounded-xl hover:bg-[#008784]/20 transition-all flex items-center justify-center w-20 h-20 border border-[#008784]/20">
                            <FileText className="w-6 h-6" />
                          </a>
                        )}
                        {(!isAdminOrFinance || detailAnggaran?.status_ca !== 'DIVERIFIKASI') && (
                          <button
                            onClick={async () => {
                              await handleDeleteFoto(detailAnggaran.id, u)
                              // Update detailAnggaran state to reflect deletion
                              const newUrls = detailAnggaran.bukti_ca_url.split(',').filter((url: string) => url !== u).join(',')
                              setDetailAnggaran((prev: any) => ({ ...prev, bukti_ca_url: newUrls || null }))
                            }}
                            className="absolute -top-2 -right-2 bg-rose-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity z-10 shadow"
                            title="Hapus foto"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">Belum ada bukti CA.</p>
                )}
                {/* Upload area - always show */}
                <div className="relative group w-full">
                    <input
                      type="file"
                      multiple
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                      onChange={async (e) => {
                        const files = e.target.files
                        if (!files || files.length === 0) return
                        setUploadingId(detailAnggaran.id)
                        const formData = new FormData()
                        for (let i = 0; i < files.length; i++) formData.append('files', files[i])
                        try {
                          await uploadBuktiCA(detailAnggaran.id, formData)
                          toast.success('Bukti CA berhasil di-upload')
                          // Reload list then sync detailAnggaran
                          const freshData = await import('../actions').then(m => m.getDetailLaporanKeuangan(parseInt(id)))
                          const freshAnggaran = (freshData as any).anggaran?.find((a: any) => a.id === detailAnggaran.id)
                          if (freshAnggaran) setDetailAnggaran(freshAnggaran)
                          loadData()
                        } catch (err: any) {
                          toast.error(err.message || 'Gagal upload file')
                        } finally {
                          setUploadingId(null)
                        }
                      }}
                    />
                    <div className="flex items-center gap-3 p-4 border-2 border-dashed border-slate-200 rounded-xl group-hover:border-[#008784] group-hover:bg-[#008784]/5 transition-all cursor-pointer">
                      {uploadingId === detailAnggaran?.id ? (
                        <Loader2 className="w-5 h-5 animate-spin text-[#008784]" />
                      ) : (
                        <Upload className="w-5 h-5 text-slate-400 group-hover:text-[#008784] transition-colors" />
                      )}
                      <span className="text-xs font-bold text-slate-400 group-hover:text-[#008784] transition-colors">
                        {uploadingId === detailAnggaran?.id ? 'Mengupload...' : 'Klik atau seret foto/file ke sini'}
                      </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4">
               <Button variant="outline" onClick={() => setDetailAnggaran(null)} className="rounded-xl font-bold border-slate-200">
                 Tutup
               </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
