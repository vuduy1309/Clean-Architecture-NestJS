/**
 * EVENT LOOP, NON-BLOCKING I/O, VÀ NODEJS
 * 
 * Giải thích chi tiết:
 * - Node.js là đơn luồng ở cấp JavaScript nhưng xử lý đa luồng ở tầng thấp
 * - Event loop là cơ chế quan trọng giúp Node.js xử lý async operations
 * - Non-blocking I/O cho phép không chặn luồng chính khi chờ I/O
 */

// ============================================================================
// PHẦN 1: NODE.JS LÀ ĐƠN LUỒNG (SINGLE-THREADED)
// ============================================================================

/**
 * Node.js chỉ có ĐỘT MỘT luồng JavaScript chạy mã JavaScript của bạn.
 * Điều này có nghĩa là tại một thời điểm, chỉ có một dòng code được thực hiện.
 */

// Ví dụ 1: Mã tuần tự (synchronous)
console.log('1. Bắt đầu');
console.log('2. Giữa');
console.log('3. Kết thúc');

// Output:
// 1. Bắt đầu
// 2. Giữa
// 3. Kết thúc
// (Lần lượt, từ trên xuống dưới)

// Ví dụ 2: Blocking operation (chặn luồng)
function blockingOperation() {
  const start = Date.now();
  while (Date.now() - start < 3000) {
    // Chờ 3 giây mà không làm gì cả - ĐẾN KHI NÀO CÓ PHẢN HỒI
    // Tất cả request khác phải chờ!
  }
  console.log('3 giây đã trôi qua');
}

// Nếu gọi blockingOperation(), tất cả mọi thứ sẽ bị đóng băng trong 3 giây

// ============================================================================
// PHẦN 2: NON-BLOCKING I/O - GIẢI PHÁP
// ============================================================================

/**
 * Non-blocking I/O cho phép Node.js:
 * 1. Khởi động một tác vụ I/O (đọc file, truy vấn DB, gọi API...)
 * 2. KHÔNG CHỜ kết quả
 * 3. Tiếp tục xử lý công việc khác
 * 4. Khi có kết quả, gọi callback hoặc resolve Promise
 */

// Ví dụ 3: Non-blocking (async)
import * as fs from 'fs';

console.log('Bắt đầu đọc file');

// Khởi động đọc file KHÔNG CHẶN
fs.readFile('./data.txt', 'utf8', (err, data) => {
  if (err) console.error(err);
  else console.log('File content:', data);
});

console.log('Đã khởi động đọc file, tiếp tục chương trình');

// Output:
// Bắt đầu đọc file
// Đã khởi động đọc file, tiếp tục chương trình
// File content: ... (khi file đã đọc xong)

/**
 * Sự khác biệt:
 * 
 * Blocking (tồi):
 * ┌─────────────────────────────┐
 * │ Chương trình chờ I/O        │ ← 2-3 giây chờ file
 * │ Không xử lý request khác    │ ← Tất cả đứng chờ
 * └─────────────────────────────┘
 * 
 * Non-blocking (tốt):
 * ┌──────────────────────────────────────────────────┐
 * │ Khởi động I/O (100 microseconds)                │
 * │ Tiếp tục xử lý 100 request khác                 │
 * │ Khi I/O xong, gọi callback                      │
 * └──────────────────────────────────────────────────┘
 */

// ============================================================================
// PHẦN 3: EVENT LOOP - CỮU TINH CỦA NODE.JS
// ============================================================================

/**
 * Event Loop là một vòng lặp vô hạn kiểm tra:
 * 1. Có callback/event nào cần xử lý không?
 * 2. Nếu có, thực hiện callback đó
 * 3. Quay lại bước 1
 * 
 * Nó cho phép Node.js xử lý async operations mà không cần multiple threads.
 */

// Ví dụ 4: Event loop hoạt động

console.log('START');

// Macrotask (I/O, setTimeout)
setTimeout(() => {
  console.log('setTimeout 0ms');
}, 0);

// Microtask (Promise)
Promise.resolve()
  .then(() => {
    console.log('Promise 1');
  })
  .then(() => {
    console.log('Promise 2');
  });

// Synchronous
console.log('MIDDLE');

// I/O operation
fs.readFile('./data.txt', () => {
  console.log('File read complete');
});

console.log('END');

// Output:
// START
// MIDDLE
// END
// Promise 1
// Promise 2
// setTimeout 0ms
// File read complete

