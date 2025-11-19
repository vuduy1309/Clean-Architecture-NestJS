// /**
//  * WORKER THREADS - CAPACITY, OPTIMAL NUMBER, VÀ LOAD BALANCING
//  * 
//  * Câu hỏi:
//  * 1. 1 worker có thể chịu bao nhiêu requests?
//  * 2. Nên tạo bao nhiêu workers?
//  * 3. Cách chịu tải lớn nhất là gì?
//  */

// // ============================================================================
// // PHẦN 1: 1 WORKER CÓ THỂ CHỈ BÀO NHIÊU REQUESTS?
// // ============================================================================

// /**
//  * QUAN TRỌNG: 1 worker không "chịu" requests!
//  * 
//  * Nhầm lẫn phổ biến:
//  * ❌ "1 worker xử lý được 100 requests/sec"
//  * ❌ "1 worker có capacity là N requests"
//  * 
//  * Sự thật:
//  * ✓ 1 worker xử lý 1 TASK tại một thời điểm
//  * ✓ Khác biệt: Worker là V8 instance, không phải connection pool
//  * ✓ 1 worker có thể xử lý hàng triệu tasks (nếu bạn queue chúng)
//  * 
//  * TIMELINE:
//  * 
//  * ┌──────────────────────────────────┐
//  * │ Main Thread                      │
//  * │                                  │
//  * │ T=0ms:   Task 1 → postMessage   │
//  * │ T=0.1ms: Task 2 → queue         │
//  * │ T=0.2ms: Task 3 → queue         │
//  * │ T=0.3ms: Task 4 → queue         │
//  * │ T=0.4ms: ... (busy queueing)   │
//  * └──────────────────────────────────┘
//  *
//  * ┌──────────────────────────────────┐
//  * │ Worker Thread                    │
//  * │                                  │
//  * │ T=0-50ms:    Process Task 1     │
//  * │ T=50-100ms:  Process Task 2     │
//  * │ T=100-150ms: Process Task 3     │
//  * │ T=150-200ms: Process Task 4     │
//  * │ ... (queue được process)        │
//  * └──────────────────────────────────┘
//  * 
//  * 1 worker có thể process:
//  * - 1000 tasks nếu mỗi task 50ms
//  * - 10000 tasks nếu mỗi task 5ms
//  * - ∞ tasks (lý thuyết)
//  * 
//  * Bottleneck = Thời gian task (CPU usage), KHÔNG phải worker count
//  */

// // ============================================================================
// // PHẦN 2: OPTIMAL NUMBER OF WORKERS
// // ============================================================================

// /**
//  * Formula:
//  * 
//  * Optimal Workers = Số CPU Cores (hoặc ít hơn)
//  * 
//  * Lý do:
//  * - CPU có N cores → chỉ có thể chạy N threads song song
//  * - Thêm workers > cores = context switching overhead (tồi)
//  * - Giảm workers < cores = không tận dụng hết CPU
//  */

// import os from 'os';

// function getOptimalWorkerCount(): number {
//   const cpuCores = os.cpus().length;

//   /**
//    * Guideline:
//    * 
//    * CPU cores = 2:  2 workers ✓
//    * CPU cores = 4:  4 workers ✓
//    * CPU cores = 8:  8 workers ✓
//    * CPU cores = 16: 12-14 workers (slightly less to avoid overhead)
//    * CPU cores = 32: 24-28 workers
//    * 
//    * Công thức chính xác hơn:
//    * Optimal = cpuCores - 1 (để giữ 1 core cho OS/other tasks)
//    */

//   return Math.max(1, cpuCores - 1);
// }

// /**
//  * EXAMPLE:
//  * 
//  * CPU: 4-core
//  * Optimal workers: 3-4
//  * 
//  * ┌────────────────────────────────────┐
//  * │ CPU Cores                          │
//  * │                                    │
//  * │ Core 1: ▓▓▓ Worker 1 (fibonacci)  │
//  * │ Core 2: ▓▓▓ Worker 2 (fibonacci)  │
//  * │ Core 3: ▓▓▓ Worker 3 (fibonacci)  │
//  * │ Core 4: ▓▓░ OS/Node.js event loop │
//  * │         ░░░ (busy doing I/O)      │
//  * └────────────────────────────────────┘
//  * 
//  * Perfect! Tất cả cores được sử dụng hiệu quả.
//  */

