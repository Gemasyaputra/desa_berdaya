'use server'

import { sql } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { revalidatePath } from 'next/cache'

async function checkAdmin() {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error('Unauthorized')
  if (session.user.role !== 'ADMIN') throw new Error('Forbidden: Only ADMIN can access')
  return session
}

export async function getDesaBerdayaOptions() {
  await checkAdmin();
  const rawData = await sql`
    SELECT db.id, dc.nama_desa as nama, r.id as relawan_id, r.nama as relawan_nama
    FROM desa_berdaya db
    JOIN desa_config dc ON db.desa_id = dc.id
    LEFT JOIN relawan r ON db.relawan_id = r.id
    WHERE db.status_aktif = true
    ORDER BY dc.nama_desa ASC
  `
  return Array.isArray(rawData) ? rawData : []
}

export async function getRelawanOptions() {
  await checkAdmin();
  const rawData = await sql`SELECT id, nama FROM relawan ORDER BY nama ASC`
  return Array.isArray(rawData) ? rawData : []
}

export async function getProgramOptions() {
  await checkAdmin();
  const rawData = await sql`SELECT id, nama_program, kategori_id FROM program ORDER BY nama_program ASC`
  return Array.isArray(rawData) ? rawData : []
}

export async function getKategoriProgramOptions() {
  await checkAdmin();
  const rawData = await sql`SELECT id, nama_kategori as nama FROM kategori_program ORDER BY nama_kategori ASC`
  return Array.isArray(rawData) ? rawData : []
}

export async function getApprovedAjuanRi(
  tahun: number,
  desaIds: number[],
  programName: string
) {
  await checkAdmin();
  if (desaIds.length === 0 || !programName) return {};

  const rawData = await sql`
    SELECT 
      ap.desa_berdaya_id as desa_id,
      apa.bulan_implementasi as bulan,
      SUM(apa.nominal_rencana) as total_ajuan
    FROM action_plans ap
    JOIN action_plan_activities apa ON apa.action_plan_id = ap.id
    WHERE ap.status = 'APPROVED'
      AND ap.tahun_aktivasi = ${tahun}
      AND ap.pilihan_program = ${programName}
      AND ap.desa_berdaya_id = ANY(${desaIds})
    GROUP BY ap.desa_berdaya_id, apa.bulan_implementasi
  `
  
  const result: Record<number, Record<string, number>> = {};
  for (const row of (rawData as any[])) {
    if (!result[row.desa_id]) result[row.desa_id] = {};
    result[row.desa_id][row.bulan] = Number(row.total_ajuan);
  }

  return result;
}

// HEADER: INTERVENSI PROGRAM
export async function getIntervensiPrograms() {
  await checkAdmin();
  const rawData = await sql`
    SELECT 
      ip.*,
      db.id as desa_berdaya_id, 
      dc.nama_desa,
      kp.nama_kategori as kategori_program,
      p.nama_program,
      COALESCE(r.nama, r_db.nama) as nama_relawan
    FROM intervensi_program ip
    LEFT JOIN desa_berdaya db ON ip.desa_berdaya_id = db.id
    LEFT JOIN desa_config dc ON db.desa_id = dc.id
    LEFT JOIN kategori_program kp ON ip.kategori_program_id = kp.id
    LEFT JOIN program p ON ip.program_id = p.id
    LEFT JOIN relawan r ON ip.relawan_id = r.id
    LEFT JOIN relawan r_db ON db.relawan_id = r_db.id
    ORDER BY ip.created_at DESC
  `
  return Array.isArray(rawData) ? rawData : []
}

