import 'dotenv/config'
import { sql } from '../lib/db'

async function run() {
  try {
    console.log('Membuat tabel laporan_keuangan_logs...');
    await sql`
      CREATE TABLE IF NOT EXISTS laporan_keuangan_logs (
          id SERIAL PRIMARY KEY,
          anggaran_id BIGINT REFERENCES intervensi_anggaran(id) ON DELETE CASCADE,
          action_type VARCHAR(50) NOT NULL, 
          actor_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
          actor_name VARCHAR(255),
          actor_role VARCHAR(50),
          notes TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;
    console.log('✅ Berhasil membuat tabel laporan_keuangan_logs.');
    process.exit(0)
  } catch (error) {
    console.error('❌ Gagal:', error)
    process.exit(1)
  }
}
run()
