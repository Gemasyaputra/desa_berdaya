'use server'

import { sql, getSqlClient } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { put, del } from '@vercel/blob'
import { revalidatePath } from 'next/cache'

async function checkAuth() {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error('Unauthorized')
  return session.user
}

export async function getLaporanKeuanganIntervensi() {
  const user = await checkAuth()
  const role = (user as any).role
  const operatorId = (user as any).operator_id
  const isKorwil = (user as any).is_korwil

  const values: any[] = []
  let queryText = `
    SELECT 
      ip.*,
      dc.nama_desa,
      p.nama_program,
      r.nama as nama_relawan,
      (SELECT COUNT(*) FROM intervensi_anggaran WHERE intervensi_program_id = ip.id) as total_bulan,
      (SELECT COUNT(*) FROM intervensi_anggaran WHERE intervensi_program_id = ip.id AND status_ca != 'BELUM') as uploaded_ca,
      (SELECT tahun FROM intervensi_anggaran WHERE intervensi_program_id = ip.id ORDER BY tahun DESC LIMIT 1) as tahun
    FROM intervensi_program ip
    JOIN desa_berdaya db ON ip.desa_berdaya_id = db.id
    JOIN desa_config dc ON db.desa_id = dc.id
    JOIN program p ON ip.program_id = p.id
    JOIN relawan r ON ip.relawan_id = r.id
  `

  if (role === 'RELAWAN' || role === 'USER') {
    values.push(operatorId)
    queryText += ` WHERE ip.relawan_id = $${values.length}`
  } else if (isKorwil && operatorId) {
    values.push(operatorId)
    queryText += ` WHERE r.korwil_id = $${values.length}`
  }

  queryText += ` ORDER BY ip.created_at DESC`

  const client = getSqlClient()
  const res = await client(queryText, values)

  return Array.isArray(res) ? res : []
}

export async function getDetailLaporanKeuangan(id: number) {
  await checkAuth()
  
  const header = await sql`
    SELECT 
      ip.*,
      dc.nama_desa,
      p.nama_program,
      kp.nama_kategori as kategori_program,
      r.nama as relawan_nama,
      r.hp as relawan_telepon,
      u.email as relawan_email,
      r.nomor_rekening as relawan_no_rekening,
      r.bank as relawan_nama_bank,
      r.atas_nama as relawan_atas_nama
    FROM intervensi_program ip
    JOIN desa_berdaya db ON ip.desa_berdaya_id = db.id
    JOIN desa_config dc ON db.desa_id = dc.id
    JOIN program p ON ip.program_id = p.id
    JOIN kategori_program kp ON ip.kategori_program_id = kp.id
    JOIN relawan r ON ip.relawan_id = r.id
    LEFT JOIN users u ON r.user_id = u.id
    WHERE ip.id = ${id}
  `

  const anggaran = await sql`
    SELECT * FROM intervensi_anggaran 
    WHERE intervensi_program_id = ${id}
    ORDER BY tahun ASC, bulan ASC
  `

  return {
    header: (header as any[])[0],
    anggaran: Array.isArray(anggaran) ? anggaran : []
  }
}

export async function migrateDB() {
  await sql`ALTER TABLE intervensi_anggaran ADD COLUMN IF NOT EXISTS kegiatan_terkait JSONB DEFAULT '[]'::jsonb;`
  return { success: true }
}

export async function saveKegiatanTerkait(anggaranId: number, kegiatanIds: number[]) {
  await checkAuth()
  try {
    await sql`ALTER TABLE intervensi_anggaran ADD COLUMN IF NOT EXISTS kegiatan_terkait JSONB DEFAULT '[]'::jsonb;`
  } catch (e) {}
  
  await sql`
    UPDATE intervensi_anggaran
    SET kegiatan_terkait = ${JSON.stringify(kegiatanIds)}
    WHERE id = ${anggaranId}
  `
  const { revalidatePath } = await import('next/cache')
  revalidatePath('/dashboard/laporan-keuangan-intervensi')
  return { success: true }
}

