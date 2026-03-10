'use server'

import { sql } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function getPenerimaManfaatList() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return []

  const role = session.user.role
  const operatorId = session.user.operator_id

  if (role === 'RELAWAN' || role === 'PROG_HEAD') {
    return (await sql`
      SELECT pm.*, dc.nama_desa
      FROM penerima_manfaat pm
      JOIN desa_berdaya db ON pm.desa_berdaya_id = db.id
      JOIN desa_config dc ON db.desa_id = dc.id
      WHERE db.relawan_id = ${operatorId}
      ORDER BY pm.id DESC
    `) as any[]
  }
  return (await sql`
    SELECT pm.*, dc.nama_desa
    FROM penerima_manfaat pm
    JOIN desa_berdaya db ON pm.desa_berdaya_id = db.id
    JOIN desa_config dc ON db.desa_id = dc.id
    ORDER BY pm.id DESC
  `) as any[]
}

export async function getPenerimaManfaatByDesaId(desaId: number) {
  try {
    const list = await sql`
      SELECT id, nama, nik
      FROM penerima_manfaat
      WHERE desa_berdaya_id = ${desaId}
      ORDER BY nama ASC
    `
    return Array.isArray(list) ? list : []
  } catch (error) {
    console.error('Error fetching PM by desa:', error)
    return []
  }
}

export async function getDesaBerdayaOptions() {
  const session = await getServerSession(authOptions)
  if (!session?.user) return []

  const role = session.user.role
  const operatorId = session.user.operator_id

  let options: any[] = []

  // Hanya Relawan dan Korwil yang terjun langsung (PROG_HEAD juga korwil di dummy) yang nambah PM
  if (role === 'RELAWAN' || role === 'PROG_HEAD') {
    if (operatorId) {
      options = (await sql`
        SELECT db.id, dc.nama_desa, r.nama as nama_relawan
        FROM desa_berdaya db
        JOIN desa_config dc ON db.desa_id = dc.id
        LEFT JOIN relawan r ON db.relawan_id = r.id
        WHERE db.relawan_id = ${operatorId} AND db.status_aktif = true
      `) as any[]
    }
  } else if (role === 'ADMIN' || role === 'MONEV') {
    // Admin dan Monev bisa lihat semua desa
    options = (await sql`
      SELECT db.id, dc.nama_desa, r.nama as nama_relawan
      FROM desa_berdaya db
      JOIN desa_config dc ON db.desa_id = dc.id
      LEFT JOIN relawan r ON db.relawan_id = r.id
      WHERE db.status_aktif = true
    `) as any[]
  }

  return options
}

