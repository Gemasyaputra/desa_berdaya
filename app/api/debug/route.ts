import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';

export async function GET(request: Request) {
    const url = new URL(request.url);
    const intervensiId = url.searchParams.get('id') || '1';
    
    // Check activities related to intervensi program
    try {
        const kegiatans = await sql`
            SELECT lk.id, lk.judul_kegiatan, lk.tanggal_kegiatan, lk.program_id, lk.desa_berdaya_id,
                   p1.kategori_id as lk_kat, ip.kategori_program_id as ip_kat, ip.desa_berdaya_id as ip_desa
            FROM laporan_kegiatan lk
            JOIN program p1 ON lk.program_id = p1.id
            JOIN intervensi_program ip ON lk.desa_berdaya_id = ip.desa_berdaya_id 
               AND p1.kategori_id = ip.kategori_program_id
            ORDER BY lk.tanggal_kegiatan DESC
        `;
        
        const allKegiatans = await sql`
            SELECT id, judul_kegiatan, tanggal_kegiatan, program_id, desa_berdaya_id FROM laporan_kegiatan
        `;
        
        return NextResponse.json({
            mappedKegiatans: kegiatans,
            allKegiatans: allKegiatans
        });
    } catch(e: any) {
        return NextResponse.json({ error: e.message });
    }
}
