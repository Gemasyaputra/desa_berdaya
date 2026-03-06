import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
dotenv.config()
const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL || '')
async function run() {
  const rows = await sql`SELECT email, role FROM users ORDER BY role, email`
  for (const row of rows) {
    console.log(`[${row.role}] ${row.email}`)
  }
  process.exit(0)
}
run().catch(e => { console.error(e.message); process.exit(1) })
