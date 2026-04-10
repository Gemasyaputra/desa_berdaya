import postgres from 'postgres';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

const sql = postgres(process.env.DATABASE_URL || process.env.POSTGRES_URL);

async function run() {
  try {
    await sql`
      ALTER TABLE intervensi_anggaran
      ADD COLUMN IF NOT EXISTS bukti_pengembalian_url TEXT,
      ADD COLUMN IF NOT EXISTS status_pengembalian VARCHAR(50) DEFAULT 'BELUM',
      ADD COLUMN IF NOT EXISTS catatan_pengembalian TEXT,
      ADD COLUMN IF NOT EXISTS tgl_upload_pengembalian TIMESTAMP;
    `;
    console.log('Migrasi Pengembalian Dana sukses');
  } catch(e) {
    console.error(e);
  } finally {
    await sql.end();
  }
}
run();
