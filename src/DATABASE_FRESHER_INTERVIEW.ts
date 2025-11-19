/**
 * DATABASE CONCEPTS & INTERVIEW QUESTIONS
 * Dành cho Fresher Backend Developer
 * 
 * Khái niệm cơ bản + câu hỏi phỏng vấn thực tế
 */

// ============================================================================
// 1. DATABASE BASICS
// ============================================================================

/**
 * DATABASE = Tập hợp dữ liệu được tổ chức
 * 
 * 2 loại chính:
 * 1. SQL (Relational): PostgreSQL, MySQL, SQL Server
 * 2. NoSQL (Non-relational): MongoDB, Redis, DynamoDB
 */

/**
 * RELATIONAL CONCEPTS
 * 
 * Table (Bảng):
 * - Chứa dữ liệu theo hàng (rows) và cột (columns)
 * 
 * users table:
 * ┌────┬────────┬──────────────────────┐
 * │ id │ name   │ email                │
 * ├────┼────────┼──────────────────────┤
 * │ 1  │ John   │ john@example.com     │
 * │ 2  │ Jane   │ jane@example.com     │
 * └────┴────────┴──────────────────────┘
 * 
 * Schema:
 * - Cấu trúc của table (columns, types, constraints)
 * 
 * ```sql
 * CREATE TABLE users (
 *   id INT PRIMARY KEY AUTO_INCREMENT,
 *   name VARCHAR(100) NOT NULL,
 *   email VARCHAR(100) UNIQUE,
 *   created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
 * );
 * ```
 * 
 * Primary Key:
 * - Định danh duy nhất cho mỗi row
 * - Không thể NULL, phải UNIQUE
 * 
 * Foreign Key:
 * - Reference tới primary key của table khác
 * - Đảm bảo referential integrity
 * 
 * ```sql
 * CREATE TABLE orders (
 *   id INT PRIMARY KEY,
 *   user_id INT NOT NULL,
 *   total DECIMAL(10, 2),
 *   FOREIGN KEY (user_id) REFERENCES users(id)
 * );
 * ```
 * 
 * Index:
 * - Tải nhanh hóa tìm kiếm
 * - Trade-off: Tìm kiếm nhanh, nhưng insert/update chậm
 * 
 * ```sql
 * CREATE INDEX idx_email ON users(email);
 * -- Tìm kiếm theo email nhanh hơn
 * ```
 * 
 * Normal Forms (Normalization):
 * 1NF: Mỗi column có atomic value (không nested)
 * 2NF: 1NF + Non-key columns depend trên toàn bộ primary key
 * 3NF: 2NF + Non-key columns không depend trên non-key columns
 * 
 * Denormalization:
 * - Break normalization để tối ưu hóa read performance
 * - Tradeoff: Dễ query, nhưng cần sync data
 */

// ============================================================================
// 2. KHÁI NIỆM CỐT LÕI
// ============================================================================

/**
 * ════════════════════════════════════════════════════════════════════
 * 1. NORMALIZATION (Chuẩn hóa dữ liệu)
 * ════════════════════════════════════════════════════════════════════
 * 
 * Q: "Chuẩn hóa database có ý nghĩa gì?"
 * 
 * A: "Chuẩn hóa là quá trình tổ chức dữ liệu để:
 *    1. Giảm dư thừa (redundancy)
 *    2. Cải thiện data integrity
 *    3. Tối ưu hóa không gian lưu trữ
 * 
 * Ví dụ (bad - không chuẩn):
 * students table:
 * ┌─────┬──────┬──────────────────────┐
 * │ id  │ name │ subjects (nested)    │
 * ├─────┼──────┼──────────────────────┤
 * │ 1   │ John │ Math, Physics, Chem  │
 * └─────┴──────┴──────────────────────┘
 * 
 * Vấn đề: Khó query, khó update
 * 
 * Ví dụ (good - chuẩn hóa):
 * students table:
 * ┌─────┬──────┐
 * │ id  │ name │
 * ├─────┼──────┤
 * │ 1   │ John │
 * └─────┴──────┘
 * 
 * enrollments table:
 * ┌──────────────┬────────┐
 * │ student_id   │ subject│
 * ├──────────────┼────────┤
 * │ 1            │ Math   │
 * │ 1            │ Physics│
 * │ 1            │ Chem   │
 * └──────────────┴────────┘
 * 
 * Ưu: Dễ query, dễ update, không dư thừa"
 */

