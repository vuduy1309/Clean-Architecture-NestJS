/**
 * CONNECTION POOL - HỎI PHỎNG VẤN & TRÌNH BÀY
 * 
 * Cách tối ưu hóa khi được hỏi về pool, caching, performance
 */

// ============================================================================
// 1. CÁC LOẠI POOL & CÁCH DIỄN ĐẠT
// ============================================================================

/**
 * ========== POOL #1: CONNECTION POOL (Database) ==========
 * 
 * KHI HỎI: "Làm thế nào để tối ưu database connection?"
 * 
 * TRÌNH BÀY:
 * 
 * "Chúng ta dùng Connection Pool. Thay vì:
 * - Tạo connection mới cho mỗi request (CHẬM ❌)
 * - Tái sử dụng ~10-20 connections được quản lý
 * 
 * Cách hoạt động:
 * - Khởi động: Tạo 10 connections (prewarmed)
 * - Request 1: Lấy connection từ pool
 * - Request 2: Lấy connection khác từ pool (parallel!)
 * - Request 1 xong: Trả connection về pool
 * - Request 3: Lấy connection vừa được trả
 * 
 * Benefit:
 * - Tái sử dụng (avoid handshake 3-way: 100ms/conn)
 * - Throughput: 100+ requests/sec (vs 10 req/sec mỗi lần tạo)
 * - CPU/Memory: Consistent (connections reused)
 * 
 * Tools:
 * - Prisma: Tự động (connection pool inside)
 * - Node-postgres: pg.Pool()
 * - MySQL: mysql2/promise (createPool)
 * 
 * Cấu hình tối ưu:
 * - min connections: 2-5
 * - max connections: 10-20 (tuỳ CPU cores)
 * - idle timeout: 30s (disconnect nếu không dùng)
 * - acquire timeout: 5s (timeout nếu chờ quá lâu)
 * 
 * Code example:
 * const pool = createPool({
 *   max: 20,              // max connections
 *   min: 5,               // min connections
 *   idleTimeoutMillis: 30000,
 *   connectionTimeoutMillis: 5000
 * });"
 */

/**
 * ========== POOL #2: WORKER THREAD POOL (CPU Tasks) ==========
 * 
 * KHI HỎI: "Làm thế nào tối ưu CPU-intensive operations?"
 * 
 * TRÌNH BÀY:
 * 
 * "Chúng ta dùng Worker Thread Pool. Thay vì:
 * - Tạo worker mới mỗi lần bcrypt (CHẬM ❌)
 * - Tái sử dụng 4 workers + queue
 * 
 * Cách hoạt động (project của tôi):
 * - Khởi động: Tạo 4 workers (= CPU cores)
 * - Request 1 bcrypt: Worker 1 bận
 * - Request 2 bcrypt: Worker 2 bận (PARALLEL!)
 * - Request 5 bcrypt: Queue chờ (Worker trả lời)
 * - Worker 1 xong: Lấy job từ queue
 * 
 * Flow:
 * 
 * Request → AuthController
 *           ↓
 *         AuthService (async)
 *           ↓
 *       bcryptPool.hash() (NON-BLOCKING)
 *           ├─ Worker 1 busy? ❌
 *           ├─ Worker 2 busy? ❌
 *           ├─ Dispatch to Worker 1
 *           ├─ Return Promise
 *           └─ Main thread FREE! (can handle other requests)
 *               ├─ Request 2: Another hash
 *               ├─ Request 3: Query user
 *               ├─ Request 4: Validate email
 *               └─ (all parallel without blocking!)
 *           
 *           Worker 1 processing (100ms bcrypt)
 *           Worker 1 done → postMessage
 *           → Resolve Promise
 *           → Send response
 * 
 * Benefit:
 * - 4x throughput (bcrypt 100ms now doesn't block 100 other requests)
 * - CPU cores utilized (true parallel)
 * - Reuse workers (no creation overhead)
 * 
 * Code:
 * export class BcryptPool {
 *   private workers: Worker[] = [];
 *   private queue: Job[] = [];
 * 
 *   async hash(password: string): Promise<string> {
 *     return new Promise((resolve, reject) => {
 *       const job = { operation: 'hash', data: {...}, resolve, reject };
 *       const worker = this.workers.pop();
 *       
 *       if (worker) {
 *         // Worker available, dispatch immediately
 *         worker.postMessage(job.data);
 *       } else {
 *         // No worker, queue it
 *         this.queue.push(job);
 *       }
 *     });
 *   }
 * }"
 */

