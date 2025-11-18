// /**
//  * ============================================================================
//  * CÁC CÁCH TẠO CONNECTION ĐẾN DATABASE & CONNECTION POOL
//  * CODE CHẠY TUẦN TỰ HAY SONG SONG?
//  * ============================================================================
//  */

// // ============================================================================
// // 1️⃣ CÁC CÁCH TẠO CONNECTION ĐẾN DATABASE
// // ============================================================================

// /**
//  * 🎯 CÓ 3 CÁCH TẠO CONNECTION:
//  * 
//  * 1️⃣ DIRECT CONNECTION (cơ bản, không dùng pool)
//  * 2️⃣ CONNECTION POOL (tối ưu, khuyên dùng)
//  * 3️⃣ TRANSACTION CONNECTION (advanced, an toàn dữ liệu)
//  */

// // ============================================================================
// // CÁCH 1️⃣ : DIRECT CONNECTION (Không pool)
// // ============================================================================

// /**
//  * ❌ DIRECT CONNECTION - KHÔNG DÙNG POOL
//  * 
//  * Mỗi request → Tạo connection riêng → Query → Đóng connection
//  */

// import * as pg from 'pg';

// /**
//  * STEP-BY-STEP: Tạo connection không pool
//  * 
//  * Step 1: Import thư viện
//  * Step 2: Tạo client
//  * Step 3: Connect
//  * Step 4: Query
//  * Step 5: Disconnect
//  */

// async function directConnectionExample() {
//   console.log('❌ DIRECT CONNECTION (No pool) - Step by step:');

//   // ============================================================
//   // STEP 1: Tạo client (không pool)
//   // ============================================================
//   const client = new pg.Client({
//     host: 'localhost',
//     port: 5432,
//     database: 'mydb',
//     user: 'postgres',
//     password: 'password',
//   });

//   console.log('📌 Step 1: Client created (not connected yet)');

//   // ============================================================
//   // STEP 2: Connect (tạo connection đến DB)
//   // ============================================================
//   await client.connect();
//   console.log('✅ Step 2: Connected to database');
//   // Timeline: 5-10ms (network handshake + auth)

//   // ============================================================
//   // STEP 3: Execute query
//   // ============================================================
//   const result = await client.query('SELECT * FROM users WHERE id = $1', [1]);
//   console.log('✅ Step 3: Query executed', result.rows);
//   // Timeline: 5-10ms (database query)

//   // ============================================================
//   // STEP 4: Disconnect (đóng connection)
//   // ============================================================
//   await client.end();
//   console.log('✅ Step 4: Disconnected from database');
//   // Timeline: 1-2ms

//   // ============================================================
//   // ❌ PROBLEM:
//   // - Mỗi request phải mất 5-10ms CHỈ để connect
//   // - 1000 req/s × 10ms = 10 giây overhead (crash!)
//   // ============================================================
// }

// // ============================================================================
// // CÁCH 2️⃣ : CONNECTION POOL (Khuyên dùng)
// // ============================================================================

// /**
//  * ✅ CONNECTION POOL - TỐI ƯU
//  * 
//  * Lúc startup: Tạo 20 connections sẵn sàng
//  * Mỗi request: Lấy 1 connection từ pool → Query → Trả về pool
//  */

// /**
//  * STEP-BY-STEP: Tạo connection pool
//  */
// async function connectionPoolExample() {
//   console.log('\n✅ CONNECTION POOL - Step by step:');

//   // ============================================================
//   // STEP 1: Tạo pool (chứa 20 connections)
//   // ============================================================
//   const pool = new pg.Pool({
//     host: 'localhost',
//     port: 5432,
//     database: 'mydb',
//     user: 'postgres',
//     password: 'password',
//     max: 20, // ⭐ Tối đa 20 connections
//     min: 5, // ⭐ Tối thiểu 5 connections (keep warm)
//     idleTimeoutMillis: 30000, // Đóng connection sau 30s idle
//     connectionTimeoutMillis: 2000, // Timeout khi create connection
//   });

//   console.log('📌 Step 1: Pool created with 20 connections');

//   // ============================================================
//   // STEP 2: Pool tự động connect lúc cần (lazy initialization)
//   // ============================================================
//   // Pool chưa connect ở đây! Sẽ connect khi cần.