/**
 * ════════════════════════════════════════════════════════════════════
 * 2. JOIN OPERATIONS
 * ════════════════════════════════════════════════════════════════════
 * 
 * Q: "Giải thích các loại JOIN?"
 * 
 * A: "JOIN dùng để kết hợp data từ nhiều tables.
 * 
 * 1. INNER JOIN (giao)
 *    - Chỉ lấy rows có match ở cả 2 tables
 *    
 *    users:           orders:
 *    1 John           1 (matched)
 *    2 Jane     →     2 (matched)
 *    3 Bob            (no order)
 *    
 *    Result: John, Jane (not Bob)
 * 
 * 2. LEFT JOIN (tất cả từ left table)
 *    - Tất cả rows từ left table
 *    - Match từ right table (NULL nếu không match)
 *    
 *    users:           orders:
 *    1 John           1 (matched)
 *    2 Jane     →     2 (matched)
 *    3 Bob            NULL (no order)
 *    
 *    Result: John, Jane, Bob (Bob có NULL order)
 * 
 * 3. RIGHT JOIN (tất cả từ right table)
 *    - Tất cả rows từ right table
 * 
 * 4. FULL OUTER JOIN
 *    - Tất cả từ cả 2 tables
 *    - NULL nếu không match
 * 
 * Ví dụ code:
 * ```sql
 * SELECT users.name, orders.id
 * FROM users
 * INNER JOIN orders ON users.id = orders.user_id;
 * ```"
 */

/**
 * ════════════════════════════════════════════════════════════════════
 * 3. INDEXES
 * ════════════════════════════════════════════════════════════════════
 * 
 * Q: "Index là gì? Tại sao cần index?"
 * 
 * A: "Index là cấu trúc dữ liệu (thường B-tree) giúp tìm kiếm nhanh.
 * 
 * Không có index:
 * - Database scan tất cả rows (O(n))
 * - SELECT WHERE email = 'john@example.com' → scan 1M rows → 100ms
 * 
 * Có index:
 * - Database dùng index để tìm nhanh (O(log n))
 * - SELECT WHERE email = 'john@example.com' → jump to row → 1ms
 * - 100x nhanh hơn!
 * 
 * Trade-off:
 * ✓ SELECT query nhanh
 * ❌ INSERT/UPDATE chậm (phải update index)
 * ❌ Dùng thêm memory
 * 
 * Khi nào dùng index:
 * - Columns thường xuyên dùng trong WHERE, JOIN, ORDER BY
 * - Cột có high cardinality (many unique values)
 * 
 * Khi nào KHÔNG dùng:
 * - Cột có low cardinality (few unique values, ví dụ: gender)
 * - Table nhỏ
 * - Cột thường xuyên UPDATE
 * 
 * Ví dụ:
 * ```sql
 * CREATE INDEX idx_email ON users(email);
 * CREATE INDEX idx_created_at ON orders(created_at);
 * CREATE COMPOSITE INDEX idx_user_date ON orders(user_id, created_at);
 * ```"
 */