export async function getIntervensiProgramById(id: number) {
  await checkAdmin();
  const result = await sql`
    SELECT 
      ip.id,
      ip.desa_berdaya_id,
      ip.kategori_program_id,
      ip.program_id,
      ip.deskripsi,
      ip.sumber_dana,
      ip.fundraiser,
      ip.relawan_id,
      ip.status,
      ip.created_at,
      ip.updated_at,
      COALESCE(ip.relawan_id, db.relawan_id) as relawan_id,
      dc.nama_desa,
      kp.nama_kategori as kategori_program,
      p.nama_program,
      COALESCE(r.nama, r_db.nama) as relawan_nama,
      COALESCE(r.hp, r_db.hp) as relawan_telepon,
      COALESCE(u.email, u_db.email) as relawan_email,
      COALESCE(r.nomor_rekening, r_db.nomor_rekening) as relawan_no_rekening,
      COALESCE(r.bank, r_db.bank) as relawan_nama_bank,
      COALESCE(r.atas_nama, r_db.atas_nama) as relawan_atas_nama
    FROM intervensi_program ip
    LEFT JOIN desa_berdaya db ON ip.desa_berdaya_id = db.id
    LEFT JOIN desa_config dc ON db.desa_id = dc.id
    LEFT JOIN kategori_program kp ON ip.kategori_program_id = kp.id
    LEFT JOIN program p ON ip.program_id = p.id
    LEFT JOIN relawan r ON ip.relawan_id = r.id
    LEFT JOIN users u ON r.user_id = u.id
    LEFT JOIN relawan r_db ON db.relawan_id = r_db.id
    LEFT JOIN users u_db ON r_db.user_id = u_db.id
    WHERE ip.id = ${id}
  `
  return (result as any[])[0] || null
}

export async function createIntervensiProgram(data: any) {
  await checkAdmin();
  const result = await sql`
    INSERT INTO intervensi_program (
      desa_berdaya_id,
      kategori_program_id,
      program_id,
      deskripsi,
      sumber_dana,
      fundraiser,
      relawan_id,
      status
    ) VALUES (
      ${data.desa_berdaya_id},
      ${data.kategori_program_id},
      ${data.program_id},
      ${data.deskripsi || null},
      ${data.sumber_dana || null},
      ${data.fundraiser || null},
      ${data.relawan_id}, 
      'DRAFT'
    ) RETURNING id
  `
  return { success: true, id: (result as any[])[0].id }
}

export async function updateIntervensiProgram(id: number, data: any) {
  await checkAdmin();
  
  // Verify it's not approved yet
  const current = await getIntervensiProgramById(id);
  if (current?.status !== 'DRAFT') throw new Error('Cannot update non-DRAFT record');
  
  await sql`
    UPDATE intervensi_program SET
      desa_berdaya_id = ${data.desa_berdaya_id},
      kategori_program_id = ${data.kategori_program_id},
      program_id = ${data.program_id},
      deskripsi = ${data.deskripsi || null},
      sumber_dana = ${data.sumber_dana || null},
      fundraiser = ${data.fundraiser || null},
      relawan_id = ${data.relawan_id},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
  `
  return { success: true }
}

export async function updateIntervensiStatus(id: number, status: string) {
  await checkAdmin();
  await sql`
    UPDATE intervensi_program 
    SET status = ${status}, updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
  `
  return { success: true }
}

export async function deleteIntervensiProgram(id: number) {
  await checkAdmin();
  // Only allow deletion of DRAFT records
  const current = await getIntervensiProgramById(id);
  if (!current) throw new Error('Data tidak ditemukan');
  if (current.status !== 'DRAFT') throw new Error('Hanya Intervensi berstatus DRAFT yang dapat dihapus');
  // Cascade delete anggaran lines first
  await sql`DELETE FROM intervensi_anggaran WHERE intervensi_program_id = ${id}`
  await sql`DELETE FROM intervensi_program WHERE id = ${id}`
  revalidatePath('/dashboard/intervensi');
  return { success: true };
}

// Simple: get occupied months for specific program IDs in a given year
// For basic mode (same desa), target program = source program itself
export async function getOccupiedMonthsByProgramIds(
  programIds: number[],
  targetYear: number
): Promise<string[]> {
  await checkAdmin();
  if (programIds.length === 0) return [];

  const rows = await sql`
    SELECT DISTINCT bulan
    FROM intervensi_anggaran
    WHERE intervensi_program_id = ANY(${programIds})
      AND tahun = ${targetYear}
  `;

  return (rows as any[]).map(r => r.bulan);
}

