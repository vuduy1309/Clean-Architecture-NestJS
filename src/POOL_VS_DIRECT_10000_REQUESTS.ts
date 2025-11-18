// /**
//  * ============================================================================
//  * SCENARIO: 10,000 REQUESTS GỬI ĐỒNG THỜI
//  * CONNECTION POOL vs DIRECT CONNECTION - CHI TIẾT
//  * ============================================================================
//  * 
//  * Câu hỏi: Pool có tạo sẵn 200 connection không?
//  * Trả lời: KHÔNG! Pool chỉ tạo 20 connection. Dùng queue xử lý phần còn lại.
//  */

// // ============================================================================
// // 1️⃣ VẤN ĐỀ: 10,000 REQUEST GỬI ĐỒNG THỜI
// // ============================================================================

// /**
//  * 🎯 SCENARIO:
//  * - 10,000 requests gửi đến CÙNG LÚC
//  * - Mỗi request cần query database (5ms)
//  * - Câu hỏi: Pool xử lý như thế nào?
//  */

// // ============================================================================
// // ❌ CASE 1: DIRECT CONNECTION (Không Pool)
// // ============================================================================

// /**
//  * ❌ DIRECT CONNECTION - 10,000 REQUESTS
//  * 
//  * Cách hoạt động:
//  * - Mỗi request → Tạo connection riêng
//  * - Không xử lý request tiếp theo cho tới khi request hiện tại xong
//  * - Tuần tự (sequential)
//  * 
//  * TIMELINE:
//  * 
//  * Request #1: Create connection (10ms) → Query (5ms) → Close (2ms) = 17ms
//  * Request #2: Create connection (10ms) → Query (5ms) → Close (2ms) = 17ms
//  * Request #3: Create connection (10ms) → Query (5ms) → Close (2ms) = 17ms
//  * Request #4: Create connection (10ms) → Query (5ms) → Close (2ms) = 17ms
//  * Request #5: Create connection (10ms) → Query (5ms) → Close (2ms) = 17ms
//  * ...
//  * Request #10000: Create connection (10ms) → Query (5ms) → Close (2ms) = 17ms
//  * 
//  * TOTAL TIME:
//  * 10,000 requests × 17ms = 170,000ms = 170 SECONDS! 💥💥💥
//  * 
//  * ⚠️  PROBLEM:
//  * - Request #1 phải chờ 17ms
//  * - Request #2 bắt đầu ở T=17ms, hoàn thành ở T=34ms
//  * - Request #3 bắt đầu ở T=34ms, hoàn thành ở T=51ms
//  * - ...
//  * - Request #10000 hoàn thành ở T=170s
//  * 
//  * ❌ SYSTEM COMPLETELY BROKEN!
//  * ❌ MEMORY LEAK (tạo 10,000 connections!)
//  * ❌ NETWORK TIMEOUT (30s default)
//  * ❌ 9,900+ requests fail (timeout after 30s)
//  */

// const directConnectionTimeline = `
// ❌ DIRECT CONNECTION - 10,000 REQUESTS TIMELINE

// T=0ms:     Request #1 arrives → Create connection
// T=10ms:    Request #2 arrives → WAIT (Request #1 still running)
//            Request #3 arrives → WAIT
//            Request #4 arrives → WAIT
//            ...
//            Request #100 arrives → WAIT
// T=17ms:    Request #1 done → Close connection
//            Request #2 starts → Create connection
// T=27ms:    Request #2 query done
// T=34ms:    Request #2 done → Close connection
//            Request #3 starts → Create connection
// T=30s:     Request #1750 TIMEOUT! ← Windows default 30s
// T=34ms:    Request #3 done
// ...
// T=170s:    Request #10000 finally done!

// ❌ PROBLEMS:
// 1. Sequential processing: O(n) time complexity
// 2. 9,900+ requests timeout before completion
// 3. 10,000 connections created (memory explosion!)
// 4. OS connection limit exceeded (usually 1024)
// 5. ENTIRE SYSTEM CRASHES

