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
      r.nama as nama_relawan
    FROM intervensi_program ip
    LEFT JOIN desa_berdaya db ON ip.desa_berdaya_id = db.id
    LEFT JOIN desa_config dc ON db.desa_id = dc.id
    LEFT JOIN kategori_program kp ON ip.kategori_program_id = kp.id
    LEFT JOIN program p ON ip.program_id = p.id
    LEFT JOIN relawan r ON ip.relawan_id = r.id
    ORDER BY ip.created_at DESC
  `
  return Array.isArray(rawData) ? rawData : []
}

export async function getIntervensiProgramById(id: number) {
  await checkAdmin();
  const result = await sql`
    SELECT 
      ip.*,
      dc.nama_desa,
      kp.nama_kategori as kategori_program,
      p.nama_program,
      r.nama as relawan_nama,
      r.hp as relawan_telepon,
      u.email as relawan_email,
      r.nomor_rekening as relawan_no_rekening,
      r.bank as relawan_nama_bank,
      r.atas_nama as relawan_atas_nama
    FROM intervensi_program ip
    LEFT JOIN desa_berdaya db ON ip.desa_berdaya_id = db.id
    LEFT JOIN desa_config dc ON db.desa_id = dc.id
    LEFT JOIN kategori_program kp ON ip.kategori_program_id = kp.id
    LEFT JOIN program p ON ip.program_id = p.id
    LEFT JOIN relawan r ON ip.relawan_id = r.id
    LEFT JOIN users u ON r.user_id = u.id
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
  revalidatePath('/dashboard/intervensi')
  return { success: true }
}

// DETAIL: ANGGARAN
export async function getAnggaranByIntervensi(headerId: number) {
  await checkAdmin();
  const rawData = await sql`
    SELECT * FROM intervensi_anggaran 
    WHERE intervensi_program_id = ${headerId}
    ORDER BY tahun ASC, bulan ASC
  `
  return Array.isArray(rawData) ? rawData : []
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
          r.nama as nama_relawan,
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
          r.nama as nama_relawan,
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
