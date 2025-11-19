// /**
//  * WORKER THREADS - CHI TIẾT TOÀN DIỆN
//  * 
//  * Nội dung:
//  * 1. Worker threads là gì
//  * 2. Khi nào dùng worker threads
//  * 3. Kiến trúc và cơ chế hoạt động
//  * 4. Cách tạo và sử dụng worker threads
//  * 5. Giao tiếp giữa main thread và worker thread
//  * 6. So sánh: Main thread vs Worker thread vs Thread pool vs Cluster
//  * 7. Performance benchmarks
//  * 8. Best practices
//  * 9. Common pitfalls và cách fix
//  */

// // ============================================================================
// // PHẦN 1: WORKER THREADS LÀ GÌ?
// // ============================================================================

// /**
//  * Worker Threads:
//  * 
//  * Là một cách để chạy JavaScript code trên multiple threads
//  * trong cùng một process.
//  * 
//  * Mỗi worker thread là một V8 instance độc lập:
//  * - Có own JavaScript execution context
//  * - Có own event loop
//  * - Có own memory space (heap)
//  * - Chạy song song với main thread
//  * 
//  * ┌────────────────────────────────────────────────┐
//  * │            Node.js Process                     │
//  * │                                                 │
//  * │  ┌──────────────────┐  ┌──────────────────┐   │
//  * │  │ Main Thread      │  │ Worker Thread 1  │   │
//  * │  │ (Your app code)  │  │ (CPU task)       │   │
//  * │  │                  │  │                  │   │
//  * │  │ V8 instance      │  │ V8 instance      │   │
//  * │  │ Event loop       │  │ Event loop       │   │
//  * │  │ Heap             │  │ Heap             │   │
//  * │  └──────────────────┘  └──────────────────┘   │
//  * │                                                 │
//  * │  ┌──────────────────┐  ┌──────────────────┐   │
//  * │  │ Worker Thread 2  │  │ Worker Thread 3  │   │
//  * │  │ (CPU task)       │  │ (CPU task)       │   │
//  * │  │                  │  │                  │   │
//  * │  │ V8 instance      │  │ V8 instance      │   │
//  * │  │ Event loop       │  │ Event loop       │   │
//  * │  │ Heap             │  │ Heap             │   │
//  * │  └──────────────────┘  └──────────────────┘   │
//  * │                                                 │
//  * │  [Shared memory] (optional)                   │
//  * └────────────────────────────────────────────────┘
//  */

// // ============================================================================
// // PHẦN 2: KHI NÀO DÙNG WORKER THREADS?
// // ============================================================================

// /**
//  * ✓ DÙNG WORKER THREADS KHI:
//  * 
//  * 1. CPU-Intensive Tasks (tính toán nặng)
//  *    - Fibonacci calculation
//  *    - Cryptography
//  *    - Image processing
//  *    - Machine learning inference
//  *    - Data processing/compression
//  *    - Video encoding/decoding
//  * 
//  * 2. Tác vụ chạy lâu có thể chặn main thread
//  *    - Heavy JSON parsing
//  *    - Large file processing
//  *    - Complex algorithm
//  * 
//  * 3. Muốn tận dụng multi-core CPU
//  *    - Có 8 cores → Có thể chạy 8 workers song song
//  * 
//  * 4. Muốn giữ main thread rảnh
//  *    - Main thread xử lý HTTP requests
//  *    - Worker threads xử lý CPU tasks
//  *    - Non-blocking experience
//  */

// /**
//  * ❌ KHÔNG DÙNG WORKER THREADS KHI:
//  * 
//  * 1. I/O-bound operations
//  *    ❌ Database queries (dùng async/await)
//  *    ❌ File reading (dùng fs.promises)
//  *    ❌ HTTP requests (dùng async/await)
//  *    (Node.js đã handle cái này hiệu quả với event loop)
//  * 
//  * 2. Simple tasks
//  *    ❌ Basic calculations
//  *    ❌ JSON parsing (nhỏ)
//  *    (Overhead của worker creation > benefit)
//  * 
//  * 3. Shared state complexity
//  *    ❌ Multiple workers cần access shared data
//  *    (Gây synchronization problems)
//  */

// // ============================================================================
// // PHẦN 3: KIẾN TRÚC WORKER THREADS
// // ============================================================================