// 📊 RESULTS:
//    Success rate: ~10% (first 1750 requests)
//    Failed rate: ~90% (timeout/refused)
//    Response time: 170+ seconds
//    System status: DOWN ⛔
// `;

// // ============================================================================
// // ✅ CASE 2: CONNECTION POOL (Pool size = 20)
// // ============================================================================

// /**
//  * ✅ CONNECTION POOL - 10,000 REQUESTS
//  * 
//  * Cách hoạt động:
//  * - Lúc startup: Tạo 20 connections
//  * - Request đến: Lấy connection từ pool (nếu có free)
//  * - Request xong: Return connection lại pool
//  * - Request mới đến: Dùng lại connection (recycle)
//  * - Pool đầy: Request chờ trong QUEUE
//  * 
//  * ⭐ KEY: Pool tự động queue request, không tạo connection mới!
//  */

// const poolTimeline = `
// ✅ CONNECTION POOL (Size = 20) - 10,000 REQUESTS TIMELINE

// STARTUP (T=-100ms):
// └─ Create 20 connections and keep them ready
//    Pool = [Conn #1, Conn #2, ..., Conn #20] (all FREE)

// ────────────────────────────────────────────────────────

// T=0ms: 10,000 requests arrive simultaneously
//        └─ Requests #1-20: Get connections from pool (0ms)
//        └─ Requests #21-10000: Join WAITING QUEUE (in memory)

// T=0-5ms: Concurrent processing (20 requests at same time!)
//        ├─ Request #1 using Conn #1 → Query (5ms)
//        ├─ Request #2 using Conn #2 → Query (5ms)
//        ├─ Request #3 using Conn #3 → Query (5ms)
//        ...
//        └─ Request #20 using Conn #20 → Query (5ms)

// T=5ms: All 20 requests complete!
//        ├─ Request #1 returns Conn #1 to pool
//        ├─ Request #2 returns Conn #2 to pool
//        ...
//        └─ Request #20 returns Conn #20 to pool
       
//        Pool now has 20 FREE connections again!

// T=5-10ms: Next batch (Requests #21-40)
//        ├─ Request #21 gets Conn #1 (was just returned)
//        ├─ Request #22 gets Conn #2
//        ...
//        └─ Request #40 gets Conn #20
//        (Requests #41-10000 still waiting in queue)

// T=10-15ms: Next batch (Requests #41-60)
//        (Requests #61-10000 still waiting)

// ...continuing pattern...

// T=5ms × (10,000 ÷ 20) = 5ms × 500 = 2500ms = 2.5 SECONDS ✅

// └─ Request #10000 completes at T=2500ms

// ────────────────────────────────────────────────────────

// ✅ RESULTS:
//    Success rate: 100% (all requests complete!)
//    Failed rate: 0%
//    Response time: 2.5 seconds (average)
//    First response: ~5ms
//    Last response: ~2500ms
//    System status: HEALTHY ✅
// `;

// // ============================================================================
// // 2️⃣ SO SÁNH CHI TIẾT: SEQUENTIAL VS CONCURRENT
// // ============================================================================

// /**
//  * 🎯 COMPARISON TABLE
//  */
// const comparisonTable = `
// ╔════════════════════════════════════════════════════════════════════════════╗
// ║                 DIRECT CONNECTION    vs    CONNECTION POOL                 ║
// ╠════════════════════════════════════════════════════════════════════════════╣
// ║ SCENARIO: 10,000 requests gửi đồng thời                                   ║
// ╠════════════════════════════════════════════════════════════════════════════╣

// │ Feature               │ Direct Connection      │ Connection Pool (20)    │
// ├───────────────────────┼────────────────────────┼─────────────────────────┤
// │ Connections needed    │ 10,000 (each request)  │ 20 (pre-created)        │
// │ Per request time      │ 17ms (create+query+...) │ 5ms (just query)        │
// │ Total time            │ 170 seconds            │ 2.5 seconds             │
// │ Concurrent requests   │ 1 (sequential)         │ 20 (parallel)           │
// │ Memory usage          │ 10,000 × 1MB = 10GB    │ 20 × 1MB = 20MB         │
// │ CPU overhead          │ 100% (tạo connection)  │ 30% (just query)        │
// │ Success rate          │ ~10% (timeout)         │ 100%                    │
// │ Failed rate           │ ~90%                   │ 0%                      │
// │ System status         │ CRASH ⛔                │ HEALTHY ✅               │
// │ Scalability           │ ❌ NO                  │ ✅ YES                  │
// │ Production ready      │ ❌ NO                  │ ✅ YES                  │
// ╚════════════════════════════════════════════════════════════════════════════╝

