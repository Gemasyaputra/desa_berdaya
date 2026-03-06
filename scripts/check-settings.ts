import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
dotenv.config()
const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL || '')
async function run() {
  const rows = await sql`SELECT key, value FROM app_settings ORDER BY key`
  for (const row of rows) {
    console.log(`${row.key}: ${row.value.substring(0,80)}`)
  }
  process.exit(0)
}
run().catch(e => { console.error(e.message); process.exit(1) })
