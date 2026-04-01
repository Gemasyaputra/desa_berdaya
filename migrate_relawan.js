require("dotenv").config({ path: ".env" });
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  try {
    console.log("Adding new columns to 'relawan' table...");
    await pool.query(`
      ALTER TABLE relawan
      ADD COLUMN IF NOT EXISTS foto_url VARCHAR(255),
      ADD COLUMN IF NOT EXISTS status_relawan VARCHAR(50) DEFAULT 'Aktif',
      ADD COLUMN IF NOT EXISTS cabang_dbf VARCHAR(100),
      ADD COLUMN IF NOT EXISTS tipe_relawan VARCHAR(100),
      ADD COLUMN IF NOT EXISTS tempat_lahir VARCHAR(100),
      ADD COLUMN IF NOT EXISTS tanggal_lahir DATE,
      ADD COLUMN IF NOT EXISTS jenis_kelamin VARCHAR(20),
      ADD COLUMN IF NOT EXISTS alamat TEXT,
      ADD COLUMN IF NOT EXISTS nomor_induk VARCHAR(50),
      ADD COLUMN IF NOT EXISTS ketokohan VARCHAR(100),
      ADD COLUMN IF NOT EXISTS bank VARCHAR(100),
      ADD COLUMN IF NOT EXISTS nomor_rekening VARCHAR(50),
      ADD COLUMN IF NOT EXISTS atas_nama VARCHAR(150),
      ADD COLUMN IF NOT EXISTS nomor_ktp VARCHAR(50),
      ADD COLUMN IF NOT EXISTS nomor_kk VARCHAR(50),
      ADD COLUMN IF NOT EXISTS pendidikan VARCHAR(100),
      ADD COLUMN IF NOT EXISTS pekerjaan VARCHAR(100),
      ADD COLUMN IF NOT EXISTS jabatan_desa VARCHAR(100),
      ADD COLUMN IF NOT EXISTS keahlian VARCHAR(150),
      ADD COLUMN IF NOT EXISTS status_edukasi VARCHAR(50),
      ADD COLUMN IF NOT EXISTS coa_kafalah VARCHAR(100),
      ADD COLUMN IF NOT EXISTS nama_coa_kafalah VARCHAR(150),
      ADD COLUMN IF NOT EXISTS akun_facebook VARCHAR(150),
      ADD COLUMN IF NOT EXISTS akun_twitter VARCHAR(150),
      ADD COLUMN IF NOT EXISTS akun_instagram VARCHAR(150);
    `);
    console.log("Migration successful!");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    pool.end();
  }
}

migrate();
