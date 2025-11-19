/**
 * TRANSACTION - SQL & NoSQL
 * 
 * Khái niệm, ACID, CAP, ví dụ code thực tế
 */

// ============================================================================
// 1. TRANSACTION BASICS
// ============================================================================

/**
 * TRANSACTION = Một hoặc nhiều SQL operations thực hiện như một unit
 * 
 * Ví dụ: Transfer tiền (cần 2 operations)
 * 1. UPDATE account_a SET balance = balance - 100
 * 2. UPDATE account_b SET balance = balance + 100
 * 
 * Nếu operation 1 success nhưng operation 2 fail:
 * - Tiền bị mất! (inconsistent)
 * 
 * Solution: Transaction
 * - Hoặc cả 2 success (COMMIT)
 * - Hoặc cả 2 fail (ROLLBACK)
 * - Không có state trung gian
 */

// ============================================================================
// 2. ACID PROPERTIES (SQL)
// ============================================================================

/**
 * ACID = 4 tính chất của transaction
 * 
 * ────────────────────────────────────────────────────────────────────
 * A = ATOMICITY (Tính nguyên tử)
 * ────────────────────────────────────────────────────────────────────
 * 
 * Định nghĩa:
 * - Transaction hoặc thành công hoàn toàn, hoặc thất bại hoàn toàn
 * - Không có state trung gian
 * - All or Nothing
 * 
 * Ví dụ: Transfer tiền
 * ```sql
 * BEGIN TRANSACTION;
 * 
 * UPDATE accounts SET balance = balance - 100 WHERE id = 1;
 * UPDATE accounts SET balance = balance + 100 WHERE id = 2;
 * 
 * -- Nếu lỗi: ROLLBACK (cả 2 operation được undo)
 * -- Nếu ok: COMMIT (cả 2 được lưu)
 * COMMIT;
 * ```
 * 
 * Thực hiện:
 * - Write-Ahead Logging (WAL)
 * - Lưu log trước khi commit
 * - Nếu crash: recover từ log
 */

/**
 * ────────────────────────────────────────────────────────────────────
 * C = CONSISTENCY (Tính nhất quán)
 * ────────────────────────────────────────────────────────────────────
 * 
 * Định nghĩa:
 * - Database luôn ở valid state
 * - Từ valid state → valid state
 * - Không bao giờ ở invalid state
 * 
 * Ví dụ: Total tiền phải giữ nguyên
 * 
 * Before: A=100, B=200, Total=300
 * 
 * Transfer 50:
 * - Mid: A=50, B=200, Total=250 ❌ INVALID!
 * - After: A=50, B=250, Total=300 ✓ VALID
 * 
 * Đảm bảo bằng:
 * - Foreign key constraints
 * - Check constraints
 * - NOT NULL, UNIQUE, PRIMARY KEY
 * - Triggers
 * 
 * Ví dụ:
 * ```sql
 * CREATE TABLE orders (
 *   id INT PRIMARY KEY,
 *   customer_id INT NOT NULL,
 *   total DECIMAL(10, 2) CHECK (total > 0),
 *   status VARCHAR(20),
 *   FOREIGN KEY (customer_id) REFERENCES customers(id)
 * );
 * 
 * -- Transaction sẽ fail nếu violate constraints
 * ```
 */