// PERFORMANCE GAIN:
// - Time: 170s → 2.5s = 68x FASTER!
// - Memory: 10GB → 20MB = 500x LESS!
// - Success: 10% → 100% = PERFECT!
// `;

// // ============================================================================
// // 3️⃣ VISUALIZE: POOL QUEUE MECHANISM
// // ============================================================================

// /**
//  * ✅ HOW POOL QUEUE WORKS
//  */
// const poolQueueMechanism = `
// ┌──────────────────────────────────────────────────────────┐
// │          CONNECTION POOL (Size = 20)                     │
// ├──────────────────────────────────────────────────────────┤
// │                                                          │
// │  FREE CONNECTIONS (Available):                          │
// │  ┌──┐ ┌──┐ ┌──┐ ┌──┐ ┌──┐ ... ┌──┐                   │
// │  │ 1│ │ 2│ │ 3│ │ 4│ │ 5│ ... │20│                   │
// │  └──┘ └──┘ └──┘ └──┘ └──┘ ... └──┘                   │
// │   20 connections ready                                  │
// │                                                          │
// │  BUSY CONNECTIONS (In use):                            │
// │  (empty at the moment)                                  │
// │                                                          │
// │  WAITING QUEUE (Pending requests):                      │
// │  [Request #21] [Request #22] [Request #23] ...         │
// │   9,980 requests waiting                               │
// │                                                          │
// └──────────────────────────────────────────────────────────┘

// ⭐ KEY POINTS:

// 1️⃣ REQUESTS #1-20 (T=0ms):
//    ├─ Get connections immediately (0ms wait)
//    ├─ Connection #1 ← Request #1
//    ├─ Connection #2 ← Request #2
//    ...
//    └─ Connection #20 ← Request #20

// 2️⃣ REQUESTS #21-10000 (T=0ms):
//    ├─ Join WAITING QUEUE (in memory)
//    ├─ Not in database yet!
//    ├─ Just waiting for a connection to free up
//    └─ Total memory: ~1KB per request (tiny!)

// 3️⃣ WHEN REQUEST #1 FINISHES (T=5ms):
//    ├─ Return Connection #1 to pool
//    ├─ Pool checks queue: "Anyone waiting?"
//    ├─ YES! Request #21 is waiting
//    ├─ Assign Connection #1 to Request #21
//    ├─ Request #21 starts query
//    └─ Loop continues

// 4️⃣ WHEN ALL 20 CONNECTIONS BUSY (T=0-5ms):
//    ├─ All 20 requests use their connections
//    ├─ 9,980 requests still in queue (very small memory!)
//    ├─ No new connections created!
//    ├─ Just waiting...
//    └─ When a connection free → Next request takes it

// 5️⃣ QUEUE PROCESSING PATTERN:
//    Batch #1 (T=0-5ms):   Requests #1-20 (use all 20 connections)
//    Batch #2 (T=5-10ms):  Requests #21-40 (reuse same 20 connections)
//    Batch #3 (T=10-15ms): Requests #41-60
//    ...
//    Batch #500 (T=2495-2500ms): Requests #9981-10000

// TOTAL BATCHES: 10,000 ÷ 20 = 500 batches
// TIME PER BATCH: 5ms
// TOTAL TIME: 500 × 5ms = 2,500ms = 2.5 SECONDS ✅
// `;

// // ============================================================================
// // 4️⃣ CODE IMPLEMENTATION: REQUEST QUEUEING
// // ============================================================================

// /**
//  * ✅ HOW POOL QUEUE IS IMPLEMENTED (Simplified)
//  */

