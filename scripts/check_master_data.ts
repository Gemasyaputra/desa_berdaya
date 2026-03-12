import * as dotenv from 'dotenv';
import postgres from 'postgres';
dotenv.config({ path: '.env.local' });
dotenv.config();
const sql = postgres(process.env.DATABASE_URL || process.env.POSTGRES_URL!);

async function run() {
  const prov = await sql`SELECT * FROM provinsi LIMIT 10`;
  const kota = await sql`SELECT * FROM kota_kabupaten LIMIT 10`;
  console.log('Provinsi:', prov);
  console.log('Kota:', kota);
  await sql.end();
}
run();
