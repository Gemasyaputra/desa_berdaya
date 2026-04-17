import { sql } from '../lib/db'

async function check() {
  try {
    const result = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'intervensi_anggaran'
    `
    console.log(JSON.stringify(result, null, 2))
  } catch (e) {
    console.error(e)
  }
}

check()