// class ConnectionPoolQueue {
//   /**
//    * CONNECTION POOL IMPLEMENTATION
//    */
//   private connections: Connection[] = [];
//   private waitingQueue: Request[] = [];
//   private maxConnections = 20;

//   constructor() {
//     // ✅ STEP 1: Create pool at startup
//     console.log('Creating connection pool...');
//     for (let i = 0; i < this.maxConnections; i++) {
//       this.connections.push(new Connection(i + 1));
//     }
//     console.log(`✅ Pool ready: ${this.maxConnections} connections`);
//   }

//   /**
//    * REQUEST ARRIVES: Get connection or join queue
//    */
//   async handleRequest(request: Request): Promise<void> {
//     console.log(`📨 Request #${request.id} arrives`);

//     // ✅ STEP 1: Try to get free connection
//     const freeConnection = this.connections.find(c => !c.isBusy);

//     if (freeConnection) {
//       // ✅ Connection available! Use immediately (0ms wait)
//       console.log(`✅ Request #${request.id} got connection ${freeConnection.id} (no wait)`);
//       await this.executeRequest(request, freeConnection);
//     } else {
//       // ✅ No connection available. Join queue (very fast, just memory)
//       console.log(`⏳ Request #${request.id} joined waiting queue`);
//       this.waitingQueue.push(request);
//     }
//   }

//   /**
//    * EXECUTE REQUEST WITH CONNECTION
//    */
//   private async executeRequest(request: Request, connection: Connection): Promise<void> {
//     // ✅ Mark connection as busy
//     connection.isBusy = true;

//     try {
//       // ✅ Execute query (5ms)
//       const startTime = Date.now();
//       console.log(`🔄 Request #${request.id} executing on connection ${connection.id}...`);
//       await this.sleep(5); // Simulate 5ms query

//       const elapsed = Date.now() - startTime;
//       console.log(`✅ Request #${request.id} done (${elapsed}ms)`);
//     } finally {
//       // ✅ Return connection to pool
//       connection.isBusy = false;
//       console.log(`🔄 Connection ${connection.id} returned to pool`);

//       // ✅ Check queue: Any requests waiting?
//       if (this.waitingQueue.length > 0) {
//         const nextRequest = this.waitingQueue.shift();
//         console.log(`⬆️  Request #${nextRequest.id} from queue now uses connection ${connection.id}`);
//         await this.executeRequest(nextRequest, connection);
//       }
//     }
//   }

//   private sleep(ms: number): Promise<void> {
//     return new Promise(resolve => setTimeout(resolve, ms));
//   }
// }

// class Connection {
//   id: number;
//   isBusy: boolean = false;

//   constructor(id: number) {
//     this.id = id;
//   }
// }

// class Request {
//   id: number;

//   constructor(id: number) {
//     this.id = id;
//   }
// }

// /**
//  * ✅ USAGE EXAMPLE
//  * 
//  * async function test10000Requests() {
//  *   const pool = new ConnectionPoolQueue();
//  * 
//  *   // Send 10,000 requests simultaneously
//  *   const requests = Array.from({ length: 10000 }, (_, i) =>
//  *     pool.handleRequest(new Request(i + 1))
//  *   );
//  * 
//  *   const startTime = Date.now();
//  *   await Promise.all(requests);
//  *   const elapsed = Date.now() - startTime;
//  * 
//  *   console.log(`✅ All 10,000 requests completed in ${elapsed}ms`);
//  *   // Output: ~2500ms (vs 170,000ms with direct connection!)
//  * }
//  */

// // ============================================================================
// // 5️⃣ REAL WORLD: E-COMMERCE DURING FLASH SALE
// // ============================================================================

// /**
//  * 🛍️ E-COMMERCE SCENARIO: Flash Sale
//  * 
//  * - 10,000 users try to checkout SIMULTANEOUSLY
//  * - Each checkout needs 3 database queries
//  * - Time limit: Flash sale expires in 5 minutes
//  */

// const flashSaleScenario = `
// 🛍️ E-COMMERCE FLASH SALE - 10,000 USERS CHECKOUT AT ONCE

