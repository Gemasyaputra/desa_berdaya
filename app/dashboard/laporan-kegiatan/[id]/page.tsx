'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { 
  getLaporanKegiatanById, 
  getDesaHierarchy 
} from '../actions'
import { 
  ChevronLeft, 
  Calendar, 
  MapPin, 
  FileText, 
  Users, 
  CheckCircle2,
  FileImage,
  DollarSign,
  ClipboardList,
  Target,
  MessageCircle,
  Send,
  Share2
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default function LaporanDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [laporan, setLaporan] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [hierarchy, setHierarchy] = useState<any>(null)
  const [beritaText, setBeritaText] = useState('')

  useEffect(() => {
    async function loadData() {
      try {
        const id = Number(params.id)
        const data = await getLaporanKegiatanById(id)
        if (data) {
          setLaporan(data)
          const h = await getDesaHierarchy(data.desa_berdaya_id)
          setHierarchy(h)

          const pmTotal = data.jumlah_pm_total || 0;
          const pmLaki = data.jumlah_pm_laki || 0;
          const pmPerempuan = data.jumlah_pm_perempuan || 0;
          const formatedDate = data.tanggal_kegiatan ? new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(data.tanggal_kegiatan)) : '-';

          setBeritaText(`*${data.judul_kegiatan}*

${formatedDate} - ${data.lokasi_pelaksanaan || '-'}

${data.deskripsi || '-'}

*Poin Utama Kegiatan:*
- Sasaran: ${data.sasaran_program || '-'}
- Cakupan Manfaat: ${pmLaki} Laki-laki, ${pmPerempuan} Perempuan
- Total Manfaat: ${pmTotal} Jiwa

${h?.nama_desa || '-'} - Laporan By: ${h?.nama_relawan || '-'}`)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [params.id])

  if (loading) return <div className="p-8 text-center text-slate-500">Memuat detail laporan...</div>
  if (!laporan) return <div className="p-8 text-center text-slate-500">Laporan tidak ditemukan</div>

  const formatRupiah = (number: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(number)
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return '-'
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(dateString))
  }

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto space-y-8 bg-slate-50/50 min-h-screen">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-full bg-white shadow-sm border">
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{laporan.judul_kegiatan}</h1>
            <Badge variant="outline" className="bg-white text-teal-700 border-teal-200">
              {laporan.jenis_kegiatan}
            </Badge>
          </div>
          <p className="text-slate-500 text-sm font-medium">Laporan Realisasi Program Desa Berdaya</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Left Column: Info & Hierarchy */}
        <div className="space-y-6">
          <Card className="bg-white border-none shadow-xl shadow-slate-200/50 overflow-hidden rounded-[2rem]">
            <CardHeader className="bg-[#7a1200] text-white p-6 border-none">
              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-white/70" />
                <CardTitle className="font-bold text-lg text-white">{laporan.nama_desa}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <InfoRow label="Cabang/Office" value={hierarchy?.cabang} icon={MapPin} />
              <InfoRow label="Monev" value={hierarchy?.nama_monev} icon={MapPin} />
              <InfoRow label="Korwil" value={hierarchy?.nama_korwil} icon={MapPin} />
              <InfoRow label="Relawan" value={hierarchy?.nama_relawan} icon={MapPin} />
            </CardContent>
          </Card>

          <Card className="bg-white border-none shadow-xl shadow-slate-200/50 overflow-hidden rounded-[2rem]">
            <CardHeader className="p-6 pb-2 border-none">
              <h3 className="font-bold text-sm text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" /> Cakupan PM
              </h3>
            </CardHeader>
            <CardContent className="p-6 pt-2 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <StatBox label="PM L" value={laporan.jumlah_pm_laki} color="blue" />
                <StatBox label="PM P" value={laporan.jumlah_pm_perempuan} color="rose" />
                <StatBox label="Kelompok L" value={laporan.jumlah_kelompok_laki} color="blue" />
                <StatBox label="Kelompok P" value={laporan.jumlah_kelompok_perempuan} color="rose" />
              </div>
              <div className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                <p className="text-xs text-slate-500 font-bold uppercase">Total Manfaat</p>
                <p className="text-xl font-bold text-slate-800">{laporan.jumlah_pm_total} Jiwa</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Execution Details */}
        <div className="xl:col-span-2 space-y-8">
          <Card className="bg-white border-none shadow-xl shadow-slate-200/50 rounded-[2rem] p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              <div className="space-y-4">
                <DetailItem label="Tanggal Pelaksanaan" value={formatDate(laporan.tanggal_kegiatan)} icon={Calendar} />
                <DetailItem label="Lokasi" value={laporan.lokasi_pelaksanaan} icon={MapPin} />
                <DetailItem label="Sasaran" value={laporan.sasaran_program} icon={Target} />
                <DetailItem 
                  label="Kelompok" 
                  value={Array.isArray(laporan.nama_kelompok_list) && laporan.nama_kelompok_list.length > 0 ? laporan.nama_kelompok_list.join(', ') : '-'} 
                  icon={Users} 
                />
                <DetailItem 
                  label="Daftar Hadir (PM)" 
                  value={Array.isArray(laporan.nama_pm_list) && laporan.nama_pm_list.length > 0 ? laporan.nama_pm_list.join(', ') : '-'} 
                  icon={Users} 
                />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-sm text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-[#7a1200]" /> Deskripsi Kegiatan
                {laporan.is_terdokumentasi && (
                  <div className="ml-auto inline-flex items-center gap-1.5 px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-tight">
                    <CheckCircle2 className="w-3 h-3" /> Terdokumentasi
                  </div>
                )}
              </h3>
              <p className="text-slate-600 leading-relaxed text-sm whitespace-pre-wrap bg-slate-50/50 p-6 rounded-3xl border border-slate-100">
                {laporan.deskripsi}
              </p>
            </div>

            {laporan.custom_fields_data && Object.keys(laporan.custom_fields_data).length > 0 && (
              <div className="space-y-4 mt-8 pt-8 border-t border-slate-100">
                <h3 className="font-bold text-sm text-slate-800 uppercase tracking-tight flex items-center gap-2">
                  <FileText className="w-4 h-4 text-teal-600" /> Informasi Tambahan
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(laporan.custom_fields_data).map(([key, value]: [string, any]) => (
                    <div key={key} className="p-4 bg-slate-50/50 rounded-2xl border border-slate-100">
                      <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-tight mb-1">{key.replace(/_/g, ' ')}</p>
                      <p className="font-bold text-slate-700 text-sm">
                        {Array.isArray(value) ? value.join(', ') : (value?.toString() || '-')}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 pt-8 border-t border-slate-100 space-y-4">
              <h3 className="font-bold text-sm text-slate-800 uppercase tracking-tight flex items-center gap-2">
                <FileImage className="w-4 h-4 text-[#7a1200]" /> Lampiran Bukti
              </h3>
              {Array.isArray(laporan.bukti_url) && laporan.bukti_url.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {laporan.bukti_url.map((url: string, index: number) => (
                    <a 
                      key={index} 
                      href={url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="aspect-square rounded-[1.5rem] overflow-hidden border-2 border-slate-100 bg-slate-50 shadow-sm transition-all hover:shadow-md hover:border-[#7a1200]/30 group relative"
                    >
                      <img src={url} alt={`Bukti ${index + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <Badge variant="secondary" className="bg-white/90 text-[10px] font-bold uppercase text-slate-800">Lihat</Badge>
                      </div>
                    </a>
                  ))}
                </div>
              ) : typeof laporan.bukti_url === 'string' && laporan.bukti_url ? (
                <Button className="bg-[#7a1200] hover:bg-[#5a0d00] rounded-2xl h-12 px-6 font-black gap-2 shadow-lg shadow-[#7a1200]/20" asChild>
                  <a href={laporan.bukti_url} target="_blank" rel="noreferrer">
                    <FileImage className="w-5 h-5" />
                    Buka Lampiran Bukti
                  </a>
                </Button>
              ) : (
                <span className="text-slate-400 text-xs italic">Tidak ada lampiran bukti</span>
              )}
              <div className="flex justify-between items-center pt-4 border-t border-slate-50">
                <p className="text-[10px] text-slate-400 font-bold uppercase">ID Laporan: #{laporan.id}</p>
              </div>
            </div>
          </Card>

          {/* Rilis Berita Card */}
          <Card className="bg-white border-none shadow-xl shadow-slate-200/50 rounded-[2rem] p-8">
            <div className="space-y-6">
              <h3 className="font-bold text-lg text-slate-800 tracking-tight flex items-center gap-2">
                <Share2 className="w-5 h-5 text-emerald-600" /> Rilis Berita & Forward
              </h3>
              <p className="text-sm text-slate-500 font-medium">
                Draft berita di bawah ini di-generate secara otomatis. Anda dapat menyesuaikannya sebelum membagikan (forward) ke platform messaging.
              </p>
              
              <textarea 
                className="w-full h-64 p-4 text-sm bg-slate-50 rounded-2xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-700 leading-relaxed font-medium resize-y"
                value={beritaText}
                onChange={(e) => setBeritaText(e.target.value)}
              />

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Button 
                  className="flex-1 bg-[#25D366] hover:bg-[#1DA851] text-white rounded-2xl h-12 font-bold shadow-lg shadow-[#25D366]/20 gap-2"
                  onClick={() => {
                    const url = `https://wa.me/?text=${encodeURIComponent(beritaText)}`;
                    window.open(url, '_blank');
                  }}
                >
                  <MessageCircle className="w-5 h-5" />
                  FORWARD KE WHATSAPP
                </Button>
                <Button 
                  className="flex-1 bg-[#0088cc] hover:bg-[#0077b5] text-white rounded-2xl h-12 font-bold shadow-lg shadow-[#0088cc]/20 gap-2"
                  onClick={() => {
                    const url = `https://t.me/share/url?url=&text=${encodeURIComponent(beritaText)}`;
                    window.open(url, '_blank');
                  }}
                >
                  <Send className="w-5 h-5" />
                  FORWARD KE TELEGRAM
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

function InfoRow({ label, value, icon: Icon }: any) {
  return (
    <div className="flex items-start gap-4">
      <div className="p-2 bg-slate-50 rounded-lg text-slate-400 flex-shrink-0">
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] font-semibold text-slate-500 uppercase leading-none mb-1">{label}</p>
        <p className="font-bold text-slate-700 text-sm">{value || '-'}</p>
      </div>
    </div>
  )
}

function DetailItem({ label, value, icon: Icon }: any) {
  return (
    <div className="flex items-start gap-4">
      <div className="p-3 bg-slate-50 rounded-2xl text-slate-400 flex-shrink-0">
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-tight leading-none mb-1">{label}</p>
        <p className="font-bold text-slate-800 text-base">{value || '-'}</p>
      </div>
    </div>
  )
}

function StatBox({ label, value, color }: any) {
  const colors: any = {
    blue: 'bg-blue-50 text-blue-700 border-blue-100',
    rose: 'bg-rose-50 text-rose-700 border-rose-100'
  }
  return (
    <div className={`p-3 rounded-2xl border ${colors[color]}`}>
      <p className="text-[9px] font-semibold uppercase leading-tight">{label}</p>
      <p className="text-lg font-bold">{value || 0}</p>
    </div>
  )
}
