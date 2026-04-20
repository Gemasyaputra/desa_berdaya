const { sql } = require('./lib/db');
(async () => {
    try {
        const result = await sql`
            SELECT lk.id, lk.judul_kegiatan, lk.desa_berdaya_id, p1.kategori_id as lk_kat
            FROM laporan_kegiatan lk
            JOIN program p1 ON lk.program_id = p1.id
        `;
        console.log("KEGIATAN:", result);
        const result2 = await sql`
            SELECT ip.id, ip.desa_berdaya_id, ip.kategori_program_id
            FROM intervensi_program ip
        `;
        console.log("INTERVENSI:", result2);
    } catch(e) {
        console.error(e);
    } finally {
        process.exit();
    }
})();
