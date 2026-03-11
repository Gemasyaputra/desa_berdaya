import * as dotenv from 'dotenv';
import postgres from 'postgres';

dotenv.config({ path: '.env.local' });
dotenv.config();

const sql = postgres(process.env.DATABASE_URL || process.env.POSTGRES_URL!);

async function check() {
  const users = await sql`SELECT id, email, role FROM users WHERE role = 'OFFICE'`;
  console.log('Office Users:', users);
  
  const officeUsers = await sql`SELECT * FROM office_user`;
  console.log('Office User Mapping:', officeUsers);

  const offices = await sql`SELECT * FROM office`;
  console.log('Offices:', offices);

  const desas = await sql`SELECT id, nama_desa, office_id FROM desa_config WHERE id = 6`; // I'll just select id = 6 if it's new
  console.log('Desa Config 6:', desas);

  const db = await sql`SELECT db.id, dc.nama_desa, db.desa_id, db.relawan_id, dc.office_id FROM desa_berdaya db JOIN desa_config dc ON db.desa_id = dc.id ORDER BY db.id DESC LIMIT 5`;
  console.log('Desa Berdaya (Last 5):', db);

  process.exit(0);
}
check();
