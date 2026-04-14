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
  const programMap = new Map<number, any>();

  for (const item of items) {
    if (!programMap.has(item.program_id)) {
      programMap.set(item.program_id, {
        program_id: item.program_id,
        nama_program: item.nama_program,
        kategori_program: item.kategori_program,
        sumber_dana: item.sumber_dana || '-',
        nama_desa: item.nama_desa || '-',
        relawan_nama: item.relawan_nama || '-',
        total_ajuan: 0,
        total_dicairkan: 0,
        total_realisasi: 0,
        total_pengembalian: 0
      })
    }
    
    const pInfo = programMap.get(item.program_id);
    
    if (item.anggaran_id) {
      pInfo.total_ajuan += Number(item.ajuan_ri) || 0;
      pInfo.total_dicairkan += Number(item.anggaran_dicairkan) || 0;
      
      if (item.bukti_ca_url) {
        try {
          if (item.bukti_ca_url.trim().startsWith('[')) {
            const entries = JSON.parse(item.bukti_ca_url);
            if (Array.isArray(entries)) {
              pInfo.total_realisasi += entries.filter((e: any) => !e.ditolak).reduce((acc, val) => acc + (Number(val.nominal) || 0), 0);
            }
          }
        } catch {}
      }
      
      if (item.bukti_pengembalian_url) {
        try {
          if (item.bukti_pengembalian_url.trim().startsWith('[')) {
            const entries = JSON.parse(item.bukti_pengembalian_url);
            if (Array.isArray(entries)) {
              pInfo.total_pengembalian += entries.filter((e: any) => !e.ditolak).reduce((acc, val) => acc + (Number(val.nominal) || 0), 0);
            }
          }
        } catch {}
      }
    }
  }

  const results = Array.from(programMap.values()).map(p => ({
    ...p,
    sisa_saldo: p.total_dicairkan - p.total_realisasi - p.total_pengembalian
  }));

  return results;
}
