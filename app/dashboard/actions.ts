'use server'

import { sql } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// =============================================================
// Tipe data
// =============================================================
export type DashboardStats = {
  totalDesaAktif: number
  totalDesaAll: number
  totalPenerimaManfaat: number
  totalRelawan: number
  totalRealisasi: number
  totalAlokasi: number
  peresenRealisasi: number
}

export type AnggaranPerDesa = {
  nama_desa: string
  alokasi: number
  realisasi: number
}

export type TrendBulanan = {
  bulan: string
  jumlah_laporan: number
  total_realisasi: number
}

export type SebaranStatus = {
  label: string
  value: number
}

export type RankingRelawan = {
  nama: string
  jumlah_desa: number
}

export type VillageMapPoint = {
  id: number
  nama_desa: string
  latitude: number
  longitude: number
  nama_provinsi: string
  nama_kota: string
  nama_relawan: string
  status: string
}

export type DistributionStats = {
  totalProvinsi: number
  totalKota: number
  totalKecamatan: number
  totalDesa: number
}

// =============================================================
// Helper: role filter
// =============================================================
async function getRoleFilter() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null
  return {
    role: session.user.role as string,
    operatorId: session.user.operator_id as number | null,
    isKorwil: session.user.is_korwil as boolean,
  }
}

// =============================================================
// KPI Cards
// =============================================================
export async function getDashboardStats(tahun: number): Promise<DashboardStats> {
  const auth = await getRoleFilter()
  if (!auth) return { totalDesaAktif: 0, totalDesaAll: 0, totalPenerimaManfaat: 0, totalRelawan: 0, totalRealisasi: 0, totalAlokasi: 0, peresenRealisasi: 0 }

  const isAdmin = auth.role === 'ADMIN' || auth.role === 'MONEV' || auth.role === 'FINANCE'

  // Total desa
  const desaRows = isAdmin
    ? await sql`SELECT COUNT(*) FILTER (WHERE status_aktif) as aktif, COUNT(*) as semua FROM desa_berdaya`
    : auth.isKorwil && auth.operatorId
    ? await sql`SELECT COUNT(*) FILTER (WHERE db.status_aktif) as aktif, COUNT(*) as semua FROM desa_berdaya db JOIN relawan r ON db.relawan_id = r.id WHERE r.korwil_id = ${auth.operatorId}`
    : auth.operatorId
    ? await sql`SELECT COUNT(*) FILTER (WHERE status_aktif) as aktif, COUNT(*) as semua FROM desa_berdaya WHERE relawan_id = ${auth.operatorId}`
    : await sql`SELECT 0 as aktif, 0 as semua`

  // Total PM
  const pmRows = isAdmin
    ? await sql`SELECT COUNT(*) as total FROM penerima_manfaat`
    : auth.isKorwil && auth.operatorId
    ? await sql`SELECT COUNT(*) as total FROM penerima_manfaat pm JOIN desa_berdaya db ON pm.desa_berdaya_id = db.id JOIN relawan r ON db.relawan_id = r.id WHERE r.korwil_id = ${auth.operatorId}`
    : auth.operatorId
    ? await sql`SELECT COUNT(*) as total FROM penerima_manfaat pm JOIN desa_berdaya db ON pm.desa_berdaya_id = db.id WHERE db.relawan_id = ${auth.operatorId}`
    : await sql`SELECT 0 as total`

  // Total relawan
  const relawanRows = isAdmin
    ? await sql`SELECT COUNT(*) as total FROM relawan`
    : await sql`SELECT COUNT(*) as total FROM relawan WHERE korwil_id = ${auth.operatorId}`

  // Laporan keuangan tahun ini
  const laporanRows = isAdmin
    ? await sql`SELECT COALESCE(SUM(total_realisasi),0) as realisasi FROM laporan_kegiatan WHERE EXTRACT(YEAR FROM created_at) = ${tahun}`
    : auth.operatorId
    ? await sql`SELECT COALESCE(SUM(lk.total_realisasi),0) as realisasi FROM laporan_kegiatan lk JOIN desa_berdaya db ON lk.desa_berdaya_id = db.id WHERE db.relawan_id = ${auth.operatorId} AND EXTRACT(YEAR FROM lk.created_at) = ${tahun}`
    : await sql`SELECT 0 as realisasi`

  const desaAktif = Number((desaRows as any[])[0]?.aktif ?? 0)
  const desaAll = Number((desaRows as any[])[0]?.semua ?? 0)
  const pm = Number((pmRows as any[])[0]?.total ?? 0)
  const relawan = Number((relawanRows as any[])[0]?.total ?? 0)
  const realisasi = Number((laporanRows as any[])[0]?.realisasi ?? 0)

  return {
    totalDesaAktif: desaAktif,
    totalDesaAll: desaAll,
    totalPenerimaManfaat: pm,
    totalRelawan: relawan,
    totalRealisasi: realisasi,
    totalAlokasi: 0,
    peresenRealisasi: 0,
  }
}

