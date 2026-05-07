'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { ArrowLeft, CheckCircle, AlertCircle, Clock, Save, FileText, Check, X, MessageSquareWarning, ChevronDown, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getActionPlanById, updateActionPlanStatus } from '@/lib/actions/action-plan'
import { useSession } from 'next-auth/react'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { getIntervensiByActionPlanId } from '@/app/dashboard/intervensi/actions'


const NAMA_BULAN: Record<number, string> = {
  1: 'Januari', 2: 'Februari', 3: 'Maret', 4: 'April',
  5: 'Mei', 6: 'Juni', 7: 'Juli', 8: 'Agustus',
  9: 'September', 10: 'Oktober', 11: 'November', 12: 'Desember'
}

const getNamaBulan = (val: any): string => {
  const num = Number(val)
  return NAMA_BULAN[num] || String(val)
}

function RabTable({ activities, kategoriProgram, formatRupiah }: { activities: any[], kategoriProgram: string, formatRupiah: (n: number) => string }) {
  const [expandedGroups, setExpandedGroups] = React.useState<Record<string, boolean>>(() => {
    // Default semua grup terbuka
    const initial: Record<string, boolean> = {}
    const seen = new Set<string>()
    activities.forEach(a => {
      if (!seen.has(a.uraian_kebutuhan)) {
        initial[a.uraian_kebutuhan] = true
        seen.add(a.uraian_kebutuhan)
      }
    })
    return initial
  })

  // Group aktivitas berdasarkan uraian_kebutuhan — urutan pertama = induk (punya jumlah_unit & harga_satuan)
  const groups: { uraian: string; induk: any; distribusi: any[] }[] = []
  const seenUraian: Record<string, number> = {}

  activities.forEach(act => {
    const key = act.uraian_kebutuhan
    if (seenUraian[key] === undefined) {
      seenUraian[key] = groups.length
      groups.push({ uraian: key, induk: act, distribusi: [] })
    } else {
      groups[seenUraian[key]].distribusi.push(act)
    }
  })

  const toggleGroup = (uraian: string) => {
    setExpandedGroups(prev => ({ ...prev, [uraian]: !prev[uraian] }))
  }

  const isEkonomi = kategoriProgram === 'EKONOMI'

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-5 border-b border-slate-100 bg-slate-50/50">
        <h2 className="font-bold text-slate-800">Rencana Anggaran Biaya (RAB)</h2>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-left">
            <tr>
              <th className="p-4 font-semibold w-8"></th>
              <th className="p-4 font-semibold">Uraian Kebutuhan</th>
              {isEkonomi && (
                <>
                  <th className="p-4 font-semibold whitespace-nowrap">Vol (Jml × Frek)</th>
                  <th className="p-4 font-semibold whitespace-nowrap">Harga Satuan</th>
                </>
              )}
              <th className="p-4 font-semibold text-right whitespace-nowrap">Total Nominal</th>
            </tr>
          </thead>
          <tbody>
            {groups.map(group => (
              <React.Fragment key={group.uraian}>
                {/* Baris Induk RAB */}
                <tr
                  className={`border-b border-slate-100 ${
                    group.distribusi.length > 0 ? 'bg-teal-50/60 hover:bg-teal-50 cursor-pointer' : 'hover:bg-slate-50/50'
                  }`}
                  onClick={() => group.distribusi.length > 0 && toggleGroup(group.uraian)}
                >
                  <td className="p-3 text-center">
                    {group.distribusi.length > 0 ? (
                      expandedGroups[group.uraian]
                        ? <ChevronDown className="w-4 h-4 text-teal-600 mx-auto" />
                        : <ChevronRight className="w-4 h-4 text-teal-600 mx-auto" />
                    ) : null}
                  </td>
                  <td className="p-4">
                    <div className="font-semibold text-slate-800">{group.uraian}</div>
                    {group.distribusi.length > 0 && (
                      <div className="text-xs text-teal-600 mt-0.5">
                        Didistribusikan ke {group.distribusi.length + 1} bulan — klik untuk {expandedGroups[group.uraian] ? 'sembunyikan' : 'tampilkan'} detail
                      </div>
                    )}
                  </td>
                  {isEkonomi && (
                    <>
                      <td className="p-4 text-slate-700 font-medium">
                        {group.induk.jumlah_unit} {group.induk.satuan_jumlah ? <span className="text-slate-500 text-xs">({group.induk.satuan_jumlah})</span> : ''} × {group.induk.frekuensi} {group.induk.satuan_frekuensi ? <span className="text-slate-500 text-xs">({group.induk.satuan_frekuensi})</span> : ''}
                      </td>
                      <td className="p-4 text-slate-700">{formatRupiah(Number(group.induk.harga_satuan))}</td>
                    </>
                  )}
                  <td className="p-4 text-right font-bold text-slate-800">
                    {formatRupiah(
                      group.distribusi.length > 0
                        // Tampilkan total semua distribusi
                        ? [group.induk, ...group.distribusi].reduce((sum, a) => sum + Number(a.nominal_rencana || 0), 0)
                        : Number(group.induk.nominal_rencana)
                    )}
                  </td>
                </tr>

                {/* Sub-baris Distribusi Bulan */}
                {group.distribusi.length > 0 && expandedGroups[group.uraian] && (
                  <>
                    {/* Baris induk (bulan pertama) */}
                    <tr className="border-b border-slate-100 bg-white hover:bg-slate-50/50">
                      <td className="p-2"></td>
                      <td className="py-2 pl-8 pr-4">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="bg-slate-50 text-slate-600 text-[11px] font-medium border-slate-200">{getNamaBulan(group.induk.bulan_implementasi)}</Badge>
                          <span className="text-[11px] text-slate-400 italic font-medium">alokasi dana</span>
                        </div>
                      </td>
                      {isEkonomi && <td className="p-2" colSpan={2}></td>}
                      <td className="py-2 px-4 text-right text-sm font-medium text-teal-700">{formatRupiah(Number(group.induk.nominal_rencana))}</td>
                    </tr>
                    {/* Baris distribusi bulan lainnya */}
                    {group.distribusi.map((dist: any) => (
                      <tr key={dist.id} className="border-b border-slate-100 bg-white hover:bg-slate-50/50">
                        <td className="p-2"></td>
                        <td className="py-2 pl-8 pr-4">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="bg-slate-50 text-slate-600 text-[11px] font-medium border-slate-200">{getNamaBulan(dist.bulan_implementasi)}</Badge>
                            <span className="text-[11px] text-slate-400 italic font-medium">alokasi dana</span>
                          </div>
                        </td>
                        {isEkonomi && <td className="p-2" colSpan={2}></td>}
                        <td className="py-2 px-4 text-right text-sm font-medium text-teal-700">{formatRupiah(Number(dist.nominal_rencana))}</td>
                      </tr>
                    ))}
                  </>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden divide-y divide-slate-100">
        {groups.map(group => (
          <div key={group.uraian} className="p-4 space-y-2">
            <div
              className={`flex justify-between items-start gap-2 ${
                group.distribusi.length > 0 ? 'cursor-pointer' : ''
              }`}
              onClick={() => group.distribusi.length > 0 && toggleGroup(group.uraian)}
            >
              <div className="flex-1">
                <div className="font-semibold text-slate-800 text-sm">{group.uraian}</div>
                {group.distribusi.length > 0 && (
                  <div className="text-xs text-teal-600 mt-0.5 flex items-center gap-1">
                    {expandedGroups[group.uraian] ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    {group.distribusi.length + 1} bulan distribusi
                  </div>
                )}
              </div>
              <span className="font-bold text-slate-800 text-sm">
                {formatRupiah(
                  group.distribusi.length > 0
                    ? [group.induk, ...group.distribusi].reduce((sum, a) => sum + Number(a.nominal_rencana || 0), 0)
                    : Number(group.induk.nominal_rencana)
                )}
              </span>
            </div>

            {isEkonomi && (
              <div className="flex justify-between text-xs text-slate-500 bg-slate-50 p-2 rounded-lg">
                <span>Vol: {group.induk.jumlah_unit}{group.induk.satuan_jumlah ? ` ${group.induk.satuan_jumlah}` : ''} × {group.induk.frekuensi}{group.induk.satuan_frekuensi ? ` ${group.induk.satuan_frekuensi}` : ''}</span>
                <span>Harga: {formatRupiah(Number(group.induk.harga_satuan))}</span>
              </div>
            )}

            {/* Detail distribusi bulan - mobile */}
            {group.distribusi.length > 0 && expandedGroups[group.uraian] && (
              <div className="mt-2 space-y-1 border-l-2 border-teal-200 pl-3">
                {[group.induk, ...group.distribusi].map((dist: any) => (
                  <div key={dist.id} className="flex justify-between items-center text-xs">
                    <Badge variant="outline" className="bg-white text-slate-500 border-slate-200">{getNamaBulan(dist.bulan_implementasi)}</Badge>
                    <span className="font-medium text-teal-700">{formatRupiah(Number(dist.nominal_rencana))}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export default function DetailActionPlanPage() {
  const router = useRouter()
  const params = useParams()
  const id = Number(params?.id)
  
  const { data: session } = useSession()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isRevisionModalOpen, setIsRevisionModalOpen] = useState(false)
  const [catatanRevisi, setCatatanRevisi] = useState('')
  const [laporanTerkait, setLaporanTerkait] = useState<any[]>([])

  const role = (session?.user as any)?.role
  // Hanya MONEV / ADMIN yang bisa approval
  const canApprove = role === 'MONEV' || role === 'ADMIN'

  useEffect(() => {
    if (id) {
      getActionPlanById(id).then(res => {
        setData(res)
        setLoading(false)
      }).catch(err => {
        console.error(err)
        setLoading(false)
      })

      if (['ADMIN', 'MONEV', 'PROG_HEAD', 'FINANCE'].includes(role)) {
        getIntervensiByActionPlanId(id).then(reports => {
          setLaporanTerkait(reports)
        }).catch(console.error)
      }
    }
  }, [id, role])

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(number || 0)
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200"><CheckCircle className="w-3 h-3 mr-1" /> Disetujui</Badge>
      case 'REVISION':
        return <Badge className="bg-rose-100 text-rose-700 border-rose-200"><AlertCircle className="w-3 h-3 mr-1" /> Revisi</Badge>
      case 'WAITING_APPROVAL':
      default:
        return <Badge className="bg-amber-100 text-amber-700 border-amber-200"><Clock className="w-3 h-3 mr-1" /> Menunggu Persetujuan</Badge>
    }
  }

  const handleUpdateStatus = async (status: 'APPROVED' | 'REVISION') => {
    if (status === 'REVISION') {
      setIsRevisionModalOpen(true)
      return
    } else {
      const confirmMsg = confirm("Apakah Anda yakin ingin menyetujui pengajuan ini? Setelah disetujui, dana akan dikunci.")
      if (!confirmMsg) return
    }

    setIsUpdating(true)
    const result = await updateActionPlanStatus(id, status)
    if (result.success) {
      // Reload data
      const updated = await getActionPlanById(id)
      setData(updated)
    } else {
      alert("Gagal memperbarui status: " + result.error)
    }
    setIsUpdating(false)
  }

  const submitRevision = async () => {
    if (!catatanRevisi.trim()) {
      alert("Catatan revisi tidak boleh kosong!")
      return
    }
    setIsUpdating(true)
    const result = await updateActionPlanStatus(id, 'REVISION', catatanRevisi)
    if (result.success) {
      const updated = await getActionPlanById(id)
      setData(updated)
      setIsRevisionModalOpen(false)
      setCatatanRevisi('')
    } else {
      alert("Gagal mengirim revisi: " + result.error)
    }
    setIsUpdating(false)
  }

  if (loading) {
    return <div className="p-12 text-center text-slate-500">Memuat detail Action Plan...</div>
  }

  if (!data) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-xl font-bold text-slate-800">Data tidak ditemukan</h2>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>Kembali</Button>
      </div>
    )
  }

  return (
    <div className="p-4 lg:p-6 max-w-screen-xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => router.back()} className="rounded-xl">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Detail Action Plan</h1>
            <p className="text-slate-500 text-sm mt-1">Review dan Persetujuan</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {canApprove && laporanTerkait.length > 0 && data?.status === 'APPROVED' && (
            <Button 
              onClick={() => router.push(`/dashboard/intervensi/${laporanTerkait[0].id}`)} 
              variant="outline" 
              className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 rounded-xl bg-white shadow-sm"
            >
              <FileText className="w-4 h-4 mr-2" /> Lihat Intervensi {laporanTerkait.length > 1 ? `(${laporanTerkait.length})` : ''}
            </Button>
          )}
          {(role === 'RELAWAN' || role === 'PROG_HEAD') && (data.status === 'REVISION' || data.status === 'WAITING_APPROVAL') && (
            <Button onClick={() => router.push(`/dashboard/action-plan/${id}/edit`)} variant="outline" className="text-teal-600 border-teal-200 hover:bg-teal-50 rounded-xl">
              Edit Action Plan
            </Button>
          )}
          <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl shadow-sm border border-slate-200">
            <span className="text-sm font-semibold text-slate-500">Status:</span>
            {getStatusBadge(data.status)}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Kolom Kiri: Informasi Umum & Spesifik */}
        <div className="md:col-span-1 space-y-6">

          {data.status === 'REVISION' && data.catatan_revisi && (
            <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl shadow-sm">
              <h3 className="font-bold text-rose-800 mb-2 flex items-center gap-2">
                <MessageSquareWarning className="w-4 h-4" /> Catatan Revisi MONEV
              </h3>
              <p className="text-sm text-rose-700 whitespace-pre-wrap">{data.catatan_revisi}</p>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h2 className="font-bold text-slate-800 mb-4 border-b pb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" /> Informasi Umum
            </h2>
            <div className="space-y-4 text-sm">
              <div>
                <div className="text-slate-500 mb-1">Kategori Program</div>
                <div className="font-semibold text-slate-800 bg-slate-50 p-2 rounded-lg border border-slate-100">{data.kategori_program}</div>
              </div>
              <div>
                <div className="text-slate-500 mb-1">Pilihan Program</div>
                <div className="font-medium text-slate-800">{data.pilihan_program || '-'}</div>
              </div>
              <div>
                <div className="text-slate-500 mb-1">Desa Binaan</div>
                <div className="font-medium text-slate-800">{data.desa_name}</div>
              </div>
              <div>
                <div className="text-slate-500 mb-1">Relawan Inspirasi (RI)</div>
                <div className="font-medium text-slate-800">{data.relawan_name}</div>
              </div>
              <div>
                <div className="text-slate-500 mb-1">Tahun Aktivasi</div>
                <div className="font-medium text-slate-800">{data.tahun_aktivasi}</div>
              </div>
              <div>
                <div className="text-slate-500 mb-1">Total Ajuan Anggaran</div>
                <div className="font-bold text-lg text-teal-700 bg-teal-50 px-3 py-2 rounded-lg border border-teal-100">
                  {formatRupiah(Number(data.total_ajuan))}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-5">
            <h2 className="font-bold text-slate-800 mb-4 border-b pb-2">Atribut Spesifik</h2>
            <div className="space-y-3 text-sm">
              {data.kategori_program === 'PENDIDIKAN' && (
                <>
                  <div className="flex justify-between py-1 border-b border-slate-50"><span className="text-slate-500">Fokus Program:</span> <span className="font-medium">{data.fokus_program || '-'}</span></div>
                  <div className="flex justify-between py-1 border-b border-slate-50"><span className="text-slate-500">Jumlah PP:</span> <span className="font-medium">{data.jumlah_pp || '-'}</span></div>
                  <div className="flex justify-between py-1 border-b border-slate-50"><span className="text-slate-500">Jumlah Pengajar:</span> <span className="font-medium">{data.jumlah_pengajar || '-'}</span></div>
                </>
              )}
              {data.kategori_program === 'LINGKUNGAN' && (
                <>
                  <div className="flex justify-between py-1 border-b border-slate-50"><span className="text-slate-500">Cakupan Program:</span> <span className="font-medium">{data.cakupan_program || '-'}</span></div>
                  <div className="flex justify-between py-1 border-b border-slate-50"><span className="text-slate-500">Legalitas:</span> <span className="font-medium">{data.legalitas || '-'}</span></div>
                  <div className="flex justify-between py-1 border-b border-slate-50"><span className="text-slate-500">Jenis Sampah:</span> <span className="font-medium">{data.jenis_sampah || '-'}</span></div>
                  <div className="flex justify-between py-1 border-b border-slate-50"><span className="text-slate-500">Kapasitas (kg/thn):</span> <span className="font-medium">{data.kapasitas_pengelolaan || '-'}</span></div>
                </>
              )}
              {data.kategori_program === 'KESEHATAN' && (
                <>
                  <div className="flex justify-between py-1 border-b border-slate-50"><span className="text-slate-500">Cakupan Program:</span> <span className="font-medium">{data.cakupan_program || '-'}</span></div>
                  <div className="flex justify-between py-1 border-b border-slate-50"><span className="text-slate-500">Sasaran Program:</span> <span className="font-medium">{data.sasaran_program || '-'}</span></div>
                  <div className="flex justify-between py-1 border-b border-slate-50"><span className="text-slate-500">Rencana Jumlah PP:</span> <span className="font-medium">{data.jumlah_pp || '-'}</span></div>
                </>
              )}
              {(data.kategori_program === 'KESEHATAN' || data.kategori_program === 'LINGKUNGAN') && (
                <div className="pt-2">
                  <span className="text-slate-500 block mb-1">Keterangan SE:</span>
                  <p className="font-medium bg-slate-50 p-2 rounded border border-slate-100 text-slate-700">{data.keterangan_se || '-'}</p>
                </div>
              )}
              {data.kategori_program === 'EKONOMI' && (
                <div className="text-slate-500 text-center py-4 text-xs italic">
                  Data atribut spesifik dikelola melalui tabel Target PM dan RAB Ekonomi.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Kolom Kanan: RAB & Beneficiaries & Action */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Panel Persetujuan Khusus MONEV */}
          {canApprove && data.status === 'WAITING_APPROVAL' && (
            <div className="bg-amber-50 rounded-xl shadow-sm border border-amber-200 p-5 flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div>
                <h3 className="font-bold text-amber-800">Tindakan Persetujuan</h3>
                <p className="text-sm text-amber-700/80 mt-1">Pastikan RAB dan target PM sudah sesuai sebelum melakukan approval.</p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Button 
                  variant="outline" 
                  onClick={() => handleUpdateStatus('REVISION')} 
                  disabled={isUpdating}
                  className="bg-white border-rose-200 text-rose-600 hover:bg-rose-50 flex-1 sm:flex-none"
                >
                  <X className="w-4 h-4 mr-2" /> Revisi
                </Button>
                <Button 
                  onClick={() => handleUpdateStatus('APPROVED')} 
                  disabled={isUpdating}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white flex-1 sm:flex-none"
                >
                  <Check className="w-4 h-4 mr-2" /> Setujui Ajuan
                </Button>
              </div>
            </div>
          )}

          <RabTable activities={data.activities} kategoriProgram={data.kategori_program} formatRupiah={formatRupiah} />

          {/* PM Khusus Ekonomi */}
          {data.kategori_program === 'EKONOMI' && (
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                <h2 className="font-bold text-slate-800">Target Penerima Manfaat (PM)</h2>
              </div>
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-left">
                    <tr>
                      <th className="p-4 font-semibold">Nama PM</th>
                      <th className="p-4 font-semibold">Tanggungan</th>
                      <th className="p-4 font-semibold">Penghasilan (Rp)</th>
                      <th className="p-4 font-semibold">Status GK</th>
                      <th className="p-4 font-semibold">Status HK</th>
                      <th className="p-4 font-semibold">Selisih GK (Rp)</th>
                      <th className="p-4 font-semibold">NIB/Halal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.beneficiaries.map((b: any) => (
                      <tr key={b.id} className="hover:bg-slate-50/50">
                        <td className="p-4 font-medium text-slate-800">{b.pm_name}</td>
                        <td className="p-4 text-slate-500">{b.tanggungan ? `${b.tanggungan} Orang` : '-'}</td>
                        <td className="p-4 text-slate-700">{b.penghasilan_awal ? formatRupiah(Number(b.penghasilan_awal)) : '-'}</td>
                        <td className="p-4 text-slate-500">{b.status_gk || '-'}</td>
                        <td className="p-4 text-slate-500">{b.status_hk || '-'}</td>
                        <td className="p-4 text-slate-500">{b.selisih_gk ? formatRupiah(Number(b.selisih_gk)) : '-'}</td>
                        <td className="p-4 text-slate-500">{b.nib_halal || '-'}</td>
                      </tr>
                    ))}
                    {data.beneficiaries.length === 0 && (
                      <tr>
                        <td colSpan={7} className="p-6 text-center text-slate-500">Tidak ada target PM yang dipilih.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Tampilan Mobile Target PM */}
              <div className="md:hidden divide-y divide-slate-100">
                {data.beneficiaries.map((b: any) => (
                  <div key={b.id} className="p-4 flex flex-col gap-2 text-sm">
                    <div className="font-bold text-slate-800">{b.pm_name}</div>
                    
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <div className="bg-slate-50 p-2 rounded-lg flex flex-col">
                        <span className="text-slate-400 text-[10px] uppercase font-bold">Tanggungan</span>
                        <span className="font-medium text-slate-700">{b.tanggungan ? `${b.tanggungan} Orang` : '-'}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg flex flex-col">
                        <span className="text-slate-400 text-[10px] uppercase font-bold">Penghasilan</span>
                        <span className="font-medium text-slate-700">{b.penghasilan_awal ? formatRupiah(Number(b.penghasilan_awal)) : '-'}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-50 p-2 rounded-lg flex flex-col">
                        <span className="text-slate-400 text-[10px] uppercase font-bold">Status GK</span>
                        <span className="font-medium text-slate-700">{b.status_gk || '-'}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg flex flex-col">
                        <span className="text-slate-400 text-[10px] uppercase font-bold">Status HK</span>
                        <span className="font-medium text-slate-700">{b.status_hk || '-'}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-50 p-2 rounded-lg flex flex-col">
                        <span className="text-slate-400 text-[10px] uppercase font-bold">Selisih GK</span>
                        <span className="font-medium text-slate-700">{b.selisih_gk ? formatRupiah(Number(b.selisih_gk)) : '-'}</span>
                      </div>
                      <div className="bg-slate-50 p-2 rounded-lg flex flex-col">
                        <span className="text-slate-400 text-[10px] uppercase font-bold">NIB/Halal</span>
                        <span className="font-medium text-slate-700">{b.nib_halal || '-'}</span>
                      </div>
                    </div>
                  </div>
                ))}
                {data.beneficiaries.length === 0 && (
                  <div className="p-6 text-center text-slate-500 text-sm">Tidak ada target PM yang dipilih.</div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Modal Revisi */}
      <Dialog open={isRevisionModalOpen} onOpenChange={setIsRevisionModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Kirim Catatan Revisi</DialogTitle>
            <DialogDescription>
              Berikan alasan atau bagian mana yang perlu diperbaiki oleh relawan pada Action Plan ini.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea 
              placeholder="Contoh: Tolong sesuaikan nominal RAB dengan jumlah PM..." 
              value={catatanRevisi}
              onChange={(e) => setCatatanRevisi(e.target.value)}
              className="min-h-[120px] resize-none focus-visible:ring-rose-500"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRevisionModalOpen(false)} disabled={isUpdating}>Batal</Button>
            <Button className="bg-rose-600 hover:bg-rose-700 text-white" onClick={submitRevision} disabled={isUpdating}>
              {isUpdating ? 'Mengirim...' : 'Kirim Revisi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
