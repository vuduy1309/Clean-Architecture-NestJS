/**
 * NODE.JS DEEP DIVE - CHI TIẾT VỀ ĐƠN LUỒNG, NHIỀU REQUEST, THREAD POOL
 * 
 * Nội dung:
 * 1. Node.js xử lý đơn luồng như thế nào
 * 2. Thread pool là gì
 * 3. Connection pool vs Thread pool
 * 4. Worker threads
 * 5. I/O và non-blocking
 * 6. Event loop chi tiết
 * 7. Luồng hoạt động thông thường vs xử lý nhiều request
 */

// ============================================================================
// PHẦN 1: KIẾN TRÚC NODE.JS CẬP 0 - TỔNG QUAN
// ============================================================================

/**
 * ┌──────────────────────────────────────────────────────────────┐
 * │                      YOUR APPLICATION                        │
 * │                  (JavaScript code)                           │
 * └──────────────────────────────┬───────────────────────────────┘
 *                                │
 *                    ┌───────────┴────────────┐
 *                    │                        │
 *                    ▼                        ▼
 * ┌──────────────────────────┐  ┌──────────────────────────┐
 * │   V8 JavaScript Engine   │  │ libuv (C++ Library)      │
 * │ (Single-threaded)        │  │ (Multi-threaded)         │
 * │ - Parse code             │  │ - Thread pool            │
 * │ - Execute code           │  │ - Event loop             │
 * │ - JIT compilation        │  │ - I/O multiplexing       │
 * └──────────────────────────┘  └──────────────────────────┘
 *                    │                        │
 *                    └───────────┬────────────┘
 *                                │
 *                    ┌───────────┴────────────┐
 *                    │                        │
 *                    ▼                        ▼
 *         ┌─────────────────┐      ┌─────────────────┐
 *         │   File System   │      │  Network I/O    │
 *         │   (Kernel)      │      │  (Kernel/OS)    │
 *         └─────────────────┘      └─────────────────┘
 * 
 * Chìa khóa: V8 (JS) là đơn luồng, nhưng libuv (C++) là đa luồng!
 */

// ============================================================================
// PHẦN 2: CÓ ĐÚNG 1 LUỒNG JAVASCRIPT
// ============================================================================

/**
 * Trong bất kỳ lúc nào, chỉ CÓ 1 luồng JavaScript đang chạy mã của bạn.
 * 
 * Nếu bạn chạy code này:
 */

function example1() {
  console.log('Line 1');
  console.log('Line 2');
  console.log('Line 3');
}

// Output LUÔN LUÔN là:
// Line 1
// Line 2
// Line 3

// Không bao giờ là:
// Line 2
// Line 1
// Line 3

/**
 * Vì sao?
 * 
 * ┌─────────────────────────────────────┐
 * │  Main JavaScript Thread (V8)         │
 * │                                      │
 * │  ┌────────────────────────────────┐ │
 * │  │ Execution Stack (Call Stack)   │ │
 * │  │                                │ │
 * │  │ console.log('Line 1')  ← TẠI ĐÂY│
 * │  │ console.log('Line 2')          │ │
 * │  │ console.log('Line 3')          │ │
 * │  └────────────────────────────────┘ │
 * │                                      │
 * │  Chỉ có 1 instruction pointer       │
 * │  → Chạy từ trên xuống dưới          │
 * └─────────────────────────────────────┘
 */

// ============================================================================
// PHẦN 3: NHƯNG LIBUV CÓ THREAD POOL (4 THREADS MẶC ĐỊNH)
// ============================================================================

/**
 * Thread Pool:
 * - Là một nhóm threads (worker threads) được quản lý bởi libuv
 * - Mặc định: 4 threads (có thể thay đổi bằng UV_THREADPOOL_SIZE)
 * - Dùng cho: File I/O, DNS lookup, crypto, compression, v.v.
 * 
 * Mục đích:
 * ✓ Thực hiện các tác vụ nặng mà không chặn main JavaScript thread
 * ✓ Các tác vụ này không thể là async bằng OS calls (như file I/O)
 */

/**
 * Ví dụ: Đọc 10 file lớn
 * 
 * Nếu không có thread pool:
 * ┌─────────────────────────────────────────────────┐
 * │ Main JS Thread (CHẶN)                           │
 * │                                                 │
 * │ readFileSync('file1.txt') → 1 giây, chặn       │
 * │ readFileSync('file2.txt') → 1 giây, chặn       │
 * │ readFileSync('file3.txt') → 1 giây, chặn       │
 * │ ... (10 file)                                   │
 * │ Total: 10 giây                                  │
 * │                                                 │
 * │ ❌ Tất cả request phải chờ!                    │
 * └─────────────────────────────────────────────────┘
 * 
 * Với thread pool (4 threads):
 * ┌────────────────────────────────────────────┐
 * │ Main JS Thread (KHÔNG CHẶN)                 │
 * │                                            │
 * │ readFile('file1') → dispatch to thread 1   │
 * │ readFile('file2') → dispatch to thread 2   │
 * │ readFile('file3') → dispatch to thread 3   │
 * │ readFile('file4') → dispatch to thread 4   │
 * │ readFile('file5') → queue (chờ thread rảnh)│
 * │ readFile('file6') → queue                  │
 * │ ... lúc này main JS thread đã quay lại!   │
 * │                                            │
 * │ Total: ~3 giây (10 file / 4 threads)      │
 * │ ✓ Các request tiếp tục được xử lý         │
 * └────────────────────────────────────────────┘
 */