// /**
//  * MỘT SỐ CASES ĐẶC BIỆT:
//  * 
//  * 1. Short-lived tasks (milliseconds)
//  *    → Có thể dùng workers < cores
//  *    → Vì overhead (creation) không xứng đáng
//  *    → Better: Dùng main thread + async/await
//  * 
//  * 2. Long-lived tasks (seconds or minutes)
//  *    → Nên dùng workers = cores
//  *    → Vì tính toán lâu, creation overhead không quan trọng
//  * 
//  * 3. Mixed workload (I/O + CPU)
//  *    → Main thread: I/O (async)
//  *    → Worker threads: CPU tasks
//  *    → Workers = cores (CPU-bound)
//  * 
//  * 4. Server overload protection
//  *    → Limit workers < cores
//  *    → Ví dụ: workers = cores / 2
//  *    → Tránh overload khi nhiều requests đến
//  */

// // ============================================================================
// // PHẦN 3: THROUGHPUT - BAO NHIÊU REQUESTS/SEC?
// // ============================================================================

// /**
//  * Kịch bản: Xử lý fibonacci(40) = ~1500ms per task
//  * 
//  * CPU: 4-core
//  * Workers: 4
//  * Requests: 1000
//  */

// /**
//  * THROUGHPUT CALCULATION:
//  * 
//  * 1. Time per task: 1500ms
//  * 2. Workers: 4
//  * 3. Parallel processing: 4 tasks at once
//  * 4. Time for all tasks: (1000 / 4) × 1500ms = 375 seconds
//  * 5. Throughput: 1000 / 375s = 2.67 requests/second
//  * 
//  * TIMELINE:
//  * 
//  * T=0-1500ms:   Workers 1-4 processing tasks 1-4
//  *               Main thread queueing tasks 5-1000 (fast)
//  * 
//  * T=1500ms:     Tasks 1-4 done
//  *               Callback executed
//  *               Workers get next batch (5-8)
//  * 
//  * T=3000ms:     Tasks 5-8 done
//  *               Workers get batch (9-12)
//  * 
//  * T=4500ms:     Tasks 9-12 done
//  *               ... repeat
//  * 
//  * T=375000ms:   All 1000 tasks done
//  * 
//  * Throughput: 1000 / 375 = 2.67 req/s
//  * 
//  * NẾU THÊM WORKERS (8 workers on 8-core CPU):
//  * 
//  * Time for all: (1000 / 8) × 1500ms = 187.5 seconds
//  * Throughput: 1000 / 187.5 = 5.33 req/s
//  * 
//  * → 2x throughput với 2x workers (linear scaling)
//  */

// /**
//  * FORMULA:
//  * 
//  * Throughput = (Number of requests) / (Total time)
//  * 
//  * Total time = (requests / workers) × time_per_task
//  * 
//  * Throughput = requests / ((requests / workers) × time_per_task)
//  *            = workers / time_per_task
//  *            = workers × (1 / time_per_task)
//  * 
//  * EXAMPLE:
//  * - Workers = 4
//  * - Time per task = 1500ms = 1.5s
//  * - Throughput = 4 / 1.5 = 2.67 req/s
//  * 
//  * - Workers = 8
//  * - Time per task = 1500ms = 1.5s
//  * - Throughput = 8 / 1.5 = 5.33 req/s
//  * 
//  * ⚠️ GIẢ ĐỊNH:
//  * - All workers busy (queue không rỗng)
//  * - Network/dispatch không bị bottleneck
//  * - Task time không thay đổi
//  */

// // ============================================================================
// // PHẦN 4: QUEUE vs THROUGHPUT
// // ============================================================================

