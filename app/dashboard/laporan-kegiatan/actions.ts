'use server'

import { put } from '@vercel/blob'
import { sql } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function getDesaBerdayaOptions() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return []

  const role = session.user.role
  const operatorId = session.user.operator_id

  if (role === 'RELAWAN' || role === 'PROG_HEAD') {
    if (operatorId) {
      const result = await sql`
        SELECT db.id, dc.nama_desa, 5000000 as alokasi_anggaran 
        FROM desa_berdaya db
        JOIN desa_config dc ON db.desa_id = dc.id
        WHERE db.relawan_id = ${operatorId} AND db.status_aktif = true
      `
      return result as any[]
    }
  } else if (role === 'ADMIN' || role === 'MONEV' || role === 'FINANCE') {
    const result = await sql`
      SELECT db.id, dc.nama_desa, 5000000 as alokasi_anggaran 
      FROM desa_berdaya db
      JOIN desa_config dc ON db.desa_id = dc.id
      WHERE db.status_aktif = true
    `
    return result as any[]
  } else if (role === 'OFFICE' && session.user.office_id) {
    const result = await sql`
      SELECT db.id, dc.nama_desa, 5000000 as alokasi_anggaran 
      FROM desa_berdaya db
      JOIN desa_config dc ON db.desa_id = dc.id
      WHERE dc.office_id = ${session.user.office_id} AND db.status_aktif = true
    `
    return result as any[]
  }
  return []
}

export async function getLaporanKegiatan() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return []

  const options = await getDesaBerdayaOptions()
  if (options.length === 0) return []
  
  const desaIds = options.map((o: any) => o.id)

  const result = await sql`
    SELECT 
      l.*,
      kp.nama_kategori as jenis_kegiatan,
      dc.nama_desa,
      (SELECT array_agg(nama_kelompok) FROM kelompok WHERE id = ANY(l.kelompok_ids)) as nama_kelompok_list,
      (SELECT array_agg(nama) FROM penerima_manfaat WHERE id = ANY(l.penerima_manfaat_ids)) as nama_pm_list
    FROM laporan_kegiatan l
    LEFT JOIN program p ON l.program_id = p.id
    LEFT JOIN kategori_program kp ON p.kategori_id = kp.id
    JOIN desa_berdaya db ON l.desa_berdaya_id = db.id
    JOIN desa_config dc ON db.desa_id = dc.id
    WHERE l.desa_berdaya_id = ANY(${desaIds})
    ORDER BY l.created_at DESC
  `
  return result as any[]
}

export async function getLaporanKegiatanById(id: number) {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error('Unauthorized')

  const result = await sql`
    SELECT 
      l.*,
      kp.nama_kategori as jenis_kegiatan,
      dc.nama_desa,
      (SELECT array_agg(nama_kelompok) FROM kelompok WHERE id = ANY(l.kelompok_ids)) as nama_kelompok_list,
      (SELECT array_agg(nama) FROM penerima_manfaat WHERE id = ANY(l.penerima_manfaat_ids)) as nama_pm_list
    FROM laporan_kegiatan l
    LEFT JOIN program p ON l.program_id = p.id
    LEFT JOIN kategori_program kp ON p.kategori_id = kp.id
    JOIN desa_berdaya db ON l.desa_berdaya_id = db.id
    JOIN desa_config dc ON db.desa_id = dc.id
    WHERE l.id = ${id}
  `
  return (result as any[])[0] || null
}

export async function getDesaHierarchy(desaBerdayaId: number) {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error('Unauthorized')

  const result = await sql`
    SELECT 
      db.id,
      dc.nama_desa,
      o.nama_office as cabang,
      r.nama as nama_relawan,
      m.nama as nama_monev,
      k.nama as nama_korwil
    FROM desa_berdaya db
    JOIN desa_config dc ON db.desa_id = dc.id
    LEFT JOIN office o ON dc.office_id = o.id
    LEFT JOIN relawan r ON db.relawan_id = r.id
    LEFT JOIN monev m ON r.monev_id = m.id
    LEFT JOIN relawan k ON r.korwil_id = k.id
    WHERE db.id = ${desaBerdayaId}
  `
  return (result as any[])[0] || null
}

