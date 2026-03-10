'use server'

import { sql } from '@/lib/db'
import { cache } from 'react'
import { revalidatePath } from 'next/cache'

export const getKelompokByDesaId = cache(async (desa_berdaya_id: number) => {
  try {
    const rawKelompok = await sql`
      SELECT k.*, 
             p.nama_program,
             kp.nama_kategori,
             r.nama as nama_relawan,
             mk.nama_kelompok as nama_kategori_kelompok
      FROM kelompok k
      LEFT JOIN master_kelompok mk ON k.master_kelompok_id = mk.id
      LEFT JOIN program p ON k.program_id = p.id
      LEFT JOIN kategori_program kp ON p.kategori_id = kp.id
      LEFT JOIN relawan r ON k.relawan_id = r.id
      WHERE k.desa_berdaya_id = ${desa_berdaya_id}
      ORDER BY k.created_at DESC
    `
    
    const kelompokList = Array.isArray(rawKelompok) ? rawKelompok : []
    
    // Fetch anggota PM for each kelompok
    for (const k of kelompokList) {
      const kelompokId = (k as any).id
      const rawAnggota = await sql`
        SELECT pm.id, pm.nama as nama_pm, pm.nik
        FROM kelompok_anggota ka
        JOIN penerima_manfaat pm ON ka.penerima_manfaat_id = pm.id
        WHERE ka.kelompok_id = ${kelompokId}
      `
      ;(k as any).anggota = Array.isArray(rawAnggota) ? rawAnggota : []
    }
    
    return kelompokList
  } catch (error) {
    console.error('Error fetching kelompok:', error)
    return []
  }
})

export const getAllKelompok = cache(async (relawanId?: number) => {
  try {
    let rawKelompok;
    if (relawanId) {
       rawKelompok = await sql`
        SELECT k.*, 
               p.nama_program,
               kp.nama_kategori,
               r.nama as nama_relawan,
               dc.nama_desa,
               mk.nama_kelompok as nama_kategori_kelompok
        FROM kelompok k
        JOIN desa_berdaya db ON k.desa_berdaya_id = db.id
        JOIN desa_config dc ON db.desa_id = dc.id
        LEFT JOIN master_kelompok mk ON k.master_kelompok_id = mk.id
        LEFT JOIN program p ON k.program_id = p.id
        LEFT JOIN kategori_program kp ON p.kategori_id = kp.id
        LEFT JOIN relawan r ON k.relawan_id = r.id
        WHERE k.relawan_id = ${relawanId}
        ORDER BY k.created_at DESC
      `
    } else {
       rawKelompok = await sql`
        SELECT k.*, 
               p.nama_program,
               kp.nama_kategori,
               r.nama as nama_relawan,
               dc.nama_desa,
               mk.nama_kelompok as nama_kategori_kelompok
        FROM kelompok k
        JOIN desa_berdaya db ON k.desa_berdaya_id = db.id
        JOIN desa_config dc ON db.desa_id = dc.id
        LEFT JOIN master_kelompok mk ON k.master_kelompok_id = mk.id
        LEFT JOIN program p ON k.program_id = p.id
        LEFT JOIN kategori_program kp ON p.kategori_id = kp.id
        LEFT JOIN relawan r ON k.relawan_id = r.id
        ORDER BY k.created_at DESC
      `
    }
    
    const kelompokList = Array.isArray(rawKelompok) ? rawKelompok : []
    
    // Fetch anggota PM for each kelompok
    for (const k of kelompokList) {
      const kelompokId = (k as any).id
      const rawAnggota = await sql`
        SELECT pm.id, pm.nama as nama_pm, pm.nik
        FROM kelompok_anggota ka
        JOIN penerima_manfaat pm ON ka.penerima_manfaat_id = pm.id
        WHERE ka.kelompok_id = ${kelompokId}
      `
      ;(k as any).anggota = Array.isArray(rawAnggota) ? rawAnggota : []
    }
    
    return kelompokList
  } catch (error) {
    console.error('Error fetching all kelompok:', error)
    return []
  }
})

export async function createKelompok(
  desa_berdaya_id: number,
  nama_kelompok: string,
  nama_pembina: string,
  tahun: number,
  provided_relawan_id: number,
  program_id: number,
  master_kelompok_id: number | null,
  penerima_manfaat_ids: number[]
) {
  try {
    // Determine the actual relawan_id based on desa_berdaya_id if we passed a dummy 0 value 
    let final_relawan_id = provided_relawan_id
    if (!final_relawan_id || final_relawan_id === 0) {
      const desaRaw = await sql`SELECT relawan_id FROM desa_berdaya WHERE id = ${desa_berdaya_id}`
      const foundRelawan = Array.isArray(desaRaw) ? (desaRaw[0] as any)?.relawan_id : null
      if (foundRelawan) final_relawan_id = Number(foundRelawan)
    }

    // 1. Insert Kelompok
    const insertedKelompokRaw = await sql`
      INSERT INTO kelompok (desa_berdaya_id, nama_kelompok, nama_pembina, tahun, relawan_id, program_id, master_kelompok_id)
      VALUES (${desa_berdaya_id}, ${nama_kelompok}, ${nama_pembina}, ${tahun}, ${final_relawan_id}, ${program_id}, ${master_kelompok_id})
      RETURNING id
    `
    
    const kelompokId = Array.isArray(insertedKelompokRaw) ? (insertedKelompokRaw[0] as any)?.id : null
    
    if (!kelompokId) {
       throw new Error("Gagal mendapatkan ID kelompok yang baru dibuat")
    }

    // 2. Insert Anggota
    if (penerima_manfaat_ids && penerima_manfaat_ids.length > 0) {
      for (const pm_id of penerima_manfaat_ids) {
        await sql`
          INSERT INTO kelompok_anggota (kelompok_id, penerima_manfaat_id)
          VALUES (${kelompokId}, ${pm_id})
        `
      }
    }

    revalidatePath(`/dashboard/desa/${desa_berdaya_id}`)
    revalidatePath(`/dashboard/master-program`)
    return { success: true }
  } catch (error) {
    console.error('Error creating kelompok:', error)
    return { success: false, error: 'Gagal membuat kelompok' }
  }
}

