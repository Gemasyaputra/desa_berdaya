'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  Area, AreaChart, LabelList
} from 'recharts'
import { Building2, Users, TrendingUp, Wallet, RefreshCw, MapPin, ChevronDown, ChevronRight, UserCheck, Shield } from 'lucide-react'
import {
  getDashboardStats, getAnggaranPerDesa, getTrendLaporanBulanan,
  getSebaranStatusDesa, getRankingRelawan, getTeamForMonev, getTeamForKorwil,
  getVillageMapPoints, getVillageDistributionStats, getRangkumanDana,
  type DashboardStats, type AnggaranPerDesa, type TrendBulanan,
  type SebaranStatus, type RankingRelawan, type TeamForMonev, type TeamForKorwil,
  type VillageMapPoint, type DistributionStats, type RangkumanDana,
} from './actions'
import dynamic from 'next/dynamic'

const SuperAdminMap = dynamic(
  () => import('./super-admin-map').then((mod) => mod.SuperAdminMap),
  { ssr: false }
)

// =====================================================
// Helpers
// =====================================================
function formatRupiah(v: number) {
  if (v >= 1_000_000) return `Rp ${(v / 1_000_000).toFixed(1)}jt`
  if (v >= 1_000) return `Rp ${(v / 1_000).toFixed(0)}rb`
  return `Rp ${v}`
}
function formatRupiahFull(v: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(v)
}

const BRAND_COLORS = ['#7a1200', '#b91c1c', '#dc2626', '#ef4444', '#f87171', '#fca5a5', '#fecaca']
const currentYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 4 }, (_, i) => currentYear - i)

// =====================================================
// Custom Tooltip
// =====================================================
function CustomBarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-lg p-3 text-sm">
      <p className="font-semibold text-slate-700 mb-1">{label}</p>
      {payload.map((p: any) => (
        <p key={p.name} style={{ color: p.color }}>
          {p.name}: {formatRupiahFull(p.value)}
        </p>
      ))}
    </div>
  )
}

// =====================================================
// Skeleton loader
// =====================================================
function SkeletonCard() {
  return (
    <div className="animate-pulse bg-slate-100 rounded-2xl h-32" />
  )
}

