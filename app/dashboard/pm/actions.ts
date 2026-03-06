'use server'

import { sql } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function getDesaBerdayaOptions() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return []

  const role = session.user.role
  const operatorId = session.user.operator_id

  let options: any[] = []

  // Hanya Relawan dan Korwil yang terjun langsung (PROG_HEAD juga korwil di dummy) yang nambah PM
  if (role === 'RELAWAN' || role === 'PROG_HEAD') {
    if (operatorId) {
      options = (await sql`
        SELECT db.id, dc.nama_desa 
        FROM desa_berdaya db
        JOIN desa_config dc ON db.desa_id = dc.id
        WHERE db.relawan_id = ${operatorId} AND db.status_aktif = true
      `) as any[]
    }
  } else if (role === 'ADMIN' || role === 'MONEV') {
    // Admin dan Monev bisa lihat semua desa
    options = (await sql`
      SELECT db.id, dc.nama_desa 
      FROM desa_berdaya db
      JOIN desa_config dc ON db.desa_id = dc.id
      WHERE db.status_aktif = true
    `) as any[]
  }

  return options
}

export async function createPenerimaManfaat(data: {
  desa_berdaya_id: number;
  nik: string;
  nama: string;
  alamat: string;
  kategori_pm: string;
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error('Unauthorized')

  if (!data.desa_berdaya_id || !data.nik || !data.nama || !data.alamat || !data.kategori_pm) {
    throw new Error('Semua field wajib diisi')
  }

  if (data.nik.length !== 16) {
    throw new Error('NIK harus terdiri dari 16 karakter')
  }

  try {
    const result = await sql`
      INSERT INTO penerima_manfaat (
        desa_berdaya_id, nik, nama, alamat, kategori_pm
      ) VALUES (
        ${data.desa_berdaya_id},
        ${data.nik},
        ${data.nama},
        ${data.alamat},
        ${data.kategori_pm}
      )
      RETURNING id
    `
    return { success: true, data: (result as any[])[0] }
  } catch (error: any) {
    console.error('Save PM error:', error)
    if (error.code === '23505') { // Postgres Unique Violation
      throw new Error('NIK ini sudah terdaftar sebagai Penerima Manfaat.')
    }
    throw new Error('Gagal menyimpan data ke database.')
  }
}