/**
 * ════════════════════════════════════════════════════════════════════
 * 4. QUERY OPTIMIZATION
 * ════════════════════════════════════════════════════════════════════
 * 
 * Q: "Làm sao tối ưu hóa slow query?"
 * 
 * A: "1. Dùng EXPLAIN để phân tích
 * 
 * ```sql
 * EXPLAIN SELECT * FROM orders WHERE user_id = 1;
 * -- Xem execution plan, có dùng index không, scan bao nhiêu rows
 * ```
 * 
 * 2. Thêm index
 * ```sql
 * CREATE INDEX idx_user_id ON orders(user_id);
 * ```
 * 
 * 3. Optimize WHERE clause
 * ❌ Bad: SELECT * WHERE YEAR(created_at) = 2025
 *        (function on column, can't use index)
 * ✓ Good: SELECT * WHERE created_at >= '2025-01-01' AND created_at < '2026-01-01'
 *         (range query, can use index)
 * 
 * 4. Select only needed columns
 * ❌ Bad: SELECT * FROM users (50 columns)
 * ✓ Good: SELECT id, name FROM users (2 columns)
 *         (less data to transfer)
 * 
 * 5. Use JOIN instead of multiple queries
 * ❌ Bad:
 *   FOR EACH user:
 *     SELECT * FROM orders WHERE user_id = user.id (N queries)
 * ✓ Good:
 *   SELECT * FROM users
 *   JOIN orders ON users.id = orders.user_id (1 query)
 * 
 * 6. Pagination
 * ❌ Bad: SELECT * FROM users LIMIT 1000000, 20
 *        (skip 1M rows, slow)
 * ✓ Good: SELECT * FROM users WHERE id > last_id LIMIT 20
 *        (use keyset pagination, fast)"
 */

/**
 * ════════════════════════════════════════════════════════════════════
 * 5. N+1 PROBLEM
 * ════════════════════════════════════════════════════════════════════
 * 
 * Q: "N+1 problem là gì? Làm sao tránh?"
 * 
 * A: "N+1 = 1 query to get N items + N queries to get related data
 * 
 * Ví dụ (N+1 problem):
 * ```typescript
 * const users = await db.query('SELECT * FROM users'); // 1 query
 * 
 * for (const user of users) {
 *   const orders = await db.query(
 *     'SELECT * FROM orders WHERE user_id = ?',
 *     [user.id]
 *   ); // N queries (1 per user)
 *   user.orders = orders;
 * }
 * // Total: 1 + N queries (N=1000 → 1001 queries!)
 * ```
 * 
 * Giải pháp 1: JOIN
 * ```sql
 * SELECT users.*, orders.*
 * FROM users
 * LEFT JOIN orders ON users.id = orders.user_id;
 * // 1 query (fast!)
 * ```
 * 
 * Giải pháp 2: IN clause
 * ```typescript
 * const users = await db.query('SELECT * FROM users');
 * const userIds = users.map(u => u.id);
 * const ordersByUser = await db.query(
 *   'SELECT * FROM orders WHERE user_id IN (?)',
 *   [userIds]
 * );
 * // 2 queries (fast!)
 * ```
 * 
 * Giải pháp 3: DataLoader (batch + cache)
 * ```typescript
 * const batchGetOrders = async (userIds) => {
 *   return await db.query(
 *     'SELECT * FROM orders WHERE user_id IN (?)',
 *     [userIds]
 *   );
 * };
 * const loader = new DataLoader(batchGetOrders);
 * // Multiple requests are batched into 1 query
 * ```"
 */

/**
 * ════════════════════════════════════════════════════════════════════
 * 6. DEADLOCK
 * ════════════════════════════════════════════════════════════════════
 * 
 * Q: "Deadlock là gì? Làm sao xảy ra?"
 * 
 * A: "Deadlock = 2+ transactions lock resources của nhau, chờ forever
 * 
 * Ví dụ:
 * Thread 1:
 *   BEGIN;
 *   UPDATE accounts SET balance = 100 WHERE id = 1;
 *   (Lock account 1)
 *   SLEEP(5s);
 *   UPDATE accounts SET balance = 200 WHERE id = 2;
 *   (Wait for lock on account 2)
 * 
 * Thread 2:
 *   BEGIN;
 *   UPDATE accounts SET balance = 300 WHERE id = 2;
 *   (Lock account 2)
 *   UPDATE accounts SET balance = 400 WHERE id = 1;
 *   (Wait for lock on account 1)
 * 
 * Result: Both threads wait forever! DEADLOCK!
 * 
 * Tránh deadlock:
 * 1. Acquire locks trong same order
 *    ✓ Always lock account 1, then account 2
 * 
 * 2. Keep transactions short
 *    ❌ Long transaction = long lock = high deadlock risk
 * 
 * 3. Use lower isolation level
 *    - READ COMMITTED (default) vs SERIALIZABLE
 * 
 * 4. Handle deadlock with retry
 *    ```typescript
 *    for (let i = 0; i < 3; i++) {
 *      try {
 *        await transferMoney(...);
 *        break;
 *      } catch (error) {
 *        if (error.code === 'DEADLOCK' && i < 2) {
 *          await sleep(100 * Math.pow(2, i)); // exponential backoff
 *        } else {
 *          throw error;
 *        }
 *      }
 *    }
 *    ```"
 */