// Ví dụ code
import fs from 'fs';
import { promises as fsPromises } from 'fs';

// ❌ Blocking (không nên dùng)
async function badApproach() {
  console.log('Bắt đầu');

  // Nếu là synchronous, sẽ chặn main thread!
  // const data1 = fs.readFileSync('./file1.txt', 'utf8');
  // const data2 = fs.readFileSync('./file2.txt', 'utf8');
  // Total: 2 giây

  return null;
}

// ✓ Good approach (sử dụng thread pool)
async function goodApproach() {
  console.log('Bắt đầu');

  // Cả hai đều được dispatch vào thread pool đồng thời
  // Thread 1 đọc file1, Thread 2 đọc file2
  // Total: 1 giây (vì đồng thời)
  const [data1, data2] = await Promise.all([
    fsPromises.readFile('./file1.txt', 'utf8'),
    fsPromises.readFile('./file2.txt', 'utf8'),
  ]);

  console.log('Xong');
  return [data1, data2];
}

// ============================================================================
// PHẦN 4: THREAD POOL vs CONNECTION POOL - CÓ GÌ KHÁC?
// ============================================================================

/**
 * ╔════════════════════════════════════════════════════════════════╗
 * ║                    THREAD POOL                                 ║
 * ╠════════════════════════════════════════════════════════════════╣
 * ║ Quản lý:     libuv (C++)                                       ║
 * ║ Dùng cho:    File I/O, DNS, crypto, compression               ║
 * ║ Số luồng:    4 (mặc định)                                     ║
 * ║ Tuổi thọ:    Suốt vòng đời ứng dụng                           ║
 * ║ Mục đích:    Thực thi các tác vụ I/O nặng đồng thời           ║
 * ║ Tự động:     Hầu hết thư viện dùng nó tự động                 ║
 * ║                                                                 ║
 * ║ Ví dụ:                                                         ║
 * ║ fs.readFile() → Thread pool                                   ║
 * ║ crypto.pbkdf2() → Thread pool                                  ║
 * ║ zlib.gzip() → Thread pool                                      ║
 * ╚════════════════════════════════════════════════════════════════╝
 * 
 * ╔════════════════════════════════════════════════════════════════╗
 * ║                   CONNECTION POOL                              ║
 * ╠════════════════════════════════════════════════════════════════╣
 * ║ Quản lý:     Ứng dụng / ORM (Prisma, TypeORM, etc)            ║
 * ║ Dùng cho:    Kết nối database                                 ║
 * ║ Số kết nối:  10-20 (tuỳ cấu hình)                             ║
 * ║ Tuổi thọ:    Tái sử dụng, giữ lại giữa requests              ║
 * ║ Mục đích:    Giữ sẵn kết nối để tránh tạo mới mỗi lần        ║
 * ║ Tự động:     Lập trình viên cần cấu hình                      ║
 * ║                                                                 ║
 * ║ Ví dụ:                                                         ║
 * ║ prisma.$connect() → Connection pool                            ║
 * ║ prisma.user.findMany() → Lấy từ pool                          ║
 * ║ pool.release() → Trả lại pool                                  ║
 * ╚════════════════════════════════════════════════════════════════╝
 * 
 * KHÁC BIỆT CỐT LÕI:
 * 
 * Thread Pool:
 * - Quản lý các luồng thực hiện công việc
 * - Libuv tự động dùng
 * - Bạn gọi async function → libuv tự dispatch vào thread
 * 
 * Connection Pool:
 * - Quản lý các kết nối database
 * - Ứng dụng tự quản lý
 * - Tái sử dụng kết nối thay vì tạo mới mỗi lần
 */

// Ví dụ: Database connection pool
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Prisma tự động quản lý connection pool:
 * 
 * const user = await prisma.user.findMany();
 * 
 * Quy trình:
 * 1. Prisma lấy một connection từ pool
 * 2. Gửi query đến database
 * 3. Database xử lý, trả về kết quả
 * 4. Prisma trả lại connection vào pool
 * 5. Connection được tái sử dụng cho request tiếp theo
 * 
 * ┌──────────────────────────────────────┐
 * │ Connection Pool (10 kết nối)         │
 * │                                      │
 * │ [Conn 1] ← Đang dùng (Request 1)    │
 * │ [Conn 2] ← Đang dùng (Request 2)    │
 * │ [Conn 3] ← Rảnh                     │
 * │ [Conn 4] ← Rảnh                     │
 * │ [Conn 5] ← Rảnh                     │
 * │ ...                                  │
 * │ [Conn 10] ← Rảnh                    │
 * └──────────────────────────────────────┘
 */

