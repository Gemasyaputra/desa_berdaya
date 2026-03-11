import * as dotenv from 'dotenv';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';
import bcrypt from 'bcryptjs';

// Load environment variables (.env)
dotenv.config({ path: '.env.local' });
dotenv.config();

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL!;
const sql = postgres(connectionString);
const db = drizzle(sql);

async function runSeedOffice() {
  console.log('🌱 Memulai proses seeding data Office dan Office User...');

  try {
    const hashedPassword = await bcrypt.hash('password123', 10);

    // 1. Buat Kantor Pusat
    const officeRows = await sql`
      INSERT INTO office (nama_office, alamat) 
      VALUES ('Kantor Pusat Nasional', 'Jl. Merdeka No.1, Jakarta')
      RETURNING id
    `;
    const officeId = Number(officeRows[0].id);
    console.log(`✅ Office 'Kantor Pusat Nasional' (ID: ${officeId}) berhasil dibuat.`);

    // 2. Buat User Login untuk Office User
    const userRows = await sql`
      INSERT INTO users (email, password_encrypted, role)
      VALUES ('office@desaberdaya.id', ${hashedPassword}, 'OFFICE')
      RETURNING id
    `;
    const userId = Number(userRows[0].id);

    // 3. Masukkan Profil Office User
    await sql`
      INSERT INTO office_user (user_id, office_id, nama, hp, jabatan)
      VALUES (${userId}, ${officeId}, 'Admin Office Pusat', '081234567890', 'Kepala Region')
    `;
    console.log(`✅ Office User 'Admin Office Pusat' (Email: office@desaberdaya.id) berhasil dibuat.`);

    // 4. Update Desa Config yang sudah ada agar terhubung ke Office ini
    const updateRes = await sql`
      UPDATE desa_config 
      SET office_id = ${officeId} 
      WHERE office_id IS NULL
    `;
    console.log(`✅ Meng-assign ${updateRes.count} entri desa yang sudah ada ke Office ID ${officeId}.`);

    console.log('🎉 Seeding Office selesai dengan sukses!');
  } catch (error) {
    console.error('❌ Gagal melakukan seeding Office:', error);
  } finally {
    await sql.end();
  }
}

runSeedOffice();
