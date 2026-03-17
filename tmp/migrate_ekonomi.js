
const { neon } = require('@neondatabase/serverless');
const dotenv = require('dotenv');
const { resolve } = require('path');

dotenv.config({ path: resolve(__dirname, '../.env') });
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  try {
    console.log("Creating ekonomi_update table...");
    await sql`
      CREATE TABLE IF NOT EXISTS ekonomi_update (
        id SERIAL PRIMARY KEY,
        tahun INT NOT NULL,
        bulan INT NOT NULL,
        checked BOOLEAN DEFAULT FALSE,
        penerima_manfaat_id BIGINT REFERENCES penerima_manfaat(id) ON DELETE CASCADE,
        kategori TEXT NOT NULL,
        tipe TEXT NOT NULL,
        komoditas_produk TEXT,
        jumlah_tanggungan INT DEFAULT 0,
        modal NUMERIC DEFAULT 0,
        pengeluaran_operasional NUMERIC DEFAULT 0,
        omzet NUMERIC DEFAULT 0,
        pendapatan NUMERIC DEFAULT 0,
        pendapatan_lainnya NUMERIC DEFAULT 0,
        status_gk TEXT,
        nilai_ntp NUMERIC DEFAULT 0,
        program TEXT,
        operator_id BIGINT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    console.log("Table ekonomi_update created successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
  }
}

migrate();