// Advanced: get occupied months in target desas for a given year, matched by program_id
export async function getExistingMonthsForTarget(
  sourceProgramIds: number[],
  targetYear: number,
  targetDesaIds: number[]
): Promise<Record<string, string[]>> {
  await checkAdmin();

  // Get source program details
  const sourceDetails = (await sql`
    SELECT id, program_id
    FROM intervensi_program 
    WHERE id = ANY(${sourceProgramIds})
  `) as any[];

  if (!Array.isArray(sourceDetails) || sourceDetails.length === 0) return {};

  const results: Record<string, string[]> = {};

  for (const desaId of targetDesaIds) {
    for (const source of sourceDetails) {
      // Find the existing header in target desa for same program
      const targetHeaders = (await sql`
        SELECT id FROM intervensi_program 
        WHERE desa_berdaya_id = ${desaId}
          AND program_id = ${source.program_id}
      `) as any[];

      const headerIds = targetHeaders.map(h => h.id);
      if (headerIds.length === 0) continue;

      const occupied = await sql`
        SELECT DISTINCT bulan
        FROM intervensi_anggaran
        WHERE intervensi_program_id = ANY(${headerIds})
          AND tahun = ${targetYear}
      `;

      const monthList = (occupied as any[]).map(r => r.bulan);
      if (monthList.length > 0) {
        results[`${desaId}-${source.id}`] = monthList;
      }
    }
  }

  return results;
}

// DETAIL: ANGGARAN
export async function getAnggaranByIntervensi(headerId: number): Promise<any[]> {
  await checkAdmin();
  const rawData = await sql`
    SELECT * FROM intervensi_anggaran 
    WHERE intervensi_program_id = ${headerId}
    ORDER BY tahun ASC, bulan ASC
  `
  return (Array.isArray(rawData) ? rawData : []) as any[]
}

// Fetch source anggaran data for bulk duplicate preview
// Returns map: programId -> { bulan -> {ajuan_ri, anggaran_disetujui, anggaran_dicairkan, is_dbf, is_rz} }
export async function getAnggaranForPreview(
  programIds: number[]
): Promise<Record<number, Record<string, any>>> {
  await checkAdmin();
  if (programIds.length === 0) return {};

  const rows = await sql`
    SELECT intervensi_program_id, bulan, ajuan_ri, anggaran_disetujui, anggaran_dicairkan, is_dbf, is_rz
    FROM intervensi_anggaran
    WHERE intervensi_program_id = ANY(${programIds})
    ORDER BY bulan ASC
  `;

  const result: Record<number, Record<string, any>> = {};
  for (const row of (rows as any[])) {
    if (!result[row.intervensi_program_id]) result[row.intervensi_program_id] = {};
    result[row.intervensi_program_id][row.bulan] = {
      ajuan_ri: Number(row.ajuan_ri) || 0,
      anggaran_disetujui: Number(row.anggaran_disetujui) || 0,
      anggaran_dicairkan: Number(row.anggaran_dicairkan) || 0,
      is_dbf: row.is_dbf || false,
      is_rz: row.is_rz || false,
    };
  }
  return result;
}

