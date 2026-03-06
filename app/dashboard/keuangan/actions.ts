'use server'

import { put } from '@vercel/blob'

export async function getDesaBerdayaOptions() {
  // Mock data untuk saat ini jika database belum sepenuhnya terstruktur untuk keuangan
  return [
    { id: 1, nama_desa: 'Desa Dago', alokasi_anggaran: 5000000 },
    { id: 2, nama_desa: 'Desa Cibinong', alokasi_anggaran: 7500000 },
  ]
}

export async function uploadBukti(formData: FormData) {
  const file = formData.get('file') as File
  if (!file) throw new Error('File tidak ditemukan')

  // Using `put` directly on Server Actions bypasses the need for webhooks on localhost!
  const blob = await put(file.name, file, { access: 'public' })
  return blob.url
}

export async function createLaporanKeuangan(data: any) {
  // Simulasi insert ke DB
  return { success: true, id: Math.floor(Math.random() * 1000) }
}