// /**
//  * Scenario: 1000 requests đến cùng lúc
//  * 4 workers, fibonacci(40) = 1500ms
//  * 
//  * TIMELINE:
//  * 
//  * T=0ms:         1000 requests arrive
//  *                Main thread dispatch
//  * 
//  * T=0-10ms:      Task 1-4 → dispatch to workers
//  *                Task 5-1000 → queue (waiting)
//  *                Main thread done, ready for next requests
//  * 
//  * T=1500ms:      Task 1-4 complete
//  *                Callback execute
//  *                Task 5-8 → dispatch to workers
//  *                Task 9-1000 → queue (waiting)
//  * 
//  * T=3000ms:      Task 5-8 complete
//  *                Task 9-12 → dispatch
//  * 
//  * ... repeat until task 1000
//  * 
//  * T=~375s:       Task 1000 complete
//  * 
//  * Response time:
//  * - Task 1: ~1500ms (quick start)
//  * - Task 5: ~1510ms (quick start + small dispatch delay)
//  * - Task 500: ~187.5s (queue + processing)
//  * - Task 1000: ~375s (last to be queued, last to finish)
//  * 
//  * ⚠️ PROBLEM: Response time tăng linear với position trong queue!
//  * Task cuối phải chờ 375 giây!
//  */

// /**
//  * QUEUE MANAGEMENT:
//  * 
//  * Good practice:
//  * 1. Implement queue with priority
//  * 2. Set queue size limit
//  * 3. Reject requests nếu queue terlalu lớn
//  * 4. Return 503 Service Unavailable (not 500)
//  * 
//  * Example:
//  * 
//  * if (queue.size > MAX_QUEUE_SIZE) {
//  *   return res.status(503).json({
//  *     error: 'Server overloaded',
//  *     retry_after: 60 // seconds
//  *   });
//  * }
//  */

// // ============================================================================
// // PHẦN 5: BOTTLENECKS & LIMITING FACTORS
// // ============================================================================

// /**
//  * Bottleneck #1: CPU (nếu task là CPU-intensive)
//  * 
//  * Limiting factor: Số CPU cores
//  * Solution: Thêm workers (tối đa = cores)
//  * 
//  * ┌────────────────────┐
//  * │ Task: fibonacci()  │ 1500ms
//  * │ Workers: 4         │
//  * │ CPU: 4-core        │
//  * │ Throughput: 2.67   │
//  * │ req/s              │
//  * └────────────────────┘
//  */

// /**
//  * Bottleneck #2: Network bandwidth
//  * 
//  * Limiting factor: Incoming/outgoing bandwidth
//  * Solution: Compress responses, optimize data transfer
//  * 
//  * Example:
//  * - Request size: 1KB
//  * - Response size: 1KB
//  * - 1000 concurrent: 2MB total (not a problem usually)
//  * 
//  * But if:
//  * - Response size: 100MB (video)
//  * - Network: 1Gbps = 125MB/s
//  * - Max concurrent: 1 video
//  * - Throughput: 10 videos/sec (limited by network)
//  */

// /**
//  * Bottleneck #3: Memory
//  * 
//  * Limiting factor: Available RAM
//  * - Each worker: ~2MB
//  * - Each request: ~1-10MB (tuỳ data size)
//  * - 1000 concurrent requests: 1-10GB
//  * 
//  * Solution:
//  * 1. Increase server memory
//  * 2. Limit concurrent requests
//  * 3. Stream large responses (don't load all in memory)
//  * 
//  * Example:
//  * - Server RAM: 16GB
//  * - Per request: 10MB
//  * - Max concurrent: 16GB / 10MB = 1600 requests
//  * - But CPU = 4 cores, so throughput is still limited by CPU
//  */

// /**
//  * Bottleneck #4: Database connections
//  * 
//  * Limiting factor: Database connection pool
//  * - Connection pool size: 20 (typical)
//  * - Each query: 100ms
//  * - Max queries/sec: 20 / 0.1 = 200 queries/sec
//  * 
//  * Example:
//  * - Request 1: opens DB connection
//  * - Request 2: opens DB connection
//  * - ...
//  * - Request 20: opens DB connection
//  * - Request 21: waits (connection pool exhausted!)
//  * 
//  * Solution:
//  * 1. Increase connection pool size
//  * 2. Optimize query time (caching, indexing)
//  * 3. Use connection pooling (Prisma handles this)
//  */

