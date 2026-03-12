import * as dotenv from 'dotenv';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

// Load environment variables (.env)
dotenv.config({ path: '.env.local' });
dotenv.config();

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL!;
const sql = postgres(connectionString);
const db = drizzle(sql);

async function runMigration() {
  console.log('🚀 Memulai migrasi kolom alamat terstruktur untuk Office...');

  try {
    await db.execute(`
      -- Tambah kolom relasi wilayah ke tabel office
      ALTER TABLE office ADD COLUMN IF NOT EXISTS provinsi_id BIGINT REFERENCES provinsi(id) ON DELETE SET NULL;
      ALTER TABLE office ADD COLUMN IF NOT EXISTS kota_id BIGINT REFERENCES kota_kabupaten(id) ON DELETE SET NULL;
      ALTER TABLE office ADD COLUMN IF NOT EXISTS kecamatan_id BIGINT REFERENCES kecamatan(id) ON DELETE SET NULL;
      
      -- Ubah alamat menjadi detail_alamat jika ingin lebih spesifik, 
      -- tapi kita biarkan dulu kolom alamat yang lama sebagai 'Detail Alamat' di UI.
    `);
    console.log('✅ Kolom provinsi_id, kota_id, dan kecamatan_id berhasil ditambahkan ke tabel office.');

    console.log('🎉 Migrasi alamat Office berhasil diselesaikan!');
  } catch (error) {
    console.error('❌ Gagal melakukan migrasi:', error);
  } finally {
    await sql.end();
  }
}

runMigration();