// /**
//  * THREAD MODEL:
//  * 
//  * ┌────────────────────────────────────────────────┐
//  * │           Main Thread (Your App)               │
//  * │                                                │
//  * │ const worker = new Worker('./heavy.js')       │
//  * │ worker.postMessage({ data: ... })             │
//  * │ worker.on('message', callback)                │
//  * │                                                │
//  * │ ┌──────────────────────────────────────────┐  │
//  * │ │ Worker Thread (Heavy.js)                 │  │
//  * │ │                                          │  │
//  * │ │ import { parentPort } from ...           │  │
//  * │ │ parentPort.on('message', async msg => {  │  │
//  * │ │   const result = doHeavyWork(msg.data)  │  │
//  * │ │   parentPort.postMessage(result)        │  │
//  * │ │ })                                       │  │
//  * │ └──────────────────────────────────────────┘  │
//  * └────────────────────────────────────────────────┘
//  * 
//  * 
//  * GIAO TIẾP:
//  * 
//  * postMessage() ← Data marshalling (serialize)
//  * ↓
//  * Structured clone algorithm (copy data)
//  * ↓
//  * Worker receives message
//  * ↓
//  * Worker processes
//  * ↓
//  * Worker postMessage() ← Serialize again
//  * ↓
//  * Main thread receives
//  * 
//  * ⚠️ QUAN TRỌNG: Data được COPY, không SHARE
//  *    (Ngoại trừ khi dùng SharedArrayBuffer)
//  */

// // ============================================================================
// // PHẦN 4: VÍ DỤ CODE - FIBONACCI
// // ============================================================================

// /**
//  * Use case: Tính Fibonacci(40) - CPU intensive
//  * 
//  * Fibonacci(40) = 102,334,155
//  * Thời gian: ~1-2 giây (tuỳ hardware)
//  */

// // ─────────────────────────────────────────────────
// // main.ts - Main thread
// // ─────────────────────────────────────────────────

// import { Worker } from 'worker_threads';
// import path from 'path';

// async function calculateFibonacciWithWorker(n: number): Promise<number> {
//   return new Promise((resolve, reject) => {
//     // Tạo worker thread từ file fibonacci.worker.ts
//     const worker = new Worker(path.join(__dirname, 'fibonacci.worker.ts'));

//     // Gửi data đến worker
//     worker.postMessage({ n });

//     // Lắng nghe kết quả từ worker
//     worker.on('message', result => {
//       console.log(`✓ Worker returned: ${result}`);
//       worker.terminate(); // Giết worker (free resources)
//       resolve(result);
//     });

//     // Handle error
//     worker.on('error', reject);

//     // Handle unexpected exit
//     worker.on('exit', code => {
//       if (code !== 0) {
//         reject(new Error(`Worker exited with code ${code}`));
//       }
//     });

//     // Timeout (nếu worker bị hang)
//     setTimeout(() => {
//       worker.terminate();
//       reject(new Error('Worker timeout'));
//     }, 10000); // 10 seconds
//   });
// }

// async function demonstrateFibonacci() {
//   console.log('=== Fibonacci Calculation ===\n');

//   // Test 1: Với worker thread
//   console.log('Test 1: Using Worker Thread');
//   const start1 = Date.now();
//   const result1 = await calculateFibonacciWithWorker(40);
//   const time1 = Date.now() - start1;
//   console.log(`Result: ${result1}, Time: ${time1}ms\n`);

//   // Test 2: Không dùng worker (blocking main thread)
//   console.log('Test 2: Blocking Main Thread (direct calculation)');
//   const start2 = Date.now();
//   const result2 = fibonacciSync(40);
//   const time2 = Date.now() - start2;
//   console.log(`Result: ${result2}, Time: ${time2}ms\n`);

//   // Observations:
//   // - Thời gian tính toán gần như nhau (~1500-2000ms)
//   // - Nhưng với worker, main thread KHÔNG CHẶN
//   // - Có thể xử lý requests khác trong khi worker tính toán
// }

// function fibonacciSync(n: number): number {
//   if (n <= 1) return n;
//   return fibonacciSync(n - 1) + fibonacciSync(n - 2);
// }

// // ─────────────────────────────────────────────────
// // fibonacci.worker.ts - Worker thread code
// // ─────────────────────────────────────────────────

// /**
//  * File này chạy trong worker thread, KHÔNG trong main thread
//  * 
//  * Để import đúng:
//  * import { parentPort, workerData } from 'worker_threads';
//  */

// // fibonacci.worker.ts content:
// /*
// import { parentPort } from 'worker_threads';

// function fibonacci(n: number): number {
//   if (n <= 1) return n;
//   return fibonacci(n - 1) + fibonacci(n - 2);
// }

// // Lắng nghe message từ main thread
// parentPort.on('message', (message) => {
//   console.log(`Worker: Nhận yêu cầu tính fibonacci(${message.n})`);
  
