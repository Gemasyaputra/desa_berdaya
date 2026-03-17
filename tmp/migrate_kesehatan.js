
const { neon } = require('@neondatabase/serverless');
const dotenv = require('dotenv');
const { resolve } = require('path');

dotenv.config({ path: resolve(__dirname, '../.env') });
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL);

async function migrate() {
  try {
    console.log("Creating kesehatan_update table...");
    await sql`
      CREATE TABLE IF NOT EXISTS kesehatan_update (
        id SERIAL PRIMARY KEY,
        tahun INT NOT NULL,
        bulan INT NOT NULL,
        checked BOOLEAN DEFAULT FALSE,
        penerima_manfaat_id BIGINT REFERENCES penerima_manfaat(id) ON DELETE CASCADE,
        operator_id BIGINT,
        is_kader BOOLEAN DEFAULT FALSE,
        nama_relawan TEXT,
        program_kesehatan TEXT, -- 'Ramah Lansia', 'Desa Bebas Stunting'
        
        is_anak BOOLEAN DEFAULT FALSE,
        is_ibu BOOLEAN DEFAULT FALSE,
        is_lansia BOOLEAN DEFAULT FALSE,
        
        -- Sub-form common
        tgl_pemeriksaan_anak DATE,
        tgl_pemeriksaan_ibu DATE,
        tgl_pemeriksaan_lansia DATE,
        
        -- Anak sub-form
        anak_tgl_lahir DATE,
        anak_bb_lahir NUMERIC,
        anak_tinggi_badan NUMERIC,
        anak_berat_badan NUMERIC,
        anak_nama_ibu TEXT,
        anak_ke INT,
        anak_pendampingan_khusus TEXT, -- 'Ya', 'Tidak'
        anak_asi_eksklusif INT, -- 1-6
        anak_metode_pengukuran TEXT,
        anak_lingkar_kepala NUMERIC,
        anak_menderita_diare BOOLEAN DEFAULT FALSE,
        anak_imunisasi JSONB, -- Array of strings
        anak_imd BOOLEAN DEFAULT FALSE,
        
        -- Ibu sub-form
        ibu_nik TEXT,
        ibu_tgl_lahir DATE,
        ibu_bb_sebelum_hamil NUMERIC,
        ibu_tinggi_badan NUMERIC,
        ibu_berat_badan NUMERIC,
        ibu_lila NUMERIC,
        ibu_umur_kehamilan NUMERIC,
        ibu_hb BOOLEAN DEFAULT FALSE,
        ibu_imunisasi JSONB, -- Array of strings
        
        -- Lansia sub-form
        lansia_tgl_lahir DATE,
        lansia_tinggi_badan NUMERIC,
        lansia_berat_badan NUMERIC,
        lansia_tekanan_darah TEXT,
        lansia_kolesterol NUMERIC,
        lansia_gula NUMERIC,
        lansia_asam_urat NUMERIC,
        lansia_penanggung_biaya TEXT, -- Umum, BPJS, KIS, Asuransi
        lansia_kepemilikan_bpjs TEXT, -- Ya, Tidak
        lansia_aktivitas_harian TEXT,
        lansia_riwayat_penyakit TEXT,
        lansia_riwayat_pengobatan TEXT,
        
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `;
    console.log("Table kesehatan_update created successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
  }
}

migrate();
