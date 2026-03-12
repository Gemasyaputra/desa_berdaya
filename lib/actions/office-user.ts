'use server'

import { sql } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import bcrypt from 'bcryptjs'

// Define Types
export type OfficeUserType = {
  id: number
  user_id: number
  office_id: number | null
  nama: string
  hp: string | null
  jabatan: string
  email: string
  nama_office: string | null
}

export async function getOfficeUsers(searchQuery = ''): Promise<OfficeUserType[]> {
  try {
    let result
    if (searchQuery) {
      const q = `%${searchQuery}%`
      result = await sql`
        SELECT 
          ou.id,
          ou.user_id,
          ou.office_id,
          ou.nama,
          ou.hp,
          ou.jabatan,
          u.email,
          o.nama_office
        FROM office_user ou
        JOIN users u ON ou.user_id = u.id
        LEFT JOIN office o ON ou.office_id = o.id
        WHERE ou.nama ILIKE ${q} OR u.email ILIKE ${q}
        ORDER BY ou.nama ASC
      `
    } else {
      result = await sql`
        SELECT 
          ou.id,
          ou.user_id,
          ou.office_id,
          ou.nama,
          ou.hp,
          ou.jabatan,
          u.email,
          o.nama_office
        FROM office_user ou
        JOIN users u ON ou.user_id = u.id
        LEFT JOIN office o ON ou.office_id = o.id
        ORDER BY ou.nama ASC
      `
    }
    
    return (result as any[]).map(r => ({
      id: Number(r.id),
      user_id: Number(r.user_id),
      office_id: r.office_id ? Number(r.office_id) : null,
      nama: r.nama,
      hp: r.hp,
      jabatan: r.jabatan,
      email: r.email,
      nama_office: r.nama_office
    }))
  } catch (error) {
    console.error('Error getOfficeUsers:', error)
    return []
  }
}

export async function createOfficeUser(data: {
  nama: string
  email: string
  password?: string
  hp: string | null
  jabatan: string
  office_id: number | null
}) {
  try {
    if (!data.nama.trim() || !data.email.trim() || !data.jabatan.trim()) {
      return { success: false, error: 'Nama, Email, dan Jabatan wajib diisi' }
    }

    // 1. Cek email apakah sudah ada
    const existing = await sql`SELECT id FROM users WHERE email = ${data.email}`
    if ((existing as any[]).length > 0) {
      return { success: false, error: 'Email sudah terdaftar. Gunakan email lain.' }
    }

    // Hash password
    const pwd = data.password ? data.password : 'password123'
    const hashed = await bcrypt.hash(pwd, 10)

    // Map Jabatan to Role
    const role = data.jabatan === 'Program Head' ? 'PROG_HEAD' : 'FINANCE'

    // BEGIN TRANSAKSI (bisa disimulasikan berurutan karena ini server action cepat)
    // Walaupun raw pg, kita asumsikan safety
    const insertUserRes = await sql`
      INSERT INTO users (email, password_encrypted, role)
      VALUES (${data.email}, ${hashed}, ${role})
      RETURNING id
    `
    const userId = (insertUserRes as any[])[0].id

    // Insert ke office_user
    await sql`
      INSERT INTO office_user (user_id, office_id, nama, hp, jabatan)
      VALUES (${userId}, ${data.office_id}, ${data.nama}, ${data.hp}, ${data.jabatan})
    `

    revalidatePath('/dashboard/manajemen-tim')
    return { success: true }
  } catch (error: any) {
    console.error('Error createOfficeUser:', error)
    return { success: false, error: error.message || 'Terjadi kesalahan sistem' }
  }
}

export async function updateOfficeUser(id: number, userId: number, data: {
  nama: string
  email: string
  password?: string | null
  hp: string | null
  jabatan: string
  office_id: number | null
}) {
  try {
    if (!data.nama.trim() || !data.email.trim() || !data.jabatan.trim()) {
      return { success: false, error: 'Nama, Email, dan Jabatan wajib diisi' }
    }

    // Map Jabatan to Role
    const role = data.jabatan === 'Program Head' ? 'PROG_HEAD' : 'FINANCE'

    // 1. Update User Email (cek collision dlu)
    const existing = await sql`SELECT id FROM users WHERE email = ${data.email} AND id != ${userId}`
    if ((existing as any[]).length > 0) {
      return { success: false, error: 'Email sudah dipakai pengguna lain.' }
    }

    if (data.password && data.password.trim() !== '') {
      const hashed = await bcrypt.hash(data.password, 10)
      await sql`
        UPDATE users
        SET email = ${data.email}, password_encrypted = ${hashed}, role = ${role}
        WHERE id = ${userId}
      `
    } else {
      await sql`
        UPDATE users
        SET email = ${data.email}, role = ${role}
        WHERE id = ${userId}
      `
    }

    // 2. Update office_user flag
    await sql`
      UPDATE office_user
      SET nama = ${data.nama}, hp = ${data.hp}, jabatan = ${data.jabatan}, office_id = ${data.office_id}
      WHERE id = ${id}
    `

    revalidatePath('/dashboard/manajemen-tim')
    return { success: true }
  } catch (error: any) {
    console.error('Error updateOfficeUser:', error)
    return { success: false, error: error.message || 'Terjadi kesalahan sistem' }
  }
}

export async function deleteOfficeUser(userId: number) {
  try {
    // Dengan asumsi ON DELETE CASCADE, menghapus user akan ikut menghapus office_user
    await sql`DELETE FROM users WHERE id = ${userId}`
    revalidatePath('/dashboard/manajemen-tim')
    return { success: true }
  } catch (error: any) {
    console.error('Error deleteOfficeUser:', error)
    return { success: false, error: error.message || 'Gagal menghapus user' }
  }
}
