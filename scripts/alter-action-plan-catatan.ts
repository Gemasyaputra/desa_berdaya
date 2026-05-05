import { sql } from '../lib/db'

async function run() {
  try {
    console.log('Menambahkan kolom catatan_revisi pada tabel action_plans...')
    await sql`
      ALTER TABLE action_plans
      ADD COLUMN IF NOT EXISTS catatan_revisi TEXT;
    `
    console.log('Kolom catatan_revisi berhasil ditambahkan!')
    process.exit(0)
  } catch (error) {
    console.error('Error saat menambah kolom:', error)
    process.exit(1)
  }
}
run()
