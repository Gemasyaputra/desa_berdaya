import { sql } from '../lib/db'

async function run() {
  try {
    await sql`
      ALTER TABLE action_plan_beneficiaries
      ADD COLUMN IF NOT EXISTS tanggungan INT,
      ADD COLUMN IF NOT EXISTS status_gk VARCHAR(255),
      ADD COLUMN IF NOT EXISTS status_hk VARCHAR(255),
      ADD COLUMN IF NOT EXISTS selisih_gk NUMERIC,
      ADD COLUMN IF NOT EXISTS nib_halal VARCHAR(255)
    `
    console.log('Successfully altered action_plan_beneficiaries')
    process.exit(0)
  } catch (error) {
    console.error('Failed to alter table', error)
    process.exit(1)
  }
}

run()