/**
 * Giải thích:
 * 1. START, MIDDLE, END: Synchronous code - chạy tuần tự
 * 2. Promise 1, Promise 2: Microtasks - chạy sau synchronous, trước macrotasks
 * 3. setTimeout 0ms: Macrotask - chạy sau tất cả microtasks
 * 4. File read complete: I/O callback - chạy sau khi I/O hoàn thành
 */

// ============================================================================
// PHẦN 4: EVENT LOOP PHASES (CHI TIẾT)
// ============================================================================

/**
 * Event loop có 6 pha chính:
 * 
 * ┌───────────────────┐
 * │  timers           │ (setTimeout, setInterval)
 * ├───────────────────┤
 * │  pending callbacks│ (I/O callbacks defer từ phase trước)
 * ├───────────────────┤
 * │  idle/prepare     │ (internal)
 * ├───────────────────┤
 * │  poll             │ (retrieve I/O events, execute I/O callbacks)
 * ├───────────────────┤
 * │  check            │ (setImmediate)
 * ├───────────────────┤
 * │  close callbacks  │ (socket.destroy, tổn dụng close)
 * └───────────────────┘
 * 
 * Microtasks (Promises, process.nextTick) được xử lý GIỮA các phase
 */

// Ví dụ 5: Thứ tự execution chi tiết

console.log('=== Event Loop Phases Demo ===');

// Phase 1: timers
setTimeout(() => {
  console.log('setTimeout');
}, 0);

// Microtask
Promise.resolve().then(() => {
  console.log('Promise.then');
});

// process.nextTick (highest priority microtask)
process.nextTick(() => {
  console.log('process.nextTick');
});

// Phase 2: setImmediate (check phase)
setImmediate(() => {
  console.log('setImmediate');
});

console.log('synchronous');

// Output:
// synchronous
// process.nextTick     ← Highest priority
// Promise.then         ← Microtask
// setTimeout           ← timers phase
// setImmediate         ← check phase

// ============================================================================
// PHẦN 5: NODEJS LÀ ĐƠN LUỒNG NHƯNG CÓ THREAD POOL
// ============================================================================

/**
 * Node.js dùng thư viện libuv (C++) để quản lý thread pool.
 * 
 * ┌─────────────────────────────────────────────────────┐
 * │ JavaScript Code (Single Thread - Event Loop)        │
 * └────────────┬────────────────────────────────────────┘
 *              │
 *              ↓
 * ┌─────────────────────────────────────────────────────┐
 * │ libuv (C++) - Thread Pool (default 4 threads)       │
 * │ - File I/O                                          │
 * │ - DNS lookup                                        │
 * │ - Crypto operations                                 │
 * │ - Compression                                       │
 * │ - Some database operations                          │
 * └─────────────────────────────────────────────────────┘
 * 
 * Tuy nhiên:
 * - Network I/O (HTTP, TCP) không dùng thread pool, mà dùng OS system calls
 * - Đây là lý do Node.js xử lý ngàn request HTTP đồng thời hiệu quả
 */

// Ví dụ 6: File I/O dùng thread pool

import { promises as fsPromises } from 'fs';

async function readMultipleFiles() {
  const files = [
    './file1.txt',
    './file2.txt',
    './file3.txt',
    './file4.txt',
    './file5.txt',
  ];

  // Nếu thread pool có 4 threads:
  // file1, file2, file3, file4 sẽ được đọc đồng thời (parallel)
  // file5 sẽ chờ đến khi một thread trở nên rảnh
  const results = await Promise.all(
    files.map(file => fsPromises.readFile(file, 'utf8'))
  );

  return results;
}

/**
 * Thay đổi kích thước thread pool:
 * process.env.UV_THREADPOOL_SIZE = 128;
 * 
 * ⚠️ Lưu ý:
 * - Mỗi thread tiêu thụ bộ nhớ (~2MB)
 * - Quá nhiều thread gây overhead (context switching)
 * - Thường 4-8 threads đã đủ cho hầu hết ứng dụng
 */

// ============================================================================
// PHẦN 6: HỆ THỐNG XỬ LÝ NHIỀU REQUEST ĐỒNG THỜI
// ============================================================================