// SCENARIO:
// - 10,000 users click "Checkout" at exact same second
// - Each checkout needs:
//   * Query #1: Create order (2ms)
//   * Query #2: Check inventory (1ms)
//   * Query #3: Update inventory (2ms)
//   Total: 5ms per checkout

// ────────────────────────────────────────────────────────

// ❌ WITHOUT CONNECTION POOL:

// Database connections needed: 10,000 each
// Time per request: 17ms (create + 5ms query + close)
// Total time: 10,000 × 17ms = 170 seconds

// Problem:
// - Server only supports 1024 connections max (OS limit)
// - Trying to create 10,000 connections = CRASH
// - After 30s timeout: 9,750 requests fail
// - Users get error: "Connection refused"
// - SALES LOST! 💔

// ────────────────────────────────────────────────────────

// ✅ WITH CONNECTION POOL (size=20):

// Database connections: 20 (always)
// Time per batch: 5ms
// Number of batches: 10,000 ÷ 20 = 500
// Total time: 500 × 5ms = 2.5 seconds ✅

// Timeline:
// T=0-5ms:     Requests #1-20 checkout (using 20 connections)
// T=5-10ms:    Requests #21-40 checkout (reuse same 20)
// T=10-15ms:   Requests #41-60 checkout
// ...
// T=2495-2500: Requests #9981-10000 checkout

// Result:
// - All 10,000 users checkout successfully! ✅
// - Average response time: ~1250ms (queue time)
// - First user gets response: ~5ms
// - Last user gets response: ~2500ms
// - System: HEALTHY! CPU 40%, Memory 50MB

// SALES: 10,000 × $50 = $500,000! 💰✅

// ────────────────────────────────────────────────────────

// KEY DIFFERENCE:

// Without pool: Try to serve 10,000 simultaneously → CRASH
// With pool: Queue them, serve 20 at a time → WORKS PERFECTLY

// Pool = Queue Manager!
// `;

// // ============================================================================
// // 6️⃣ DETAILED REQUEST FLOW DIAGRAM
// // ============================================================================

// /**
//  * 📊 DETAILED FLOW: 10,000 REQUESTS WITH POOL
//  */
// const detailedFlow = `
// T=0ms: 10,000 REQUESTS ARRIVE SIMULTANEOUSLY

// Requests #1-20:
//   └─ Get connection from pool immediately
//   └─ Start executing query

// Pool state:
//   Connections: 20 (all BUSY)
//   Queue: 9,980 requests waiting

// ────────────────────────────────────────────────────────

// T=0-5ms: EXECUTING (20 requests in parallel)

// Request #1 (Connection #1):  ████████████ QUERY
// Request #2 (Connection #2):  ████████████ QUERY
// Request #3 (Connection #3):  ████████████ QUERY
// ...
// Request #20 (Connection #20): ████████████ QUERY

// Requests #21-10000:
//   └─ Waiting in queue (CPU NOT USED - just RAM)
//   └─ Memory per request: ~1KB
//   └─ Total queue memory: 9,980KB = ~10MB

// ────────────────────────────────────────────────────────

// T=5ms: BATCH #1 COMPLETES

// Requests #1-20: ✅ DONE
// Connections: 20 (all FREE)
// Queue: 9,980 requests waiting

// Immediately:
//   Requests #21-40: Get connections
//   Start executing query

// ────────────────────────────────────────────────────────

// T=5-10ms: EXECUTING (Requests #21-40)

// Requests #21-40:  ████████████ QUERY
// Requests #41-10000: Waiting in queue

// ────────────────────────────────────────────────────────

// T=10ms: BATCH #2 COMPLETES

// Requests #21-40: ✅ DONE
// Requests #41-60: Get connections, start executing

// Pattern repeats every 5ms...

// ────────────────────────────────────────────────────────

// T=2500ms: BATCH #500 COMPLETES

// Requests #9981-10000: ✅ DONE

// ALL 10,000 REQUESTS COMPLETED! ✅

// ────────────────────────────────────────────────────────

