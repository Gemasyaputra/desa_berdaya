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

export type RangkumanDana = {
  totalAjuan: number
  totalCair: number
  totalRealisasi: number
  totalPengembalian: number
  sisaSaldo: number
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
    officeId: session.user.office_id ? Number(session.user.office_id) : null,
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
    : auth.role === 'OFFICE' && auth.officeId
    ? await sql`SELECT COUNT(*) FILTER (WHERE db.status_aktif) as aktif, COUNT(*) as semua FROM desa_berdaya db JOIN desa_config dc ON db.desa_id = dc.id WHERE dc.office_id = ${auth.officeId}`
    : auth.isKorwil && auth.operatorId
    ? await sql`SELECT COUNT(*) FILTER (WHERE db.status_aktif) as aktif, COUNT(*) as semua FROM desa_berdaya db JOIN relawan r ON db.relawan_id = r.id WHERE r.korwil_id = ${auth.operatorId}`
    : auth.operatorId
    ? await sql`SELECT COUNT(*) FILTER (WHERE status_aktif) as aktif, COUNT(*) as semua FROM desa_berdaya WHERE relawan_id = ${auth.operatorId}`
    : await sql`SELECT 0 as aktif, 0 as semua`

  // Total PM
  const pmRows = isAdmin
    ? await sql`SELECT COUNT(*) as total FROM penerima_manfaat`
    : auth.role === 'OFFICE' && auth.officeId
    ? await sql`SELECT COUNT(*) as total FROM penerima_manfaat pm JOIN desa_berdaya db ON pm.desa_berdaya_id = db.id JOIN desa_config dc ON db.desa_id = dc.id WHERE dc.office_id = ${auth.officeId}`
    : auth.isKorwil && auth.operatorId
    ? await sql`SELECT COUNT(*) as total FROM penerima_manfaat pm JOIN desa_berdaya db ON pm.desa_berdaya_id = db.id JOIN relawan r ON db.relawan_id = r.id WHERE r.korwil_id = ${auth.operatorId}`
    : auth.operatorId
    ? await sql`SELECT COUNT(*) as total FROM penerima_manfaat pm JOIN desa_berdaya db ON pm.desa_berdaya_id = db.id WHERE db.relawan_id = ${auth.operatorId}`
    : await sql`SELECT 0 as total`

  // Total relawan
  const relawanRows = isAdmin
    ? await sql`SELECT COUNT(*) as total FROM relawan`
    : auth.role === 'OFFICE' && auth.officeId
    ? await sql`SELECT COUNT(DISTINCT db.relawan_id) as total FROM desa_berdaya db JOIN desa_config dc ON db.desa_id = dc.id WHERE dc.office_id = ${auth.officeId} AND db.status_aktif = true`
    : auth.isKorwil && auth.operatorId
    ? await sql`SELECT COUNT(*) as total FROM relawan WHERE korwil_id = ${auth.operatorId}`
    : await sql`SELECT 1 as total`

  // Laporan keuangan tahun ini
  const laporanRows = isAdmin
    ? await sql`SELECT COALESCE(SUM(total_realisasi),0) as realisasi FROM laporan_kegiatan WHERE EXTRACT(YEAR FROM created_at) = ${tahun}`
    : auth.role === 'OFFICE' && auth.officeId
    ? await sql`SELECT COALESCE(SUM(lk.total_realisasi),0) as realisasi FROM laporan_kegiatan lk JOIN desa_berdaya db ON lk.desa_berdaya_id = db.id JOIN desa_config dc ON db.desa_id = dc.id WHERE dc.office_id = ${auth.officeId} AND EXTRACT(YEAR FROM lk.created_at) = ${tahun}`
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
// Rangkuman Dana Intervensi (Berdasarkan CA)
// =============================================================
export async function getRangkumanDana(tahun: number): Promise<RangkumanDana> {
  const auth = await getRoleFilter()
  if (!auth) return { totalAjuan: 0, totalCair: 0, totalRealisasi: 0, totalPengembalian: 0, sisaSaldo: 0 }

  let rows;
  const isAdmin = auth.role === 'ADMIN' || auth.role === 'MONEV' || auth.role === 'FINANCE'

  if (isAdmin) {
    rows = await sql`SELECT ajuan_ri, anggaran_dicairkan, status_ca, bukti_ca_url, status_pengembalian, bukti_pengembalian_url FROM intervensi_anggaran WHERE tahun = ${tahun}`
  } else if (auth.role === 'OFFICE' && auth.officeId) {
    rows = await sql`
      SELECT ia.ajuan_ri, ia.anggaran_dicairkan, ia.status_ca, ia.bukti_ca_url, ia.status_pengembalian, ia.bukti_pengembalian_url 
      FROM intervensi_anggaran ia
      JOIN intervensi_program ip ON ia.intervensi_program_id = ip.id
      JOIN desa_berdaya db ON ip.desa_berdaya_id = db.id
      JOIN desa_config dc ON db.desa_id = dc.id
      WHERE ia.tahun = ${tahun} AND dc.office_id = ${auth.officeId}
    `
  } else if (auth.operatorId) {
    rows = await sql`
      SELECT ia.ajuan_ri, ia.anggaran_dicairkan, ia.status_ca, ia.bukti_ca_url, ia.status_pengembalian, ia.bukti_pengembalian_url 
      FROM intervensi_anggaran ia
      JOIN intervensi_program ip ON ia.intervensi_program_id = ip.id
      WHERE ia.tahun = ${tahun} AND ip.relawan_id = ${auth.operatorId}
    `
  } else {
    rows = []
  }

  let totalAjuan = 0
  let totalCair = 0
  let totalRealisasi = 0
  let totalPengembalian = 0

  for (const r of rows as any[]) {
    totalAjuan += Number(r.ajuan_ri) || 0
    totalCair += Number(r.anggaran_dicairkan) || 0

    if (r.status_ca === 'DIVERIFIKASI' && r.bukti_ca_url) {
      try {
        if (r.bukti_ca_url.trim().startsWith('[')) {
          const entries = JSON.parse(r.bukti_ca_url)
          const ca = entries.filter((e: any) => !e.ditolak).reduce((acc: number, e: any) => acc + (Number(e.nominal) || 0), 0)
          totalRealisasi += ca
        }
      } catch (e) {
        // ignore
      }
    }
    if (r.status_pengembalian === 'DIVERIFIKASI' && r.bukti_pengembalian_url) {
      try {
        if (r.bukti_pengembalian_url.trim().startsWith('[')) {
          const entries = JSON.parse(r.bukti_pengembalian_url)
          const pengembalian = entries.filter((e: any) => !e.ditolak).reduce((acc: number, e: any) => acc + (Number(e.nominal) || 0), 0)
          totalPengembalian += pengembalian
        }
      } catch (e) {
      }
    }
  }

  return {
    totalAjuan,
    totalCair,
    totalRealisasi,
    totalPengembalian,
    sisaSaldo: totalCair - totalRealisasi - totalPengembalian
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
        SELECT dc.nama_desa, ia.status_ca, ia.bukti_ca_url
        FROM intervensi_anggaran ia
        JOIN intervensi_program ip ON ia.intervensi_program_id = ip.id
        JOIN desa_berdaya db ON ip.desa_berdaya_id = db.id
        JOIN desa_config dc ON db.desa_id = dc.id
        WHERE db.status_aktif = true AND ia.tahun = ${tahun}`
    : auth.role === 'OFFICE' && auth.officeId
    ? await sql`
        SELECT dc.nama_desa, ia.status_ca, ia.bukti_ca_url
        FROM intervensi_anggaran ia
        JOIN intervensi_program ip ON ia.intervensi_program_id = ip.id
        JOIN desa_berdaya db ON ip.desa_berdaya_id = db.id
        JOIN desa_config dc ON db.desa_id = dc.id
        WHERE dc.office_id = ${auth.officeId} AND db.status_aktif = true AND ia.tahun = ${tahun}`
    : auth.operatorId
    ? await sql`
        SELECT dc.nama_desa, ia.status_ca, ia.bukti_ca_url
        FROM intervensi_anggaran ia
        JOIN intervensi_program ip ON ia.intervensi_program_id = ip.id
        JOIN desa_berdaya db ON ip.desa_berdaya_id = db.id
        JOIN desa_config dc ON db.desa_id = dc.id
        WHERE db.relawan_id = ${auth.operatorId} AND db.status_aktif = true AND ia.tahun = ${tahun}`
    : []

  const agg = new Map<string, number>()
  for (const r of rows as any[]) {
    let total = 0
    if (r.status_ca === 'DIVERIFIKASI' && r.bukti_ca_url && r.bukti_ca_url.trim().startsWith('[')) {
      try {
        const entries = JSON.parse(r.bukti_ca_url)
        total = entries.filter((e: any) => !e.ditolak).reduce((acc: number, e: any) => acc + (Number(e.nominal) || 0), 0)
      } catch (e) {}
    }
    const current = agg.get(r.nama_desa) || 0
    agg.set(r.nama_desa, current + total)
  }

  // Juga ambil nama_desa yang punya laporan tp ga punya CA? Tidak perlu, cukup top 10 berdasar CA
  const result: AnggaranPerDesa[] = Array.from(agg.entries()).map(([k, v]) => ({
    nama_desa: k,
    alokasi: 0,
    realisasi: v,
  }))
  return result.sort((a, b) => b.realisasi - a.realisasi).slice(0, 10)
}

// =============================================================
// Tren Laporan Bulanan
// =============================================================
export async function getTrendLaporanBulanan(tahun: number): Promise<TrendBulanan[]> {
  const auth = await getRoleFilter()
  if (!auth) return []

  const isAdmin = auth.role === 'ADMIN' || auth.role === 'MONEV' || auth.role === 'FINANCE'

  // Ambil laporan narrative stats
  const lkRows = isAdmin
    ? await sql`
        SELECT TO_CHAR(created_at, 'Mon') as bulan,
               EXTRACT(MONTH FROM created_at) as bulan_num,
               COUNT(*) as jumlah_laporan
        FROM laporan_kegiatan
        WHERE EXTRACT(YEAR FROM created_at) = ${tahun}
        GROUP BY TO_CHAR(created_at, 'Mon'), EXTRACT(MONTH FROM created_at)`
    : auth.role === 'OFFICE' && auth.officeId
    ? await sql`
        SELECT TO_CHAR(lk.created_at, 'Mon') as bulan,
               EXTRACT(MONTH FROM lk.created_at) as bulan_num,
               COUNT(*) as jumlah_laporan
        FROM laporan_kegiatan lk
        JOIN desa_berdaya db ON lk.desa_berdaya_id = db.id
        JOIN desa_config dc ON db.desa_id = dc.id
        WHERE EXTRACT(YEAR FROM lk.created_at) = ${tahun} AND dc.office_id = ${auth.officeId}
        GROUP BY TO_CHAR(lk.created_at, 'Mon'), EXTRACT(MONTH FROM lk.created_at)`
    : auth.operatorId
    ? await sql`
        SELECT TO_CHAR(lk.created_at, 'Mon') as bulan,
               EXTRACT(MONTH FROM lk.created_at) as bulan_num,
               COUNT(*) as jumlah_laporan
        FROM laporan_kegiatan lk
        JOIN desa_berdaya db ON lk.desa_berdaya_id = db.id
        WHERE EXTRACT(YEAR FROM lk.created_at) = ${tahun} AND db.relawan_id = ${auth.operatorId}
        GROUP BY TO_CHAR(lk.created_at, 'Mon'), EXTRACT(MONTH FROM lk.created_at)`
    : []

  // Ambil data CA Verified Realisasi
  const iaRows = isAdmin
    ? await sql`SELECT bulan, status_ca, bukti_ca_url FROM intervensi_anggaran WHERE tahun = ${tahun}`
    : auth.role === 'OFFICE' && auth.officeId
    ? await sql`
        SELECT ia.bulan, ia.status_ca, ia.bukti_ca_url
        FROM intervensi_anggaran ia
        JOIN intervensi_program ip ON ia.intervensi_program_id = ip.id
        JOIN desa_berdaya db ON ip.desa_berdaya_id = db.id
        JOIN desa_config dc ON db.desa_id = dc.id
        WHERE ia.tahun = ${tahun} AND dc.office_id = ${auth.officeId}`
    : auth.operatorId
    ? await sql`
        SELECT ia.bulan, ia.status_ca, ia.bukti_ca_url
        FROM intervensi_anggaran ia
        JOIN intervensi_program ip ON ia.intervensi_program_id = ip.id
        WHERE ia.tahun = ${tahun} AND ip.relawan_id = ${auth.operatorId}`
    : []

  const indoMonthToNum: Record<string, number> = {
    'Januari': 1, 'Februari': 2, 'Maret': 3, 'April': 4,
    'Mei': 5, 'Juni': 6, 'Juli': 7, 'Agustus': 8,
    'September': 9, 'Oktober': 10, 'November': 11, 'Desember': 12
  }
  
  const monthNamesToShort: Record<number, string> = {
    1:'Jan', 2:'Feb', 3:'Mar', 4:'Apr', 5:'Mei', 6:'Jun',
    7:'Jul', 8:'Agt', 9:'Sep', 10:'Okt', 11:'Nov', 12:'Des'
  }

  // Agregasi Laporan
  const monthMap = new Map<number, { bln: string, lp: number, rl: number }>()
  
  for (const r of lkRows as any[]) {
    const num = Number(r.bulan_num)
    if (!monthMap.has(num)) monthMap.set(num, { bln: monthNamesToShort[num] || String(num), lp: 0, rl: 0 })
    monthMap.get(num)!.lp += Number(r.jumlah_laporan)
  }

  // Agregasi CA Realisasi
  for (const r of iaRows as any[]) {
    let total = 0
    if (r.status_ca === 'DIVERIFIKASI' && r.bukti_ca_url && r.bukti_ca_url.trim().startsWith('[')) {
      try {
        const entries = JSON.parse(r.bukti_ca_url)
        total = entries.filter((e: any) => !e.ditolak).reduce((acc: number, e: any) => acc + (Number(e.nominal) || 0), 0)
      } catch (e) {}
    }
    const num = indoMonthToNum[r.bulan]
    if (num && total > 0) {
      if (!monthMap.has(num)) monthMap.set(num, { bln: monthNamesToShort[num], lp: 0, rl: 0 })
      monthMap.get(num)!.rl += total
    }
  }

  // Convert map ke List dan sort berdasarkan urutan bulan
  const result: TrendBulanan[] = Array.from(monthMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([_, v]) => ({
      bulan: v.bln,
      jumlah_laporan: v.lp,
      total_realisasi: v.rl
    }))

  return result
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
    : auth.role === 'OFFICE' && auth.officeId
    ? await sql`SELECT db.status_aktif, COUNT(*) as total FROM desa_berdaya db JOIN desa_config dc ON db.desa_id = dc.id WHERE dc.office_id = ${auth.officeId} GROUP BY db.status_aktif`
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

  const isAdmin = auth.role === 'ADMIN' || auth.role === 'MONEV' || auth.role === 'FINANCE' || auth.role === 'OFFICE'
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
  if (!auth) return []
  
  const isSuper = auth.role === 'ADMIN' || auth.role === 'MONEV' || auth.role === 'FINANCE'
  const isOffice = auth.role === 'OFFICE' && auth.officeId

  if (!isSuper && !isOffice) return []

  const rows = isOffice
    ? await sql`
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
          AND dc.office_id = ${auth.officeId}
          AND db.latitude IS NOT NULL
          AND db.longitude IS NOT NULL
      `
    : await sql`
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
  const isSuper = auth?.role === 'ADMIN' || auth?.role === 'MONEV' || auth?.role === 'FINANCE'
  const isOffice = auth?.role === 'OFFICE' && auth?.officeId

  if (!auth || (!isSuper && !isOffice)) {
    return { totalProvinsi: 0, totalKota: 0, totalKecamatan: 0, totalDesa: 0 }
  }

  const rows = isOffice
    ? await sql`
        SELECT
          (SELECT COUNT(DISTINCT db.provinsi_id) FROM desa_berdaya db JOIN desa_config dc ON db.desa_id = dc.id WHERE db.status_aktif = true AND dc.office_id = ${auth.officeId}) as total_provinsi,
          (SELECT COUNT(DISTINCT db.kota_id) FROM desa_berdaya db JOIN desa_config dc ON db.desa_id = dc.id WHERE db.status_aktif = true AND dc.office_id = ${auth.officeId}) as total_kota,
          (SELECT COUNT(DISTINCT db.kecamatan_id) FROM desa_berdaya db JOIN desa_config dc ON db.desa_id = dc.id WHERE db.status_aktif = true AND dc.office_id = ${auth.officeId}) as total_kecamatan,
          (SELECT COUNT(*) FROM desa_berdaya db JOIN desa_config dc ON db.desa_id = dc.id WHERE db.status_aktif = true AND dc.office_id = ${auth.officeId}) as total_desa
      `
    : await sql`
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

