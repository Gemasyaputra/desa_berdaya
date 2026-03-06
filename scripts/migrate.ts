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
  console.log('⏳ Memulai proses migrasi (Raw Query)...');

  try {
    // Eksekusi Raw SQL
    await db.execute(`
      -- 0. Drop Existing Tables
      DROP TABLE IF EXISTS laporan_kegiatan CASCADE;
      DROP TABLE IF EXISTS penerima_manfaat CASCADE;
      DROP TABLE IF EXISTS desa_berdaya CASCADE;
      DROP TABLE IF EXISTS relawan CASCADE;
      DROP TABLE IF EXISTS monev CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS desa_config CASCADE;
      DROP TABLE IF EXISTS kecamatan CASCADE;
      DROP TABLE IF EXISTS kota_kabupaten CASCADE;
      DROP TABLE IF EXISTS provinsi CASCADE;
      DROP TYPE IF EXISTS user_role CASCADE;
      DROP TYPE IF EXISTS kategori_pm CASCADE;

      -- 1. Buat Custom Types (Enum)
      DO $$ BEGIN
          CREATE TYPE user_role AS ENUM ('ADMIN', 'FINANCE', 'PROG_HEAD', 'MONEV', 'RELAWAN');
          CREATE TYPE kategori_pm AS ENUM ('LANSIA', 'BUMIL', 'BALITA', 'EKONOMI');
      EXCEPTION
          WHEN duplicate_object THEN null;
      END $$;

      -- 2. Master Data Wilayah
      CREATE TABLE IF NOT EXISTS provinsi (
          id BIGSERIAL PRIMARY KEY,
          nama_provinsi VARCHAR(255) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS kota_kabupaten (
          id BIGSERIAL PRIMARY KEY,
          provinsi_id BIGINT NOT NULL REFERENCES provinsi(id) ON DELETE CASCADE,
          nama_kota VARCHAR(255) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS kecamatan (
          id BIGSERIAL PRIMARY KEY,
          kota_id BIGINT NOT NULL REFERENCES kota_kabupaten(id) ON DELETE CASCADE,
          nama_kecamatan VARCHAR(255) NOT NULL
      );

      CREATE TABLE IF NOT EXISTS desa_config (
          id BIGSERIAL PRIMARY KEY,
          provinsi_id BIGINT NOT NULL REFERENCES provinsi(id) ON DELETE CASCADE,
          kota_id BIGINT NOT NULL REFERENCES kota_kabupaten(id) ON DELETE CASCADE,
          kecamatan_id BIGINT NOT NULL REFERENCES kecamatan(id) ON DELETE CASCADE,
          nama_desa VARCHAR(255) NOT NULL
      );

      -- 3. Manajemen User & Authentikasi
      CREATE TABLE IF NOT EXISTS users (
          id BIGSERIAL PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_encrypted VARCHAR(255),
          role user_role NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 4. Master Data Pegawai / Operational
      CREATE TABLE IF NOT EXISTS monev (
          id BIGSERIAL PRIMARY KEY,
          user_id BIGINT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
          nama VARCHAR(255) NOT NULL,
          hp VARCHAR(50)
      );

      CREATE TABLE IF NOT EXISTS relawan (
          id BIGSERIAL PRIMARY KEY,
          user_id BIGINT UNIQUE REFERENCES users(id) ON DELETE CASCADE,
          nama VARCHAR(255) NOT NULL,
          hp VARCHAR(50),
          is_korwil BOOLEAN DEFAULT false,
          monev_id BIGINT REFERENCES monev(id) ON DELETE SET NULL,
          korwil_id BIGINT REFERENCES relawan(id) ON DELETE SET NULL
      );

      -- 5. Core Operational
      CREATE TABLE IF NOT EXISTS desa_berdaya (
          id BIGSERIAL PRIMARY KEY,
          provinsi_id BIGINT NOT NULL REFERENCES provinsi(id) ON DELETE CASCADE,
          kota_id BIGINT NOT NULL REFERENCES kota_kabupaten(id) ON DELETE CASCADE,
          kecamatan_id BIGINT NOT NULL REFERENCES kecamatan(id) ON DELETE CASCADE,
          desa_id BIGINT NOT NULL REFERENCES desa_config(id) ON DELETE CASCADE,
          relawan_id BIGINT NOT NULL REFERENCES relawan(id) ON DELETE CASCADE,
          latitude DOUBLE PRECISION,
          longitude DOUBLE PRECISION,
          potensi_desa TEXT,
          status_aktif BOOLEAN DEFAULT true,
          tanggal_mulai TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS penerima_manfaat (
          id BIGSERIAL PRIMARY KEY,
          desa_berdaya_id BIGINT NOT NULL REFERENCES desa_berdaya(id) ON DELETE CASCADE,
          nik VARCHAR(20) UNIQUE NOT NULL,
          nama VARCHAR(255) NOT NULL,
          tempat_lahir VARCHAR(100),
          tanggal_lahir DATE,
          jenis_kelamin VARCHAR(20),
          golongan_darah VARCHAR(5),
          alamat TEXT,
          rt_rw VARCHAR(20),
          kel_desa VARCHAR(100),
          kecamatan VARCHAR(100),
          agama VARCHAR(50),
          status_perkawinan VARCHAR(50),
          pekerjaan VARCHAR(100),
          kewarganegaraan VARCHAR(50),
          kategori_pm kategori_pm NOT NULL,
          foto_ktp_url VARCHAR(500)
      );

      CREATE TABLE IF NOT EXISTS laporan_kegiatan (
          id BIGSERIAL PRIMARY KEY,
          desa_berdaya_id BIGINT NOT NULL REFERENCES desa_berdaya(id) ON DELETE CASCADE,
          jenis_kegiatan VARCHAR(50) NOT NULL,
          judul_kegiatan VARCHAR(255) NOT NULL,
          deskripsi TEXT,
          total_realisasi BIGINT NOT NULL,
          bukti_url VARCHAR(500),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Migrasi tabel dan relasi berhasil diselesaikan!');
  } catch (error) {
    console.error('❌ Gagal melakukan migrasi:', error);
  } finally {
    await sql.end();
  }
}

runMigration();
