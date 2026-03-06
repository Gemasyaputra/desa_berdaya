import { neon } from '@neondatabase/serverless'
import * as dotenv from 'dotenv'
dotenv.config()
const sql = neon(process.env.DATABASE_URL || process.env.POSTGRES_URL || '')

const newContent = `<h2>Wujudkan Desa Berdaya Bersama Kami</h2>
<p>Pantau perkembangan desa binaan, kelola data relawan, dan optimalkan program pemberdayaan dalam satu dashboard yang terpadu.</p>
<ul>
<li><strong>Monitoring Real-time</strong> — Lihat progres kegiatan dan laporan keuangan desa binaan secara langsung dengan data terkini.</li>
<li><strong>Tim Lebih Terkoordinasi</strong> — Berikan akses terkontrol untuk Korwil dan Relawan lapangan dengan manajemen peran yang fleksibel.</li>
<li><strong>Laporan Siap Pakai</strong> — Unduh laporan kegiatan dan realisasi anggaran program untuk evaluasi dan analisis pemberdayaan desa.</li>
</ul>`

async function run() {
  await sql`UPDATE app_settings SET value = ${newContent}, updated_at = NOW() WHERE key = 'app_login_content'`
  console.log('✅ app_login_content diperbarui')
  process.exit(0)
}

run().catch(e => { console.error(e.message); process.exit(1) })
