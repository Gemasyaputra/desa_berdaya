import * as dotenv from 'dotenv';
import postgres from 'postgres';
dotenv.config({ path: '.env.local' });
dotenv.config();
const sql = postgres(process.env.DATABASE_URL || process.env.POSTGRES_URL!);

async function run() {
  const result = await sql`
     SELECT DISTINCT ON (dc.id)
        dc.id,
        dc.nama_desa
      FROM desa_config dc
      LEFT JOIN desa_berdaya db ON db.desa_id = dc.id AND db.status_aktif = true
      ORDER BY dc.id
  `;
  const ids = result.map(r => r.id);
  const uniqueIds = new Set(ids);
  console.log('Total results:', ids.length);
  console.log('Unique IDs:', uniqueIds.size);
  if (ids.length === uniqueIds.size) {
    console.log('VERIFICATION SUCCESS: All IDs are unique.');
  } else {
    console.log('VERIFICATION FAILED: Duplicate IDs found.');
  }
  await sql.end();
}
run();