//   // ============================================================
//   // STEP 3: Thực hiện query từ pool
//   // ============================================================
//   const result = await pool.query('SELECT * FROM users WHERE id = $1', [1]);
//   console.log('✅ Step 3: Query executed from pool', result.rows);
//   // Timeline:
//   // - Lần đầu: 10ms (create connection) + 5ms (query) = 15ms
//   // - Lần sau: 0ms (use existing connection) + 5ms (query) = 5ms

//   // ============================================================
//   // STEP 4: Trả connection lại pool
//   // ============================================================
//   // ✅ TỰ ĐỘNG! Không cần manual return
//   // Connection quay về pool, sẵn sàng cho request tiếp theo

//   console.log('✅ Step 4: Connection returned to pool automatically');

//   // ============================================================
//   // STEP 5: Khi tắt app, đóng pool
//   // ============================================================
//   await pool.end();
//   console.log('✅ Step 5: Pool closed, all 20 connections disconnected');

//   // ============================================================
//   // ✅ BENEFIT:
//   // - Lần đầu: 15ms (tạo connection 1 lần)
//   // - Lần sau: 5ms (reuse connection)
//   // - 1000 req/s × 5ms = 5 giây (có thể xử lý!)
//   // ============================================================
// }

// // ============================================================================
// // CÁCH 3️⃣ : PRISMA (ORM - highest level)
// // ============================================================================

// /**
//  * ✅ PRISMA - Wrapper trên connection pool
//  * 
//  * Prisma tự động tạo pool, không cần manual
//  */

// /**
//  * STEP-BY-STEP: Dùng Prisma
//  */
// import { PrismaClient } from '@prisma/client';

// async function prismaPoolExample() {
//   console.log('\n✅ PRISMA CONNECTION POOL - Step by step:');

//   // ============================================================
//   // STEP 1: Tạo PrismaClient
//   // ============================================================
//   const prisma = new PrismaClient({
//     datasources: {
//       db: {
//         url: 'postgresql://postgres:password@localhost:5432/mydb?connection_limit=20',
//         // ⭐ connection_limit=20: Pool size
//       },
//     },
//   });

//   console.log('📌 Step 1: PrismaClient created');

//   // ============================================================
//   // STEP 2: Connection pool tự động initialize (lazy)
//   // ============================================================
//   // Chưa connect ở đây!

//   // ============================================================
//   // STEP 3: Thực hiện query (pool tự động tạo nếu cần)
//   // ============================================================
//   const user = await prisma.user.findUnique({
//     where: { id: 1 },
//   });
//   console.log('✅ Step 3: Query executed', user);

//   // ============================================================
//   // STEP 4: Trả connection lại pool
//   // ============================================================
//   // ✅ TỰ ĐỘNG! Prisma tự quản lý

//   // ============================================================
//   // STEP 5: Đóng pool khi tắt app
//   // ============================================================
//   await prisma.$disconnect();
//   console.log('✅ Step 5: Pool closed');
// }

// // ============================================================================
// // 2️⃣ CONNECTION POOL HOẠT ĐỘNG NHƯ THẾ NÀO?
// // ============================================================================

// /**
//  * 🎯 CONNECTION POOL LIFECYCLE
//  * 
//  * ┌─────────────────────────────────────────┐
//  * │ POOL INITIALIZATION (Lúc startup)       │
//  * └─────────────────────────────────────────┘
//  * 
//  * Prisma.onModuleInit() {
//  *   await $connect()
//  *   ↓
//  *   Create 20 connections to DB
//  *   - Connection #1: CREATED ✅
//  *   - Connection #2: CREATED ✅
//  *   - Connection #3: CREATED ✅
//  *   ... (20 times)
//  *   Timeline: ~100ms (one-time cost)
//  * }
//  * 
//  * ┌─────────────────────────────────────────┐
//  * │ POOL USAGE (Khi có request)              │
//  * └─────────────────────────────────────────┘
//  * 
//  * Request #1 arrives:
//  *   → CHECK POOL: Any free connection?
//  *   → YES! Get Connection #1
//  *   → Use it for query (5ms)
//  *   → Return to pool
//  * 
//  * Request #2 arrives (while #1 still using):
//  *   → CHECK POOL: Any free connection?
//  *   → YES! Get Connection #2
//  *   → Use it for query (5ms)
//  *   → Return to pool
//  * 
//  * ...
//  * 
//  * Request #20 arrives:
//  *   → CHECK POOL: Any free connection?
//  *   → YES! Get Connection #20
//  *   → Use it for query (5ms)
//  *   → Return to pool
//  * 
//  * Request #21 arrives:
//  *   → CHECK POOL: Any free connection?
//  *   → NO! All 20 connections in use
//  *   → WAIT in queue (blocking!)
//  *   → Connection #1 finishes, returns to pool
//  *   → Get Connection #1
//  *   → Use it for query (5ms)
//  *   → Return to pool
//  */

