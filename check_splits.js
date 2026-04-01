require("dotenv").config({ path: ".env" });
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function check() {
  const res = await pool.query(`
    SELECT id, judul_kegiatan, jumlah_pm_laki, jumlah_pm_perempuan, jumlah_kelompok_laki, jumlah_kelompok_perempuan, jumlah_pm_total 
    FROM laporan_kegiatan 
    WHERE jumlah_pm_total > 0 
    AND jumlah_pm_laki = 0 AND jumlah_pm_perempuan = 0 AND jumlah_kelompok_laki = 0 AND jumlah_kelompok_perempuan = 0
  `);
  console.log("Reports with 0 split but >0 total:", res.rows);
  pool.end();
}
check();
