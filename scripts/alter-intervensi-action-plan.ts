import 'dotenv/config'
import { sql } from '../lib/db'

async function run() {
  try {
    console.log('Menambahkan kolom action_plan_id ke tabel intervensi_program...');
    await sql`
      ALTER TABLE intervensi_program 
      ADD COLUMN IF NOT EXISTS action_plan_id BIGINT REFERENCES action_plans(id) ON DELETE SET NULL;
    `;
    console.log('✅ Berhasil menambahkan kolom action_plan_id.');
    process.exit(0)
  } catch (error) {
    console.error('❌ Gagal:', error)
    process.exit(1)
  }
}
run()
