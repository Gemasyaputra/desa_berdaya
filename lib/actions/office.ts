'use server'

import { sql } from '@/lib/db'
import { revalidatePath } from 'next/cache'

// Define Types
export type OfficeType = {
  id: number
  nama_office: string
  alamat: string | null
  provinsi_id: number | null
  kota_id: number | null
  kecamatan_id: number | null
  nama_provinsi?: string
  nama_kota?: string
  nama_kecamatan?: string
  created_at: Date
}

export type OfficeWithStats = OfficeType & {
  jumlah_user: number
  jumlah_desa: number
}

// ---------------------------------------------------------------------------
// CRUD Office
// ---------------------------------------------------------------------------

export async function getOffices(searchQuery = ''): Promise<OfficeWithStats[]> {
  try {
    let result
    const q = searchQuery ? `%${searchQuery}%` : null;

    if (q) {
      result = await sql`
        SELECT 
          o.id, o.nama_office, o.alamat, o.provinsi_id, o.kota_id, o.kecamatan_id,
          p.nama_provinsi, kk.nama_kota, k.nama_kecamatan, o.created_at,
          (SELECT COUNT(*) FROM office_user ou WHERE ou.office_id = o.id) as jumlah_user,
          (SELECT COUNT(*) FROM desa_config dc WHERE dc.office_id = o.id) as jumlah_desa
        FROM office o
        LEFT JOIN provinsi p ON o.provinsi_id = p.id
        LEFT JOIN kota_kabupaten kk ON o.kota_id = kk.id
        LEFT JOIN kecamatan k ON o.kecamatan_id = k.id
        WHERE o.nama_office ILIKE ${q}
        ORDER BY o.nama_office ASC
      `
    } else {
      result = await sql`
        SELECT 
          o.id, o.nama_office, o.alamat, o.provinsi_id, o.kota_id, o.kecamatan_id,
          p.nama_provinsi, kk.nama_kota, k.nama_kecamatan, o.created_at,
          (SELECT COUNT(*) FROM office_user ou WHERE ou.office_id = o.id) as jumlah_user,
          (SELECT COUNT(*) FROM desa_config dc WHERE dc.office_id = o.id) as jumlah_desa
        FROM office o
        LEFT JOIN provinsi p ON o.provinsi_id = p.id
        LEFT JOIN kota_kabupaten kk ON o.kota_id = kk.id
        LEFT JOIN kecamatan k ON o.kecamatan_id = k.id
        ORDER BY o.nama_office ASC
      `
    }
    
    return (result as any[]).map(r => ({
      id: Number(r.id),
      nama_office: r.nama_office,
      alamat: r.alamat,
      provinsi_id: r.provinsi_id ? Number(r.provinsi_id) : null,
      kota_id: r.kota_id ? Number(r.kota_id) : null,
      kecamatan_id: r.kecamatan_id ? Number(r.kecamatan_id) : null,
      nama_provinsi: r.nama_provinsi,
      nama_kota: r.nama_kota,
      nama_kecamatan: r.nama_kecamatan,
      created_at: new Date(r.created_at),
      jumlah_user: Number(r.jumlah_user),
      jumlah_desa: Number(r.jumlah_desa)
    }))
  } catch (error) {
    console.error('Error getOffices:', error)
    return []
  }
}

export async function createOffice(
  nama_office: string, 
  alamat: string | null,
  provinsi_id?: number | null,
  kota_id?: number | null,
  kecamatan_id?: number | null
) {
  try {
    if (!nama_office.trim()) {
      return { success: false, error: 'Nama Office wajib diisi' }
    }
    
    await sql`
      INSERT INTO office (nama_office, alamat, provinsi_id, kota_id, kecamatan_id)
      VALUES (${nama_office}, ${alamat}, ${provinsi_id || null}, ${kota_id || null}, ${kecamatan_id || null})
    `
    
    revalidatePath('/dashboard/manajemen-tim')
    return { success: true }
  } catch (error: any) {
    console.error('Error createOffice:', error)
    return { success: false, error: error.message || 'Terjadi kesalahan sistem' }
  }
}

export async function updateOffice(
  id: number, 
  nama_office: string, 
  alamat: string | null,
  provinsi_id?: number | null,
  kota_id?: number | null,
  kecamatan_id?: number | null
) {
  try {
    if (!nama_office.trim()) {
      return { success: false, error: 'Nama Office wajib diisi' }
    }
    
    await sql`
      UPDATE office
      SET 
        nama_office = ${nama_office}, 
        alamat = ${alamat},
        provinsi_id = ${provinsi_id || null},
        kota_id = ${kota_id || null},
        kecamatan_id = ${kecamatan_id || null}
      WHERE id = ${id}
    `
    
    revalidatePath('/dashboard/manajemen-tim')
    return { success: true }
  } catch (error: any) {
    console.error('Error updateOffice:', error)
    return { success: false, error: error.message || 'Terjadi kesalahan sistem' }
  }
}

