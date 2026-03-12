import * as dotenv from 'dotenv';
import postgres from 'postgres';
dotenv.config({ path: '.env.local' });
dotenv.config();
const sql = postgres(process.env.DATABASE_URL || process.env.POSTGRES_URL!);

async function run() {
  const u = await sql`SELECT email, role FROM users WHERE role IN ('FINANCE', 'PROG_HEAD', 'OFFICE')`;
  console.log('Users with these roles:', u);
  
  const r = await sql`SELECT r.nama, u.role FROM relawan r JOIN users u ON r.user_id = u.id WHERE u.role IN ('FINANCE', 'PROG_HEAD')`;
  console.log('Relawans with these roles:', r);

  const ou = await sql`SELECT ou.nama, u.role FROM office_user ou JOIN users u ON ou.user_id = u.id`;
  console.log('Office Users with these roles:', ou);

  await sql.end();
}
run();