// EXPORT: Full data with anggaran rows (single query, no N+1)
export async function getIntervensiExportData(ids?: number[]) {
  await checkAdmin();
  // Build a safe comma-separated list for SQL IN clause
  const idList = ids && ids.length > 0 ? ids : null

  const rawData = idList
    ? await sql`
        SELECT 
          ip.id as intervensi_id,
          ip.status,
          ip.sumber_dana,
          ip.fundraiser,
          ip.deskripsi,
          ip.created_at,
          dc.nama_desa,
          kp.nama_kategori as kategori_program,
          p.nama_program,
          COALESCE(r.nama, r_db.nama) as nama_relawan,
          ia.id as anggaran_id,
          ia.tahun,
          ia.bulan,
          ia.ajuan_ri,
          ia.anggaran_disetujui,
          ia.anggaran_dicairkan,
          ia.status_pencairan,
          ia.id_stp,
          ia.catatan,
          ia.is_dbf,
          ia.is_rz
        FROM intervensi_program ip
        LEFT JOIN desa_berdaya db ON ip.desa_berdaya_id = db.id
        LEFT JOIN desa_config dc ON db.desa_id = dc.id
        LEFT JOIN kategori_program kp ON ip.kategori_program_id = kp.id
        LEFT JOIN program p ON ip.program_id = p.id
        LEFT JOIN relawan r ON ip.relawan_id = r.id
        LEFT JOIN relawan r_db ON db.relawan_id = r_db.id
        LEFT JOIN intervensi_anggaran ia ON ia.intervensi_program_id = ip.id
        WHERE ip.id = ANY(${idList})
        ORDER BY ip.created_at DESC, ia.tahun ASC, ia.bulan ASC
      `
    : await sql`
        SELECT 
          ip.id as intervensi_id,
          ip.status,
          ip.sumber_dana,
          ip.fundraiser,
          ip.deskripsi,
          ip.created_at,
          dc.nama_desa,
          kp.nama_kategori as kategori_program,
          p.nama_program,
          COALESCE(r.nama, r_db.nama) as nama_relawan,
          ia.id as anggaran_id,
          ia.tahun,
          ia.bulan,
          ia.ajuan_ri,
          ia.anggaran_disetujui,
          ia.anggaran_dicairkan,
          ia.status_pencairan,
          ia.id_stp,
          ia.catatan,
          ia.is_dbf,
          ia.is_rz
        FROM intervensi_program ip
        LEFT JOIN desa_berdaya db ON ip.desa_berdaya_id = db.id
        LEFT JOIN desa_config dc ON db.desa_id = dc.id
        LEFT JOIN kategori_program kp ON ip.kategori_program_id = kp.id
        LEFT JOIN program p ON ip.program_id = p.id
        LEFT JOIN relawan r ON ip.relawan_id = r.id
        LEFT JOIN relawan r_db ON db.relawan_id = r_db.id
        LEFT JOIN intervensi_anggaran ia ON ia.intervensi_program_id = ip.id
        ORDER BY ip.created_at DESC, ia.tahun ASC, ia.bulan ASC
      `
  return Array.isArray(rawData) ? rawData : []
}

export async function createAnggaran(data: any) {
  await checkAdmin();
  
  // Verify header is DRAFT
  const header = await getIntervensiProgramById(data.intervensi_program_id);
  if (header?.status !== 'DRAFT') throw new Error('Cannot add lines to non-DRAFT record');

  const result = await sql`
    INSERT INTO intervensi_anggaran (
      intervensi_program_id,
      tahun,
      bulan,
      ajuan_ri,
      anggaran_disetujui,
      anggaran_dicairkan,
      status_pencairan,
      id_stp,
      catatan,
      is_dbf,
      is_rz
    ) VALUES (
      ${data.intervensi_program_id},
      ${data.tahun},
      ${data.bulan},
      ${data.ajuan_ri || 0},
      ${data.anggaran_disetujui || 0},
      ${data.anggaran_dicairkan || 0},
      ${data.status_pencairan || 'Dialokasikan'},
      ${data.id_stp || null},
      ${data.catatan || null},
      ${data.is_dbf || false},
      ${data.is_rz || false}
    ) RETURNING id
  `
  return { success: true, id: (result as any[])[0].id }
}

export async function updateAnggaran(id: number, data: any) {
  await checkAdmin();
    
  await sql`
    UPDATE intervensi_anggaran SET
      tahun = ${data.tahun},
      bulan = ${data.bulan},
      ajuan_ri = ${data.ajuan_ri || 0},
      anggaran_disetujui = ${data.anggaran_disetujui || 0},
      anggaran_dicairkan = ${data.anggaran_dicairkan || 0},
      status_pencairan = ${data.status_pencairan || 'Dialokasikan'},
      id_stp = ${data.id_stp || null},
      catatan = ${data.catatan || null},
      is_dbf = ${data.is_dbf || false},
      is_rz = ${data.is_rz || false},
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ${id}
  `
  return { success: true }
}

export async function deleteAnggaran(id: number) {
  await checkAdmin();
  await sql`DELETE FROM intervensi_anggaran WHERE id = ${id}`
  return { success: true }
}

