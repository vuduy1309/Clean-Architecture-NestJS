/**
 * PHỎNG VẤN: "Tối ưu hóa login function để chịu 1000 requests/second"
 * 
 * Đây là câu hỏi rất phổ biến, đáp án cụ thể & thực tế
 */

// ============================================================================
// SCRIPT DIỄN ĐẠT HOÀN CHỈNH
// ============================================================================

/**
 * ========== PHỎNG VẤN CÓ: "Làm sao tối ưu login để chịu 1000 req/s?" ==========
 * 
 * ANSWER (Đáp án mạnh mẽ):
 * 
 * "Tôi sẽ chia thành các layer:
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 1: APPLICATION LAYER (Non-blocking operations)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Vấn đề:
 * - bcrypt.hash() hoặc bcrypt.compare() = CPU-intensive (100-150ms)
 * - Nếu sync: block main thread → queue 100+ requests
 * - Throughput: ~10 req/s (1000ms / 100ms per request)
 * 
 * Giải pháp: WORKER THREAD POOL
 * 
 * Code structure:
 * 
 * @Injectable()
 * export class BcryptPool {
 *   private workers: Worker[] = [];  // 4 workers (CPU cores)
 *   private queue: Job[] = [];
 * 
 *   async compare(password: string, hash: string): Promise<boolean> {
 *     return new Promise((resolve, reject) => {
 *       const worker = this.workers.pop();
 *       
 *       if (worker) {
 *         // Worker available: dispatch immediately
 *         worker.postMessage({ operation: 'compare', password, hash });
 *       } else {
 *         // All workers busy: queue the job
 *         this.queue.push({ operation: 'compare', password, hash, resolve, reject });
 *       }
 *     });
 *   }
 * }
 * 
 * Timeline (10 concurrent login):
 * 
 * T=0ms:    [REQUEST 1] ──→ Worker 1 (processing)
 *           [REQUEST 2] ──→ Worker 2 (processing)
 *           [REQUEST 3] ──→ Worker 3 (processing)
 *           [REQUEST 4] ──→ Worker 4 (processing)
 *           [REQUEST 5-10] ──→ Queue (waiting)
 *           
 *           Main thread: FREE! (not blocked)
 * 
 * T=5ms:    Main thread continues:
 *           - Can query database
 *           - Can validate input
 *           - Can check cache
 *           - Can handle REQUEST 11, 12, 13
 * 
 * T=100ms:  Workers finish:
 *           [REQUEST 1,2,3,4] ──→ Done (bcrypt result)
 *           [REQUEST 5,6,7,8] ──→ Dispatch to workers
 *           [REQUEST 9,10] ──→ Still in queue
 * 
 * T=200ms:  All 10 done (NOT 1000ms!)
 * 
 * Result:
 * ✓ Throughput: 4x improvement (serial 100ms → parallel 100ms)
 * ✓ Main thread: Always free
 * ✓ Can handle 400+ concurrent bcrypt ops
 * ✓ CPU cores utilized fully
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 2: DATABASE LAYER (Connection pooling)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Vấn đề:
 * - Tạo new connection mỗi lần query = 50-100ms (TCP 3-way handshake)
 * - 1000 requests × 100ms = 100 seconds của handshakes (WASTE!)
 * 
 * Giải pháp: CONNECTION POOL
 * 
 * Prisma (automatic):
 * - Tự động pooling
 * - Max connections: 20
 * - Min connections: 2 (prewarmed)
 * 
 * Flow:
 * 
 * T=0ms:    [REQUEST 1] ──→ Lấy connection 1 từ pool ──→ Query
 *           [REQUEST 2] ──→ Lấy connection 2 từ pool ──→ Query
 *           ...
 *           [REQUEST 20] ──→ Lấy connection 20 từ pool ──→ Query
 *           [REQUEST 21] ──→ Chờ connection trả lại
 * 
 * T=10ms:   [REQUEST 1] done ──→ Trả connection 1 về pool
 *           [REQUEST 21] ──→ Lấy connection 1 ──→ Query
 * 
 * Result:
 * ✓ Reuse connections (no handshake overhead)
 * ✓ Throughput: 10x improvement
 * ✓ Database connection: Stable
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 3: CACHE LAYER (User data)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Vấn đề:
 * - Mỗi login phải query user từ database
 * - Nếu 80% users login nhiều lần = redundant queries
 * 
 * Giải pháp: MULTI-LEVEL CACHE
 * 
 * 1. In-memory cache (ultra-fast):
 *    ```
 *    const userCache = new Map<string, User>();
 *    const TTL = 5 * 60 * 1000; // 5 minutes
 *    
 *    async getUser(email: string): Promise<User> {
 *      // Check L1 cache (0.1ms)
 *      let user = userCache.get(email);
 *      if (user && user.expiresAt > Date.now()) {
 *        return user;  // ✓ Cache hit
 *      }
 *      
 *      // Check L2 cache (Redis, 5ms)
 *      user = await redis.get(`user:${email}`);
 *      if (user) {
 *        userCache.set(email, { ...user, expiresAt: Date.now() + TTL });
 *        return user;
 *      }
 *      
 *      // Query database (100ms)
 *      user = await db.users.findOne({ email });
 *      userCache.set(email, { ...user, expiresAt: Date.now() + TTL });
 *      await redis.set(`user:${email}`, user, 'EX', 300);
 *      return user;
 *    }
 *    ```
 * 
 * Cache hit rate: 80% (realistic)
 * - 800 requests: <1ms (cache hit)
 * - 200 requests: 100ms (database query)
 * 
 * Impact:
 * ✓ 80% throughput boost (most requests instant)
 * ✓ Database load: -80%
 * ✓ Network: reduced
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 4: ASYNC/AWAIT (Non-blocking I/O)
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Code:
 * ```
 * async login(email: string, password: string) {
 *   // 1. Get user (cache or DB)
 *   const user = await this.getUser(email);  // Async, non-blocking
 * 
 *   // 2. Compare password (worker thread)
 *   const isValid = await this.bcryptPool.compare(password, user.hash);
 * 
 *   // 3. Generate token
 *   const token = jwt.sign({ userId: user.id }, secret);
 * 
 *   // 4. Return response
 *   return { token };
 * }
 * ```
 * 
 * ✓ Event loop continues (doesn't wait)
 * ✓ Can handle other requests
 * ✓ Non-blocking all the way
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 5: LOAD BALANCING & SCALING
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Single server:
 * - 4 CPU cores
 * - Event loop: 1 thread per core
 * - With optimizations: 200-300 req/s
 * 
 * Multiple servers (Nginx):
 * - 4 servers × 250 req/s = 1000 req/s
 * - Nginx round-robin
 * - Sticky sessions (same user to same server)
 * 
 * Nginx config:
 * ```
 * upstream api {
 *   server 10.0.0.1:3000;
 *   server 10.0.0.2:3000;
 *   server 10.0.0.3:3000;
 *   server 10.0.0.4:3000;
 * }
 * 
 * server {
 *   listen 80;
 *   location /auth/login {
 *     proxy_pass http://api;
 *   }
 * }
 * ```
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * LAYER 6: INPUT VALIDATION & ERROR HANDLING
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Fail-fast:
 * ```
 * async login(email: string, password: string) {
 *   // 1. Validate input (0.1ms) - FAIL FAST
 *   if (!email || !password) {
 *     throw new BadRequestException('Invalid input');
 *   }
 * 
 *   // 2. Check if user exists (cache, 1ms)
 *   const user = await this.getUser(email);
 *   if (!user) {
 *     throw new NotFoundException('User not found');  // Exit early!
 *   }
 * 
 *   // 3. Only then compare password (expensive)
 *   const isValid = await this.bcryptPool.compare(password, user.hash);
 *   if (!isValid) {
 *     throw new UnauthorizedException('Invalid password');
 *   }
 * 
 *   // 4. Generate token
 *   const token = jwt.sign({ userId: user.id }, secret);
 *   return { token };
 * }
 * ```
 * 
 * ✓ Early exit on invalid input (avoid expensive bcrypt)
 * ✓ Throughput improvement: ~30%
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * MEASUREMENT & TESTING
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * Load test:
 * ```
 * npx autocannon \\
 *   -c 1000 \\
 *   -d 60 \\
 *   -m POST \\
 *   -H 'Content-Type: application/json' \\
 *   -b '{\"email\":\"test@example.com\",\"password\":\"password123\"}' \\
 *   http://localhost:3000/auth/login
 * ```
 * 
 * Expected output:
 * ```
 * Throughput:
 *   avg: 1000.0 req/s
 *   max: 1050.0 req/s
 * 
 * Latency:
 *   avg: 50ms
 *   p50: 45ms
 *   p95: 100ms
 *   p99: 150ms
 * 
 * Errors: 0
 * ```
 * 
 * ═══════════════════════════════════════════════════════════════════════════
 * SUMMARY: HOW TO ACHIEVE 1000 REQ/S
 * ═══════════════════════════════════════════════════════════════════════════
 * 
 * ┌─────────────────────────────────────────────────────────────────────┐
 * │ 1. Worker Thread Pool (bcrypt)        → 4x throughput              │
 * │ 2. Connection Pooling (database)      → 10x throughput             │
 * │ 3. Multi-level Caching                → 5x throughput (80% hit)    │
 * │ 4. Async/Await (non-blocking I/O)     → Base requirement           │
 * │ 5. Load Balancing (4 servers)         → 4x horizontal scaling      │
 * │ 6. Fail-fast validation               → 30% improvement            │
 * └─────────────────────────────────────────────────────────────────────┘
 * 
 * Single server (before):     ~50 req/s
 * Single server (optimized):  ~250 req/s
 * 4 servers:                  ~1000 req/s ✓
 * 
 * Key technologies:
 * - NestJS (framework)
 * - Prisma (connection pooling)
 * - Worker Threads (bcrypt)
 * - Redis (distributed cache)
 * - Nginx (load balancer)
 * - JWT (stateless auth)
 * 
 * Monitoring:
 * - Prometheus metrics
 * - Grafana dashboard
 * - Alert on latency >500ms
 * - Alert on error rate >0.1%"
 */

