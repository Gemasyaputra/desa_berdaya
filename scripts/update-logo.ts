import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'

dotenv.config()
const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL || '')

async function run() {
  await sql`UPDATE app_settings SET value = '/asset/logo_desa_berdaya.png', updated_at = NOW() WHERE key = 'app_logo_url'`
  console.log('✅ Logo URL diperbarui ke logo_desa_berdaya.png')
  process.exit(0)
}

run().catch(e => { console.error(e.message); process.exit(1) })
