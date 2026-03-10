import * as dotenv from 'dotenv';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

dotenv.config({ path: '.env.local' });
dotenv.config();

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL!;
const sql = postgres(connectionString);
const db = drizzle(sql);

async function runMigration() {
  console.log('⏳ Memulai proses migrasi penambahan program_id di master_kelompok...');

  try {
    // Tambah kolom program_id ke tabel master_kelompok jika belum ada
    await db.execute(`
      ALTER TABLE master_kelompok
      ADD COLUMN IF NOT EXISTS program_id BIGINT REFERENCES program(id) ON DELETE CASCADE;
    `);

    console.log('✅ Migrasi penambahan program_id berhasil diselesaikan!');
  } catch (error) {
    console.error('❌ Gagal melakukan migrasi:', error);
  } finally {
    await sql.end();
  }
}

runMigration();
