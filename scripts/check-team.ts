import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
dotenv.config()
const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL || '')
async function run() {
  const rows = await sql`SELECT r.id, r.nama, r.is_korwil, r.monev_id, r.korwil_id FROM relawan r ORDER BY r.is_korwil DESC LIMIT 10`
  console.log(JSON.stringify(rows, null, 2))
  
  const monevs = await sql`SELECT * FROM monev LIMIT 5`
  console.log('monev table:', JSON.stringify(monevs, null, 2))
  process.exit(0)
}
run().catch(e => { console.error(e.message); process.exit(1) })
