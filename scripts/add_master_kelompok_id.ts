import * as dotenv from 'dotenv';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

// Load environment variables (.env)
dotenv.config({ path: '.env.local' });
dotenv.config();

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL!;
const sql = postgres(connectionString);
const db = drizzle(sql);

async function addMasterKelompokId() {
  console.log('🚀 Memulai migrasi: menambahkan master_kelompok_id ke tabel kelompok...');

  try {
    // 1. Tambahkan kolom master_kelompok_id jika belum ada
    await db.execute(`
      ALTER TABLE kelompok
      ADD COLUMN IF NOT EXISTS master_kelompok_id BIGINT REFERENCES master_kelompok(id) ON DELETE SET NULL;
    `);

    console.log('✅ Kolom master_kelompok_id berhasil ditambahkan!');
  } catch (error) {
    console.error('❌ Terjadi kesalahan saat migrasi:', error);
  } finally {
    await sql.end();
  }
}

addMasterKelompokId();
