/**
 * ============================================================================
 * SQL THUẦN vs ORM - DETAILED COMPARISON
 * ============================================================================
 * 
 * So sánh từng câu SQL cụ thể với ORM (Prisma) tương đương.
 */

// ============================================================================
// 1️⃣ CREATE (Tạo bản ghi mới)
// ============================================================================

/**
 * ❌ SQL THUẦN:
 * 
 * INSERT INTO users (name, email, age)
 * VALUES ('Alice', 'alice@example.com', 25);
 * 
 * const result = await connection.execute(
 *   'INSERT INTO users (name, email, age) VALUES (?, ?, ?)',
 *   ['Alice', 'alice@example.com', 25]
 * );
 * 
 * return {
 *   id: result[0].insertId,
 *   name: 'Alice',
 *   email: 'alice@example.com',
 *   age: 25
 * };
 * 
 * ❌ PROBLEMS:
 * - No type safety (return type is any)
 * - Manual mapping to User object
 * - Error handling needed
 * - Connection management needed
 */

/**
 * ✅ ORM (PRISMA):
 * 
 * const user = await prisma.user.create({
 *   data: {
 *     name: 'Alice',
 *     email: 'alice@example.com',
 *     age: 25,
 *   },
 * });
 * 
 * // ✅ user is User type (auto-generated)
 * // ✅ return: { id: number, name: string, email: string, age: number }
 * 
 * ✅ BENEFITS:
 * - Type-safe (User type)
 * - Auto mapping (Prisma handles it)
 * - Error handling built-in
 * - Connection managed automatically
 */

// ============================================================================
// 2️⃣ READ ONE (Lấy 1 bản ghi)
// ============================================================================

/**
 * ❌ SQL THUẦN:
 * 
 * SELECT * FROM users WHERE id = 1;
 * 
 * const [rows] = await connection.execute(
 *   'SELECT * FROM users WHERE id = ?',
 *   [1]
 * );
 * 
 * if (rows.length === 0) return null;
 * 
 * return rows[0]; // ❌ any type
 * 
 * ❌ PROBLEMS:
 * - No type safety
 * - Manual null check
 * - No compile-time validation
 */

/**
 * ✅ ORM (PRISMA):
 * 
 * const user = await prisma.user.findUnique({
 *   where: { id: 1 },
 * });
 * 
 * // ✅ user: User | null (auto-generated)
 * // ✅ Prisma handles null check automatically
 * 
 * ✅ BENEFITS:
 * - Type-safe (User | null)
 * - Null handling automatic
 * - Compiler validates where clause
 */

// ============================================================================
// 3️⃣ READ MANY (Lấy nhiều bản ghi)
// ============================================================================

/**
 * ❌ SQL THUẦN:
 * 
 * SELECT * FROM users;
 * 
 * const [rows] = await connection.execute(
 *   'SELECT * FROM users'
 * );
 * 
 * return rows; // ❌ any[]
 * 
 * ❌ PROBLEMS:
 * - No type safety
 * - No pagination built-in
 * - No filtering
 */

/**
 * ✅ ORM (PRISMA):
 * 
 * const users = await prisma.user.findMany();
 * 
 * // ✅ users: User[] (auto-generated)
 * 
 * ✅ BENEFITS:
 * - Type-safe (User[])
 * - Easy pagination, filtering
 */

// ============================================================================
// 4️⃣ READ WITH FILTER (Lọc dữ liệu)
// ============================================================================

/**
 * ❌ SQL THUẦN:
 * 
 * SELECT * FROM users WHERE age > 18 AND city = 'New York';
 * 
 * const [rows] = await connection.execute(
 *   'SELECT * FROM users WHERE age > ? AND city = ?',
 *   [18, 'New York']
 * );
 * 
 * return rows; // ❌ any[]
 * 
 * ❌ PROBLEMS:
 * - String-based WHERE clause
 * - Easy to make typos
 * - No compile-time validation
 * - Hard to refactor
 */