// =============================================================
// Anggaran per Desa
// =============================================================
export async function getAnggaranPerDesa(tahun: number): Promise<AnggaranPerDesa[]> {
  const auth = await getRoleFilter()
  if (!auth) return []

  const isAdmin = auth.role === 'ADMIN' || auth.role === 'MONEV' || auth.role === 'FINANCE'

  const rows = isAdmin
    ? await sql`
        SELECT dc.nama_desa,
               COALESCE(SUM(lk.total_realisasi),0) as realisasi
        FROM desa_berdaya db
        JOIN desa_config dc ON db.desa_id = dc.id
        LEFT JOIN laporan_kegiatan lk ON lk.desa_berdaya_id = db.id AND EXTRACT(YEAR FROM lk.created_at) = ${tahun}
        WHERE db.status_aktif = true
        GROUP BY dc.nama_desa
        ORDER BY realisasi DESC
        LIMIT 10`
    : auth.operatorId
    ? await sql`
        SELECT dc.nama_desa,
               COALESCE(SUM(lk.total_realisasi),0) as realisasi
        FROM desa_berdaya db
        JOIN desa_config dc ON db.desa_id = dc.id
        LEFT JOIN laporan_kegiatan lk ON lk.desa_berdaya_id = db.id AND EXTRACT(YEAR FROM lk.created_at) = ${tahun}
        WHERE db.relawan_id = ${auth.operatorId} AND db.status_aktif = true
        GROUP BY dc.nama_desa
        ORDER BY realisasi DESC`
    : []

  return (rows as any[]).map((r) => ({
    nama_desa: r.nama_desa,
    alokasi: 0,
    realisasi: Number(r.realisasi),
  }))
}

// =============================================================
// Tren Laporan Bulanan
// =============================================================
export async function getTrendLaporanBulanan(tahun: number): Promise<TrendBulanan[]> {
  const auth = await getRoleFilter()
  if (!auth) return []

  const isAdmin = auth.role === 'ADMIN' || auth.role === 'MONEV' || auth.role === 'FINANCE'

  const rows = isAdmin
    ? await sql`
        SELECT TO_CHAR(created_at, 'Mon') as bulan,
               EXTRACT(MONTH FROM created_at) as bulan_num,
               COUNT(*) as jumlah_laporan,
               COALESCE(SUM(total_realisasi),0) as total_realisasi
        FROM laporan_kegiatan
        WHERE EXTRACT(YEAR FROM created_at) = ${tahun}
        GROUP BY TO_CHAR(created_at, 'Mon'), EXTRACT(MONTH FROM created_at)
        ORDER BY bulan_num`
    : auth.operatorId
    ? await sql`
        SELECT TO_CHAR(lk.created_at, 'Mon') as bulan,
               EXTRACT(MONTH FROM lk.created_at) as bulan_num,
               COUNT(*) as jumlah_laporan,
               COALESCE(SUM(lk.total_realisasi),0) as total_realisasi
        FROM laporan_kegiatan lk
        JOIN desa_berdaya db ON lk.desa_berdaya_id = db.id
        WHERE EXTRACT(YEAR FROM lk.created_at) = ${tahun} AND db.relawan_id = ${auth.operatorId}
        GROUP BY TO_CHAR(lk.created_at, 'Mon'), EXTRACT(MONTH FROM lk.created_at)
        ORDER BY bulan_num`
    : []

  const monthMap: Record<string, string> = { Jan:'Jan', Feb:'Feb', Mar:'Mar', Apr:'Apr', May:'Mei', Jun:'Jun', Jul:'Jul', Aug:'Agt', Sep:'Sep', Oct:'Okt', Nov:'Nov', Dec:'Des' }

  return (rows as any[]).map((r) => ({
    bulan: monthMap[r.bulan] ?? r.bulan,
    jumlah_laporan: Number(r.jumlah_laporan),
    total_realisasi: Number(r.total_realisasi),
  }))
}