// /**
//  * BOTTLENECK PRIORITY (typical web server):
//  * 
//  * 1. Network bandwidth (least common)
//  *    - Only if serving large files/videos
//  * 
//  * 2. CPU (common for CPU-intensive tasks)
//  *    - Use workers = CPU cores
//  * 
//  * 3. Database connections (very common!)
//  *    - Connection pool bottleneck
//  *    - Fix: Optimize queries, increase pool size
//  * 
//  * 4. Memory (common under load)
//  *    - Each request consumes memory
//  *    - Fix: Increase RAM or limit concurrent requests
//  * 
//  * 5. Disk I/O (less common for APIs)
//  *    - If serving files or heavy disk usage
//  */

// // ============================================================================
// // PHẦN 6: ARCHITECTURE CHO TẢI LỚN - KẾT HỢP MỌI TECHNIQUES
// // ============================================================================

// /**
//  * LAYERED ARCHITECTURE FOR HIGH LOAD:
//  * 
//  * ┌─────────────────────────────────────────────────────────┐
//  * │ Client Requests (1000+)                                 │
//  * └────────────────┬────────────────────────────────────────┘
//  *                  │
//  *                  ▼
//  * ┌─────────────────────────────────────────────────────────┐
//  * │ LAYER 1: LOAD BALANCER (nginx, HAProxy)                 │
//  * │ - Distribute requests across multiple servers          │
//  * │ - Health checks                                        │
//  * │ - SSL termination                                      │
//  * │ - Rate limiting                                        │
//  * └────────────────┬────────────────────────────────────────┘
//  *                  │
//  *                  ▼
//  * ┌─────────────────────────────────────────────────────────┐
//  * │ LAYER 2: CDN / CACHING (Redis, CloudFlare)              │
//  * │ - Cache frequent responses (5-10 min)                  │
//  * │ - Reduce backend load                                  │
//  * │ - Static file serving                                  │
//  * │ - Compression (gzip)                                   │
//  * └────────────────┬────────────────────────────────────────┘
//  *                  │
//  *                  ▼
//  * ┌─────────────────────────────────────────────────────────┐
//  * │ LAYER 3: API SERVER (Node.js Cluster)                   │
//  * │ - Multiple worker processes (1 per CPU core)           │
//  * │ - Each process handles I/O-bound requests             │
//  * │ - async/await for non-blocking I/O                    │
//  * └────────────────┬────────────────────────────────────────┘
//  *                  │
//  *    ┌─────────────┼─────────────┐
//  *    ▼             ▼             ▼
//  * ┌──────┐  ┌──────────┐  ┌──────────────┐
//  * │LAYER │  │ LAYER 4 │  │ LAYER 5      │
//  * │4A    │  │         │  │              │
//  * │      │  │ CACHING │  │ DATABASE     │
//  * │ CACHE│  │         │  │              │
//  * │      │  │ (Local) │  │ (with pool)  │
//  * │Redis │  │ Memory  │  │              │
//  * │      │  │ Cache   │  │ Connection   │
//  * │      │  │ (Node)  │  │ pool: 20     │
//  * └──────┘  └──────────┘  └──────────────┘
//  *    │
//  *    └─────────┬─────────┘
//  *              │
//  *              ▼
//  * ┌─────────────────────────────────────────────────────────┐
//  * │ LAYER 5: CPU-INTENSIVE TASKS (Worker Threads)           │
//  * │ - Worker pool (workers = CPU cores)                    │
//  * │ - For: fibonacci, image processing, crypto           │
//  * │ - Doesn't block main thread                           │
//  * │ - Non-I/O bound operations                            │
//  * └─────────────────────────────────────────────────────────┘
//  */

// // ============================================================================
// // PHẦN 7: COMPLETE HIGH-LOAD ARCHITECTURE EXAMPLE
// // ============================================================================

// import express from 'express';
// import cluster from 'cluster';
// import os from 'os';
// import Redis from 'ioredis';
// import { PrismaClient } from '@prisma/client';
// import { Worker } from 'worker_threads';
// import path from 'path';

// /**
//  * LAYER 1: MAIN SERVER WITH CLUSTER
//  */

// const redis = new Redis({
//   host: 'localhost',
//   port: 6379,
// });

// const prisma = new PrismaClient({
//   datasources: {
//     db: {
//       url: process.env.DATABASE_URL,
//     },
//   },
// });

// /**
//  * LAYER 2: WORKER POOL FOR CPU TASKS
//  */

// class CPUTaskWorkerPool {
//   private workers: Worker[] = [];
//   private queue: Array<{
//     task: any;
//     resolve: (value: any) => void;
//     reject: (error: any) => void;
//   }> = [];

