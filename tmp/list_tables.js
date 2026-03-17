
const { neon } = require('@neondatabase/serverless');
const dotenv = require('dotenv');
const { resolve } = require('path');

dotenv.config({ path: resolve(__dirname, '../.env') });
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const sql = neon(process.env.DATABASE_URL);

async function listTables() {
  try {
    const result = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `;
    console.log("Tables in public schema:");
    result.forEach(row => console.log(`- ${row.table_name}`));
  } catch (err) {
    console.error("Failed to list tables:", err);
  }
}

listTables();