export async function getLaporanKegiatanForIntervensi(intervensiId: number) {
  await checkAuth()
  const res = await sql`
    SELECT lk.id, lk.judul_kegiatan, lk.tanggal_kegiatan
    FROM laporan_kegiatan lk
    JOIN intervensi_program ip ON lk.desa_berdaya_id = ip.desa_berdaya_id
    WHERE ip.id = ${intervensiId}
    ORDER BY lk.tanggal_kegiatan DESC
  `
  return Array.isArray(res) ? res : []
}

export async function uploadBuktiCA(anggaranId: number, deskripsi: string, nominal: number, formData: FormData, kegiatanIds?: number[], kegiatanJuduls?: string[]) {
  await checkAuth()
  const files = formData.getAll('files') as File[]
  if (!files || files.length === 0) throw new Error('File tidak ditemukan')

  const urls = []
  for (const file of files) {
    const blob = await put(`ca/${Date.now()}-${file.name}`, file, { access: 'public' })
    urls.push(blob.url)
  }

  const current = await sql`SELECT bukti_ca_url FROM intervensi_anggaran WHERE id = ${anggaranId}`
  const currentStr = (current as any[])[0]?.bukti_ca_url
  
  let existingJson: any[] = []
  if (currentStr) {
    try {
      if (currentStr.trim().startsWith('[')) {
        existingJson = JSON.parse(currentStr)
      } else {
        existingJson = [{ id: 'legacy', deskripsi: 'Upload Sebelumnya', urls: currentStr.split(',').filter(Boolean) }]
      }
    } catch {
      existingJson = [{ id: 'legacy', deskripsi: 'Upload Sebelumnya', urls: currentStr.split(',').filter(Boolean) }]
    }
  }

  const newEntry = {
    id: Date.now().toString(),
    deskripsi,
    nominal,
    urls,
    kegiatan_ids: kegiatanIds || [],
    kegiatan_juduls: kegiatanJuduls || []
  }

  existingJson.push(newEntry)
  const finalStr = JSON.stringify(existingJson)

  await sql`
    UPDATE intervensi_anggaran 
    SET 
      bukti_ca_url = ${finalStr},
      status_ca = 'UPLOADED',
      tgl_upload_ca = NOW()
    WHERE id = ${anggaranId}
  `

  revalidatePath('/dashboard/laporan-keuangan-intervensi')
  return { success: true, url: finalStr }
}

export async function deleteBuktiCA(anggaranId: number, entryId: string, urlToDelete?: string) {
  await checkAuth()
  
  const current = await sql`SELECT bukti_ca_url FROM intervensi_anggaran WHERE id = ${anggaranId}`
  const currentStr = (current as any[])[0]?.bukti_ca_url
  if (!currentStr) return { success: true }
  
  let existingJson: any[] = []
  try {
    if (currentStr.trim().startsWith('[')) {
      existingJson = JSON.parse(currentStr)
    } else {
      existingJson = [{ id: 'legacy', deskripsi: 'Upload Sebelumnya', urls: currentStr.split(',').filter(Boolean) }]
    }
  } catch {
    existingJson = [{ id: 'legacy', deskripsi: 'Upload Sebelumnya', urls: currentStr.split(',').filter(Boolean) }]
  }

  if (urlToDelete) {
    const entry = existingJson.find(e => e.id === entryId)
    if (entry) {
      entry.urls = entry.urls.filter((u: string) => u !== urlToDelete)
      if (entry.urls.length === 0) {
        existingJson = existingJson.filter(e => e.id !== entryId)
      }
    }
    try {
      await del(urlToDelete)
    } catch (e) {
      console.error('Failed to delete from Vercel Blob', e)
    }
  } else {
    const entry = existingJson.find(e => e.id === entryId)
    if (entry) {
      for (const u of entry.urls) {
        try { await del(u) } catch (e) {}
      }
    }
    existingJson = existingJson.filter(e => e.id !== entryId)
  }

  const finalStr = existingJson.length > 0 ? JSON.stringify(existingJson) : null

  if (!finalStr) {
    await sql`
      UPDATE intervensi_anggaran 
      SET bukti_ca_url = NULL, status_ca = 'BELUM', tgl_upload_ca = NULL 
      WHERE id = ${anggaranId}
    `
  } else {
    await sql`
      UPDATE intervensi_anggaran 
      SET bukti_ca_url = ${finalStr} 
      WHERE id = ${anggaranId}
    `
  }
  
  revalidatePath('/dashboard/laporan-keuangan-intervensi')
  return { success: true }
}