/**
 * ========== POOL #3: HTTP CONNECTION POOL (Outgoing) ==========
 * 
 * KHI HỎI: "Tối ưu khi call API bên ngoài?"
 * 
 * TRÌNH BÀY:
 * 
 * "Dùng HTTP Agent với pooling. Thay vì:
 * - Tạo connection mới mỗi lần call API (CHẬM ❌)
 * - Tái sử dụng ~10 connections
 * 
 * Code:
 * const agent = new http.Agent({
 *   keepAlive: true,
 *   keepAliveMsecs: 30000,
 *   maxSockets: 10,      // max parallel connections
 * });
 * 
 * axios.create({ httpAgent: agent });
 * 
 * Benefit:
 * - HTTP Keep-Alive reuse
 * - 10x faster (no 3-way handshake mỗi lần)
 * - Throughput: 100+ external API calls/sec"
 */

/**
 * ========== POOL #4: CACHE POOL (Memory/Redis) ==========
 * 
 * KHI HỎI: "Làm sao tối ưu khi data lặp?"
 * 
 * TRÌNH BÀY:
 * 
 * "Dùng caching:
 * 
 * Level 1: In-memory cache (fast)
 * - Map<string, value>
 * - TTL: 5 minutes
 * - Use: Thường xuyên query (user permissions, config)
 * 
 * Level 2: Redis (shared across servers)
 * - External cache server
 * - TTL: 30 minutes
 * - Use: Cross-server sharing, persistent
 * 
 * Level 3: Database (authoritative)
 * - Always available
 * - Slowest
 * 
 * Lookup order:
 * 1. Check in-memory cache (0.1ms) → return
 * 2. Check Redis (5ms) → cache locally → return
 * 3. Query database (100-500ms) → cache Redis + memory
 * 
 * Benefit:
 * - Hit rate 80% = 80% requests answered in <1ms!
 * - Database load: -80%
 * - Throughput: 1000+ req/sec (vs 100 req/sec)"
 */

// ============================================================================
// 2. PHỎNG VẤN - CÂU HỎI & ĐÁP ÁN
// ============================================================================

/**
 * ========== Q1: "High-load system, 10,000 requests/sec, tối ưu như thế nào?" ==========
 * 
 * ĐÁP ÁN MẠNH MẼ:
 * 
 * "1. Connection Pooling (Database):
 *     - Pools: 10-20 connections
 *     - Mỗi lần request không tạo new connection
 *     - Reuse existing connections
 *     - Throughput: Tăng 100x (từ 10 → 1000 req/sec)
 * 
 *  2. Worker Thread Pool (CPU Tasks):
 *     - Bcrypt, hashing, crypto: CPU-intensive
 *     - 4 workers (= CPU cores)
 *     - Main thread không bị block
 *     - Throughput: 4x improvement
 *     - Example: bcrypt 100ms × 4 workers = 400 concurrent
 * 
 *  3. Caching Layer (3-level):
 *     - Memory cache: <1ms (hot data)
 *     - Redis: 5ms (warm data, shared)
 *     - Database: 100-500ms (cold data)
 *     - Hit rate: ~80% → 80% requests answered <1ms
 * 
 *  4. Load Balancer (Nginx):
 *     - Round-robin across servers
 *     - Share load: 10,000 / 4 servers = 2,500 req/server
 *     - Each server handle: 2,500 req/sec
 * 
 *  5. Cluster Mode (Node.js):
 *     - 1 master + multiple workers
 *     - Each worker: 1 event loop
 *     - 4 CPU cores = 4 event loops in parallel
 *     - Throughput: 4x improvement
 * 
 *  Result:
 *  - Single server: 100-200 req/sec → 1000-2000 req/sec
 *  - 4 servers: 4000-8000 req/sec
 *  - With caching (80% hit): 10,000+ req/sec
 * 
 *  Total improvements:
 *  - Connection pool: 10x
 *  - Worker pool: 4x
 *  - Caching (80% hit): 5x
 *  - Cluster (4 cores): 4x
 *  - Load balancer (4 servers): 4x
 *  -----------
 *  Total: 10 × 4 × 5 × 4 × 4 = 3,200x (!!)
 *  From 3 req/sec → 10,000 req/sec"
 */