// BULK IMPORT: Create header + anggaran rows from Excel
export async function importIntervensiProgram(data: {
  desa_berdaya_id: number
  kategori_program_id: number
  program_id: number
  relawan_id: number
  sumber_dana?: string
  fundraiser?: string
  deskripsi?: string
  rows: Array<{
    tahun: number
    bulan: string
    ajuan_ri: number
    anggaran_disetujui: number
    anggaran_dicairkan: number
    status_pencairan: string
    id_stp?: string
    catatan?: string
    is_dbf: boolean
    is_rz: boolean
  }>
}) {
  await checkAdmin()

  // 1. Create the intervensi_program header (status = DRAFT)
  const result = await sql`
    INSERT INTO intervensi_program (
      desa_berdaya_id,
      kategori_program_id,
      program_id,
      deskripsi,
      sumber_dana,
      fundraiser,
      relawan_id,
      status
    ) VALUES (
      ${data.desa_berdaya_id},
      ${data.kategori_program_id},
      ${data.program_id},
      ${data.deskripsi || null},
      ${data.sumber_dana || null},
      ${data.fundraiser || null},
      ${data.relawan_id},
      'DRAFT'
    ) RETURNING id
  `
  const headerId = (result as any[])[0].id

  // 2. Bulk insert anggaran rows
  let inserted = 0
  for (const row of data.rows) {
    await sql`
      INSERT INTO intervensi_anggaran (
        intervensi_program_id,
        tahun,
        bulan,
        ajuan_ri,
        anggaran_disetujui,
        anggaran_dicairkan,
        status_pencairan,
        id_stp,
        catatan,
        is_dbf,
        is_rz
      ) VALUES (
        ${headerId},
        ${row.tahun},
        ${row.bulan},
        ${row.ajuan_ri || 0},
        ${row.anggaran_disetujui || 0},
        ${row.anggaran_dicairkan || 0},
        ${row.status_pencairan || 'Dialokasikan'},
        ${row.id_stp || null},
        ${row.catatan || null},
        ${row.is_dbf || false},
        ${row.is_rz || false}
      )
    `
    inserted++
  }

  revalidatePath('/dashboard/intervensi')
  return { success: true, id: headerId, inserted }
}

export async function importIntervensiProgramUniversal(rows: Array<{
  desa_berdaya_id: number
  kategori_program_id: number
  program_id: number
  relawan_id: number
  tahun: number
  bulan: string
  sumber_dana?: string
  fundraiser?: string
  deskripsi?: string
  ajuan_ri: number
  anggaran_disetujui: number
  anggaran_dicairkan: number
  status_pencairan: string
  id_stp?: string
  catatan?: string
  is_dbf: boolean
  is_rz: boolean
}>) {
  await checkAdmin()
  let inserted = 0
  
  // Group rows by unique header key
  const groups: Record<string, typeof rows> = {}
  for (const r of rows) {
    const key = `${r.desa_berdaya_id}_${r.program_id}_${r.kategori_program_id}_${r.sumber_dana || ''}_${r.fundraiser || ''}`
    if (!groups[key]) groups[key] = []
    groups[key].push(r)
  }

  for (const key in groups) {
    const groupRows = groups[key]
    const first = groupRows[0]

    // Create header
    const headerResult = await sql`
      INSERT INTO intervensi_program (
        desa_berdaya_id, kategori_program_id, program_id, deskripsi, sumber_dana, fundraiser, relawan_id, status
      ) VALUES (
        ${first.desa_berdaya_id}, ${first.kategori_program_id}, ${first.program_id}, 
        ${first.deskripsi || null}, ${first.sumber_dana || null}, ${first.fundraiser || null}, 
        ${first.relawan_id}, 'DRAFT'
      ) RETURNING id
    `
    const headerId = (headerResult as any[])[0].id

    for (const r of groupRows) {
      await sql`
        INSERT INTO intervensi_anggaran (
          intervensi_program_id, tahun, bulan, ajuan_ri, anggaran_disetujui, anggaran_dicairkan, status_pencairan, id_stp, catatan, is_dbf, is_rz
        ) VALUES (
          ${headerId}, ${r.tahun}, ${r.bulan}, ${r.ajuan_ri || 0}, ${r.anggaran_disetujui || 0}, ${r.anggaran_dicairkan || 0},
          ${r.status_pencairan || 'Dialokasikan'}, ${r.id_stp || null}, ${r.catatan || null}, ${r.is_dbf || false}, ${r.is_rz || false}
        )
      `
      inserted++
    }
  }

  revalidatePath('/dashboard/intervensi')
  return { success: true, inserted }
}

