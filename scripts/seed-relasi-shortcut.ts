import 'dotenv/config'
import { sql } from '../lib/db'

async function run() {
  try {
    const desaBerdayaId = 1;
    
    console.log("Mulai membuat Action Plan dummy...");
    const apResult = await sql`
      INSERT INTO action_plans (
        desa_berdaya_id, kategori_program, pilihan_program, tahun_aktivasi, total_ajuan, status, created_at, updated_at
      ) VALUES (
        ${desaBerdayaId}, 'KESEHATAN', 'Posyandu Balita Sehat', 2026, 5000000, 'APPROVED', NOW(), NOW()
      ) RETURNING id
    `
    const actionPlanId = Array.isArray(apResult) ? apResult[0].id : (apResult as any).id;
    console.log(`Action Plan berhasil dibuat dengan ID: ${actionPlanId}`);
    
    // RAB
    const actResult = await sql`
      INSERT INTO action_plan_activities (action_plan_id, bulan_implementasi, uraian_kebutuhan, nominal_rencana)
      VALUES 
      (${actionPlanId}, '5', 'Pemberian PMT Balita', 2500000)
      RETURNING id
    `
    const activityId = Array.isArray(actResult) ? actResult[0].id : (actResult as any).id;
    console.log(`Aktivitas RAB berhasil dibuat dengan ID: ${activityId}`);

    console.log("Mulai membuat Laporan Kegiatan (Intervensi) yang berelasi...");
    const lapResult = await sql`
      INSERT INTO laporan_kegiatan (
        desa_berdaya_id,
        jenis_kegiatan,
        judul_kegiatan,
        deskripsi,
        total_realisasi,
        tanggal_kegiatan,
        sasaran_program,
        lokasi_pelaksanaan,
        jumlah_pm_laki,
        jumlah_pm_perempuan,
        jumlah_pm_total,
        action_plan_id,
        action_plan_activity_id,
        nominal_aktual,
        created_at
      ) VALUES (
        ${desaBerdayaId},
        'KESEHATAN',
        'Penyaluran PMT Balita Posyandu',
        'Kegiatan penyaluran Makanan Tambahan (PMT) untuk balita di balai desa. Semua berjalan lancar dan dananya terserap sesuai anggaran RAB.',
        2500000,
        NOW(),
        'Balita',
        'Balai Desa',
        10,
        15,
        25,
        ${actionPlanId},
        ${activityId},
        2500000,
        NOW()
      ) RETURNING id
    `
    const laporanId = Array.isArray(lapResult) ? lapResult[0].id : (lapResult as any).id;
    console.log(`Laporan Kegiatan berhasil dibuat dengan ID: ${laporanId}`);
    
    console.log("==================================================");
    console.log("✅ Seeding sukses! Anda dapat mengetes fitur shortcut:");
    console.log(`1. Cek Action Plan Detail: http://localhost:3000/dashboard/action-plan/${actionPlanId}`);
    console.log(`2. Cek Laporan Intervensi: http://localhost:3000/dashboard/laporan-kegiatan/${laporanId}`);
    console.log("==================================================");

    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}
run()