//   constructor(workerPath: string, poolSize: number) {
//     for (let i = 0; i < poolSize; i++) {
//       this.createWorker(workerPath);
//     }
//   }

//   private createWorker(workerPath: string) {
//     const worker = new Worker(workerPath);

//     worker.on('message', result => {
//       const job = this.queue.shift();
//       if (job) {
//         job.resolve(result);
//         this.processQueue(worker);
//       } else {
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
//         availableWorker.postMessage(task);
//         availableWorker.once('message', resolve);
//         availableWorker.once('error', reject);
//       } else {
//         this.queue.push({ task, resolve, reject });
//       }
//     });
//   }

//   terminate() {
//     this.workers.forEach(w => w.terminate());
//   }
// }

// const cpuWorkerPool = new CPUTaskWorkerPool(
//   path.join(__dirname, 'cpu-task.worker.ts'),
//   os.cpus().length - 1
// );

// /**
//  * LAYER 3: EXPRESS APP WITH ALL OPTIMIZATIONS
//  */

// function createApp() {
//   const app = express();
//   app.use(express.json());

//   /**
//    * MIDDLEWARE: Request limiting
//    */
//   let activeRequests = 0;
//   const MAX_CONCURRENT = 1000; // Limit to prevent overload

//   app.use((req, res, next) => {
//     if (activeRequests >= MAX_CONCURRENT) {
//       return res.status(503).json({
//         error: 'Server overloaded',
//         message: 'Please try again later',
//         retry_after: 60,
//       });
//     }

//     activeRequests++;

//     res.on('finish', () => {
//       activeRequests--;
//     });

//     next();
//   });

//   /**
//    * ENDPOINT 1: Simple I/O-bound (no worker needed)
//    * GET /api/users?skip=0&take=10
//    */
//   app.get('/api/users', async (req, res) => {
//     try {
//       // 1. Check cache first
//       const cacheKey = `users:${req.query.skip}:${req.query.take}`;
//       const cached = await redis.get(cacheKey);

//       if (cached) {
//         console.log('[CACHE HIT]');
//         return res.json(JSON.parse(cached));
//       }

//       console.log('[CACHE MISS] Querying database');

//       // 2. Query database (uses connection pool internally)
//       const users = await prisma.user.findMany({
//         skip: parseInt(req.query.skip as string) || 0,
//         take: parseInt(req.query.take as string) || 10,
//       });

//       // 3. Cache result (5 minutes)
//       await redis.setex(cacheKey, 300, JSON.stringify(users));

//       res.json(users);
//     } catch (error) {
//       res.status(500).json({ error: 'Database error' });
//     }
//   });

//   /**
//    * ENDPOINT 2: CPU-intensive (use worker)
//    * POST /api/compute
//    * Body: { n: 40 }
//    */
//   app.post('/api/compute', async (req, res) => {
//     try {
//       const { n } = req.body;

//       // 1. Check cache (results are deterministic)
//       const cacheKey = `compute:${n}`;
//       const cached = await redis.get(cacheKey);

//       if (cached) {
//         console.log('[CACHE HIT] Compute result');
//         return res.json({
//           n,
//           result: JSON.parse(cached),
//           source: 'cache',
//         });
//       }

//       console.log('[WORKER] Computing fibonacci');

//       // 2. Send to worker pool (non-blocking)
//       const result = await cpuWorkerPool.runTask({ n });

//       // 3. Cache result (indefinite for fibonacci)
//       await redis.set(cacheKey, JSON.stringify(result));

//       res.json({
//         n,
//         result,
//         source: 'computed',
//       });
//     } catch (error) {
//       res.status(500).json({ error: 'Computation error' });
//     }
//   });

//   /**
//    * ENDPOINT 3: Mixed (I/O + CPU)
//    * POST /api/process-image
//    * Body: { imageUrl: "..." }
//    */
//   app.post('/api/process-image', async (req, res) => {
//     try {
//       const { imageUrl } = req.body;

//       // 1. Check cache
//       const cacheKey = `image:${imageUrl}`;
//       const cached = await redis.get(cacheKey);

//       if (cached) {
//         return res.json(JSON.parse(cached));
//       }

