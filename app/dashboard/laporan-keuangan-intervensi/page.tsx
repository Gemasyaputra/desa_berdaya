'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useRouter } from 'next/navigation'
import { 
  Receipt, 
  ChevronRight, 
  Building2, 
  Target, 
  User, 
  Search,
  Wallet,
  CheckCircle2,
  Clock,
  LayoutGrid
} from 'lucide-react'
import { getLaporanKeuanganIntervensi } from './actions'
import { Input } from '@/components/ui/input'
import { useSession } from 'next-auth/react'

export default function LaporanKeuanganIntervensiPage() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const router = useRouter()
  const { data: session } = useSession()
  const role = (session?.user as any)?.role

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const res = await getLaporanKeuanganIntervensi()
      setData(res as any[])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filtered = data.filter(item => 
    (item.nama_desa || '').toLowerCase().includes(search.toLowerCase()) ||
    (item.nama_program || '').toLowerCase().includes(search.toLowerCase()) ||
    (item.nama_relawan || '').toLowerCase().includes(search.toLowerCase())
  )

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED': return <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 uppercase text-[10px] font-bold">APPROVED</Badge>
      case 'CANCELLED': return <Badge className="bg-rose-100 text-rose-700 hover:bg-rose-100 uppercase text-[10px] font-bold">CANCELLED</Badge>
      default: return <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 uppercase text-[10px] font-bold">DRAFT</Badge>
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8 bg-slate-50/50 min-h-screen">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-[#008784]/10 border border-[#008784]/20 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform hover:scale-105">
            <Receipt className="w-7 h-7 text-[#008784]" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tight text-slate-800">Laporan Keuangan Intervensi</h1>
            <p className="text-sm font-medium text-slate-500 mt-1">Kelola bukti CA (Cash Advance) untuk setiap program</p>
          </div>
        </div>
      </div>

      {/* Control Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-[#008784] transition-colors" />
          <Input
            placeholder="Cari desa, program, atau relawan..."
            className="pl-11 h-12 w-full rounded-2xl border-slate-200 bg-white text-sm shadow-sm focus:border-[#008784]/40 focus:ring-4 focus:ring-[#008784]/5 transition-all"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm whitespace-nowrap">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total:</span>
          <span className="text-sm font-black text-[#008784]">{filtered.length}</span>
        </div>
      </div>

      {/* Grid List */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3,4,5,6].map(i => (
            <div key={i} className="h-[280px] bg-white rounded-[2rem] animate-pulse border border-slate-100" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-dashed border-2 bg-slate-50/50 rounded-[2rem]">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
              <Receipt className="w-8 h-8 text-slate-300" />
            </div>
            <div className="text-center">
              <p className="font-bold text-slate-600">Laporan tidak ditemukan</p>
              <p className="text-xs text-slate-400">Belum ada program intervensi yang ditugaskan ke Anda.</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((item) => {
            const uploaded = parseInt(item.uploaded_ca)
            const total = parseInt(item.total_bulan)
            const progress = total > 0 ? (uploaded / total) * 100 : 0

            return (
              <Card 
                key={item.id} 
                className="group border-none shadow-xl shadow-slate-200/40 rounded-[2rem] overflow-hidden bg-white hover:ring-2 hover:ring-[#008784]/30 transition-all cursor-pointer"
                onClick={() => router.push(`/dashboard/laporan-keuangan-intervensi/${item.id}`)}
              >
                <CardHeader className="pb-4 space-y-3 relative">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex items-center gap-2 mb-1">
                        <Building2 className="w-4 h-4 text-[#008784]" />
                        <span className="text-sm font-black text-slate-800 uppercase tracking-tight line-clamp-1">{item.nama_desa}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Target className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-sm font-bold text-slate-500 line-clamp-1">{item.nama_program}</span>
                      </div>
                    </div>
                    {getStatusBadge(item.status)}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 pt-2">
                  <div className="bg-slate-50/80 p-4 rounded-3xl border border-slate-100/50 space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-end px-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Progress Bukti CA</span>
                        <span className="text-xs font-black text-[#008784]">{uploaded}/{total} Bulan</span>
                      </div>
                      <Progress value={progress} className="h-2.5 bg-slate-200">
                        <div className="h-full bg-[#008784] rounded-full transition-all" style={{ width: `${progress}%` }} />
                      </Progress>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-1 border-t border-slate-100">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Relawan</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="w-5 h-5 bg-white border border-slate-200 rounded-full flex items-center justify-center">
                            <User className="w-3 h-3 text-[#008784]" />
                          </div>
                          <span className="text-[11px] font-bold text-slate-600 truncate">{item.nama_relawan}</span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-0.5 text-right">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">Sumber Dana</span>
                        <span className="text-[11px] font-black text-[#008784] mt-1 line-clamp-1 px-2 py-0.5 bg-white border border-[#008784]/20 rounded-lg inline-block self-end uppercase">
                          {item.sumber_dana || '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button 
                    className="w-full h-12 bg-white hover:bg-[#008784] text-[#008784] hover:text-white border-2 border-[#008784]/10 hover:border-[#008784] rounded-2xl font-bold transition-all gap-2 group-hover:shadow-lg group-hover:shadow-[#008784]/10"
                    onClick={(e) => {
                      e.stopPropagation()
                      router.push(`/dashboard/laporan-keuangan-intervensi/${item.id}`)
                    }}
                  >
                    <LayoutGrid className="w-4 h-4" />
                    Manajemen Bukti CA
                    <ChevronRight className="w-4 h-4 ml-auto" />
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
