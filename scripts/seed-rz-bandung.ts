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

async function runSeedRZBandung() {
  console.log('🌱 Memulai proses seeding data RZ Bandung...');

  try {
    const hashedPassword = await bcrypt.hash('password123', 10);

    // 1. Get/Create Provinsi & Kota (Jawa Barat & Kota Bandung)
    const provRows = await sql`SELECT id FROM provinsi WHERE nama_provinsi = 'Jawa Barat' LIMIT 1`;
    let provId = provRows.length > 0 ? provRows[0].id : null;
    if (!provId) {
      const insertedProv = await sql`INSERT INTO provinsi (nama_provinsi) VALUES ('Jawa Barat') RETURNING id`;
      provId = insertedProv[0].id;
    }

    const kotaRows = await sql`SELECT id FROM kota_kabupaten WHERE nama_kota = 'Kota Bandung' AND provinsi_id = ${provId} LIMIT 1`;
    let kotaId = kotaRows.length > 0 ? kotaRows[0].id : null;
    if (!kotaId) {
      const insertedKota = await sql`INSERT INTO kota_kabupaten (provinsi_id, nama_kota) VALUES (${provId}, 'Kota Bandung') RETURNING id`;
      kotaId = insertedKota[0].id;
    }

    // 2. Buat/Update Office: RZ Bandung
    const existingOffices = await sql`SELECT id FROM office WHERE nama_office = 'RZ Bandung' LIMIT 1`;
    let officeId;

    // Need a kecamatan for the office address too
    const officeKecNama = 'Sumur Bandung'; 
    const okRows = await sql`SELECT id FROM kecamatan WHERE nama_kecamatan ILIKE '%Sumur Bandung%' AND kota_id = ${kotaId} LIMIT 1`;
    let okId = okRows.length > 0 ? okRows[0].id : null;
    if (!okId) {
      const insertedOk = await sql`INSERT INTO kecamatan (kota_id, nama_kecamatan) VALUES (${kotaId}, 'Sumur Bandung') RETURNING id`;
      okId = insertedOk[0].id;
    }

    if (existingOffices.length > 0) {
      officeId = Number(existingOffices[0].id);
      await sql`
        UPDATE office 
        SET provinsi_id = ${provId}, kota_id = ${kotaId}, kecamatan_id = ${okId}
        WHERE id = ${officeId}
      `;
      console.log(`✅ Office 'RZ Bandung' (ID: ${officeId}) diupdate dengan alamat terstruktur.`);
    } else {
      const officeRows = await sql`
        INSERT INTO office (nama_office, alamat, provinsi_id, kota_id, kecamatan_id) 
        VALUES ('RZ Bandung', 'Jl. Braga No.123, Bandung', ${provId}, ${kotaId}, ${okId})
        RETURNING id
      `;
      officeId = Number(officeRows[0].id);
      console.log(`✅ Office 'RZ Bandung' (ID: ${officeId}) dibuat.`);
    }
    console.log(`✅ Office 'RZ Bandung' (ID: ${officeId}) siap.`);

    // 3. Office User: RZ Bandung
    const userEmail = 'bandung.office@desaberdaya.id';
    const existingUser = await sql`SELECT id FROM users WHERE email = ${userEmail} LIMIT 1`;
    let userId;
    if (existingUser.length === 0) {
      const userRows = await sql`
        INSERT INTO users (email, password_encrypted, role)
        VALUES (${userEmail}, ${hashedPassword}, 'FINANCE')
        RETURNING id
      `;
      userId = Number(userRows[0].id);
      
      await sql`
        INSERT INTO office_user (user_id, office_id, nama, hp, jabatan)
        VALUES (${userId}, ${officeId}, 'Admin RZ Bandung', '081222333444', 'Finance of Program')
      `;
      console.log(`✅ Office User 'Admin RZ Bandung' dibuat sebagai Finance of Program.`);
    } else {
      userId = Number(existingUser[0].id);
      await sql`UPDATE users SET role = 'FINANCE' WHERE id = ${userId}`;
      await sql`UPDATE office_user SET jabatan = 'Finance of Program' WHERE user_id = ${userId}`;
      console.log(`✅ Office User 'Admin RZ Bandung' diupdate sebagai Finance of Program.`);
    }

    // 4. Seeding Master Data Program & Kategori (Jika belum ada)
    const existingKat = await sql`SELECT id FROM kategori_program WHERE nama_kategori = 'Pemberdayaan Ekonomi' LIMIT 1`;
    let katId;
    if (existingKat.length > 0) {
      katId = existingKat[0].id;
    } else {
      const katRows = await sql`INSERT INTO kategori_program (nama_kategori) VALUES ('Pemberdayaan Ekonomi') RETURNING id`;
      katId = katRows[0].id;
    }

    const existingProg = await sql`SELECT id FROM program WHERE nama_program = 'Zakat Digital Bandung' AND kategori_id = ${katId} LIMIT 1`;
    let progId;
    if (existingProg.length > 0) {
      progId = existingProg[0].id;
    } else {
      const progRows = await sql`INSERT INTO program (kategori_id, nama_program) VALUES (${katId}, 'Zakat Digital Bandung') RETURNING id`;
      progId = progRows[0].id;
    }

    // 5. Desa Config & Desa Berdaya
    const kecamatanNama = 'Coblong';
    const kecRows = await sql`SELECT id FROM kecamatan WHERE nama_kecamatan = ${kecamatanNama} AND kota_id = ${kotaId} LIMIT 1`;
    let kecId = kecRows.length > 0 ? kecRows[0].id : null;
    if (!kecId) {
      const insertedKec = await sql`INSERT INTO kecamatan (kota_id, nama_kecamatan) VALUES (${kotaId}, ${kecamatanNama}) RETURNING id`;
      kecId = insertedKec[0].id;
    }

    const desaNama = 'Dago Elos';
    const existingDc = await sql`SELECT id FROM desa_config WHERE nama_desa = ${desaNama} AND kecamatan_id = ${kecId} LIMIT 1`;
    let dcId;
    if (existingDc.length > 0) {
      dcId = existingDc[0].id;
    } else {
      const dcRows = await sql`
        INSERT INTO desa_config (provinsi_id, kota_id, kecamatan_id, nama_desa, office_id)
        VALUES (${provId}, ${kotaId}, ${kecId}, ${desaNama}, ${officeId})
        RETURNING id
      `;
      dcId = dcRows[0].id;
    }

    // 6. Relawan (Role RELAWAN)
    const relawanEmail = 'asep.relawan@desaberdaya.id';
    const existingRelawanUser = await sql`SELECT id FROM users WHERE email = ${relawanEmail} LIMIT 1`;
    let uRelawanId;
    if (existingRelawanUser.length > 0) {
      uRelawanId = existingRelawanUser[0].id;
    } else {
      const uRelawanRows = await sql`
        INSERT INTO users (email, password_encrypted, role)
        VALUES (${relawanEmail}, ${hashedPassword}, 'RELAWAN')
        RETURNING id
      `;
      uRelawanId = uRelawanRows[0].id;
    }

    const existingRelawan = await sql`SELECT id FROM relawan WHERE user_id = ${uRelawanId} LIMIT 1`;
    let relawanId;
    if (existingRelawan.length > 0) {
      relawanId = existingRelawan[0].id;
    } else {
      const relawanRows = await sql`
        INSERT INTO relawan (user_id, nama, hp, is_korwil)
        VALUES (${uRelawanId}, 'Asep Sunandar', '08987654321', false)
        RETURNING id
      `;
      relawanId = relawanRows[0].id;
    }

    // 7. Desa Berdaya (Operational)
    const existingDb = await sql`SELECT id FROM desa_berdaya WHERE desa_id = ${dcId} AND relawan_id = ${relawanId} LIMIT 1`;
    let dbId;
    if (existingDb.length > 0) {
      dbId = existingDb[0].id;
    } else {
      const dbRows = await sql`
        INSERT INTO desa_berdaya (provinsi_id, kota_id, kecamatan_id, desa_id, relawan_id, status_aktif, potensi_desa)
        VALUES (${provId}, ${kotaId}, ${kecId}, ${dcId}, ${relawanId}, true, 'Tekstil dan Wisata')
        RETURNING id
      `;
      dbId = dbRows[0].id;
    }

    // 8. Penerima Manfaat
    const pmNames = ['Pak Dadang', 'Ibu Entin', 'Mang Ujang'];
    const pmIds: number[] = [];
    for (const name of pmNames) {
      const existingPm = await sql`SELECT id FROM penerima_manfaat WHERE nama = ${name} AND desa_berdaya_id = ${dbId} LIMIT 1`;
      if (existingPm.length > 0) {
        pmIds.push(Number(existingPm[0].id));
        continue;
      }
      const nik = '3273' + Math.floor(Math.random() * 1000000000000).toString().padStart(12, '0');
      const randomAlamat = `Jl. Dago Elos No. ${Math.floor(Math.random() * 100)}`;
      const pmRes = await sql`
        INSERT INTO penerima_manfaat (desa_berdaya_id, nik, nama, kategori_pm, alamat)
        VALUES (${dbId}, ${nik}, ${name}, 'EKONOMI', ${randomAlamat})
        RETURNING id
      `;
      pmIds.push(Number(pmRes[0].id));
    }

    // 9. Kelompok
    const existingKel = await sql`SELECT id FROM kelompok WHERE nama_kelompok = 'Kelompok Tani Dago' AND desa_berdaya_id = ${dbId} LIMIT 1`;
    let kelId;
    if (existingKel.length > 0) {
      kelId = existingKel[0].id;
    } else {
      const kelRows = await sql`
        INSERT INTO kelompok (desa_berdaya_id, nama_kelompok, nama_pembina, tahun, relawan_id, program_id)
        VALUES (${dbId}, 'Kelompok Tani Dago', 'Asep Sunandar', 2024, ${relawanId}, ${progId})
        RETURNING id
      `;
      kelId = kelRows[0].id;
    }

    // 10. Kelompok Anggota
    for (const pmId of pmIds) {
      const existingKA = await sql`SELECT * FROM kelompok_anggota WHERE kelompok_id = ${kelId} AND penerima_manfaat_id = ${pmId} LIMIT 1`;
      if (existingKA.length === 0) {
        await sql`
          INSERT INTO kelompok_anggota (kelompok_id, penerima_manfaat_id)
          VALUES (${kelId}, ${pmId})
        `;
      }
    }

    console.log('🎉 Seeding RZ Bandung selesai dengan sukses!');
    console.log(`- Office: RZ Bandung`);
    console.log(`- User: ${userEmail}`);
    console.log(`- Relawan: ${relawanEmail}`);
    console.log(`- Desa: ${desaNama}`);
    console.log(`- PM: ${pmNames.join(', ')}`);
    console.log(`- Kelompok: Kelompok Tani Dago`);

  } catch (error) {
    console.error('❌ Gagal melakukan seeding RZ Bandung:', error);
  } finally {
    await sql.end();
  }
}

runSeedRZBandung();
