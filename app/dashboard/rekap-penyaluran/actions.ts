'use server'

import { sql } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

async function checkAuth() {
  const session = await getServerSession(authOptions)
  if (!session?.user) throw new Error('Unauthorized')
  return session.user
}

export async function getRekapPenyaluran() {
  await checkAuth()
  
  const res = await sql`
    SELECT 
      ip.id as program_id,
      p.nama_program,
      kp.nama_kategori as kategori_program,
      ip.sumber_dana,
      dc.nama_desa,
      r.nama as relawan_nama,
      a.id as anggaran_id,
      a.tahun,
      a.bulan,
      a.ajuan_ri,
      a.anggaran_dicairkan,
      a.bukti_ca_url,
      a.bukti_pengembalian_url
    FROM intervensi_program ip
    LEFT JOIN desa_berdaya db ON ip.desa_berdaya_id = db.id
    LEFT JOIN desa_config dc ON db.desa_id = dc.id
    LEFT JOIN program p ON ip.program_id = p.id
    LEFT JOIN kategori_program kp ON ip.kategori_program_id = kp.id
    LEFT JOIN relawan r ON ip.relawan_id = r.id
    LEFT JOIN intervensi_anggaran a ON a.intervensi_program_id = ip.id
    ORDER BY dc.nama_desa ASC, ip.id DESC
  `

  const items = Array.isArray(res) ? res : Array.isArray((res as any)?.rows) ? (res as any).rows : [];

  const monthNames = ['', 'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];

  const results = items.map(item => {
    let total_realisasi = 0;
    let total_pengembalian = 0;

    if (item.anggaran_id) {
      if (item.bukti_ca_url) {
        try {
          if (item.bukti_ca_url.trim().startsWith('[')) {
            const entries = JSON.parse(item.bukti_ca_url);
            if (Array.isArray(entries)) {
              total_realisasi = entries.filter((e: any) => !e.ditolak).reduce((acc, val) => acc + (Number(val.nominal) || 0), 0);
            }
          }
        } catch {}
      }
      
      if (item.bukti_pengembalian_url) {
        try {
          if (item.bukti_pengembalian_url.trim().startsWith('[')) {
            const entries = JSON.parse(item.bukti_pengembalian_url);
            if (Array.isArray(entries)) {
              total_pengembalian = entries.filter((e: any) => !e.ditolak).reduce((acc, val) => acc + (Number(val.nominal) || 0), 0);
            }
          }
        } catch {}
      }
    }

    const total_dicairkan = item.anggaran_id ? (Number(item.anggaran_dicairkan) || 0) : 0;

    return {
      program_id: item.program_id,
      anggaran_id: item.anggaran_id,
      nama_program: item.nama_program,
      kategori_program: item.kategori_program,
      tahun: item.tahun || '2025',
      bulan: item.bulan ? `${String(item.bulan).padStart(2, '0')} - ${monthNames[Number(item.bulan)] || ''}`.trim() : '-',
      sumber_dana: item.sumber_dana || '-',
      nama_desa: item.nama_desa || '-',
      relawan_nama: item.relawan_nama || '-',
      total_ajuan: item.anggaran_id ? (Number(item.ajuan_ri) || 0) : 0,
      total_dicairkan,
      total_realisasi,
      total_pengembalian,
      sisa_saldo: total_dicairkan - total_realisasi - total_pengembalian
    };
  });

  return results;
}