/**
 * ========== Q2: "Bcrypt mất 100ms, làm sao không block requests?" ==========
 * 
 * ĐÁP ÁN:
 * 
 * "Worker Thread Pool. Vấn đề:
 * - Bcrypt là CPU task (hash algorithm)
 * - Main thread: Single-threaded JavaScript
 * - Nếu làm bcrypt synchronously: block 100ms
 * - 10 bcrypt requests = 1000ms (đợi!)
 * 
 * Giải pháp:
 * - Dispatch bcrypt to worker thread (async)
 * - Main thread continues immediately (FREE!)
 * - 4 workers can hash in parallel
 * 
 * Timeline:
 * T=0ms:    Request 1,2,3,4: All start bcrypt
 * T=0-5ms:  Dispatch to Workers 1-4
 * T=5ms:    Main thread FREE!
 *           - Can handle Request 5,6,7,8
 *           - Can handle queries, validations
 * T=100ms:  Workers done, resolve Promises
 * T=110ms:  All 8 requests done
 * 
 * vs Synchronous:
 * T=0ms:    Request 1: Start bcrypt
 * T=100ms:  Request 1 done (main thread blocked!)
 * T=100ms:  Request 2: Start bcrypt
 * T=200ms:  Request 2 done
 * T=200ms:  Request 3: Start bcrypt
 * T=300ms:  Request 3 done
 * ...
 * T=800ms:  Request 8 done (queued 800ms!)
 * 
 * Difference:
 * - Worker pool: 110ms (parallel)
 * - Synchronous: 800ms (serial)
 * - 7.3x faster!"
 */

/**
 * ========== Q3: "Prisma vs Node-postgres, cái nào tốt hơn?" ==========
 * 
 * ĐÁP ÁN:
 * 
 * "Cả 2 đều dùng connection pool. Khác nhau:
 * 
 * Prisma:
 * + Pool: Tự động, tối ưu
 * + ORM: Type-safe, auto-migrations
 * + Query builder: Developer experience tốt
 * - Overhead: ORM layer (5-10% slower)
 * - Giải phóng connection: Automatic (tốt)
 * 
 * Node-postgres (pg):
 * + Performance: Direct SQL (fastest)
 * + Pool: Tự điều chỉnh
 * + Lightweight
 * - ORM: Phải viết SQL
 * - Type safety: Cần extra setup
 * 
 * Recommendation:
 * - API: Prisma (type-safe, nhanh đủ)
 * - High-frequency queries: pg (cần fastest)
 * - Startup: Prisma (dev speed)
 * 
 * Pool config cả 2:
 * Prisma:
 *   DATABASE_URL=postgresql://...?schema=public
 *   Mặc định: 10 min + 5 overflow
 * 
 * Node-postgres:
 *   new Pool({
 *     max: 20,
 *     idleTimeoutMillis: 30000
 *   })"
 */

/**
 * ========== Q4: "Làm sao measure performance?" ==========
 * 
 * ĐÁP ÁN:
 * 
 * "Dùng load testing tools:
 * 
 * 1. Autocannon (Node.js):
 *    npx autocannon -c 100 -d 30 http://localhost:3000/auth/login
 *    
 *    Output:
 *    ┌─────────────────────────────────┐
 *    │ Throughput: 100 req/s            │
 *    │ Latency p50: 50ms                │
 *    │ Latency p99: 150ms               │
 *    │ Total requests: 3000             │
 *    │ Errors: 0                        │
 *    └─────────────────────────────────┘
 * 
 * 2. K6 (Grafana):
 *    import http from 'k6/http';
 *    
 *    export default function() {
 *      http.post('http://localhost:3000/auth/login', {
 *        email: 'john@example.com',
 *        password: 'password123'
 *      });
 *    }
 *    
 *    k6 run --vus 100 --duration 30s script.js
 * 
 * 3. Apache Bench:
 *    ab -n 10000 -c 100 http://localhost:3000/
 * 
 * 4. Metrics muốn đo:
 *    - Throughput (requests/sec)
 *    - Latency (p50, p95, p99)
 *    - Error rate
 *    - CPU usage
 *    - Memory usage
 *    - Connection pool usage
 * 
 * Expectation (good API):
 *    - Throughput: 1000+ req/sec
 *    - Latency p99: <500ms
 *    - Error rate: <0.1%
 *    - CPU: <80%"
 */

