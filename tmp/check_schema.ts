
import { neon } from '@neondatabase/serverless';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(__dirname, '../.env') });
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const sql = neon(process.env.DATABASE_URL!);

async function checkSchema() {
  try {
    const result = await sql`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'laporan_kegiatan' AND column_name = 'kelompok_id';
    `;
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error(err);
  }
}

checkSchema();