export async function createPenerimaManfaat(data: {
  desa_berdaya_id: number;
  nik: string;
  nama: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  jenis_kelamin?: string;
  golongan_darah?: string;
  alamat?: string;
  rt_rw?: string;
  kel_desa?: string;
  kecamatan?: string;
  agama?: string;
  status_perkawinan?: string;
  pekerjaan?: string;
  kewarganegaraan?: string;
  kategori_pm: string;
  foto_ktp_url?: string;
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error('Unauthorized')

  if (!data.desa_berdaya_id || !data.nik || !data.nama) {
    throw new Error('Desa Berdaya, NIK, dan Nama wajib diisi')
  }

  if (data.nik.length !== 16) {
    throw new Error('NIK harus terdiri dari 16 karakter')
  }

  try {
    const result = await sql`
      INSERT INTO penerima_manfaat (
        desa_berdaya_id, nik, nama, tempat_lahir, tanggal_lahir, jenis_kelamin, 
        golongan_darah, alamat, rt_rw, kel_desa, kecamatan, agama, 
        status_perkawinan, pekerjaan, kewarganegaraan, kategori_pm, foto_ktp_url
      ) VALUES (
        ${data.desa_berdaya_id},
        ${data.nik},
        ${data.nama},
        ${data.tempat_lahir || null},
        ${data.tanggal_lahir ? new Date(data.tanggal_lahir) : null},
        ${data.jenis_kelamin || null},
        ${data.golongan_darah || null},
        ${data.alamat || null},
        ${data.rt_rw || null},
        ${data.kel_desa || null},
        ${data.kecamatan || null},
        ${data.agama || null},
        ${data.status_perkawinan || null},
        ${data.pekerjaan || null},
        ${data.kewarganegaraan || null},
        ${data.kategori_pm},
        ${data.foto_ktp_url || null}
      )
      RETURNING id
    `
    return { success: true, data: (result as any[])[0] }
  } catch (error: any) {
    console.error('Save PM error:', error)
    if (error.code === '23505') { // Postgres Unique Violation
      throw new Error('NIK ini sudah terdaftar sebagai Penerima Manfaat.')
    }
    throw new Error('Gagal menyimpan data ke database.')
  }
}

export async function getPenerimaManfaatById(id: number) {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error('Unauthorized')

  const role = session.user.role
  const operatorId = session.user.operator_id

  try {
    let result: any[] = []

    if (role === 'RELAWAN' || role === 'PROG_HEAD') {
      result = (await sql`
        SELECT pm.*, dc.nama_desa 
        FROM penerima_manfaat pm
        JOIN desa_berdaya db ON pm.desa_berdaya_id = db.id
        JOIN desa_config dc ON db.desa_id = dc.id
        WHERE pm.id = ${id} AND db.relawan_id = ${operatorId}
        LIMIT 1
      `) as any[]
    } else {
      result = (await sql`
        SELECT pm.*, dc.nama_desa 
        FROM penerima_manfaat pm
        JOIN desa_berdaya db ON pm.desa_berdaya_id = db.id
        JOIN desa_config dc ON db.desa_id = dc.id
        WHERE pm.id = ${id}
        LIMIT 1
      `) as any[]
    }

    if (!result || result.length === 0) {
      throw new Error('Data Penerima Manfaat tidak ditemukan atau Anda tidak memiliki akses.')
    }

    return result[0]
  } catch (error: any) {
    console.error('Fetch PM detail error:', error)
    throw new Error(error.message || 'Gagal mengambil detail Penerima Manfaat.')
  }
}

export async function updatePenerimaManfaat(id: number, data: {
  desa_berdaya_id?: number;
  nik: string;
  nama: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  jenis_kelamin?: string;
  golongan_darah?: string;
  alamat?: string;
  rt_rw?: string;
  kel_desa?: string;
  kecamatan?: string;
  agama?: string;
  status_perkawinan?: string;
  pekerjaan?: string;
  kewarganegaraan?: string;
  kategori_pm: string;
  foto_ktp_url?: string;
}) {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error('Unauthorized')

  if (!id || !data.nik || !data.nama) {
    throw new Error('ID, NIK, dan Nama wajib diisi')
  }

  if (data.nik.length !== 16) {
    throw new Error('NIK harus terdiri dari 16 karakter')
  }

  try {
    const result = await sql`
      UPDATE penerima_manfaat SET 
        desa_berdaya_id = COALESCE(${data.desa_berdaya_id || null}, desa_berdaya_id),
        nik = ${data.nik}, 
        nama = ${data.nama}, 
        tempat_lahir = ${data.tempat_lahir || null}, 
        tanggal_lahir = ${data.tanggal_lahir ? new Date(data.tanggal_lahir) : null}, 
        jenis_kelamin = ${data.jenis_kelamin || null}, 
        golongan_darah = ${data.golongan_darah || null}, 
        alamat = ${data.alamat || null}, 
        rt_rw = ${data.rt_rw || null}, 
        kel_desa = ${data.kel_desa || null}, 
        kecamatan = ${data.kecamatan || null}, 
        agama = ${data.agama || null}, 
        status_perkawinan = ${data.status_perkawinan || null}, 
        pekerjaan = ${data.pekerjaan || null}, 
        kewarganegaraan = ${data.kewarganegaraan || null}, 
        kategori_pm = ${data.kategori_pm}, 
        foto_ktp_url = COALESCE(${data.foto_ktp_url || null}, foto_ktp_url)
      WHERE id = ${id}
      RETURNING id
    `
    return { success: true, data: (result as any[])[0] }
  } catch (error: any) {
    console.error('Update PM error:', error)
    if (error.code === '23505') { 
      throw new Error('NIK ini sudah digunakan oleh Penerima Manfaat lain.')
    }
    throw new Error('Gagal memperbarui data ke database.')
  }
}

export async function updateKtpUrlPenerimaManfaat(id: number, url: string) {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error('Unauthorized')

  if (!id || !url) {
    throw new Error('ID dan URL wajib diisi')
  }

  try {
    await sql`
      UPDATE penerima_manfaat SET 
        foto_ktp_url = ${url}
      WHERE id = ${id}
    `
    return { success: true }
  } catch (error: any) {
    console.error('Update KTP URL error:', error)
    throw new Error('Gagal memperbarui foto KTP.')
  }
}

export async function deletePenerimaManfaat(id: number) {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error('Unauthorized')

  try {
    await sql`
      DELETE FROM penerima_manfaat WHERE id = ${id}
    `
    return { success: true }
  } catch (error: any) {
    console.error('Delete PM error:', error)
    throw new Error('Gagal menghapus data penerima manfaat.')
  }
}

export async function importPemerimaManfaatExcel(
  data: {
    desa_berdaya_id: number;
    nik: string;
    nama: string;
    tempat_lahir?: string;
    tanggal_lahir?: string | Date | null;
    jenis_kelamin?: string;
    golongan_darah?: string;
    alamat?: string;
    rt_rw?: string;
    kel_desa?: string;
    kecamatan?: string;
    agama?: string;
    status_perkawinan?: string;
    pekerjaan?: string;
    kewarganegaraan?: string;
    kategori_pm?: string;
  }[]
) {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error('Unauthorized')

  if (!data || data.length === 0) {
    throw new Error('Data import kosong')
  }

  let successCount = 0
  let errorCount = 0
  const errors: string[] = []

  // Insert sequentially to handle duplicate NIK errors individually without failing the whole batch
  for (const row of data) {
    try {
      if (!row.desa_berdaya_id || !row.nik || !row.nama) {
        throw new Error('Desa Berdaya ID, NIK, dan Nama wajib diisi')
      }
      
      if (row.nik.length !== 16) {
        throw new Error('NIK harus terdiri dari 16 karakter')
      }

      // Kategori PM enum requires: 'LANSIA', 'BUMIL', 'BALITA', 'EKONOMI'
      // Since it's omitted in the new template, default to 'EKONOMI' (as it's the most general one among choices)
      let kategori_pm = row.kategori_pm?.toUpperCase() || 'EKONOMI'
      if (!['LANSIA', 'BUMIL', 'BALITA', 'EKONOMI'].includes(kategori_pm)) {
        kategori_pm = 'EKONOMI' // Fallback to avoid breaking enum validation
      }

      let tgl_lahir = null
      if (row.tanggal_lahir) {
         try {
           tgl_lahir = new Date(row.tanggal_lahir)
         } catch(e) {}
      }

      await sql`
        INSERT INTO penerima_manfaat (
          desa_berdaya_id, nik, nama, tempat_lahir, tanggal_lahir, jenis_kelamin, 
          golongan_darah, alamat, rt_rw, kel_desa, kecamatan, agama, 
          status_perkawinan, pekerjaan, kewarganegaraan, kategori_pm
        ) VALUES (
          ${row.desa_berdaya_id},
          ${row.nik},
          ${row.nama},
          ${row.tempat_lahir || null},
          ${tgl_lahir},
          ${row.jenis_kelamin || null},
          ${row.golongan_darah || null},
          ${row.alamat || null},
          ${row.rt_rw || null},
          ${row.kel_desa || null},
          ${row.kecamatan || null},
          ${row.agama || null},
          ${row.status_perkawinan || null},
          ${row.pekerjaan || null},
          ${row.kewarganegaraan || null},
          ${kategori_pm}
        )
      `
      successCount++
    } catch (error: any) {
      errorCount++
      if (error.code === '23505') { 
        errors.push(`Garis dengan NIK ${row.nik} gagal: NIK sudah terdaftar.`)
      } else {
        errors.push(`Gagal memproses baris NIK ${row.nik}: ${error.message}`)
      }
    }
  }

  return { 
    success: errorCount === 0 || successCount > 0, 
    successCount, 
    errorCount, 
    errors 
  }
}
