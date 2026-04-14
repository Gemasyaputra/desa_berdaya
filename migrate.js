require('dotenv').config({path: '.env.local'});
const { sql } = require('@vercel/postgres');
async function migrate() {
  try {
    const res = await sql`ALTER TABLE intervensi_anggaran ADD COLUMN kegiatan_terkait JSONB DEFAULT '[]'::jsonb;`;
    console.log("Success", res);
  } catch (err) {
    if (err.message.includes('already exists')) {
      console.log('Column already exists');
    } else {
      console.error(err);
    }
  }
}
migrate();