// =============================================================
// Sebaran Status Desa
// =============================================================
export async function getSebaranStatusDesa(): Promise<SebaranStatus[]> {
  const auth = await getRoleFilter()
  if (!auth) return []

  const isAdmin = auth.role === 'ADMIN' || auth.role === 'MONEV' || auth.role === 'FINANCE'

  const rows = isAdmin
    ? await sql`SELECT status_aktif, COUNT(*) as total FROM desa_berdaya GROUP BY status_aktif`
    : auth.operatorId
    ? await sql`SELECT status_aktif, COUNT(*) as total FROM desa_berdaya WHERE relawan_id = ${auth.operatorId} GROUP BY status_aktif`
    : []

  return (rows as any[]).map((r) => ({
    label: r.status_aktif ? 'Aktif' : 'Tidak Aktif',
    value: Number(r.total),
  }))
}

// =============================================================
// Ranking Relawan by jumlah desa
// =============================================================
export async function getRankingRelawan(): Promise<RankingRelawan[]> {
  const auth = await getRoleFilter()
  if (!auth) return []

  const isAdmin = auth.role === 'ADMIN' || auth.role === 'MONEV' || auth.role === 'FINANCE'
  if (!isAdmin) return []

  const rows = await sql`
    SELECT r.nama, COUNT(db.id) as jumlah_desa
    FROM relawan r
    LEFT JOIN desa_berdaya db ON db.relawan_id = r.id AND db.status_aktif = true
    GROUP BY r.nama
    ORDER BY jumlah_desa DESC
    LIMIT 8`

  return (rows as any[]).map((r) => ({
    nama: r.nama,
    jumlah_desa: Number(r.jumlah_desa),
  }))
}

// =============================================================
// Struktur Tim — untuk Monev (lihat Korwil + Relawan bawahan)
// =============================================================
export type RelawanInfo = {
  id: number
  nama: string
  jumlah_desa: number
}

export type KorwilInfo = {
  id: number
  nama: string
  jumlah_desa: number
  relawans: RelawanInfo[]
}

export type TeamForMonev = {
  monev_nama: string
  korwils: KorwilInfo[]
}

export async function getMonevListSimple(): Promise<{ id: number; nama: string }[]> {
  const rows = await sql`SELECT id, nama FROM monev ORDER BY nama`
  return (rows as any[]).map((r) => ({ id: Number(r.id), nama: r.nama }))
}

export async function getTeamForMonev(selectedMonevId?: number | null): Promise<TeamForMonev | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null

  const role = session.user.role as string
  const operatorId = session.user.operator_id

  let monevId: number | null = null

  if (role === 'MONEV' && operatorId) {
    monevId = Number(operatorId)
  } else if (role === 'ADMIN' || role === 'FINANCE') {
    if (selectedMonevId) {
      monevId = selectedMonevId
    } else {
      // Default: ambil monev pertama
      const monevRow = await sql`SELECT id, nama FROM monev ORDER BY id LIMIT 1`
      const first = (monevRow as any[])[0]
      if (!first) return null
      monevId = Number(first.id)
    }
  } else {
    return null
  }

  const monevRow = await sql`SELECT nama FROM monev WHERE id = ${monevId} LIMIT 1`
  const monev_nama = (monevRow as any[])[0]?.nama ?? 'Monev'

  // 1 query: semua Korwil di bawah monev ini
  // jumlah_desa = total desa yang dikelola relawan-relawan di bawah korwil
  const korwilRows = await sql`
    SELECT r.id, r.nama,
           COUNT(db.id) as jumlah_desa
    FROM relawan r
    LEFT JOIN relawan sub ON sub.korwil_id = r.id AND sub.is_korwil = false
    LEFT JOIN desa_berdaya db ON db.relawan_id = sub.id AND db.status_aktif = true
    WHERE r.monev_id = ${monevId} AND r.is_korwil = true
    GROUP BY r.id, r.nama
    ORDER BY r.nama`

  const korwilIds = (korwilRows as any[]).map((k) => Number(k.id))
  if (korwilIds.length === 0) return { monev_nama, korwils: [] }

  // 1 query: semua relawan di bawah korwil-korwil tersebut
  const relawanRows = await sql`
    SELECT r.id, r.nama, r.korwil_id,
           COUNT(db.id) as jumlah_desa
    FROM relawan r
    LEFT JOIN desa_berdaya db ON db.relawan_id = r.id AND db.status_aktif = true
    WHERE r.korwil_id = ANY(${korwilIds}) AND r.is_korwil = false
    GROUP BY r.id, r.nama, r.korwil_id
    ORDER BY r.nama`

  // Group relawan per korwil di JavaScript
  const relawanByKorwil = new Map<number, RelawanInfo[]>()
  for (const r of relawanRows as any[]) {
    const kid = Number(r.korwil_id)
    if (!relawanByKorwil.has(kid)) relawanByKorwil.set(kid, [])
    relawanByKorwil.get(kid)!.push({ id: Number(r.id), nama: r.nama, jumlah_desa: Number(r.jumlah_desa) })
  }

  const korwils: KorwilInfo[] = (korwilRows as any[]).map((k) => ({
    id: Number(k.id),
    nama: k.nama,
    jumlah_desa: Number(k.jumlah_desa),
    relawans: relawanByKorwil.get(Number(k.id)) ?? [],
  }))

  return { monev_nama, korwils }
}

