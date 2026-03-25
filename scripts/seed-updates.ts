import * as dotenv from 'dotenv';
import postgres from 'postgres';

dotenv.config({ path: '.env.local' });
dotenv.config();

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL!;
const sql = postgres(connectionString);

async function runSeed() {
  console.log('🌱 Memulai proses seeding data Update untuk Budi Santoso...');

  try {
    // 1. Dapatkan relawan_id Budi Santoso & desa_berdaya_id nya
    const relawanRow = await sql`SELECT id FROM relawan WHERE nama = 'Budi Santoso' LIMIT 1`;
    if (relawanRow.length === 0) throw new Error('Relawan Budi Santoso tidak ditemukan!');
    const relawanId = relawanRow[0].id;

    const desaRow = await sql`SELECT id FROM desa_berdaya WHERE relawan_id = ${relawanId} LIMIT 1`;
    if (desaRow.length === 0) throw new Error('Desa Berdaya untuk Budi Santoso tidak ditemukan!');
    const desaId = desaRow[0].id;

    console.log(`✅ Relawan ID: ${relawanId}, Desa Berdaya ID: ${desaId}`);

    // 2. Kategori Program (Cek atau Bikin)
    let katEkonomiId, katKesehatanId;
    
    let katEkonomi = await sql`SELECT id FROM kategori_program WHERE nama_kategori ILIKE '%ekonomi%' LIMIT 1`;
    if (katEkonomi.length === 0) {
      const res = await sql`INSERT INTO kategori_program (nama_kategori) VALUES ('Ekonomi') RETURNING id`;
      katEkonomiId = res[0].id;
    } else {
      katEkonomiId = katEkonomi[0].id;
    }

    let katKesehatan = await sql`SELECT id FROM kategori_program WHERE nama_kategori ILIKE '%kesehatan%' LIMIT 1`;
    if (katKesehatan.length === 0) {
      const res = await sql`INSERT INTO kategori_program (nama_kategori) VALUES ('Kesehatan') RETURNING id`;
      katKesehatanId = res[0].id;
    } else {
      katKesehatanId = katKesehatan[0].id;
    }

    // 3. Program
    let progEkonomiId, progKesehatanId;
    
    let progEkonomi = await sql`SELECT id FROM program WHERE nama_program = 'Pemberdayaan UMKM' LIMIT 1`;
    if (progEkonomi.length === 0) {
      const res = await sql`INSERT INTO program (kategori_id, nama_program) VALUES (${katEkonomiId}, 'Pemberdayaan UMKM') RETURNING id`;
      progEkonomiId = res[0].id;
    } else {
      progEkonomiId = progEkonomi[0].id;
    }

    let progKesehatan = await sql`SELECT id FROM program WHERE nama_program = 'Posyandu Lansia & Balita' LIMIT 1`;
    if (progKesehatan.length === 0) {
      const res = await sql`INSERT INTO program (kategori_id, nama_program) VALUES (${katKesehatanId}, 'Posyandu Lansia & Balita') RETURNING id`;
      progKesehatanId = res[0].id;
    } else {
      progKesehatanId = progKesehatan[0].id;
    }

    // 4. Master Kelompok
    let mastEkonomiId, mastKesehatanId;
    
    let mastEko = await sql`SELECT id FROM master_kelompok WHERE nama_kelompok = 'Kelompok UMKM Maju' LIMIT 1`;
    if (mastEko.length === 0) {
      const res = await sql`INSERT INTO master_kelompok (nama_kelompok, program_id) VALUES ('Kelompok UMKM Maju', ${progEkonomiId}) RETURNING id`;
      mastEkonomiId = res[0].id;
    } else {
      mastEkonomiId = mastEko[0].id;
    }

    let mastKes = await sql`SELECT id FROM master_kelompok WHERE nama_kelompok = 'Kelompok Posyandu Sehat' LIMIT 1`;
    if (mastKes.length === 0) {
      const res = await sql`INSERT INTO master_kelompok (nama_kelompok, program_id) VALUES ('Kelompok Posyandu Sehat', ${progKesehatanId}) RETURNING id`;
      mastKesehatanId = res[0].id;
    } else {
      mastKesehatanId = mastKes[0].id;
    }

    console.log('✅ Master data program & kelompok disiapkan.');

    // 5. Kelompok untuk Desa Ini
    let kelEkonomiId, kelKesehatanId;
    const currentYear = new Date().getFullYear();

    const kelEkoRes = await sql`
      INSERT INTO kelompok (desa_berdaya_id, nama_kelompok, nama_pembina, master_kelompok_id, program_id, relawan_id, tahun)
      VALUES (${desaId}, 'Kelompok UMKM Maju', 'Budi Santoso', ${mastEkonomiId}, ${progEkonomiId}, ${relawanId}, ${currentYear})
      RETURNING id
    `;
    kelEkonomiId = kelEkoRes[0].id;

    const kelKesRes = await sql`
      INSERT INTO kelompok (desa_berdaya_id, nama_kelompok, nama_pembina, master_kelompok_id, program_id, relawan_id, tahun)
      VALUES (${desaId}, 'Kelompok Posyandu Sehat', 'Budi Santoso', ${mastKesehatanId}, ${progKesehatanId}, ${relawanId}, ${currentYear})
      RETURNING id
    `;
    kelKesehatanId = kelKesRes[0].id;

    console.log('✅ Kelompok Ekonomi dan Kesehatan berhasil dibuat untuk desa terkait.');

    // 6. Penerima Manfaat (10 Ekonomi, 10 Kesehatan)
    console.log('⏳ Membuat 20 Penerima Manfaat...');
    const pmEkonomiIds = [];
    for (let i = 1; i <= 10; i++) {
      const nik = '320101' + Math.floor(1000000000 + Math.random() * 9000000000).toString();
      const res = await sql`
        INSERT INTO penerima_manfaat (desa_berdaya_id, nik, nama, kategori_pm)
        VALUES (${desaId}, ${nik}, 'Anggota Ekonomi ' || ${i}, 'EKONOMI')
        RETURNING id
      `;
      pmEkonomiIds.push(res[0].id);
    }

    const pmKesehatanIds = [];
    for (let i = 1; i <= 10; i++) {
        // Bergantian LANSIA / BALITA / BUMIL
      const kat = i % 3 === 0 ? 'LANSIA' : (i % 2 === 0 ? 'BALITA' : 'BUMIL');
      const nik = '320102' + Math.floor(1000000000 + Math.random() * 9000000000).toString();
      const res = await sql`
        INSERT INTO penerima_manfaat (desa_berdaya_id, nik, nama, kategori_pm)
        VALUES (${desaId}, ${nik}, 'Anggota Kesehatan ' || ${i}, ${kat})
        RETURNING id
      `;
      pmKesehatanIds.push(res[0].id);
    }

    // 7. Anggota Kelompok
    for (const pm of pmEkonomiIds) {
      await sql`INSERT INTO kelompok_anggota (kelompok_id, penerima_manfaat_id) VALUES (${kelEkonomiId}, ${pm})`;
    }
    for (const pm of pmKesehatanIds) {
      await sql`INSERT INTO kelompok_anggota (kelompok_id, penerima_manfaat_id) VALUES (${kelKesehatanId}, ${pm})`;
    }

    console.log('✅ Anggota kelompok berhasil ditambahkan.');

    // 8. Generate 12 Months Update
    console.log('⏳ Meng-generate To-Do List 12 Bulan (Pending) untuk tiap anggota...');
    for (const pm_id of pmEkonomiIds) {
      for (let month = 1; month <= 12; month++) {
        // Create 1 done record, 11 pending to show variety? No, user asks for all pending initially or mixed? 
        // "kalo yang belum di isi bikin pending". We will make all 12 pending.
        await sql`
          INSERT INTO ekonomi_update (
            tahun, bulan, checked, penerima_manfaat_id, operator_id,
            kategori, tipe, komoditas_produk, status_gk, program,
            jumlah_tanggungan, modal, pengeluaran_operasional, omzet, pendapatan, pendapatan_lainnya, nilai_ntp
          ) VALUES (
            ${currentYear}, ${month}, false, ${pm_id}, ${relawanId},
            '-', '-', '-', '-', '-',
            0, 0, 0, 0, 0, 0, 0
          )
        `;
      }
    }

    for (const pm_id of pmKesehatanIds) {
      for (let month = 1; month <= 12; month++) {
        await sql`
          INSERT INTO kesehatan_update (
            tahun, bulan, checked, penerima_manfaat_id, operator_id,
            anak_bb_lahir, anak_tinggi_badan, anak_berat_badan, anak_ke, anak_asi_eksklusif,
            anak_lingkar_kepala, ibu_bb_sebelum_hamil, ibu_tinggi_badan, ibu_berat_badan, ibu_lila, ibu_umur_kehamilan,
            lansia_tinggi_badan, lansia_berat_badan, lansia_kolesterol, lansia_gula, lansia_asam_urat
          ) VALUES (
            ${currentYear}, ${month}, false, ${pm_id}, ${relawanId},
            0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
          )
        `;
      }
    }

    console.log('🎉 Selesai! Seed data sukses dibuat.');
    
  } catch (error) {
    console.error('❌ Terjadi kesalahan saat seeding:', error);
  } finally {
    await sql.end();
  }
}

runSeed();
