import { config } from 'dotenv'
config({ path: '.env' })
import { sql } from '../lib/db'

async function setup() {
  try {
    console.log('Creating app_filters table...')
    await sql`
      CREATE TABLE IF NOT EXISTS app_filters (
          id SERIAL PRIMARY KEY,
          page_key VARCHAR(100) NOT NULL,
          filter_key VARCHAR(100) NOT NULL,
          label VARCHAR(100) NOT NULL,
          filter_type VARCHAR(50) NOT NULL, -- e.g., 'select', 'text', 'date'
          options JSONB, -- e.g., [{label: '2025', value: '2025'}]
          column_name VARCHAR(100),
          is_active BOOLEAN DEFAULT true,
          sort_order INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `
    console.log('Table app_filters created successfully.')
    process.exit(0)
  } catch (e) {
    console.error('Error creating table:', e)
    process.exit(1)
  }
}

setup()