/**
 * ────────────────────────────────────────────────────────────────────
 * I = ISOLATION (Tính cô lập)
 * ────────────────────────────────────────────────────────────────────
 * 
 * Định nghĩa:
 * - Concurrent transactions không ảnh hưởng lẫn nhau
 * - Mỗi transaction tưởng như là alone
 * 
 * Vấn đề (Race conditions):
 * 
 * 1. DIRTY READ:
 *    T1: UPDATE balance = 100
 *    T2: READ balance (thấy 100) ← từ uncommitted change!
 *    T1: ROLLBACK (quay về 50)
 *    T2: Sử dụng 100 (sai!)
 * 
 * 2. NON-REPEATABLE READ:
 *    T1: READ balance = 100
 *    T2: UPDATE balance = 200, COMMIT
 *    T1: READ balance = 200 (khác lần đầu!)
 * 
 * 3. PHANTOM READ:
 *    T1: SELECT * FROM orders WHERE date = '2025-01-01' (5 rows)
 *    T2: INSERT new order with date = '2025-01-01', COMMIT
 *    T1: SELECT * FROM orders WHERE date = '2025-01-01' (6 rows!)
 * 
 * Isolation Levels:
 * 
 * 1. READ UNCOMMITTED (Lowest)
 *    - Dirty read: ✓ (có thể xảy ra)
 *    - Non-repeatable: ✓
 *    - Phantom: ✓
 *    - Performance: Fastest
 *    - Use: Rare (not recommended)
 * 
 * 2. READ COMMITTED (Default in most DBs)
 *    - Dirty read: ❌ (không xảy ra)
 *    - Non-repeatable: ✓
 *    - Phantom: ✓
 *    - Performance: Fast
 *    - Use: Most applications
 * 
 * 3. REPEATABLE READ
 *    - Dirty read: ❌
 *    - Non-repeatable: ❌
 *    - Phantom: ✓
 *    - Performance: Moderate
 *    - Use: MySQL default
 * 
 * 4. SERIALIZABLE (Highest)
 *    - Dirty read: ❌
 *    - Non-repeatable: ❌
 *    - Phantom: ❌
 *    - Performance: Slowest
 *    - Use: High consistency needed
 * 
 * Ví dụ:
 * ```sql
 * SET TRANSACTION ISOLATION LEVEL READ COMMITTED;
 * BEGIN;
 * SELECT balance FROM accounts WHERE id = 1;
 * -- Chỉ thấy committed values
 * COMMIT;
 * ```
 */

/**
 * ────────────────────────────────────────────────────────────────────
 * D = DURABILITY (Tính bền vững)
 * ────────────────────────────────────────────────────────────────────
 * 
 * Định nghĩa:
 * - Nếu transaction COMMIT, data sẽ lưu vĩnh viễn
 * - Ngay cả nếu có crash, power loss, etc.
 * 
 * Thực hiện:
 * - Write to disk (fsync)
 * - Không chỉ write to memory
 * - Replication (backup)
 * 
 * Trade-off:
 * - Full durability: Chậm (fsync after commit)
 * - Weak durability: Nhanh (fsync mỗi giây)
 * 
 * Ví dụ:
 * ```sql
 * COMMIT;
 * -- Data đã safe trên disk, có thể tắt server
 * ```
 */

// ============================================================================
// 3. SQL TRANSACTION - CODE EXAMPLES
// ============================================================================

/**
 * BASIC TRANSACTION
 * 
 * ```sql
 * BEGIN TRANSACTION;
 * 
 * UPDATE accounts SET balance = balance - 100 WHERE id = 1;
 * UPDATE accounts SET balance = balance + 100 WHERE id = 2;
 * 
 * COMMIT;  -- Lưu cả 2 changes
 * -- hoặc
 * ROLLBACK; -- Undo cả 2 changes
 * ```
 */

/**
 * TRANSACTION WITH ERROR HANDLING (SQL Server)
 * 
 * ```sql
 * BEGIN TRANSACTION;
 * 
 * BEGIN TRY
 *   UPDATE accounts SET balance = balance - 100 WHERE id = 1;
 *   
 *   IF @@ROWCOUNT = 0
 *     THROW 50001, 'Account not found', 1;
 *   
 *   UPDATE accounts SET balance = balance + 100 WHERE id = 2;
 *   
 *   IF @@ROWCOUNT = 0
 *     THROW 50001, 'Account not found', 1;
 *   
 *   COMMIT;
 *   PRINT 'Transaction successful';
 * END TRY
 * 
 * BEGIN CATCH
 *   ROLLBACK;
 *   PRINT 'Transaction failed: ' + ERROR_MESSAGE();
 * END CATCH;
 * ```
 */