//   const result = fibonacci(message.n);
  
//   console.log(`Worker: Tính xong, gửi kết quả`);
//   // Gửi kết quả về main thread
//   parentPort.postMessage(result);
// });

// // Hoặc, ngay khi worker được tạo, nhận workerData:
// // const result = fibonacci(workerData.n);
// // parentPort.postMessage(result);
// */

// // ============================================================================
// // PHẦN 5: VÍ DỤ CODE - WORKER POOL
// // ============================================================================

// /**
//  * Worker Pool: Tạo sẵn N workers, tái sử dụng chúng
//  * 
//  * Lợi ích:
//  * - Tránh overhead của việc create/destroy workers
//  * - Có thể xử lý multiple tasks đồng thời
//  * - Manage resources hiệu quả
//  */

// class WorkerPool {
//   private workers: Worker[] = [];
//   private queue: Array<{
//     task: any;
//     resolve: (value: any) => void;
//     reject: (error: any) => void;
//   }> = [];
//   private workerPath: string;
//   private poolSize: number;

//   constructor(workerPath: string, poolSize: number = 4) {
//     this.workerPath = workerPath;
//     this.poolSize = poolSize;
//     this.initialize();
//   }

//   private initialize() {
//     for (let i = 0; i < this.poolSize; i++) {
//       this.createWorker();
//     }
//   }

//   private createWorker() {
//     const worker = new Worker(this.workerPath);

//     worker.on('message', result => {
//       const job = this.queue.shift();
//       if (job) {
//         job.resolve(result);
//         // Worker rảnh, xử lý task tiếp theo
//         this.processQueue(worker);
//       } else {
//         // Không có task trong queue, worker chờ
//         this.workers.push(worker);
//       }
//     });

//     worker.on('error', error => {
//       const job = this.queue.shift();
//       if (job) {
//         job.reject(error);
//       }
//     });

//     this.workers.push(worker);
//   }

//   private processQueue(worker: Worker) {
//     const job = this.queue.shift();
//     if (job) {
//       worker.postMessage(job.task);
//     } else {
//       this.workers.push(worker);
//     }
//   }

//   async runTask(task: any): Promise<any> {
//     return new Promise((resolve, reject) => {
//       const availableWorker = this.workers.pop();

//       if (availableWorker) {
//         // Có worker rảnh, gửi task ngay
//         availableWorker.postMessage(task);
//         availableWorker.once('message', result => {
//           resolve(result);
//           this.workers.push(availableWorker);
//           this.processQueue(availableWorker);
//         });
//         availableWorker.once('error', reject);
//       } else {
//         // Không có worker rảnh, queue task
//         this.queue.push({ task, resolve, reject });
//       }
//     });
//   }

//   terminate() {
//     this.workers.forEach(worker => worker.terminate());
//   }
// }

// // ─────────────────────────────────────────────────
// // Sử dụng worker pool
// // ─────────────────────────────────────────────────

// async function demonstrateWorkerPool() {
//   console.log('=== Worker Pool Demo ===\n');

//   const pool = new WorkerPool(
//     path.join(__dirname, 'fibonacci.worker.ts'),
//     4 // 4 workers
//   );

//   // 10 fibonacci tasks
//   const tasks = Array.from({ length: 10 }, (_, i) => ({
//     n: 35 + i,
//   }));

//   console.log(`Xử lý ${tasks.length} tasks với 4 workers\n`);

//   const start = Date.now();

//   // Gửi tất cả tasks tới pool
//   const promises = tasks.map(task => pool.runTask(task));

//   // Chờ tất cả hoàn thành
//   const results = await Promise.all(promises);

//   const time = Date.now() - start;

//   console.log(`\nHoàn thành ${results.length} tasks trong ${time}ms`);
//   console.log(`Kết quả: ${results}`);

//   pool.terminate();

//   /**
//    * Timeline:
//    * 
//    * T=0ms:    Gửi 4 tasks (workers 1-4)
//    * T=0.1ms:  Gửi 4 tasks tiếp theo (đợi workers rảnh)
//    * T=0.2ms:  Gửi 2 tasks cuối cùng
//    * 
//    * T=~1000ms: Workers 1-4 xong (fibonacci 35-38)
//    *            Nó xử lý tasks 5-8
//    * 
//    * T=~2000ms: Tất cả 10 tasks xong
//    * 
//    * So sánh:
//    * - Sequential (1 worker): 10 × 1000ms = 10 seconds
//    * - Parallel (4 workers): 10 × 1000ms / 4 ≈ 2.5 seconds
//    * - Speedup: 4x
//    */
// }

