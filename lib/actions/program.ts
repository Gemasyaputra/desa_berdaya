'use server'

import { sql } from '@/lib/db'
import { cache } from 'react'
import { revalidatePath } from 'next/cache'

// ====== KATEGORI PROGRAM ======

export const getKategoriPrograms = cache(async () => {
  try {
    const rawData = await sql`
      SELECT *
      FROM kategori_program
      ORDER BY nama_kategori ASC
    `
    return Array.isArray(rawData) ? rawData : []
  } catch (error) {
    console.error('Error fetching kategori_program:', error)
    return []
  }
})

export async function createKategoriProgram(nama_kategori: string) {
  try {
    await sql`
      INSERT INTO kategori_program (nama_kategori)
      VALUES (${nama_kategori})
    `
    revalidatePath('/dashboard/master-program')
    return { success: true }
  } catch (error) {
    console.error('Error creating kategori_program:', error)
    return { success: false, error: 'Gagal membuat kategori program' }
  }
}

export async function updateKategoriProgram(id: number, nama_kategori: string) {
  try {
    await sql`
      UPDATE kategori_program
      SET nama_kategori = ${nama_kategori}
      WHERE id = ${id}
    `
    revalidatePath('/dashboard/master-program')
    return { success: true }
  } catch (error) {
    console.error('Error updating kategori_program:', error)
    return { success: false, error: 'Gagal mengupdate kategori program' }
  }
}

export async function deleteKategoriProgram(id: number) {
  try {
    await sql`
      DELETE FROM kategori_program
      WHERE id = ${id}
    `
    revalidatePath('/dashboard/master-program')
    return { success: true }
  } catch (error) {
    console.error('Error deleting kategori_program:', error)
    return { success: false, error: 'Gagal menghapus kategori program' }
  }
}

// ====== PROGRAM ======

export const getPrograms = cache(async () => {
  try {
    const rawData = await sql`
      SELECT p.*, k.nama_kategori, fc.name as form_category_name
      FROM program p
      JOIN kategori_program k ON p.kategori_id = k.id
      LEFT JOIN form_categories fc ON p.form_category_id = fc.id
      ORDER BY k.nama_kategori ASC, p.nama_program ASC
    `
    return Array.isArray(rawData) ? rawData : []
  } catch (error) {
    console.error('Error fetching program:', error)
    return []
  }
})

export async function createProgram(kategori_id: number, nama_program: string, data?: { form_category_id?: number }) {
  try {
    await sql`
      INSERT INTO program (kategori_id, nama_program, form_category_id)
      VALUES (${kategori_id}, ${nama_program}, ${data?.form_category_id || null})
    `
    revalidatePath('/dashboard/master-program')
    return { success: true }
  } catch (error) {
    console.error('Error creating program:', error)
    return { success: false, error: 'Gagal membuat program' }
  }
}

export async function updateProgram(id: number, kategori_id: number, nama_program: string, data?: { form_category_id?: number }) {
  try {
    await sql`
      UPDATE program
      SET 
        kategori_id = ${kategori_id}, 
        nama_program = ${nama_program},
        form_category_id = ${data?.form_category_id || null}
      WHERE id = ${id}
    `
    revalidatePath('/dashboard/master-program')
    return { success: true }
  } catch (error) {
    console.error('Error updating program:', error)
    return { success: false, error: 'Gagal mengupdate program' }
  }
}

export async function deleteProgram(id: number) {
  try {
    await sql`
      DELETE FROM program
      WHERE id = ${id}
    `
    revalidatePath('/dashboard/master-program')
    return { success: true }
  } catch (error) {
    console.error('Error deleting program:', error)
    return { success: false, error: 'Gagal menghapus program' }
  }
}
