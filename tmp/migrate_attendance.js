
const { neon } = require('@neondatabase/serverless');
const dotenv = require('dotenv');
const { resolve } = require('path');

dotenv.config({ path: resolve(__dirname, '../.env') });
dotenv.config({ path: resolve(__dirname, '../.env.local') });

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  try {
    console.log("Checking if penerima_manfaat_ids column exists...");
    const checkColumn = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'laporan_kegiatan' AND column_name = 'penerima_manfaat_ids';
    `;

    if (checkColumn.length === 0) {
      console.log("Adding penerima_manfaat_ids (BIGINT[]) to laporan_kegiatan...");
      await sql`
        ALTER TABLE laporan_kegiatan 
        ADD COLUMN penerima_manfaat_ids BIGINT[] DEFAULT '{}';
      `;
      console.log("Migration successful.");
    } else {
      console.log("Column penerima_manfaat_ids already exists. Skipping migration.");
    }
  } catch (err) {
    console.error("Migration failed:", err);
  }
}

migrate();
