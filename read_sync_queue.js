import { db } from './src/db/localDB.js';

const inspect = async () => {
  console.log('====================================================');
  console.log('INSPECTING INDEXEDDB SYNC QUEUE...');
  console.log('====================================================\n');

  try {
    const queue = await db.syncQueue.toArray();
    console.log(`Total items in syncQueue: ${queue.length}`);
    if (queue.length > 0) {
      console.log('Queue contents:');
      console.log(JSON.stringify(queue, null, 2));
    } else {
      console.log('The sync queue is currently empty.');
    }
  } catch (err) {
    console.error('Failed to read Dexie sync queue:', err);
  }
  process.exit(0);
};

inspect();