/**
 * SAVEPOINT (Partial rollback)
 * 
 * ```sql
 * BEGIN TRANSACTION;
 * 
 * INSERT INTO orders VALUES (1, 'John', 100);
 * SAVE TRANSACTION sp1;
 * 
 * INSERT INTO orders VALUES (2, 'Jane', 200);
 * SAVE TRANSACTION sp2;
 * 
 * INSERT INTO orders VALUES (3, 'Bob', 'invalid'); -- Error!
 * 
 * -- Rollback chỉ tới sp2 (undo order 3)
 * ROLLBACK TRANSACTION sp2;
 * -- Orders 1, 2 vẫn có
 * 
 * COMMIT;
 * ```
 */

/**
 * PESSIMISTIC LOCKING (Lock trước)
 * 
 * ```sql
 * BEGIN TRANSACTION;
 * 
 * -- Lock row, không transaction khác có thể modify
 * SELECT * FROM accounts WHERE id = 1 FOR UPDATE;
 * -- Thực hiện logic
 * UPDATE accounts SET balance = balance - 100 WHERE id = 1;
 * 
 * COMMIT; -- Release lock
 * ```
 * 
 * Ưu:
 * - Đảm bảo isolation
 * - Đơn giản
 * 
 * Nhược:
 * - Deadlock risk
 * - Chậm (lock wait)
 */

/**
 * OPTIMISTIC LOCKING (Check version)
 * 
 * ```sql
 * -- Schema
 * CREATE TABLE products (
 *   id INT,
 *   name VARCHAR(100),
 *   price DECIMAL(10, 2),
 *   version INT
 * );
 * 
 * -- Transaction
 * BEGIN TRANSACTION;
 * 
 * -- Select with version
 * SELECT id, name, price, version FROM products WHERE id = 1;
 * -- version = 5
 * 
 * -- Update with version check
 * UPDATE products 
 * SET name = 'New Name', price = 99.99, version = version + 1
 * WHERE id = 1 AND version = 5;
 * 
 * -- Nếu version != 5 (changed by other T), update fail
 * -- Application retry
 * 
 * COMMIT;
 * ```
 * 
 * Ưu:
 * - Không lock (concurrent)
 * - Nhanh
 * 
 * Nhược:
 * - Conflict resolution cần logic
 */

// ============================================================================
// 4. NOSQL TRANSACTION
// ============================================================================

/**
 * ════════════════════════════════════════════════════════════════════
 * MONGODB TRANSACTION
 * ════════════════════════════════════════════════════════════════════
 * 
 * MongoDB 4.0+ hỗ trợ ACID transactions
 * Single document: Always ACID
 * Multi-document: 4.0+ (với replica set)
 */

/**
 * SINGLE DOCUMENT TRANSACTION (Default, always ACID)
 * 
 * ```javascript
 * // Update 1 document (atomic)
 * db.collection('accounts').updateOne(
 *   { id: 1 },
 *   { $set: { balance: 50 } }
 * );
 * // Hoặc success hoặc fail, không intermediate state
 * ```
 */

/**
 * MULTI-DOCUMENT TRANSACTION (4.0+)
 * 
 * ```javascript
 * const session = client.startSession();
 * 
 * try {
 *   await session.withTransaction(async () => {
 *     // Transaction 1: Debit account A
 *     const resultA = await accounts.updateOne(
 *       { _id: 1 },
 *       { $inc: { balance: -100 } },
 *       { session }
 *     );
 * 
 *     // Transaction 2: Credit account B
 *     const resultB = await accounts.updateOne(
 *       { _id: 2 },
 *       { $inc: { balance: 100 } },
 *       { session }
 *     );
 * 
 *     // Nếu lỗi: auto rollback
 *     // Nếu ok: auto commit
 *   });
 * } finally {
 *   await session.endSession();
 * }
 * ```
 * 
 * Lưu ý:
 * - Cần replica set (not single instance)
 * - Multi-document transactions có cost
 */

