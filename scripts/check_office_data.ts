import * as dotenv from 'dotenv';
import postgres from 'postgres';
dotenv.config({ path: '.env.local' });
dotenv.config();
const sql = postgres(process.env.DATABASE_URL || process.env.POSTGRES_URL!);

async function run() {
  const result = await sql`SELECT * FROM office`;
  console.log('Office Data:', result);
  await sql.end();
}
run();