/**
 * ✅ ORM (PRISMA):
 * 
 * const users = await prisma.user.findMany({
 *   where: {
 *     age: { gt: 18 },      // gt = greater than
 *     city: 'New York',
 *   },
 * });
 * 
 * // ✅ users: User[]
 * // ✅ Type-safe where clause
 * // ✅ Compiler validates operators
 * 
 * ✅ BENEFITS:
 * - Type-safe filtering
 * - Operator validation (gt, lt, contains, etc.)
 * - IDE autocomplete
 * - Easy to refactor
 */

// ============================================================================
// 5️⃣ READ WITH SORTING (Sắp xếp)
// ============================================================================

/**
 * ❌ SQL THUẦN:
 * 
 * SELECT * FROM users ORDER BY age DESC LIMIT 10;
 * 
 * const [rows] = await connection.execute(
 *   'SELECT * FROM users ORDER BY age DESC LIMIT 10'
 * );
 * 
 * return rows; // ❌ any[]
 * 
 * ❌ PROBLEMS:
 * - Hard-coded column name
 * - Hard to build dynamic sorting
 */

/**
 * ✅ ORM (PRISMA):
 * 
 * const users = await prisma.user.findMany({
 *   orderBy: { age: 'desc' },
 *   take: 10,
 * });
 * 
 * // ✅ users: User[]
 * // ✅ Type-safe orderBy
 * // ✅ Easy to build dynamic sorting
 * 
 * // Dynamic sorting
 * const sortBy = req.query.sortBy || 'age';
 * const sortOrder = req.query.order || 'asc';
 * 
 * const users = await prisma.user.findMany({
 *   orderBy: { [sortBy]: sortOrder }, // ✅ Type-safe dynamic sort
 * });
 */

// ============================================================================
// 6️⃣ READ WITH PAGINATION (Phân trang)
// ============================================================================

/**
 * ❌ SQL THUẦN:
 * 
 * SELECT * FROM users LIMIT 10 OFFSET 20;
 * 
 * const page = 3;
 * const pageSize = 10;
 * const offset = (page - 1) * pageSize;
 * 
 * const [rows] = await connection.execute(
 *   `SELECT * FROM users LIMIT ? OFFSET ?`,
 *   [pageSize, offset]
 * );
 * 
 * return rows; // ❌ any[]
 * 
 * ❌ PROBLEMS:
 * - Manual offset calculation
 * - Easy to make mistakes
 */

/**
 * ✅ ORM (PRISMA):
 * 
 * const page = 3;
 * const pageSize = 10;
 * 
 * const users = await prisma.user.findMany({
 *   skip: (page - 1) * pageSize,
 *   take: pageSize,
 * });
 * 
 * // ✅ users: User[]
 * // ✅ Clearer intent
 * 
 * // Also get total count for pagination
 * const [users, total] = await Promise.all([
 *   prisma.user.findMany({
 *     skip: (page - 1) * pageSize,
 *     take: pageSize,
 *   }),
 *   prisma.user.count(),
 * ]);
 * 
 * return {
 *   data: users,
 *   total,
 *   page,
 *   pageSize,
 *   pages: Math.ceil(total / pageSize),
 * };
 */

// ============================================================================
// 7️⃣ READ WITH RELATIONS (JOIN)
// ============================================================================

/**
 * ❌ SQL THUẦN (User with Posts):
 * 
 * SELECT u.*, p.* FROM users u
 * LEFT JOIN posts p ON u.id = p.user_id
 * WHERE u.id = 1;
 * 
 * const [rows] = await connection.execute(
 *   `SELECT u.*, p.* FROM users u
 *    LEFT JOIN posts p ON u.id = p.user_id
 *    WHERE u.id = ?`,
 *   [1]
 * );
 * 
 * // ❌ Manual mapping needed
 * const user = {
 *   id: rows[0].id,
 *   name: rows[0].name,
 *   posts: rows
 *     .filter(row => row.id === rows[0].id)
 *     .map(row => ({
 *       id: row.post_id,
 *       title: row.title,
 *     }))
 * };
 * 
 * ❌ PROBLEMS:
 * - Complex SQL
 * - Manual mapping (tedious & error-prone)
 * - N+1 query problem possible
 */

