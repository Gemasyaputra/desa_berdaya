import * as dotenv from 'dotenv';
import postgres from 'postgres';

// Load environment variables (.env)
dotenv.config({ path: '.env.local' });
dotenv.config();

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL!;
const sql = postgres(connectionString);

const KATEGORI_KELOMPOK = [
  "Majelis Taklim",
  "Desa Bebas Stunting",
  "Rumah Literasi",
  "Rumah Quran",
  "Rumah P2M",
  "Ramah Lansia",
  "Bank Sampah",
  "Microfinance Berdaya",
  "Bantuan Berdaya",
  "Bantuan Kewirausahaan",
  "Bantuan Modal BUMMas",
  "Rumah Vokasi",
  "Desa Tangguh Pesisir",
  "Vokasi",
  "Gerakan Shubuh Berjamaah",
  "Pembinaan Pekanan Non Program",
  "Pembinaan Pekanan Program"
];

async function importKategoriKelompok() {
  console.log('🚀 Memulai proses import Kategori Kelompok...');

  try {
    let insertCount = 0;
    let existCount = 0;

    for (const kategori of KATEGORI_KELOMPOK) {
      // Check if exists
      const existing = await sql`
        SELECT id FROM master_kelompok
        WHERE nama_kelompok = ${kategori}
      `;

      if (existing.length > 0) {
        existCount++;
        console.log(`✔️  Kategori '${kategori}' sudah ada. Dibiarkan.`);
      } else {
        await sql`
          INSERT INTO master_kelompok (nama_kelompok, program_id)
          VALUES (${kategori}, NULL)
        `;
        insertCount++;
        console.log(`➕ Kategori '${kategori}' berhasil ditambahkan.`);
      }
    }

    console.log(`\n✅ Selesai!`);
    console.log(`   - Kategori Teks Baru: ${insertCount}`);
    console.log(`   - Dibiarkan Saja (Sudah ada): ${existCount}`);

  } catch (error) {
    console.error('❌ Error saat mengimport:', error);
  } finally {
    await sql.end();
  }
}

importKategoriKelompok();
