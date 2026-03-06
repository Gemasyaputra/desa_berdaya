'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import { Building2, Users, TrendingUp, Wallet, RefreshCw, MapPin } from 'lucide-react'
import {
  getDashboardStats, getAnggaranPerDesa, getTrendLaporanBulanan,
  getSebaranStatusDesa, getRankingRelawan,
  type DashboardStats, type AnggaranPerDesa, type TrendBulanan,
  type SebaranStatus, type RankingRelawan,
} from './actions'

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
// Komponen utama
// =====================================================
export default function DashboardPage() {
  const [tahun, setTahun] = useState(String(currentYear))
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [anggaran, setAnggaran] = useState<AnggaranPerDesa[]>([])
  const [trend, setTrend] = useState<TrendBulanan[]>([])
  const [sebaran, setSebaran] = useState<SebaranStatus[]>([])
  const [ranking, setRanking] = useState<RankingRelawan[]>([])

  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const y = parseInt(tahun)
      const [s, a, t, se, r] = await Promise.all([
        getDashboardStats(y),
        getAnggaranPerDesa(y),
        getTrendLaporanBulanan(y),
        getSebaranStatusDesa(),
        getRankingRelawan(),
      ])
      setStats(s)
      setAnggaran(a)
      setTrend(t)
      setSebaran(se)
      setRanking(r)
    } finally {
      setLoading(false)
    }
  }, [tahun])

  useEffect(() => { fetchAll() }, [fetchAll])

  const pctRealisasi = stats?.peresenRealisasi ?? 0

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-10 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Summary Dashboard</h1>
            <p className="text-slate-500 text-sm">Monitoring Program Pemberdayaan Desa Berdaya</p>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={tahun} onValueChange={setTahun}>
              <SelectTrigger className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {yearOptions.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={fetchAll}
              disabled={loading}
              className="gap-2 text-white"
              style={{ backgroundColor: '#7a1200' }}
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* ── KPI Cards ── */}
        {loading && !stats ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {Array(4).fill(0).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Desa Aktif */}
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-rose-900 to-rose-700 text-white">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-rose-200 text-xs font-medium">Desa Binaan Aktif</p>
                    <p className="text-3xl font-bold mt-1">{stats?.totalDesaAktif ?? 0}</p>
                    <p className="text-rose-200 text-xs mt-1">dari {stats?.totalDesaAll ?? 0} total desa</p>
                  </div>
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Penerima Manfaat */}
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-amber-600 to-amber-500 text-white">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-amber-100 text-xs font-medium">Penerima Manfaat</p>
                    <p className="text-3xl font-bold mt-1">{stats?.totalPenerimaManfaat?.toLocaleString('id-ID') ?? 0}</p>
                    <p className="text-amber-100 text-xs mt-1">total terdaftar</p>
                  </div>
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Realisasi Anggaran */}
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-emerald-700 to-emerald-500 text-white">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-emerald-100 text-xs font-medium">Realisasi {tahun}</p>
                    <p className="text-2xl font-bold mt-1">{formatRupiah(stats?.totalRealisasi ?? 0)}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <div className="flex-1 bg-white/30 rounded-full h-1.5">
                        <div className="bg-white h-full rounded-full" style={{ width: `${pctRealisasi}%` }} />
                      </div>
                      <span className="text-emerald-100 text-xs">{pctRealisasi.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <Wallet className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Relawan */}
            <Card className="border-0 shadow-sm hover:shadow-md transition-shadow bg-gradient-to-br from-blue-700 to-blue-500 text-white">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-blue-100 text-xs font-medium">Total Relawan</p>
                    <p className="text-3xl font-bold mt-1">{stats?.totalRelawan ?? 0}</p>
                    <p className="text-blue-100 text-xs mt-1">relawan terdaftar</p>
                  </div>
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* ── Baris 1: Tren Bulanan + Sebaran Status ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Line Chart — Tren Laporan & Realisasi */}
          <Card className="lg:col-span-2 border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-slate-800">Tren Laporan Kegiatan Bulanan</CardTitle>
              <p className="text-xs text-slate-500">Jumlah laporan dan realisasi anggaran per bulan — {tahun}</p>
            </CardHeader>
            <CardContent>
              {trend.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={trend} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="bulan" tick={{ fontSize: 12 }} />
                    <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                    <YAxis yAxisId="right" orientation="right" tickFormatter={(v) => formatRupiah(v)} tick={{ fontSize: 10 }} />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="jumlah_laporan" name="Jml Laporan" stroke="#7a1200" strokeWidth={2} dot={{ r: 4 }} />
                    <Line yAxisId="right" type="monotone" dataKey="total_realisasi" name="Realisasi (Rp)" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[250px] flex items-center justify-center text-slate-400 text-sm">
                  Belum ada data laporan di tahun {tahun}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pie Chart — Sebaran Status */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-slate-800">Sebaran Status Desa</CardTitle>
              <p className="text-xs text-slate-500">Aktif vs Tidak Aktif</p>
            </CardHeader>
            <CardContent>
              {sebaran.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={sebaran} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={70} label={({ label, value }) => `${label}: ${value}`} labelLine={false}>
                        {sebaran.map((_, i) => (
                          <Cell key={i} fill={i === 0 ? '#7a1200' : '#cbd5e1'} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-3 space-y-2">
                    {sebaran.map((s, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: i === 0 ? '#7a1200' : '#cbd5e1' }} />
                          <span className="text-slate-600">{s.label}</span>
                        </div>
                        <span className="font-semibold text-slate-800">{s.value} desa</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-[180px] flex items-center justify-center text-slate-400 text-sm">
                  Belum ada data
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── Baris 2: Anggaran per Desa + Ranking Relawan ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart — Realisasi vs Alokasi per Desa */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-slate-800">Realisasi vs Alokasi per Desa</CardTitle>
              <p className="text-xs text-slate-500">Top 10 desa berdasarkan realisasi — {tahun}</p>
            </CardHeader>
            <CardContent>
              {anggaran.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={anggaran} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" tickFormatter={(v) => formatRupiah(v)} tick={{ fontSize: 10 }} />
                    <YAxis type="category" dataKey="nama_desa" tick={{ fontSize: 11 }} width={90} />
                    <Tooltip content={<CustomBarTooltip />} />
                    <Legend />
                    <Bar dataKey="alokasi" name="Alokasi" fill="#e2e8f0" radius={[0, 3, 3, 0]} />
                    <Bar dataKey="realisasi" name="Realisasi" fill="#7a1200" radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-slate-400 text-sm">
                  Belum ada data laporan di tahun {tahun}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Bar Chart — Ranking Relawan */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base text-slate-800">Ranking Relawan</CardTitle>
              <p className="text-xs text-slate-500">Jumlah desa binaan aktif per relawan</p>
            </CardHeader>
            <CardContent>
              {ranking.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={ranking} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
                    <YAxis type="category" dataKey="nama" tick={{ fontSize: 11 }} width={100} />
                    <Tooltip formatter={(v) => [`${v} desa`, 'Desa Binaan']} />
                    <Bar dataKey="jumlah_desa" name="Desa Binaan" radius={[0, 3, 3, 0]}>
                      {ranking.map((_, i) => (
                        <Cell key={i} fill={BRAND_COLORS[i % BRAND_COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center text-slate-400 text-sm">
                  Data ranking hanya tersedia untuk Admin / Monev
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