/**
 * ✅ ORM (PRISMA):
 * 
 * const user = await prisma.user.findUnique({
 *   where: { id: 1 },
 *   include: {
 *     posts: true,  // ✅ Auto-load related posts
 *   },
 * });
 * 
 * // ✅ user: User & { posts: Post[] }
 * // ✅ Auto mapping
 * // ✅ user.posts = array of posts
 * 
 * ✅ BENEFITS:
 * - Simple, readable syntax
 * - Auto mapping
 * - No N+1 problem
 */

// ============================================================================
// 8️⃣ READ WITH NESTED RELATIONS (Multi-level JOIN)
// ============================================================================

/**
 * ❌ SQL THUẦN (User → Posts → Comments):
 * 
 * SELECT u.*, p.*, c.* FROM users u
 * LEFT JOIN posts p ON u.id = p.user_id
 * LEFT JOIN comments c ON p.id = c.post_id
 * WHERE u.id = 1;
 * 
 * // ❌ Very complex, hard to maintain
 * // ❌ Manual nested mapping (nightmare!)
 */

/**
 * ✅ ORM (PRISMA):
 * 
 * const user = await prisma.user.findUnique({
 *   where: { id: 1 },
 *   include: {
 *     posts: {
 *       include: {
 *         comments: true,  // ✅ Nested relations
 *       },
 *     },
 *   },
 * });
 * 
 * // ✅ user: User & { posts: (Post & { comments: Comment[] })[] }
 * // ✅ Auto mapping at any depth
 * 
 * // Access nested data easily
 * user.posts[0].comments[0].text // ✅ Simple navigation
 * 
 * ✅ BENEFITS:
 * - Clean, readable
 * - Auto nested mapping
 * - Type-safe navigation
 */

// ============================================================================
// 9️⃣ SELECT SPECIFIC COLUMNS (Project)
// ============================================================================

/**
 * ❌ SQL THUẦN:
 * 
 * SELECT id, name FROM users;
 * 
 * const [rows] = await connection.execute(
 *   'SELECT id, name FROM users'
 * );
 * 
 * return rows; // ❌ any[]
 * 
 * ❌ PROBLEMS:
 * - Return type doesn't reflect selected columns
 * - Manual type casting needed
 */

/**
 * ✅ ORM (PRISMA):
 * 
 * const users = await prisma.user.findMany({
 *   select: {
 *     id: true,
 *     name: true,
 *   },
 * });
 * 
 * // ✅ users: { id: number; name: string }[]
 * // ✅ Return type matches selected columns!
 * // ✅ No email, age properties (compiler error if access)
 * 
 * // users[0].email // ❌ Compile ERROR!
 * // Property 'email' does not exist
 */

// ============================================================================
// 🔟 UPDATE (Cập nhật bản ghi)
// ============================================================================

/**
 * ❌ SQL THUẦN:
 * 
 * UPDATE users SET name = 'Alice Updated', age = 26 WHERE id = 1;
 * 
 * await connection.execute(
 *   'UPDATE users SET name = ?, age = ? WHERE id = ?',
 *   ['Alice Updated', 26, 1]
 * );
 * 
 * // ❌ No return value, need to query again
 * const [rows] = await connection.execute(
 *   'SELECT * FROM users WHERE id = ?',
 *   [1]
 * );
 * 
 * return rows[0]; // ❌ any
 * 
 * ❌ PROBLEMS:
 * - 2 queries (UPDATE + SELECT)
 * - No type safety
 */

/**
 * ✅ ORM (PRISMA):
 * 
 * const user = await prisma.user.update({
 *   where: { id: 1 },
 *   data: {
 *     name: 'Alice Updated',
 *     age: 26,
 *   },
 * });
 * 
 * // ✅ user: User (updated)
 * // ✅ 1 query (UPDATE returning)
 * // ✅ Type-safe
 * 
 * ✅ BENEFITS:
 * - 1 query (RETURNING clause handled)
 * - Type-safe
 * - Returns updated object
 */