//       // 2. Fetch image (I/O, async)
//       // const imageData = await fetch(imageUrl);

//       // 3. Process image (CPU, worker)
//       const processed = await cpuWorkerPool.runTask({
//         imageUrl,
//         operation: 'resize',
//         width: 200,
//         height: 200,
//       });

//       // 4. Save result to DB (I/O, async)
//       // await prisma.image.create({ ... });

//       // 5. Cache (1 hour)
//       await redis.setex(cacheKey, 3600, JSON.stringify(processed));

//       res.json(processed);
//     } catch (error) {
//       res.status(500).json({ error: 'Image processing error' });
//     }
//   });

//   /**
//    * HEALTH CHECK
//    */
//   app.get('/health', (req, res) => {
//     res.json({
//       status: 'healthy',
//       activeRequests,
//       maxConcurrent: MAX_CONCURRENT,
//       cpuUsage: process.cpuUsage(),
//       memoryUsage: process.memoryUsage(),
//     });
//   });

//   return app;
// }

// /**
//  * CLUSTER SETUP (Layer 1)
//  */

// if (cluster.isMaster) {
//   const numWorkers = os.cpus().length;

//   console.log(`Master process ${process.pid} starting ${numWorkers} workers`);

//   for (let i = 0; i < numWorkers; i++) {
//     cluster.fork();
//   }

//   cluster.on('exit', (worker, code, signal) => {
//     console.log(`Worker ${worker.process.pid} exited (${signal || code})`);
//     console.log('Starting new worker...');
//     cluster.fork();
//   });

//   /**
//    * Load balancer info
//    * Distribute to: http://localhost:3000 (nginx handles distribution)
//    */
//   console.log('Cluster ready. Use load balancer (nginx) to distribute requests.');
// } else {
//   const app = createApp();
//   const port = 3000 + cluster.worker?.id || 0;

//   app.listen(port, () => {
//     console.log(`Worker ${process.pid} listening on port ${port}`);
//   });
// }

// // ============================================================================
// // PHẦN 8: NGINX LOAD BALANCER CONFIG
// // ============================================================================

// /**
//  * /etc/nginx/nginx.conf
//  * 
//  * upstream nodejs_cluster {
//  *   server 127.0.0.1:3001;
//  *   server 127.0.0.1:3002;
//  *   server 127.0.0.1:3003;
//  *   server 127.0.0.1:3004;
//  * }
//  * 
//  * server {
//  *   listen 80;
//  *   server_name api.example.com;
//  * 
//  *   # Rate limiting
//  *   limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
//  *   limit_req zone=api burst=20 nodelay;
//  * 
//  *   # Caching
//  *   proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m;
//  * 
//  *   location /api/ {
//  *     # Proxy settings
//  *     proxy_pass http://nodejs_cluster;
//  *     proxy_set_header Host $host;
//  *     proxy_set_header X-Real-IP $remote_addr;
//  *     proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
//  *     proxy_set_header X-Forwarded-Proto $scheme;
//  * 
//  *     # Caching
//  *     proxy_cache api_cache;
//  *     proxy_cache_valid 200 5m;
//  *     proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
//  *   }
//  * }
//  */

// // ============================================================================
// // PHẦN 9: EXAMPLE - THROUGHPUT CALCULATION FOR HIGH LOAD
// // ============================================================================

