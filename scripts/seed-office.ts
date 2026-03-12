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

    // 1. Buat/Update Kantor Pusat
    // Check for Jakarta/Pusat location data
    const provRows = await sql`SELECT id FROM provinsi WHERE nama_provinsi ILIKE '%Jakarta%' LIMIT 1`;
    const provId = provRows.length > 0 ? provRows[0].id : null;
    
    const kotaRows = provId ? await sql`SELECT id FROM kota_kabupaten WHERE provinsi_id = ${provId} LIMIT 1` : [];
    const kotaId = kotaRows.length > 0 ? kotaRows[0].id : null;

    const kecRows = kotaId ? await sql`SELECT id FROM kecamatan WHERE kota_id = ${kotaId} LIMIT 1` : [];
    const kecId = kecRows.length > 0 ? kecRows[0].id : null;

    const existingOffices = await sql`SELECT id FROM office WHERE nama_office = 'Kantor Pusat Nasional' LIMIT 1`;
    let officeId;

    if (existingOffices.length > 0) {
      officeId = Number(existingOffices[0].id);
      await sql`
        UPDATE office 
        SET provinsi_id = ${provId}, kota_id = ${kotaId}, kecamatan_id = ${kecId}
        WHERE id = ${officeId}
      `;
      console.log(`✅ Office 'Kantor Pusat Nasional' (ID: ${officeId}) berhasil diupdate dengan alamat terstruktur.`);
    } else {
      const officeRows = await sql`
        INSERT INTO office (nama_office, alamat, provinsi_id, kota_id, kecamatan_id) 
        VALUES ('Kantor Pusat Nasional', 'Jl. Merdeka No.1, Jakarta', ${provId}, ${kotaId}, ${kecId})
        RETURNING id
      `;
      officeId = Number(officeRows[0].id);
      console.log(`✅ Office 'Kantor Pusat Nasional' (ID: ${officeId}) berhasil dibuat.`);
    }

    // 2. Buat/Update User Login untuk Office User
    const userEmail = 'office@desaberdaya.id';
    const existingUser = await sql`SELECT id FROM users WHERE email = ${userEmail} LIMIT 1`;
    let userId;
    if (existingUser.length > 0) {
      userId = Number(existingUser[0].id);
      await sql`UPDATE users SET role = 'PROG_HEAD' WHERE id = ${userId}`;
    } else {
      const userRows = await sql`
        INSERT INTO users (email, password_encrypted, role)
        VALUES (${userEmail}, ${hashedPassword}, 'PROG_HEAD')
        RETURNING id
      `;
      userId = Number(userRows[0].id);
    }

    // 3. Masukkan/Update Profil Office User
    const existingOu = await sql`SELECT id FROM office_user WHERE user_id = ${userId} LIMIT 1`;
    if (existingOu.length > 0) {
      await sql`
        UPDATE office_user 
        SET office_id = ${officeId}, jabatan = 'Program Head'
        WHERE user_id = ${userId}
      `;
    } else {
      await sql`
        INSERT INTO office_user (user_id, office_id, nama, hp, jabatan)
        VALUES (${userId}, ${officeId}, 'Admin Office Pusat', '081234567890', 'Program Head')
      `;
    }
    console.log(`✅ Office User 'Admin Office Pusat' (Email: ${userEmail}) diset sebagai Program Head.`);

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
