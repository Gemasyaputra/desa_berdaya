'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { toast } from 'sonner'
import { 
  Receipt, 
  ArrowLeft,
  Search,
  FileText,
  Building2,
  Target,
  User,
  ExternalLink,
  Loader2,
  CheckCircle2,
  X,
  Link2
} from 'lucide-react'
import { 
  getAllLaporanKeuanganEntries,
  verifyCA,
  verifyPengembalian,
  updateCatatanRelawan
} from '../actions'

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
]

export default function SemuaLaporanKeuanganPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filterTahun, setFilterTahun] = useState<string>('Semua')
  const [filterStatus, setFilterStatus] = useState<string>('Semua')
  const [sortBulan, setSortBulan] = useState<'asc' | 'desc'>('asc')
  
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(12)
  const [verifyingId, setVerifyingId] = useState<number | null>(null)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const router = useRouter()
  const { data: session } = useSession()
  const user = session?.user as any
  const isAdminOrFinance = user?.role === 'ADMIN' || user?.role === 'FINANCE' || user?.role === 'MONEV'

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const res = await getAllLaporanKeuanganEntries()
      setData(res)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
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

  const handleVerifyPengembalian = async (anggaranId: number, status: any, catatan: string) => {
    setVerifyingId(anggaranId)
    try {
      await verifyPengembalian(anggaranId, status, catatan)
      toast.success('Status pengembalian berhasil diupdate')
      loadData()
    } catch (err: any) {
      toast.error(err.message || 'Gagal verifikasi pengembalian')
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

  const isImage = (url: string) => /\.(jpeg|jpg|gif|png|webp|avif)/i.test(url)

  const renderBukti = (urlStr: string) => {
    if (!urlStr) return <span className="text-[10px] font-bold text-slate-300">-</span>
    
    let entries: any[] = []
    try {
      if (urlStr.trim().startsWith('[')) {
        entries = JSON.parse(urlStr)
      } else {
        entries = [{ id: 'legacy', deskripsi: 'Upload Sebelumnya', urls: urlStr.split(',').filter(Boolean) }]
      }
    } catch {
      entries = []
    }

    const allUrls = entries.flatMap(e => e.urls || [])
    if (allUrls.length === 0) return <span className="text-[10px] font-bold text-slate-300">-</span>

    const hasRejected = entries.some(e => e.ditolak)

    return (
      <div className="flex flex-col items-center justify-center gap-1.5">
        <div className="relative">
          <button 
            className="inline-flex items-center justify-center gap-1.5 text-[10px] font-bold py-1.5 px-2.5 rounded-md transition-colors border whitespace-nowrap text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200"
          >
            <FileText className="w-3 h-3" />
            {entries.length} File
          </button>
          {hasRejected && (
            <div className="absolute -top-1 -right-1 flex h-2.5 w-2.5" title="Ada Laporan yang Ditolak!">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
            </div>
          )}
        </div>
      </div>
    )
  }

  const getRealisasiAndSisa = (a: any) => {
    let realisasi = 0;
    if (a.bukti_ca_url) {
      try {
        const entries = JSON.parse(a.bukti_ca_url);
        realisasi = entries.filter((e: any) => !e.ditolak).reduce((acc: number, val: any) => acc + (Number(val.nominal) || 0), 0);
      } catch {}
    }
    
    let pengembalian = 0;
    if (a.bukti_pengembalian_url) {
      try {
        const entries = JSON.parse(a.bukti_pengembalian_url);
        pengembalian = entries.filter((e: any) => !e.ditolak).reduce((acc: number, val: any) => acc + (Number(val.nominal) || 0), 0);
      } catch {}
    }

    const cair = parseInt(a.anggaran_dicairkan) || 0;
    const sisa = cair - realisasi - pengembalian;
    return { realisasi, sisa, pengembalian };
  }

  let filtered = data.filter(item => {
    const term = search.toLowerCase()
    const matchSearch = (
      (item.nama_desa || '').toLowerCase().includes(term) ||
      (item.nama_program || '').toLowerCase().includes(term) ||
      (item.nama_relawan || '').toLowerCase().includes(term) ||
      (item.sumber_dana || '').toLowerCase().includes(term)
    )
    if (!matchSearch) return false

    if (filterTahun !== 'Semua' && item.tahun?.toString() !== filterTahun) return false
    if (filterStatus !== 'Semua' && item.status_ca !== filterStatus) return false
    
    return true
  })

  const uniqueTahun = Array.from(new Set(data.map((a: any) => a.tahun))).sort()
  
  const monthOrder: Record<string, number> = {
    'Januari': 1, 'Februari': 2, 'Maret': 3, 'April': 4, 'Mei': 5, 'Juni': 6,
    'Juli': 7, 'Agustus': 8, 'September': 9, 'Oktober': 10, 'November': 11, 'Desember': 12
  };
  
  filtered = [...filtered].sort((a, b) => {
    const monthA = isNaN(Number(a.bulan)) ? (monthOrder[a.bulan] || 0) : Number(a.bulan);
    const monthB = isNaN(Number(b.bulan)) ? (monthOrder[b.bulan] || 0) : Number(b.bulan);
    if (sortBulan === 'asc') return monthA - monthB;
    return monthB - monthA;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  if (currentPage > totalPages && totalPages > 0) {
    setCurrentPage(totalPages);
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 bg-slate-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" className="h-14 w-14 rounded-2xl border-slate-200 shrink-0" onClick={() => router.push('/dashboard/laporan-keuangan-intervensi')}>
            <ArrowLeft className="w-6 h-6 text-slate-600" />
          </Button>
          <div className="w-14 h-14 bg-[#7a1200]/10 border border-[#7a1200]/20 rounded-2xl flex items-center justify-center shrink-0">
            <Receipt className="w-7 h-7 text-[#7a1200]" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800">Semua Detail Anggaran & Laporan</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">Lihat seluruh riwayat laporan keuangan dari semua desa & program</p>
          </div>
        </div>
        
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#7a1200] transition-colors" />
          <Input
            placeholder="Cari desa, program, relawan..."
            className="pl-11 h-12 w-full rounded-2xl border-slate-200 bg-white text-sm shadow-sm focus:border-[#7a1200]/40 focus:ring-4 focus:ring-[#7a1200]/5 transition-all"
            value={search}
            onChange={e => { setSearch(e.target.value); setCurrentPage(1) }}
          />
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4 bg-white rounded-[2rem] border border-slate-100 shadow-sm">
          <Loader2 className="w-10 h-10 text-[#7a1200] animate-spin" />
          <p className="text-slate-500 font-medium">Memuat semua data laporan keuangan...</p>
        </div>
      ) : (
        <Card className="border-none shadow-2xl shadow-slate-200/40 rounded-[2.5rem] overflow-hidden bg-white">
          <CardHeader className="border-b border-slate-100 px-8 py-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#7a1200]/10 flex items-center justify-center">
                <Receipt className="w-4 h-4 text-[#7a1200]" />
              </div>
              <CardTitle className="text-lg font-bold text-slate-800">Daftar Anggaran &amp; Bukti CA</CardTitle>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              {/* Status Pill Group */}
              <div className="flex items-center bg-slate-100 p-1 rounded-2xl gap-0.5">
                {[
                  { key: 'Semua',        label: 'Semua',        dot: 'bg-slate-400' },
                  { key: 'BELUM',        label: 'Belum Upload', dot: 'bg-rose-400' },
                  { key: 'UPLOADED',     label: 'Uploaded',     dot: 'bg-amber-400' },
                  { key: 'DIVERIFIKASI', label: 'Diverifikasi', dot: 'bg-emerald-500' },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => { setFilterStatus(opt.key); setCurrentPage(1) }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-bold transition-all whitespace-nowrap ${
                      filterStatus === opt.key
                        ? 'bg-white text-slate-800 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <span className={`w-2 h-2 rounded-full ${opt.dot}`} />
                    {opt.label}
                  </button>
                ))}
              </div>

              <div className="h-6 w-px bg-slate-200 hidden sm:block" />

              {/* Tahun Select */}
              {uniqueTahun.length > 0 && (
                <div className="relative">
                  <select
                    value={filterTahun}
                    onChange={(e) => { setFilterTahun(e.target.value); setCurrentPage(1) }}
                    className="appearance-none pl-3 pr-8 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#7a1200]/20 focus:border-[#7a1200]/40 cursor-pointer transition-all"
                  >
                    <option value="Semua">Semua Tahun</option>
                    {uniqueTahun.map(t => (
                      <option key={t as string} value={t as string}>{t as string}</option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                    <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </div>
                </div>
              )}

              {/* Sort Select */}
              <div className="relative">
                <select
                  value={sortBulan}
                  onChange={(e) => setSortBulan(e.target.value as 'asc' | 'desc')}
                  className="appearance-none pl-3 pr-8 py-1.5 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#7a1200]/20 focus:border-[#7a1200]/40 cursor-pointer transition-all"
                >
                  <option value="asc">↑ Jan → Des</option>
                  <option value="desc">↓ Des → Jan</option>
                </select>
                <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <svg width="10" height="6" viewBox="0 0 10 6" fill="none"><path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
              </div>

              {(filterStatus !== 'Semua' || filterTahun !== 'Semua' || search) && (
                <button
                  onClick={() => { setFilterStatus('Semua'); setFilterTahun('Semua'); setSearch(''); setCurrentPage(1) }}
                  className="flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-100 rounded-xl hover:bg-rose-100 transition-colors"
                >
                  <X className="w-3 h-3" />
                  Reset
                </button>
              )}
            </div>
          </CardHeader>
          
          <CardContent className="p-0">
            {paginatedData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <Receipt className="w-12 h-12 text-slate-300" />
                <p className="font-bold text-slate-600">Tidak ada data ditemukan</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-b-[2rem] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none'] relative">
                <table className="w-full text-sm text-left">
                  <thead className="bg-slate-50 text-[11px] font-black text-slate-500 uppercase tracking-widest sticky top-0 z-30 shadow-sm">
                    <tr>
                      <th className="px-4 py-3 sticky left-0 z-40 bg-slate-50 shadow-[1px_0_0_#f1f5f9]">Bulan</th>
                      <th className="px-4 py-3">Desa & Program</th>
                      <th className="px-4 py-3">Ajuan</th>
                      <th className="px-4 py-3">Cair</th>
                      <th className="px-4 py-3">Realisasi</th>
                      <th className="px-4 py-3">Sisa Saldo</th>
                      <th className="px-4 py-3 text-center">Bukti CA</th>
                      <th className="px-4 py-3 text-center">Pengembalian</th>
                      <th className="px-4 py-3 text-center">Status</th>
                      <th className="px-4 py-3">Catatan/Feedback</th>
                      {isAdminOrFinance && (
                        <>
                          <th className="px-4 py-3 text-center">Verif CA</th>
                          <th className="px-4 py-3 text-center">Verif Refund</th>
                        </>
                      )}
                      <th className="px-4 py-3 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {paginatedData.map((a: any) => {
                      const { realisasi, sisa } = getRealisasiAndSisa(a);
                      const rowBg = a.status_ca === 'DIVERIFIKASI' ? 'bg-emerald-50' : a.status_ca === 'UPLOADED' ? 'bg-amber-50' : 'bg-rose-50';
                      const rowHoverBg = a.status_ca === 'DIVERIFIKASI' ? 'hover:bg-emerald-100' : a.status_ca === 'UPLOADED' ? 'hover:bg-amber-100' : 'hover:bg-rose-100';
                      const statusShadow = a.status_ca === 'DIVERIFIKASI' ? 'shadow-[inset_4px_0_0_0_#10b981,1px_0_0_0_#f1f5f9]' : a.status_ca === 'UPLOADED' ? 'shadow-[inset_4px_0_0_0_#f59e0b,1px_0_0_0_#f1f5f9]' : 'shadow-[inset_4px_0_0_0_#f43f5e,1px_0_0_0_#f1f5f9]';
                      const monthName = isNaN(Number(a.bulan)) ? a.bulan : (MONTHS[Number(a.bulan) - 1] || a.bulan);
                      
                      return (
                        <tr key={a.id} className={`${rowBg} ${rowHoverBg} border-b border-slate-100 transition-colors`}>
                          <td className={`px-4 py-3 sticky left-0 z-10 ${rowBg} ${rowHoverBg} ${statusShadow}`}>
                            <div className="text-left outline-none min-w-[80px]">
                              <div className="font-black text-slate-800 transition-colors flex items-center gap-2">
                                {monthName}
                              </div>
                              <div className="text-[10px] font-bold text-slate-400 transition-colors">{a.tahun}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="text-left flex flex-col gap-1 w-[200px]">
                              <div className="flex items-center gap-1.5">
                                <Building2 className="w-3.5 h-3.5 text-[#7a1200] shrink-0" />
                                <span className="font-bold text-slate-800 uppercase tracking-tight truncate">{a.nama_desa}</span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <Target className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span className="text-xs font-medium text-slate-600 truncate">{a.nama_program}</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 font-bold text-slate-700 whitespace-nowrap">
                            Rp {parseInt(a.ajuan_ri || '0').toLocaleString('id-ID')}
                          </td>
                          <td className="px-4 py-3 font-black text-[#7a1200] whitespace-nowrap">
                            Rp {parseInt(a.anggaran_dicairkan || '0').toLocaleString('id-ID')}
                          </td>
                          <td className="px-4 py-3 font-bold text-amber-600 whitespace-nowrap">
                            Rp {realisasi.toLocaleString('id-ID')}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span className={`font-black tracking-tight ${sisa < 0 ? 'text-rose-600' : 'text-slate-700'}`}>Rp {sisa.toLocaleString('id-ID')}</span>
                          </td>
                          <td className="px-4 py-3 text-center align-middle">
                            {renderBukti(a.bukti_ca_url)}
                          </td>
                          <td className="px-4 py-3 text-center align-middle">
                            {renderBukti(a.bukti_pengembalian_url)}
                          </td>
                          <td className="px-4 py-3 align-middle">
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
                          <td className="px-4 py-3 align-middle min-w-[150px]">
                            <textarea 
                              className="w-full text-xs p-2 bg-slate-50 border border-slate-100 rounded-lg min-h-[50px] resize-none"
                              defaultValue={a.catatan_ca || ''}
                              id={`note-${a.id}`}
                              onBlur={(e) => !isAdminOrFinance && handleUpdateCatatan(a.id, e.target.value)}
                              placeholder="Catatan..."
                            />
                          </td>
                          {isAdminOrFinance && (
                            <>
                              <td className="px-4 py-3 text-center align-middle">
                                <div className="flex flex-row gap-1 justify-center items-center">
                                  {a.status_ca === 'DIVERIFIKASI' ? (
                                    <>
                                      <Button size="sm" className="h-8 w-8 p-0 rounded-lg bg-emerald-50 text-emerald-700 pointer-events-none shadow-none border border-emerald-100">
                                        <CheckCircle2 className="w-5 h-5" />
                                      </Button>
                                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:bg-rose-50 hover:text-rose-500 rounded-lg" onClick={() => handleVerify(a.id, 'UPLOADED', '')}>
                                        <X className="w-5 h-5" />
                                      </Button>
                                    </>
                                  ) : (
                                    <Button size="sm" className="h-8 w-8 p-0 rounded-lg transition-all bg-[#7a1200] hover:bg-[#007370] text-white"
                                      onClick={() => {
                                        const note = (document.getElementById(`note-${a.id}`) as HTMLTextAreaElement).value
                                        handleVerify(a.id, 'DIVERIFIKASI', note)
                                      }}
                                      disabled={!a.bukti_ca_url || verifyingId === a.id}
                                    >
                                      {verifyingId === a.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                    </Button>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center align-middle">
                                <div className="flex flex-row gap-1 justify-center items-center">
                                  {a.bukti_pengembalian_url ? (
                                    a.status_pengembalian === 'DIVERIFIKASI' ? (
                                      <>
                                        <Button size="sm" className="h-8 w-8 p-0 rounded-lg bg-indigo-50 text-indigo-700 pointer-events-none shadow-none border border-indigo-100">
                                          <CheckCircle2 className="w-5 h-5" />
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:bg-slate-50 hover:text-rose-500 rounded-lg" onClick={() => handleVerifyPengembalian(a.id, 'UPLOADED', '')}>
                                          <X className="w-5 h-5" />
                                        </Button>
                                      </>
                                    ) : (
                                      <Button size="sm" className="h-8 w-8 p-0 rounded-lg transition-all bg-rose-500 hover:bg-rose-600 text-white" onClick={() => handleVerifyPengembalian(a.id, 'DIVERIFIKASI', '')} disabled={verifyingId === a.id}>
                                        {verifyingId === a.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                                      </Button>
                                    )
                                  ) : (
                                    <span className="text-[10px] font-bold text-slate-300">-</span>
                                  )}
                                </div>
                              </td>
                            </>
                          )}
                          <td className="px-4 py-3 text-center align-middle">
                            <Button 
                              size="sm"
                              variant="outline"
                              className="text-[#7a1200] border-[#7a1200]/30 hover:bg-[#7a1200] hover:text-white transition-colors h-8 text-[10px] px-2"
                              onClick={() => router.push(`/dashboard/laporan-keuangan-intervensi/${a.ip_id}`)}
                            >
                              Detail <ExternalLink className="w-3 h-3 ml-1" />
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            
            {totalPages > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center bg-slate-50 p-4 border-t border-slate-100 gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-500">
                    Menampilkan {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filtered.length)} dari {filtered.length} data
                  </span>
                  <select
                    value={itemsPerPage.toString()}
                    onChange={(e) => {
                      setItemsPerPage(Number(e.target.value))
                      setCurrentPage(1)
                    }}
                    className="px-2 py-1 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-md focus:outline-none focus:ring-2 focus:ring-[#7a1200] cursor-pointer"
                  >
                    <option value="6">6 Baris</option>
                    <option value="12">12 Baris</option>
                    <option value="24">24 Baris</option>
                    <option value="48">48 Baris</option>
                  </select>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="font-bold border-slate-200">Prev</Button>
                  <div className="flex items-center justify-center px-3 font-bold text-sm text-slate-600">{currentPage} / {totalPages}</div>
                  <Button variant="outline" size="sm" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="font-bold border-slate-200">Next</Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
        <DialogContent className="max-w-4xl p-1 bg-transparent border-none shadow-none focus:outline-none flex justify-center">
          <DialogTitle className="sr-only">Preview</DialogTitle>
          {previewImage && (
            <img src={previewImage} alt="Detail" className="w-full h-auto max-h-[90vh] object-contain rounded-xl" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
