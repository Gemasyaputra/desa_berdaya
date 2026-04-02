'use server'

import { sql } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function getMyProfile() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return { error: 'Tidak ada sesi valid.' }

    const userEmail = session.user.email

    // Cari user ID berdasarkan email
    const users = await sql`SELECT id, email FROM users WHERE email = ${userEmail} LIMIT 1`
    const userResult = Array.isArray(users) ? users : []
    if (userResult.length === 0) return { error: 'Akun pengguna tidak ditemukan di sistem.' }
    const userId = (userResult[0] as any).id

    // Cari profil relawan yang tertaut ke user_id
    const resultQuery = await sql`
      SELECT r.*, u.email 
      FROM relawan r
      JOIN users u ON r.user_id = u.id
      WHERE r.user_id = ${userId} LIMIT 1
    `
    const rows = Array.isArray(resultQuery) ? resultQuery : []
    
    if (rows.length === 0) {
      return { error: 'Profil data relawan tidak ditemukan / belum dibuat.' }
    }

    return { success: true, data: rows[0] }
  } catch (err: any) {
    return { error: err.message }
  }
}

export async function updateMyProfile(payload: any) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return { error: 'Tidak ada sesi valid.' }

    const userEmail = session.user.email

    // Kita pastikan data yang diambil sesuai format, DAN MENGABAIKAN input email (sehingga tidak bisa dirubah via API request)
    const {
      foto_url,
      tanggal_lahir, jenis_kelamin, alamat, nomor_induk, ketokohan, cabang_dbf,
      nomor_ktp, nomor_kk, pendidikan, pekerjaan, jabatan_desa, keahlian, status_edukasi,
      coa_kafalah, nama_coa_kafalah,
      bank, nomor_rekening, atas_nama,
      akun_facebook, akun_twitter, akun_instagram
    } = payload

    // Cari user ID
    const users = await sql`SELECT id FROM users WHERE email = ${userEmail} LIMIT 1`
    const userResult = Array.isArray(users) ? users : []
    if (userResult.length === 0) return { error: 'Akun pengguna tidak ditemukan di sistem.' }
    const userId = (userResult[0] as any).id

    await sql`
      UPDATE relawan
      SET
        foto_url = ${foto_url || null},
        tanggal_lahir = ${tanggal_lahir || null},
        jenis_kelamin = ${jenis_kelamin || null},
        alamat = ${alamat || null},
        nomor_induk = ${nomor_induk || null},
        ketokohan = ${ketokohan || null},
        cabang_dbf = ${cabang_dbf || null},
        nomor_ktp = ${nomor_ktp || null},
        nomor_kk = ${nomor_kk || null},
        pendidikan = ${pendidikan || null},
        pekerjaan = ${pekerjaan || null},
        jabatan_desa = ${jabatan_desa || null},
        keahlian = ${keahlian || null},
        status_edukasi = ${status_edukasi || null},
        coa_kafalah = ${coa_kafalah || null},
        nama_coa_kafalah = ${nama_coa_kafalah || null},
        bank = ${bank || null},
        nomor_rekening = ${nomor_rekening || null},
        atas_nama = ${atas_nama || null},
        akun_facebook = ${akun_facebook || null},
        akun_twitter = ${akun_twitter || null},
        akun_instagram = ${akun_instagram || null}
      WHERE user_id = ${userId}
    `

    revalidatePath('/dashboard/profil')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}
