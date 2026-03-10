import * as dotenv from 'dotenv';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

dotenv.config({ path: '.env.local' });
dotenv.config();

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL!;
const sql = postgres(connectionString);
const db = drizzle(sql);

async function runMigration() {
  console.log('⏳ Memulai proses migrasi fitur Kelompok & Program...');

  try {
    await db.execute(`
      -- 1. Buat tabel kategori_program
      CREATE TABLE IF NOT EXISTS kategori_program (
          id BIGSERIAL PRIMARY KEY,
          nama_kategori VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 2. Buat tabel program
      CREATE TABLE IF NOT EXISTS program (
          id BIGSERIAL PRIMARY KEY,
          kategori_id BIGINT NOT NULL REFERENCES kategori_program(id) ON DELETE CASCADE,
          nama_program VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 3. Buat tabel kelompok
      CREATE TABLE IF NOT EXISTS kelompok (
          id BIGSERIAL PRIMARY KEY,
          desa_berdaya_id BIGINT NOT NULL REFERENCES desa_berdaya(id) ON DELETE CASCADE,
          nama_kelompok VARCHAR(255) NOT NULL,
          nama_pembina VARCHAR(255) NOT NULL,
          tahun INT NOT NULL,
          relawan_id BIGINT REFERENCES relawan(id) ON DELETE SET NULL,
          program_id BIGINT REFERENCES program(id) ON DELETE CASCADE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 4. Buat tabel kelompok_anggota (Relasi many-to-many antara kelompok dan penerima manfaat)
      CREATE TABLE IF NOT EXISTS kelompok_anggota (
          kelompok_id BIGINT NOT NULL REFERENCES kelompok(id) ON DELETE CASCADE,
          penerima_manfaat_id BIGINT NOT NULL REFERENCES penerima_manfaat(id) ON DELETE CASCADE,
          PRIMARY KEY (kelompok_id, penerima_manfaat_id),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Migrasi fitur Kelompok & Program berhasil diselesaikan!');
  } catch (error) {
    console.error('❌ Gagal melakukan migrasi:', error);
  } finally {
    await sql.end();
  }
}

runMigration();