// ============================================================================
// 1️⃣1️⃣ BULK UPDATE (Cập nhật nhiều)
// ============================================================================

/**
 * ❌ SQL THUẦN:
 * 
 * UPDATE users SET status = 'active' WHERE age > 18;
 * 
 * await connection.execute(
 *   'UPDATE users SET status = ? WHERE age > ?',
 *   ['active', 18]
 * );
 * 
 * ❌ PROBLEMS:
 * - No count of updated rows returned easily
 */

/**
 * ✅ ORM (PRISMA):
 * 
 * const result = await prisma.user.updateMany({
 *   where: {
 *     age: { gt: 18 },
 *   },
 *   data: {
 *     status: 'active',
 *   },
 * });
 * 
 * // ✅ result: { count: number }
 * console.log(`Updated ${result.count} users`);
 * 
 * ✅ BENEFITS:
 * - Returns count
 * - Type-safe where clause
 */

// ============================================================================
// 1️⃣2️⃣ DELETE (Xóa bản ghi)
// ============================================================================

/**
 * ❌ SQL THUẦN:
 * 
 * DELETE FROM users WHERE id = 1;
 * 
 * await connection.execute(
 *   'DELETE FROM users WHERE id = ?',
 *   [1]
 * );
 * 
 * ❌ PROBLEMS:
 * - Doesn't return deleted data
 */

/**
 * ✅ ORM (PRISMA):
 * 
 * const user = await prisma.user.delete({
 *   where: { id: 1 },
 * });
 * 
 * // ✅ user: User (deleted record)
 * // ✅ Returns deleted data
 * 
 * ✅ BENEFITS:
 * - Returns deleted object
 * - Type-safe
 */

// ============================================================================
// 1️⃣3️⃣ BULK DELETE (Xóa nhiều)
// ============================================================================

/**
 * ❌ SQL THUẦN:
 * 
 * DELETE FROM users WHERE age < 18;
 * 
 * await connection.execute(
 *   'DELETE FROM users WHERE age < ?',
 *   [18]
 * );
 */

/**
 * ✅ ORM (PRISMA):
 * 
 * const result = await prisma.user.deleteMany({
 *   where: {
 *     age: { lt: 18 },
 *   },
 * });
 * 
 * // ✅ result: { count: number }
 * console.log(`Deleted ${result.count} users`);
 * 
 * ✅ BENEFITS:
 * - Returns count
 * - Type-safe where clause
 */

// ============================================================================
// 1️⃣4️⃣ UPSERT (Update or Insert)
// ============================================================================

/**
 * ❌ SQL THUẦN (Complex):
 * 
 * -- PostgreSQL specific
 * INSERT INTO users (email, name, age)
 * VALUES ('alice@example.com', 'Alice', 25)
 * ON CONFLICT (email)
 * DO UPDATE SET name = 'Alice', age = 25;
 * 
 * -- MySQL: Different syntax
 * INSERT INTO users (email, name, age)
 * VALUES ('alice@example.com', 'Alice', 25)
 * ON DUPLICATE KEY UPDATE name = 'Alice', age = 25;
 * 
 * ❌ PROBLEMS:
 * - Database-specific syntax
 * - Hard to read
 * - Easy to make mistakes
 */

/**
 * ✅ ORM (PRISMA):
 * 
 * const user = await prisma.user.upsert({
 *   where: { email: 'alice@example.com' },
 *   update: {
 *     name: 'Alice',
 *     age: 25,
 *   },
 *   create: {
 *     email: 'alice@example.com',
 *     name: 'Alice',
 *     age: 25,
 *   },
 * });
 * 
 * // ✅ user: User
 * // ✅ Database-agnostic
 * // ✅ Readable
 * 
 * ✅ BENEFITS:
 * - Same syntax for all databases
 * - Type-safe
 * - Clear intent
 */

