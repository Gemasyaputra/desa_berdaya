require("dotenv").config({ path: ".env" });
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function check() {
  const res = await pool.query("SELECT * FROM kategori_program");
  console.log("Kategori:", res.rows);
  const prog = await pool.query("SELECT * FROM program");
  console.log("Programs:", prog.rows);
  pool.end();
}

check();