export async function getPMCounts(desaBerdayaId: number, programId: number, kelompokIds?: number[]) {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error('Unauthorized')

  const hasGroups = kelompokIds && kelompokIds.length > 0

  const result = await sql`
    SELECT 
      SUM(CASE WHEN UPPER(pm.jenis_kelamin) = 'LAKI-LAKI' THEN 1 ELSE 0 END)::int as laki,
      SUM(CASE WHEN UPPER(pm.jenis_kelamin) = 'PEREMPUAN' THEN 1 ELSE 0 END)::int as perempuan,
      COUNT(pm.id)::int as total,
      (
        SELECT COUNT(ka.penerima_manfaat_id)::int
        FROM kelompok k
        JOIN kelompok_anggota ka ON ka.kelompok_id = k.id
        JOIN penerima_manfaat pm2 ON ka.penerima_manfaat_id = pm2.id
        WHERE k.desa_berdaya_id = ${desaBerdayaId} 
        AND k.program_id = ${programId}
        AND (${hasGroups ? kelompokIds : null}::bigint[] IS NULL OR k.id = ANY(${hasGroups ? kelompokIds : null}::bigint[]))
        AND UPPER(pm2.jenis_kelamin) = 'LAKI-LAKI'
      ) as kelompok_laki,
      (
        SELECT COUNT(ka.penerima_manfaat_id)::int
        FROM kelompok k
        JOIN kelompok_anggota ka ON ka.kelompok_id = k.id
        JOIN penerima_manfaat pm2 ON ka.penerima_manfaat_id = pm2.id
        WHERE k.desa_berdaya_id = ${desaBerdayaId} 
        AND k.program_id = ${programId}
        AND (${hasGroups ? kelompokIds : null}::bigint[] IS NULL OR k.id = ANY(${hasGroups ? kelompokIds : null}::bigint[]))
        AND UPPER(pm2.jenis_kelamin) = 'PEREMPUAN'
      ) as kelompok_perempuan
    FROM penerima_manfaat pm
    JOIN kelompok_anggota ka ON ka.penerima_manfaat_id = pm.id
    JOIN kelompok k ON ka.kelompok_id = k.id
    WHERE k.desa_berdaya_id = ${desaBerdayaId} 
    AND k.program_id = ${programId}
    AND (${hasGroups ? kelompokIds : null}::bigint[] IS NULL OR k.id = ANY(${hasGroups ? kelompokIds : null}::bigint[]))
  `
  return (result as any[])[0] || { laki: 0, perempuan: 0, total: 0, kelompok_laki: 0, kelompok_perempuan: 0 }
}

export async function getProgramsByCategory(kategoriId: number) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return []

  const result = await sql`
    SELECT id, nama_program, form_category_id
    FROM program
    WHERE kategori_id = ${kategoriId}
    ORDER BY nama_program ASC
  `
  return result as any[]
}

export async function getKelompokByDesaAndProgram(desaBerdayaId: number, programId: number) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return []

  const result = await sql`
    SELECT id, nama_kelompok, nama_pembina
    FROM kelompok
    WHERE desa_berdaya_id = ${desaBerdayaId} 
    AND program_id = ${programId}
    ORDER BY nama_kelompok ASC
  `
  return result as any[]
}

export async function getKelompokMembers(kelompokIds: number[]) {
  const session = await getServerSession(authOptions)
  if (!session?.user || !kelompokIds || kelompokIds.length === 0) return []

  const result = await sql`
    SELECT pm.id, pm.nama, pm.jenis_kelamin, pm.nik
    FROM penerima_manfaat pm
    JOIN kelompok_anggota ka ON ka.penerima_manfaat_id = pm.id
    WHERE ka.kelompok_id = ANY(${kelompokIds})
    ORDER BY pm.nama ASC
  `
  return result as any[]
}