// ============================================================================
// PHẦN 5: WORKER THREADS LÀ GÌ?
// ============================================================================

/**
 * Worker Threads:
 * - Đây là true multi-threading trong Node.js
 * - Khác với thread pool (tự động, ẩn đi)
 * - Bạn tạo, kiểm soát, và giao tiếp với worker threads
 * - Mỗi worker thread là một V8 instance riêng
 * 
 * Khi nào dùng:
 * ✓ CPU-intensive tasks (tính toán nặng)
 * ✓ Long-running computation
 * ✓ Không muốn chặn main thread
 * 
 * Ví dụ: Fibonacci, data processing, image manipulation
 */

// Ví dụ: Worker threads

import { Worker } from 'worker_threads';
import path from 'path';

async function cpuIntensiveTask() {
  // Tạo một worker thread để tính Fibonacci
  return new Promise((resolve, reject) => {
    const worker = new Worker(
      // File chứa code cần chạy
      path.join(__dirname, 'fibonacci.worker.js'),
      {
        eval: true,
        workerData: { n: 40 },
      }
    );

    // Lắng nghe message từ worker
    worker.on('message', result => {
      console.log(`Kết quả: ${result}`);
      worker.terminate();
      resolve(result);
    });

    worker.on('error', reject);
    worker.on('exit', code => {
      if (code !== 0) {
        reject(new Error(`Worker exited with code ${code}`));
      }
    });
  });
}

/**
 * fibonacci.worker.js:
 * 
 * const { parentPort, workerData } = require('worker_threads');
 * 
 * function fibonacci(n) {
 *   if (n <= 1) return n;
 *   return fibonacci(n - 1) + fibonacci(n - 2);
 * }
 * 
 * const result = fibonacci(workerData.n);
 * parentPort.postMessage(result);
 */

/**
 * So sánh:
 * 
 * MAIN THREAD (Blocking):
 * ┌──────────────────────────────┐
 * │ fibonacci(40)  ← CPU chạy    │ ← 2 giây (CHẶN)
 * │ const result = ...           │
 * │ sendResponse(result)         │
 * │ Tất cả request khác chờ!     │
 * └──────────────────────────────┘
 * 
 * WORKER THREAD (Non-blocking):
 * ┌────────────────────────────┐  ┌──────────────────────────────┐
 * │ Main Thread                │  │ Worker Thread                │
 * │                            │  │                              │
 * │ new Worker(...)  ──────────┼─→ fibonacci(40)  ← CPU chạy   │
 * │ continue...                │  │ 2 giây computation          │
 * │ (có thể xử lý req khác)   │  │                              │
 * │ worker.on('message') ←─────┼── postMessage(result)         │
 * │ sendResponse()             │  │                              │
 * └────────────────────────────┘  └──────────────────────────────┘
 * 
 * Main thread không chặn! Có thể xử lý request tiếp theo ngay.
 */

// ============================================================================
// PHẦN 6: I/O LÀ GÌ - BLOCKING vs NON-BLOCKING
// ============================================================================

/**
 * I/O = Input/Output
 * 
 * Ví dụ I/O:
 * - Đọc file từ disk
 * - Ghi file vào disk
 * - Truy vấn database
 * - Gọi HTTP API
 * - Ghi log vào network
 * - Socket communication
 * 
 * Vấn đề: Tất cả những cái này đều CHẬM (ms đến s)
 */

// ❌ BLOCKING I/O (Chặn luồng)
function blockingIOExample() {
  console.log('Start');

  // fs.readFileSync chặn luồng cho đến khi file được đọc
  const data = fs.readFileSync('./data.txt', 'utf8'); // 100ms chặn
  console.log(data);

  // Lúc này, 100ms đã trôi qua, nó không làm gì cả!
  console.log('End');

  // Nếu có 1000 request như vậy = 100 giây!
}

/**
 * ┌─────────────────────────────────────┐
 * │ Main JS Thread (BLOCKED!)           │
 * │                                     │
 * │ readFileSync() ──→ OS Kernel        │
 * │ (chờ, không làm gì)  → Disk I/O    │
 * │                      ← Data trở lại │
 * │ resume code                         │
 * │                                     │
 * │ ❌ Tất cả request phải chờ thread  │
 * └─────────────────────────────────────┘
 */

// ✓ NON-BLOCKING I/O (Không chặn)
async function nonBlockingIOExample() {
  console.log('Start');

  // readFile không chặn luồng
  // Nó dispatch task cho thread pool và quay lại ngay
  const data = await fs.promises.readFile('./data.txt', 'utf8'); // 100ms async
  console.log(data);

  console.log('End');
}

