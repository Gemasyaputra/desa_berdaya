const { sql } = require('./lib/db');

async function fix() {
  try {
    const res = await sql`
      UPDATE laporan_kegiatan lk 
      SET jenis_kegiatan = (
        SELECT UPPER(kp.nama_kategori) 
        FROM program p 
        JOIN kategori_program kp ON p.kategori_id = kp.id 
        WHERE p.id = lk.program_id
      ) 
      WHERE lk.program_id IS NOT NULL 
      RETURNING *;
    `;
    console.log("Updated rows:", res.length);
  } catch(e) {
    console.error(e);
  } finally {
    process.exit();
  }
}
fix();
