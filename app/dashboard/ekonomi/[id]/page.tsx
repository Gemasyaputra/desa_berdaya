'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  ChevronLeft, 
  TrendingUp, 
  Calendar, 
  User, 
  Calculator,
  Database,
  Search,
  CheckCircle2,
  Trash2,
  Edit,
  DollarSign,
  Briefcase
} from 'lucide-react'
import { getEkonomiUpdateById, deleteEkonomiUpdate } from '../actions'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'
import { formatIDR } from '@/lib/utils'

export default function EkonomiDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = Number(params.id)
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const result = await getEkonomiUpdateById(id)
        if (result) {
          setData(result)
        } else {
          toast.error('Data tidak ditemukan')
          router.push('/dashboard/ekonomi')
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
      await deleteEkonomiUpdate(id)
      toast.success('Data berhasil dihapus')
      router.push('/dashboard/ekonomi')
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
      Memuat detail data...
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
            onClick={() => router.push('/dashboard/ekonomi')} 
            className="rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Detail Update Ekonomi</h1>
            <p className="text-slate-500 text-sm font-medium">Record perkembangan ekonomi Penerima Manfaat.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline"
            onClick={() => router.push(`/dashboard/ekonomi/${id}/edit`)}
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
        {/* Left Column: Beneficiary & Period */}
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
              <div className="pt-4 border-t border-slate-100 grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Bulan</p>
                  <p className="font-bold text-slate-700">{getBulanName(data.bulan)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tahun</p>
                  <p className="font-bold text-slate-700">{data.tahun}</p>
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className={`w-4 h-4 ${data.checked ? 'text-emerald-500' : 'text-slate-300'}`} />
                  <span className={`text-xs font-bold ${data.checked ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {data.checked ? 'Sudah Diverifikasi' : 'Belum Diverifikasi'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white">
            <CardHeader className="p-6 pb-0 flex flex-row items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <Briefcase className="w-5 h-5" />
              </div>
              <CardTitle className="text-sm font-black text-slate-800 uppercase tracking-widest">Kategori Bisnis</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-blue-50 text-blue-700 border-none font-bold px-3 py-1">
                  {data.kategori}
                </Badge>
                <Badge className="bg-slate-50 text-slate-600 border-none font-bold px-3 py-1">
                  {data.tipe}
                </Badge>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Produk / Komoditas</p>
                <p className="font-bold text-slate-700">{data.komoditas_produk || '-'}</p>
              </div>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Program Desa Berdaya</p>
                <p className="font-bold text-slate-700">{data.program || '-'}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Middle & Right Column: Financial Data */}
        <div className="md:col-span-2 space-y-8">
          <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden bg-white">
            <CardHeader className="p-8 pb-0">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black text-slate-800 tracking-tight uppercase">Analisis Ekonomi</CardTitle>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Laporan Keuangan & Rasio</p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              {/* Financial Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Modal</p>
                    <p className="text-xl font-black text-slate-800">{formatIDR(Number(data.modal))}</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pengeluaran Operasional</p>
                    <p className="text-xl font-black text-slate-800">{formatIDR(Number(data.pengeluaran_operasional))}</p>
                  </div>
                  <div className="p-6 bg-emerald-50 rounded-[1.5rem] border border-emerald-100">
                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Total Omzet</p>
                    <p className="text-xl font-black text-emerald-800">{formatIDR(Number(data.omzet))}</p>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pendapatan Utama</p>
                    <p className="text-xl font-black text-slate-800">{formatIDR(Number(data.pendapatan))}</p>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-[1.5rem] border border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pendapatan Lainnya</p>
                    <p className="text-xl font-black text-slate-800">{formatIDR(Number(data.pendapatan_lainnya))}</p>
                  </div>
                  <div className="p-6 bg-emerald-600 rounded-[1.5rem] text-white shadow-lg shadow-emerald-200">
                    <p className="text-[10px] font-bold text-emerald-100 uppercase tracking-widest mb-1">Total Pendapatan</p>
                    <p className="text-xl font-black">
                      {formatIDR(Number(data.pendapatan) + Number(data.pendapatan_lainnya))}
                    </p>
                  </div>
                </div>
              </div>

              {/* Automatic Ratios */}
              <div className="pt-8 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex items-center gap-4 p-6 bg-blue-50 rounded-[1.5rem] border border-blue-100">
                  <div className="p-3 bg-blue-100 text-blue-600 rounded-xl">
                    <Calculator className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Nilai NTP / Rasio</p>
                    <p className="text-2xl font-black text-blue-800">{data.nilai_ntp}%</p>
                  </div>
                </div>

                <div className={`flex items-center gap-4 p-6 rounded-[1.5rem] border ${data.status_gk === 'Di Atas GK' ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                  <div className={`p-3 rounded-xl ${data.status_gk === 'Di Atas GK' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    <Search className="w-5 h-5" />
                  </div>
                  <div>
                    <p className={`text-[10px] font-bold uppercase tracking-widest ${data.status_gk === 'Di Atas GK' ? 'text-emerald-600' : 'text-rose-600'}`}>Status Garis Kemiskinan</p>
                    <p className={`text-xl font-black ${data.status_gk === 'Atas GK' ? 'text-emerald-800' : 'text-rose-800'}`}>{data.status_gk}</p>
                    <p className="text-[10px] text-slate-400 font-bold">({data.jumlah_tanggungan} Tanggungan)</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