export async function updateKelompok(
  id: number,
  desa_berdaya_id: number,
  nama_kelompok: string,
  nama_pembina: string,
  tahun: number,
  program_id: number,
  master_kelompok_id: number | null,
  penerima_manfaat_ids: number[]
) {
  try {
    // 1. Update Kelompok
    await sql`
      UPDATE kelompok
      SET nama_kelompok = ${nama_kelompok},
          nama_pembina = ${nama_pembina},
          tahun = ${tahun},
          program_id = ${program_id},
          master_kelompok_id = ${master_kelompok_id}
      WHERE id = ${id}
    `

    // 2. Hapus semua anggota lama
    await sql`
      DELETE FROM kelompok_anggota
      WHERE kelompok_id = ${id}
    `

    // 3. Insert anggota baru
    if (penerima_manfaat_ids && penerima_manfaat_ids.length > 0) {
      for (const pm_id of penerima_manfaat_ids) {
        await sql`
          INSERT INTO kelompok_anggota (kelompok_id, penerima_manfaat_id)
          VALUES (${id}, ${pm_id})
        `
      }
    }

    revalidatePath(`/dashboard/desa/${desa_berdaya_id}`)
    revalidatePath(`/dashboard/master-program`)
    return { success: true }
  } catch (error) {
    console.error('Error updating kelompok:', error)
    return { success: false, error: 'Gagal mengupdate kelompok' }
  }
}

export async function deleteKelompok(id: number, desa_berdaya_id: number) {
  try {
    await sql`
      DELETE FROM kelompok
      WHERE id = ${id}
    `
    revalidatePath(`/dashboard/desa/${desa_berdaya_id}`)
    revalidatePath(`/dashboard/master-program`)
    return { success: true }
  } catch (error) {
    console.error('Error deleting kelompok:', error)
    return { success: false, error: 'Gagal menghapus kelompok' }
  }
}

// ====== MASTER KELOMPOK ======

export const getMasterKelompok = cache(async () => {
  try {
    const rawData = await sql`
      SELECT mk.*, p.nama_program
      FROM master_kelompok mk
      LEFT JOIN program p ON mk.program_id = p.id
      ORDER BY mk.nama_kelompok ASC
    `
    return Array.isArray(rawData) ? rawData : []
  } catch (error) {
    console.error('Error fetching master_kelompok:', error)
    return []
  }
})

export async function createMasterKelompok(nama_kelompok: string, program_id?: number) {
  try {
    await sql`
      INSERT INTO master_kelompok (nama_kelompok, program_id)
      VALUES (${nama_kelompok}, ${program_id || null})
    `
    revalidatePath('/dashboard/master-program')
    revalidatePath('/dashboard/kelompok')
    return { success: true }
  } catch (error) {
    console.error('Error creating master_kelompok:', error)
    return { success: false, error: 'Gagal membuat master kelompok' }
  }
}

export async function updateMasterKelompok(id: number, nama_kelompok: string, program_id?: number) {
  try {
    await sql`
      UPDATE master_kelompok
      SET nama_kelompok = ${nama_kelompok},
          program_id = ${program_id || null}
      WHERE id = ${id}
    `
    revalidatePath('/dashboard/master-program')
    revalidatePath('/dashboard/kelompok')
    return { success: true }
  } catch (error) {
    console.error('Error updating master_kelompok:', error)
    return { success: false, error: 'Gagal mengupdate master kelompok' }
  }
}

export async function deleteMasterKelompok(id: number) {
  try {
    await sql`
      DELETE FROM master_kelompok
      WHERE id = ${id}
    `
    revalidatePath('/dashboard/master-program')
    revalidatePath('/dashboard/kelompok')
    return { success: true }
  } catch (error) {
    console.error('Error deleting master_kelompok:', error)
    return { success: false, error: 'Gagal menghapus master kelompok' }
  }
}

export const getKelompokByPmId = cache(async (pm_id: number) => {
  try {
    const rawData = await sql`
      SELECT k.*, 
             p.nama_program,
             kp.nama_kategori,
             r.nama as nama_relawan,
             dc.nama_desa,
             mk.nama_kelompok as nama_kategori_kelompok
      FROM kelompok_anggota ka
      JOIN kelompok k ON ka.kelompok_id = k.id
      JOIN desa_berdaya db ON k.desa_berdaya_id = db.id
      JOIN desa_config dc ON db.desa_id = dc.id
      LEFT JOIN master_kelompok mk ON k.master_kelompok_id = mk.id
      LEFT JOIN program p ON k.program_id = p.id
      LEFT JOIN kategori_program kp ON p.kategori_id = kp.id
      LEFT JOIN relawan r ON k.relawan_id = r.id
      WHERE ka.penerima_manfaat_id = ${pm_id}
      ORDER BY k.created_at DESC
    `
    return Array.isArray(rawData) ? rawData : []
  } catch (error) {
    console.error('Error fetching kelompok by PM:', error)
    return []
  }
})
