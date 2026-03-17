'use server'

import { sql } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function getKesehatanUpdates() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return []

  const role = session.user.role
  const operatorId = session.user.operator_id

  let result: any[] = []

  if (role === 'RELAWAN' || role === 'PROG_HEAD') {
    result = await sql`
      SELECT ku.*, pm.nama as nama_pm, pm.nik as nik_pm
      FROM kesehatan_update ku
      JOIN penerima_manfaat pm ON ku.penerima_manfaat_id = pm.id
      WHERE ku.operator_id = ${operatorId}
      ORDER BY ku.tahun DESC, ku.bulan DESC
    ` as any[]
  } else if (role === 'ADMIN' || role === 'MONEV' || role === 'FINANCE') {
    result = await sql`
      SELECT ku.*, pm.nama as nama_pm, pm.nik as nik_pm
      FROM kesehatan_update ku
      JOIN penerima_manfaat pm ON ku.penerima_manfaat_id = pm.id
      ORDER BY ku.tahun DESC, ku.bulan DESC
    ` as any[]
  } else if (role === 'OFFICE' && session.user.office_id) {
    result = await sql`
      SELECT ku.*, pm.nama as nama_pm, pm.nik as nik_pm
      FROM kesehatan_update ku
      JOIN penerima_manfaat pm ON ku.penerima_manfaat_id = pm.id
      JOIN desa_berdaya db ON pm.desa_berdaya_id = db.id
      JOIN desa_config dc ON db.desa_id = dc.id
      WHERE dc.office_id = ${session.user.office_id}
      ORDER BY ku.tahun DESC, ku.bulan DESC
    ` as any[]
  }

  return result
}

export async function getKesehatanUpdateById(id: number) {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error('Unauthorized')

  const result = await sql`
    SELECT ku.*, pm.nama as nama_pm, pm.nik as nik_pm, pm.desa_berdaya_id
    FROM kesehatan_update ku
    JOIN penerima_manfaat pm ON ku.penerima_manfaat_id = pm.id
    WHERE ku.id = ${id}
  ` as any[]

  return result[0] || null
}

export async function createKesehatanUpdate(data: any) {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error('Unauthorized')

  const operatorId = session.user.operator_id

  const result = await sql`
    INSERT INTO kesehatan_update (
      tahun, bulan, checked, penerima_manfaat_id, operator_id,
      is_kader, nama_relawan, program_kesehatan,
      is_anak, is_ibu, is_lansia,
      tgl_pemeriksaan_anak, tgl_pemeriksaan_ibu, tgl_pemeriksaan_lansia,
      anak_tgl_lahir, anak_bb_lahir, anak_tinggi_badan, anak_berat_badan,
      anak_nama_ibu, anak_ke, anak_pendampingan_khusus, anak_asi_eksklusif,
      anak_metode_pengukuran, anak_lingkar_kepala, anak_menderita_diare,
      anak_imunisasi, anak_imd,
      ibu_nik, ibu_tgl_lahir, ibu_bb_sebelum_hamil, ibu_tinggi_badan,
      ibu_berat_badan, ibu_lila, ibu_umur_kehamilan, ibu_hb, ibu_imunisasi,
      lansia_tgl_lahir, lansia_tinggi_badan, lansia_berat_badan,
      lansia_tekanan_darah, lansia_kolesterol, lansia_gula, lansia_asam_urat,
      lansia_penanggung_biaya, lansia_kepemilikan_bpjs, lansia_aktivitas_harian,
      lansia_riwayat_penyakit, lansia_riwayat_pengobatan
    ) VALUES (
      ${data.tahun}, ${data.bulan}, ${data.checked}, ${data.penerima_manfaat_id}, ${operatorId},
      ${data.is_kader || false}, ${data.nama_relawan}, ${data.program_kesehatan},
      ${data.is_anak || false}, ${data.is_ibu || false}, ${data.is_lansia || false},
      ${data.tgl_pemeriksaan_anak || null}, ${data.tgl_pemeriksaan_ibu || null}, ${data.tgl_pemeriksaan_lansia || null},
      ${data.anak_tgl_lahir || null}, ${data.anak_bb_lahir || 0}, ${data.anak_tinggi_badan || 0}, ${data.anak_berat_badan || 0},
      ${data.anak_nama_ibu}, ${data.anak_ke || 0}, ${data.anak_pendampingan_khusus}, ${data.anak_asi_eksklusif || 0},
      ${data.anak_metode_pengukuran}, ${data.anak_lingkar_kepala || 0}, ${data.anak_menderita_diare || false},
      ${JSON.stringify(data.anak_imunisasi || [])}, ${data.anak_imd || false},
      ${data.ibu_nik}, ${data.ibu_tgl_lahir || null}, ${data.ibu_bb_sebelum_hamil || 0}, ${data.ibu_tinggi_badan || 0},
      ${data.ibu_berat_badan || 0}, ${data.ibu_lila || 0}, ${data.ibu_umur_kehamilan || 0}, ${data.ibu_hb || false}, ${JSON.stringify(data.ibu_imunisasi || [])},
      ${data.lansia_tgl_lahir || null}, ${data.lansia_tinggi_badan || 0}, ${data.lansia_berat_badan || 0},
      ${data.lansia_tekanan_darah}, ${data.lansia_kolesterol || 0}, ${data.lansia_gula || 0}, ${data.lansia_asam_urat || 0},
      ${data.lansia_penanggung_biaya}, ${data.lansia_kepemilikan_bpjs}, ${data.lansia_aktivitas_harian},
      ${data.lansia_riwayat_penyakit}, ${data.lansia_riwayat_pengobatan}
    ) RETURNING id
  ` as any[]

  return { success: true, id: result[0].id }
}