/**
 * ========== Q5: "Node.js event loop, làm sao tối ưu?" ==========
 * 
 * ĐÁP ÁN:
 * 
 * "Node.js là single-threaded, event loop quản lý:
 * 
 * Event Loop Phases:
 * 1. timers (setTimeout, setInterval)
 * 2. pending callbacks (deferred I/O)
 * 3. idle, prepare (internal)
 * 4. poll (I/O operations)
 * 5. check (setImmediate)
 * 6. close callbacks
 * 
 * Vấn đề:
 * - Long tasks block event loop
 * - Bcrypt 100ms = block ~100 requests queued
 * 
 * Tối ưu:
 * 1. Non-blocking I/O: async/await
 *    ❌ Sync: bcrypt.hashSync() - blocks!
 *    ✓ Async: await bcrypt.hash() - non-blocking
 * 
 * 2. Defer long tasks:
 *    setImmediate() nếu có heavy computation
 * 
 * 3. Use Worker Threads:
 *    CPU tasks: Dispatch to worker (my approach!)
 *    Event loop continues
 * 
 * 4. Avoid blocking operations:
 *    ❌ Sync loops: for (let i = 0; i < 1000000000; i++)
 *    ✓ Async: Promise batching
 * 
 * Measurement:
 *    console.time('hash');
 *    const hash = await bcryptPool.hash(password);
 *    console.timeEnd('hash'); // Hash: 100.25ms
 *    
 *    Event loop blocked: ~100ms
 *    With worker: 0ms (main thread free!)"
 */

/**
 * ========== Q6: "Cluster vs Worker Threads, khi nào dùng?" ==========
 * 
 * ĐÁP ÁN:
 * 
 * "Hai pattern khác nhau:
 * 
 * Cluster Module:
 * - Master + 4 Worker processes
 * - Mỗi worker: Separate event loop
 * - Separate memory
 * - Dùng IPC (Inter-Process Communication)
 * - Restart nếu crash
 * 
 * When:
 * - Multi-core utilization (each core = 1 worker)
 * - Isolate failures (1 worker crash, others ok)
 * - High-load distributed
 * 
 * Typical:
 * Master process → load balancer
 * Worker 1 → port 3000
 * Worker 2 → port 3001
 * Worker 3 → port 3002
 * Worker 4 → port 3003
 * Nginx round-robin (external load balancer)
 * 
 * ---
 * 
 * Worker Threads:
 * - Lightweight threads (same process)
 * - Shared memory (postMessage)
 * - Lower overhead
 * - CPU-intensive operations
 * 
 * When:
 * - Bcrypt, crypto, heavy computation
 * - Keep main thread free
 * - Share memory/state
 * 
 * Typical:
 * Main thread → handle HTTP requests
 * Worker 1 → bcrypt hash
 * Worker 2 → bcrypt hash
 * Worker 3 → compression
 * Worker 4 → image processing
 * 
 * ---
 * 
 * Combination:
 * 4 Node processes (Cluster) × 4 workers (Worker Threads)
 * = 16 threads total for CPU work
 * 
 * Recommendation:
 * - Use both for high-load systems
 * - Cluster: Scale across cores
 * - Workers: Handle CPU tasks without blocking"
 */