/**
 * ════════════════════════════════════════════════════════════════════
 * 7. CONNECTION POOLING
 * ════════════════════════════════════════════════════════════════════
 * 
 * Q: "Connection pool là gì? Tại sao cần?"
 * 
 * A: "Connection pool = Reuse database connections
 * 
 * Không có pool:
 * Request 1: Create connection (100ms) → Query (10ms) → Close
 * Request 2: Create connection (100ms) → Query (10ms) → Close
 * Request 3: Create connection (100ms) → Query (10ms) → Close
 * Total: 330ms (overhead!)
 * 
 * Với pool:
 * Init: Create 10 connections pool (200ms once)
 * Request 1: Get conn from pool (1ms) → Query (10ms) → Return to pool
 * Request 2: Get conn from pool (1ms) → Query (10ms) → Return to pool
 * Request 3: Get conn from pool (1ms) → Query (10ms) → Return to pool
 * Total: 203ms (faster!)
 * 
 * Config:
 * - Min connections: 5 (always open)
 * - Max connections: 20 (max concurrent)
 * - Idle timeout: 30s (close unused connections)
 * 
 * Ví dụ (Prisma):
 * DATABASE_URL=postgresql://user:pass@localhost/db?connection_limit=20
 * 
 * Ví dụ (Node-postgres):
 * const pool = new Pool({
 *   max: 20,
 *   idleTimeoutMillis: 30000
 * });"
 */

/**
 * ════════════════════════════════════════════════════════════════════
 * 8. SHARDING
 * ════════════════════════════════════════════════════════════════════
 * 
 * Q: "Sharding là gì? Khi nào dùng?"
 * 
 * A: "Sharding = Split data across multiple databases
 * 
 * Problem: Single database not enough for 1 billion users
 * - Query slow
 * - Storage full
 * - CPU maxed
 * 
 * Solution: Shard by user_id
 * 
 * User ID 1-1M   → Shard 1 (Database 1)
 * User ID 1M-2M  → Shard 2 (Database 2)
 * User ID 2M-3M  → Shard 3 (Database 3)
 * 
 * Routing:
 * shard_id = user_id % num_shards
 * For user_id = 100:
 *   shard_id = 100 % 3 = 1 → Query Shard 1
 * 
 * Ưu:
 * ✓ Scale horizontally
 * ✓ Each shard is smaller, faster
 * ✓ Distribute load
 * 
 * Nhược:
 * ❌ Complex (routing, rebalancing)
 * ❌ Cross-shard queries slow
 * ❌ Transactions harder
 * 
 * Khi dùng:
 * - Dữ liệu rất lớn (>100GB)
 * - Need horizontal scale"
 */

// ============================================================================
// 3. INTERVIEW QUESTIONS & ANSWERS
// ============================================================================

/**
 * ════════════════════════════════════════════════════════════════════
 * Q1: Câu hỏi về ACID
 * ════════════════════════════════════════════════════════════════════
 * 
 * Q: "ACID trong transaction là gì?"
 * 
 * A: "ACID = 4 properties:
 * 
 * A (Atomicity): All or nothing
 * C (Consistency): Valid state to valid state
 * I (Isolation): Concurrent independence
 * D (Durability): Permanent on disk
 * 
 * Ví dụ transfer money:
 * BEGIN;
 * UPDATE accounts SET balance = balance - 100 WHERE id = 1; (A: Start)
 * UPDATE accounts SET balance = balance + 100 WHERE id = 2; (A: Complete)
 * COMMIT; (C: Total money same, I: Other TX don't interfere, D: Saved to disk)
 * 
 * Nếu lỗi: ROLLBACK (undo all changes)"
 */