// /**
//  * ✅ CONNECTION POOL VISUALIZATION
//  */
// const poolVisualization = `
// ┌─────────────────────────────────────────────────────────┐
// │ CONNECTION POOL (size = 20)                             │
// │                                                         │
// │ FREE CONNECTIONS:                                       │
// │ [Conn #1] [Conn #2] ... [Conn #15]     15 available   │
// │                                                         │
// │ BUSY CONNECTIONS:                                       │
// │ [Request A using Conn #16]                             │
// │ [Request B using Conn #17]                             │
// │ [Request C using Conn #18]                             │
// │ [Request D using Conn #19]                             │
// │ [Request E using Conn #20]                             │
// │                                5 in use                │
// │                                                         │
// │ WAITING QUEUE:                                         │
// │ [Request F waiting] [Request G waiting] ...            │
// │                                                         │
// └─────────────────────────────────────────────────────────┘

// Timeline:
// ┌──────────────────────────────────────────────────────────┐
// │ T=0ms: Conn #16 finishes                                │
// │ T=1ms: Request F gets Conn #16, starts query           │
// │ T=6ms: Request F query done, returns Conn #16 to pool  │
// │ T=7ms: Request G gets Conn #16, starts query           │
// │ ...
// └──────────────────────────────────────────────────────────┘
// `;

// // ============================================================================
// // 3️⃣ CODE CHẠY TUẦN TỰ HAY SONG SONG?
// // ============================================================================

// /**
//  * ❓ CÂUHỎI: Khi có connection pool, code chạy tuần tự hay song song?
//  * 
//  * ✅ TRẢ LỜI: SONG SONG (Concurrent)!
//  * 
//  * Nhưng cần hiểu rõ:
//  * - Connection pool cho phép MULTIPLE requests chạy CÙNG LÚC
//  * - Nhưng mỗi request vẫn là TUẦN TỰ (không parallel)
//  */

// /**
//  * 🎯 EXAMPLE: 3 Requests with Connection Pool
//  */

// async function concurrentRequestsExample() {
//   console.log('\n🎯 CONCURRENT REQUESTS WITH POOL:');

//   const pool = new pg.Pool({
//     max: 20,
//     connectionString: 'postgresql://localhost/mydb',
//   });

//   // ============================================================
//   // 3 REQUESTS GỬI CÙNG LÚC
//   // ============================================================
//   console.log('T=0ms: 3 requests arrive simultaneously');

//   // ✅ THESE 3 RUN CONCURRENTLY (but use different connections)
//   const [result1, result2, result3] = await Promise.all([
//     // Request #1: Uses Connection #1
//     pool.query('SELECT * FROM users WHERE id = $1', [1]),
//     // Request #2: Uses Connection #2
//     pool.query('SELECT * FROM users WHERE id = $1', [2]),
//     // Request #3: Uses Connection #3
//     pool.query('SELECT * FROM users WHERE id = $1', [3]),
//   ]);

//   console.log('✅ All 3 requests completed (concurrent!)');

//   /**
//    * TIMELINE:
//    * 
//    * T=0ms:   Request #1, #2, #3 arrive
//    *          ├─ Request #1 gets Connection #1
//    *          ├─ Request #2 gets Connection #2
//    *          └─ Request #3 gets Connection #3
//    * 
//    * T=0-5ms: All 3 execute IN PARALLEL
//    *          ├─ Conn #1 executing query for Request #1
//    *          ├─ Conn #2 executing query for Request #2
//    *          └─ Conn #3 executing query for Request #3
//    * 
//    * T=5ms:   All 3 complete
//    *          ├─ Request #1 returns Connection #1
//    *          ├─ Request #2 returns Connection #2
//    *          └─ Request #3 returns Connection #3
//    * 
//    * ✅ TOTAL TIME: 5ms (not 15ms!)
//    * 
//    * WITHOUT POOL (serial):
//    * T=0-5ms: Request #1
//    * T=5-10ms: Request #2
//    * T=10-15ms: Request #3
//    * TOTAL: 15ms
//    * 
//    * WITH POOL (concurrent):
//    * T=0-5ms: Request #1, #2, #3 ALL TOGETHER
//    * TOTAL: 5ms (3x faster!)
//    */

