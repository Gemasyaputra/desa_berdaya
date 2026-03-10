import * as dotenv from 'dotenv';
import postgres from 'postgres';
import bcrypt from 'bcryptjs';

dotenv.config({ path: '.env.local' });
dotenv.config();

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL!;
const sql = postgres(connectionString);

const DEFAULT_PASSWORD = 'DesaBerdaya2025';

async function seed() {
  console.log('🌱 Seeding data hierarki: 2 Monev → 4 Korwil → 8 Relawan → 16 Desa → 32 PM...');

  try {
    const hash = await bcrypt.hash(DEFAULT_PASSWORD, 10);

    // ── Ambil desa_config yang tersedia untuk dipakai ──
    // Kita butuh 16 desa_berdaya → perlu 16 desa_config
    // Cek desa_config yang ada
    const desaConfigs = await sql`
      SELECT dc.id, dc.nama_desa, dc.kecamatan_id, dc.kota_id, dc.provinsi_id,
             k.kota_id as parent_kota_id
      FROM desa_config dc
      JOIN kecamatan k ON dc.kecamatan_id = k.id
      ORDER BY dc.id
    `;

    // Kalau kurang dari 16, tambah desa_config fiktif
    const provinsi = await sql`SELECT id FROM provinsi LIMIT 1`;
    const kota = await sql`SELECT id FROM kota_kabupaten LIMIT 1`;
    const kecamatan = await sql`SELECT id, kota_id FROM kecamatan LIMIT 1`;
    const pId = Number(provinsi[0].id);
    const kId = Number(kota[0].id);
    const kcId = Number(kecamatan[0].id);

    const namaDesaPool = [
      'Desa Maju', 'Desa Sejahtera', 'Desa Bahagia', 'Desa Damai',
      'Desa Jaya', 'Desa Makmur', 'Desa Lestari', 'Desa Harapan',
      'Desa Baru', 'Desa Cemerlang', 'Desa Indah', 'Desa Mekar',
      'Desa Gemilang', 'Desa Bersatu', 'Desa Mandiri', 'Desa Rukun',
    ];

    const allDesaIds: number[] = [];
    for (let i = 0; i < 16; i++) {
      const nama = namaDesaPool[i] + ' ' + (i + 1);
      const existing = desaConfigs[i];
      if (existing) {
        allDesaIds.push(Number(existing.id));
      } else {
        const row = await sql`
          INSERT INTO desa_config (provinsi_id, kota_id, kecamatan_id, nama_desa)
          VALUES (${pId}, ${kId}, ${kcId}, ${nama})
          RETURNING id
        `;
        allDesaIds.push(Number(row[0].id));
      }
    }

    console.log(`✅ ${allDesaIds.length} desa_config siap`);

    // ── 1. Buat 2 Monev ──
    const monevIds: number[] = [];
    for (let i = 1; i <= 2; i++) {
      const email = `monev${i}.seed@desaberdaya.id`;
      // hapus kalau ada
      await sql`DELETE FROM users WHERE email = ${email}`;
      const uRow = await sql`
        INSERT INTO users (email, password_encrypted, role)
        VALUES (${email}, ${hash}, 'MONEV')
        RETURNING id
      `;
      const userId = Number(uRow[0].id);
      const mRow = await sql`
        INSERT INTO monev (user_id, nama, hp)
        VALUES (${userId}, ${'Monev ' + i}, ${'08' + String(10000000 + i)})
        RETURNING id
      `;
      monevIds.push(Number(mRow[0].id));
      console.log(`  ✅ Monev ${i} (id=${monevIds[i-1]})`);
    }

    // ── 2. Buat 2 Korwil per Monev (total 4) ──
    const korwilIds: number[] = [];
    let korwilIndex = 1;
    for (const monevId of monevIds) {
      for (let k = 1; k <= 2; k++) {
        const email = `korwil${korwilIndex}.seed@desaberdaya.id`;
        await sql`DELETE FROM users WHERE email = ${email}`;
        const uRow = await sql`
          INSERT INTO users (email, password_encrypted, role)
          VALUES (${email}, ${hash}, 'RELAWAN')
          RETURNING id
        `;
        const userId = Number(uRow[0].id);
        const rRow = await sql`
          INSERT INTO relawan (user_id, nama, hp, is_korwil, monev_id)
          VALUES (${userId}, ${'Korwil ' + korwilIndex}, ${'08' + String(20000000 + korwilIndex)}, true, ${monevId})
          RETURNING id
        `;
        const korwilId = Number(rRow[0].id);
        // korwil_id = dirinya sendiri
        await sql`UPDATE relawan SET korwil_id = ${korwilId} WHERE id = ${korwilId}`;
        korwilIds.push(korwilId);
        console.log(`  ✅ Korwil ${korwilIndex} (id=${korwilId}, monev=${monevId})`);
        korwilIndex++;
      }
    }

    // ── 3. Buat 2 Relawan per Korwil (total 8) ──
    const relawanIds: number[] = [];
    let relawanIndex = 1;
    for (const korwilId of korwilIds) {
      // Cari monev_id dari korwil
      const korwilRow = await sql`SELECT monev_id FROM relawan WHERE id = ${korwilId} LIMIT 1`;
      const monevId = Number(korwilRow[0].monev_id);

      for (let r = 1; r <= 2; r++) {
        const email = `relawan${relawanIndex}.seed@desaberdaya.id`;
        await sql`DELETE FROM users WHERE email = ${email}`;
        const uRow = await sql`
          INSERT INTO users (email, password_encrypted, role)
          VALUES (${email}, ${hash}, 'RELAWAN')
          RETURNING id
        `;
        const userId = Number(uRow[0].id);
        const rRow = await sql`
          INSERT INTO relawan (user_id, nama, hp, is_korwil, monev_id, korwil_id)
          VALUES (${userId}, ${'Relawan ' + relawanIndex}, ${'08' + String(30000000 + relawanIndex)}, false, ${monevId}, ${korwilId})
          RETURNING id
        `;
        relawanIds.push(Number(rRow[0].id));
        console.log(`  ✅ Relawan ${relawanIndex} (id=${Number(rRow[0].id)}, korwil=${korwilId})`);
        relawanIndex++;
      }
    }

    // ── 4. Buat 2 Desa per Relawan (total 16) ──
    const desaIds: number[] = [];
    const coordinates = [
      { lat: 4.6951, lng: 96.7494 },   // Aceh
      { lat: 2.1154, lng: 99.5451 },   // Sumatra Utara
      { lat: -0.7399, lng: 100.8000 }, // Sumatra Barat
      { lat: 0.2933, lng: 101.7068 },  // Riau
      { lat: -3.3194, lng: 104.0305 }, // Sumatra Selatan
      { lat: -4.5586, lng: 105.4068 }, // Lampung
      { lat: -6.4058, lng: 106.0640 }, // Banten
      { lat: -6.9204, lng: 107.6046 }, // Jawa Barat
      { lat: -7.1509, lng: 110.1403 }, // Jawa Tengah
      { lat: -7.5360, lng: 112.2384 }, // Jawa Timur
      { lat: -8.3405, lng: 115.0920 }, // Bali
      { lat: -8.6529, lng: 117.3616 }, // Nusa Tenggara Barat
      { lat: -8.6574, lng: 121.0794 }, // Nusa Tenggara Timur
      { lat: -4.1449, lng: 119.9071 }, // Sulawesi Selatan
      { lat: -3.2385, lng: 130.1453 }, // Maluku
      { lat: -4.2699, lng: 138.0804 }, // Papua
    ];
    let desaIndex = 0;
    for (const relawanId of relawanIds) {
      for (let d = 0; d < 2; d++) {
        const dcId = allDesaIds[desaIndex];
        // Ambil info dari desa_config
        const dc = await sql`
          SELECT dc.provinsi_id, dc.kota_id, dc.kecamatan_id
          FROM desa_config dc WHERE dc.id = ${dcId}
        `;
        const row = await sql`
          INSERT INTO desa_berdaya (provinsi_id, kota_id, kecamatan_id, desa_id, relawan_id,
            latitude, longitude, potensi_desa, status_aktif, tanggal_mulai)
          VALUES (
            ${Number(dc[0].provinsi_id)},
            ${Number(dc[0].kota_id)},
            ${Number(dc[0].kecamatan_id)},
            ${dcId},
            ${relawanId},
            ${coordinates[desaIndex % 16].lat},
            ${coordinates[desaIndex % 16].lng},
            ${'Potensi desa binaan ke-' + (desaIndex + 1)},
            true,
            NOW()
          )
          RETURNING id
        `;
        desaIds.push(Number(row[0].id));
        console.log(`  ✅ Desa Berdaya (db_id=${Number(row[0].id)}, dc_id=${dcId}, relawan=${relawanId})`);
        desaIndex++;
      }
    }

    // ── 5. Buat 2 Penerima Manfaat per Desa (total 32) ──
    const kategoriPool: string[] = ['LANSIA', 'BUMIL', 'BALITA', 'EKONOMI'];
    let pmIndex = 1;
    for (const dbId of desaIds) {
      for (let p = 0; p < 2; p++) {
        const nik = String(3200000000000000 + pmIndex).padStart(16, '0');
        const kategori = kategoriPool[(pmIndex - 1) % 4];
        await sql`
          INSERT INTO penerima_manfaat (
            desa_berdaya_id, nik, nama, tempat_lahir, tanggal_lahir,
            jenis_kelamin, golongan_darah, alamat, rt_rw, kel_desa,
            kecamatan, agama, status_perkawinan, pekerjaan, kewarganegaraan, kategori_pm
          ) VALUES (
            ${dbId},
            ${nik},
            ${'Warga ' + pmIndex},
            'Bandung',
            ${'1990-01-' + String((pmIndex % 28) + 1).padStart(2, '0')},
            ${pmIndex % 2 === 0 ? 'LAKI-LAKI' : 'PEREMPUAN'},
            'O',
            ${'Jl. Merdeka No.' + pmIndex},
            ${'00' + (pmIndex % 9 + 1) + '/001'},
            'Desa Binaan',
            'Kecamatan Maju',
            'ISLAM',
            'BELUM KAWIN',
            'PELAJAR/MAHASISWA',
            'WNI',
            ${kategori as any}
          )
        `;
        pmIndex++;
      }
      console.log(`  ✅ 2 PM untuk desa_berdaya_id=${dbId}`);
    }

    console.log('\n🎉 Seeding selesai!');
    console.log(`   Monev: ${monevIds.length}`);
    console.log(`   Korwil: ${korwilIds.length}`);
    console.log(`   Relawan: ${relawanIds.length}`);
    console.log(`   Desa Berdaya: ${desaIds.length}`);
    console.log(`   Penerima Manfaat: ${(pmIndex - 1)}`);
    console.log('\n📧 Login dengan password: DesaBerdaya2025');
    console.log('   monev1.seed@desaberdaya.id (Monev 1)');
    console.log('   monev2.seed@desaberdaya.id (Monev 2)');
    console.log('   korwil1.seed@desaberdaya.id ... korwil4.seed@desaberdaya.id');
    console.log('   relawan1.seed@desaberdaya.id ... relawan8.seed@desaberdaya.id');

  } catch (error) {
    console.error('❌ Gagal seeding:', error);
  } finally {
    await sql.end();
  }
}

seed();