export async function createLaporanKegiatan(data: any) {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error('Unauthorized')

  const result = await sql`
    INSERT INTO laporan_kegiatan (
      desa_berdaya_id,
      jenis_kegiatan,
      judul_kegiatan,
      deskripsi,
      total_realisasi,
      bukti_url,
      tanggal_kegiatan,
      sasaran_program,
      lokasi_pelaksanaan,
      periode_laporan,
      jumlah_pm_laki,
      jumlah_pm_perempuan,
      jumlah_pm_total,
      jumlah_kelompok_laki,
      jumlah_kelompok_perempuan,
      is_terdokumentasi,
      custom_fields_data,
      program_id,
      form_category_id,
      kelompok_ids,
      penerima_manfaat_ids,
      action_plan_id,
      action_plan_activity_id,
      nominal_aktual
    ) VALUES (
      ${data.desa_berdaya_id},
      ${data.jenis_kegiatan},
      ${data.judul_kegiatan},
      ${data.deskripsi},
      ${data.total_realisasi},
      ${data.bukti_url || []},
      ${data.tanggal_kegiatan},
      ${data.sasaran_program},
      ${data.lokasi_pelaksanaan},
      ${data.periode_laporan},
      ${data.jumlah_pm_laki},
      ${data.jumlah_pm_perempuan},
      ${data.jumlah_pm_total},
      ${data.jumlah_kelompok_laki},
      ${data.jumlah_kelompok_perempuan},
      ${data.is_terdokumentasi},
      ${data.custom_fields_data ? JSON.stringify(data.custom_fields_data) : null},
      ${data.program_id},
      ${data.form_category_id || null},
      ${data.kelompok_ids || []},
      ${data.penerima_manfaat_ids || []},
      ${data.action_plan_id || null},
      ${data.action_plan_activity_id || null},
      ${data.nominal_aktual || null}
    ) RETURNING id
  `
  return { success: true, id: (result as any[])[0].id }
}

export async function updateLaporanKegiatan(id: number, data: any) {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error('Unauthorized')

  const result = await sql`
    UPDATE laporan_kegiatan SET
      desa_berdaya_id = ${data.desa_berdaya_id}, 
      jenis_kegiatan = ${data.jenis_kegiatan}, 
      judul_kegiatan = ${data.judul_kegiatan}, 
      deskripsi = ${data.deskripsi}, 
      total_realisasi = ${data.total_realisasi}, 
      bukti_url = ${data.bukti_url || []},
      tanggal_kegiatan = ${data.tanggal_kegiatan},
      sasaran_program = ${data.sasaran_program},
      lokasi_pelaksanaan = ${data.lokasi_pelaksanaan},
      periode_laporan = ${data.periode_laporan},
      jumlah_pm_laki = ${data.jumlah_pm_laki},
      jumlah_pm_perempuan = ${data.jumlah_pm_perempuan},
      jumlah_pm_total = ${data.jumlah_pm_total},
      jumlah_kelompok_laki = ${data.jumlah_kelompok_laki},
      jumlah_kelompok_perempuan = ${data.jumlah_kelompok_perempuan},
      is_terdokumentasi = ${data.is_terdokumentasi},
      custom_fields_data = ${data.custom_fields_data ? JSON.stringify(data.custom_fields_data) : null},
      program_id = ${data.program_id},
      form_category_id = ${data.form_category_id || null},
      kelompok_ids = ${data.kelompok_ids || []},
      penerima_manfaat_ids = ${data.penerima_manfaat_ids || []},
      action_plan_id = ${data.action_plan_id || null},
      action_plan_activity_id = ${data.action_plan_activity_id || null},
      nominal_aktual = ${data.nominal_aktual || null}
    WHERE id = ${id} RETURNING id
  `
  return { success: true, id: (result as any[])[0].id }
}

export async function deleteLaporanKegiatan(id: number) {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error('Unauthorized')

  await sql`DELETE FROM laporan_kegiatan WHERE id = ${id}`
  return { success: true }
}

export async function uploadBukti(formData: FormData) {
  const file = formData.get('file') as File
  if (!file) throw new Error('File tidak ditemukan')

  const blob = await put(file.name, file, { access: 'public' })
  return blob.url
}

export async function getLaporanByActionPlanId(actionPlanId: number) {
  const session = await getServerSession(authOptions)
  if (!session?.user) return []

  const result = await sql`
    SELECT id, judul_kegiatan, tanggal_kegiatan
    FROM laporan_kegiatan
    WHERE action_plan_id = ${actionPlanId}
    ORDER BY tanggal_kegiatan DESC
  `
  return result as any[]
}

