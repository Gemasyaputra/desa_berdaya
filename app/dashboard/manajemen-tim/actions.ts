'use server'

import { sql } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import bcrypt from 'bcryptjs'

const DEFAULT_PASSWORD = 'DesaBerdaya2025'

// ============================================================
// Tipe Data
// ============================================================
export type MonevRow = {
  id: number
  nama: string
  hp: string | null
  email: string | null
  user_id: number | null
  jumlah_korwil: number
}

export type KorwilRow = {
  id: number
  nama: string
  hp: string | null
  email: string | null
  user_id: number | null
  monev_id: number | null
  monev_nama: string | null
  jumlah_relawan: number
}

export type RelawanRow = {
  id: number
  nama: string
  hp: string | null
  email: string | null
  user_id: number | null
  korwil_id: number | null
  korwil_nama: string | null
  monev_id: number | null
  jumlah_desa: number
  // New Fields
  foto_url?: string | null
  status_relawan?: string | null
  cabang_dbf?: string | null
  tipe_relawan?: string | null
  tempat_lahir?: string | null
  tanggal_lahir?: string | null
  jenis_kelamin?: string | null
  alamat?: string | null
  nomor_induk?: string | null
  ketokohan?: string | null
  bank?: string | null
  nomor_rekening?: string | null
  atas_nama?: string | null
  nomor_ktp?: string | null
  nomor_kk?: string | null
  pendidikan?: string | null
  pekerjaan?: string | null
  jabatan_desa?: string | null
  keahlian?: string | null
  status_edukasi?: string | null
  coa_kafalah?: string | null
  nama_coa_kafalah?: string | null
  akun_facebook?: string | null
  akun_twitter?: string | null
  akun_instagram?: string | null
}

export type OptionItem = { id: number; nama: string }

// ============================================================
// Helper: Auth check
// ============================================================
async function getAuthContext() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return null
  const role = session.user.role as string
  const operatorId = session.user.operator_id ? Number(session.user.operator_id) : null
  const isKorwil = !!(session.user as any).is_korwil
  const monevId = session.user.monev_id ? Number((session.user as any).monev_id) : null
  const korwilId = session.user.korwil_id ? Number((session.user as any).korwil_id) : null
  return { role, operatorId, isKorwil, monevId, korwilId }
}

// ============================================================
// OPTIONS untuk dropdown
// ============================================================
export async function getMonevOptions(): Promise<OptionItem[]> {
  const rows = await sql`SELECT id, nama FROM monev ORDER BY nama`
  return (rows as any[]).map((r) => ({ id: Number(r.id), nama: r.nama }))
}

export async function getKorwilOptions(monevId?: number | null): Promise<OptionItem[]> {
  const rows = monevId
    ? await sql`SELECT id, nama FROM relawan WHERE is_korwil = true AND monev_id = ${monevId} ORDER BY nama`
    : await sql`SELECT id, nama FROM relawan WHERE is_korwil = true ORDER BY nama`
  return (rows as any[]).map((r) => ({ id: Number(r.id), nama: r.nama }))
}

// ============================================================
// MONEV — CRUD (ADMIN only)
// ============================================================
export async function getMonevList(): Promise<MonevRow[]> {
  const auth = await getAuthContext()
  if (!auth || auth.role !== 'ADMIN') return []

  const rows = await sql`
    SELECT m.id, m.nama, m.hp, u.email, m.user_id,
           COUNT(r.id) AS jumlah_korwil
    FROM monev m
    LEFT JOIN users u ON m.user_id = u.id
    LEFT JOIN relawan r ON r.monev_id = m.id AND r.is_korwil = true
    GROUP BY m.id, m.nama, m.hp, u.email, m.user_id
    ORDER BY m.nama
  `
  return (rows as any[]).map((r) => ({
    id: Number(r.id),
    nama: r.nama,
    hp: r.hp,
    email: r.email,
    user_id: r.user_id ? Number(r.user_id) : null,
    jumlah_korwil: Number(r.jumlah_korwil),
  }))
}