// ============================================================================
// FOLLOW-UP QUESTIONS & ANSWERS
// ============================================================================

/**
 * ========== FOLLOW-UP Q1: "What if bcrypt is even slower (200ms)?" ==========
 * 
 * ANSWER:
 * 
 * "Still works! The key is parallelization:
 * 
 * With 4 workers:
 * - 4 × 200ms bcrypt = 400 concurrent operations
 * - Throughput: Still 200-300 req/s per server
 * - Timeline same: Worker 1-4 start at T=0, done at T=200
 * 
 * To reach 1000 req/s with slower bcrypt:
 * - Need more servers (6-8 instead of 4)
 * - Or: Pre-hash passwords offline (not realistic)
 * - Or: Use faster hashing (argon2, but still expensive)
 * 
 * Real solution: More workers or more servers"
 */

/**
 * ========== FOLLOW-UP Q2: "What about database bottleneck?" ==========
 * 
 * ANSWER:
 * 
 * "Connection pooling + caching handles it:
 * 
 * Without cache:
 * - 1000 queries/sec to database
 * - Database might be bottleneck
 * 
 * With 80% cache hit:
 * - 200 real queries/sec (vs 1000)
 * - Database easily handles 200 req/s
 * - Query time: 10-20ms
 * 
 * If database still slow:
 * - Use read replicas (for SELECT queries)
 * - Use Redis cache (distributed)
 * - Use database indexing (on email column for login!)
 * - Use database optimization (connection pooling)"
 */