/**
 * ════════════════════════════════════════════════════════════════════
 * Q2: Câu hỏi về INDEX
 * ════════════════════════════════════════════════════════════════════
 * 
 * Q: "Khi nào nên dùng index?"
 * 
 * A: "Dùng index khi:
 * 1. Column thường dùng WHERE
 * 2. Column thường dùng JOIN
 * 3. Column thường dùng ORDER BY, GROUP BY
 * 4. Column có high cardinality (many unique values)
 * 
 * Ví dụ:
 * ✓ CREATE INDEX idx_email ON users(email);
 *   (high cardinality, often WHERE email = ...)
 * 
 * ✗ CREATE INDEX idx_gender ON users(gender);
 *   (low cardinality, only M/F, index not useful)
 * 
 * ✗ CREATE INDEX idx_last_login ON users(last_login);
 *   (if rarely updated, maybe use cache instead)"
 */

/**
 * ════════════════════════════════════════════════════════════════════
 * Q3: Câu hỏi về QUERY OPTIMIZATION
 * ════════════════════════════════════════════════════════════════════
 * 
 * Q: "Tối ưu hóa query này:"
 * SELECT users.name, COUNT(orders.id) as order_count
 * FROM users
 * LEFT JOIN orders ON users.id = orders.user_id
 * WHERE YEAR(orders.created_at) = 2025
 * GROUP BY users.id;
 * 
 * A: "Problems:
 * 1. YEAR(orders.created_at) - function on column, can't use index
 * 2. SELECT * users.name, orders.* - unnecessary columns
 * 3. LEFT JOIN - redundant (WHERE filters it to INNER JOIN)
 * 
 * Optimized:
 * SELECT users.name, COUNT(orders.id) as order_count
 * FROM users
 * INNER JOIN orders ON users.id = orders.user_id
 * WHERE orders.created_at >= '2025-01-01'
 *   AND orders.created_at < '2026-01-01'
 * GROUP BY users.id;
 * 
 * + CREATE INDEX idx_user_created ON orders(user_id, created_at);"
 */

/**
 * ════════════════════════════════════════════════════════════════════
 * Q4: Câu hỏi về N+1 PROBLEM
 * ════════════════════════════════════════════════════════════════════
 * 
 * Q: "Có vấn đề gì với code này?"
 * const users = await User.find();
 * for (const user of users) {
 *   user.orders = await Order.find({ user_id: user.id });
 * }
 * 
 * A: "N+1 problem:
 * - 1 query to find users
 * - N queries to find orders (1 per user)
 * - Total: 1 + N queries (1000 users → 1001 queries!)
 * 
 * Solution 1 (JOIN):
 * const data = await User.find()
 *   .populate('orders'); // JOIN + fetch
 * 
 * Solution 2 (Batch):
 * const users = await User.find();
 * const userIds = users.map(u => u.id);
 * const ordersByUser = await Order.find({ user_id: { $in: userIds } });
 * 
 * Solution 3 (SQL JOIN):
 * SELECT users.*, orders.*
 * FROM users
 * LEFT JOIN orders ON users.id = orders.user_id;"
 */