// // ============================================================================
// // PHẦN 6: SHARED MEMORY - ADVANCED
// // ============================================================================

// /**
//  * Bình thường, data được COPY giữa threads (structured clone)
//  * 
//  * Nhưng nếu xử lý large data (GB), copy rất chậm!
//  * 
//  * Giải pháp: SharedArrayBuffer
//  * - Share memory trực tiếp
//  * - Không cần copy
//  * - Cần synchronization (Atomics)
//  */

// function sharedMemoryExample() {
//   // Main thread
//   const buffer = new SharedArrayBuffer(1024 * 1024); // 1MB
//   const array = new Int32Array(buffer);

//   // Gửi buffer tới worker (transfer, không copy)
//   const worker = new Worker('./processor.worker.js');
//   worker.postMessage({ buffer }, [buffer]); // [buffer] = transferList

//   // Khi worker update buffer, main thread có thể đọc
//   // Nhưng cần dùng Atomics để synchronization

//   /**
//    * Khi dùng SharedArrayBuffer:
//    * 
//    * ✓ Tránh data copy (nhanh hơn)
//    * ❌ Phức tạp hơn (cần atomic operations)
//    * ❌ Security risk (tiềm năng side-channel attacks)
//    * 
//    * Mục đích: Xử lý large data (images, audio, video)
//    */
// }

// // ============================================================================
// // PHẦN 7: SO SÁNH - WORKER THREADS vs ALTERNATIVES
// // ============================================================================

// /**
//  * ╔════════════════════════════════════════════════════════════════╗
//  * ║ MAIN THREAD (No threading)                                    ║
//  * ╠════════════════════════════════════════════════════════════════╣
//  * ║ Kiến trúc:  Single-threaded                                   ║
//  * ║ Tạo cost:   N/A                                               ║
//  * ║ Memory:     Low                                               ║
//  * ║ Complexity: Simple                                            ║
//  * ║ Use case:   I/O-bound (network, database)                    ║
//  * ║                                                                ║
//  * ║ Pros:                                                         ║
//  * ║ + Event loop handles thousands of concurrent I/O              ║
//  * ║ + Simple, no synchronization issues                          ║
//  * ║ + Good for APIs, web servers                                 ║
//  * ║                                                                ║
//  * ║ Cons:                                                         ║
//  * ║ - CPU-intensive tasks block everything                       ║
//  * ║ - Cannot utilize multiple CPU cores                          ║
//  * ║                                                                ║
//  * ║ Example: GET /api/users → query DB → return (I/O-bound) ✓    ║
//  * ║ Example: POST /compute → fibonacci(40) → BLOCKED ✗           ║
//  * ╚════════════════════════════════════════════════════════════════╝
//  * 
//  * ╔════════════════════════════════════════════════════════════════╗
//  * ║ THREAD POOL (libuv, automatic)                                ║
//  * ╠════════════════════════════════════════════════════════════════╣
//  * ║ Kiến trúc:  4 threads (managed by libuv)                      ║
//  * ║ Tạo cost:   Automatic, hidden                                 ║
//  * ║ Memory:     Medium                                            ║
//  * ║ Complexity: Low (you don't control it)                        ║
//  * ║ Use case:   File I/O, crypto, DNS                           ║
//  * ║                                                                ║
//  * ║ Pros:                                                         ║
//  * ║ + Automatic, no manual management                            ║
//  * ║ + Good for file system operations                            ║
//  * ║ + Already included in Node.js                                ║
//  * ║                                                                ║
//  * ║ Cons:                                                         ║
//  * ║ - Only 4 threads (limit)                                      ║
//  * ║ - Not configurable per request                               ║
//  * ║ - Limited to specific I/O operations                         ║
//  * ║                                                                ║
//  * ║ Example: fs.readFile() → dispatches to thread pool ✓         ║
//  * ║ Example: Network I/O → doesn't use thread pool ✓             ║
//  * ╚════════════════════════════════════════════════════════════════╝
//  * 
//  * ╔════════════════════════════════════════════════════════════════╗
//  * ║ WORKER THREADS (Manual, on-demand)                            ║
//  * ╠════════════════════════════════════════════════════════════════╣
//  * ║ Kiến trúc:  Manual creation, explicit control                 ║
//  * ║ Tạo cost:   ~30-40ms per thread creation                      ║
//  * ║ Memory:     High (~2MB per thread)                            ║
//  * ║ Complexity: Medium (you manage it)                            ║
//  * ║ Use case:   CPU-intensive tasks                              ║
//  * ║                                                                ║
//  * ║ Pros:                                                         ║
//  * ║ + True parallelism (can use multiple cores)                  ║
//  * ║ + Doesn't block main thread                                  ║
//  * ║ + Can create many workers (N = CPU cores)                    ║
//  * ║ + Explicit control over lifecycle                            ║
//  * ║                                                                ║
//  * ║ Cons:                                                         ║
//  * ║ - Creation/termination overhead (~30-40ms)                    ║
//  * ║ - Memory per thread (~2MB)                                    ║
//  * ║ - Data serialization overhead (unless SharedArrayBuffer)     ║
//  * ║ - Synchronization complexity                                 ║
//  * ║                                                                ║
//  * ║ Example: Fibonacci(40) → use worker ✓                         ║
//  * ║ Example: Image processing → use worker ✓                      ║
//  * ║ Example: GET /api/users → don't use worker ✗                 ║
//  * ╚════════════════════════════════════════════════════════════════╝
//  * 
//  * ╔════════════════════════════════════════════════════════════════╗
//  * ║ CLUSTER (Process-based)                                       ║
//  * ╠════════════════════════════════════════════════════════════════╣
//  * ║ Kiến trúc:  N worker processes + 1 master process            ║
//  * ║ Tạo cost:   High (~50-100ms per process)                      ║
//  * ║ Memory:     Very high (~40-60MB per process)                  ║
//  * ║ Complexity: High (IPC communication)                          ║
//  * ║ Use case:   Multi-core scaling for web servers              ║
//  * ║                                                                ║
//  * ║ Pros:                                                         ║
//  * ║ + Utilize all CPU cores                                      ║
//  * ║ + Fault isolation (worker crash ≠ main crash)                ║
//  * ║ + Each worker is independent Node.js instance                ║
//  * ║ + Simple to implement (cluster module)                       ║
//  * ║                                                                ║
//  * ║ Cons:                                                         ║
//  * ║ - High memory (40-60MB per worker)                            ║
//  * ║ - Slower creation (~50-100ms)                                 ║
//  * ║ - IPC overhead                                                ║
//  * ║ - Shared state management (need external DB/Redis)           ║
//  * ║                                                                ║
//  * ║ Example: Web server on 4-core CPU → 4 cluster workers ✓      ║
//  * ║ Example: 1000 fibonacci tasks → cluster overkill ✗           ║
//  * ╚════════════════════════════════════════════════════════════════╝
//  * 
//  * CHỌN CÁI NÀO?
//  * 
//  * I/O-bound (network, database):
//  * → Main thread + async/await (best) ✓
//  * 
//  * CPU-intensive task (1-100 tasks):
//  * → Worker threads ✓
//  * 
//  * Large data processing (images, video):
//  * → Worker threads + SharedArrayBuffer ✓
//  * 
//  * Web server scaling (4-core CPU):
//  * → Cluster (4 workers) ✓
//  * 
//  * Hybrid (I/O + CPU):
//  * → Main thread + worker threads + cluster ✓
//  */