/**
 * ========== FOLLOW-UP Q3: "JWT token generation cost?" ==========
 * 
 * ANSWER:
 * 
 * "Negligible:
 * 
 * jwt.sign() is very fast (~1-2ms)
 * - No I/O
 * - No CPU intensive task
 * - Pure algorithm
 * 
 * Timeline:
 * T=0-10ms:    Database query or cache hit
 * T=10-110ms:  Bcrypt compare (worker)
 * T=110-112ms: JWT generation
 * Total: ~112ms
 * 
 * JWT is not the bottleneck."
 */

/**
 * ========== FOLLOW-UP Q4: "What if using synchronous bcrypt?" ==========
 * 
 * ANSWER:
 * 
 * "❌ VERY BAD:
 * 
 * bcrypt.hashSync() or bcrypt.compareSync():
 * - Blocks main thread 100-150ms
 * - Cannot handle concurrent requests
 * 
 * Timeline:
 * T=0-100ms:    Request 1 bcrypt (BLOCKED)
 * T=100-200ms:  Request 2 bcrypt (waiting)
 * T=200-300ms:  Request 3 bcrypt (waiting)
 * ...
 * T=1000ms:     Request 10 done (QUEUED 1000ms!)
 * 
 * Throughput: ~10 req/s (1000ms / 100ms)
 * 
 * ✓ ALWAYS use async bcrypt
 * ✓ Use worker threads if needed"
 */