// =====================================================
// KPICard Component - Minimalist
// =====================================================
function KPICard({ 
  title, 
  value, 
  subValue, 
  icon: Icon, 
  progress 
}: { 
  title: string
  value: string | number
  subValue?: string
  icon: any
  progress?: number
}) {
  return (
    <Card className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.03)] bg-white rounded-2xl overflow-hidden group hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 ring-1 ring-slate-100">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-2">{title}</p>
            <p className="text-3xl font-black text-slate-800 tracking-tight">{value}</p>
            {subValue && <p className="text-slate-400 text-[10px] mt-1.5 font-medium">{subValue}</p>}
          </div>
          <div className="w-11 h-11 bg-slate-50 rounded-xl flex items-center justify-center border border-slate-100 group-hover:bg-red-50 group-hover:border-red-100 transition-colors duration-300">
            <Icon className="w-5 h-5 text-slate-400 group-hover:text-[#7a1200] transition-colors" />
          </div>
        </div>
        
        {progress !== undefined && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Realisasi</span>
              <span className="text-[10px] font-black text-[#7a1200] bg-red-50 px-1.5 py-0.5 rounded-md">{progress.toFixed(0)}%</span>
            </div>
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
              <div 
                className="h-full bg-[#7a1200] rounded-full transition-all duration-1000 ease-out" 
                style={{ width: `${progress}%` }} 
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function DashboardPage() {
  const [tahun, setTahun] = useState(String(currentYear))
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [anggaran, setAnggaran] = useState<AnggaranPerDesa[]>([])
  const [trend, setTrend] = useState<TrendBulanan[]>([])
  const [sebaran, setSebaran] = useState<SebaranStatus[]>([])
  const [ranking, setRanking] = useState<RankingRelawan[]>([])
  const [teamMonev, setTeamMonev] = useState<TeamForMonev | null>(null)
  const [teamKorwil, setTeamKorwil] = useState<TeamForKorwil | null>(null)
  const [mapPoints, setMapPoints] = useState<VillageMapPoint[]>([])
  const [distStats, setDistStats] = useState<DistributionStats | null>(null)
  const [rangkumanDana, setRangkumanDana] = useState<RangkumanDana | null>(null)
  const [expandedKorwils, setExpandedKorwils] = useState<Set<number>>(new Set())
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const y = parseInt(tahun)
      const [s, a, t, se, r, tm, tk, mp, ds, rd] = await Promise.all([
        getDashboardStats(y),
        getAnggaranPerDesa(y),
        getTrendLaporanBulanan(y),
        getSebaranStatusDesa(),
        getRankingRelawan(),
        getTeamForMonev(),
        getTeamForKorwil(),
        getVillageMapPoints(),
        getVillageDistributionStats(),
        getRangkumanDana(y),
      ])
      setStats(s)
      setAnggaran(a)
      setTrend(t)
      setSebaran(se)
      setRanking(r)
      setTeamMonev(tm)
      setTeamKorwil(tk)
      setMapPoints(mp)
      setDistStats(ds)
      setRangkumanDana(rd)
    } finally {
      setLoading(false)
    }
  }, [tahun])

  useEffect(() => { fetchAll() }, [fetchAll])

  const pctRealisasi = stats?.peresenRealisasi ?? 0

  return (
    <div className="min-h-screen bg-[#F8F9FA]">
      {/* Premium Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-slate-200/50 px-8 py-6 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1600px] mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-0.5">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-3">
              Summary Dashboard
              <span className="px-2.5 py-0.5 bg-[#7a1200]/5 text-[#7a1200] text-[10px] font-bold rounded-full uppercase tracking-widest border border-red-100">Analytics</span>
            </h1>
            <p className="text-slate-400 text-xs font-medium">Monitoring Program Pemberdayaan <span className="text-slate-500 font-bold">Desa Berdaya</span></p>
          </div>
          <div className="flex items-center gap-4">
            {mounted && (
              <div className="flex items-center bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-inner">
                <Select value={tahun} onValueChange={setTahun}>
                  <SelectTrigger className="w-[100px] border-0 bg-transparent shadow-none focus:ring-0 font-bold text-slate-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-slate-200">
                    {yearOptions.map((y) => (
                      <SelectItem key={y} value={String(y)} className="font-medium">{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button
              onClick={fetchAll}
              disabled={loading}
              className="px-6 h-11 rounded-2xl gap-2 text-white font-bold shadow-lg shadow-[#7a1200]/20 hover:shadow-[#7a1200]/30 transition-all active:scale-95"
              style={{ backgroundColor: '#7a1200' }}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh Data
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-8 py-10 space-y-10">
        {/* ── Section 1: Map ── */}
        {(mapPoints.length > 0 || (distStats && distStats.totalDesa > 0)) && (
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center border border-red-100">
                <MapPin className="w-4 h-4 text-[#7a1200]" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">Geographical Overview</h2>
            </div>
            <SuperAdminMap points={mapPoints} stats={distStats} />
          </section>
        )}

        {/* ── Section 2: KPIs ── */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {loading && !stats ? (
            Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
          ) : (
            <>
              <KPICard 
                title="Desa Binaan Aktif" 
                value={stats?.totalDesaAktif ?? 0}
                subValue={`dari ${stats?.totalDesaAll ?? 0} total desa`}
                icon={Building2}
              />
              <KPICard 
                title="Penerima Manfaat" 
                value={stats?.totalPenerimaManfaat?.toLocaleString('id-ID') ?? 0}
                subValue="Penerima Manfaat Terdaftar"
                icon={Users}
              />
              <KPICard 
                title={`Realisasi ${tahun}`} 
                value={formatRupiah(stats?.totalRealisasi ?? 0)}
                icon={Wallet}
                progress={pctRealisasi}
              />
              <KPICard 
                title="Total Relawan" 
                value={stats?.totalRelawan ?? 0}
                subValue="Relawan Desa Berpijak"
                icon={UserCheck}
              />
            </>
          )}
        </section>

        {/* ── Section 2.5: Rangkuman Dana Intervensi ── */}
        <section className="bg-white border text-left border-emerald-100/50 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-3xl p-8 ring-1 ring-slate-50 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#008784]/5 rounded-full -mr-32 -mt-32 blur-3xl opacity-50" />
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100 shadow-sm relative z-10">
              <Wallet className="w-6 h-6 text-[#008784]" />
            </div>
            <div className="relative z-10">
              <h2 className="text-xl font-black text-slate-800 tracking-tight">Rangkuman Keuangan Intervensi</h2>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Laporan Cash Advance & Saldo — Tahun {tahun}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
            {loading && !rangkumanDana ? (
              Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)
            ) : (
              <>
                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Ajuan RI</p>
                  <p className="text-xl sm:text-2xl font-black text-slate-700 tracking-tight">{formatRupiahFull(rangkumanDana?.totalAjuan ?? 0)}</p>
                </div>
                <div className="bg-[#008784]/5 border border-[#008784]/10 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-[10px] font-black text-[#008784]/60 uppercase tracking-widest mb-2">Anggaran Dicairkan</p>
                  <p className="text-xl sm:text-2xl font-black text-[#008784] tracking-tight">{formatRupiahFull(rangkumanDana?.totalCair ?? 0)}</p>
                </div>
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                  <p className="text-[10px] font-black text-amber-600/70 uppercase tracking-widest mb-2">Verified Realisasi</p>
                  <p className="text-xl sm:text-2xl font-black text-amber-600 tracking-tight">{formatRupiahFull(rangkumanDana?.totalRealisasi ?? 0)}</p>
                </div>
                <div className={`${(rangkumanDana?.sisaSaldo ?? 0) < 0 ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'} border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow`}>
                  <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${(rangkumanDana?.sisaSaldo ?? 0) < 0 ? 'text-rose-400' : 'text-slate-400'}`}>Sisa Saldo Binaan</p>
                  <p className={`text-xl sm:text-2xl font-black tracking-tight ${(rangkumanDana?.sisaSaldo ?? 0) < 0 ? 'text-rose-600' : 'text-slate-800'}`}>{formatRupiahFull(rangkumanDana?.sisaSaldo ?? 0)}</p>
                  {(rangkumanDana?.totalPengembalian ?? 0) > 0 && (
                    <p className="text-[10px] font-bold text-indigo-500 mt-2 bg-indigo-50 px-2 py-1 rounded inline-block">
                      Telah Dikembalikan: {formatRupiahFull(rangkumanDana?.totalPengembalian ?? 0)}
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </section>

        {/* ── Section 3: Charts Bento Grid ── */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Main Trend Chart */}
          <Card className="lg:col-span-8 border-0 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-2xl bg-white overflow-hidden ring-1 ring-slate-100">
            <CardHeader className="p-8 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold text-slate-800 tracking-tight">Tren Laporan Bulanan</CardTitle>
                  <p className="text-xs text-slate-400 font-medium italic mt-1">Monitoring pergerakan laporan & realisasi anggaran — {tahun}</p>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <TrendingUp className="w-5 h-5 text-slate-400" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 pt-4">
              {trend.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <LineChart data={trend} margin={{ top: 20, right: 30, left: 10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRealisasi" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#fbbf24" stopOpacity={0.15}/>
                        <stop offset="95%" stopColor="#fbbf24" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="5 5" stroke="#f1f5f9" vertical={false} />
                    <XAxis 
                      dataKey="bulan" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fontWeight: 700, fill: '#94a3b8' }} 
                      dy={10}
                    />
                    <YAxis 
                      yAxisId="left" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fontWeight: 600, fill: '#94a3b8' }} 
                    />
                    <YAxis 
                      yAxisId="right" 
                      orientation="right" 
                      axisLine={false} 
                      tickLine={false} 
                      tickFormatter={(v) => formatRupiah(v)} 
                      tick={{ fontSize: 10, fontWeight: 600, fill: '#94a3b8' }} 
                    />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Legend verticalAlign="top" align="right" height={36} iconType="circle" wrapperStyle={{ paddingBottom: '20px', fontWeight: 600, fontSize: '11px', color: '#64748b' }} />
                    <Area 
                      yAxisId="right"
                      type="monotone"
                      dataKey="total_realisasi"
                      stroke="none"
                      fill="url(#colorRealisasi)"
                    />
                    <Line 
                      yAxisId="left" 
                      type="monotone" 
                      dataKey="jumlah_laporan" 
                      name="Laporan" 
                      stroke="#7a1200" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#7a1200', strokeWidth: 2, stroke: '#fff' }} 
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      yAxisId="right" 
                      type="monotone" 
                      dataKey="total_realisasi" 
                      name="Realisasi" 
                      stroke="#fbbf24" 
                      strokeWidth={3} 
                      dot={{ r: 4, fill: '#fbbf24', strokeWidth: 2, stroke: '#fff' }} 
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[320px] flex flex-col items-center justify-center text-slate-300 gap-4">
                   <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100 italic">?</div>
                   <p className="text-sm font-bold">Belum ada data laporan di tahun {tahun}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card className="lg:col-span-4 border-0 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-2xl bg-white ring-1 ring-slate-100">
            <CardHeader className="p-8 pb-4">
              <CardTitle className="text-lg font-bold text-slate-800 tracking-tight">Status Desa</CardTitle>
              <p className="text-xs text-slate-400 font-medium">Komposisi Aktifitas Program</p>
            </CardHeader>
            <CardContent className="p-8 pt-4">
              {sebaran.length > 0 ? (
                <div className="flex flex-col h-full justify-between gap-8">
                  <div className="relative">
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie 
                          data={sebaran} 
                          dataKey="value" 
                          nameKey="label" 
                          cx="50%" 
                          cy="50%" 
                          innerRadius={65}
                          outerRadius={90} 
                          paddingAngle={8}
                        >
                          {sebaran.map((_, i) => (
                            <Cell key={i} fill={i === 0 ? '#7a1200' : '#334155'} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Total</p>
                      <p className="text-xl font-black text-slate-800">{stats?.totalDesaAll ?? 0}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {sebaran.map((s, i) => (
                      <div key={i} className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-2.5">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: i === 0 ? '#7a1200' : '#e2e8f0' }} />
                          <span className="text-[13px] font-semibold text-slate-600">{s.label}</span>
                        </div>
                        <span className="text-sm font-bold text-slate-800">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-white/20 italic font-medium">No Data Available</div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* ── Section 4: Rankings & Data ── */}
        <section className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Anggaran per Desa */}
          <Card className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-2xl bg-white ring-1 ring-slate-100">
            <CardHeader className="p-8">
              <CardTitle className="text-lg font-bold text-slate-800 tracking-tight">Leaderboard Desa</CardTitle>
              <p className="text-xs text-slate-400 font-medium italic mt-1">Top 10 desa berdasarkan serapan realisasi</p>
            </CardHeader>
            <CardContent className="px-6 pb-8">
              {anggaran.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={anggaran} layout="vertical" margin={{ top: 0, right: 40, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" hide />
                    <YAxis 
                      type="category" 
                      dataKey="nama_desa" 
                      tick={{ fontSize: 11, fontWeight: 700, fill: '#475569' }} 
                      width={120} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Bar 
                      dataKey="realisasi" 
                      name="Realisasi" 
                      fill="#7a1200" 
                      radius={[0, 4, 4, 0]} 
                      barSize={16}
                    >
                      <LabelList 
                        dataKey="realisasi" 
                        position="right" 
                        formatter={(v: number) => formatRupiah(v)} 
                        style={{ fontSize: '10px', fontWeight: 700, fill: '#64748b' }} 
                        offset={10}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[320px] flex items-center justify-center text-slate-300 italic">No rankings to display</div>
              )}
            </CardContent>
          </Card>

          {/* Ranking Relawan */}
          <Card className="border-0 shadow-[0_4px_20_rgba(0,0,0,0.03)] rounded-2xl bg-white ring-1 ring-slate-100">
            <CardHeader className="p-8">
              <CardTitle className="text-lg font-bold text-slate-800 tracking-tight">Kinerja Relawan</CardTitle>
              <p className="text-xs text-slate-400 font-medium italic mt-1">Relawan dengan jumlah desa binaan terbanyak</p>
            </CardHeader>
            <CardContent className="px-6 pb-8">
              {ranking.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={ranking} layout="vertical" margin={{ top: 0, right: 60, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} hide />
                    <YAxis 
                      type="category" 
                      dataKey="nama" 
                      tick={{ fontSize: 11, fontWeight: 700, fill: '#475569' }} 
                      width={120} 
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip cursor={{ fill: '#f8fafc' }} formatter={(v) => [`${v} desa`, 'Desa Binaan']} />
                    <Bar 
                      dataKey="jumlah_desa" 
                      name="Desa Binaan" 
                      radius={[0, 4, 4, 0]} 
                      barSize={16}
                    >
                      {ranking.map((_, i) => (
                        <Cell key={i} fill={BRAND_COLORS[i % BRAND_COLORS.length]} />
                      ))}
                      <LabelList 
                        dataKey="jumlah_desa" 
                        position="right" 
                        style={{ fontSize: '10px', fontWeight: 700, fill: '#64748b' }} 
                        offset={10}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[320px] flex items-center justify-center text-slate-300 italic">Ranking restricted to privileged users</div>
              )}
            </CardContent>
          </Card>
        </section>

        {/* ── Section 5: Timber Structure (Full Width Bento) ── */}
        {(teamMonev || teamKorwil) && (
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center border border-red-100">
                <Shield className="w-4 h-4 text-[#7a1200]" />
              </div>
              <h2 className="text-lg font-bold text-slate-800 tracking-tight">Team Structure & Hierarchy</h2>
            </div>
            
            {teamMonev && (
              <Card className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-2xl bg-white overflow-hidden p-2 ring-1 ring-slate-100">
                <div className="p-6 flex items-center justify-between bg-slate-50/50 rounded-xl border border-slate-100 mb-6">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-slate-800 flex items-center justify-center text-white shadow-sm">
                      <Shield className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Lead Supervisor</p>
                      <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">{teamMonev.monev_nama}</h3>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xl font-black text-slate-800 leading-none">{teamMonev.korwils.length}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Korwil</p>
                    </div>
                    <div className="w-px h-10 bg-slate-200" />
                    <div className="text-right">
                      <p className="text-xl font-black text-[#7a1200] leading-none">
                        {teamMonev.korwils.reduce((acc, k) => acc + k.relawans.length, 0)}
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Relawan</p>
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-8">
                  {teamMonev.korwils.length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-10 font-medium">No registered Korwil assigned to this Monev.</p>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {teamMonev.korwils.map((korwil) => {
                        const isExpanded = expandedKorwils.has(korwil.id)
                        return (
                          <div key={korwil.id} className={`rounded-[2rem] border transition-all duration-300 overflow-hidden ${isExpanded ? 'border-slate-200 shadow-xl shadow-slate-200/50 bg-white ring-1 ring-slate-100' : 'border-slate-100 hover:border-slate-300 bg-slate-50'}`}>
                            <button
                              type="button"
                              className="w-full flex items-center justify-between p-6 text-left group"
                              onClick={() => {
                                const next = new Set(expandedKorwils)
                                if (isExpanded) next.delete(korwil.id)
                                else next.add(korwil.id)
                                setExpandedKorwils(next)
                              }}
                            >
                              <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-base font-black transition-colors duration-300 ${isExpanded ? 'bg-slate-800 text-white shadow-md' : 'bg-white border border-slate-200 text-slate-600 group-hover:bg-slate-100'}`}>K</div>
                                <div>
                                  <p className="font-black text-slate-800 text-base tracking-tight">{korwil.nama}</p>
                                  <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">Korwil · {korwil.jumlah_desa} desa · {korwil.relawans.length} relawan</p>
                                </div>
                              </div>
                              <div className={`p-2 rounded-xl bg-white shadow-sm border border-slate-100 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                <ChevronDown className="w-4 h-4 text-slate-500" />
                              </div>
                            </button>
                            {isExpanded && (
                              <div className="px-6 pb-6 space-y-3">
                                {korwil.relawans.length === 0 ? (
                                  <p className="px-4 py-6 text-sm text-slate-400 italic font-medium bg-white rounded-2xl border border-dashed border-slate-200 text-center">No volunteers assigned.</p>
                                ) : (
                                  korwil.relawans.map((r) => (
                                    <div key={r.id} className="flex items-center gap-4 p-4 bg-slate-50/50 hover:bg-white border border-slate-100 hover:border-slate-200 hover:shadow-sm rounded-2xl transition-all group">
                                      <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-slate-600 font-black text-xs group-hover:bg-slate-800 group-hover:text-white transition-colors duration-300">R</div>
                                      <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-slate-700 truncate group-hover:text-slate-900 transition-colors duration-300">{r.nama}</p>
                                        <p className="text-[11px] font-medium text-slate-400">{r.jumlah_desa} desa aktif binaan</p>
                                      </div>
                                      <div className="p-2 bg-slate-50 rounded-lg group-hover:bg-slate-100 border border-slate-100 transition-colors duration-300">
                                        <Building2 className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-600" />
                                      </div>
                                    </div>
                                  ))
                                )}
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </Card>
            )}

            {teamKorwil && (
              <Card className="border-0 shadow-[0_4px_20px_rgba(0,0,0,0.03)] rounded-2xl bg-white overflow-hidden p-6 ring-1 ring-slate-100">
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-slate-800 flex items-center justify-center text-white shadow-sm shadow-slate-200">
                      <UserCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none mb-1.5">My Managed Team</p>
                      <h3 className="text-lg font-black text-slate-800 tracking-tight">Korwil: <span className="text-slate-500">{teamKorwil.korwil_nama}</span></h3>
                    </div>
                  </div>
                  <Badge className="bg-slate-50 text-slate-500 border-slate-200 px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest shadow-none">{teamKorwil.relawans.length} Relawan</Badge>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {teamKorwil.relawans.length === 0 ? (
                    <div className="col-span-full py-12 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                      <p className="text-slate-400 font-bold italic">No active volunteers found in your region.</p>
                    </div>
                  ) : (
                    teamKorwil.relawans.map((r) => (
                      <Card key={r.id} className="border border-slate-100 shadow-none bg-slate-50/50 hover:bg-white hover:shadow-xl hover:border-slate-200 transition-all duration-300 rounded-[1.5rem] group p-4 flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center font-black text-slate-800 group-hover:bg-slate-800 group-hover:text-white transition-colors duration-300">
                          {r.nama.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-black text-slate-800 truncate leading-none mb-1">{r.nama}</p>
                          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">{r.jumlah_desa} Desa Aktif</p>
                        </div>
                      </Card>
                    ))
                  )}
                </div>
              </Card>
            )}
          </section>
        )}
      </div>
    </div>
  )
}
