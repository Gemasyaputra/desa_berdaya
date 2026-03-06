'use server'

import { sql } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function getDesaBinaanList() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return []

  const role = session.user.role
  const operatorId = session.user.operator_id

  if (role === 'ADMIN' || role === 'MONEV' || role === 'FINANCE') {
    const result = await sql`
      SELECT db.*, p.nama_provinsi, kk.nama_kota, k.nama_kecamatan, dc.nama_desa, r.nama as nama_relawan
      FROM desa_berdaya db
      JOIN provinsi p ON db.provinsi_id = p.id
      JOIN kota_kabupaten kk ON db.kota_id = kk.id
      JOIN kecamatan k ON db.kecamatan_id = k.id
      JOIN desa_config dc ON db.desa_id = dc.id
      JOIN relawan r ON db.relawan_id = r.id
      ORDER BY db.tanggal_mulai DESC
    `
    return result as any[]
  }

  if (session.user.is_korwil && operatorId) {
    const result = await sql`
      SELECT db.*, p.nama_provinsi, kk.nama_kota, k.nama_kecamatan, dc.nama_desa, r.nama as nama_relawan
      FROM desa_berdaya db
      JOIN provinsi p ON db.provinsi_id = p.id
      JOIN kota_kabupaten kk ON db.kota_id = kk.id
      JOIN kecamatan k ON db.kecamatan_id = k.id
      JOIN desa_config dc ON db.desa_id = dc.id
      JOIN relawan r ON db.relawan_id = r.id
      WHERE r.korwil_id = ${operatorId}
      ORDER BY db.tanggal_mulai DESC
    `
    return result as any[]
  }

  if (role === 'RELAWAN' && operatorId) {
    const result = await sql`
      SELECT db.*, p.nama_provinsi, kk.nama_kota, k.nama_kecamatan, dc.nama_desa, r.nama as nama_relawan
      FROM desa_berdaya db
      JOIN provinsi p ON db.provinsi_id = p.id
      JOIN kota_kabupaten kk ON db.kota_id = kk.id
      JOIN kecamatan k ON db.kecamatan_id = k.id
      JOIN desa_config dc ON db.desa_id = dc.id
      JOIN relawan r ON db.relawan_id = r.id
      WHERE db.relawan_id = ${operatorId}
      ORDER BY db.tanggal_mulai DESC
    `
    return result as any[]
  }

  return []
}

export async function getProvinsi() {
  const result = await sql`SELECT id, nama_provinsi FROM provinsi ORDER BY nama_provinsi ASC`
  return result as any[]
}

export async function getKotaKabupaten(provinsiId: number) {
  if (!provinsiId) return []
  const result = await sql`SELECT id, nama_kota FROM kota_kabupaten WHERE provinsi_id = ${provinsiId} ORDER BY nama_kota ASC`
  return result as any[]
}

export async function getKecamatan(kotaId: number) {
  if (!kotaId) return []
  const result = await sql`SELECT id, nama_kecamatan FROM kecamatan WHERE kota_id = ${kotaId} ORDER BY nama_kecamatan ASC`
  return result as any[]
}

export async function getDesaConfig(kecamatanId: number) {
  if (!kecamatanId) return []
  const result = await sql`SELECT id, nama_desa FROM desa_config WHERE kecamatan_id = ${kecamatanId} ORDER BY nama_desa ASC`
  return result as any[]
}

export async function getRelawanBawahan() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return []

  if (session.user.is_korwil && session.user.operator_id) {
    const result = await sql`
      SELECT id, nama 
      FROM relawan 
      WHERE korwil_id = ${session.user.operator_id}
      ORDER BY nama ASC
    `
    return result as any[]
  } 
  
  if (session.user.role === 'ADMIN' || session.user.role === 'MONEV') {
    const result = await sql`SELECT id, nama FROM relawan ORDER BY nama ASC`
    return result as any[]
  }

  return []
}

export async function createDesaBinaan(data: any) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.is_korwil && session?.user?.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  await sql`
    INSERT INTO desa_berdaya (
      provinsi_id, kota_id, kecamatan_id, desa_id, relawan_id, latitude, longitude, potensi_desa, status_aktif
    ) VALUES (
      ${data.provinsi_id}, ${data.kota_id}, ${data.kecamatan_id}, ${data.desa_id}, ${data.relawan_id},
      ${data.latitude}, ${data.longitude}, ${data.potensi_desa}, ${data.status_aktif}
    )
  `
  return { success: true }
}

export async function updateDesaBinaan(id: number, data: any) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.is_korwil && session?.user?.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  await sql`
    UPDATE desa_berdaya SET
      provinsi_id = ${data.provinsi_id},
      kota_id = ${data.kota_id},
      kecamatan_id = ${data.kecamatan_id},
      desa_id = ${data.desa_id},
      relawan_id = ${data.relawan_id},
      latitude = ${data.latitude},
      longitude = ${data.longitude},
      potensi_desa = ${data.potensi_desa},
      status_aktif = ${data.status_aktif}
    WHERE id = ${id}
  `
  return { success: true }
}

export async function deleteDesaBinaan(id: number) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.is_korwil && session?.user?.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  await sql`DELETE FROM desa_berdaya WHERE id = ${id}`
  return { success: true }
}

export async function getDesaBinaanById(id: number) {
  const result = await sql`
    SELECT 
      db.*,
      p.nama_provinsi,
      kk.nama_kota as kota_name,
      k.nama_kecamatan as kecamatan_name,
      dc.nama_desa as desa_name,
      json_build_object(
        'nama_lengkap', r.nama,
        'email', u.email
      ) as relawan,
      CASE WHEN db.status_aktif = true THEN 'Aktif' ELSE 'Tidak Aktif' END as status_binaan
    FROM desa_berdaya db
    JOIN provinsi p ON db.provinsi_id = p.id
    JOIN kota_kabupaten kk ON db.kota_id = kk.id
    JOIN kecamatan k ON db.kecamatan_id = k.id
    JOIN desa_config dc ON db.desa_id = dc.id
    LEFT JOIN relawan r ON db.relawan_id = r.id
    LEFT JOIN users u ON r.user_id = u.id
    WHERE db.id = ${id}
  `
  return (result as any[])[0] || null
}
