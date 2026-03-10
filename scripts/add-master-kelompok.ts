import * as dotenv from 'dotenv';
import postgres from 'postgres';
import { drizzle } from 'drizzle-orm/postgres-js';

dotenv.config({ path: '.env.local' });
dotenv.config();

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL!;
const sql = postgres(connectionString);
const db = drizzle(sql);

async function runMigration() {
  console.log('⏳ Memulai proses migrasi tabel master_kelompok...');

  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS master_kelompok (
          id BIGSERIAL PRIMARY KEY,
          nama_kelompok VARCHAR(255) NOT NULL UNIQUE,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('✅ Migrasi tabel master_kelompok berhasil diselesaikan!');
  } catch (error) {
    console.error('❌ Gagal melakukan migrasi:', error);
  } finally {
    await sql.end();
  }
}

runMigration();
