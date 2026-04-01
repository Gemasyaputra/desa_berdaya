require("dotenv").config({ path: ".env" });
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function fix() {
  try {
    // 1. Reassign programs from kategori '1' (lowercase) to '2' (uppercase)
    await pool.query("UPDATE program SET kategori_id = 2 WHERE kategori_id = 1");
    console.log("Updated programs to use Kategori 2 (Kesehatan)");

    // 2. Delete the duplicate kategori '1'
    await pool.query("DELETE FROM kategori_program WHERE id = 1");
    console.log("Deleted duplicate kategori_program ID 1 (kesehatan)");

  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

fix();