//   await pool.end();
// }

// // ============================================================================
// // 4️⃣ SEQUENTIAL VS CONCURRENT (Code Example)
// // ============================================================================

// /**
//  * ❌ SEQUENTIAL (Tuần tự) - Code chạy một sau một
//  */
// async function sequentialCode() {
//   console.log('\n❌ SEQUENTIAL CODE:');

//   const pool = new pg.Pool({
//     max: 20,
//     connectionString: 'postgresql://localhost/mydb',
//   });

//   console.log('T=0ms: Start');

//   // ❌ Chạy tuần tự: Phải chờ hết request #1 mới chạy #2
//   const result1 = await pool.query('SELECT COUNT(*) FROM users');
//   console.log('T=5ms: Query #1 done');

//   const result2 = await pool.query('SELECT COUNT(*) FROM orders');
//   console.log('T=10ms: Query #2 done');

//   const result3 = await pool.query('SELECT COUNT(*) FROM products');
//   console.log('T=15ms: Query #3 done');

//   console.log('❌ TOTAL: 15ms (tuần tự!)');
//   // 5ms + 5ms + 5ms = 15ms

//   await pool.end();
// }

// /**
//  * ✅ CONCURRENT (Song song) - Code chạy cùng lúc
//  */
// async function concurrentCode() {
//   console.log('\n✅ CONCURRENT CODE:');

//   const pool = new pg.Pool({
//     max: 20,
//     connectionString: 'postgresql://localhost/mydb',
//   });

//   console.log('T=0ms: Start');

//   // ✅ Chạy song song: Cả 3 query chạy cùng lúc
//   const [result1, result2, result3] = await Promise.all([
//     pool.query('SELECT COUNT(*) FROM users'),
//     pool.query('SELECT COUNT(*) FROM orders'),
//     pool.query('SELECT COUNT(*) FROM products'),
//   ]);

//   console.log('T=5ms: All queries done!');

//   console.log('✅ TOTAL: 5ms (song song! 3x nhanh hơn!)');
//   // Max(5ms, 5ms, 5ms) = 5ms

//   await pool.end();
// }

// // ============================================================================
// // 5️⃣ NESTJS IMPLEMENTATION
// // ============================================================================

// /**
//  * ✅ PRISMA SERVICE + CONNECTION POOL (NestJS)
//  */
// import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

// @Injectable()
// export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
//   /**
//    * KHAI BÁO: PrismaClient
//    * 
//    * ⭐ LƯU Ý: PrismaClient được tạo mà không connect
//    * Connection pool được khởi tạo lần đầu khi cần (lazy)
//    */

//   /**
//    * onModuleInit() - Chạy khi module start
//    * 
//    * ✅ CÔNG DỤNG: Kết nối database lúc startup
//    * 
//    * ⭐ LƯU Ý: Không bắt buộc! Nếu bỏ, Prisma sẽ connect
//    * khi first query. Nhưng tốt hơn là connect sớm để
//    * biết lỗi ngay.
//    */
//   async onModuleInit() {
//     // ✅ STEP 1: Initialize pool
//     await this.$connect();
//     // ├─ Create 20 connections to database
//     // ├─ Timeline: ~100ms
//     // └─ Lỗi? Throw error và app stop. Tốt (fail fast)

//     console.log('✅ Database connected - Connection pool ready');
//     console.log('   Pool size: 20 connections');
//     console.log('   Ready to handle 1000+ req/s');
//   }

//   /**
//    * onModuleDestroy() - Chạy khi app tắt
//    * 
//    * ✅ CÔNG DỤNG: Đóng pool khi tắt app
//    */
//   async onModuleDestroy() {
//     await this.$disconnect();
//     console.log('✅ Database disconnected - All connections closed');
//   }
// }

// /**
//  * ✅ USAGE: UserService sử dụng Prisma (pool)
//  */
// @Injectable()
// export class UserService {
//   constructor(private prisma: PrismaService) {}