/**
 * ════════════════════════════════════════════════════════════════════
 * FIRESTORE TRANSACTION (Google Cloud)
 * ════════════════════════════════════════════════════════════════════
 * 
 * - Atomic (ACID)
 * - Optimistic locking built-in
 * - Automatic retry
 */

/**
 * FIRESTORE TRANSACTION CODE
 * 
 * ```javascript
 * const db = admin.firestore();
 * 
 * try {
 *   await db.runTransaction(async (transaction) => {
 *     // Read (snapshot)
 *     const accountARef = db.collection('accounts').doc('A');
 *     const accountASnap = await transaction.get(accountARef);
 *     const balanceA = accountASnap.data().balance;
 * 
 *     const accountBRef = db.collection('accounts').doc('B');
 *     const accountBSnap = await transaction.get(accountBRef);
 *     const balanceB = accountBSnap.data().balance;
 * 
 *     // Write
 *     transaction.update(accountARef, {
 *       balance: balanceA - 100
 *     });
 *     transaction.update(accountBRef, {
 *       balance: balanceB + 100
 *     });
 * 
 *     // Commit (implicit)
 *   });
 * } catch (error) {
 *   // Rollback (implicit)
 *   console.error('Transaction failed:', error);
 * }
 * ```
 */

/**
 * ════════════════════════════════════════════════════════════════════
 * DYNAMODB TRANSACTION
 * ════════════════════════════════════════════════════════════════════
 * 
 * - transactWriteItems (atomic write up to 25 items)
 * - transactGetItems (atomic read up to 25 items)
 * - Optimistic locking (version checking)
 */

/**
 * DYNAMODB TRANSACTION CODE
 * 
 * ```javascript
 * const dynamodb = new AWS.DynamoDB.DocumentClient();
 * 
 * try {
 *   await dynamodb.transactWrite({
 *     TransactItems: [
 *       {
 *         Update: {
 *           TableName: 'accounts',
 *           Key: { id: '1' },
 *           UpdateExpression: 'SET balance = balance - :amount',
 *           ExpressionAttributeValues: { ':amount': 100 }
 *         }
 *       },
 *       {
 *         Update: {
 *           TableName: 'accounts',
 *           Key: { id: '2' },
 *           UpdateExpression: 'SET balance = balance + :amount',
 *           ExpressionAttributeValues: { ':amount': 100 }
 *         }
 *       }
 *     ]
 *   }).promise();
 *   console.log('Transaction successful');
 * } catch (error) {
 *   console.error('Transaction failed:', error);
 * }
 * ```
 */

// ============================================================================
// 5. CAP THEOREM (NoSQL Trade-off)
// ============================================================================

/**
 * CAP = 3 Properties (chỉ có thể chọn 2 cái 3)
 * 
 * C = CONSISTENCY (Nhất quán)
 *   - Tất cả nodes thấy data như nhau
 *   - Không có stale data
 * 
 * A = AVAILABILITY (Sẵn sàng)
 *   - System always responding
 *   - Không timeout
 *   - Node down vẫn hoạt động
 * 
 * P = PARTITION TOLERANCE (Chịu phân chia)
 *   - Network partition có thể xảy ra
 *   - Nodes không communicate với nhau
 * 
 * ────────────────────────────────────────────────────────────────────
 * 
 * CP (Consistency + Partition)
 * - Khi network partition: Block writes (unavailable)
 * - Ví dụ: MongoDB, PostgreSQL
 * 
 * ```
 * Network partition:
 * 
 * Client A ──┐
 *            ├─ Partition 1 (Primary)
 * ...        │
 *            └─ Partition 2 (Secondary, isolated)
 * 
 * Client B ──┐
 *            └─ Cannot write to Primary
 *            └─ Reads from Secondary (stale data)
 * 
 * Solution: Wait for partition heal, reject writes
 * ```
 * 
 * ────────────────────────────────────────────────────────────────────
 * 
 * AP (Availability + Partition)
 * - Khi network partition: Allow writes (possibly inconsistent)
 * - Ví dụ: Cassandra, DynamoDB, Redis
 * 
 * ```
 * Network partition:
 * 
 * Client A ──┐
 *            ├─ Partition 1 (can write)
 * ...        │
 *            └─ Partition 2 (can also write)
 * 
 * Client B ──┐
 *            └─ Writes might diverge
 *            └─ Eventually consistent (reconcile later)
 * 
 * Solution: Accept writes, merge conflicts when partition heals
 * ```
 */

