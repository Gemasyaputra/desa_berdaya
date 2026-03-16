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
    console.log('🔄 [Additive] Membuat tabel form-builder (jika belum ada)...')
    
    await sql`
      CREATE TABLE IF NOT EXISTS form_categories (
        id BIGSERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `
    console.log('✅ Tabel form_categories siap')

    await sql`
      CREATE TABLE IF NOT EXISTS category_custom_fields (
        id BIGSERIAL PRIMARY KEY,
        category_id BIGINT NOT NULL REFERENCES form_categories(id) ON DELETE CASCADE,
        field_name VARCHAR(255) NOT NULL,
        field_label VARCHAR(255) NOT NULL,
        field_type VARCHAR(50) NOT NULL,
        is_required BOOLEAN NOT NULL DEFAULT FALSE,
        order_index INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `
    console.log('✅ Tabel category_custom_fields siap')

    console.log('✅ Migration form-builder selesai!')
    process.exit(0)
  } catch (error: any) {
    console.error('❌ Error:', error?.message || error)
    process.exit(1)
  }
}

run()