//   /**
//    * ✅ QUERY #1: Get user by email
//    * 
//    * - Gets 1 connection from pool
//    * - Executes query
//    * - Returns connection to pool
//    * - Timeline: 5ms
//    */
//   async getUserByEmail(email: string) {
//     return await this.prisma.user.findUnique({
//       where: { email },
//     });
//   }

//   /**
//    * ✅ CONCURRENT QUERIES: Fetch user + posts + orders
//    * 
//    * - Gets 3 connections from pool (different ones)
//    * - All 3 execute IN PARALLEL
//    * - All 3 return connections to pool
//    * - Timeline: 5ms (not 15ms!)
//    */
//   async getUserWithDetails(id: number) {
//     const [user, posts, orders] = await Promise.all([
//       this.prisma.user.findUnique({ where: { id } }),
//       this.prisma.post.findMany({ where: { userId: id } }),
//       this.prisma.order.findMany({ where: { userId: id } }),
//     ]);

//     return { user, posts, orders };
//   }
// }

// // ============================================================================
// // 6️⃣ CONNECTION POOL MONITORING
// // ============================================================================

// /**
//  * ✅ MONITOR CONNECTION POOL STATUS
//  */
// @Injectable()
// export class PoolMonitorService {
//   constructor(private prisma: PrismaService) {}

//   /**
//    * Lấy status của pool
//    * 
//    * ⭐ LƯU Ý: Prisma không expose pool status trực tiếp
//    * Phải dùng raw SQL query để check từ database
//    */
//   async getPoolStatus() {
//     const result = await this.prisma.$queryRaw`
//       SELECT 
//         datname as database,
//         count(*) as total_connections,
//         sum(case when state = 'active' then 1 else 0 end) as active,
//         sum(case when state = 'idle' then 1 else 0 end) as idle,
//         max(extract(epoch from (now() - query_start))) as longest_query_seconds
//       FROM pg_stat_activity
//       WHERE datname = current_database()
//       GROUP BY datname;
//     `;

//     return result[0];
//   }
// }

// // ============================================================================
// // 7️⃣ PERFORMANCE COMPARISON
// // ============================================================================

// /**
//  * ============================================================
//  * SCENARIO: 1000 queries to get user details
//  * Each query needs 3 sub-queries (user, posts, orders)
//  * ============================================================
//  */

// console.log(`
// 📊 PERFORMANCE COMPARISON

// ❌ WITHOUT CONNECTION POOL (Direct Connection):
//   Each query:
//   - Create connection: 10ms
//   - Execute query: 5ms
//   - Close connection: 2ms
//   TOTAL: 17ms per query

// 1000 queries × 17ms = 17,000ms = 17 SECONDS! 💥

// ============================================================

// ✅ WITH CONNECTION POOL (Size = 20):
  
//   STARTUP (one-time):
//   - Create 20 connections: 100ms
  
//   Each query (reuse connections):
//   - Get connection from pool: 0ms (already available)
//   - Execute query: 5ms
//   - Return connection: 0ms (automatic)
//   TOTAL: 5ms per query

// 1000 queries × 5ms = 5,000ms = 5 SECONDS ✅
// (But with concurrent processing: 5 SECONDS TOTAL for all 1000!)

// ============================================================

// ✅ WITH CONNECTION POOL + CONCURRENT (Promise.all):
  
//   3 concurrent queries:
//   - Query #1: 5ms (Connection #1)
//   - Query #2: 5ms (Connection #2)  ← Parallel!
//   - Query #3: 5ms (Connection #3)  ← Parallel!
//   TOTAL: 5ms (not 15ms!)

// 1000 requests of 3 concurrent queries:
// - 1000 ÷ 20 = 50 sequential batches
// - 50 batches × 5ms = 250ms TOTAL! 🚀

// ============================================================

// GAINS:
// - 17,000ms → 250ms
// - ✅ 68x FASTER!
// - ✅ 99% latency reduction!
// `);

// // ============================================================================
// // 8️⃣ REAL WORLD: E-COMMERCE CHECKOUT
// // ============================================================================

// /**
//  * ✅ E-COMMERCE CHECKOUT WITH CONNECTION POOL
//  * 
//  * 1000 checkouts/second, each needs:
//  * - Create order (INSERT)
//  * - Check inventory (SELECT)
//  * - Update inventory (UPDATE)
//  * - Create order items (INSERT)
//  * - Get total price (SELECT with JOIN)
//  */

