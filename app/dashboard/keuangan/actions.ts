'use server'

import { put } from '@vercel/blob'
import { sql } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function getDesaBerdayaOptions() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return []

  const role = session.user.role
  const operatorId = session.user.operator_id

  if (role === 'RELAWAN' || role === 'PROG_HEAD') {
    if (operatorId) {
      const result = await sql`
        SELECT db.id, dc.nama_desa, 5000000 as alokasi_anggaran 
        FROM desa_berdaya db
        JOIN desa_config dc ON db.desa_id = dc.id
        WHERE db.relawan_id = ${operatorId} AND db.status_aktif = true
      `
      return result as any[]
    }
  } else if (role === 'ADMIN' || role === 'MONEV' || role === 'FINANCE') {
    const result = await sql`
      SELECT db.id, dc.nama_desa, 5000000 as alokasi_anggaran 
      FROM desa_berdaya db
      JOIN desa_config dc ON db.desa_id = dc.id
      WHERE db.status_aktif = true
    `
    return result as any[]
  }
  return []
}

export async function getLaporanKeuangan() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return []

  const options = await getDesaBerdayaOptions()
  if (options.length === 0) return []
  
  const desaIds = options.map((o: any) => o.id)

  const result = await sql`
    SELECT l.*, dc.nama_desa 
    FROM laporan_kegiatan l
    JOIN desa_berdaya db ON l.desa_berdaya_id = db.id
    JOIN desa_config dc ON db.desa_id = dc.id
    WHERE l.desa_berdaya_id = ANY(${desaIds})
    ORDER BY l.created_at DESC
  `
  return result as any[]
}

export async function getLaporanKeuanganById(id: number) {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error('Unauthorized')

  const result = await sql`
    SELECT l.*, dc.nama_desa 
    FROM laporan_kegiatan l
    JOIN desa_berdaya db ON l.desa_berdaya_id = db.id
    JOIN desa_config dc ON db.desa_id = dc.id
    WHERE l.id = ${id}
  `
  return (result as any[])[0] || null
}

export async function createLaporanKeuangan(data: any) {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error('Unauthorized')

  const result = await sql`
    INSERT INTO laporan_kegiatan (
      desa_berdaya_id, jenis_kegiatan, judul_kegiatan, deskripsi, total_realisasi, bukti_url
    ) VALUES (
      ${data.desa_berdaya_id}, ${data.jenis_kegiatan}, ${data.judul_kegiatan}, 
      ${data.deskripsi}, ${data.total_realisasi}, ${data.bukti_url}
    ) RETURNING id
  `
  return { success: true, id: (result as any[])[0].id }
}

export async function updateLaporanKeuangan(id: number, data: any) {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error('Unauthorized')

  const result = await sql`
    UPDATE laporan_kegiatan SET
      desa_berdaya_id = ${data.desa_berdaya_id}, 
      jenis_kegiatan = ${data.jenis_kegiatan}, 
      judul_kegiatan = ${data.judul_kegiatan}, 
      deskripsi = ${data.deskripsi}, 
      total_realisasi = ${data.total_realisasi}, 
      bukti_url = COALESCE(${data.bukti_url || null}, bukti_url)
    WHERE id = ${id} RETURNING id
  `
  return { success: true, id: (result as any[])[0].id }
}

export async function deleteLaporanKeuangan(id: number) {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error('Unauthorized')

  await sql`DELETE FROM laporan_kegiatan WHERE id = ${id}`
  return { success: true }
}

export async function uploadBukti(formData: FormData) {
  const file = formData.get('file') as File
  if (!file) throw new Error('File tidak ditemukan')

  const blob = await put(file.name, file, { access: 'public' })
  return blob.url
}