/**
 * ════════════════════════════════════════════════════════════════════
 * Q5: Câu hỏi về TRANSACTION vs NO TRANSACTION
 * ════════════════════════════════════════════════════════════════════
 * 
 * Q: "Tại sao cần transaction ở đây?"
 * // Transfer 100 từ account A sang B
 * UPDATE accounts SET balance = balance - 100 WHERE id = 1;
 * UPDATE accounts SET balance = balance + 100 WHERE id = 2;
 * 
 * A: "Nếu không transaction:
 * 
 * Scenario: After query 1, server crash
 * - A lose 100 (balance - 100)
 * - B don't receive 100
 * - Money disappear!
 * 
 * Với transaction:
 * BEGIN;
 * UPDATE accounts SET balance = balance - 100 WHERE id = 1;
 * UPDATE accounts SET balance = balance + 100 WHERE id = 2;
 * COMMIT; -- All or nothing
 * 
 * Nếu crash before COMMIT:
 * - ROLLBACK automatically
 * - A và B unchanged, money safe"
 */

/**
 * ════════════════════════════════════════════════════════════════════
 * Q6: Câu hỏi về NORMALIZATION
 * ════════════════════════════════════════════════════════════════════
 * 
 * Q: "Thiết kế schema cho: Customer, Order, Product"
 * 
 * A: "Good schema (normalized):
 * 
 * customers table:
 * ┌────┬──────┬──────────────────────┐
 * │ id │ name │ email                │
 * ├────┼──────┼──────────────────────┤
 * │ 1  │ John │ john@example.com     │
 * └────┴──────┴──────────────────────┘
 * 
 * orders table:
 * ┌────┬───────────┬─────────┐
 * │ id │ customer_id│ total  │
 * ├────┼───────────┼─────────┤
 * │ 1  │ 1         │ 250    │
 * └────┴───────────┴─────────┘
 * 
 * order_items table:
 * ┌────┬──────────┬────────────┬──────┐
 * │ id │ order_id │ product_id │ qty  │
 * ├────┼──────────┼────────────┼──────┤
 * │ 1  │ 1        │ 1          │ 2    │
 * └────┴──────────┴────────────┴──────┘
 * 
 * products table:
 * ┌────┬─────┬────────┐
 * │ id │ name│ price  │
 * ├────┼─────┼────────┤
 * │ 1  │ Laptop│ 1000 │
 * └────┴─────┴────────┘
 * 
 * Why not denormalize (bad):
 * orders table (denormalized):
 * ┌────┬──────┬────────────────────────────┐
 * │ id │ customer_name │ products         │
 * ├────┼──────┬────────────────────────────┤
 * │ 1  │ John │ Laptop (2x), Phone (1x)  │
 * └────┴──────┴────────────────────────────┘
 * 
 * Problems:
 * - Hard to query (need string parsing)
 * - Duplicate customer name
 * - Hard to update price
 * - Hard to add/remove items"
 */

/**
 * ════════════════════════════════════════════════════════════════════
 * Q7: Câu hỏi về SQL vs NoSQL
 * ════════════════════════════════════════════════════════════════════
 * 
 * Q: "Khi nào dùng SQL, khi nào dùng NoSQL?"
 * 
 * A: "SQL (PostgreSQL, MySQL):
 * ✓ Structured data
 * ✓ Complex queries (JOIN, aggregate)
 * ✓ ACID transactions
 * ✓ Relationships important
 * ✗ Horizontal scale hard
 * ✗ Fixed schema
 * 
 * Ví dụ: Banking, E-commerce, CRM
 * 
 * NoSQL (MongoDB, Redis, DynamoDB):
 * ✓ Flexible schema
 * ✓ Horizontal scale easy
 * ✓ Fast read/write
 * ✓ Unstructured data
 * ✗ Weak transactions
 * ✗ Complex queries hard
 * ✗ Eventual consistency
 * 
 * Ví dụ: Cache, Analytics, User profiles, Logs"
 */

// ============================================================================
// 4. COMMON DATABASE PATTERNS
// ============================================================================

/**
 * PAGINATION
 * 
 * ❌ Offset pagination (slow for large offsets):
 * ```sql
 * SELECT * FROM users LIMIT 20 OFFSET 1000000;
 * -- Skips 1M rows, slow!
 * ```
 * 
 * ✓ Keyset pagination (fast):
 * ```sql
 * SELECT * FROM users WHERE id > last_id ORDER BY id LIMIT 20;
 * -- Jump directly to last_id, fast!
 * ```
 */

