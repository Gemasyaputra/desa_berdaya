import { sql } from '../lib/db'

async function run() {
  try {
    const relawan = await sql`SELECT id, nama FROM relawan WHERE nama ILIKE '%budi santoso%' LIMIT 1`
    console.log('Relawan:', relawan)
    
    if (Array.isArray(relawan) && relawan.length > 0) {
      const desa = await sql`SELECT id, desa_id FROM desa_berdaya WHERE relawan_id = ${relawan[0].id}`
      console.log('Desa Berdaya:', desa)
      
      const pm = await sql`SELECT id, nama FROM penerima_manfaat WHERE desa_berdaya_id = ${Array.isArray(desa) ? desa[0].id : desa.id} LIMIT 3`
      console.log('PM:', pm)
    }

    process.exit(0)
  } catch (error) {
    console.error(error)
    process.exit(1)
  }
}
run()
