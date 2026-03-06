require('dotenv').config({ path: '.env' });
const { sql } = require('@vercel/postgres');
const bcrypt = require('bcryptjs');

async function createKorwil() {
  try {
    const pass = await bcrypt.hash('password123', 10);
    
    // 1. Create User
    const resUser = await sql`
      INSERT INTO users (email, password_encrypted, role) 
      VALUES ('korwil@desaberdaya.id', ${pass}, 'RELAWAN') 
      RETURNING id
    `;
    const userId = resUser.rows[0].id;
    console.log('✅ User Korwil created with ID:', userId);

    // 2. Create Profil Relawan (is_korwil = true)
    const resRelawan = await sql`
      INSERT INTO relawan (user_id, nama, hp, is_korwil, monev_id) 
      VALUES (${userId}, 'Bapak Korwil', '081299998888', true, 1) 
      RETURNING id
    `;
    const relawanId = resRelawan.rows[0].id;
    
    // 3. Set own korwil_id (self reference)
    await sql`UPDATE relawan SET korwil_id = ${relawanId} WHERE id = ${relawanId}`;
    console.log('✅ Relawan profile established as Korwil with ID:', relawanId);

    console.log('🎉 Selesai! Login pakai -> korwil@desaberdaya.id / password123');
  } catch (e) {
    console.error('Error:', e);
  } finally {
    process.exit(0);
  }
}

createKorwil();
