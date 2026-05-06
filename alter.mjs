import { neon } from '@neondatabase/serverless';

const sql = neon("postgresql://neondb_owner:npg_RgmdhPsr0l5Y@ep-falling-resonance-a102k7h1-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require");

async function run() {
  try {
    await sql`ALTER TABLE action_plan_activities ADD COLUMN satuan_jumlah VARCHAR(50)`;
    console.log("Added satuan_jumlah");
  } catch (e) {
    console.log(e.message);
  }
  
  try {
    await sql`ALTER TABLE action_plan_activities ADD COLUMN satuan_frekuensi VARCHAR(50)`;
    console.log("Added satuan_frekuensi");
  } catch (e) {
    console.log(e.message);
  }
}

run();
