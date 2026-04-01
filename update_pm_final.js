require("dotenv").config({ path: ".env" });
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const firstNamesL = ["Ahmad", "Budi", "Candra", "Dedi", "Eko", "Fahmi", "Gilang", "Hendra", "Iwan", "Joko"];
const firstNamesP = ["Ayu", "Bunga", "Citra", "Desi", "Eka", "Fitri", "Gita", "Hani", "Indah", "Siti"];
const lastNames = ["Saputra", "Wijaya", "Pratama", "Santoso", "Kurniawan", "Setiawan", "Lestari", "Hidayat", "Rahman", "Wahyuni"];
const places = ["Bandung", "Jakarta", "Surabaya", "Medan", "Semarang", "Yogyakarta", "Makassar", "Palembang", "Denpasar", "Malang"];
const jobs = ["Wiraswasta", "PNS", "Karyawan Swasta", "Petani", "Buruh", "Ibu Rumah Tangga", "Pelajar/Mahasiswa", "Guru", "Pedagang", "Nelayan", "Wirausaha"];
const streets = ["Jl. Merdeka", "Jl. Sudirman", "Jl. Diponegoro", "Jl. Ahmad Yani", "Jl. Pahlawan", "Jl. Veteran", "Jl. Gajah Mada", "Jl. Hasanuddin", "Jl. Pattimura", "Jl. Cut Nyak Dien"];

function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randDate() {
  const start = new Date(1960, 0, 1).getTime();
  const end = new Date(2015, 0, 1).getTime();
  const date = new Date(start + Math.random() * (end - start));
  return date.toISOString().split('T')[0];
}

async function updateData() {
  try {
    const res = await pool.query("SELECT id, nama, jenis_kelamin FROM penerima_manfaat WHERE tempat_lahir IS NULL OR tempat_lahir = '-' OR nama LIKE '%Anggota%'");
    console.log(`Found ${res.rows.length} records to update.`);

    for (const row of res.rows) {
      const isLaki = row.nama.includes("(L)") || (!row.jenis_kelamin ? Math.random() > 0.5 : row.jenis_kelamin.toUpperCase() === 'LAKI-LAKI');
      const firstName = isLaki ? rand(firstNamesL) : rand(firstNamesP);
      const lastName = rand(lastNames);
      const fullName = `${firstName} ${lastName}`;
      const genderStr = isLaki ? 'Laki-laki' : 'Perempuan';
      
      const tmpLahir = rand(places);
      const tglLahir = randDate();
      const goldar = rand(["A", "B", "AB", "O", "-"]);
      
      const alamat = `${rand(streets)} No. ${Math.floor(Math.random() * 100) + 1}`;
      const rtrw = `0${Math.floor(Math.random() * 9) + 1}/0${Math.floor(Math.random() * 9) + 1}`;
      const agama = "Islam";
      const statusP = rand(["Belum Kawin", "Kawin", "Cerai Hidup", "Cerai Mati"]);
      const pek = rand(jobs);
      
      const nik = "32010" + Math.floor(10000000000 + Math.random() * 90000000000).toString().substring(0, 11);

      await pool.query(`
        UPDATE penerima_manfaat 
        SET 
          nama = $1,
          jenis_kelamin = $2,
          tempat_lahir = $3,
          tanggal_lahir = $4,
          golongan_darah = $5,
          alamat = $6,
          rt_rw = $7,
          kel_desa = 'Desa Contoh',
          kecamatan = 'Kecamatan Contoh',
          agama = $8,
          status_perkawinan = $9,
          pekerjaan = $10,
          kewarganegaraan = 'WNI',
          nik = $11
        WHERE id = $12
      `, [fullName, genderStr, tmpLahir, tglLahir, goldar, alamat, rtrw, agama, statusP, pek, nik, row.id]);
    }
    console.log("Successfully updated dummy data with realistic identities.");
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}

updateData();
