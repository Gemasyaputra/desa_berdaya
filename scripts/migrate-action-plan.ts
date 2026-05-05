import * as dotenv from 'dotenv';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

// Load environment variables (.env)
dotenv.config({ path: '.env.local' });
dotenv.config();

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL!;
const sql = postgres(connectionString);
const db = drizzle(sql);

async function runMigration() {
  console.log('⏳ Memulai proses migrasi fitur Action Plan...');

  try {
    await db.execute(`
      -- 1. Buat Custom Types (Enum) untuk status
      DO $$ BEGIN
          CREATE TYPE action_plan_status AS ENUM ('WAITING_APPROVAL', 'APPROVED', 'REVISION');
      EXCEPTION
          WHEN duplicate_object THEN null;
      END $$;

      -- 2. Tabel action_plans (Tabel Induk Perencanaan)
      CREATE TABLE IF NOT EXISTS action_plans (
          id BIGSERIAL PRIMARY KEY,
          desa_berdaya_id BIGINT NOT NULL REFERENCES desa_berdaya(id) ON DELETE CASCADE,
          kategori_program VARCHAR(50) NOT NULL, -- EKONOMI, PENDIDIKAN, KESEHATAN, LINGKUNGAN
          pilihan_program VARCHAR(255),
          tahun_aktivasi INT NOT NULL,
          status action_plan_status DEFAULT 'WAITING_APPROVAL',
          total_ajuan BIGINT NOT NULL DEFAULT 0,
          
          -- Field Opsional (berdasarkan jenis program)
          keterangan_se TEXT,
          jenis_sampah VARCHAR(255),
          kapasitas_pengelolaan INT,
          jumlah_pengajar INT,
          jumlah_pp INT,
          fokus_program VARCHAR(255),
          cakupan_program VARCHAR(255),
          sasaran_program VARCHAR(255),
          legalitas VARCHAR(255),
          
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      -- 3. Tabel action_plan_activities (Tabel Rincian RAB)
      CREATE TABLE IF NOT EXISTS action_plan_activities (
          id BIGSERIAL PRIMARY KEY,
          action_plan_id BIGINT NOT NULL REFERENCES action_plans(id) ON DELETE CASCADE,
          bulan_implementasi VARCHAR(50) NOT NULL,
          uraian_kebutuhan VARCHAR(255) NOT NULL,
          nominal_rencana BIGINT NOT NULL,
          
          -- Khusus Program Ekonomi
          jumlah_unit INT,
          frekuensi INT,
          harga_satuan BIGINT
      );

      -- 4. Tabel action_plan_beneficiaries (Tabel PM Khusus Ekonomi)
      CREATE TABLE IF NOT EXISTS action_plan_beneficiaries (
          id BIGSERIAL PRIMARY KEY,
          action_plan_id BIGINT NOT NULL REFERENCES action_plans(id) ON DELETE CASCADE,
          pm_id BIGINT NOT NULL REFERENCES penerima_manfaat(id) ON DELETE CASCADE,
          penghasilan_awal BIGINT
      );

      -- 5. Modifikasi tabel laporan_kegiatan (Intervensi)
      -- Menambahkan relasi ke Action Plan
      ALTER TABLE laporan_kegiatan
      ADD COLUMN IF NOT EXISTS action_plan_id BIGINT REFERENCES action_plans(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS action_plan_activity_id BIGINT REFERENCES action_plan_activities(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS nominal_aktual BIGINT;
    `);

    console.log('✅ Migrasi tabel Action Plan berhasil diselesaikan!');
  } catch (error) {
    console.error('❌ Gagal melakukan migrasi:', error);
  } finally {
    await sql.end();
  }
}

runMigration();