export async function deleteOffice(id: number) {
  try {
    await sql`DELETE FROM office WHERE id = ${id}`
    revalidatePath('/dashboard/manajemen-tim')
    return { success: true }
  } catch (error: any) {
    console.error('Error deleteOffice:', error)
    return { success: false, error: error.message || 'Gagal menghapus Office' }
  }
}

// ---------------------------------------------------------------------------
// Assign/Unassign Desa to Office
// ---------------------------------------------------------------------------

export async function getDesaByOffice(officeId: number) {
  try {
    const result = await sql`
      SELECT DISTINCT ON (dc.id)
        dc.id,
        dc.nama_desa,
        p.nama_provinsi,
        k.nama_kota,
        kec.nama_kecamatan,
        r.nama as nama_relawan,
        kor.nama as nama_korwil
      FROM desa_config dc
      JOIN provinsi p ON dc.provinsi_id = p.id
      JOIN kota_kabupaten k ON dc.kota_id = k.id
      JOIN kecamatan kec ON dc.kecamatan_id = kec.id
      LEFT JOIN desa_berdaya db ON db.desa_id = dc.id AND db.status_aktif = true
      LEFT JOIN relawan r ON db.relawan_id = r.id
      LEFT JOIN relawan kor ON r.korwil_id = kor.id
      WHERE dc.office_id = ${officeId}
      ORDER BY dc.id, p.nama_provinsi, k.nama_kota, dc.nama_desa
    `
    
    return (result as any[]).map(r => ({
      id: Number(r.id),
      nama_desa: r.nama_desa,
      nama_provinsi: r.nama_provinsi,
      nama_kota: r.nama_kota,
      nama_kecamatan: r.nama_kecamatan,
      nama_relawan: r.nama_relawan || '-',
      nama_korwil: r.nama_korwil || '-'
    }))
  } catch (error) {
    console.error('Error getDesaByOffice:', error)
    return []
  }
}

export async function getUnassignedDesa() {
  try {
    const result = await sql`
      SELECT DISTINCT ON (dc.id)
        dc.id,
        dc.nama_desa,
        p.nama_provinsi,
        k.nama_kota,
        kec.nama_kecamatan,
        r.nama as nama_relawan,
        kor.nama as nama_korwil
      FROM desa_config dc
      JOIN provinsi p ON dc.provinsi_id = p.id
      JOIN kota_kabupaten k ON dc.kota_id = k.id
      JOIN kecamatan kec ON dc.kecamatan_id = kec.id
      LEFT JOIN desa_berdaya db ON db.desa_id = dc.id AND db.status_aktif = true
      LEFT JOIN relawan r ON db.relawan_id = r.id
      LEFT JOIN relawan kor ON r.korwil_id = kor.id
      WHERE dc.office_id IS NULL
      ORDER BY dc.id, p.nama_provinsi, k.nama_kota, dc.nama_desa
    `
    
    return (result as any[]).map(r => ({
      id: Number(r.id),
      nama_desa: r.nama_desa,
      nama_provinsi: r.nama_provinsi,
      nama_kota: r.nama_kota,
      nama_kecamatan: r.nama_kecamatan,
      nama_relawan: r.nama_relawan || '-',
      nama_korwil: r.nama_korwil || '-'
    }))
  } catch (error) {
    console.error('Error getUnassignedDesa:', error)
    return []
  }
}

export async function assignDesaToOffice(officeId: number, desaIds: number[]) {
  try {
    if (!desaIds || desaIds.length === 0) return { success: true }
    
    // Gunakan transaksi atau loop sederhana
    for (const id of desaIds) {
      await sql`UPDATE desa_config SET office_id = ${officeId} WHERE id = ${id}`
    }
    
    revalidatePath('/dashboard/manajemen-tim')
    return { success: true }
  } catch (error: any) {
    console.error('Error assignDesaToOffice:', error)
    return { success: false, error: error.message || 'Gagal memasukkan Desa' }
  }
}

export async function unassignDesaFromOffice(desaId: number) {
  try {
    await sql`UPDATE desa_config SET office_id = NULL WHERE id = ${desaId}`
    revalidatePath('/dashboard/manajemen-tim')
    return { success: true }
  } catch (error: any) {
    console.error('Error unassignDesaFromOffice:', error)
    return { success: false, error: error.message || 'Gagal menghapus status Desa' }
  }
}