/**
 * ========== FOLLOW-UP Q5: "Connection pool size: how many?" ==========
 * 
 * ANSWER:
 * 
 * "Recommendation:
 * 
 * Pool size = 2 × CPU cores
 * - 4 cores → 8 connections
 * - But safe min: 10, max: 20
 * 
 * Too small (2-3):
 * - Requests wait for connection
 * - Underutilized
 * - Throughput: limited
 * 
 * Too large (50+):
 * - More memory
 * - Database server overwhelmed
 * - Diminishing returns
 * 
 * Optimal for 1000 req/s:
 * - 20 connections per server
 * - 4 servers × 20 = 80 total database connections
 * - Each database can handle 100+ connections easily"
 */

/**
 * ========== FOLLOW-UP Q6: "Redis vs in-memory cache?" ==========
 * 
 * ANSWER:
 * 
 * "Both, layered:
 * 
 * In-memory (L1):
 * - Ultra-fast (<1ms)
 * - Per-server only
 * - Size: limited by memory (few GB)
 * - Use: Hot data (current users)
 * 
 * Redis (L2):
 * - Fast (5ms)
 * - Shared across servers
 * - Size: bigger (Redis can handle 100GB+)
 * - Use: Warm data
 * 
 * Database (L3):
 * - Slow (100ms)
 * - Authoritative
 * - Use: Cold data
 * 
 * Cache hit flow:
 * 1. Check memory cache (0.1ms) → 70% hit
 * 2. Check Redis (5ms) → 15% hit
 * 3. Query database (100ms) → 15% miss
 * 
 * Total cache hit rate: 85%
 * Average latency: 0.7×0.1 + 0.15×5 + 0.15×100 = 16ms (✓ good)"
 */

/**
 * ========== FOLLOW-UP Q7: "What about user with weak password (many login failures)?" ==========
 * 
 * ANSWER:
 * 
 * "Rate limiting + brute force protection:
 * 
 * Code:
 * ```
 * const loginAttempts = new Map<string, { count: number; resetAt: number }>();
 * 
 * async login(email: string, password: string) {
 *   const attempts = loginAttempts.get(email);
 *   
 *   // Check brute force
 *   if (attempts && attempts.count > 5 && attempts.resetAt > Date.now()) {
 *     throw new TooManyRequestsException('Too many failed attempts');
 *   }
 *   
 *   // Try login...
 *   const isValid = await this.bcryptPool.compare(password, user.hash);
 *   
 *   if (!isValid) {
 *     loginAttempts.set(email, {
 *       count: (attempts?.count || 0) + 1,
 *       resetAt: Date.now() + 15 * 60 * 1000  // 15 min lock
 *     });
 *     throw new UnauthorizedException('Invalid password');
 *   }
 * }
 * ```
 * 
 * Impact:
 * - Prevents brute force attacks
 * - Reduces waste on invalid attempts
 * - Improves security"
 */