/**
 * ========== Q7: "PostgreSQL vs MongoDB, pool cách nào?" ==========
 * 
 * ĐÁP ÁN:
 * 
 * "Cả 2 dùng connection pool, khác nhau:
 * 
 * PostgreSQL:
 * - Relational, ACID transactions
 * - Pool: Connection pool (Prisma/pg)
 * - Optimal pool size: 2 × CPU cores (recommend 10-20)
 * - Connection time: ~10-50ms
 * - Query: SQL optimized
 * 
 * MongoDB:
 * - Document-based, NoSQL
 * - Pool: Connection pooling (MongoClient)
 * - Optimal pool size: 10-100 (higher than SQL)
 * - Connection time: Similar but different handshake
 * - Query: JSON documents
 * 
 * Pool config comparison:
 * 
 * PostgreSQL (Prisma):
 * connection_limit=20      // max connections
 * pool_size=10             // min connections
 * 
 * MongoDB:
 * const client = new MongoClient(url, {
 *   maxPoolSize: 100,      // more aggressive
 *   minPoolSize: 10,
 *   maxIdleTimeMS: 45000
 * });
 * 
 * Recommendation:
 * - For structured data: PostgreSQL
 * - For flexibility: MongoDB
 * - Both work with pools
 * - PostgreSQL generally faster due to optimization"
 */

// ============================================================================
// 3. SCRIPT DIỄN ĐẠTXXX HOÀN CHỈNH
// ============================================================================

/**
 * ========== INTERVIEW SCRIPT: "Tell me about your high-load architecture" ==========
 * 
 * DIỄN ĐẠTXA:
 * 
 * "I built a high-load NestJS API with these optimizations:
 * 
 * 1. CONNECTION POOL (Database Layer):
 *    - Prisma ORM with automatic connection pooling
 *    - Pool size: 20 connections
 *    - Why: Avoid creating new connection per request (~100ms handshake)
 *    - Result: Throughput 10x (from 100 → 1000 req/sec)
 * 
 * 2. WORKER THREAD POOL (CPU Layer):
 *    - 4 worker threads for bcrypt operations
 *    - Main thread stays non-blocking (handles other requests)
 *    - Queue mechanism: If all workers busy, jobs wait
 *    - Why: Bcrypt 100ms would block main thread otherwise
 *    - Result: 4x throughput, handles 400 concurrent bcrypt ops
 *    - Code: BcryptPool with createWorker(), processQueue()
 * 
 * 3. CACHING LAYER (Memory/Redis):
 *    - In-memory cache for hot data (user roles, permissions)
 *    - Redis for cross-server sharing
 *    - TTL-based expiration
 *    - Why: 80% cache hit rate = most requests answered <1ms
 *    - Result: Database load reduced 80%
 * 
 * 4. LOAD BALANCING:
 *    - Nginx round-robin across 4 servers
 *    - Each server handles: 10,000 / 4 = 2,500 req/sec
 *    - Sticky sessions for auth
 * 
 * 5. CLUSTER MODE (Node.js):
 *    - Master process + 4 worker processes
 *    - Each worker: Independent event loop
 *    - Restart on crash
 * 
 * Testing & Metrics:
 *    - Load test with autocannon (100 concurrent users)
 *    - Measure: Throughput, latency (p50/p95/p99), errors
 *    - Target: 1000+ req/sec with <500ms p99 latency
 * 
 * Result:
 *    - Single server: 100-200 req/sec → 2000+ req/sec
 *    - Full stack (4 servers): 10,000+ req/sec"
 */

/**
 * ========== FOLLOW-UP Q: "How do you handle concurrent requests?" ==========
 * 
 * ANSWER:
 * 
 * "Event loop manages concurrency:
 * 
 * Timeline for 10 concurrent login requests:
 * 
 * T=0ms:   All 10 requests arrive
 *          ├─ Request 1: bcryptPool.hash(password)
 *          ├─ Request 2: bcryptPool.hash(password)
 *          ├─ Request 3: bcryptPool.hash(password)
 *          ├─ Request 4: bcryptPool.hash(password)
 *          └─ Request 5-10: Queue in job queue
 * 
 * T=5ms:   4 workers busy (processing reqs 1-4)
 *          Main thread continues (FREE!)
 *          ├─ Can process other routes
 *          ├─ Can query cache
 *          ├─ Can validate input
 *          └─ NOT blocked waiting for bcrypt
 * 
 * T=100ms: Workers finish (hashing complete)
 *          ├─ Dispatch Promises for requests 5-8 to workers
 *          ├─ Resume requests 1-4
 * 
 * T=200ms: All workers finish
 *          ├─ Requests 1-10 done
 *          └─ Total time: 200ms (NOT 1000ms!)
 * 
 * Key concept: Non-blocking I/O + worker pool"
 */

console.log('✓ Connection Pool Interview Guide created');