export async function createMonev(data: { nama: string; hp?: string; email: string }) {
  const auth = await getAuthContext()
  if (!auth || auth.role !== 'ADMIN') return { success: false, error: 'Akses ditolak' }

  try {
    // Cek email sudah ada
    const existing = await sql`SELECT id FROM users WHERE email = ${data.email} LIMIT 1`
    if ((existing as any[]).length > 0) return { success: false, error: 'Email sudah digunakan' }

    const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10)
    const userRows = await sql`
      INSERT INTO users (email, password_encrypted, role)
      VALUES (${data.email}, ${hash}, 'MONEV')
      RETURNING id
    `
    const userId = Number((userRows as any[])[0].id)

    await sql`
      INSERT INTO monev (user_id, nama, hp)
      VALUES (${userId}, ${data.nama}, ${data.hp ?? null})
    `
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function updateMonev(id: number, data: { nama: string; hp?: string; email?: string }) {
  const auth = await getAuthContext()
  if (!auth || auth.role !== 'ADMIN') return { success: false, error: 'Akses ditolak' }

  try {
    await sql`UPDATE monev SET nama = ${data.nama}, hp = ${data.hp ?? null} WHERE id = ${id}`
    if (data.email) {
      const monev = await sql`SELECT user_id FROM monev WHERE id = ${id} LIMIT 1`
      const userId = (monev as any[])[0]?.user_id
      if (userId) {
        await sql`UPDATE users SET email = ${data.email} WHERE id = ${userId}`
      }
    }
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function deleteMonev(id: number) {
  const auth = await getAuthContext()
  if (!auth || auth.role !== 'ADMIN') return { success: false, error: 'Akses ditolak' }

  try {
    const monev = await sql`SELECT user_id FROM monev WHERE id = ${id} LIMIT 1`
    const userId = (monev as any[])[0]?.user_id
    await sql`DELETE FROM monev WHERE id = ${id}`
    if (userId) await sql`DELETE FROM users WHERE id = ${userId}`
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function resetPasswordMonev(id: number) {
  const auth = await getAuthContext()
  if (!auth || auth.role !== 'ADMIN') return { success: false, error: 'Akses ditolak' }
  try {
    const monev = await sql`SELECT user_id FROM monev WHERE id = ${id} LIMIT 1`
    const userId = (monev as any[])[0]?.user_id
    if (!userId) return { success: false, error: 'User tidak ditemukan' }
    const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10)
    await sql`UPDATE users SET password_encrypted = ${hash} WHERE id = ${userId}`
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

// ============================================================
// KORWIL — CRUD (ADMIN, MONEV)
// ============================================================
export async function getKorwilList(): Promise<KorwilRow[]> {
  const auth = await getAuthContext()
  if (!auth) return []

  const isAdmin = auth.role === 'ADMIN'
  const isMonev = auth.role === 'MONEV'
  if (!isAdmin && !isMonev) return []

  const rows = isAdmin
    ? await sql`
        SELECT r.id, r.nama, r.hp, u.email, r.user_id, r.monev_id,
               m.nama AS monev_nama,
               COUNT(sub.id) AS jumlah_relawan,
               r.foto_url, r.status_relawan, r.cabang_dbf, r.tipe_relawan,
               r.tempat_lahir, r.tanggal_lahir, r.jenis_kelamin, r.alamat, r.nomor_induk, r.ketokohan,
               r.bank, r.nomor_rekening, r.atas_nama, r.nomor_ktp, r.nomor_kk, r.pendidikan, r.pekerjaan,
               r.jabatan_desa, r.keahlian, r.status_edukasi, r.coa_kafalah, r.nama_coa_kafalah,
               r.akun_facebook, r.akun_twitter, r.akun_instagram
        FROM relawan r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN monev m ON r.monev_id = m.id
        LEFT JOIN relawan sub ON sub.korwil_id = r.id AND sub.is_korwil = false
        WHERE r.is_korwil = true
        GROUP BY r.id, r.nama, r.hp, u.email, r.user_id, r.monev_id, m.nama
        ORDER BY r.nama`
    : await sql`
        SELECT r.id, r.nama, r.hp, u.email, r.user_id, r.monev_id,
               m.nama AS monev_nama,
               COUNT(sub.id) AS jumlah_relawan,
               r.foto_url, r.status_relawan, r.cabang_dbf, r.tipe_relawan,
               r.tempat_lahir, r.tanggal_lahir, r.jenis_kelamin, r.alamat, r.nomor_induk, r.ketokohan,
               r.bank, r.nomor_rekening, r.atas_nama, r.nomor_ktp, r.nomor_kk, r.pendidikan, r.pekerjaan,
               r.jabatan_desa, r.keahlian, r.status_edukasi, r.coa_kafalah, r.nama_coa_kafalah,
               r.akun_facebook, r.akun_twitter, r.akun_instagram
        FROM relawan r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN monev m ON r.monev_id = m.id
        LEFT JOIN relawan sub ON sub.korwil_id = r.id AND sub.is_korwil = false
        WHERE r.is_korwil = true AND r.monev_id = ${auth.operatorId}
        GROUP BY r.id, r.nama, r.hp, u.email, r.user_id, r.monev_id, m.nama
        ORDER BY r.nama`

  return (rows as any[]).map((r) => ({
    id: Number(r.id),
    nama: r.nama,
    hp: r.hp,
    email: r.email,
    user_id: r.user_id ? Number(r.user_id) : null,
    monev_id: r.monev_id ? Number(r.monev_id) : null,
    monev_nama: r.monev_nama,
    jumlah_relawan: Number(r.jumlah_relawan),
    foto_url: r.foto_url,
    status_relawan: r.status_relawan,
    cabang_dbf: r.cabang_dbf,
    tipe_relawan: r.tipe_relawan,
    tempat_lahir: r.tempat_lahir,
    tanggal_lahir: r.tanggal_lahir ? new Date(r.tanggal_lahir).toISOString().split('T')[0] : null,
    jenis_kelamin: r.jenis_kelamin,
    alamat: r.alamat,
    nomor_induk: r.nomor_induk,
    ketokohan: r.ketokohan,
    bank: r.bank,
    nomor_rekening: r.nomor_rekening,
    atas_nama: r.atas_nama,
    nomor_ktp: r.nomor_ktp,
    nomor_kk: r.nomor_kk,
    pendidikan: r.pendidikan,
    pekerjaan: r.pekerjaan,
    jabatan_desa: r.jabatan_desa,
    keahlian: r.keahlian,
    status_edukasi: r.status_edukasi,
    coa_kafalah: r.coa_kafalah,
    nama_coa_kafalah: r.nama_coa_kafalah,
    akun_facebook: r.akun_facebook,
    akun_twitter: r.akun_twitter,
    akun_instagram: r.akun_instagram,
  }))
}

export async function createKorwil(data: Partial<RelawanRow> & {
  nama: string
  email: string
  monev_id: number
}) {
  const auth = await getAuthContext()
  if (!auth) return { success: false, error: 'Akses ditolak' }
  const isAdmin = auth.role === 'ADMIN'
  const isMonev = auth.role === 'MONEV'
  if (!isAdmin && !isMonev) return { success: false, error: 'Akses ditolak' }

  // Monev hanya bisa buat Korwil di bawahnya sendiri
  const monevId = isMonev ? auth.operatorId! : data.monev_id

  try {
    const existing = await sql`SELECT id FROM users WHERE email = ${data.email} LIMIT 1`
    if ((existing as any[]).length > 0) return { success: false, error: 'Email sudah digunakan' }

    const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10)
    const userRows = await sql`
      INSERT INTO users (email, password_encrypted, role)
      VALUES (${data.email}, ${hash}, 'RELAWAN')
      RETURNING id
    `
    const userId = Number((userRows as any[])[0].id)
    const relawanRows = await sql`
      INSERT INTO relawan (
        user_id, nama, hp, is_korwil, monev_id,
        foto_url, status_relawan, cabang_dbf, tipe_relawan,
        tempat_lahir, tanggal_lahir, jenis_kelamin, alamat, nomor_induk, ketokohan,
        bank, nomor_rekening, atas_nama, nomor_ktp, nomor_kk, pendidikan, pekerjaan,
        jabatan_desa, keahlian, status_edukasi, coa_kafalah, nama_coa_kafalah,
        akun_facebook, akun_twitter, akun_instagram
      )
      VALUES (
        ${userId}, ${data.nama}, ${data.hp ?? null}, true, ${monevId},
        ${data.foto_url ?? null}, ${data.status_relawan ?? 'Aktif'}, ${data.cabang_dbf ?? null}, ${data.tipe_relawan ?? null},
        ${data.tempat_lahir ?? null}, ${data.tanggal_lahir ?? null}, ${data.jenis_kelamin ?? null}, ${data.alamat ?? null}, ${data.nomor_induk ?? null}, ${data.ketokohan ?? null},
        ${data.bank ?? null}, ${data.nomor_rekening ?? null}, ${data.atas_nama ?? null}, ${data.nomor_ktp ?? null}, ${data.nomor_kk ?? null}, ${data.pendidikan ?? null}, ${data.pekerjaan ?? null},
        ${data.jabatan_desa ?? null}, ${data.keahlian ?? null}, ${data.status_edukasi ?? null}, ${data.coa_kafalah ?? null}, ${data.nama_coa_kafalah ?? null},
        ${data.akun_facebook ?? null}, ${data.akun_twitter ?? null}, ${data.akun_instagram ?? null}
      )
      RETURNING id
    `
    // Set korwil_id = self (self-reference sebagai identitas Korwil)
    const relawanId = Number((relawanRows as any[])[0].id)
    await sql`UPDATE relawan SET korwil_id = ${relawanId} WHERE id = ${relawanId}`

    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function updateKorwil(
  id: number,
  data: Partial<RelawanRow> & { nama: string; email?: string }
) {
  const auth = await getAuthContext()
  if (!auth) return { success: false, error: 'Akses ditolak' }
  const isAdmin = auth.role === 'ADMIN'
  const isMonev = auth.role === 'MONEV'
  if (!isAdmin && !isMonev) return { success: false, error: 'Akses ditolak' }

  try {
    if (isAdmin && data.monev_id) {
      await sql`UPDATE relawan SET 
        nama = ${data.nama}, hp = ${data.hp ?? null}, monev_id = ${data.monev_id},
        foto_url = ${data.foto_url ?? null}, status_relawan = ${data.status_relawan ?? null}, cabang_dbf = ${data.cabang_dbf ?? null}, tipe_relawan = ${data.tipe_relawan ?? null},
        tempat_lahir = ${data.tempat_lahir ?? null}, tanggal_lahir = ${data.tanggal_lahir ?? null}, jenis_kelamin = ${data.jenis_kelamin ?? null}, alamat = ${data.alamat ?? null}, nomor_induk = ${data.nomor_induk ?? null}, ketokohan = ${data.ketokohan ?? null},
        bank = ${data.bank ?? null}, nomor_rekening = ${data.nomor_rekening ?? null}, atas_nama = ${data.atas_nama ?? null}, nomor_ktp = ${data.nomor_ktp ?? null}, nomor_kk = ${data.nomor_kk ?? null}, pendidikan = ${data.pendidikan ?? null}, pekerjaan = ${data.pekerjaan ?? null},
        jabatan_desa = ${data.jabatan_desa ?? null}, keahlian = ${data.keahlian ?? null}, status_edukasi = ${data.status_edukasi ?? null}, coa_kafalah = ${data.coa_kafalah ?? null}, nama_coa_kafalah = ${data.nama_coa_kafalah ?? null},
        akun_facebook = ${data.akun_facebook ?? null}, akun_twitter = ${data.akun_twitter ?? null}, akun_instagram = ${data.akun_instagram ?? null}
        WHERE id = ${id}`
    } else {
      await sql`UPDATE relawan SET 
        nama = ${data.nama}, hp = ${data.hp ?? null},
        foto_url = ${data.foto_url ?? null}, status_relawan = ${data.status_relawan ?? null}, cabang_dbf = ${data.cabang_dbf ?? null}, tipe_relawan = ${data.tipe_relawan ?? null},
        tempat_lahir = ${data.tempat_lahir ?? null}, tanggal_lahir = ${data.tanggal_lahir ?? null}, jenis_kelamin = ${data.jenis_kelamin ?? null}, alamat = ${data.alamat ?? null}, nomor_induk = ${data.nomor_induk ?? null}, ketokohan = ${data.ketokohan ?? null},
        bank = ${data.bank ?? null}, nomor_rekening = ${data.nomor_rekening ?? null}, atas_nama = ${data.atas_nama ?? null}, nomor_ktp = ${data.nomor_ktp ?? null}, nomor_kk = ${data.nomor_kk ?? null}, pendidikan = ${data.pendidikan ?? null}, pekerjaan = ${data.pekerjaan ?? null},
        jabatan_desa = ${data.jabatan_desa ?? null}, keahlian = ${data.keahlian ?? null}, status_edukasi = ${data.status_edukasi ?? null}, coa_kafalah = ${data.coa_kafalah ?? null}, nama_coa_kafalah = ${data.nama_coa_kafalah ?? null},
        akun_facebook = ${data.akun_facebook ?? null}, akun_twitter = ${data.akun_twitter ?? null}, akun_instagram = ${data.akun_instagram ?? null}
        WHERE id = ${id}`
    }
    if (data.email) {
      const r = await sql`SELECT user_id FROM relawan WHERE id = ${id} LIMIT 1`
      const userId = (r as any[])[0]?.user_id
      if (userId) await sql`UPDATE users SET email = ${data.email} WHERE id = ${userId}`
    }
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function deleteKorwil(id: number) {
  const auth = await getAuthContext()
  if (!auth) return { success: false, error: 'Akses ditolak' }
  const isAdmin = auth.role === 'ADMIN'
  const isMonev = auth.role === 'MONEV'
  if (!isAdmin && !isMonev) return { success: false, error: 'Akses ditolak' }

  try {
    const r = await sql`SELECT user_id FROM relawan WHERE id = ${id} LIMIT 1`
    const userId = (r as any[])[0]?.user_id
    // Set null korwil_id dulu pada relawan bawahan
    await sql`UPDATE relawan SET korwil_id = NULL WHERE korwil_id = ${id} AND is_korwil = false`
    await sql`DELETE FROM relawan WHERE id = ${id}`
    if (userId) await sql`DELETE FROM users WHERE id = ${userId}`
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function resetPasswordKorwil(id: number) {
  const auth = await getAuthContext()
  if (!auth || (auth.role !== 'ADMIN' && auth.role !== 'MONEV')) return { success: false, error: 'Akses ditolak' }
  try {
    const r = await sql`SELECT user_id FROM relawan WHERE id = ${id} LIMIT 1`
    const userId = (r as any[])[0]?.user_id
    if (!userId) return { success: false, error: 'User tidak ditemukan' }
    const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10)
    await sql`UPDATE users SET password_encrypted = ${hash} WHERE id = ${userId}`
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

// ============================================================
// RELAWAN — CRUD (ADMIN, MONEV, KORWIL)
// ============================================================
export async function getRelawanList(): Promise<RelawanRow[]> {
  const auth = await getAuthContext()
  if (!auth) return []

  const isAdmin = auth.role === 'ADMIN'
  const isMonev = auth.role === 'MONEV'
  const isKorwil = auth.isKorwil

  const selectFields = sql`
    r.id, r.nama, r.hp, u.email, r.user_id,
    r.korwil_id, k.nama AS korwil_nama, r.monev_id,
    COUNT(db.id) AS jumlah_desa,
    r.foto_url, r.status_relawan, r.cabang_dbf, r.tipe_relawan,
    r.tempat_lahir, r.tanggal_lahir, r.jenis_kelamin, r.alamat, r.nomor_induk, r.ketokohan,
    r.bank, r.nomor_rekening, r.atas_nama, r.nomor_ktp, r.nomor_kk, r.pendidikan, r.pekerjaan,
    r.jabatan_desa, r.keahlian, r.status_edukasi, r.coa_kafalah, r.nama_coa_kafalah,
    r.akun_facebook, r.akun_twitter, r.akun_instagram
  `

  const rows = isAdmin
    ? await sql`
        SELECT r.id, r.nama, r.hp, u.email, r.user_id,
               r.korwil_id, k.nama AS korwil_nama, r.monev_id,
               COUNT(db.id) AS jumlah_desa,
               r.foto_url, r.status_relawan, r.cabang_dbf, r.tipe_relawan,
               r.tempat_lahir, r.tanggal_lahir, r.jenis_kelamin, r.alamat, r.nomor_induk, r.ketokohan,
               r.bank, r.nomor_rekening, r.atas_nama, r.nomor_ktp, r.nomor_kk, r.pendidikan, r.pekerjaan,
               r.jabatan_desa, r.keahlian, r.status_edukasi, r.coa_kafalah, r.nama_coa_kafalah,
               r.akun_facebook, r.akun_twitter, r.akun_instagram
        FROM relawan r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN relawan k ON r.korwil_id = k.id AND k.is_korwil = true AND k.id != r.id
        LEFT JOIN desa_berdaya db ON db.relawan_id = r.id AND db.status_aktif = true
        WHERE r.is_korwil = false
        GROUP BY r.id, r.nama, r.hp, u.email, r.user_id, r.korwil_id, k.nama, r.monev_id
        ORDER BY r.nama`
    : isMonev
    ? await sql`
        SELECT r.id, r.nama, r.hp, u.email, r.user_id,
               r.korwil_id, k.nama AS korwil_nama, r.monev_id,
               COUNT(db.id) AS jumlah_desa,
               r.foto_url, r.status_relawan, r.cabang_dbf, r.tipe_relawan,
               r.tempat_lahir, r.tanggal_lahir, r.jenis_kelamin, r.alamat, r.nomor_induk, r.ketokohan,
               r.bank, r.nomor_rekening, r.atas_nama, r.nomor_ktp, r.nomor_kk, r.pendidikan, r.pekerjaan,
               r.jabatan_desa, r.keahlian, r.status_edukasi, r.coa_kafalah, r.nama_coa_kafalah,
               r.akun_facebook, r.akun_twitter, r.akun_instagram
        FROM relawan r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN relawan k ON r.korwil_id = k.id AND k.is_korwil = true AND k.id != r.id
        LEFT JOIN desa_berdaya db ON db.relawan_id = r.id AND db.status_aktif = true
        WHERE r.is_korwil = false AND r.monev_id = ${auth.operatorId}
        GROUP BY r.id, r.nama, r.hp, u.email, r.user_id, r.korwil_id, k.nama, r.monev_id
        ORDER BY r.nama`
    : isKorwil
    ? await sql`
        SELECT r.id, r.nama, r.hp, u.email, r.user_id,
               r.korwil_id, k.nama AS korwil_nama, r.monev_id,
               COUNT(db.id) AS jumlah_desa,
               r.foto_url, r.status_relawan, r.cabang_dbf, r.tipe_relawan,
               r.tempat_lahir, r.tanggal_lahir, r.jenis_kelamin, r.alamat, r.nomor_induk, r.ketokohan,
               r.bank, r.nomor_rekening, r.atas_nama, r.nomor_ktp, r.nomor_kk, r.pendidikan, r.pekerjaan,
               r.jabatan_desa, r.keahlian, r.status_edukasi, r.coa_kafalah, r.nama_coa_kafalah,
               r.akun_facebook, r.akun_twitter, r.akun_instagram
        FROM relawan r
        LEFT JOIN users u ON r.user_id = u.id
        LEFT JOIN relawan k ON r.korwil_id = k.id AND k.is_korwil = true AND k.id != r.id
        LEFT JOIN desa_berdaya db ON db.relawan_id = r.id AND db.status_aktif = true
        WHERE r.is_korwil = false AND r.korwil_id = ${auth.operatorId}
        GROUP BY r.id, r.nama, r.hp, u.email, r.user_id, r.korwil_id, k.nama, r.monev_id
        ORDER BY r.nama`
    : []

  if (!Array.isArray(rows)) return []
  return (rows as any[]).map((r) => ({
    id: Number(r.id),
    nama: r.nama,
    hp: r.hp,
    email: r.email,
    user_id: r.user_id ? Number(r.user_id) : null,
    korwil_id: r.korwil_id ? Number(r.korwil_id) : null,
    korwil_nama: r.korwil_nama,
    monev_id: r.monev_id ? Number(r.monev_id) : null,
    jumlah_desa: Number(r.jumlah_desa),
    foto_url: r.foto_url,
    status_relawan: r.status_relawan,
    cabang_dbf: r.cabang_dbf,
    tipe_relawan: r.tipe_relawan,
    tempat_lahir: r.tempat_lahir,
    tanggal_lahir: r.tanggal_lahir ? new Date(r.tanggal_lahir).toISOString().split('T')[0] : null,
    jenis_kelamin: r.jenis_kelamin,
    alamat: r.alamat,
    nomor_induk: r.nomor_induk,
    ketokohan: r.ketokohan,
    bank: r.bank,
    nomor_rekening: r.nomor_rekening,
    atas_nama: r.atas_nama,
    nomor_ktp: r.nomor_ktp,
    nomor_kk: r.nomor_kk,
    pendidikan: r.pendidikan,
    pekerjaan: r.pekerjaan,
    jabatan_desa: r.jabatan_desa,
    keahlian: r.keahlian,
    status_edukasi: r.status_edukasi,
    coa_kafalah: r.coa_kafalah,
    nama_coa_kafalah: r.nama_coa_kafalah,
    akun_facebook: r.akun_facebook,
    akun_twitter: r.akun_twitter,
    akun_instagram: r.akun_instagram,
  }))
}

export async function createRelawan(data: Partial<RelawanRow> & {
  nama: string
  email: string
  korwil_id: number
}) {
  const auth = await getAuthContext()
  if (!auth) return { success: false, error: 'Akses ditolak' }

  const isAdmin = auth.role === 'ADMIN'
  const isMonev = auth.role === 'MONEV'
  const isKorwil = auth.isKorwil
  if (!isAdmin && !isMonev && !isKorwil) return { success: false, error: 'Akses ditolak' }

  // Tentukan korwil_id & monev_id
  const korwilId = isKorwil ? auth.operatorId! : data.korwil_id

  // Ambil monev_id dari korwil yang dipilih
  const korwilRow = await sql`SELECT monev_id FROM relawan WHERE id = ${korwilId} LIMIT 1`
  const monevId = (korwilRow as any[])[0]?.monev_id ?? null

  try {
    const existing = await sql`SELECT id FROM users WHERE email = ${data.email} LIMIT 1`
    if ((existing as any[]).length > 0) return { success: false, error: 'Email sudah digunakan' }

    const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10)
    const userRows = await sql`
      INSERT INTO users (email, password_encrypted, role)
      VALUES (${data.email}, ${hash}, 'RELAWAN')
      RETURNING id
    `
    const userId = Number((userRows as any[])[0].id)

    await sql`
      INSERT INTO relawan (
        user_id, nama, hp, is_korwil, monev_id, korwil_id,
        foto_url, status_relawan, cabang_dbf, tipe_relawan,
        tempat_lahir, tanggal_lahir, jenis_kelamin, alamat, nomor_induk, ketokohan,
        bank, nomor_rekening, atas_nama, nomor_ktp, nomor_kk, pendidikan, pekerjaan,
        jabatan_desa, keahlian, status_edukasi, coa_kafalah, nama_coa_kafalah,
        akun_facebook, akun_twitter, akun_instagram
      )
      VALUES (
        ${userId}, ${data.nama}, ${data.hp ?? null}, false, ${monevId}, ${korwilId},
        ${data.foto_url ?? null}, ${data.status_relawan ?? 'Aktif'}, ${data.cabang_dbf ?? null}, ${data.tipe_relawan ?? null},
        ${data.tempat_lahir ?? null}, ${data.tanggal_lahir ?? null}, ${data.jenis_kelamin ?? null}, ${data.alamat ?? null}, ${data.nomor_induk ?? null}, ${data.ketokohan ?? null},
        ${data.bank ?? null}, ${data.nomor_rekening ?? null}, ${data.atas_nama ?? null}, ${data.nomor_ktp ?? null}, ${data.nomor_kk ?? null}, ${data.pendidikan ?? null}, ${data.pekerjaan ?? null},
        ${data.jabatan_desa ?? null}, ${data.keahlian ?? null}, ${data.status_edukasi ?? null}, ${data.coa_kafalah ?? null}, ${data.nama_coa_kafalah ?? null},
        ${data.akun_facebook ?? null}, ${data.akun_twitter ?? null}, ${data.akun_instagram ?? null}
      )
    `
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function updateRelawan(
  id: number,
  data: Partial<RelawanRow> & { nama: string }
) {
  const auth = await getAuthContext()
  if (!auth) return { success: false, error: 'Akses ditolak' }

  const isAdmin = auth.role === 'ADMIN'
  const isMonev = auth.role === 'MONEV'
  const isKorwil = auth.isKorwil
  if (!isAdmin && !isMonev && !isKorwil) return { success: false, error: 'Akses ditolak' }

  try {
    if ((isAdmin || isMonev) && data.korwil_id) {
      const korwilRow = await sql`SELECT monev_id FROM relawan WHERE id = ${data.korwil_id} LIMIT 1`
      const monevId = (korwilRow as any[])[0]?.monev_id ?? null
      await sql`UPDATE relawan SET 
        nama = ${data.nama}, hp = ${data.hp ?? null}, korwil_id = ${data.korwil_id}, monev_id = ${monevId},
        foto_url = ${data.foto_url ?? null}, status_relawan = ${data.status_relawan ?? null}, cabang_dbf = ${data.cabang_dbf ?? null}, tipe_relawan = ${data.tipe_relawan ?? null},
        tempat_lahir = ${data.tempat_lahir ?? null}, tanggal_lahir = ${data.tanggal_lahir ?? null}, jenis_kelamin = ${data.jenis_kelamin ?? null}, alamat = ${data.alamat ?? null}, nomor_induk = ${data.nomor_induk ?? null}, ketokohan = ${data.ketokohan ?? null},
        bank = ${data.bank ?? null}, nomor_rekening = ${data.nomor_rekening ?? null}, atas_nama = ${data.atas_nama ?? null}, nomor_ktp = ${data.nomor_ktp ?? null}, nomor_kk = ${data.nomor_kk ?? null}, pendidikan = ${data.pendidikan ?? null}, pekerjaan = ${data.pekerjaan ?? null},
        jabatan_desa = ${data.jabatan_desa ?? null}, keahlian = ${data.keahlian ?? null}, status_edukasi = ${data.status_edukasi ?? null}, coa_kafalah = ${data.coa_kafalah ?? null}, nama_coa_kafalah = ${data.nama_coa_kafalah ?? null},
        akun_facebook = ${data.akun_facebook ?? null}, akun_twitter = ${data.akun_twitter ?? null}, akun_instagram = ${data.akun_instagram ?? null}
        WHERE id = ${id}`
    } else {
      await sql`UPDATE relawan SET 
        nama = ${data.nama}, hp = ${data.hp ?? null},
        foto_url = ${data.foto_url ?? null}, status_relawan = ${data.status_relawan ?? null}, cabang_dbf = ${data.cabang_dbf ?? null}, tipe_relawan = ${data.tipe_relawan ?? null},
        tempat_lahir = ${data.tempat_lahir ?? null}, tanggal_lahir = ${data.tanggal_lahir ?? null}, jenis_kelamin = ${data.jenis_kelamin ?? null}, alamat = ${data.alamat ?? null}, nomor_induk = ${data.nomor_induk ?? null}, ketokohan = ${data.ketokohan ?? null},
        bank = ${data.bank ?? null}, nomor_rekening = ${data.nomor_rekening ?? null}, atas_nama = ${data.atas_nama ?? null}, nomor_ktp = ${data.nomor_ktp ?? null}, nomor_kk = ${data.nomor_kk ?? null}, pendidikan = ${data.pendidikan ?? null}, pekerjaan = ${data.pekerjaan ?? null},
        jabatan_desa = ${data.jabatan_desa ?? null}, keahlian = ${data.keahlian ?? null}, status_edukasi = ${data.status_edukasi ?? null}, coa_kafalah = ${data.coa_kafalah ?? null}, nama_coa_kafalah = ${data.nama_coa_kafalah ?? null},
        akun_facebook = ${data.akun_facebook ?? null}, akun_twitter = ${data.akun_twitter ?? null}, akun_instagram = ${data.akun_instagram ?? null}
        WHERE id = ${id}`
    }
    if (data.email) {
      const r = await sql`SELECT user_id FROM relawan WHERE id = ${id} LIMIT 1`
      const userId = (r as any[])[0]?.user_id
      if (userId) await sql`UPDATE users SET email = ${data.email} WHERE id = ${userId}`
    }
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function deleteRelawan(id: number) {
  const auth = await getAuthContext()
  if (!auth) return { success: false, error: 'Akses ditolak' }

  const isAdmin = auth.role === 'ADMIN'
  const isMonev = auth.role === 'MONEV'
  const isKorwil = auth.isKorwil
  if (!isAdmin && !isMonev && !isKorwil) return { success: false, error: 'Akses ditolak' }

  try {
    const r = await sql`SELECT user_id FROM relawan WHERE id = ${id} LIMIT 1`
    const userId = (r as any[])[0]?.user_id
    await sql`DELETE FROM relawan WHERE id = ${id}`
    if (userId) await sql`DELETE FROM users WHERE id = ${userId}`
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

export async function resetPasswordRelawan(id: number) {
  const auth = await getAuthContext()
  if (!auth) return { success: false, error: 'Akses ditolak' }
  const isAdmin = auth.role === 'ADMIN'
  const isMonev = auth.role === 'MONEV'
  const isKorwil = auth.isKorwil
  if (!isAdmin && !isMonev && !isKorwil) return { success: false, error: 'Akses ditolak' }
  try {
    const r = await sql`SELECT user_id FROM relawan WHERE id = ${id} LIMIT 1`
    const userId = (r as any[])[0]?.user_id
    if (!userId) return { success: false, error: 'User tidak ditemukan' }
    const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10)
    await sql`UPDATE users SET password_encrypted = ${hash} WHERE id = ${userId}`
    return { success: true }
  } catch (e: any) {
    return { success: false, error: e.message }
  }
}

// ============================================================
// DETAIL WILAYAH — baca-only, untuk semua role yang punya akses
// ============================================================
export type DesaItem = {
  db_id: number
  nama_desa: string
  kecamatan: string
  kota: string
  provinsi: string
  status_aktif: boolean
}

export type RelawanWilayahItem = {
  relawan_id: number
  relawan_nama: string
  desa: DesaItem[]
}

export type KorwilWilayahDetail = {
  korwil_id: number
  korwil_nama: string
  relawans: RelawanWilayahItem[]
}

export type MonevWilayahDetail = {
  monev_id: number
  monev_nama: string
  korwils: KorwilWilayahDetail[]
}

// Desa yang dikelola satu relawan
export async function getRelawanWilayah(relawanId: number): Promise<DesaItem[]> {
  const rows = await sql`
    SELECT db.id AS db_id,
           dc.nama_desa,
           kc.nama_kecamatan AS kecamatan,
           kk.nama_kota AS kota,
           p.nama_provinsi AS provinsi,
           db.status_aktif
    FROM desa_berdaya db
    JOIN desa_config dc ON db.desa_id = dc.id
    JOIN kecamatan kc ON db.kecamatan_id = kc.id
    JOIN kota_kabupaten kk ON db.kota_id = kk.id
    JOIN provinsi p ON db.provinsi_id = p.id
    WHERE db.relawan_id = ${relawanId}
    ORDER BY p.nama_provinsi, kk.nama_kota, kc.nama_kecamatan, dc.nama_desa
  `
  return (rows as any[]).map((r) => ({
    db_id: Number(r.db_id),
    nama_desa: r.nama_desa,
    kecamatan: r.kecamatan,
    kota: r.kota,
    provinsi: r.provinsi,
    status_aktif: r.status_aktif,
  }))
}

// Semua relawan + desa di bawah satu korwil
export async function getKorwilWilayah(korwilId: number): Promise<KorwilWilayahDetail> {
  const korwilRow = await sql`SELECT nama FROM relawan WHERE id = ${korwilId} LIMIT 1`
  const korwil_nama = (korwilRow as any[])[0]?.nama ?? 'Korwil'

  const relawanRows = await sql`
    SELECT id, nama FROM relawan
    WHERE korwil_id = ${korwilId} AND is_korwil = false
    ORDER BY nama
  `

  const relawans: RelawanWilayahItem[] = await Promise.all(
    (relawanRows as any[]).map(async (r) => ({
      relawan_id: Number(r.id),
      relawan_nama: r.nama,
      desa: await getRelawanWilayah(Number(r.id)),
    }))
  )

  return { korwil_id: korwilId, korwil_nama, relawans }
}

// Semua korwil+relawan+desa di bawah satu monev
export async function getMonevWilayah(monevId: number): Promise<MonevWilayahDetail> {
  const monevRow = await sql`SELECT nama FROM monev WHERE id = ${monevId} LIMIT 1`
  const monev_nama = (monevRow as any[])[0]?.nama ?? 'Monev'

  const korwilRows = await sql`
    SELECT id, nama FROM relawan
    WHERE monev_id = ${monevId} AND is_korwil = true
    ORDER BY nama
  `

  const korwils: KorwilWilayahDetail[] = await Promise.all(
    (korwilRows as any[]).map(async (k) => getKorwilWilayah(Number(k.id)))
  )

  return { monev_id: monevId, monev_nama, korwils }
}

// ============================================================
// PENUGASAN DESA ↔ RELAWAN
// ============================================================

export type DesaOption = {
  id: number
  nama_desa: string
  kecamatan: string
  kota: string
  relawan_id: number | null
  relawan_nama: string | null
}

/** Semua desa binaan (untuk picker) — bisa filter korwil scope */
export async function getDesaOptions(korwilId?: number | null): Promise<DesaOption[]> {
  const rows = korwilId
    ? await sql`
        SELECT db.id, dc.nama_desa,
               kc.nama_kecamatan AS kecamatan,
               kk.nama_kota AS kota,
               db.relawan_id,
               r.nama AS relawan_nama
        FROM desa_berdaya db
        JOIN desa_config dc ON db.desa_id = dc.id
        JOIN kecamatan kc ON db.kecamatan_id = kc.id
        JOIN kota_kabupaten kk ON db.kota_id = kk.id
        LEFT JOIN relawan r ON db.relawan_id = r.id
        WHERE db.relawan_id IN (
          SELECT id FROM relawan WHERE korwil_id = ${korwilId} AND is_korwil = false
        ) OR db.relawan_id IS NULL
        ORDER BY kk.nama_kota, dc.nama_desa
      `
    : await sql`
        SELECT db.id, dc.nama_desa,
               kc.nama_kecamatan AS kecamatan,
               kk.nama_kota AS kota,
               db.relawan_id,
               r.nama AS relawan_nama
        FROM desa_berdaya db
        JOIN desa_config dc ON db.desa_id = dc.id
        JOIN kecamatan kc ON db.kecamatan_id = kc.id
        JOIN kota_kabupaten kk ON db.kota_id = kk.id
        LEFT JOIN relawan r ON db.relawan_id = r.id
        ORDER BY kk.nama_kota, dc.nama_desa
      `
  return (rows as any[]).map((r) => ({
    id: Number(r.id),
    nama_desa: r.nama_desa,
    kecamatan: r.kecamatan,
    kota: r.kota,
    relawan_id: r.relawan_id ? Number(r.relawan_id) : null,
    relawan_nama: r.relawan_nama ?? null,
  }))
}

/** Desa yang sedang dipegang relawan tertentu */
export async function getDesaByRelawan(relawanId: number): Promise<DesaOption[]> {
  const rows = await sql`
    SELECT db.id, dc.nama_desa,
           kc.nama_kecamatan AS kecamatan,
           kk.nama_kota AS kota,
           db.relawan_id,
           r.nama AS relawan_nama
    FROM desa_berdaya db
    JOIN desa_config dc ON db.desa_id = dc.id
    JOIN kecamatan kc ON db.kecamatan_id = kc.id
    JOIN kota_kabupaten kk ON db.kota_id = kk.id
    LEFT JOIN relawan r ON db.relawan_id = r.id
    WHERE db.relawan_id = ${relawanId}
    ORDER BY kk.nama_kota, dc.nama_desa
  `
  return (rows as any[]).map((r) => ({
    id: Number(r.id),
    nama_desa: r.nama_desa,
    kecamatan: r.kecamatan,
    kota: r.kota,
    relawan_id: relawanId,
    relawan_nama: r.relawan_nama ?? null,
  }))
}

/** Tugaskan desa ke relawan */
export async function assignDesaToRelawan(desaId: number, relawanId: number) {
  try {
    await sql`UPDATE desa_berdaya SET relawan_id = ${relawanId} WHERE id = ${desaId}`
    return { success: true }
  } catch (e: any) { return { success: false, error: e.message } }
}

/** Lepaskan desa dari relawan */
export async function unassignDesaFromRelawan(desaId: number) {
  try {
    await sql`UPDATE desa_berdaya SET relawan_id = NULL WHERE id = ${desaId}`
    return { success: true }
  } catch (e: any) { return { success: false, error: e.message } }
}

/** Ganti relawan di sebuah desa */
export async function changeDesaRelawan(desaId: number, relawanId: number | null) {
  try {
    if (relawanId) {
      await sql`UPDATE desa_berdaya SET relawan_id = ${relawanId} WHERE id = ${desaId}`
    } else {
      await sql`UPDATE desa_berdaya SET relawan_id = NULL WHERE id = ${desaId}`
    }
    return { success: true }
  } catch (e: any) { return { success: false, error: e.message } }
}

/** Semua desa lengkap dengan relawan sekarang (untuk fitur Ganti Relawan per Desa) */
export async function getAllDesaWithRelawan(): Promise<DesaOption[]> {
  const rows = await sql`
    SELECT db.id, dc.nama_desa,
           kc.nama_kecamatan AS kecamatan,
           kk.nama_kota AS kota,
           db.relawan_id,
           r.nama AS relawan_nama
    FROM desa_berdaya db
    JOIN desa_config dc ON db.desa_id = dc.id
    JOIN kecamatan kc ON db.kecamatan_id = kc.id
    JOIN kota_kabupaten kk ON db.kota_id = kk.id
    LEFT JOIN relawan r ON db.relawan_id = r.id
    ORDER BY kk.nama_kota, dc.nama_desa
  `
  return (rows as any[]).map((r) => ({
    id: Number(r.id),
    nama_desa: r.nama_desa,
    kecamatan: r.kecamatan,
    kota: r.kota,
    relawan_id: r.relawan_id ? Number(r.relawan_id) : null,
    relawan_nama: r.relawan_nama ?? null,
  }))
}