// ============================================================================
// 1️⃣5️⃣ AGGREGATION (Count, Sum, Avg)
// ============================================================================

/**
 * ❌ SQL THUẦN:
 * 
 * SELECT COUNT(*) as total, AVG(age) as avg_age FROM users;
 * 
 * const [rows] = await connection.execute(
 *   'SELECT COUNT(*) as total, AVG(age) as avg_age FROM users'
 * );
 * 
 * const result = {
 *   total: parseInt(rows[0].total),
 *   avgAge: parseFloat(rows[0].avg_age),
 * };
 * 
 * ❌ PROBLEMS:
 * - Manual type conversion
 * - Column names in lowercase/snake_case
 * - No type safety
 */

/**
 * ✅ ORM (PRISMA):
 * 
 * const result = await prisma.user.aggregate({
 *   _count: true,
 *   _avg: { age: true },
 * });
 * 
 * // ✅ result: { _count: number, _avg: { age: number | null } }
 * // ✅ Auto type conversion
 * // ✅ Type-safe
 * 
 * ✅ BENEFITS:
 * - Readable
 * - Type-safe
 * - No manual conversion
 */

// ============================================================================
// 1️⃣6️⃣ GROUP BY (Nhóm dữ liệu)
// ============================================================================

/**
 * ❌ SQL THUẦN:
 * 
 * SELECT city, COUNT(*) as user_count
 * FROM users
 * GROUP BY city;
 * 
 * const [rows] = await connection.execute(
 *   `SELECT city, COUNT(*) as user_count
 *    FROM users
 *    GROUP BY city`
 * );
 * 
 * return rows; // ❌ any[]
 * 
 * ❌ PROBLEMS:
 * - No type safety
 */

/**
 * ✅ ORM (PRISMA):
 * 
 * const result = await prisma.user.groupBy({
 *   by: ['city'],
 *   _count: true,
 * });
 * 
 * // ✅ result: { city: string, _count: number }[]
 * // ✅ Type-safe grouping
 * 
 * ✅ BENEFITS:
 * - Type-safe
 * - Cleaner syntax
 */

// ============================================================================
// 1️⃣7️⃣ TRANSACTIONS (Giao dịch)
// ============================================================================

/**
 * ❌ SQL THUẦN (Complex):
 * 
 * try {
 *   await connection.beginTransaction();
 * 
 *   const user = await connection.execute(
 *     'INSERT INTO users (name, email) VALUES (?, ?)',
 *     ['Alice', 'alice@example.com']
 *   );
 * 
 *   const post = await connection.execute(
 *     'INSERT INTO posts (title, user_id) VALUES (?, ?)',
 *     ['My Post', user.insertId]
 *   );
 * 
 *   await connection.commit();
 * } catch (err) {
 *   await connection.rollback();
 *   throw err;
 * }
 * 
 * ❌ PROBLEMS:
 * - Manual transaction management
 * - Easy to forget commit/rollback
 */

/**
 * ✅ ORM (PRISMA):
 * 
 * const [user, post] = await prisma.$transaction([
 *   prisma.user.create({
 *     data: {
 *       name: 'Alice',
 *       email: 'alice@example.com',
 *     },
 *   }),
 *   prisma.post.create({
 *     data: {
 *       title: 'My Post',
 *       userId: 1,
 *     },
 *   }),
 * ]);
 * 
 * // ✅ Auto commit/rollback
 * // ✅ Type-safe
 * 
 * ✅ BENEFITS:
 * - Simple syntax
 * - Auto transaction management
 */

// ============================================================================
// 📊 FINAL COMPARISON TABLE
// ============================================================================

