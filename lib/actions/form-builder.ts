'use server'

import { sql } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import {
  formCategoryWithFieldsSchema,
  type FormCategoryWithFieldsInput,
} from '@/lib/validations/form-builder'

async function ensureAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user || (session.user as any).role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }
  return session
}

async function ensureAuthenticated() {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    throw new Error('Unauthorized')
  }
  return session
}

const REVALIDATE_PATH = '/dashboard/konfigurasi/form-builder'

export async function createFormCategory(data: FormCategoryWithFieldsInput) {
  await ensureAdmin()

  const parsed = formCategoryWithFieldsSchema.parse(data)

  try {
    await sql`BEGIN`

    const categoryResult = await sql`
      INSERT INTO form_categories (name, description)
      VALUES (${parsed.name}, ${parsed.description ?? null})
      RETURNING id
    `

    const categoryRow = Array.isArray(categoryResult)
      ? (categoryResult[0] as any)
      : (categoryResult as any)
    const categoryId = Number(categoryRow.id)

    for (let index = 0; index < parsed.fields.length; index++) {
      const field = parsed.fields[index]
      await sql`
        INSERT INTO category_custom_fields (
          category_id,
          field_name,
          field_label,
          field_type,
          field_options,
          is_required,
          order_index
        )
        VALUES (
          ${categoryId},
          ${field.field_name},
          ${field.field_label},
          ${field.field_type},
          ${field.field_options || []},
          ${field.is_required ?? false},
          ${field.order_index ?? index}
        )
      `
    }

    await sql`COMMIT`

    // Automatic Linking logic
    if (parsed.description) {
      await sql`
        UPDATE program 
        SET form_category_id = ${categoryId}
        WHERE nama_program = ${parsed.description}
      `
    }

    revalidatePath(REVALIDATE_PATH)
    revalidatePath('/dashboard/master-program')
    return { success: true, id: categoryId }
  } catch (error) {
    console.error('Error createFormCategory:', error)
    try {
      await sql`ROLLBACK`
    } catch {
      // ignore rollback error
    }
    return { success: false, error: 'Gagal membuat kategori form' }
  }
}

export async function getFormCategories() {
  await ensureAuthenticated()

  try {
    const rows = await sql`
      SELECT
        fc.id,
        fc.name,
        fc.description,
        fc.created_at,
        fc.updated_at,
        COUNT(ccf.id)::int AS fields_count
      FROM form_categories fc
      LEFT JOIN category_custom_fields ccf
        ON ccf.category_id = fc.id
      GROUP BY fc.id
      ORDER BY fc.name ASC
    `

    return Array.isArray(rows) ? (rows as any[]) : [(rows as any)]
  } catch (error) {
    console.error('Error getFormCategories:', error)
    return []
  }
}

export async function getFormCategoryById(id: number) {
  await ensureAuthenticated()

  const categoryId = Number(id)
  if (Number.isNaN(categoryId)) {
    throw new Error('Invalid id')
  }

  try {
    const categoryRows = await sql`
      SELECT id, name, description, created_at, updated_at
      FROM form_categories
      WHERE id = ${categoryId}
      LIMIT 1
    `
    const category = Array.isArray(categoryRows)
      ? (categoryRows[0] as any)
      : (categoryRows as any)

    if (!category) {
      return null
    }

    const fieldRows = await sql`
      SELECT
        id,
        category_id,
        field_name,
        field_label,
        field_type,
        field_options,
        is_required,
        order_index
      FROM category_custom_fields
      WHERE category_id = ${categoryId}
      ORDER BY order_index ASC, id ASC
    `

    const fields = Array.isArray(fieldRows) ? (fieldRows as any[]) : [(fieldRows as any)]

    return { category, fields }
  } catch (error) {
    console.error('Error getFormCategoryById:', error)
    throw new Error('Gagal mengambil data kategori form')
  }
}

export async function updateFormCategory(
  id: number,
  data: FormCategoryWithFieldsInput,
) {
  await ensureAdmin()

  const categoryId = Number(id)
  if (Number.isNaN(categoryId)) {
    throw new Error('Invalid id')
  }

  const parsed = formCategoryWithFieldsSchema.parse(data)

  try {
    await sql`BEGIN`

    await sql`
      UPDATE form_categories
      SET
        name = ${parsed.name},
        description = ${parsed.description ?? null},
        updated_at = NOW()
      WHERE id = ${categoryId}
    `

    await sql`
      DELETE FROM category_custom_fields
      WHERE category_id = ${categoryId}
    `

    for (let index = 0; index < parsed.fields.length; index++) {
      const field = parsed.fields[index]
      await sql`
        INSERT INTO category_custom_fields (
          category_id,
          field_name,
          field_label,
          field_type,
          field_options,
          is_required,
          order_index
        )
        VALUES (
          ${categoryId},
          ${field.field_name},
          ${field.field_label},
          ${field.field_type},
          ${field.field_options || []},
          ${field.is_required ?? false},
          ${field.order_index ?? index}
        )
      `
    }

    await sql`COMMIT`

    // Automatic Linking logic
    if (parsed.description) {
      await sql`
        UPDATE program 
        SET form_category_id = ${categoryId}
        WHERE nama_program = ${parsed.description}
      `
    }

    revalidatePath(REVALIDATE_PATH)
    revalidatePath('/dashboard/master-program')
    return { success: true }
  } catch (error) {
    console.error('Error updateFormCategory:', error)
    try {
      await sql`ROLLBACK`
    } catch {
      // ignore rollback error
    }
    return { success: false, error: 'Gagal mengupdate kategori form' }
  }
}

export async function deleteFormCategory(id: number) {
  await ensureAdmin()

  const categoryId = Number(id)
  if (Number.isNaN(categoryId)) {
    throw new Error('Invalid id')
  }

  try {
    await sql`BEGIN`

    // 1. Nullify references in program table
    await sql`
      UPDATE program 
      SET form_category_id = NULL 
      WHERE form_category_id = ${categoryId}
    `

    // 2. Nullify references in laporan_kegiatan table
    await sql`
      UPDATE laporan_kegiatan 
      SET form_category_id = NULL 
      WHERE form_category_id = ${categoryId}
    `

    // 3. Delete associated custom fields
    await sql`
      DELETE FROM category_custom_fields
      WHERE category_id = ${categoryId}
    `

    // 4. Finally delete the category itself
    await sql`
      DELETE FROM form_categories
      WHERE id = ${categoryId}
    `

    await sql`COMMIT`
    
    revalidatePath(REVALIDATE_PATH)
    revalidatePath('/dashboard/master-program')
    return { success: true }
  } catch (error) {
    console.error('Error deleteFormCategory:', error)
    try {
      await sql`ROLLBACK`
    } catch {
      // ignore
    }
    return { success: false, error: 'Gagal menghapus kategori form' }
  }
}

