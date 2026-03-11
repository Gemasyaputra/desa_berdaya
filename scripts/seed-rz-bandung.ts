import * as dotenv from 'dotenv';
import postgres from 'postgres';

dotenv.config({ path: '.env.local' });
dotenv.config();

const sql = postgres(process.env.DATABASE_URL || process.env.POSTGRES_URL!);

async function runSeed() {
  console.log('Seeding data for RZ Bandung (Office ID = 1)...');

  try {
    // 1. Dapatkan RZ Bandung
    const offices = await sql`SELECT id FROM office WHERE nama_office ILIKE '%Bandung%' LIMIT 1`;
    const rzBandung = offices[0];

    if (!rzBandung) {
      console.log('Office RZ Bandung tidak ditemukan!');
      process.exit(1);
    }
    const officeId = rzBandung.id;

    // 2. Pilih satu Relawan Aktif secara acak (misal ID 4 yang sebelumnya dicoba, atau ambil acak)
    const relawans = await sql`SELECT id FROM relawan LIMIT 1`;
    const relawanId = relawans[0]?.id || 1;

    const prov = await sql`SELECT id FROM provinsi LIMIT 1`;
    const provId = prov[0]?.id || 1;
    const kota = await sql`SELECT id FROM kota_kabupaten WHERE provinsi_id = ${provId} LIMIT 1`;
    const kotaId = kota[0]?.id || 1;
    const kec = await sql`SELECT id FROM kecamatan WHERE kota_id = ${kotaId} LIMIT 1`;
    const kecId = kec[0]?.id || 1;

    // 3. Buat Desa Config Baru khusus RZ Bandung
    const desaConfigRes = await sql`
      INSERT INTO desa_config (provinsi_id, kota_id, kecamatan_id, nama_desa, office_id)
      VALUES (${provId}, ${kotaId}, ${kecId}, 'Desa Berdaya RZ Bandung', ${officeId})
      RETURNING id
    `;
    const desaConfigId = desaConfigRes[0].id;
    console.log(`Created Desa Config: ID ${desaConfigId}`);

    // 4. Tambahkan ke Desa Berdaya
    const desaBerdayaRes = await sql`
      INSERT INTO desa_berdaya (
        desa_id, relawan_id, tanggal_mulai, status_aktif, provinsi_id, kota_id, kecamatan_id
      ) VALUES (
        ${desaConfigId}, ${relawanId}, CURRENT_DATE, true, ${provId}, ${kotaId}, ${kecId}
      )
      RETURNING id
    `;
    const desaBerdayaId = desaBerdayaRes[0].id;
    console.log(`Assigned as Desa Berdaya: ID ${desaBerdayaId}`);

    // 5. Buat Penerima Manfaat (5 orang)
    const pmIds: number[] = [];
    for (let i = 1; i <= 5; i++) {
      const pmRes = await sql`
        INSERT INTO penerima_manfaat (
          desa_berdaya_id, nama, nik, tempat_lahir,
          tanggal_lahir, jenis_kelamin, kategori_pm,
          alamat, pekerjaan, kel_desa, kecamatan, agama, status_perkawinan
        ) VALUES (
          ${desaBerdayaId}, ${'PM RZ Bandung ' + i}, ${'3273000000000' + i}, 'Bandung',
          ${'1990-01-0' + i}, 'Laki-Laki', 'EKONOMI',
          ${'Jl. RZ Bandung No ' + i}, 'Wirausaha', 'Babakan', 'Andir', 'Islam', 'Belum Kawin'
        )
        RETURNING id
      `;
      pmIds.push(pmRes[0].id);
    }
    console.log(`Created 5 Penerima Manfaat: [${pmIds.join(', ')}]`);

    // 6. Dapatkan Master Program (misal Senyum Juara)
    const programs = await sql`SELECT id FROM program LIMIT 1`;
    const programId = programs[0]?.id;

    // 6b. Dapatkan Master Kelompok
    const mks = await sql`SELECT id, nama_kelompok FROM master_kelompok LIMIT 1`;
    const mkId = mks[0]?.id;
    const namaKelompok = mks[0]?.nama_kelompok || 'Kelompok RZ Bandung';

    // 7. Buat Kelompok
    const kelompokRes = await sql`
      INSERT INTO kelompok (
        desa_berdaya_id, nama_kelompok, nama_pembina, master_kelompok_id, program_id, tahun, relawan_id
      ) VALUES (
        ${desaBerdayaId}, ${namaKelompok}, 'Pembina RZ Bandung', ${mkId || null}, ${programId || null}, 2026, ${relawanId}
      )
      RETURNING id
    `;
    const kelompokId = kelompokRes[0].id;
    console.log(`Created Kelompok: ID ${kelompokId}`);

    // 8. Masukkan PM ke Kelompok
    for (const pmId of pmIds) {
      await sql`
        INSERT INTO kelompok_anggota (kelompok_id, penerima_manfaat_id)
        VALUES (${kelompokId}, ${pmId})
      `;
    }
    console.log(`Assigned PMs to Kelompok!`);
    
    console.log('--- SEEDING SUCCESSFULLY COMPLETED ---');

  } catch (error) {
    console.error('Error seeding RZ Bandung data:', error);
  } finally {
    process.exit(0);
  }
}

runSeed();
