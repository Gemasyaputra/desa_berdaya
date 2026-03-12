import * as dotenv from 'dotenv';
import postgres from 'postgres';
dotenv.config({ path: '.env.local' });
dotenv.config();
const sql = postgres(process.env.DATABASE_URL || process.env.POSTGRES_URL!);

async function run() {
  const result = await sql`
     SELECT dc.id, COUNT(*) 
     FROM desa_config dc
     LEFT JOIN desa_berdaya db ON db.desa_id = dc.id AND db.status_aktif = true
     GROUP BY dc.id
     HAVING COUNT(*) > 1
  `;
  console.log('Duplicate Villages (desa_config.id with multiple active desa_berdaya):', result);
  await sql.end();
}
run();
