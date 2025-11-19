/**
 * FILE: src/auth/bcrypt.worker.ts
 * 
 * Worker thread để handle bcrypt operations (CPU-intensive)
 * Chạy song song, không block main thread
 */

import { parentPort } from 'worker_threads';
import * as bcrypt from 'bcrypt';

// Lắng nghe message từ main thread
if (!parentPort) {
  throw new Error('Worker thread must be spawned by a parent');
}

const port = parentPort;

port.on('message', async (message) => {
  try {
    if (message.operation === 'hash') {
      // Hash password
      const { password, rounds } = message;
      const hashed = await bcrypt.hash(password, rounds);
      
      // Gửi kết quả về main thread
      port.postMessage({ success: true, result: hashed });
    } 
    else if (message.operation === 'compare') {
      // Compare password với hash
      const { password, hash } = message;
      const isMatch = await bcrypt.compare(password, hash);
      
      // Gửi kết quả về main thread
      port.postMessage({ success: true, result: isMatch });
    }
  } catch (error) {
    port.postMessage({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});
