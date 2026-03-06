import * as dotenv from 'dotenv';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import bcrypt from 'bcryptjs';

// Load environment variables (.env)
dotenv.config({ path: '.env.local' });
dotenv.config();

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL!;
const sql = postgres(connectionString);
const db = drizzle(sql);

async function runSeed() {
  console.log('🌱 Memulai proses seeding (Raw Query)...');

  try {
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Eksekusi Raw SQL
    await db.execute(`
      -- 0. Drop Existing Tables
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
          nama_desa VARCHAR(255) NOT NULL,
          latitude DECIMAL(10, 8),
          longitude DECIMAL(11, 8),
          potensi_desa TEXT
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
          status_aktif BOOLEAN DEFAULT true,
          tanggal_mulai TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS penerima_manfaat (
          id BIGSERIAL PRIMARY KEY,
          desa_berdaya_id BIGINT NOT NULL REFERENCES desa_berdaya(id) ON DELETE CASCADE,
          nik VARCHAR(20) UNIQUE NOT NULL,
          nama VARCHAR(255) NOT NULL,
          alamat TEXT,
          kategori_pm kategori_pm NOT NULL,
          foto_ktp_url VARCHAR(500)
      );

      -- 1. Insert Provinsi
      INSERT INTO provinsi (nama_provinsi) VALUES
        ('Jawa Barat'),
        ('Jawa Tengah'),
        ('Jawa Timur'),
        ('Banten');

      -- 2. Insert Kota/Kabupaten
      INSERT INTO kota_kabupaten (provinsi_id, nama_kota) VALUES
        (1, 'Kota Bandung'),
        (1, 'Kabupaten Bogor'),
        (2, 'Kota Semarang'),
        (3, 'Kota Surabaya');

      -- 3. Insert Kecamatan
      INSERT INTO kecamatan (kota_id, nama_kecamatan) VALUES
        (1, 'Coblong'),
        (1, 'Cicendo'),
        (2, 'Cibinong'),
        (3, 'Semarang Tengah'),
        (4, 'Gubeng');

      -- 4. Insert Desa Config
      INSERT INTO desa_config (provinsi_id, kota_id, kecamatan_id, nama_desa, latitude, longitude, potensi_desa) VALUES
        (1, 1, 1, 'Dago', -6.8741, 107.6186, 'Pariwisata, Kuliner'),
        (1, 1, 2, 'Arjuna', -6.9080, 107.5950, 'Perdagangan'),
        (1, 2, 3, 'Cibinong', -6.4833, 106.8500, 'Industri'),
        (2, 3, 4, 'Sekayu', -6.9786, 110.4136, 'Jasa, Sejarah'),
        (3, 4, 5, 'Airlangga', -7.2711, 112.7565, 'Pendidikan');

      -- 5. Insert Users (Auth)
      INSERT INTO users (email, password_encrypted, role) VALUES
        ('admin@desaberdaya.id', '${hashedPassword}', 'ADMIN'),
        ('program@desaberdaya.id', '${hashedPassword}', 'PROG_HEAD'),
        ('finance@desaberdaya.id', '${hashedPassword}', 'FINANCE'),
        ('budi.relawan@gmail.com', '${hashedPassword}', 'RELAWAN'),
        ('siti.relawan@gmail.com', '${hashedPassword}', 'RELAWAN'),
        ('ageng.monev@gmail.com', '${hashedPassword}', 'MONEV');

      -- 5a. Insert Monev
      INSERT INTO monev (user_id, nama, hp) VALUES
        (6, 'Ageng Monev', '081600006666');

      -- 5b. Insert Relawan & Korwil
      INSERT INTO relawan (user_id, nama, hp, is_korwil, monev_id) VALUES
        (2, 'Manajer Program', '081200002222', true, 1), -- Korwil
        (4, 'Budi Santoso', '081400004444', false, 1),
        (5, 'Siti Aminah', '081500005555', false, 1);

      -- Update korwil_id untuk Relawan (Budi dan Siti)
      UPDATE relawan SET korwil_id = 1 WHERE is_korwil = false;

      -- Update korwil_id untuk Korwil (dirinya sendiri)
      UPDATE relawan SET korwil_id = id WHERE is_korwil = true;

      -- 6. Insert Desa Berdaya (Core Operational)
      INSERT INTO desa_berdaya (provinsi_id, kota_id, kecamatan_id, desa_id, relawan_id, status_aktif) VALUES
        (1, 1, 1, 1, 2, true), -- Budi di Dago (Budi is id 2 in relawan)
        (1, 2, 3, 3, 3, true); -- Siti di Cibinong (Siti is id 3 in relawan)

      -- 7. Insert Penerima Manfaat
      INSERT INTO penerima_manfaat (desa_berdaya_id, nik, nama, alamat, kategori_pm) VALUES
        (1, '1234567890123451', 'Kakek Ahmad', 'Jl. Dago Atas No.1', 'LANSIA'),
        (1, '1234567890123452', 'Ibu Ratna', 'Jl. Dago Pojok No.2', 'BUMIL'),
        (2, '1234567890123453', 'Adik Ani', 'Kp. Cibinong RT 01', 'BALITA'),
        (2, '1234567890123454', 'Bapak Joko', 'Kp. Cibinong RT 02', 'EKONOMI');
    `);

    console.log('✅ Seeding tabel berhasil diselesaikan!');
  } catch (error) {
    console.error('❌ Gagal melakukan seeding:', error);
  } finally {
    await sql.end();
  }
}

runSeed();