// // ============================================================================
// // PHẦN 8: PERFORMANCE BENCHMARK
// // ============================================================================

// /**
//  * Kịch bản: Tính fibonacci(40) cho 100 requests
//  */

// class PerformanceBenchmark {
//   // Approach 1: Main thread (blocking)
//   async mainThreadApproach(): Promise<number> {
//     const tasks = Array.from({ length: 100 }, () => 40);
//     let total = 0;

//     for (const n of tasks) {
//       total += fibonacciSync(n);
//     }

//     return total;
//   }

//   // Approach 2: Single worker thread
//   async singleWorkerApproach(): Promise<number> {
//     const pool = new WorkerPool(
//       path.join(__dirname, 'fibonacci.worker.ts'),
//       1 // Single worker
//     );

//     const tasks = Array.from({ length: 100 }, () => ({ n: 40 }));
//     const results = await Promise.all(tasks.map(t => pool.runTask(t)));

//     pool.terminate();
//     return results.reduce((a, b) => a + b, 0);
//   }

//   // Approach 3: Worker pool (4 workers)
//   async workerPoolApproach(): Promise<number> {
//     const pool = new WorkerPool(
//       path.join(__dirname, 'fibonacci.worker.ts'),
//       4 // 4 workers
//     );

//     const tasks = Array.from({ length: 100 }, () => ({ n: 40 }));
//     const results = await Promise.all(tasks.map(t => pool.runTask(t)));

//     pool.terminate();
//     return results.reduce((a, b) => a + b, 0);
//   }

