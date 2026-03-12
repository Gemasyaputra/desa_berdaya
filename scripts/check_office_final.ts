import * as dotenv from 'dotenv';
import postgres from 'postgres';
dotenv.config({ path: '.env.local' });
dotenv.config();
const sql = postgres(process.env.DATABASE_URL || process.env.POSTGRES_URL!);

async function run() {
  const result = await sql`
    SELECT 
      o.id,
      o.nama_office,
      o.provinsi_id,
      o.kota_id,
      o.kecamatan_id
    FROM office o
  `;
  console.log('Current Office Data in DB:', result);
  await sql.end();
}
run();
