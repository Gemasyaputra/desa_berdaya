require("dotenv").config({ path: ".env" });
const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  try {
    await pool.query(`
      UPDATE relawan 
      SET 
        tempat_lahir = 'Tasikmalaya',
        tanggal_lahir = '1990-05-15',
        jenis_kelamin = 'Laki-laki',
        alamat = 'Kp. Sukahurip Rt 011 Rw 06 Ds. Simpang Kec. Bantarkalong Kab. Tasikmalaya Jawa Barat',
        nomor_induk = '200201316',
        ketokohan = 'Ketua Pemuda',
        cabang_dbf = 'Bandung',
        tipe_relawan = 'Relawan Inspirasi',
        bank = 'BRI',
        nomor_rekening = '437201045203539',
        atas_nama = 'Budi Santoso',
        nomor_ktp = '3206081505850005',
        nomor_kk = '3206081505850001',
        pendidikan = 'S1 Manajemen',
        pekerjaan = 'Wiraswasta',
        jabatan_desa = 'Relawan Inspirasi',
        keahlian = 'Pemberdayaan Ekonomi',
        status_edukasi = 'Selesai',
        coa_kafalah = '501.03.002.001',
        nama_coa_kafalah = 'Beban Gaji',
        akun_facebook = 'fb.com/budisantoso',
        akun_twitter = '@budisantoso',
        akun_instagram = '@budi.santoso90'
      WHERE nama ILIKE '%budi santoso%'
    `);
    console.log("Data Budi Santoso berhasil di-update!");
  } catch (err) {
    console.error(err);
  } finally {
    pool.end();
  }
}
run();