//   // Approach 4: Worker pool (8 workers)
//   async workerPool8Approach(): Promise<number> {
//     const pool = new WorkerPool(
//       path.join(__dirname, 'fibonacci.worker.ts'),
//       8 // 8 workers
//     );

//     const tasks = Array.from({ length: 100 }, () => ({ n: 40 }));
//     const results = await Promise.all(tasks.map(t => pool.runTask(t)));

//     pool.terminate();
//     return results.reduce((a, b) => a + b, 0);
//   }
// }

// /**
//  * Kết quả (ước tính):
//  * 
//  * Fibonacci(40) ≈ 1500ms (single calculation)
//  * 
//  * Main thread (blocking):
//  * ┌─────────────────────────┐
//  * │ 100 × 1500ms = 150 SECONDS!│
//  * │ ❌ Main thread BLOCKED    │
//  * └─────────────────────────┘
//  * 
//  * Single worker (1 thread):
//  * ┌─────────────────────────┐
//  * │ 100 × 1500ms = 150 SECONDS│
//  * │ ✓ Main thread NOT blocked│
//  * │ ❌ But still serial      │
//  * └─────────────────────────┘
//  * 
//  * Worker pool (4 workers):
//  * ┌─────────────────────────┐
//  * │ (100 / 4) × 1500ms ≈    │
//  * │ 25 × 1500ms = 37.5 SECONDS│
//  * │ ✓ Main thread NOT blocked│
//  * │ ✓ Parallel execution     │
//  * │ ✓ 4x speedup            │
//  * └─────────────────────────┘
//  * 
//  * Worker pool (8 workers on 8-core CPU):
//  * ┌─────────────────────────┐
//  * │ (100 / 8) × 1500ms ≈    │
//  * │ 12.5 × 1500ms ≈ 18.75 S │
//  * │ ✓ Main thread NOT blocked│
//  * │ ✓ Better parallelism     │
//  * │ ✓ 8x speedup            │
//  * └─────────────────────────┘
//  * 
//  * SPEEDUP GRAPH:
//  * 
//  * Time (seconds)
//  * 160 │ ███████ Main thread
//  *     │ ███████
//  *     │ ███████
//  * 140 │ ███████
//  *     │ ███████
//  * 120 │ ███████
//  *     │ ███████
//  * 100 │ ███████
//  *     │ ███████  █████ Single worker
//  *  80 │ ███████  █████
//  *     │ ███████  █████
//  *  60 │ ███████  █████
//  *     │ ███████  █████
//  *  40 │ ███████  █████  ███ Pool(4)
//  *     │ ███████  █████  ███
//  *  20 │ ███████  █████  ███ █ Pool(8)
//  *     │ ███████  █████  ███ █
//  *   0 └──────────────────────────
//  *     Main      Single  Pool Pool
//  *     Thread    Worker  4    8
//  * 
//  * Kết luận:
//  * - Main thread: TỒI (main blocked)
//  * - Single worker: Bình thường (no block, but slow)
//  * - Pool(4): TỐT (good speedup)
//  * - Pool(8): TỐTẤT (best on 8-core CPU)
//  */

// // ============================================================================
// // PHẦN 9: REAL-WORLD EXAMPLE - EXPRESS API WITH WORKERS
// // ============================================================================

// import express from 'express';

// const app = express();
// app.use(express.json());

// // Tạo worker pool cho CPU tasks
// const workerPool = new WorkerPool(
//   path.join(__dirname, 'fibonacci.worker.ts'),
//   4
// );

// // API endpoint: /api/fibonacci
// app.post('/api/fibonacci', async (req, res) => {
//   try {
//     const { n } = req.body;

//     if (!n || n < 0) {
//       return res.status(400).json({ error: 'Invalid input' });
//     }

//     // Sử dụng worker thread để tính fibonacci
//     const result = await workerPool.runTask({ n });

//     res.json({
//       n,
//       result,
//       timestamp: new Date().toISOString(),
//     });
//   } catch (error) {
//     res.status(500).json({
//       error: error instanceof Error ? error.message : 'Unknown error',
//     });
//   }
// });

// // API endpoint: /api/batch-fibonacci
// app.post('/api/batch-fibonacci', async (req, res) => {
//   try {
//     const { numbers } = req.body; // Array of numbers

//     if (!Array.isArray(numbers)) {
//       return res.status(400).json({ error: 'Invalid input' });
//     }

//     // Gửi tất cả tasks tới worker pool
//     const results = await Promise.all(
//       numbers.map(n => workerPool.runTask({ n }))
//     );

