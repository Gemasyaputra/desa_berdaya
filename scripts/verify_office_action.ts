import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

// We need to mock revalidatePath since it's a next/cache thing and might fail in raw tsx
// but getOffices doesn't use it.
import { getOffices } from '../lib/actions/office';

async function run() {
  console.log('Testing getOffices()...');
  try {
    const list = await getOffices();
    console.log('Results:', list);
    console.log('Total:', list.length);
    if (list.length > 0) {
      console.log('VERIFICATION SUCCESS: Data retrieved.');
    } else {
      console.log('VERIFICATION FAILED: List still empty.');
    }
  } catch (err) {
    console.error('Action failed:', err);
  }
}
run();
