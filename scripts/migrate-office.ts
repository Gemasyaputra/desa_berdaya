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
  console.log('🚀 Memulai migrasi untuk Office & Office User...');

  try {
    await db.execute(`
      -- 1. Tambah Role OFFICE ke enum user_role
      ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'OFFICE';
    `);
    console.log('✅ Role OFFICE ditambahkan ke ENUM (jika belum ada)');

    await db.execute(`
      -- 2. Buat tabel office
      CREATE TABLE IF NOT EXISTS office (
          id BIGSERIAL PRIMARY KEY,
          nama_office VARCHAR(255) NOT NULL,
          alamat TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Tabel office berhasil dibuat/diverifikasi');

    await db.execute(`
      -- 3. Buat tabel office_user
      CREATE TABLE IF NOT EXISTS office_user (
          id BIGSERIAL PRIMARY KEY,
          user_id BIGINT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
          office_id BIGINT REFERENCES office(id) ON DELETE CASCADE,
          nama VARCHAR(255) NOT NULL,
          hp VARCHAR(50),
          jabatan VARCHAR(100) NOT NULL
      );
    `);
    console.log('✅ Tabel office_user berhasil dibuat/diverifikasi');

    await db.execute(`
      -- 4. Tambah office_id ke desa_config
      ALTER TABLE desa_config ADD COLUMN IF NOT EXISTS office_id BIGINT REFERENCES office(id) ON DELETE SET NULL;
    `);
    console.log('✅ Kolom office_id ditambahkan ke desa_config');

    console.log('🎉 Migrasi Office berhasil diselesaikan!');
  } catch (error) {
    console.error('❌ Gagal melakukan migrasi:', error);
  } finally {
    await sql.end();
  }
}

runMigration();