// =============================================================
// Struktur Tim — untuk Korwil (lihat Relawan bawahan)
// =============================================================
export type TeamForKorwil = {
  korwil_nama: string
  relawans: RelawanInfo[]
}

export async function getTeamForKorwil(): Promise<TeamForKorwil | null> {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null

  const operatorId = session.user.operator_id
  if (!operatorId || !session.user.is_korwil) return null

  const korwilId = Number(operatorId)
  const korwilRow = await sql`SELECT nama FROM relawan WHERE id = ${korwilId} LIMIT 1`
  const korwil_nama = (korwilRow as any[])[0]?.nama ?? 'Korwil'

  const relawanRows = await sql`
    SELECT r.id, r.nama,
           COUNT(db.id) as jumlah_desa
    FROM relawan r
    LEFT JOIN desa_berdaya db ON db.relawan_id = r.id AND db.status_aktif = true
    WHERE r.korwil_id = ${korwilId} AND r.is_korwil = false
    GROUP BY r.id, r.nama
    ORDER BY r.nama`

  return {
    korwil_nama,
    relawans: (relawanRows as any[]).map((r) => ({
      id: Number(r.id),
      nama: r.nama,
      jumlah_desa: Number(r.jumlah_desa),
    })),
  }
}

// =============================================================
// Map & Geography Stats (Super Admin)
// =============================================================
export async function getVillageMapPoints(): Promise<VillageMapPoint[]> {
  const auth = await getRoleFilter()
  if (!auth || (auth.role !== 'ADMIN' && auth.role !== 'MONEV')) return []

  const rows = await sql`
    SELECT
      db.id,
      dc.nama_desa,
      db.latitude,
      db.longitude,
      prov.nama_provinsi,
      kota.nama_kota,
      r.nama as nama_relawan,
      db.status_aktif
    FROM desa_berdaya db
    JOIN desa_config dc ON db.desa_id = dc.id
    JOIN provinsi prov ON db.provinsi_id = prov.id
    JOIN kota_kabupaten kota ON db.kota_id = kota.id
    LEFT JOIN relawan r ON db.relawan_id = r.id
    WHERE db.status_aktif = true
      AND db.latitude IS NOT NULL
      AND db.longitude IS NOT NULL
  `

  return (rows as any[]).map((r) => ({
    id: Number(r.id),
    nama_desa: r.nama_desa,
    latitude: Number(r.latitude),
    longitude: Number(r.longitude),
    nama_provinsi: r.nama_provinsi,
    nama_kota: r.nama_kota,
    nama_relawan: r.nama_relawan || 'Relawan Belum Ditugaskan',
    status: r.status_aktif ? 'Aktif' : 'Tidak Aktif'
  }))
}

export async function getVillageDistributionStats(): Promise<DistributionStats> {
  const auth = await getRoleFilter()
  if (!auth || (auth.role !== 'ADMIN' && auth.role !== 'MONEV')) {
    return { totalProvinsi: 0, totalKota: 0, totalKecamatan: 0, totalDesa: 0 }
  }

  const rows = await sql`
    SELECT
      (SELECT COUNT(DISTINCT provinsi_id) FROM desa_berdaya WHERE status_aktif = true) as total_provinsi,
      (SELECT COUNT(DISTINCT kota_id) FROM desa_berdaya WHERE status_aktif = true) as total_kota,
      (SELECT COUNT(DISTINCT kecamatan_id) FROM desa_berdaya WHERE status_aktif = true) as total_kecamatan,
      (SELECT COUNT(*) FROM desa_berdaya WHERE status_aktif = true) as total_desa
  `

  const r = (rows as any[])[0]
  return {
    totalProvinsi: Number(r?.total_provinsi ?? 0),
    totalKota: Number(r?.total_kota ?? 0),
    totalKecamatan: Number(r?.total_kecamatan ?? 0),
    totalDesa: Number(r?.total_desa ?? 0),
  }
}

