import 'dotenv/config'
import { sql } from '../lib/db'

async function run() {
  try {
    const desaBerdayaId = 1;
    
    // Get valid IDs
    const katRes = await sql`SELECT id FROM kategori_program LIMIT 1`
    const progRes = await sql`SELECT id FROM program LIMIT 1`
    const relRes = await sql`SELECT id FROM users WHERE role = 'RELAWAN' LIMIT 1`
    
    const kategoriProgramId = Array.isArray(katRes) && katRes.length > 0 ? katRes[0].id : null;
    const programId = Array.isArray(progRes) && progRes.length > 0 ? progRes[0].id : null;
    const relawanId = Array.isArray(relRes) && relRes.length > 0 ? relRes[0].id : null;
    
    console.log("Mulai membuat Action Plan dummy...");
    const apResult = await sql`
      INSERT INTO action_plans (
        desa_berdaya_id, kategori_program, pilihan_program, tahun_aktivasi, total_ajuan, status, created_at, updated_at
      ) VALUES (
        ${desaBerdayaId}, 'EKONOMI', 'Agrobisnis', 2026, 15000000, 'APPROVED', NOW(), NOW()
      ) RETURNING id
    `
    const actionPlanId = Array.isArray(apResult) ? apResult[0].id : (apResult as any).id;
    console.log(`Action Plan berhasil dibuat dengan ID: ${actionPlanId}`);
    
    // RAB
    const actResult = await sql`
      INSERT INTO action_plan_activities (action_plan_id, bulan_implementasi, uraian_kebutuhan, nominal_rencana)
      VALUES 
      (${actionPlanId}, '5', 'Pembelian Pupuk Subsidi', 1500000)
      RETURNING id
    `

    console.log("Mulai membuat Intervensi Program yang berelasi...");
    const lapResult = await sql`
      INSERT INTO intervensi_program (
        desa_berdaya_id,
        kategori_program_id,
        program_id,
        deskripsi,
        sumber_dana,
        fundraiser,
        relawan_id,
        status,
        action_plan_id,
        created_at
      ) VALUES (
        ${desaBerdayaId},
        ${kategoriProgramId},
        ${programId},
        'Program Agrobisnis untuk desa binaan (relasi Action Plan)',
        'Reguler',
        'Zakatku',
        ${relawanId},
        'DRAFT',
        ${actionPlanId},
        NOW()
      ) RETURNING id
    `
    const intervensiId = Array.isArray(lapResult) ? lapResult[0].id : (lapResult as any).id;
    console.log(`Intervensi Program berhasil dibuat dengan ID: ${intervensiId}`);
    
    console.log("==================================================");
    console.log("✅ Seeding sukses! Anda dapat mengetes fitur shortcut:");
    console.log(`1. Cek Action Plan Detail: http://localhost:3000/dashboard/action-plan/${actionPlanId}`);
    console.log(`2. Cek Intervensi Program: http://localhost:3000/dashboard/intervensi/${intervensiId}`);
    console.log("==================================================");

    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}
run()
