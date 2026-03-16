import * as dotenv from 'dotenv';
import postgres from 'postgres';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config();

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL!;
const sql = postgres(connectionString);

async function migrate() {
  try {
    console.log('⏳ Starting migration...');
    
    // Add form_category_id to program table
    await sql`
      ALTER TABLE program 
      ADD COLUMN IF NOT EXISTS form_category_id BIGINT REFERENCES form_categories(id)
    `;
    console.log('✅ Added form_category_id to program table');

    // Add program_id to laporan_kegiatan table
    await sql`
      ALTER TABLE laporan_kegiatan 
      ADD COLUMN IF NOT EXISTS program_id BIGINT REFERENCES program(id)
    `;
    console.log('✅ Added program_id to laporan_kegiatan table');

    console.log('🚀 Migration successful!');
  } catch (e) {
    console.error('❌ Migration failed:', e);
  } finally {
    await sql.end();
  }
}

migrate();