/**
 * CONSISTENCY MODELS
 * 
 * Strong Consistency (Synchronous)
 * - Mọi read thấy latest write
 * - Giống SQL transactions
 * - Slow (wait for replication)
 * 
 * Eventual Consistency (Asynchronous)
 * - Read có thể thấy stale data
 * - Eventually converge (sau vài seconds)
 * - Fast (no wait for replication)
 * 
 * Ví dụ: Cassandra
 * ```javascript
 * // Write
 * cassandra.execute(
 *   'INSERT INTO accounts (id, balance) VALUES (?, ?)',
 *   [1, 100],
 *   { consistencyLevel: 'ALL' } // Wait for all replicas
 * );
 * 
 * // Read
 * cassandra.execute(
 *   'SELECT balance FROM accounts WHERE id = ?',
 *   [1],
 *   { consistencyLevel: 'ONE' } // Read from any 1 replica (might be stale)
 * );
 * ```
 */

// ============================================================================
// 6. DISTRIBUTED TRANSACTION (2-PHASE COMMIT)
// ============================================================================

/**
 * 2-PHASE COMMIT (2PC) = Commit across multiple databases
 * 
 * Scenario:
 * - Transfer tiền từ DB1 sang DB2
 * - Cần atomic across 2 databases
 * 
 * Phase 1: PREPARE
 * ```
 * Coordinator: "Can you commit?"
 * 
 * DB1: "Yes, I've locked data and ready" (Prepare OK)
 * DB2: "Yes, I've locked data and ready" (Prepare OK)
 * 
 * If any DB says "No", abort
 * ```
 * 
 * Phase 2: COMMIT
 * ```
 * Coordinator: "Commit now!"
 * 
 * DB1: Commits ✓
 * DB2: Commits ✓
 * 
 * If any DB fails: Coordinator orders ROLLBACK
 * ```
 * 
 * Vấn đề:
 * ❌ Chậm (lock wait, multiple round-trip)
 * ❌ Blocking (resources locked long time)
 * ❌ If coordinator crash: Data in uncertain state
 * 
 * Hiếm dùng ngày nay (prefer eventual consistency)
 */

// ============================================================================
// 7. PRISMA TRANSACTION EXAMPLES
// ============================================================================

/**
 * PRISMA TRANSACTION
 * 
 * ```typescript
 * import { PrismaClient } from '@prisma/client';
 * 
 * const prisma = new PrismaClient();
 * 
 * // Sequential Transaction (mặc định)
 * try {
 *   const result = await prisma.$transaction(async (tx) => {
 *     // Debit account A
 *     const accountA = await tx.account.update({
 *       where: { id: 1 },
 *       data: { balance: { decrement: 100 } }
 *     });
 * 
 *     // Credit account B
 *     const accountB = await tx.account.update({
 *       where: { id: 2 },
 *       data: { balance: { increment: 100 } }
 *     });
 * 
 *     return { accountA, accountB };
 *   });
 * 
 *   console.log('Transfer successful:', result);
 * } catch (error) {
 *   console.error('Transfer failed:', error);
 * }
 * ```
 */