/**
 * SOFT DELETE
 * 
 * Instead of DELETE, use flag:
 * ```sql
 * ALTER TABLE users ADD COLUMN deleted_at TIMESTAMP NULL;
 * 
 * -- Instead of DELETE
 * UPDATE users SET deleted_at = NOW() WHERE id = 1;
 * 
 * -- Instead of SELECT
 * SELECT * FROM users WHERE deleted_at IS NULL;
 * ```
 * 
 * Ưu: Khôi phục dữ liệu, audit trail
 * Nhược: Cần filter deleted_at mọi query
 */

/**
 * AUDIT LOG
 * 
 * Track changes:
 * ```sql
 * CREATE TABLE user_audit_logs (
 *   id INT PRIMARY KEY,
 *   user_id INT,
 *   action VARCHAR(10), -- INSERT, UPDATE, DELETE
 *   old_values JSON,
 *   new_values JSON,
 *   changed_at TIMESTAMP
 * );
 * 
 * -- Trigger on INSERT/UPDATE/DELETE
 * CREATE TRIGGER user_audit AFTER UPDATE ON users
 * FOR EACH ROW
 * INSERT INTO user_audit_logs (user_id, action, old_values, new_values)
 * VALUES (OLD.id, 'UPDATE', JSON_OBJECT(...), JSON_OBJECT(...));
 * ```
 */

/**
 * DENORMALIZATION FOR PERFORMANCE
 * 
 * Instead of complex JOINs, store computed values:
 * ```sql
 * -- Without denormalization (JOIN heavy):
 * SELECT users.name, COUNT(orders.id) as order_count
 * FROM users
 * LEFT JOIN orders ON users.id = orders.user_id
 * GROUP BY users.id;
 * -- Expensive!
 * 
 * -- With denormalization:
 * ALTER TABLE users ADD COLUMN order_count INT DEFAULT 0;
 * 
 * -- Update on INSERT order
 * UPDATE users SET order_count = order_count + 1
 * WHERE id = new_order.user_id;
 * 
 * -- Now SELECT is fast
 * SELECT name, order_count FROM users;
 * ```
 */

// ============================================================================
// 5. CHEAT SHEET - COMMON OPERATIONS
// ============================================================================

/**
 * SELECT
 * ```sql
 * SELECT id, name FROM users WHERE age > 18 ORDER BY name LIMIT 10;
 * ```
 * 
 * INSERT
 * ```sql
 * INSERT INTO users (name, email) VALUES ('John', 'john@example.com');
 * ```
 * 
 * UPDATE
 * ```sql
 * UPDATE users SET email = 'new@example.com' WHERE id = 1;
 * ```
 * 
 * DELETE
 * ```sql
 * DELETE FROM users WHERE id = 1;
 * ```
 * 
 * JOIN
 * ```sql
 * SELECT users.name, orders.id
 * FROM users
 * INNER JOIN orders ON users.id = orders.user_id;
 * ```
 * 
 * GROUP BY
 * ```sql
 * SELECT user_id, COUNT(*) as order_count
 * FROM orders
 * GROUP BY user_id;
 * ```
 * 
 * Aggregate functions:
 * COUNT, SUM, AVG, MIN, MAX
 * ```sql
 * SELECT COUNT(*), SUM(total), AVG(total)
 * FROM orders;
 * ```
 * 
 * UNION
 * ```sql
 * SELECT name FROM users
 * UNION
 * SELECT name FROM customers;
 * ```
 * 
 * Subquery
 * ```sql
 * SELECT * FROM orders
 * WHERE user_id IN (
 *   SELECT id FROM users WHERE country = 'US'
 * );
 * ```
 * 
 * Case statement
 * ```sql
 * SELECT name,
 *   CASE
 *     WHEN age < 18 THEN 'Minor'
 *     WHEN age < 65 THEN 'Adult'
 *     ELSE 'Senior'
 *   END as age_group
 * FROM users;
 * ```
 */

console.log('✓ Database concepts & interview guide created');
