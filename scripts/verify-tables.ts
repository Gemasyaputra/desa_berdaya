import * as dotenv from 'dotenv'
import postgres from 'postgres'

dotenv.config()

const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL
const sql = postgres(databaseUrl!)

async function run() {
  try {
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('form_categories', 'category_custom_fields')
    `
    console.log('Tables found:', tables)
    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}
run()
