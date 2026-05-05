import { sql } from '../lib/db'

async function run() {
  try {
    const desaBerdayaId = 1;
    
    // 1. EKONOMI
    const apEkonomi = await sql`
      INSERT INTO action_plans (
        desa_berdaya_id, kategori_program, pilihan_program, tahun_aktivasi, total_ajuan, status, created_at, updated_at
      ) VALUES (
        ${desaBerdayaId}, 'EKONOMI', 'Agrobisnis', 2026, 30000000, 'APPROVED', NOW(), NOW()
      ) RETURNING id
    `
    const idEkon = Array.isArray(apEkonomi) ? apEkonomi[0].id : (apEkonomi as any).id
    
    // RAB Ekonomi
    await sql`
      INSERT INTO action_plan_activities (action_plan_id, bulan_implementasi, uraian_kebutuhan, nominal_rencana, jumlah_unit, frekuensi, harga_satuan)
      VALUES 
      (${idEkon}, 'Januari', 'Bantuan Modal Usaha Pertanian', 15000000, 5, 1, 3000000),
      (${idEkon}, 'Februari', 'Pelatihan Keterampilan Tani', 5000000, 10, 1, 500000)
    `
    // PM Ekonomi
    await sql`
      INSERT INTO action_plan_beneficiaries (action_plan_id, pm_id, penghasilan_awal, tanggungan, status_gk, status_hk, selisih_gk, nib_halal)
      VALUES 
      (${idEkon}, 1, 1000000, 4, '2331728', '3760676', '1331728', 'NIB-12345'),
      (${idEkon}, 2, 1200000, 3, '1748796', '2820507', '548796', 'NIB-67890')
    `

    // 2. PENDIDIKAN
    const apPend = await sql`
      INSERT INTO action_plans (
        desa_berdaya_id, kategori_program, pilihan_program, tahun_aktivasi, total_ajuan, status, fokus_program, jumlah_pp, jumlah_pengajar
      ) VALUES (
        ${desaBerdayaId}, 'PENDIDIKAN', 'Bina Anak Pintar', 2026, 12000000, 'WAITING_APPROVAL', 'Peningkatan Literasi', 50, 5
      ) RETURNING id
    `
    const idPend = Array.isArray(apPend) ? apPend[0].id : (apPend as any).id
    await sql`
      INSERT INTO action_plan_activities (action_plan_id, bulan_implementasi, uraian_kebutuhan, nominal_rencana)
      VALUES 
      (${idPend}, 'Maret', 'Pengadaan Buku Tulis & Alat Tulis', 2000000),
      (${idPend}, 'April', 'Honor Pengajar Relawan', 10000000)
    `

    // 3. KESEHATAN
    const apKes = await sql`
      INSERT INTO action_plans (
        desa_berdaya_id, kategori_program, pilihan_program, tahun_aktivasi, total_ajuan, status, cakupan_program, sasaran_program, jumlah_pp, keterangan_se
      ) VALUES (
        ${desaBerdayaId}, 'KESEHATAN', 'Posyandu Lansia', 2026, 15000000, 'APPROVED', 'Tingkat Desa', 'Lansia diatas 60 tahun', 30, 'Menggandeng puskesmas setempat untuk rutin checkup'
      ) RETURNING id
    `
    const idKes = Array.isArray(apKes) ? apKes[0].id : (apKes as any).id
    await sql`
      INSERT INTO action_plan_activities (action_plan_id, bulan_implementasi, uraian_kebutuhan, nominal_rencana)
      VALUES 
      (${idKes}, 'Mei', 'Pemberian Makanan Tambahan Lansia', 5000000),
      (${idKes}, 'Juni', 'Cek Gula Darah & Kolesterol Gratis', 10000000)
    `

    // 4. LINGKUNGAN
    const apLingk = await sql`
      INSERT INTO action_plans (
        desa_berdaya_id, kategori_program, pilihan_program, tahun_aktivasi, total_ajuan, status, cakupan_program, legalitas, jenis_sampah, kapasitas_pengelolaan, keterangan_se
      ) VALUES (
        ${desaBerdayaId}, 'LINGKUNGAN', 'Bank Sampah', 2026, 8000000, 'REVISION', 'Tingkat RT/RW', 'SK Kepala Desa', 'Plastik & Organik', 1000, 'Kerjasama dengan pengepul rongsok'
      ) RETURNING id
    `
    const idLingk = Array.isArray(apLingk) ? apLingk[0].id : (apLingk as any).id
    await sql`
      INSERT INTO action_plan_activities (action_plan_id, bulan_implementasi, uraian_kebutuhan, nominal_rencana)
      VALUES 
      (${idLingk}, 'Juli', 'Pembuatan Bak Komposter', 3000000),
      (${idLingk}, 'Agustus', 'Beli Timbangan & Buku Tabungan', 5000000)
    `

    console.log('Seeding Action Plans Sukses!')
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}
run()