/**
 * ┌─────────────────────────────────────┐
 * │ Main JS Thread (KHÔNG BLOCKED!)     │
 * │                                     │
 * │ readFile() dispatch ──→ Thread Pool │
 * │ (quay lại ngay)        ↓            │
 * │ process req 2          Thread 1     │
 * │ process req 3          Read file    │
 * │ process req 4          (100ms)      │
 * │ ...                    ↓            │
 * │ (khi file xong) ←───── Callback    │
 * │ resume .then() code                 │
 * │                                     │
 * │ ✓ Request khác được xử lý ngay!   │
 * └─────────────────────────────────────┘
 */

/**
 * So sánh timeline:
 * 
 * Blocking (1000 requests):
 * ┌──────────────────────────────────────┐
 * │ Request 1: 100ms read file          │
 * │ Request 2: 100ms read file          │
 * │ ... (1000 requests)                 │
 * │ Total: 1000 × 100ms = 100 SECONDS! │
 * └──────────────────────────────────────┘
 * 
 * Non-blocking (1000 requests):
 * ┌──────────────────────────────────────┐
 * │ Request 1: dispatch (0.1ms)         │
 * │ Request 2: dispatch (0.1ms)         │
 * │ ... (1000 requests in 0.1ms each)   │
 * │ Thread pool handles I/O in parallel │
 * │ Total: ~100ms (depends on thread#)  │
 * │                                      │
 * │ NHANH HƠN 1000x! 🚀                 │
 * └──────────────────────────────────────┘
 */

// ============================================================================
// PHẦN 7: EVENT LOOP - TRÁI TIM CỦA NODE.JS
// ============================================================================

/**
 * Event Loop là một vòng lặp vô hạn:
 * 
 * while (eventLoop.waitForTask()) {
 *   const nextTask = eventLoop.nextTask();
 *   nextTask.execute();
 * }
 * 
 * Nó kiểm tra liên tục: "Có task nào cần xử lý không?"
 */

/**
 * Event Loop có 6 Phase:
 * 
 * ┌─────────────────────────────────────────┐
 * │ TIMERS PHASE                            │
 * │ Xử lý: setTimeout, setInterval          │
 * ├─────────────────────────────────────────┤
 * │ PENDING CALLBACKS PHASE                 │
 * │ Xử lý: Deferred I/O callbacks           │
 * ├─────────────────────────────────────────┤
 * │ IDLE/PREPARE PHASE                      │
 * │ (Internal use - bạn không cần quan tâm)│
 * ├─────────────────────────────────────────┤
 * │ POLL PHASE (Quan trọng nhất!)          │
 * │ Xử lý: I/O events, file read callbacks  │
 * │ (Chỉ chờ nếu không có timer sắp tới)  │
 * ├─────────────────────────────────────────┤
 * │ CHECK PHASE                             │
 * │ Xử lý: setImmediate                     │
 * ├─────────────────────────────────────────┤
 * │ CLOSE CALLBACKS PHASE                   │
 * │ Xử lý: socket.destroy(), close events   │
 * └─────────────────────────────────────────┘
 * 
 * ⚠️ GIỮA MỖI PHASE, MICROTASKS được xử lý:
 * - Promise callbacks (.then, .catch)
 * - process.nextTick()
 * - queueMicrotask()
 */

// Ví dụ: Thứ tự execution

console.log('=== EVENT LOOP DEMO ===');

console.log('1. Synchronous');

setTimeout(() => {
  console.log('2. setTimeout (Timers phase)');
}, 0);

Promise.resolve()
  .then(() => {
    console.log('3. Promise (Microtask)');
  })
  .then(() => {
    console.log('4. Promise 2');
  });

process.nextTick(() => {
  console.log('5. process.nextTick (Highest priority microtask)');
});

setImmediate(() => {
  console.log('6. setImmediate (Check phase)');
});

fs.readFile('./data.txt', () => {
  console.log('7. File read callback (Poll phase)');
});

console.log('8. Synchronous end');

/**
 * OUTPUT:
 * 1. Synchronous
 * 8. Synchronous end
 * 5. process.nextTick (highest priority microtask)
 * 3. Promise
 * 4. Promise 2
 * 2. setTimeout
 * 6. setImmediate
 * 7. File read callback
 * 
 * Giải thích:
 * - 1, 8: Synchronous code chạy trước
 * - 5: process.nextTick (microtask, highest priority)
 * - 3, 4: Promise callbacks (microtasks)
 * - 2: setTimeout (timers phase)
 * - 6: setImmediate (check phase)
 * - 7: File I/O callback (poll phase, khi file xong)
 */

// ============================================================================
// PHẦN 8: LUỒNG HOẠT ĐỘNG BÌNH THƯỜNG (1 REQUEST)
// ============================================================================

/**
 * Kịch bản: Một client gửi request HTTP
 * 
 * GET /api/users
 * 
 * Luồng xử lý:
 */

// Step 1: Request đến
console.log('Step 1: HTTP request đến');