/**
 * Node.js xử lý 1000 HTTP request đồng thời như thế nào?
 * 
 * Kịch bản:
 * - 1000 client gửi request HTTP đến server Node.js
 * - Server nhận được 1000 request gần như cùng lúc
 * 
 * Quy trình:
 * 
 * ┌─ Client 1 ──┐
 * │ GET /api    │  ┌──────────────────────────────────────┐
 * └─────────────┘→ │ Node.js Server (1 JavaScript thread) │
 * ┌─ Client 2 ──┐  │ Event Loop:                          │
 * │ GET /api    │→ │ 1. Nhận request từ client 1          │
 * └─────────────┘  │ 2. Khởi động I/O (query DB)         │
 * ┌─ Client 3 ──┐  │ 3. Không chờ, nhận request 2        │
 * │ GET /api    │→ │ 4. Khởi động I/O (query DB)         │
 * └─────────────┘  │ 5. Không chờ, nhận request 3        │
 * ...              │ 6. ... tiếp tục                      │
 * ┌─ Client 1000──┐│ 7. Khi DB trả về result cho req 1   │
 * │ GET /api    │→│ 8. Gửi response cho client 1         │
 * └─────────────┘ │ 9. Tiếp tục vòng lặp                 │
 * └──────────────────────────────────────────────────────┘
 * 
 * Tất cả 1000 request được "interleave" (xen kẽ) trên 1 luồng!
 */

// Ví dụ 7: Mô phỏng hệ thống xử lý request

async function simulateHttpServer() {
  const requests = Array.from({ length: 1000 }, (_, i) => ({
    id: i + 1,
    userId: Math.floor(Math.random() * 100),
  }));

  console.log(`\nNhận ${requests.length} requests...`);

  // Event loop sẽ xử lý tất cả theo cách non-blocking
  const results = await Promise.all(
    requests.map(req => processRequest(req))
  );

  console.log(`Xử lý xong ${results.length} requests`);
}

async function processRequest(req: any) {
  // Giả lập I/O: query DB, gọi API, etc
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({
        id: req.id,
        status: 'processed',
        timestamp: new Date().toISOString(),
      });
    }, Math.random() * 100); // 0-100ms
  });
}

// ============================================================================
// PHẦN 7: ĐA LUỒNG THỰC SỰ - WORKER THREADS
// ============================================================================

/**
 * Mặc dù Node.js đơn luồng ở cấp JavaScript, bạn vẫn có thể dùng đa luồng thực:
 * 
 * 1. Worker Threads: Chạy code JavaScript trên multiple threads
 * 2. Child Process: Chạy chương trình riêng biệt
 * 3. Cluster: Chạy multiple processes (mỗi process 1 luồng)
 */

// Ví dụ 8: Worker Threads - CPU-intensive task

import { Worker } from 'worker_threads';

function runCpuIntensiveTask() {
  // Nếu dùng thread chính (chặn):
  function fibonacciBlocking(n: number): number {
    if (n <= 1) return n;
    return fibonacciBlocking(n - 1) + fibonacciBlocking(n - 2);
  }

  // Dùng worker thread (không chặn):
  return new Promise((resolve, reject) => {
    const worker = new Worker('./fibonacci.worker.js');

    worker.on('message', resolve);
    worker.on('error', reject);
    worker.on('exit', code => {
      if (code !== 0) reject(new Error(`Worker stopped with code ${code}`));
    });

    worker.postMessage({ n: 40 });
  });
}

/**
 * fibonacci.worker.js:
 * 
 * import { parentPort } from 'worker_threads';
 * 
 * function fibonacci(n: number): number {
 *   if (n <= 1) return n;
 *   return fibonacci(n - 1) + fibonacci(n - 2);
 * }
 * 
 * parentPort.on('message', (msg) => {
 *   const result = fibonacci(msg.n);
 *   parentPort.postMessage(result);
 * });
 */

// ============================================================================
// PHẦN 8: CLUSTER - TẬN DỤNG MULTI-CORE CPU
// ============================================================================

/**
 * CPU hiện đại có multiple cores (4, 8, 16, 32+).
 * Node.js (single-threaded) chỉ dùng 1 core.
 * Giải pháp: Dùng Cluster module
 * 
 * Kịch bản:
 * - Master process khởi động N worker processes (N = số cores)
 * - Mỗi worker là một Node.js instance độc lập
 * - Load balancer phân phối requests đến workers
 */

// Ví dụ 9: Cluster example

import cluster from 'cluster';
import os from 'os';

