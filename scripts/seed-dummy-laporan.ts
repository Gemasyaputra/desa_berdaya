/**
 * Seed dummy data untuk:
 * - laporan_kegiatan  (10 record)
 * - intervensi_program + intervensi_anggaran  (3 program × 3 bulan)
 *
 * Jalankan dengan:
 *   npx ts-node --project tsconfig.json -e "require('./scripts/seed-dummy-laporan.ts')"
 * atau via tsx:
 *   npx tsx scripts/seed-dummy-laporan.ts
 */

import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env' })

const sql = neon(process.env.DATABASE_URL!)

// ─── Helper ───────────────────────────────────────────────────────────────────
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
const isoDate = (daysAgo: number) => {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d.toISOString().split('T')[0]
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('🔍 Mengambil referensi data dari database...')

  // Ambil desa_berdaya yang aktif
  const desaRows = await sql`
    SELECT db.id, dc.nama_desa, db.relawan_id
    FROM desa_berdaya db
    JOIN desa_config dc ON db.desa_id = dc.id
    WHERE db.status_aktif = true
    LIMIT 5
  `
  if (!desaRows.length) {
    console.error('❌ Tidak ada desa_berdaya aktif. Seed desa dulu.')
    process.exit(1)
  }

  // Ambil program yang ada
  const programRows = await sql`
    SELECT p.id, p.nama_program, p.kategori_id, kp.nama_kategori, p.form_category_id
    FROM program p
    JOIN kategori_program kp ON p.kategori_id = kp.id
    LIMIT 6
  `
  if (!programRows.length) {
    console.error('❌ Tidak ada program. Seed master program dulu.')
    process.exit(1)
  }

  // Ambil relawan aktif
  const relawanRows = await sql`SELECT id, nama FROM relawan LIMIT 5`
  if (!relawanRows.length) {
    console.error('❌ Tidak ada relawan.')
    process.exit(1)
  }

  // Ambil penerima manfaat
  const pmRows = await sql`SELECT id, jenis_kelamin FROM penerima_manfaat LIMIT 20`

  // Ambil sumber dana jika ada
  const sumberDanaRows = await sql`SELECT id FROM sumber_dana LIMIT 3`.catch(() => [] as any[])

  console.log(`✅ Ditemukan: ${desaRows.length} desa, ${programRows.length} program, ${relawanRows.length} relawan, ${pmRows.length} PM`)

  // ─── 1. Laporan Kegiatan ───────────────────────────────────────────────────
  console.log('\n📋 Menyisipkan dummy Laporan Kegiatan...')

  const judulTemplates = [
    'Pembinaan Rutin Kelompok UMKM',
    'Penyuluhan Kesehatan Ibu dan Anak',
    'Pelatihan Pertanian Organik',
    'Monitoring Perkembangan Usaha PM',
    'Pendampingan Digitalisasi UMKM',
    'Kegiatan Posyandu Bulanan',
    'Sosialisasi Program Desa Berdaya',
    'Evaluasi Capaian Program Semester',
    'Pelatihan Pembuatan Produk UMKM',
    'Kunjungan Lapangan Desa Binaan',
  ]

  const lokasiList = [
    'Balai Desa Setempat',
    'Rumah Ketua RT 03',
    'Masjid Al-Ikhlas',
    'Gedung Serbaguna Desa',
    'Posyandu Melati',
    'Lapangan Desa',
    'Rumah Relawan',
  ]

  const periodeList = ['Januari 2025','Februari 2025','Maret 2025','April 2025','Mei 2025']
  const sasaranList = ['Ibu Rumah Tangga', 'UMKM Binaan', 'Kelompok Petani', 'Pemuda Desa', 'Lansia']

  for (let i = 0; i < 10; i++) {
    const desa = pick(desaRows as any[])
    const program = pick(programRows as any[])
    const pmSample = pmRows.slice(0, 5 + Math.floor(Math.random() * 8))
    const pmIds = pmSample.map((p: any) => p.id)
    const laki = pmSample.filter((p: any) => p.jenis_kelamin?.toUpperCase() === 'LAKI-LAKI').length
    const perempuan = pmSample.length - laki

    await sql`
      INSERT INTO laporan_kegiatan (
        desa_berdaya_id, jenis_kegiatan, judul_kegiatan, deskripsi,
        total_realisasi, bukti_url, tanggal_kegiatan,
        sasaran_program, lokasi_pelaksanaan, periode_laporan,
        jumlah_pm_laki, jumlah_pm_perempuan, jumlah_pm_total,
        jumlah_kelompok_laki, jumlah_kelompok_perempuan,
        is_terdokumentasi, program_id, form_category_id,
        kelompok_ids, penerima_manfaat_ids
      ) VALUES (
        ${desa.id},
        ${program.nama_kategori},
        ${judulTemplates[i]},
        ${'Kegiatan ' + judulTemplates[i] + ' dilaksanakan bersama warga desa ' + desa.nama_desa + ' dengan antusias. Seluruh peserta aktif mengikuti rangkaian kegiatan yang telah dipersiapkan oleh Relawan bersama tim program.'},
        0,
        ${'{}'},
        ${isoDate(i * 5 + 2)},
        ${sasaranList[i % sasaranList.length]},
        ${lokasiList[i % lokasiList.length]},
        ${periodeList[i % periodeList.length]},
        ${laki}, ${perempuan}, ${pmSample.length},
        ${laki}, ${perempuan},
        true,
        ${program.id},
        ${program.form_category_id || null},
        ${'{}'},
        ${pmIds}
      )
    `
    console.log(`   ✓ [${i + 1}/10] ${judulTemplates[i]} — ${desa.nama_desa}`)
  }

  // ─── 2. Intervensi Program + Anggaran ─────────────────────────────────────
  console.log('\n💰 Menyisipkan dummy Laporan Keuangan (Intervensi Program)...')

  const bulanLabels = ['Januari','Februari','Maret','April','Mei','Juni']
  const anggaranPerBulan = [2500000, 3000000, 2000000, 2750000, 3500000, 1500000]
  const statusOptions: ('BELUM' | 'UPLOADED' | 'DIVERIFIKASI')[] = ['BELUM', 'UPLOADED', 'DIVERIFIKASI']

  // Buat 3 intervensi program dengan desa & program berbeda
  for (let ip = 0; ip < 3; ip++) {
    const desa = desaRows[ip % desaRows.length] as any
    const program = programRows[ip % programRows.length] as any
    const relawan = relawanRows[ip % relawanRows.length] as any
    const sumberDanaLabel = ['Donasi Publik', 'Dana ZIS', 'CSR Perusahaan'][ip]
    const fundraiserName = ['Budi Santoso', 'Siti Rahma', 'Ahmad Fauzi'][ip]

    // Cek apakah intervensi sudah ada untuk kombinasi ini
    const existing = await sql`
      SELECT id FROM intervensi_program
      WHERE desa_berdaya_id = ${desa.id} AND program_id = ${program.id}
      LIMIT 1
    `

    let ipId: number
    if ((existing as any[]).length > 0) {
      ipId = (existing as any[])[0].id
      console.log(`   ↳ Intervensi sudah ada (id=${ipId}), gunakan existing`)
    } else {
      const ipResult = await sql`
        INSERT INTO intervensi_program (
          desa_berdaya_id, program_id, kategori_program_id,
          relawan_id, sumber_dana, fundraiser, deskripsi, status
        ) VALUES (
          ${desa.id}, ${program.id}, ${program.kategori_id},
          ${relawan.id}, ${sumberDanaLabel}, ${fundraiserName},
          ${'Program intervensi ' + program.nama_program + ' untuk desa ' + desa.nama_desa + ' tahun 2025'},
          ${'AKTIF'}
        ) RETURNING id
      `
      ipId = (ipResult as any[])[0].id
      console.log(`   ✓ Intervensi Program id=${ipId}: ${program.nama_program} — ${desa.nama_desa}`)
    }

    // Buat anggaran per bulan (3 bulan)
    for (let b = 0; b < 3; b++) {
      const bulan = b + 1
      const tahun = 2025
      const ajuanRi = anggaranPerBulan[b]
      // status_ca: 'BELUM' | 'UPLOADED' | 'DIVERIFIKASI'
      const statusCA: string = statusOptions[b % 3]

      // Cek duplikat
      const existingAng = await sql`
        SELECT id FROM intervensi_anggaran
        WHERE intervensi_program_id = ${ipId} AND bulan = ${bulan} AND tahun = ${tahun}
        LIMIT 1
      `
      if ((existingAng as any[]).length > 0) {
        console.log(`      ↳ Anggaran bulan ${bulan} sudah ada, skip`)
        continue
      }

      const buktiCA = statusCA !== 'BELUM' ? JSON.stringify([{
        id: Date.now().toString() + b,
        deskripsi: `Bukti CA ${bulanLabels[b]} ${tahun} — ${program.nama_program}`,
        nominal: ajuanRi,
        urls: [],
        kegiatan_ids: [],
        kegiatan_juduls: []
      }]) : null

      await sql`
        INSERT INTO intervensi_anggaran (
          intervensi_program_id, bulan, tahun,
          ajuan_ri, anggaran_disetujui, anggaran_dicairkan,
          status_ca, bukti_ca_url, tgl_upload_ca,
          catatan_ca, status_pencairan
        ) VALUES (
          ${ipId}, ${bulan}, ${tahun},
          ${ajuanRi},
          ${statusCA === 'DIVERIFIKASI' ? ajuanRi : 0},
          ${statusCA === 'DIVERIFIKASI' ? ajuanRi : 0},
          ${statusCA}, ${buktiCA},
          ${statusCA !== 'BELUM' ? new Date(2025, b, 15).toISOString() : null},
          ${statusCA === 'DIVERIFIKASI' ? 'CA telah diverifikasi oleh Finance' : null},
          ${statusCA === 'DIVERIFIKASI' ? 'CAIR' : 'PENDING'}
        )
      `
      console.log(`      ✓ Anggaran ${bulanLabels[b]} ${tahun} — status CA: ${statusCA}`)
    }
  }


  console.log('\n✅ Seed dummy laporan selesai!')
  console.log('   → Buka /dashboard/laporan-kegiatan untuk melihat hasilnya')
  console.log('   → Buka /dashboard/laporan-keuangan-intervensi untuk melihat CA')
  process.exit(0)
}

main().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
