import { sql } from './lib/db.js'

async function check() {
  try {
    const result = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'program'
    `
    console.log(JSON.stringify(result, null, 2))
  } catch (e) {
    console.error(e)
  }
}

check()