if (cluster.isMaster) {
  // Master process
  const numWorkers = os.cpus().length;

  console.log(`Master ${process.pid} khởi động ${numWorkers} workers`);

  for (let i = 0; i < numWorkers; i++) {
    cluster.fork(); // Khởi động worker process
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} đã thoát`);
    cluster.fork(); // Restart worker nếu crash
  });
} else {
  // Worker process
  console.log(`Worker ${process.pid} bắt đầu`);

  // Mỗi worker chạy server riêng
  // const app = express();
  // app.listen(3000 + cluster.worker.id);
}

/**
 * Hiệu quả:
 * - 4 cores = 4 workers = 4 request streams độc lập
 * - Tăng throughput 4x
 * - Nếu 1 worker crash, 3 worker khác vẫn hoạt động
 */

// ============================================================================
// PHẦN 9: SỨC MẠNH CỦA NODE.JS
// ============================================================================

/**
 * Tóm tắt:
 * 
 * ✓ Đơn luồng JavaScript → Dễ viết, không race conditions
 * ✓ Non-blocking I/O → Xử lý ngàn request với 1 luồng
 * ✓ Event loop → Tự động "interleave" các tác vụ
 * ✓ Thread pool (libuv) → Xử lý CPU-bound file I/O
 * ✓ OS system calls → Xử lý network I/O hiệu quả
 * ✓ Worker threads → Dùng khi cần đa luồng thực
 * ✓ Cluster → Tận dụng multi-core CPU
 * 
 * Lý do Node.js phù hợp cho:
 * - Web servers (I/O-bound)
 * - Real-time applications (WebSocket)
 * - Microservices
 * - APIs
 * 
 * Không phù hợp cho:
 * - Tính toán khoa học (CPU-bound) - dùng Python/C++
 * - Machine Learning - dùng Python
 * - Xử lý hình ảnh nặng - dùng C/C++ hoặc Go
 */

// ============================================================================
// PHẦN 10: PERFORMANCE COMPARISON
// ============================================================================

/**
 * Ví dụ: Xử lý 10,000 requests, mỗi request 50ms I/O
 * 
 * Blocking (Synchronous):
 * ┌─────────────────────────────────┐
 * │ Request 1: 50ms                │
 * │ Request 2: 50ms                │
 * │ Request 3: 50ms                │
 * │ ...                            │
 * │ Request 10,000: 50ms           │
 * │ Total: 10,000 × 50ms = 500s!  │
 * └─────────────────────────────────┘
 * 
 * Non-blocking (Node.js):
 * ┌──────────────────────────────────────────┐
 * │ 50ms: 10,000 requests xử lý đồng thời   │
 * │ Total: ~50ms (tuỳ thuộc I/O limit)      │
 * └──────────────────────────────────────────┘
 * 
 * Tỷ lệ cải thiện: 500s / 50ms = 10,000x NHANH HƠN!
 */

console.log('=== Ví dụ Performance ===');

// Blocking approach
function blockingApproach() {
  const requests = Array.from({ length: 100 });
  const start = Date.now();

  // Giả lập: xử lý 100 requests nối tiếp, mỗi 50ms
  for (let i = 0; i < requests.length; i++) {
    // Chặn 50ms
    const end = Date.now() + 50;
    while (Date.now() < end) {}
  }

  console.log(`Blocking: ${Date.now() - start}ms`);
}

// Non-blocking approach
async function nonBlockingApproach() {
  const requests = Array.from({ length: 100 });
  const start = Date.now();

  // Giả lập: khởi động 100 I/O request đồng thời
  await Promise.all(
    requests.map(
      () =>
        new Promise(resolve => {
          setTimeout(resolve, 50);
        })
    )
  );

  console.log(`Non-blocking: ${Date.now() - start}ms`);
}

// blockingApproach();      // ~5000ms
// await nonBlockingApproach(); // ~50ms

// ============================================================================
// KẾT LUẬN
// ============================================================================

/**
 * Node.js Là Đơn Luồng (Single-Threaded) nhưng Cực Kỳ Hiệu Quả:
 * 
 * 1. Event Loop: Vòng lặp vô hạn kiểm tra và xử lý callbacks/events
 * 2. Non-blocking I/O: Không chặn luồng chính khi chờ I/O
 * 3. Microtasks vs Macrotasks: Thứ tự xử lý rõ ràng, có thể dự đoán
 * 4. Thread Pool (libuv): 4 threads xử lý file I/O, DNS, crypto
 * 5. OS system calls: Network I/O không dùng threads, rất hiệu quả
 * 6. Worker Threads: Khi cần đa luồng thực cho CPU-bound tasks
 * 7. Cluster: Tận dụng multi-core CPU bằng multiple processes
 * 
 * Tóm lại:
 * ✓ Đơn luồng ở JavaScript
 * ✓ Đa luồng ở C++ (libuv)
 * ✓ Cân bằng: Đơn giản + Hiệu suất cao
 */
