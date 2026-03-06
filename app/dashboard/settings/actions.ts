'use server'

import { sql } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function getSettingsAdminList() {
  const session = await getServerSession(authOptions)
  
  // Hanya ADMIN yang boleh melihat dan meng-edit System App Settings
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized. Hanya Admin yang memiliki izin.')
  }

  const result = await sql`
    SELECT key, value, updated_at 
    FROM app_settings 
    ORDER BY key ASC
  `
  return result as { key: string; value: string; updated_at: Date }[]
}

export async function updateSettingAdmin(key: string, value: string) {
  const session = await getServerSession(authOptions)
  
  if (!session?.user || session.user.role !== 'ADMIN') {
    throw new Error('Unauthorized')
  }

  // UPSERT
  await sql`
    INSERT INTO app_settings (key, value)
    VALUES (${key}, ${value})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()
  `
  return { success: true }
}