/**
 * ┌──────────────────────────┬──────────────────────────┬────────────────┐
 * │ Operation                │ SQL Code Length          │ Prisma Code    │
 * ├──────────────────────────┼──────────────────────────┼────────────────┤
 * │ CREATE                   │ ~8 lines                 │ ~5 lines       │
 * │ READ ONE                 │ ~5 lines                 │ ~3 lines       │
 * │ READ MANY                │ ~3 lines                 │ ~1 line        │
 * │ READ WITH FILTER         │ ~5 lines                 │ ~5 lines       │
 * │ READ WITH SORT           │ ~5 lines                 │ ~4 lines       │
 * │ READ WITH PAGINATION     │ ~8 lines                 │ ~3 lines       │
 * │ READ WITH JOIN           │ ~10 lines + mapping      │ ~5 lines       │
 * │ UPDATE                   │ ~8 lines (2 queries)     │ ~4 lines       │
 * │ DELETE                   │ ~3 lines                 │ ~3 lines       │
 * │ UPSERT                   │ ~10 lines (DB specific)  │ ~8 lines       │
 * │ AGGREGATE                │ ~8 lines + conversion    │ ~4 lines       │
 * │ TRANSACTION              │ ~15 lines                │ ~10 lines      │
 * ├──────────────────────────┼──────────────────────────┼────────────────┤
 * │ TOTAL (CRUD)             │ ~60 lines                │ ~20 lines      │
 * │ TYPE SAFETY              │ ❌ None                  │ ✅ Full        │
 * │ VALIDATION               │ ❌ None                  │ ✅ Built-in    │
 * └──────────────────────────┴──────────────────────────┴────────────────┘
 * 
 * ✅ PRISMA = 70% LESS CODE + Type Safety + Validation
 */

// ============================================================================
// 🎯 RECOMMENDATIONS
// ============================================================================

/**
 * USE PRISMA FOR:
 * ✅ Standard CRUD
 * ✅ Complex queries with relationships
 * ✅ Need type safety
 * ✅ Team > 1 person
 * ✅ Long-term project
 * ✅ 80% of all queries
 * 
 * USE RAW SQL FOR:
 * ✅ Complex analytical queries (GROUP BY, aggregations)
 * ✅ Performance-critical queries
 * ✅ Database-specific features
 * ✅ One-off reports
 * 
 * HYBRID (BEST):
 * ✅ Use Prisma for main application logic
 * ✅ Use raw SQL for complex queries
 * ✅ Prisma supports raw queries: prisma.$queryRaw
 * 
 * // Hybrid example
 * const users = await prisma.user.findMany(); // ✅ Prisma (80%)
 * 
 * const complexReport = await prisma.$queryRaw`
 *   SELECT ...complex query... // ✅ Raw SQL (20%)
 * `;
 */

export const SQLVsORM = `
SQL THUẦN vs ORM (PRISMA)

COMPARISON BY OPERATION:

CREATE:
SQL: 8 lines → Prisma: 5 lines
ORM saves 37% code

READ ONE:
SQL: 5 lines → Prisma: 3 lines
ORM saves 40% code

READ MANY:
SQL: 3 lines → Prisma: 1 line
ORM saves 66% code

READ WITH JOIN:
SQL: 10+ lines + manual mapping → Prisma: 5 lines
ORM saves 50%+ code + auto mapping

UPDATE:
SQL: 8 lines (need 2 queries) → Prisma: 4 lines (1 query)
ORM saves 50% + better performance

UPSERT:
SQL: 10+ lines (database-specific) → Prisma: 8 lines (universal)
ORM simpler + cross-database

TRANSACTION:
SQL: 15 lines (manual mgmt) → Prisma: 10 lines (auto mgmt)
ORM saves 33% + safer

TOTAL CRUD: SQL 60 lines → Prisma 20 lines
ORM SAVES 70% CODE!

ADDITIONAL BENEFITS OF ORM:
✅ Type-safe (all operations)
✅ Built-in validation
✅ Auto error handling
✅ No manual mapping
✅ IDE autocomplete
✅ Easy refactoring
✅ Compiler catches mistakes
✅ Cross-database compatibility

WHEN USE ORM: 80% of cases (CRUD, complex queries)
WHEN USE RAW SQL: 20% of cases (analytics, performance, DB-specific)

RECOMMENDATION: Use ORM (Prisma) + Raw SQL (Hybrid) = Best approach
`;
