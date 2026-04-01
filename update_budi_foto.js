require("dotenv").config({ path: ".env" });
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    await pool.query(`
      UPDATE relawan 
      SET foto_url = 'https://i.pravatar.cc/150?u=budisantoso'
      WHERE nama ILIKE '%budi santoso%'
    `);
    console.log("Foto Budi Santoso berhasil di-update!");
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