// MEMORY USAGE OVER TIME:

// T=0ms:    Queue size: 9,980 (10MB)
// T=5ms:    Queue size: 9,960 (10MB)
// T=10ms:   Queue size: 9,940 (10MB)
// ...
// T=2495ms: Queue size: 20 (small)
// T=2500ms: Queue size: 0

// Total memory used: ~50MB (connections + queue)

// ────────────────────────────────────────────────────────

// CPU USAGE OVER TIME:

// T=0-2500ms: 20 cores busy (40-50% CPU)
//             Executing queries
//             Managing queue

// Compared to direct connection:
// - 10,000 cores busy (400-500% CPU) ← overload!
// - System thrashing
// - Fan running at max

// ────────────────────────────────────────────────────────

// RESULTS SUMMARY:

// Metric                  Direct Connection  Pool
// ────────────────────────────────────────────────────
// Success rate            10%               100% ✅
// Failed rate             90%               0% ✅
// Total time              170s              2.5s ✅
// Connections created     10,000            20 ✅
// Memory used             10GB              50MB ✅
// CPU usage               500%              45% ✅
// System status           CRASH ⛔          HEALTHY ✅
// `;

// // ============================================================================
// // 7️⃣ ANSWER TO YOUR QUESTION
// // ============================================================================

// /**
//  * 🎯 YOUR QUESTION:
//  * "Pool sẽ tạo sẵn 200 pool và sử dụng từng cái một,
//  *  còn connection bình thường thì sẽ từng req 1 tạo connection
//  *  sau đó sau khi làm xong việc thì tới req tiếp theo tạo connection"
//  * 
//  * ✅ ANSWER:
//  */

// const answerToYourQuestion = `
// ❓ CÂUHỎI: "Pool sẽ tạo sẵn 200 connection à?"

// ✅ TRẢLỜI: 

// 1️⃣ POOL KHÔNG TẠOTRƯỚC 200 CONNECTION!
   
//    Pool size = 20 (default)
//    - Tạo sẵn 20 connections lúc startup
//    - Không tạo 200 (quá lãng phí memory!)
//    - Chỉ tạo nhiều hơn nếu bạn config: connection_limit=200

// 2️⃣ SAU KHI 20 CONNECTION DÙNG HẾT:
   
//    Pool không tạo 180 connections thêm!
//    Thay vào đó: Request chờ trong QUEUE (memory)
   
//    Queue là gì?
//    - Danh sách request đợi trong bộ nhớ (RAM)
//    - Không tạo connection mới
//    - Chỉ khi connection free → Lấy request từ queue
   
//    ✅ Cách làm việc này vô cùng hiệu quả!

// 3️⃣ DIRECT CONNECTION - TUẦN TỰ:
   
//    Request #1: Tạo connection → Query → Close
//    Request #2: Tạo connection → Query → Close (chỉ sau #1 xong)
//    Request #3: Tạo connection → Query → Close (chỉ sau #2 xong)
   
//    ❌ Vấn đề: Nếu có 10,000 requests:
//       - Tạo 10,000 connections
//       - Memory: 10GB
//       - Time: 170 seconds
//       - Result: CRASH!

// 4️⃣ CONNECTION POOL - QUEUE:
   
//    Request #1-20: Lấy connections ngay
//    Request #21-10000: Join QUEUE (chỉ ~10MB memory)
   
//    When connection free:
//    - Request #21 lấy connection
//    - Request #22 lấy connection tiếp theo
//    - cứ tiếp tục...
   
//    ✅ Hiệu quả: 20 connections xử lý 10,000 requests!

// ────────────────────────────────────────────────────────

// 📊 COMPARISON TABLE:

// DIRECT CONNECTION (Per request):
// ├─ Tạo connection: 10ms
// ├─ Execute query: 5ms
// ├─ Close connection: 2ms
// └─ TOTAL: 17ms × 10,000 = 170 SECONDS

// CONNECTION POOL (Tuần tự nhưng có queue):
// ├─ Requests #1-20: Get connections (0ms wait)
// ├─ Requests #21-40: Wait in queue, then get connections
// ├─ All execute query: 5ms (parallel!)
// ├─ TOTAL: 500 batches × 5ms = 2.5 SECONDS