/**
 * PRISMA INTERACTIVE TRANSACTION
 * 
 * ```typescript
 * const result = await prisma.$transaction(
 *   async (tx) => {
 *     // Multiple queries in transaction
 *     const user = await tx.user.create({
 *       data: { name: 'John', email: 'john@example.com' }
 *     });
 * 
 *     const profile = await tx.profile.create({
 *       data: { userId: user.id, bio: 'Hello' }
 *     });
 * 
 *     return { user, profile };
 *   },
 *   {
 *     maxWait: 5000,    // Max wait to acquire lock
 *     timeout: 10000    // Max transaction duration
 *   }
 * );
 * ```
 */

/**
 * PRISMA BATCH TRANSACTION (Raw SQL)
 * 
 * ```typescript
 * const result = await prisma.$transaction([
 *   prisma.account.update({
 *     where: { id: 1 },
 *     data: { balance: { decrement: 100 } }
 *   }),
 *   prisma.account.update({
 *     where: { id: 2 },
 *     data: { balance: { increment: 100 } }
 *   })
 * ]);
 * 
 * console.log('Both updates done:', result);
 * ```
 */

// ============================================================================
// 8. COMPARISON TABLE
// ============================================================================

/**
 * ┌────────────┬──────────────┬───────────────┬──────────────┐
 * │ Property   │ SQL (PostgreSQL)│ MongoDB      │ Firestore    │
 * ├────────────┼──────────────┼───────────────┼──────────────┤
 * │ ACID       │ ✓ Full       │ ✓ (4.0+)     │ ✓            │
 * │ Multi-doc  │ ✓            │ ✓            │ ✓            │
 * │ Isolation  │ Levels       │ Snapshot     │ Snapshot     │
 * │ Lock type  │ Row/Table    │ Document     │ Document     │
 * │ Cost       │ CPU/Disk     │ Memory       │ Per operation│
 * │ Scale      │ Vertical     │ Horizontal   │ Horizontal   │
 * │ Eventual   │ ❌           │ Optional     │ Optional     │
 * │ Consistency│                              │              │
 * └────────────┴──────────────┴───────────────┴──────────────┘
 */

// ============================================================================
// 9. BEST PRACTICES
// ============================================================================

/**
 * 1. Keep transactions SHORT
 *    - Minimize lock time
 *    - Reduce deadlock risk
 *    
 *    ❌ Bad:
 *    ```javascript
 *    await tx.transaction(async (tx) => {
 *      const user = await tx.user.findUnique({ where: { id: 1 } });
 *      await sleep(5000); // Long operation outside TX
 *      await tx.profile.update({ ... });
 *    });
 *    ```
 *    
 *    ✓ Good:
 *    ```javascript
 *    const user = await prisma.user.findUnique({ where: { id: 1 } });
 *    await sleep(5000);
 *    await prisma.$transaction(async (tx) => {
 *      await tx.profile.update({ ... });
 *    });
 *    ```
 * 
 * 2. Avoid NESTED transactions
 *    - Some DBs don't support
 *    - Use savepoints instead
 * 
 * 3. Handle deadlocks
 *    - Retry logic
 *    - Exponential backoff
 *    
 *    ```javascript
 *    async function transferWithRetry(fromId, toId, amount, maxRetries = 3) {
 *      for (let i = 0; i < maxRetries; i++) {
 *        try {
 *          return await transfer(fromId, toId, amount);
 *        } catch (error) {
 *          if (error.code === 'DEADLOCK' && i < maxRetries - 1) {
 *            await sleep(Math.pow(2, i) * 100); // exponential backoff
 *            continue;
 *          }
 *          throw error;
 *        }
 *      }
 *    }
 *    ```
 * 
 * 4. Choose appropriate isolation level
 *    - READ COMMITTED: Default, good for most apps
 *    - SERIALIZABLE: Only if needed
 * 
 * 5. Monitor transaction performance
 *    - Log transaction duration
 *    - Alert on long-running transactions
 *    - Track deadlock frequency
 */

console.log('✓ Transaction guide created');