export async function verifyCA(anggaranId: number, status: 'DIVERIFIKASI' | 'UPLOADED' | 'BELUM', catatan: string) {
  const user = await checkAuth()
  const role = (user as any).role
  
  if (role !== 'ADMIN' && role !== 'FINANCE' && role !== 'MONEV') {
    throw new Error('Hanya Admin atau Finance yang bisa memverifikasi')
  }

  await sql`
    UPDATE intervensi_anggaran 
    SET 
      status_ca = ${status},
      catatan_ca = ${catatan}
    WHERE id = ${anggaranId}
  `

  revalidatePath('/dashboard/laporan-keuangan-intervensi')
  return { success: true }
}

export async function updateCatatanRelawan(anggaranId: number, catatan: string) {
  await checkAuth()
  await sql`
    UPDATE intervensi_anggaran 
    SET catatan_ca = ${catatan}
    WHERE id = ${anggaranId}
  `
  return { success: true }
}

export async function tolakBuktiCA(anggaranId: number, entryId: string, alasan: string) {
  const user = await checkAuth()
  const role = (user as any).role
  if (role !== 'ADMIN' && role !== 'FINANCE' && role !== 'MONEV') {
    throw new Error('Tidak memiliki akses')
  }

  const current = await sql`SELECT bukti_ca_url FROM intervensi_anggaran WHERE id = ${anggaranId}`
  const currentStr = (current as any[])[0]?.bukti_ca_url
  if (!currentStr) throw new Error('Data tidak ditemukan')
  
  let existingJson: any[] = []
  try {
    existingJson = JSON.parse(currentStr)
  } catch {
    existingJson = [{ id: 'legacy', deskripsi: 'Upload Sebelumnya', urls: currentStr.split(',').filter(Boolean) }]
  }

  const entry = existingJson.find((e: any) => e.id === entryId)
  if (entry) {
    entry.ditolak = true
    entry.alasan_tolak = alasan
  } else {
    throw new Error('Entry tidak ditemukan')
  }

  const finalStr = JSON.stringify(existingJson)

  await sql`
    UPDATE intervensi_anggaran 
    SET bukti_ca_url = ${finalStr} 
    WHERE id = ${anggaranId}
  `
  
  revalidatePath('/dashboard/laporan-keuangan-intervensi')
  return { success: true }
}

export async function uploadBuktiPengembalian(anggaranId: number, deskripsi: string, nominal: number, formData: FormData, kegiatanIds?: number[], kegiatanJuduls?: string[]) {
  await checkAuth()
  const files = formData.getAll('files') as File[]
  if (!files || files.length === 0) throw new Error('File tidak ditemukan')

  const urls = []
  for (const file of files) {
    const blob = await put(`pengembalian/${Date.now()}-${file.name}`, file, { access: 'public' })
    urls.push(blob.url)
  }

  const current = await sql`SELECT bukti_pengembalian_url FROM intervensi_anggaran WHERE id = ${anggaranId}`
  const currentStr = (current as any[])[0]?.bukti_pengembalian_url
  
  let existingJson: any[] = []
  if (currentStr) {
    try {
      existingJson = JSON.parse(currentStr)
    } catch {
      existingJson = []
    }
  }

  const newEntry = {
    id: Date.now().toString(),
    deskripsi,
    nominal,
    urls,
    kegiatan_ids: kegiatanIds || [],
    kegiatan_juduls: kegiatanJuduls || []
  }

  existingJson.push(newEntry)
  const finalStr = JSON.stringify(existingJson)

  await sql`
    UPDATE intervensi_anggaran 
    SET 
      bukti_pengembalian_url = ${finalStr},
      status_pengembalian = 'UPLOADED',
      tgl_upload_pengembalian = NOW()
    WHERE id = ${anggaranId}
  `

  revalidatePath('/dashboard/laporan-keuangan-intervensi')
  return { success: true, url: finalStr }
}

