'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  ChevronLeft, 
  Stethoscope, 
  Calendar, 
  User, 
  Baby,
  Heart,
  Activity,
  Trash2,
  Edit,
  CheckCircle2,
  ShieldCheck,
  ClipboardList
} from 'lucide-react'
import { getKesehatanUpdateById, deleteKesehatanUpdate } from '../actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { formatDate } from '@/lib/db'

export default function KesehatanDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = Number(params.id)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const result = await getKesehatanUpdateById(id)
        if (result) {
          setData(result)
        } else {
          toast.error('Data tidak ditemukan')
          router.push('/dashboard/kesehatan')
        }
      } catch (err) {
        console.error(err)
        toast.error('Gagal memuat data')
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [id, router])

  const handleDelete = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus data ini?')) return
    try {
      await deleteKesehatanUpdate(id)
      toast.success('Data berhasil dihapus')
      router.push('/dashboard/kesehatan')
    } catch (err) {
      toast.error('Gagal menghapus data')
    }
  }

  const getBulanName = (month: number) => {
    const names = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ]
    return names[month - 1] || '-'
  }

  if (loading) return (
    <div className="p-8 text-center text-slate-400 font-bold animate-pulse">
      Memuat detail data kesehatan...
    </div>
  )

  if (!data) return null

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-8 bg-slate-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push('/dashboard/kesehatan')} 
            className="rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Detail Update Kesehatan</h1>
            <p className="text-slate-500 text-sm font-medium">Record pemantauan kesehatan Penerima Manfaat.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={() => router.push(`/dashboard/kesehatan/${id}/edit`)}
            className="rounded-2xl border-slate-200 hover:bg-slate-50 font-bold gap-2 px-6"
          >
            <Edit className="w-4 h-4" />
            Edit
          </Button>
          <Button 
            variant="ghost"
            onClick={handleDelete}
            className="rounded-2xl text-rose-600 hover:bg-rose-50 hover:text-rose-700 font-bold gap-2 px-6"
          >
            <Trash2 className="w-4 h-4" />
            Hapus
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="space-y-6">
          <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden">
            <CardHeader className="bg-[#7a1200] text-white p-6">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-white/70" />
                <CardTitle className="text-xl font-bold uppercase tracking-tight">Profil PM</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nama Lengkap</p>
                <p className="text-lg font-black text-slate-800">{data.nama_pm}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">NIK</p>
                <p className="font-mono font-bold text-[#7a1200]">{data.nik_pm}</p>
              </div>
              <div className="pt-4 border-t border-slate-100 flex flex-col gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Program</p>
                  <Badge className="bg-rose-50 text-rose-700 border-none font-bold uppercase text-[10px]">
                    {data.program_kesehatan}
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bulan</p>
                    <p className="font-bold text-slate-700">{getBulanName(data.bulan)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tahun</p>
                    <p className="font-bold text-slate-700">{data.tahun}</p>
                  </div>
                </div>
                 <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Relawan</p>
                  <p className="font-bold text-slate-700 italic text-sm">{data.nama_relawan || '-'}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`w-4 h-4 ${data.checked ? 'text-emerald-500' : 'text-slate-300'}`} />
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${data.checked ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {data.checked ? 'Verified' : 'Pending'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                   <ShieldCheck className={`w-4 h-4 ${data.is_kader ? 'text-blue-500' : 'text-slate-300'}`} />
                   <span className={`text-[10px] font-bold uppercase tracking-widest ${data.is_kader ? 'text-blue-600' : 'text-slate-400'}`}>
                    {data.is_kader ? 'Kader' : 'Non-Kader'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Form Details */}
        <div className="md:col-span-2 space-y-8">
          {data.is_anak && (
            <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white">
              <CardHeader className="p-8 pb-0">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                    <Baby className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-black text-slate-800 tracking-tight uppercase">Data Tumbuh Kembang Anak</CardTitle>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Hasil Pemeriksaan Rutin</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <DataPoint label="Tgl Lahir" value={formatDate(data.anak_tgl_lahir)} />
                  <DataPoint label="Tgl Periksa" value={formatDate(data.tgl_pemeriksaan_anak)} />
                  <DataPoint label="BB Lahir" value={`${data.anak_bb_lahir} kg`} />
                  <DataPoint label="Anak Ke" value={data.anak_ke} />
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-slate-100">
                  <DataPoint label="Tinggi Badan" value={`${data.anak_tinggi_badan} cm`} highlight />
                  <DataPoint label="Berat Badan" value={`${data.anak_berat_badan} kg`} highlight />
                  <DataPoint label="Lingkar Kepala" value={`${data.anak_lingkar_kepala} cm`} highlight />
                  <DataPoint label="ASI Eksklusif" value={`${data.anak_asi_eksklusif} Bulan`} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Nama Ibu</p>
                    <p className="font-bold text-slate-700">{data.anak_nama_ibu || '-'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Metode Ukur</p>
                    <p className="font-bold text-slate-700">{data.anak_metode_pengukuran || '-'}</p>
                  </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Daftar Imunisasi</p>
                   <div className="flex flex-wrap gap-2">
                    {data.anak_imunisasi && JSON.parse(data.anak_imunisasi).length > 0 ? (
                      JSON.parse(data.anak_imunisasi).map((imun: string) => (
                        <Badge key={imun} variant="outline" className="border-emerald-200 text-emerald-700 bg-emerald-50 px-3 py-1 font-bold">
                          {imun}
                        </Badge>
                      ))
                    ) : '-'}
                   </div>
                </div>

                <div className="flex gap-8 pt-6 border-t border-slate-100">
                   <StatusBadge label="IMD" status={data.anak_imd} />
                   <StatusBadge label="Pendampingan Khusus" status={data.anak_pendampingan_khusus === 'Ya'} />
                   <StatusBadge label="Menderita Diare" status={data.anak_menderita_diare} isNegative />
                </div>
              </CardContent>
            </Card>
          )}

          {data.is_ibu && (
             <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white">
              <CardHeader className="p-8 pb-0">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl">
                    <Heart className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-black text-slate-800 tracking-tight uppercase">Kesehatan Ibu Hamil</CardTitle>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Buku KIA & ANC</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <DataPoint label="NIK Ibu" value={data.ibu_nik || '-'} />
                  <DataPoint label="Tgl Lahir" value={formatDate(data.ibu_tgl_lahir)} />
                  <DataPoint label="Tgl Periksa" value={formatDate(data.tgl_pemeriksaan_ibu)} />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-slate-100">
                  <DataPoint label="BB Sblm Hamil" value={`${data.ibu_bb_sebelum_hamil} kg`} />
                  <DataPoint label="Tinggi Badan" value={`${data.ibu_tinggi_badan} cm`} />
                  <DataPoint label="Berat Badan" value={`${data.ibu_berat_badan} kg`} highlight />
                  <DataPoint label="LILA" value={`${data.ibu_lila} cm`} />
                </div>

                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                   <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100">
                      <p className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-1">Umur Kehamilan</p>
                      <p className="text-2xl font-black text-rose-900">{data.ibu_umur_kehamilan} Bulan</p>
                   </div>
                   <div className="flex items-center gap-4">
                      <StatusBadge label="Status HB" status={data.ibu_hb} />
                   </div>
                </div>

                <div className="pt-6 border-t border-slate-100">
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Imunisasi Ibu (TT)</p>
                   <div className="flex flex-wrap gap-2">
                    {data.ibu_imunisasi && JSON.parse(data.ibu_imunisasi).length > 0 ? (
                      JSON.parse(data.ibu_imunisasi).map((imun: string) => (
                        <Badge key={imun} variant="outline" className="border-rose-200 text-rose-700 bg-rose-50 px-3 py-1 font-bold">
                          {imun}
                        </Badge>
                      ))
                    ) : '-'}
                   </div>
                </div>
              </CardContent>
            </Card>
          )}

          {data.is_lansia && (
             <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white">
              <CardHeader className="p-8 pb-0">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                    <Activity className="w-6 h-6" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl font-black text-slate-800 tracking-tight uppercase">Kesehatan Lansia</CardTitle>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Monitoring Penyakit Tidak Menular</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-8 space-y-8">
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  <DataPoint label="Tgl Lahir" value={formatDate(data.lansia_tgl_lahir)} />
                  <DataPoint label="Tgl Periksa" value={formatDate(data.tgl_pemeriksaan_lansia)} />
                  <DataPoint label="BPJS" value={data.lansia_kepemilikan_bpjs || '-'} />
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-slate-100">
                  <DataPoint label="Tinggi Badan" value={`${data.lansia_tinggi_badan} cm`} />
                  <DataPoint label="Berat Badan" value={`${data.lansia_berat_badan} kg`} />
                  <DataPoint label="Tekanan Darah" value={data.lansia_tekanan_darah || '-'} highlight />
                  <DataPoint label="Penanggung Biaya" value={data.lansia_penanggung_biaya || '-'} />
                </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-100">
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Kolesterol</p>
                    <p className="text-xl font-black text-slate-800">{data.lansia_kolesterol} <span className="text-[10px] text-slate-400 font-normal">mg/dL</span></p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Gula Darah</p>
                    <p className="text-xl font-black text-slate-800">{data.lansia_gula} <span className="text-[10px] text-slate-400 font-normal">mg/dL</span></p>
                  </div>
                  <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Asam Urat</p>
                    <p className="text-xl font-black text-slate-800">{data.lansia_asam_urat} <span className="text-[10px] text-slate-400 font-normal">mg/dL</span></p>
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t border-slate-100">
                  <div className="space-y-1">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aktivitas Harian</p>
                    <p className="font-bold text-slate-700 text-sm">{data.lansia_aktivitas_harian || '-'}</p>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1 p-4 bg-blue-50/50 rounded-2xl border border-blue-100">
                      <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Riwayat Penyakit</p>
                      <p className="text-sm font-medium text-slate-700">{data.lansia_riwayat_penyakit || '-'}</p>
                    </div>
                    <div className="space-y-1 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100">
                      <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Riwayat Pengobatan</p>
                      <p className="text-sm font-medium text-slate-700">{data.lansia_riwayat_pengobatan || '-'}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function DataPoint({ label, value, highlight }: any) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</p>
      <p className={`font-black tracking-tight ${highlight ? 'text-lg text-slate-800' : 'text-slate-700'}`}>{value || '-'}</p>
    </div>
  )
}

function StatusBadge({ label, status, isNegative }: any) {
  const iconColor = status 
    ? (isNegative ? 'text-rose-500' : 'text-emerald-500') 
    : 'text-slate-300'
  
  return (
    <div className="flex items-center gap-2">
      <CheckCircle2 className={`w-4 h-4 ${iconColor}`} />
      <span className={`text-[10px] font-bold uppercase tracking-widest ${status ? (isNegative ? 'text-rose-600' : 'text-emerald-600') : 'text-slate-400'}`}>
        {label}
      </span>
    </div>
  )
}