export async function duplicateIntervensiProgram(originalId: number, data: {
  desa_berdaya_id: number;
  program_id: number;
  kategori_program_id: number;
  relawan_id: number;
}) {
  await checkAdmin();
  
  // Get original header
  const original = await getIntervensiProgramById(originalId);
  if (!original) throw new Error('Data original tidak ditemukan');

  // 1. Create new header in DRAFT
  const result = await sql`
    INSERT INTO intervensi_program (
      desa_berdaya_id,
      kategori_program_id,
      program_id,
      deskripsi,
      sumber_dana,
      fundraiser,
      relawan_id,
      status
    ) VALUES (
      ${data.desa_berdaya_id},
      ${data.kategori_program_id},
      ${data.program_id},
      ${original.deskripsi || null},
      ${original.sumber_dana || null},
      ${original.fundraiser || null},
      ${data.relawan_id},
      'DRAFT'
    ) RETURNING id
  `;
  const newHeaderId = (result as any[])[0].id;

  // 2. Fetch original anggaran rows
  const anggaranRows = await getAnggaranByIntervensi(originalId);
  
  // 3. Duplicate anggaran rows
  let inserted = 0;
  for (const row of anggaranRows) {
    await sql`
      INSERT INTO intervensi_anggaran (
        intervensi_program_id,
        tahun,
        bulan,
        ajuan_ri,
        anggaran_disetujui,
        anggaran_dicairkan,
        status_pencairan,
        id_stp,
        catatan,
        is_dbf,
        is_rz
      ) VALUES (
        ${newHeaderId},
        ${row.tahun},
        ${row.bulan},
        ${row.ajuan_ri || 0},
        ${row.anggaran_disetujui || 0},
        ${row.anggaran_dicairkan || 0},
        'Dialokasikan',
        null,
        null,
        ${row.is_dbf || false},
        ${row.is_rz || false}
      )
    `;
    inserted++;
  }

  revalidatePath('/dashboard/intervensi');
  return { success: true, id: newHeaderId, inserted };
}

export async function getIntervensiProgramsForDuplicate() {
  await checkAdmin();
  const rawData = await sql`
    SELECT 
      ip.id,
      ip.status,
      ip.sumber_dana,
      ip.desa_berdaya_id,
      ip.program_id,
      ip.kategori_program_id,
      ip.relawan_id,
      ip.created_at,
      dc.nama_desa,
      p.nama_program,
      COALESCE(r.nama, r_db.nama) as nama_relawan,
      ARRAY_AGG(DISTINCT ia.bulan ORDER BY ia.bulan) FILTER (WHERE ia.bulan IS NOT NULL) as bulan_list,
      COUNT(ia.id) as row_count
    FROM intervensi_program ip
    LEFT JOIN desa_berdaya db ON ip.desa_berdaya_id = db.id
    LEFT JOIN desa_config dc ON db.desa_id = dc.id
    LEFT JOIN program p ON ip.program_id = p.id
    LEFT JOIN relawan r ON ip.relawan_id = r.id
    LEFT JOIN relawan r_db ON db.relawan_id = r_db.id
    LEFT JOIN intervensi_anggaran ia ON ia.intervensi_program_id = ip.id
    GROUP BY ip.id, dc.nama_desa, p.nama_program, r.nama, r_db.nama
    ORDER BY ip.created_at DESC
  `
  return Array.isArray(rawData) ? rawData : []
}

