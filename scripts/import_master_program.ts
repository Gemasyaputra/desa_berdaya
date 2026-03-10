import * as dotenv from 'dotenv';
import postgres from 'postgres';
import * as xlsx from 'xlsx';

// Load environment variables (.env)
dotenv.config({ path: '.env.local' });
dotenv.config();

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL!;
const sql = postgres(connectionString);

async function importMasterProgram() {
  console.log('🚀 Memulai proses import Master Program dari Excel...');

  try {
    const wb = xlsx.readFile('model master_program.xlsx');
    const wsname = wb.SheetNames[0];
    const ws = wb.Sheets[wsname];
    const data = xlsx.utils.sheet_to_json<any>(ws);

    if (data.length === 0) {
      console.log('⚠️ File excel kosong atau format salah.');
      return;
    }

    // 1. Dapatkan daftar unik kategori
    const kategoriSet = new Set<string>();
    data.forEach(row => {
      if (row['Kategori Program']) {
        kategoriSet.add(row['Kategori Program'].trim());
      }
    });

    const mapKategoriId = new Map<string, number>();

    console.log(`📌 Ditemukan ${kategoriSet.size} kategori unik. Sedang diproses...`);

    // 2. Insert Kategori dan ambil ID
    for (const namaKategori of kategoriSet) {
      // Cek apakah sudah ada
      const existing = await sql`SELECT id FROM kategori_program WHERE nama_kategori = ${namaKategori}`;
      
      let katId;
      if (existing.length > 0) {
        katId = existing[0].id;
        console.log(`✔️  Kategori '${namaKategori}' sudah ada (ID: ${katId})`);
      } else {
        const result = await sql`
          INSERT INTO kategori_program (nama_kategori) 
          VALUES (${namaKategori}) 
          RETURNING id
        `;
        katId = result[0].id;
        console.log(`➕ Kategori '${namaKategori}' ditambahkan (ID: ${katId})`);
      }
      mapKategoriId.set(namaKategori, katId);
    }

    console.log(`\n📌 Memproses ${data.length} program...`);

    // 3. Insert Program
    let insertCount = 0;
    let existCount = 0;

    for (const row of data) {
      const namaKategori = row['Kategori Program']?.trim();
      const namaProgram = row['Nama Program']?.trim();

      if (!namaKategori || !namaProgram) continue;

      const katId = mapKategoriId.get(namaKategori);
      if (!katId) continue;

      // Cek apakah program sudah ada untuk kategori yang sama
      const existingProg = await sql`
        SELECT id FROM program 
        WHERE kategori_id = ${katId} AND nama_program = ${namaProgram}
      `;

      if (existingProg.length > 0) {
        existCount++;
      } else {
        await sql`
          INSERT INTO program (kategori_id, nama_program)
          VALUES (${katId}, ${namaProgram})
        `;
        insertCount++;
      }
    }

    console.log(`\n✅ Import selesai!`);
    console.log(`   - Kategori diproses: ${kategoriSet.size}`);
    console.log(`   - Program baru ditambahkan: ${insertCount}`);
    console.log(`   - Program sudah ada (dilewati): ${existCount}`);

  } catch (error) {
    console.error('❌ Terjadi kesalahan saat import:', error);
  } finally {
    await sql.end();
  }
}

importMasterProgram();