// Step 2: Event loop xử lý (trong poll phase)
console.log('Step 2: Event loop detect request');

async function handleRequest() {
  // Step 3: Xử lý route
  console.log('Step 3: Route handler bắt đầu');

  // Step 4: Query database
  console.log('Step 4: Dispatch query đến thread pool');
  // const users = await prisma.user.findMany();
  // (dispatch sang thread pool, main JS thread quay lại)

  // Step 5: Nếu có bước khác (không I/O), thực hiện
  console.log('Step 5: Transform data');
  // const result = users.map(u => u.name);

  // Step 6: Khi I/O xong, lấy kết quả
  console.log('Step 6: Receive result from thread pool');
  // const users = await prisma.user.findMany(); // callback gọi

  // Step 7: Send response
  console.log('Step 7: Send response to client');
  return { users: [] };
}

/**
 * TIMELINE (1 request):
 * 
 * ┌─────────────────────────────────────────────────────┐
 * │ Event Loop                                          │
 * │                                                     │
 * │ T=0ms    Request đến                              │
 * │ T=0.1ms  Route handler (sync code)                │
 * │ T=0.2ms  Dispatch query (async)                   │
 * │ T=0.3ms  Handler quay lại (await point)           │
 * │          Main JS thread rảnh, xử lý req khác     │
 * │          ...                                       │
 * │ T=50ms   Database trả về (thread pool xong)       │
 * │ T=50.1ms Handler resume (callback)                │
 * │ T=50.2ms Send response                            │
 * │ T=50.3ms Hoàn thành                               │
 * │                                                     │
 * │ Total time: ~50ms (database I/O time)            │
 * │ Main thread busy: ~0.3ms                          │
 * │ Main thread rảnh: ~49.7ms (xử lý req khác)       │
 * └─────────────────────────────────────────────────────┘
 */

// ============================================================================
// PHẦN 9: LUỒNG HOẠT ĐỘNG XỬ LÝ NHIỀU REQUEST
// ============================================================================

/**
 * Kịch bản: 1000 clients gửi request HTTP gần cùng lúc
 * 
 * GET /api/users (from 1000 clients)
 */

async function handleMultipleRequests() {
  /**
   * ┌──────────────────────────────────────────────────────────┐
   * │                 Event Loop                                │
   * │                                                            │
   * │ T=0ms    1000 requests đến                               │
   * │          Event loop Poll phase (OS multiplexing)         │
   * │          Tất cả được detect gần như cùng lúc             │
   * │                                                            │
   * │ ┌─────────────────────────────────────────────────────┐  │
   * │ │ Main JS Thread (1 luồng)                            │  │
   * │ │                                                     │  │
   * │ │ T=0.1ms:  Route handler for req 1 (sync)          │  │
   * │ │ T=0.2ms:  Dispatch query for req 1 (async)        │  │
   * │ │ T=0.3ms:  Route handler for req 2 (sync)          │  │
   * │ │ T=0.4ms:  Dispatch query for req 2 (async)        │  │
   * │ │ T=0.5ms:  Route handler for req 3 (sync)          │  │
   * │ │ ...                                                 │  │
   * │ │ T=1.5ms:  Route handler for req 1000 (sync)       │  │
   * │ │ T=1.6ms:  All queries dispatched, main thread done│  │
   * │ │          (Rảnh! Đợi I/O hoàn thành)              │  │
   * │ └─────────────────────────────────────────────────────┘  │
   * │                                                            │
   * │ ┌─────────────────────────────────────────────────────┐  │
   * │ │ Thread Pool (4 threads, từ libuv)                   │  │
   * │ │                                                     │  │
   * │ │ Thread 1: Query req 1, 2, 3, 4, 5...  (50ms each) │  │
   * │ │ Thread 2: Query req 5, 6, 7, 8, 9...  (50ms each) │  │
   * │ │ Thread 3: Query req 9, 10, 11...      (50ms each) │  │
   * │ │ Thread 4: Query req 13, 14, 15...     (50ms each) │  │
   * │ │                                                     │  │
   * │ │ Tất cả 1000 queries được xử lý song song          │  │
   * │ │ Với 4 threads, cứ ~50ms lại hoàn thành 4 query    │  │
   * │ │ Total: 1000 / 4 × 50ms = 250 requests done        │  │
   * │ │        1000 / 4 × 50ms = ~125ms cho tất cả        │  │
   * │ └─────────────────────────────────────────────────────┘  │
   * │                                                            │
   * │ T=50ms:   First batch done (4 queries)                   │
   * │          Main JS thread wake up                          │
   * │          T=50.1ms: Send response for req 1              │
   * │          T=50.2ms: Send response for req 2              │
   * │          ...                                              │
   * │          T=50.4ms: Send response for req 4              │
   * │          T=50.5ms: Main thread done                     │
   * │          (quay lại, chờ tiếp theo)                       │
   * │                                                            │
   * │ T=100ms:  Second batch done (4 more queries)             │
   * │          ...                                              │
   * │                                                            │
   * │ T=~120ms: Last batch done                                │
   * │          Total: ~120ms cho 1000 requests!               │
   * │                                                            │
   * │ ✓ Nhanh gấp 1000/120 ≈ 8x so với serial (50s)           │
   * └──────────────────────────────────────────────────────────┘
   * 
   * So sánh:
   * - Serial (synchronous): 1000 × 50ms = 50 SECONDS
   * - Parallel (async + thread pool): ~120ms = 0.12 SECONDS
   * - Tỷ lệ: 50 / 0.12 ≈ 400x NHANH HƠN!
   */
}

