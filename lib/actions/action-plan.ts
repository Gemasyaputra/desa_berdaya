'use server'

import { sql } from '@/lib/db'
import { revalidatePath } from 'next/cache'

// Tipe data berdasarkan skema yang baru saja dibuat
export type ActionPlanStatus = 'WAITING_APPROVAL' | 'APPROVED' | 'REVISION'

export interface ActionPlanInput {
  desa_berdaya_id: number
  kategori_program: string // 'EKONOMI' | 'PENDIDIKAN' | 'KESEHATAN' | 'LINGKUNGAN'
  pilihan_program?: string
  tahun_aktivasi: number
  total_ajuan: number
  keterangan_se?: string
  jenis_sampah?: string
  kapasitas_pengelolaan?: number
  jumlah_pengajar?: number
  jumlah_pp?: number
  fokus_program?: string
  cakupan_program?: string
  sasaran_program?: string
  legalitas?: string
}

export interface ActionPlanActivityInput {
  bulan_implementasi: string
  uraian_kebutuhan: string
  nominal_rencana: number
  jumlah_unit?: number
  frekuensi?: number
  harga_satuan?: number
}

export interface ActionPlanBeneficiaryInput {
  pm_id: number
  penghasilan_awal?: number
  tanggungan?: number
  status_gk?: string
  status_hk?: string
  selisih_gk?: number
  nib_halal?: string
}

/**
 * 1. Membuat Action Plan beserta detail RAB dan PM (Ekonomi)
 */
