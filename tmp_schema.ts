import * as dotenv from 'dotenv';
import postgres from 'postgres';
dotenv.config({ path: '.env.local' });
dotenv.config();
const sql = postgres(process.env.DATABASE_URL || process.env.POSTGRES_URL!);

async function run() {
  const res = await sql`
    SELECT table_name, column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name IN ('master_kelompok', 'kelompok', 'kelompok_anggota')
  `;
  console.log(res);
  await sql.end();
}
run();