export async function deleteBuktiPengembalian(anggaranId: number, entryId: string, urlToDelete?: string) {
  await checkAuth()
  
  const current = await sql`SELECT bukti_pengembalian_url FROM intervensi_anggaran WHERE id = ${anggaranId}`
  const currentStr = (current as any[])[0]?.bukti_pengembalian_url
  if (!currentStr) return { success: true }
  
  let existingJson: any[] = []
  try {
    existingJson = JSON.parse(currentStr)
  } catch {
    existingJson = []
  }

  if (urlToDelete) {
    const entry = existingJson.find((e: any) => e.id === entryId)
    if (entry) {
      entry.urls = entry.urls.filter((u: string) => u !== urlToDelete)
      if (entry.urls.length === 0) {
        existingJson = existingJson.filter((e: any) => e.id !== entryId)
      }
    }
    try {
      await del(urlToDelete)
    } catch (e) {
      console.error('Failed to delete from Vercel Blob', e)
    }
  } else {
    const entry = existingJson.find((e: any) => e.id === entryId)
    if (entry) {
      for (const u of entry.urls) {
        try { await del(u) } catch (e) {}
      }
    }
    existingJson = existingJson.filter((e: any) => e.id !== entryId)
  }

  const finalStr = existingJson.length > 0 ? JSON.stringify(existingJson) : null

  if (!finalStr) {
    await sql`
      UPDATE intervensi_anggaran 
      SET bukti_pengembalian_url = NULL, status_pengembalian = 'BELUM', tgl_upload_pengembalian = NULL 
      WHERE id = ${anggaranId}
    `
  } else {
    await sql`
      UPDATE intervensi_anggaran 
      SET bukti_pengembalian_url = ${finalStr} 
      WHERE id = ${anggaranId}
    `
  }
  
  revalidatePath('/dashboard/laporan-keuangan-intervensi')
  return { success: true }
}

export async function verifyPengembalian(anggaranId: number, status: 'DIVERIFIKASI' | 'UPLOADED' | 'BELUM', catatan: string) {
  const user = await checkAuth()
  const role = (user as any).role
  
  if (role !== 'ADMIN' && role !== 'FINANCE' && role !== 'MONEV') {
    throw new Error('Hanya Admin atau Finance yang bisa memverifikasi')
  }

  await sql`
    UPDATE intervensi_anggaran 
    SET 
      status_pengembalian = ${status},
      catatan_pengembalian = ${catatan}
    WHERE id = ${anggaranId}
  `

  revalidatePath('/dashboard/laporan-keuangan-intervensi')
  return { success: true }
}

export async function tolakBuktiPengembalian(anggaranId: number, entryId: string, alasan: string) {
  const user = await checkAuth()
  const role = (user as any).role
  if (role !== 'ADMIN' && role !== 'FINANCE' && role !== 'MONEV') {
    throw new Error('Tidak memiliki akses')
  }

  const current = await sql`SELECT bukti_pengembalian_url FROM intervensi_anggaran WHERE id = ${anggaranId}`
  const currentStr = (current as any[])[0]?.bukti_pengembalian_url
  if (!currentStr) throw new Error('Data tidak ditemukan')
  
  let existingJson: any[] = []
  try {
    existingJson = JSON.parse(currentStr)
  } catch {
    existingJson = []
  }

  const entry = existingJson.find((e: any) => e.id === entryId)
  if (entry) {
    entry.ditolak = true
    entry.alasan_tolak = alasan
  } else {
    throw new Error('Entry tidak ditemukan')
  }

  const finalStr = JSON.stringify(existingJson)

  await sql`
    UPDATE intervensi_anggaran 
    SET bukti_pengembalian_url = ${finalStr} 
    WHERE id = ${anggaranId}
  `
  
  revalidatePath('/dashboard/laporan-keuangan-intervensi')
  return { success: true }
}