export async function updateKesehatanUpdate(id: number, data: any) {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error('Unauthorized')

  await sql`
    UPDATE kesehatan_update SET
      tahun = ${data.tahun},
      bulan = ${data.bulan},
      checked = ${data.checked},
      penerima_manfaat_id = ${data.penerima_manfaat_id},
      is_kader = ${data.is_kader},
      nama_relawan = ${data.nama_relawan},
      program_kesehatan = ${data.program_kesehatan},
      is_anak = ${data.is_anak},
      is_ibu = ${data.is_ibu},
      is_lansia = ${data.is_lansia},
      tgl_pemeriksaan_anak = ${data.tgl_pemeriksaan_anak},
      tgl_pemeriksaan_ibu = ${data.tgl_pemeriksaan_ibu},
      tgl_pemeriksaan_lansia = ${data.tgl_pemeriksaan_lansia},
      anak_tgl_lahir = ${data.anak_tgl_lahir},
      anak_bb_lahir = ${data.anak_bb_lahir},
      anak_tinggi_badan = ${data.anak_tinggi_badan},
      anak_berat_badan = ${data.anak_berat_badan},
      anak_nama_ibu = ${data.anak_nama_ibu},
      anak_ke = ${data.anak_ke},
      anak_pendampingan_khusus = ${data.anak_pendampingan_khusus},
      anak_asi_eksklusif = ${data.anak_asi_eksklusif},
      anak_metode_pengukuran = ${data.anak_metode_pengukuran},
      anak_lingkar_kepala = ${data.anak_lingkar_kepala},
      anak_menderita_diare = ${data.anak_menderita_diare},
      anak_imunisasi = ${JSON.stringify(data.anak_imunisasi || [])},
      anak_imd = ${data.anak_imd},
      ibu_nik = ${data.ibu_nik},
      ibu_tgl_lahir = ${data.ibu_tgl_lahir},
      ibu_bb_sebelum_hamil = ${data.ibu_bb_sebelum_hamil},
      ibu_tinggi_badan = ${data.ibu_tinggi_badan},
      ibu_berat_badan = ${data.ibu_berat_badan},
      ibu_lila = ${data.ibu_lila},
      ibu_umur_kehamilan = ${data.ibu_umur_kehamilan},
      ibu_hb = ${data.ibu_hb},
      ibu_imunisasi = ${JSON.stringify(data.ibu_imunisasi || [])},
      lansia_tgl_lahir = ${data.lansia_tgl_lahir},
      lansia_tinggi_badan = ${data.lansia_tinggi_badan},
      lansia_berat_badan = ${data.lansia_berat_badan},
      lansia_tekanan_darah = ${data.lansia_tekanan_darah},
      lansia_kolesterol = ${data.lansia_kolesterol},
      lansia_gula = ${data.lansia_gula},
      lansia_asam_urat = ${data.lansia_asam_urat},
      lansia_penanggung_biaya = ${data.lansia_penanggung_biaya},
      lansia_kepemilikan_bpjs = ${data.lansia_kepemilikan_bpjs},
      lansia_aktivitas_harian = ${data.lansia_aktivitas_harian},
      lansia_riwayat_penyakit = ${data.lansia_riwayat_penyakit},
      lansia_riwayat_pengobatan = ${data.lansia_riwayat_pengobatan},
      updated_at = NOW()
    WHERE id = ${id}
  `

  return { success: true }
}

export async function deleteKesehatanUpdate(id: number) {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error('Unauthorized')

  await sql`DELETE FROM kesehatan_update WHERE id = ${id}`
  return { success: true }
}

export async function getDesaBerdayaOptions() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return []

  const result = await sql`
    SELECT db.id, dc.nama_desa
    FROM desa_berdaya db
    JOIN desa_config dc ON db.desa_id = dc.id
    ORDER BY dc.nama_desa ASC
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