// ============================================================================
// PHẦN 10: BIỂU ĐỒ CHI TIẾT - TIMELINE 1000 REQUESTS
// ============================================================================

/**
 * Thời gian chi tiết (timeline):
 * 
 * ┌─────────────────────────────────────────────────────────────┐
 * │ T=0-2ms: OS nhận 1000 requests (network level)               │
 * ├─────────────────────────────────────────────────────────────┤
 * │ T=2ms: Event loop Poll phase detect requests                │
 * ├─────────────────────────────────────────────────────────────┤
 * │ T=2-1500ms: Main JS thread xử lý                            │
 * │                                                              │
 * │  T=2.0ms:   req 1  → Route handler → Dispatch DB query      │
 * │  T=2.1ms:   req 2  → Route handler → Dispatch DB query      │
 * │  T=2.2ms:   req 3  → Route handler → Dispatch DB query      │
 * │  ...                                                         │
 * │  T=1500ms:  req 1000 → Route handler → Dispatch DB query    │
 * │                                                              │
 * │  ⏱️ Mỗi request handler: ~0.1ms (rất nhanh)                │
 * │  Tất cả 1000 handler: ~100-200ms max                        │
 * │                                                              │
 * │  (Nhưng database query chỉ mới dispatch, chưa xong!)       │
 * ├─────────────────────────────────────────────────────────────┤
 * │ T=2-50ms: Thread pool xử lý queries (4 threads, parallel)   │
 * │                                                              │
 * │  Thread 1: req 1   (0-50ms)   → Req 5   (50-100ms)          │
 * │  Thread 2: req 2   (0-50ms)   → Req 6   (50-100ms)          │
 * │  Thread 3: req 3   (0-50ms)   → Req 7   (50-100ms)          │
 * │  Thread 4: req 4   (0-50ms)   → Req 8   (50-100ms)          │
 * │                                                              │
 * │  Đồng thời xử lý! Không serial!                             │
 * ├─────────────────────────────────────────────────────────────┤
 * │ T=50ms: Batch 1 (4 queries) hoàn thành                      │
 * │         Main JS thread wake up (từ microtask queue)         │
 * │                                                              │
 * │  Callback for req 1, 2, 3, 4 được gọi                       │
 * │  Send 4 responses (4 × 0.1ms = 0.4ms)                       │
 * │  Main thread quay lại sau 50.5ms                            │
 * ├─────────────────────────────────────────────────────────────┤
 * │ T=50-100ms: Thread pool xử lý batch 2                       │
 * │            Main JS thread rảnh (lại có thể xử lý req mới)  │
 * ├─────────────────────────────────────────────────────────────┤
 * │ T=100ms: Batch 2 (4 queries) hoàn thành                     │
 * │          Send 4 responses                                   │
 * ├─────────────────────────────────────────────────────────────┤
 * │ ...                                                          │
 * ├─────────────────────────────────────────────────────────────┤
 * │ T=~120ms: Batch 250 (cuối cùng, 4 queries) hoàn thành       │
 * │           Send 4 responses cuối cùng                        │
 * │                                                              │
 * │ TỔNG: ~120ms cho 1000 requests                             │
 * │       (Nếu DB query mỗi cái 50ms)                          │
 * └─────────────────────────────────────────────────────────────┘
 */

// ============================================================================
// PHẦN 11: BIỂU ĐỒ SO SÁNH - BLOCKING vs NON-BLOCKING
// ============================================================================

