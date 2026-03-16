import { sql } from '../lib/db'
import dotenv from 'dotenv'
import path from 'path'

// Load .env explicitly
dotenv.config({ path: path.join(process.cwd(), '.env') })

async function migrate() {
  try {
    console.log('Migrating category_custom_fields...')
    // Enforce DATABASE_URL from .env if it was not picked up
    if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
       console.error('DATABASE_URL is still missing after loading .env')
       process.exit(1)
    }
    
    await sql`ALTER TABLE category_custom_fields ADD COLUMN IF NOT EXISTS field_options TEXT[] DEFAULT '{}';`
    console.log('Migration successful')
    process.exit(0)
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

migrate()