//     res.json({
//       numbers,
//       results,
//       timestamp: new Date().toISOString(),
//     });
//   } catch (error) {
//     res.status(500).json({
//       error: error instanceof Error ? error.message : 'Unknown error',
//     });
//   }
// });

// /**
//  * Usage:
//  * 
//  * curl -X POST http://localhost:3000/api/fibonacci \
//  *   -H "Content-Type: application/json" \
//  *   -d '{"n": 40}'
//  * 
//  * Response: { n: 40, result: 102334155, timestamp: "..." }
//  * 
//  * 
//  * Benefit:
//  * - Main thread NOT blocked
//  * - Can serve other requests while fibonacci computes
//  * - If request comes while computing: add to queue, workers handle
//  */

// // ============================================================================
// // PHẦN 10: BEST PRACTICES
// // ============================================================================

// /**
//  * ✓ BEST PRACTICES FOR WORKER THREADS:
//  * 
//  * 1. Reuse workers (use pools)
//  *    ✓ Create pool once, reuse many times
//  *    ✓ Creation cost: ~30-40ms per thread
//  *    ❌ Don't create new worker per task (overhead)
//  * 
//  * 2. Keep main thread processing
//  *    ✓ Main thread handles HTTP requests, routing
//  *    ✓ Worker threads handle CPU tasks
//  *    ❌ Don't let main thread do heavy computation
//  * 
//  * 3. Use async/await pattern
//  *    ✓ Return Promise from worker operations
//  *    ✓ Use async/await for clean code
//  * 
//  * 4. Handle errors properly
//  *    ✓ Always handle 'error' event
//  *    ✓ Implement timeout for stuck workers
//  *    ✓ Terminate workers properly
//  * 
//  * 5. Monitor resource usage
//  *    ✓ Number of workers ≤ CPU cores
//  *    ✓ Monitor memory per worker
//  *    ✓ Terminate unused workers
//  * 
//  * 6. Consider alternatives
//  *    ✓ Cluster for web server scaling
//  *    ✓ Async/await for I/O
//  *    ✓ Only workers for CPU tasks
//  * 
//  * 7. Use SharedArrayBuffer carefully
//  *    ✓ Only for large data (>10MB)
//  *    ✓ Use Atomics for synchronization
//  *    ✓ Be aware of security implications
//  * 
//  * 8. Profile and benchmark
//  *    ✓ Measure actual performance
//  *    ✓ Consider overhead (creation time)
//  *    ✓ Test with realistic data sizes
//  */

// // ============================================================================
// // PHẦN 11: COMMON PITFALLS
// // ============================================================================

// /**
//  * ❌ PITFALL 1: Creating new worker for each task
//  */
// async function badApproach1() {
//   for (let i = 0; i < 1000; i++) {
//     // ❌ WRONG: 1000 workers created!
//     const worker = new Worker('./fibonacci.worker.ts');
//     worker.postMessage({ n: 40 });
//     // Memory: 1000 × 2MB = 2GB! 💥
//   }
// }

// async function goodApproach1() {
//   // ✓ RIGHT: Reuse pool
//   const pool = new WorkerPool('./fibonacci.worker.ts', 4);

//   for (let i = 0; i < 1000; i++) {
//     await pool.runTask({ n: 40 });
//   }

//   pool.terminate();
// }

// /**
//  * ❌ PITFALL 2: Using workers for I/O tasks
//  */
// async function badApproach2() {
//   // ❌ WRONG: Worker for database query
//   const worker = new Worker('./db-query.worker.ts');
//   const result = await runTask(worker, { query: 'SELECT * FROM users' });
// }

// async function goodApproach2() {
//   // ✓ RIGHT: Use async/await directly
//   const result = await db.query('SELECT * FROM users');
// }

// /**
//  * ❌ PITFALL 3: Not handling worker errors
//  */
// async function badApproach3() {
//   return new Promise(resolve => {
//     const worker = new Worker('./heavy.worker.ts');
//     worker.postMessage({ data: 'task' });

//     worker.on('message', result => {
//       resolve(result);
//     });
//     // ❌ No error handling! If worker crashes, promise never resolves
//   });
// }

// async function goodApproach3() {
//   return new Promise((resolve, reject) => {
//     const worker = new Worker('./heavy.worker.ts');
//     worker.postMessage({ data: 'task' });

//     worker.on('message', result => {
//       worker.terminate();
//       resolve(result);
//     });

//     worker.on('error', reject); // ✓ Handle errors
//     worker.on('exit', code => {
//       // ✓ Handle unexpected exit
//       if (code !== 0) {
//         reject(new Error(`Worker exited with code ${code}`));
//       }
//     });