/**
 * BLOCKING (❌ Synchronous):
 * 
 * ┌─────────────────────────────────────────────────────────────┐
 * │ Request 1: ▓▓▓▓▓ (50ms DB query, CHẶN)                    │
 * │ Request 2: ░░░░░ (50ms chờ) ▓▓▓▓▓ (50ms DB query)          │
 * │ Request 3: ░░░░░░░░░░░ (100ms chờ) ▓▓▓▓▓ (50ms DB query)   │
 * │ ...                                                          │
 * │ Request 1000: ░░░░...░░░░ (49950ms chờ) ▓▓▓▓▓ (50ms)       │
 * │                                                              │
 * │ Total time: 1000 × 50ms = 50 SECONDS!!!                    │
 * │                                                              │
 * │ ▓▓▓▓▓ = Thực hiện                                          │
 * │ ░░░░░ = Chờ (blocked, không làm gì)                        │
 * └─────────────────────────────────────────────────────────────┘
 * 
 * NON-BLOCKING (✓ Async):
 * 
 * ┌─────────────────────────────────────────────────────────────┐
 * │ Requests 1-4:   ▓ (dispatch, 1ms) ░░░░░░░░░░░░░░░░░░░░░░ │
 * │ Requests 5-8:   ▓ (dispatch, 1ms) ░░░░░░░░░░░░░░░░░░░░░░ │
 * │ Requests 9-12:  ▓ (dispatch, 1ms) ░░░░░░░░░░░░░░░░░░░░░░ │
 * │ ...                                                          │
 * │ Requests 997-1000: ▓ (dispatch, 1ms) ░░░░░░░░░░░░░░░░░░░░░░ │
 * │                                                              │
 * │ [Thread pool xử lý 4 requests đồng thời]                   │
 * │                                                              │
 * │ T=0ms:    Dispatch 1000 requests (tất cả)   ← 100-200ms    │
 * │ T=50ms:   Batch 1 (4) xong, send responses  ← 1-2ms        │
 * │ T=100ms:  Batch 2 (4) xong, send responses  ← 1-2ms        │
 * │ ...                                                          │
 * │ T=120ms:  Batch 250 (4) xong, send responses ← 1-2ms       │
 * │                                                              │
 * │ Total time: ~120ms                                         │
 * │                                                              │
 * │ ▓▓▓▓▓ = Thực hiện (nhưng không chặn!)                      │
 * │ ░░░░░ = Chờ (nhưng main thread KHÔNG CHẶN!)              │
 * └─────────────────────────────────────────────────────────────┘
 * 
 * HIỆU SUẤT: 50 seconds / 120ms ≈ 400x NHANH HƠN!
 */

// ============================================================================
// PHẦN 12: VÍ DỤ CODE THỰC TẾ - XỬ LÝ NHIỀU REQUEST
// ============================================================================

import express from 'express';

const app = express();

/**
 * ❌ BAD: Blocking approach
 */
app.get('/api/users-bad', (req, res) => {
  // Nếu dùng synchronous API (chặn main thread!)
  // const users = db.getUsersSync(); // ❌ Chặn 100ms

  // Tất cả request khác phải chờ 100ms
  // Nếu có 1000 request = 100 giây!

  res.json({ users: [] });
});

/**
 * ✓ GOOD: Non-blocking approach
 */
