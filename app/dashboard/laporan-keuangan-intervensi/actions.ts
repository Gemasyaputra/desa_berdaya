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
      (SELECT COUNT(*) FROM intervensi_anggaran WHERE intervensi_program_id = ip.id AND status_ca != 'BELUM') as uploaded_ca
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
      kp.nama_kategori,
      r.nama as nama_relawan
    FROM intervensi_program ip
    JOIN desa_berdaya db ON ip.desa_berdaya_id = db.id
    JOIN desa_config dc ON db.desa_id = dc.id
    JOIN program p ON ip.program_id = p.id
    JOIN kategori_program kp ON ip.kategori_program_id = kp.id
    JOIN relawan r ON ip.relawan_id = r.id
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

export async function uploadBuktiCA(anggaranId: number, formData: FormData) {
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
  let existing: string[] = []
  if (currentStr) {
    existing = currentStr.split(',').filter(Boolean)
  }
  const finalUrls = [...existing, ...urls].join(',')

  await sql`
    UPDATE intervensi_anggaran 
    SET 
      bukti_ca_url = ${finalUrls},
      status_ca = 'UPLOADED',
      tgl_upload_ca = NOW()
    WHERE id = ${anggaranId}
  `

  revalidatePath('/dashboard/laporan-keuangan-intervensi')
  return { success: true, url: finalUrls }
}

export async function deleteBuktiCA(anggaranId: number, urlToDelete: string) {
  await checkAuth()
  
  const current = await sql`SELECT bukti_ca_url FROM intervensi_anggaran WHERE id = ${anggaranId}`
  const currentStr = (current as any[])[0]?.bukti_ca_url
  if (!currentStr) return { success: true }
  
  const existing = currentStr.split(',').filter(Boolean)
  const remaining = existing.filter((u: string) => u !== urlToDelete)
  const finalUrls = remaining.length > 0 ? remaining.join(',') : null

  if (remaining.length === 0) {
    await sql`
      UPDATE intervensi_anggaran 
      SET bukti_ca_url = NULL, status_ca = 'BELUM', tgl_upload_ca = NULL 
      WHERE id = ${anggaranId}
    `
  } else {
    await sql`
      UPDATE intervensi_anggaran 
      SET bukti_ca_url = ${finalUrls} 
      WHERE id = ${anggaranId}
    `
  }
  
  try {
    await del(urlToDelete)
  } catch (e) {
    console.error('Failed to delete from Vercel Blob', e)
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