/**
 * ========== FOLLOW-UP Q8: "CPU cores vs event loop?" ==========
 * 
 * ANSWER:
 * 
 * "Node.js with 1 event loop per core:
 * 
 * Single process (1 event loop):
 * - Cannot use multiple CPU cores
 * - 4-core machine: Only 1 core used (25% utilization)
 * 
 * Solution: Cluster mode
 * ```
 * const cluster = require('cluster');
 * const os = require('os');
 * 
 * if (cluster.isMaster) {
 *   for (let i = 0; i < os.cpus().length; i++) {
 *     cluster.fork();  // Fork worker per core
 *   }
 * } else {
 *   // Each worker: Independent event loop
 *   app.listen(3000);
 * }
 * ```
 * 
 * 4 cores = 4 processes = 4 event loops
 * = 4x throughput (100% CPU utilization)
 * 
 * Example:
 * - Single process: 250 req/s
 * - 4 processes: 1000 req/s ✓"
 */

// ============================================================================
// CODE SNIPPET: COMPLETE LOGIN OPTIMIZED
// ============================================================================

/**
 * ========== COMPLETE OPTIMIZED LOGIN CODE ==========
 * 
 * ```typescript
 * @Injectable()
 * export class AuthService {
 *   // Cache
 *   private userCache = new Map<string, { user: User; expiresAt: number }>();
 *   private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
 * 
 *   constructor(
 *     private bcryptPool: BcryptPool,
 *     private prisma: PrismaService,
 *     private redis: RedisService,
 *   ) {}
 * 
 *   async login(email: string, password: string): Promise<{ token: string }> {
 *     // 1. VALIDATION (fail-fast)
 *     if (!email || !password) {
 *       throw new BadRequestException('Email and password required');
 *     }
 * 
 *     // 2. GET USER (cache first)
 *     const user = await this.getUser(email);
 *     if (!user) {
 *       throw new UnauthorizedException('Invalid credentials');
 *     }
 * 
 *     // 3. COMPARE PASSWORD (worker thread - non-blocking)
 *     const isValid = await this.bcryptPool.compare(password, user.hash);
 *     if (!isValid) {
 *       throw new UnauthorizedException('Invalid credentials');
 *     }
 * 
 *     // 4. GENERATE TOKEN (fast)
 *     const token = this.generateJWT(user);
 * 
 *     // 5. RETURN (200 bytes)
 *     return { token };
 *   }
 * 
 *   // Cache-aware user fetch
 *   private async getUser(email: string): Promise<User | null> {
 *     // L1: Memory cache
 *     const cached = this.userCache.get(email);
 *     if (cached && cached.expiresAt > Date.now()) {
 *       return cached.user;
 *     }
 * 
 *     // L2: Redis
 *     const redisData = await this.redis.get(`user:${email}`);
 *     if (redisData) {
 *       const user = JSON.parse(redisData);
 *       this.userCache.set(email, { user, expiresAt: Date.now() + this.CACHE_TTL });
 *       return user;
 *     }
 * 
 *     // L3: Database
 *     const user = await this.prisma.user.findUnique({ where: { email } });
 *     if (user) {
 *       await this.redis.set(`user:${email}`, JSON.stringify(user), 'EX', 300);
 *       this.userCache.set(email, { user, expiresAt: Date.now() + this.CACHE_TTL });
 *     }
 * 
 *     return user;
 *   }
 * 
 *   private generateJWT(user: User): string {
 *     return jwt.sign(
 *       { userId: user.id, email: user.email },
 *       process.env.JWT_SECRET,
 *       { expiresIn: '24h' }
 *     );
 *   }
 * }
 * ```
 * 
 * Timeline breakdown:
 * - Validation: 0.1ms
 * - Get user (cache hit): <1ms
 * - Bcrypt compare (worker): 100ms (async)
 * - JWT generation: 1ms
 * - Response: 1ms
 * ───────────────────
 * Total: ~102ms (with 4 workers parallel = ~25ms per core)
 * 
 * With 4 servers × 250 req/s = 1000 req/s ✓
 */

console.log('✓ Interview answer: 1000 req/s login optimization complete');
