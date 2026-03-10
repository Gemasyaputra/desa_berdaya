import * as dotenv from 'dotenv';
import postgres from 'postgres';

dotenv.config({ path: '.env.local' });
dotenv.config();

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL!;
const sql = postgres(connectionString);

async function seedKelompok() {
  console.log('🌱 Seeding data Kelompok & Anggota...');

  try {
    // 1. Ambil data desa_berdaya yang sudah dised
    const desaBerdayaList = await sql`
      SELECT id, relawan_id 
      FROM desa_berdaya 
      WHERE status_aktif = true
      LIMIT 16
    `;

    if (desaBerdayaList.length === 0) {
      console.log('⚠️ Tidak ada desa_berdaya yang ditemukan. Harap jalankan seed-hierarchy.');
      return;
    }

    // 2. Ambil data program
    const programList = await sql`SELECT id FROM program LIMIT 5`;

    // 3. Ambil master_kelompok (Perhatikan nama kolom: nama_kelompok)
    const masterKelompokList = await sql`SELECT id FROM master_kelompok LIMIT 5`;

    const kelompokPool = [
      'Kelompok Tani Harapan', 'Kelompok Wanita Mandiri', 'Kelompok Bakti Utama',
      'Kelompok Sadar Lingkungan', 'Kelompok Pemuda Bangkit', 'Kelompok Kriya Indah',
      'Kelompok Peternak Makmur', 'Kelompok Budidaya Mandiri'
    ];
    const pembinaPool = ['Bpk. Agus', 'Ibu Siti', 'Pdn. Rahmat', 'Ust. Lukman', 'Ibu Ani'];

    let countKelompok = 0;
    let countAnggota = 0;
    const currentYear = new Date().getFullYear();

    for (const desa of desaBerdayaList) {
      // Ambil PM di desa ini
      const pmList = await sql`
        SELECT id FROM penerima_manfaat WHERE desa_berdaya_id = ${desa.id}
      `;

      for (let i = 0; i < 2; i++) {
        const namaKelompok = kelompokPool[(countKelompok) % kelompokPool.length] + ' ' + (Math.floor(Math.random() * 10) + 1);
        const namaPembina = pembinaPool[countKelompok % pembinaPool.length];
        const programId = programList.length > 0 ? programList[countKelompok % programList.length].id : null;
        const masterKelompokId = masterKelompokList.length > 0 ? masterKelompokList[countKelompok % masterKelompokList.length].id : null;

        const res = await sql`
          INSERT INTO kelompok (
            desa_berdaya_id, relawan_id, program_id, master_kelompok_id,
            tahun, nama_kelompok, nama_pembina
          ) VALUES (
            ${desa.id}, ${desa.relawan_id}, ${programId}, ${masterKelompokId},
            ${currentYear}, ${namaKelompok}, ${namaPembina}
          ) RETURNING id
        `;
        const kelompokId = res[0].id;
        countKelompok++;

        // Masukkan semua PM di desa ini ke dalam kelompok 1, bagi rata jika lebih dari 1 kelompok
        for (const pm of pmList) {
           await sql`
            INSERT INTO kelompok_anggota (kelompok_id, penerima_manfaat_id)
            VALUES (${kelompokId}, ${pm.id})
            ON CONFLICT DO NOTHING
           `;
           countAnggota++;
        }
      }
      console.log(`  ✅ Desa db_id=${desa.id}: +2 Kelompok, +${pmList.length * 2} relasi anggota`);
    }

    console.log(`\n🎉 Berhasil seeding ${countKelompok} Kelompok dan ${countAnggota} data anggota!`);

  } catch (error) {
    console.error('❌ Gagal seeding kelompok:', error);
  } finally {
    await sql.end();
  }
}

seedKelompok();