// /**
//  * SCENARIO: E-commerce API
//  * 
//  * Infrastructure:
//  * - 2 servers (load balanced by nginx)
//  * - Each server: 4-core CPU, 16GB RAM
//  * - Each process: 4 cluster workers
//  * - Total workers: 8 (2 servers × 4 workers)
//  * 
//  * Endpoints:
//  * 1. GET /api/products (I/O-bound, 50ms DB query)
//  * 2. POST /api/checkout (I/O-bound, 200ms DB transaction)
//  * 3. POST /api/generate-invoice (CPU + I/O, 1000ms processing)
//  * 
//  * CALCULATION:
//  * 
//  * Endpoint 1: GET /products
//  * - Type: I/O-bound
//  * - Time: 50ms (DB query, connection pool)
//  * - Workers: 8 (cluster, not worker threads)
//  * - Concurrent requests: 8 × 20 (typical connection pool) = 160
//  * - Throughput: 160 / 0.05s = 3,200 req/s
//  * 
//  * ✓ This endpoint can handle 3,200 requests/second!
//  * (Cache helps: hit rate 80% → 8x faster)
//  * 
//  * Endpoint 2: POST /checkout
//  * - Type: I/O-bound
//  * - Time: 200ms (DB transaction)
//  * - Workers: 8
//  * - Concurrent: 8 × 20 = 160
//  * - Throughput: 160 / 0.2s = 800 req/s
//  * 
//  * ✓ This endpoint can handle 800 requests/second
//  * 
//  * Endpoint 3: POST /generate-invoice
//  * - Type: CPU + I/O (1000ms processing + 50ms save)
//  * - Time: 1050ms total
//  * - CPU workers: 4 (per server) = 8 total
//  * - Throughput: 8 / 1.05s ≈ 7.6 req/s
//  * 
//  * ❌ This endpoint is the bottleneck!
//  * 
//  * To improve:
//  * 1. Optimize processing (reduce from 1000ms to 500ms) → 15 req/s
//  * 2. Add more servers (2→4 servers) → 15 req/s
//  * 3. Queue expensive operations (async job queue)
//  *    - Immediately return: "Invoice will be generated"
//  *    - Process in background
//  *    - Notify when ready
//  * 
//  * With job queue approach:
//  * - Main endpoint: 50ms (queue task, save to DB, return)
//  * - Throughput: 8 / 0.05s = 160 req/s ✓
//  * 
//  * This is the HIGH-LOAD ARCHITECTURE!
//  */

// // ============================================================================
// // PHẦN 10: COMPREHENSIVE OVERVIEW - CHỊU TẢI LỚN NHẤT
// // ============================================================================

// /**
//  * ╔════════════════════════════════════════════════════════════════╗
//  * ║ HIGH-LOAD ARCHITECTURE - COMPLETE SOLUTION                    ║
//  * ╚════════════════════════════════════════════════════════════════╝
//  * 
//  * LAYER 0: EXTERNAL (không phải Node.js)
//  * ├─ CDN (CloudFlare, CloudFront)
//  * │  └─ Cache static assets
//  * └─ Load Balancer (nginx, HAProxy)
//  *    └─ Distribute traffic
//  * 
//  * LAYER 1: CACHING
//  * ├─ Redis (shared cache, session)
//  * └─ Browser cache
//  *
//  * LAYER 2: CLUSTERING
//  * ├─ Multiple Node.js processes
//  * │  └─ 1 per CPU core
//  * └─ Load balanced by nginx
//  * 
//  * LAYER 3: ASYNC/AWAIT
//  * ├─ Non-blocking I/O
//  * ├─ Database connection pool
//  * └─ Efficient event loop
//  * 
//  * LAYER 4: WORKER THREADS
//  * ├─ CPU-intensive tasks
//  * └─ Worker pool (workers = cores)
//  * 
//  * LAYER 5: JOB QUEUE
//  * ├─ Background job processing
//  * ├─ Bull, BullMQ, RabbitMQ
//  * └─ Async notifications (WebSocket, email)
//  * 
//  * RESULT:
//  * ✓ Handles 1000s of concurrent requests
//  * ✓ Sub-second response times
//  * ✓ No single point of failure
//  * ✓ Scales horizontally (add more servers)
//  * ✓ Optimized for both I/O and CPU
//  */

// /**
//  * CONFIGURATION CHECKLIST:
//  * 
//  * ✓ Cluster module: 1 worker per CPU core
//  * ✓ Connection pool: 20-30 connections
//  * ✓ Worker threads: 1 per CPU core (for CPU tasks)
//  * ✓ Redis cache: 5-60 min TTL
//  * ✓ Request limiting: 1000 concurrent max
//  * ✓ Response compression: gzip enabled
//  * ✓ Database: Optimized queries, indexing
//  * ✓ Job queue: For long-running tasks
//  * ✓ Monitoring: CPU, memory, response time
//  * ✓ Logging: Errors and performance metrics
//  * ✓ Graceful shutdown: Drain connections
//  * ✓ Health checks: Liveness & readiness
//  */

// console.log('=== HIGH-LOAD ARCHITECTURE GUIDE COMPLETED ===');