app.get('/api/users', async (req, res) => {
  try {
    // Async API (không chặn main thread!)
    const users = await prisma.user.findMany(); // ✓ Dispatch → quay lại

    // Main thread rảnh, xử lý request tiếp theo ngay
    // Tất cả 1000 request được xử lý "interleave"

    res.json({ users });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * Khi 1000 request đến:
 * 
 * T=0ms:      1000 requests đến
 * T=0-100ms:  Main thread xử lý 1000 requests (dispatch queries)
 *             Mỗi request: ~0.1ms (rất nhanh)
 * T=50ms:     Database trả về 250 kết quả (batch 1)
 *             Main thread send 250 responses
 * T=100ms:    Database trả về 250 kết quả (batch 2)
 *             Main thread send 250 responses
 * T=~120ms:   Tất cả 1000 response đã gửi
 * 
 * ✓ Mỗi client nhận response trong ~120ms
 * ✓ Throughput: 1000 requests / 120ms = 8333 req/s
 */

// ============================================================================
// PHẦN 13: TÓMLỚP MỐI QUAN HỆ - THREADING ARCHITECTURE
// ============================================================================

/**
 * ┌─────────────────────────────────────────────────────────────────┐
 * │                      APPLICATION (YOUR CODE)                    │
 * └────────────────────────┬────────────────────────────────────────┘
 *                          │
 *        ┌─────────────────┴─────────────────┐
 *        ▼                                   ▼
 * ┌──────────────────────┐          ┌──────────────────────┐
 * │  V8 JavaScript       │          │  libuv (C++)         │
 * │  (Single-threaded)   │          │  (Multi-threaded)    │
 * │                      │          │                      │
 * │ - Main JS thread     │          │ - Event loop         │
 * │ - Call stack         │          │ - Thread pool (4)    │
 * │ - Variable scope     │          │ - Timer management   │
 * │ - Function calls     │          │ - I/O handling       │
 * │ - Memory (heap)      │          │ - OS integration     │
 * └──────────────────────┘          └──────────────────────┘
 *        ▲                                   ▲
 *        └───────────────┬───────────────────┘
 *                        │
 *           Async/await, Callbacks
 *           Promise, setTimeout, etc.
 *
 * HOW THEY WORK TOGETHER:
 * 
 * async function query() {
 *   const data = await db.query(); // ← V8 recognizes await
 * }
 *
 * 1. V8 encounters await → pauses execution
 * 2. V8 passes task to libuv → libuv dispatches to thread pool
 * 3. V8 returns control → event loop continues
 * 4. Main JS thread can handle other requests
 * 5. Thread pool executes query in parallel
 * 6. Thread pool sends callback to event loop
 * 7. Event loop calls Promise callback
 * 8. V8 resumes function (after await)
 */

// ============================================================================
// PHẦN 14: TÓMLỚP CUỐI - EVERYTHING TOGETHER
// ============================================================================

/**
 * ⚡ NODE.JS ARCHITECTURE - TÓM TẮT ⚡
 * 
 * 1. NODE.JS = JAVASCRIPT ENGINE + LIBUV
 *    - V8: JavaScript engine (single-threaded)
 *    - libuv: Asynchronous I/O library (multi-threaded)
 * 
 * 2. SINGLE-THREADED ≠ SLOW
 *    - Vì có non-blocking I/O + event loop
 *    - Một luồng có thể xử lý ngàn I/O operations
 * 
 * 3. THREAD POOL (4 threads, libuv)
 *    - Xử lý file I/O, DNS, crypto, compression
 *    - Tự động được dùng bởi Node.js modules
 *    - Bạn không cần tạo, nó đã có rồi
 * 
 * 4. CONNECTION POOL (ứng dụng)
 *    - Quản lý database connections (10-20)
 *    - Khác hoàn toàn với thread pool
 *    - Tái sử dụng connections để hiệu suất cao
 * 
 * 5. EVENT LOOP (libuv)
 *    - Vòng lặp vô hạn kiểm tra callbacks
 *    - Có 6 phases: timers, pending, poll, check, close
 *    - Microtasks (Promise) được xử lý giữa phases
 * 
 * 6. WORKER THREADS (nếu cần đa luồng thực)
 *    - Cho CPU-intensive tasks
 *    - Khác với thread pool (manual vs automatic)
 *    - Tạo khi cần, terminate khi xong
 * 
 * 7. I/O PATTERNS
 *    - Blocking: Chặn luồng (❌ tồi)
 *    - Non-blocking: Dispatch + continue (✓ tốt)
 * 
 * 8. TIMELINE COMPARISON
 *    - Blocking: 1000 req × 50ms = 50 seconds
 *    - Non-blocking: ~120ms (400x nhanh hơn!)
 * 
 * ✓ Tất cả đều hợp tác hoàn hảo để Node.js xử lý
 *   ngàn requests đồng thời một cách hiệu quả!
 */

// ============================================================================
// PHẦN 15: MONITORING - CÓ THỂ NHÌN THẤY EVENT LOOP
// ============================================================================

/**
 * Cách kiểm tra event loop lag (độ trễ):
 * 
 * Nếu event loop bị chặn quá lâu, các tasks khác sẽ chờ
 * Bạn có thể detect bằng:
 */

function monitorEventLoop() {
  let lastCheck = Date.now();

  setInterval(() => {
    const now = Date.now();
    const lag = now - lastCheck - 1000; // 1000ms = interval

    if (lag > 50) {
      console.warn(`Event loop lag: ${lag}ms`);
      console.warn('❌ Main thread bị chặn quá lâu!');
    } else {
      console.log(`Event loop healthy: ${lag}ms lag`);
    }

    lastCheck = now;
  }, 1000);

  /**
   * Kết quả có thể:
   * - 0-5ms: Excellent
   * - 5-20ms: Good
   * - 20-50ms: Acceptable
   * - >50ms: Bad (main thread bị chặn)
   */
}

// ============================================================================
// PHẦN 16: LỜI KHUYÊN THỰC HÀNH
// ============================================================================

/**
 * ✓ LÀM ĐIỀU NÀY (Best Practices):
 * 
 * 1. Luôn dùng async API
 *    ✓ await db.query()
 *    ✓ await fs.promises.readFile()
 *    ✓ await fetch(url)
 * 
 * 2. Tránh blocking operations
 *    ❌ fs.readFileSync()
 *    ❌ require() toàn bộ trong request handler
 *    ❌ while loops (busy-waiting)
 * 
 * 3. Xử lý CPU-heavy tasks ở worker thread
 *    ❌ fibonacci(40) trong main thread
 *    ✓ Dùng worker thread cho fibonacci
 *    ✓ Or process nó offline
 * 
 * 4. Monitor event loop lag
 *    ✓ Dùng tools như clinic.js, autocannon
 *    ✓ Alert nếu lag > 100ms
 * 
 * 5. Cấu hình thread pool nếu cần
 *    process.env.UV_THREADPOOL_SIZE = 128;
 *    (Nhưng thường 4 là đủ)
 * 
 * 6. Dùng connection pool cho database
 *    ✓ Prisma tự động manage
 *    ✓ Or dùng node-pg-pool cho raw PostgreSQL
 * 
 * 7. Cluster cho multi-core CPU
 *    ✓ Master + Worker processes
 *    ✓ Load balance giữa workers
 */

console.log('=== NODE.JS DEEP DIVE COMPLETED ===');
