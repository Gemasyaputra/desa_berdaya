import * as dotenv from 'dotenv'
import postgres from 'postgres'

dotenv.config()

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL
if (!databaseUrl) {
  console.error('❌ DATABASE_URL atau POSTGRES_URL tidak ditemukan di .env')
  process.exit(1)
}

const sql = postgres(databaseUrl)

async function run() {
  try {
    console.log('🔄 [Additive] Menambah kolom laporan_kegiatan untuk pelaporan dinamis...')
    
    await sql`
      ALTER TABLE laporan_kegiatan 
      ADD COLUMN IF NOT EXISTS form_category_id BIGINT REFERENCES form_categories(id),
      ADD COLUMN IF NOT EXISTS tanggal_kegiatan DATE,
      ADD COLUMN IF NOT EXISTS sasaran_program TEXT,
      ADD COLUMN IF NOT EXISTS lokasi_pelaksanaan TEXT,
      ADD COLUMN IF NOT EXISTS periode_laporan VARCHAR(50),
      ADD COLUMN IF NOT EXISTS jumlah_pm_laki INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS jumlah_pm_perempuan INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS jumlah_pm_total INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS jumlah_kelompok_laki INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS jumlah_kelompok_perempuan INTEGER DEFAULT 0,
      ADD COLUMN IF NOT EXISTS is_terdokumentasi BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS custom_fields_data JSONB
    `
    console.log('✅ Kolom tambahan laporan_kegiatan siap')

    console.log('✅ Migration dynamic reporting selesai!')
    process.exit(0)
  } catch (error: any) {
    console.error('❌ Error:', error?.message || error)
    process.exit(1)
  }
}

run()
