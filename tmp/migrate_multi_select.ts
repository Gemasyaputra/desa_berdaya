
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env') });
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const sql = neon(process.env.DATABASE_URL!);

async function migrate() {
  try {
    console.log("Checking if kelompok_ids column exists...");
    const checkColumn = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'laporan_kegiatan' AND column_name = 'kelompok_ids';
    `;

    if (checkColumn.length === 0) {
      console.log("Migrating kelompok_id to kelompok_ids (BIGINT[])...");
      await sql`
        ALTER TABLE laporan_kegiatan 
        RENAME COLUMN kelompok_id TO kelompok_id_old;
      `;
      
      await sql`
        ALTER TABLE laporan_kegiatan 
        ADD COLUMN kelompok_ids BIGINT[] DEFAULT '{}';
      `;

      await sql`
        UPDATE laporan_kegiatan 
        SET kelompok_ids = ARRAY[kelompok_id_old]::BIGINT[] 
        WHERE kelompok_id_old IS NOT NULL;
      `;

      await sql`
        ALTER TABLE laporan_kegiatan 
        DROP COLUMN kelompok_id_old;
      `;
      
      console.log("Migration successful.");
    } else {
      console.log("Column kelompok_ids already exists. Skipping migration.");
    }
  } catch (err) {
    console.error("Migration failed:", err);
  }
}

migrate();
