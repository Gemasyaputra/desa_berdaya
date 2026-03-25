'use server'

import { sql } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function getEkonomiUpdates() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return []

  const role = session.user.role
  const operatorId = session.user.operator_id

  let result: any[] = []

  if (role === 'RELAWAN' || role === 'PROG_HEAD') {
    result = await sql`
      SELECT eu.*, pm.nama as nama_pm, pm.nik as nik_pm,
             (SELECT k.nama_kelompok FROM kelompok_anggota ka JOIN kelompok k ON ka.kelompok_id = k.id WHERE ka.penerima_manfaat_id = pm.id LIMIT 1) as nama_kelompok,
             (SELECT k.id FROM kelompok_anggota ka JOIN kelompok k ON ka.kelompok_id = k.id WHERE ka.penerima_manfaat_id = pm.id LIMIT 1) as kelompok_id
      FROM ekonomi_update eu
      JOIN penerima_manfaat pm ON eu.penerima_manfaat_id = pm.id
      WHERE eu.operator_id = ${operatorId}
      ORDER BY eu.tahun DESC, eu.bulan DESC
    ` as any[]
  } else if (role === 'ADMIN' || role === 'MONEV' || role === 'FINANCE') {
    result = await sql`
      SELECT eu.*, pm.nama as nama_pm, pm.nik as nik_pm,
             (SELECT k.nama_kelompok FROM kelompok_anggota ka JOIN kelompok k ON ka.kelompok_id = k.id WHERE ka.penerima_manfaat_id = pm.id LIMIT 1) as nama_kelompok,
             (SELECT k.id FROM kelompok_anggota ka JOIN kelompok k ON ka.kelompok_id = k.id WHERE ka.penerima_manfaat_id = pm.id LIMIT 1) as kelompok_id
      FROM ekonomi_update eu
      JOIN penerima_manfaat pm ON eu.penerima_manfaat_id = pm.id
      ORDER BY eu.tahun DESC, eu.bulan DESC
    ` as any[]
  } else if (role === 'OFFICE' && session.user.office_id) {
    result = await sql`
      SELECT eu.*, pm.nama as nama_pm, pm.nik as nik_pm,
             (SELECT k.nama_kelompok FROM kelompok_anggota ka JOIN kelompok k ON ka.kelompok_id = k.id WHERE ka.penerima_manfaat_id = pm.id LIMIT 1) as nama_kelompok,
             (SELECT k.id FROM kelompok_anggota ka JOIN kelompok k ON ka.kelompok_id = k.id WHERE ka.penerima_manfaat_id = pm.id LIMIT 1) as kelompok_id
      FROM ekonomi_update eu
      JOIN penerima_manfaat pm ON eu.penerima_manfaat_id = pm.id
      JOIN desa_berdaya db ON pm.desa_berdaya_id = db.id
      JOIN desa_config dc ON db.desa_id = dc.id
      WHERE dc.office_id = ${session.user.office_id}
      ORDER BY eu.tahun DESC, eu.bulan DESC
    ` as any[]
  }

  return result
}

export async function getEkonomiUpdateById(id: number) {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error('Unauthorized')

  const result = await sql`
    SELECT eu.*, pm.nama as nama_pm, pm.nik as nik_pm, pm.desa_berdaya_id
    FROM ekonomi_update eu
    JOIN penerima_manfaat pm ON eu.penerima_manfaat_id = pm.id
    WHERE eu.id = ${id}
  ` as any[]

  return result[0] || null
}

export async function createEkonomiUpdate(data: any) {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error('Unauthorized')

  const operatorId = session.user.operator_id

  const result = await sql`
    INSERT INTO ekonomi_update (
      tahun, bulan, checked, penerima_manfaat_id, kategori, tipe,
      komoditas_produk, jumlah_tanggungan, modal, pengeluaran_operasional,
      omzet, pendapatan, pendapatan_lainnya, status_gk, nilai_ntp,
      program, operator_id
    ) VALUES (
      ${data.tahun}, ${data.bulan}, ${data.checked}, ${data.penerima_manfaat_id},
      ${data.kategori}, ${data.tipe}, ${data.komoditas_produk},
      ${data.jumlah_tanggungan || 0}, ${data.modal || 0},
      ${data.pengeluaran_operasional || 0}, ${data.omzet || 0},
      ${data.pendapatan || 0}, ${data.pendapatan_lainnya || 0},
      ${data.status_gk}, ${data.nilai_ntp || 0}, ${data.program},
      ${operatorId}
    ) RETURNING id
  ` as any[]

  return { success: true, id: result[0].id }
}

export async function updateEkonomiUpdate(id: number, data: any) {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error('Unauthorized')

  await sql`
    UPDATE ekonomi_update SET
      tahun = ${data.tahun},
      bulan = ${data.bulan},
      checked = ${data.checked},
      penerima_manfaat_id = ${data.penerima_manfaat_id},
      kategori = ${data.kategori},
      tipe = ${data.tipe},
      komoditas_produk = ${data.komoditas_produk},
      jumlah_tanggungan = ${data.jumlah_tanggungan},
      modal = ${data.modal},
      pengeluaran_operasional = ${data.pengeluaran_operasional},
      omzet = ${data.omzet},
      pendapatan = ${data.pendapatan},
      pendapatan_lainnya = ${data.pendapatan_lainnya},
      status_gk = ${data.status_gk},
      nilai_ntp = ${data.nilai_ntp},
      program = ${data.program},
      updated_at = NOW()
    WHERE id = ${id}
  `

  return { success: true }
}

export async function deleteEkonomiUpdate(id: number) {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error('Unauthorized')

  await sql`DELETE FROM ekonomi_update WHERE id = ${id}`
  return { success: true }
}

export async function getPenerimaManfaatSearch(query: string, desaId?: number) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return []

  const result = desaId
    ? await sql`
        SELECT id, nama, nik
        FROM penerima_manfaat
        WHERE (nama ILIKE ${'%' + query + '%'} OR nik ILIKE ${'%' + query + '%'})
        AND desa_berdaya_id = ${desaId}
        LIMIT 10
      ` as any[]
    : await sql`
        SELECT id, nama, nik
        FROM penerima_manfaat
        WHERE (nama ILIKE ${'%' + query + '%'} OR nik ILIKE ${'%' + query + '%'})
        LIMIT 10
      ` as any[]

  return result
}

export async function getPenerimaManfaatByDesa(desaId: number) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return []

  const result = await sql`
    SELECT id, nama, nik
    FROM penerima_manfaat
    WHERE desa_berdaya_id = ${desaId}
    ORDER BY nama ASC
  ` as any[]

  return result
}