export async function createActionPlan(
  data: ActionPlanInput,
  activities: ActionPlanActivityInput[],
  beneficiaries?: ActionPlanBeneficiaryInput[]
) {
  try {
    // Insert Data Induk Action Plan
    const result = await sql`
      INSERT INTO action_plans (
        desa_berdaya_id, kategori_program, pilihan_program, tahun_aktivasi, total_ajuan,
        keterangan_se, jenis_sampah, kapasitas_pengelolaan, jumlah_pengajar, jumlah_pp,
        fokus_program, cakupan_program, sasaran_program, legalitas
      ) VALUES (
        ${data.desa_berdaya_id}, ${data.kategori_program}, ${data.pilihan_program || null}, ${data.tahun_aktivasi}, ${data.total_ajuan},
        ${data.keterangan_se || null}, ${data.jenis_sampah || null}, ${data.kapasitas_pengelolaan || null}, ${data.jumlah_pengajar || null}, ${data.jumlah_pp || null},
        ${data.fokus_program || null}, ${data.cakupan_program || null}, ${data.sasaran_program || null}, ${data.legalitas || null}
      )
      RETURNING id
    `
    const actionPlanId = Array.isArray(result) ? result[0].id : (result as any).id

    // Insert Activities (RAB)
    if (activities.length > 0) {
      for (const activity of activities) {
        await sql`
          INSERT INTO action_plan_activities (
            action_plan_id, bulan_implementasi, uraian_kebutuhan, nominal_rencana,
            jumlah_unit, frekuensi, harga_satuan
          ) VALUES (
            ${actionPlanId}, ${activity.bulan_implementasi}, ${activity.uraian_kebutuhan}, ${activity.nominal_rencana},
            ${activity.jumlah_unit || null}, ${activity.frekuensi || null}, ${activity.harga_satuan || null}
          )
        `
      }
    }

    // Insert Beneficiaries Khusus Ekonomi
    if (beneficiaries && beneficiaries.length > 0 && data.kategori_program === 'EKONOMI') {
      for (const beneficiary of beneficiaries) {
        await sql`
          INSERT INTO action_plan_beneficiaries (
            action_plan_id, pm_id, penghasilan_awal, tanggungan, status_gk, status_hk, selisih_gk, nib_halal
          ) VALUES (
            ${actionPlanId}, ${beneficiary.pm_id}, ${beneficiary.penghasilan_awal || null}, 
            ${beneficiary.tanggungan || null}, ${beneficiary.status_gk || null}, ${beneficiary.status_hk || null}, 
            ${beneficiary.selisih_gk || null}, ${beneficiary.nib_halal || null}
          )
        `
      }
    }

    revalidatePath('/dashboard/action-plan')
    return { success: true, actionPlanId }
  } catch (error: any) {
    console.error('Error creating action plan:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 1.5. Mengupdate Action Plan (Untuk Revisi)
 */
export async function updateActionPlan(
  id: number,
  data: ActionPlanInput,
  activities: ActionPlanActivityInput[],
  beneficiaries?: ActionPlanBeneficiaryInput[]
) {
  try {
    // 1. Update main record & set status back to WAITING_APPROVAL
    await sql`
      UPDATE action_plans SET 
        kategori_program = ${data.kategori_program},
        pilihan_program = ${data.pilihan_program || null},
        tahun_aktivasi = ${data.tahun_aktivasi},
        total_ajuan = ${data.total_ajuan},
        keterangan_se = ${data.keterangan_se || null},
        jenis_sampah = ${data.jenis_sampah || null},
        kapasitas_pengelolaan = ${data.kapasitas_pengelolaan || null},
        jumlah_pengajar = ${data.jumlah_pengajar || null},
        jumlah_pp = ${data.jumlah_pp || null},
        fokus_program = ${data.fokus_program || null},
        cakupan_program = ${data.cakupan_program || null},
        sasaran_program = ${data.sasaran_program || null},
        legalitas = ${data.legalitas || null},
        status = 'WAITING_APPROVAL',
        updated_at = NOW()
      WHERE id = ${id}
    `

    // 2. Delete old relations
    await sql`DELETE FROM action_plan_activities WHERE action_plan_id = ${id}`
    await sql`DELETE FROM action_plan_beneficiaries WHERE action_plan_id = ${id}`

    // 3. Insert new activities
    if (activities.length > 0) {
      for (const activity of activities) {
        await sql`
          INSERT INTO action_plan_activities (
            action_plan_id, bulan_implementasi, uraian_kebutuhan, nominal_rencana,
            jumlah_unit, frekuensi, harga_satuan
          ) VALUES (
            ${id}, ${activity.bulan_implementasi}, ${activity.uraian_kebutuhan}, ${activity.nominal_rencana},
            ${activity.jumlah_unit || null}, ${activity.frekuensi || null}, ${activity.harga_satuan || null}
          )
        `
      }
    }

    // 4. Insert new beneficiaries
    if (beneficiaries && beneficiaries.length > 0 && data.kategori_program === 'EKONOMI') {
      for (const beneficiary of beneficiaries) {
        await sql`
          INSERT INTO action_plan_beneficiaries (
            action_plan_id, pm_id, penghasilan_awal, tanggungan, status_gk, status_hk, selisih_gk, nib_halal
          ) VALUES (
            ${id}, ${beneficiary.pm_id}, ${beneficiary.penghasilan_awal || null}, 
            ${beneficiary.tanggungan || null}, ${beneficiary.status_gk || null}, ${beneficiary.status_hk || null}, 
            ${beneficiary.selisih_gk || null}, ${beneficiary.nib_halal || null}
          )
        `
      }
    }

    revalidatePath('/dashboard/action-plan')
    revalidatePath(`/dashboard/action-plan/${id}`)
    return { success: true }
  } catch (error: any) {
    console.error('Error updating action plan:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 2. Mengambil Daftar Action Plan
 */
export async function getActionPlans(desaBerdayaId?: number, kategoriProgram?: string, status?: string) {
  try {
    let query = `
      SELECT 
        ap.*,
        db.nama_desa as desa_name,
        r.nama as relawan_name
      FROM action_plans ap
      LEFT JOIN desa_berdaya db_rel ON ap.desa_berdaya_id = db_rel.id
      LEFT JOIN desa_config db ON db_rel.desa_id = db.id
      LEFT JOIN relawan r ON db_rel.relawan_id = r.id
      WHERE 1=1
    `
    const params: any[] = []

    if (desaBerdayaId) {
      params.push(desaBerdayaId)
      query += ` AND ap.desa_berdaya_id = $${params.length}`
    }
    if (kategoriProgram) {
      params.push(kategoriProgram)
      query += ` AND ap.kategori_program = $${params.length}`
    }
    if (status) {
      params.push(status)
      query += ` AND ap.status = $${params.length}`
    }

    query += ` ORDER BY ap.created_at DESC`

    // Execute raw parameterized query with sql client logic
    // Neon serverless tagged template doesn't natively support dynamic query construction easily without multiple branches
    // We will use standard interpolation approach if needed, but safe params are required.
    // For simplicity, we just use a branch logic or string template if no dynamic builder.
    
    // Fallback simple branch for safety using Neon template literals
    if (desaBerdayaId && kategoriProgram && status) {
        return await sql`SELECT ap.* FROM action_plans ap WHERE ap.desa_berdaya_id=${desaBerdayaId} AND ap.kategori_program=${kategoriProgram} AND ap.status=${status} ORDER BY ap.created_at DESC`
    } else if (desaBerdayaId && kategoriProgram) {
        return await sql`SELECT ap.* FROM action_plans ap WHERE ap.desa_berdaya_id=${desaBerdayaId} AND ap.kategori_program=${kategoriProgram} ORDER BY ap.created_at DESC`
    } else if (desaBerdayaId) {
        return await sql`SELECT ap.* FROM action_plans ap WHERE ap.desa_berdaya_id=${desaBerdayaId} ORDER BY ap.created_at DESC`
    } else {
        return await sql`
          SELECT 
            ap.*,
            db.nama_desa as desa_name,
            r.nama as relawan_name
          FROM action_plans ap
          LEFT JOIN desa_berdaya db_rel ON ap.desa_berdaya_id = db_rel.id
          LEFT JOIN desa_config db ON db_rel.desa_id = db.id
          LEFT JOIN relawan r ON db_rel.relawan_id = r.id
          ORDER BY ap.created_at DESC
        `
    }
  } catch (error: any) {
    console.error('Error fetching action plans:', error)
    return []
  }
}

/**
 * 3. Mengambil Detail Action Plan by ID
 */
export async function getActionPlanById(id: number) {
  try {
    const apResult = await sql`
      SELECT ap.*, db.nama_desa, r.nama as relawan_name
      FROM action_plans ap
      LEFT JOIN desa_berdaya db_rel ON ap.desa_berdaya_id = db_rel.id
      LEFT JOIN desa_config db ON db_rel.desa_id = db.id
      LEFT JOIN relawan r ON db_rel.relawan_id = r.id
      WHERE ap.id = ${id}
      LIMIT 1
    `
    const actionPlan = Array.isArray(apResult) ? apResult[0] : apResult
    if (!actionPlan) return null

    const activities = await sql`
      SELECT * FROM action_plan_activities WHERE action_plan_id = ${id} ORDER BY id ASC
    `

    const beneficiaries = await sql`
      SELECT apb.*, pm.nama as pm_name, pm.nik as pm_nik 
      FROM action_plan_beneficiaries apb
      LEFT JOIN penerima_manfaat pm ON apb.pm_id = pm.id
      WHERE apb.action_plan_id = ${id}
    `

    return {
      ...actionPlan,
      activities: Array.isArray(activities) ? activities : [],
      beneficiaries: Array.isArray(beneficiaries) ? beneficiaries : []
    }
  } catch (error: any) {
    console.error('Error fetching action plan detail:', error)
    return null
  }
}

/**
 * 4. Update Status (Untuk Proses Review oleh Monev)
 */
export async function updateActionPlanStatus(id: number, status: ActionPlanStatus, catatan_revisi?: string) {
  try {
    if (status === 'REVISION' && catatan_revisi !== undefined) {
      await sql`
        UPDATE action_plans 
        SET status = ${status}, catatan_revisi = ${catatan_revisi}, updated_at = NOW() 
        WHERE id = ${id}
      `
    } else {
      await sql`
        UPDATE action_plans 
        SET status = ${status}, updated_at = NOW() 
        WHERE id = ${id}
      `
    }
    revalidatePath('/dashboard/action-plan')
    revalidatePath(`/dashboard/action-plan/${id}`)
    return { success: true }
  } catch (error: any) {
    console.error('Error updating action plan status:', error)
    return { success: false, error: error.message }
  }
}

/**
 * 5. Mengambil Action Plan yang sudah APPROVED (untuk dropdown form Laporan Kegiatan)
 */
export async function getApprovedActionPlans(desaBerdayaId: number) {
  try {
    const result = await sql`
      SELECT id, kategori_program, pilihan_program, total_ajuan
      FROM action_plans 
      WHERE desa_berdaya_id = ${desaBerdayaId} AND status = 'APPROVED'
      ORDER BY id DESC
    `
    return Array.isArray(result) ? result : []
  } catch (error: any) {
    console.error('Error fetching approved action plans:', error)
    return []
  }
}

/**
 * 6. Mengambil RAB / Activities yang anggarannya masih tersedia
 */
export async function getAvailableActivities(actionPlanId: number) {
  try {
    const query = await sql`
      SELECT 
        apa.*,
        COALESCE((
          SELECT SUM(nominal_aktual) 
          FROM laporan_kegiatan 
          WHERE action_plan_activity_id = apa.id
        ), 0) as sudah_terpakai
      FROM action_plan_activities apa
      WHERE apa.action_plan_id = ${actionPlanId}
    `
    return Array.isArray(query) ? query : []
  } catch (error: any) {
    console.error('Error fetching available activities:', error)
    return []
  }
}

/**
 * 7. Mengambil daftar Penerima Manfaat (PM) berdasarkan desa binaan (khusus Ekonomi)
 */
export async function getPenerimaManfaatByDesa(desaBerdayaId: number) {
  try {
    const pmList = await sql`
      SELECT id, nama, nik, jenis_kelamin, status_perkawinan 
      FROM penerima_manfaat 
      WHERE desa_berdaya_id = ${desaBerdayaId}
      ORDER BY nama ASC
    `
    return Array.isArray(pmList) ? pmList : []
  } catch (error: any) {
    console.error('Error fetching PM for Action Plan:', error)
    return []
  }
}