export async function bulkDuplicateIntervensi(
  sourceSelections: Array<{ programId: number; months: string[] }>,
  targetYear: number,
  targetDesaIds?: number[],
  targetMonths?: string[],
  previewRows?: any[]
): Promise<{ success: boolean; created: number }> {
  await checkAdmin();

  let createdCount = 0;

  for (const selection of sourceSelections) {
    const { programId: sourceId, months: selectedSourceMonths } = selection
    if (selectedSourceMonths.length === 0) continue

    const original = await getIntervensiProgramById(sourceId);
    if (!original) continue;

    const allRowsFromSource = await getAnggaranByIntervensi(sourceId);
    const templateRows = allRowsFromSource.filter(r => selectedSourceMonths.includes(r.bulan));
    if (templateRows.length === 0) continue;

    const desaTargets =
      targetDesaIds && targetDesaIds.length > 0
        ? targetDesaIds
        : [original.desa_berdaya_id];

    for (const desaId of desaTargets) {
      let targetProgramId: number;
      
      if (desaId === original.desa_berdaya_id) {
        // Same desa as source → directly reuse the source program header
        targetProgramId = sourceId;
      } else {
        // Different desa (Advanced mode) → find existing header or create new one
        const existingHeader = (await sql`
          SELECT id FROM intervensi_program 
          WHERE desa_berdaya_id = ${desaId}
            AND program_id = ${original.program_id}
          LIMIT 1
        `) as any[];
        
        if (Array.isArray(existingHeader) && existingHeader.length > 0) {
          targetProgramId = existingHeader[0].id;
        } else {
          // Create new header for the new desa
          const desaInfo = await sql`
            SELECT relawan_id FROM desa_berdaya WHERE id = ${desaId} LIMIT 1
          `;
          const relawanId = (desaInfo as any[])[0]?.relawan_id ?? original.relawan_id;

          // Double check program & kategori IDs are present
          const kategorId = original.kategori_program_id || 0;
          const progId = original.program_id || 0;

          const result = await sql`
            INSERT INTO intervensi_program (
              desa_berdaya_id, kategori_program_id, program_id,
              deskripsi, sumber_dana, fundraiser, relawan_id, status
            ) VALUES (
              ${desaId},
              ${kategorId},
              ${progId},
              ${original.deskripsi || null},
              ${original.sumber_dana || null},
              ${original.fundraiser || null},
              ${relawanId},
              'DRAFT'
            ) RETURNING id
          `;
          targetProgramId = (result as any[])[0].id;
        }
      }

      // Decide which months to create
      const monthsToProcess = (targetMonths && targetMonths.length > 0) 
        ? targetMonths 
        : templateRows.map(r => r.bulan);

      for (const tMonth of monthsToProcess) {
        // CHECK IF ALREADY EXISTS in targetYear
        const exists = await sql`
          SELECT 1 FROM intervensi_anggaran 
          WHERE intervensi_program_id = ${targetProgramId} 
            AND tahun = ${targetYear} 
            AND bulan = ${tMonth}
          LIMIT 1
        `;

        if (Array.isArray(exists) && exists.length > 0) {
          // Skip if already exists
          continue;
        }

        // Get preview data if available (user edits from Step 2)
        let rowData;
        if (previewRows) {
          rowData = previewRows.find(r => r.programId === sourceId && r.targetMonth === tMonth);
        }

        if (!rowData) {
          // Fallback to source template
          rowData = (targetMonths && targetMonths.length > 0)
            ? templateRows[0]
            : templateRows.find(r => r.bulan === tMonth) || templateRows[0];
        }

        await sql`
          INSERT INTO intervensi_anggaran (
            intervensi_program_id, tahun, bulan, ajuan_ri,
            anggaran_disetujui, anggaran_dicairkan, status_pencairan,
            id_stp, catatan, is_dbf, is_rz
          ) VALUES (
            ${targetProgramId},
            ${targetYear},
            ${tMonth},
            ${rowData.ajuan_ri || 0},
            ${rowData.anggaran_disetujui || 0},
            ${rowData.anggaran_dicairkan || 0},
            'Dialokasikan',
            null, null,
            ${rowData.is_dbf || false},
            ${rowData.is_rz || false}
          )
        `;
      }
      createdCount++;
    }
  }

  revalidatePath('/dashboard/intervensi');
  return { success: true, created: createdCount };
}