// @Injectable()
// export class CheckoutService {
//   constructor(private prisma: PrismaService) {}

//   /**
//    * ❌ SEQUENTIAL: One query after another
//    */
//   async checkoutSequential(userId: number, items: any[]) {
//     // Query #1: Create order (2ms)
//     const order = await this.prisma.order.create({
//       data: { userId, status: 'PENDING' },
//     });

//     // Query #2: Check inventory (1ms)
//     const inventory = await this.prisma.inventory.findMany({
//       where: { productId: { in: items.map(i => i.productId) } },
//     });

//     // Query #3: Update inventory (2ms)
//     for (const item of items) {
//       await this.prisma.inventory.update({
//         where: { productId: item.productId },
//         data: { quantity: { decrement: item.quantity } },
//       });
//     }

//     // Query #4: Create order items (2ms)
//     await this.prisma.orderItem.createMany({
//       data: items.map(i => ({ orderId: order.id, ...i })),
//     });

//     // ❌ TOTAL: 2 + 1 + 2 + 2 = 7ms
//     // But with items.length = 5 × 2ms = 10ms additional
//     // TOTAL: ~15ms

//     return order;
//   }

//   /**
//    * ✅ CONCURRENT: Queries run in parallel
//    */
//   async checkoutConcurrent(userId: number, items: any[]) {
//     // ✅ STEP 1: Create order (independent)
//     const order = await this.prisma.order.create({
//       data: { userId, status: 'PENDING' },
//     });

//     // ✅ STEP 2: Check inventory + Update inventory in parallel
//     const [inventory] = await Promise.all([
//       this.prisma.inventory.findMany({
//         where: { productId: { in: items.map(i => i.productId) } },
//       }),
//       // Run all inventory updates in parallel
//       ...items.map(item =>
//         this.prisma.inventory.update({
//           where: { productId: item.productId },
//           data: { quantity: { decrement: item.quantity } },
//         }),
//       ),
//     ]);

//     // ✅ STEP 3: Create order items
//     await this.prisma.orderItem.createMany({
//       data: items.map(i => ({ orderId: order.id, ...i })),
//     });

//     // ✅ TOTAL:
//     // - Create order: 2ms
//     // - Parallel (check + update inventory): max(1ms, 2ms) = 2ms
//     // - Create items: 2ms
//     // TOTAL: 2 + 2 + 2 = 6ms (vs 15ms before!)
//     // ✅ 2.5x FASTER!

//     return order;
//   }
// }

// /**
//  * BENCHMARK:
//  * - Sequential: 15ms × 1000 = 15,000ms (too slow)
//  * - Concurrent: 6ms × 1000 = 6,000ms (acceptable)
//  * - With batch processing: 250ms (excellent!)
//  */

// // ============================================================================
// // 9️⃣ SUMMARY
// // ============================================================================

// export const ConnectionPoolSummary = `
// CONNECTION POOL & CONCURRENT CODE

// 🎯 CONNECTION POOL:
// - Pre-created connections (default: 20)
// - Reused for all requests
// - Created at startup (100ms one-time)
// - Cost per query: ~5ms (not 17ms!)

// 📊 SEQUENTIAL vs CONCURRENT:

// ❌ SEQUENTIAL (one after one):
//   Query #1: 5ms
//   Query #2: 5ms (wait for #1 to finish)
//   Query #3: 5ms (wait for #2 to finish)
//   TOTAL: 15ms

// ✅ CONCURRENT (all at same time):
//   Query #1: 5ms (Connection #1)
//   Query #2: 5ms (Connection #2) ← Same time!
//   Query #3: 5ms (Connection #3) ← Same time!
//   TOTAL: 5ms (3x faster!)

// 💡 KEY PRINCIPLE:
//    Use Promise.all() to run queries in parallel
//    Each gets its own connection from pool
//    All execute simultaneously

// 📈 PERFORMANCE GAINS:

// Without pool:  1000 queries = 17 seconds (CRASH!)
// With pool:     1000 queries = 5 seconds (OK)
// With pool +    1000 requests × 3 queries = 250ms (EXCELLENT!)
// concurrent:

// ✅ 68x FASTER than no pool!
// ✅ Production ready!
// `;
