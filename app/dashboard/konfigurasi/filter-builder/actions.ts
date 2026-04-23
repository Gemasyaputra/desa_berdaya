'use server'

import { sql } from '@/lib/db'
import { revalidatePath } from 'next/cache'

export async function getDatabaseSchema() {
  try {
    const result = await sql`
      SELECT table_name, column_name 
      FROM information_schema.columns 
      WHERE table_schema = 'public'
      ORDER BY table_name, column_name
    `
    // Group by table
    const schema: Record<string, string[]> = {}
    const rows = Array.isArray(result) ? result : (result ? [result] : [])
    rows.forEach((row: any) => {
      if (!schema[row.table_name]) schema[row.table_name] = []
      schema[row.table_name].push(row.column_name)
    })
    return { success: true, data: schema }
  } catch (error: any) {
    console.error(error)
    return { success: false, data: {} }
  }
}

export async function getAllFilterConfigs() {
  try {
    const filters = await sql`
      SELECT * FROM app_filters 
      ORDER BY page_key ASC, sort_order ASC
    `
    return { success: true, data: Array.isArray(filters) ? filters : (filters ? [filters] : []) }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function getFiltersByPage(pageKey: string) {
  try {
    const filters = await sql`
      SELECT * FROM app_filters 
      WHERE page_key = ${pageKey} AND is_active = true 
      ORDER BY sort_order ASC
    `
    const data = Array.isArray(filters) ? filters : (filters ? [filters] : [])
    return { success: true, data }
  } catch (error: any) {
    console.error(error)
    return { success: false, data: [] }
  }
}

export async function saveFilterConfig(data: any) {
  try {
    const optionsStr = data.options ? JSON.stringify(data.options) : null

    if (data.id) {
      await sql`
        UPDATE app_filters 
        SET page_key = ${data.page_key}, 
            filter_key = ${data.filter_key}, 
            label = ${data.label}, 
            filter_type = ${data.filter_type}, 
            options = ${optionsStr}::jsonb, 
            column_name = ${data.column_name || null}, 
            sort_order = ${data.sort_order || 0}, 
            is_active = ${data.is_active ?? true}
        WHERE id = ${data.id}
      `
    } else {
      await sql`
        INSERT INTO app_filters (page_key, filter_key, label, filter_type, options, column_name, sort_order, is_active)
        VALUES (${data.page_key}, ${data.filter_key}, ${data.label}, ${data.filter_type}, ${optionsStr}::jsonb, ${data.column_name || null}, ${data.sort_order || 0}, ${data.is_active ?? true})
      `
    }
    
    revalidatePath('/dashboard/konfigurasi/filter-builder')
    revalidatePath(`/dashboard/${data.page_key.replace('_', '-')}`) // simple heuristic
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

export async function deleteFilterConfig(id: number) {
  try {
    await sql`DELETE FROM app_filters WHERE id = ${id}`
    revalidatePath('/dashboard/konfigurasi/filter-builder')
    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}