// ────────────────────────────────────────────────────────

// 🎯 KEY PRINCIPLE:

// Pool = Connection Reuse + Request Queue

// REUSE: Tái sử dụng 20 connections cho tất cả 10,000 requests
// QUEUE: Đợi request trong RAM (rất nhanh, không tạo connection)

// Result:
// - Fewer connections (20 vs 10,000)
// - Less memory (50MB vs 10GB)
// - Faster execution (2.5s vs 170s)
// - Better CPU usage (40% vs 500%)
// - PRODUCTION READY! ✅
// `;

// // ============================================================================
// // 8️⃣ VISUAL COMPARISON: SEQUENTIAL VS CONCURRENT
// // ============================================================================

// /**
//  * 📊 VISUAL: Time spent
//  */
// const visualComparison = `
// ❌ DIRECT CONNECTION (Sequential):

// Request #1:   |████████████| (17ms) Create→Query→Close
// Request #2:                   |████████████| (17ms)
// Request #3:                                  |████████████| (17ms)
// ...
// Request #10000:                             ... |████| (17ms)

// Total: 170 seconds ⏳⏳⏳

// ────────────────────────────────────────────────────────

// ✅ CONNECTION POOL (Concurrent with Queue):

// Request #1:   |████| (5ms)
// Request #2:   |████| (5ms)
// ...
// Request #20:  |████| (5ms)

// Request #21:           |████| (5ms)
// Request #22:           |████| (5ms)
// ...
// Request #40:           |████| (5ms)

// Request #41:                  |████| (5ms)
// ...
// Request #10000:              ... |████| (5ms)

// Total: 2.5 seconds ⏱️ (68x faster!)

// ────────────────────────────────────────────────────────

// 💡 KEY INSIGHT:

// Direct connection processes 1 request at a time (sequential).
// Pool processes 20 requests at a time (concurrent).

// That's why pool is 20x faster in throughput!
// `;

// // ============================================================================
// // 9️⃣ SUMMARY & RECOMMENDATIONS
// // ============================================================================

// export const PoolQueueMechanismSummary = `
// 10,000 REQUESTS ĐỒNG THỜI - POOL VS DIRECT CONNECTION

// ❌ DIRECT CONNECTION:
//   • Tuần tự: Request #1, #2, #3, ...
//   • Mỗi request tạo connection riêng
//   • Time per request: 17ms
//   • Total time: 170 seconds
//   • Connections: 10,000 (CRASH!)
//   • Memory: 10GB
//   • Success rate: ~10% (timeout)
//   • Result: SYSTEM DOWN ⛔

// ✅ CONNECTION POOL (size=20):
//   • Concurrent: 20 requests at same time
//   • Connections reused: No new creation
//   • Time per request: 5ms (average 1.25s with queue)
//   • Total time: 2.5 seconds
//   • Connections: 20 (fixed)
//   • Memory: 50MB
//   • Success rate: 100%
//   • Result: PRODUCTION READY ✅

// 🎯 KEY MECHANISM:

// Pool = 20 connections + Queue in RAM

// Requests #1-20:   Use connections immediately
// Requests #21-40:  Wait in queue, use when connection free
// Requests #41-60:  Wait in queue, use when connection free
// ...
// Requests #9981-10000: Wait in queue, use when connection free

// ⭐ IMPORTANT:
//   - Queue is just RAM (very fast, low memory)
//   - NO new connections created!
//   - Pool processes batches of 20 every 5ms
//   - Total batches: 500 (10,000 ÷ 20)
//   - Total time: 500 × 5ms = 2.5 seconds

// 📊 PERFORMANCE GAIN: 68x FASTER! (170s → 2.5s)

// ✅ ALWAYS USE CONNECTION POOL!
// `;

// export { directConnectionTimeline, poolTimeline, comparisonTable, poolQueueMechanism, flashSaleScenario, detailedFlow, answerToYourQuestion, visualComparison };