//     // ✓ Timeout
//     setTimeout(() => {
//       worker.terminate();
//       reject(new Error('Worker timeout'));
//     }, 10000);
//   });
// }

// /**
//  * ❌ PITFALL 4: Large data copying
//  */
// async function badApproach4() {
//   const largeData = new Array(10000000).fill('x'); // 10MB array

//   // ❌ WRONG: Copying 10MB data for each task!
//   const worker = new Worker('./processor.worker.ts');
//   worker.postMessage({ data: largeData }); // Structured clone = slow
// }

// async function goodApproach4() {
//   const largeData = new ArrayBuffer(10 * 1024 * 1024); // 10MB buffer

//   // ✓ RIGHT: Transfer ownership (not copy)
//   const worker = new Worker('./processor.worker.ts');
//   worker.postMessage(
//     { buffer: largeData },
//     [largeData] // transferList = transfer ownership
//   );
//   // largeData is now inaccessible in main thread
//   // Worker owns it, no copying!
// }

// /**
//  * ❌ PITFALL 5: Not terminating workers
//  */
// async function badApproach5() {
//   const worker = new Worker('./fibonacci.worker.ts');
//   await runTask(worker, { n: 40 });
//   // ❌ WRONG: Worker still running in background, consuming memory!
// }

// async function goodApproach5() {
//   const worker = new Worker('./fibonacci.worker.ts');
//   const result = await runTask(worker, { n: 40 });
//   worker.terminate(); // ✓ Free resources
// }

// // ============================================================================
// // PHẦN 12: ADVANCED - WORKER LIFECYCLE
// // ============================================================================

// /**
//  * Worker Lifecycle:
//  * 
//  * new Worker(filename)
//  *     ↓
//  * Worker thread started
//  *     ↓
//  * worker.postMessage(data)  ← Send data
//  *     ↓
//  * worker processes data
//  *     ↓
//  * worker.postMessage(result) ← Send back
//  *     ↓
//  * Main thread receives message
//  *     ↓
//  * worker.terminate()
//  *     ↓
//  * Worker thread stopped
//  * (memory freed)
//  */

// function advancedWorkerExample() {
//   const worker = new Worker('./task.worker.ts');

//   // 1. Set up listeners BEFORE sending data
//   worker.on('message', (message: any) => {
//     console.log('Progress:', message);
//   });

//   worker.on('error', (error: Error) => {
//     console.error('Worker error:', error);
//   });

//   worker.on('exit', (code: number) => {
//     if (code !== 0) {
//       console.error(`Worker stopped with exit code ${code}`);
//     }
//   });

//   // 2. Send message
//   worker.postMessage({
//     command: 'PROCESS',
//     data: { /* ... */ },
//   });

//   // 3. Worker can send multiple messages (progress)
//   // 4. Main thread can send multiple messages to worker

//   // 5. When done, terminate
//   // worker.terminate();
// }

// /**
//  * Worker can handle multiple message exchanges:
//  * 
//  * Main thread → Worker: "Start processing"
//  * Worker → Main thread: "Progress: 25%"
//  * Worker → Main thread: "Progress: 50%"
//  * Worker → Main thread: "Progress: 75%"
//  * Worker → Main thread: "Completed: result"
//  * Main thread → Worker: "terminate"
//  * Worker thread stopped
//  */

// // ============================================================================
// // PHẦN 13: TÓMLỚP
// // ============================================================================

// /**
//  * WORKER THREADS SUMMARY:
//  * 
//  * ✓ Là gì:
//  *   Multiple V8 instances chạy trong cùng một Node.js process
//  * 
//  * ✓ Khi dùng:
//  *   CPU-intensive tasks (fibonacci, image processing, etc)
//  * 
//  * ✓ Khi KHÔNG dùng:
//  *   I/O-bound (database, network) - dùng async/await
//  * 
//  * ✓ Cách tạo:
//  *   new Worker(filename)
//  * 
//  * ✓ Giao tiếp:
//  *   postMessage() và parentPort.on('message')
//  * 
//  * ✓ Performance:
//  *   Creation: ~30-40ms
//  *   Memory: ~2MB per thread
//  *   Parallelism: True (uses multiple CPU cores)
//  * 
//  * ✓ Best practice:
//  *   Use worker pools, don't create per-task
//  * 
//  * ✓ Alternatives:
//  *   Thread pool (automatic, limited)
//  *   Cluster (process-based, scales web servers)
//  *   Main thread (for I/O-bound)
//  */

// console.log('=== WORKER THREADS GUIDE COMPLETED ===');
