/**
 * ============================================================================
 * DATABASE QUERY OPTIMIZATION - CÁC TRUY VẤN CƠ BẢN & TỐI ƯU HÓA
 * ============================================================================
 * 
 * CẤU TRÚC CHÍNH:
 * 1. Các truy vấn cơ bản (SELECT, INSERT, UPDATE, DELETE)
 * 2. Cách SQL thực thi truy vấn (execution flow)
 * 3. Thứ tự thực thi clause (không phải thứ tự viết code)
 * 4. Tối ưu hóa truy vấn (indexes, execution plans, anti-patterns)
 * ============================================================================
 */

// ============================================================================
// PHẦN 1: CÁC TRUY VẤN CƠ BẢN
// ============================================================================

console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                    1. CÁC TRUY VẤN CƠ BẢN                                 ║
╚════════════════════════════════════════════════════════════════════════════╝
`);

// ────────────────────────────────────────────────────────────────────────────
// 1.1. SELECT - TRY VẤN DỮ LIỆU
// ────────────────────────────────────────────────────────────────────────────

const basicSelect = `
-- BASIC SELECT
SELECT * FROM users;
SELECT id, name, email FROM users;
SELECT DISTINCT department FROM users;

-- SELECT WITH CONDITION
SELECT * FROM users WHERE age > 18;
SELECT * FROM users WHERE status = 'active' AND age > 18;
SELECT * FROM users WHERE status = 'active' OR status = 'pending';

-- SELECT WITH PATTERN MATCHING
SELECT * FROM users WHERE name LIKE 'John%';      -- Starts with John
SELECT * FROM users WHERE name LIKE '%John%';     -- Contains John
SELECT * FROM users WHERE name LIKE '_ohn';       -- _ = single char

-- SELECT WITH IN / BETWEEN
SELECT * FROM users WHERE id IN (1, 2, 3, 5);
SELECT * FROM users WHERE age BETWEEN 18 AND 65;

-- SELECT WITH ORDER BY
SELECT * FROM users ORDER BY created_at DESC;
SELECT * FROM users ORDER BY age ASC, name DESC;

-- SELECT WITH LIMIT / OFFSET (PAGINATION)
SELECT * FROM users LIMIT 10;                     -- First 10 records
SELECT * FROM users LIMIT 10 OFFSET 20;           -- Skip 20, get 10 (page 3)

-- SELECT WITH AGGREGATE
SELECT COUNT(*) FROM users;
SELECT COUNT(DISTINCT department) FROM users;
SELECT SUM(salary), AVG(salary), MIN(salary), MAX(salary) FROM employees;

-- SELECT WITH GROUP BY
SELECT department, COUNT(*) as count FROM users GROUP BY department;
SELECT 
  department, 
  COUNT(*) as count,
  AVG(salary) as avg_salary
FROM employees
GROUP BY department;

-- SELECT WITH HAVING (filter groups)
SELECT 
  department, 
  COUNT(*) as count
FROM employees
GROUP BY department
HAVING COUNT(*) > 5;

-- SELECT WITH JOIN
SELECT u.id, u.name, o.order_id, o.amount
FROM users u
INNER JOIN orders o ON u.id = o.user_id;

SELECT u.id, u.name, o.order_id
FROM users u
LEFT JOIN orders o ON u.id = o.user_id;

-- SELECT WITH SUBQUERY
SELECT * FROM users WHERE id IN (
  SELECT user_id FROM orders WHERE amount > 1000
);

SELECT u.name, (SELECT COUNT(*) FROM orders WHERE user_id = u.id) as order_count
FROM users u;

-- SELECT WITH CTE (Common Table Expression)
WITH active_users AS (
  SELECT * FROM users WHERE status = 'active'
)
SELECT * FROM active_users WHERE age > 18;

-- SELECT WITH UNION (combine results)
SELECT name FROM users
UNION
SELECT name FROM customers;

-- SELECT WITH CASE (conditional)
SELECT 
  id,
  name,
  CASE 
    WHEN age < 18 THEN 'Minor'
    WHEN age >= 18 AND age < 65 THEN 'Adult'
    ELSE 'Senior'
  END as age_group
FROM users;
`;

console.log("SELECT QUERIES:");
console.log(basicSelect);

// ────────────────────────────────────────────────────────────────────────────
// 1.2. INSERT - THÊM DỮ LIỆU
// ────────────────────────────────────────────────────────────────────────────

const basicInsert = `
-- BASIC INSERT
INSERT INTO users (name, email, age) VALUES ('John', 'john@example.com', 25);

-- INSERT MULTIPLE ROWS
INSERT INTO users (name, email, age) VALUES 
  ('John', 'john@example.com', 25),
  ('Jane', 'jane@example.com', 28),
  ('Bob', 'bob@example.com', 30);

-- INSERT FROM SELECT
INSERT INTO users_backup (name, email, age)
SELECT name, email, age FROM users WHERE status = 'active';

-- INSERT WITH DEFAULT
INSERT INTO users (name, email, created_at) 
VALUES ('John', 'john@example.com', NOW());

-- INSERT WITH AUTO_INCREMENT
-- ID tự động tăng (defined in schema)
INSERT INTO users (name, email) VALUES ('John', 'john@example.com');
`;

console.log("\nINSERT QUERIES:");
console.log(basicInsert);

// ────────────────────────────────────────────────────────────────────────────
// 1.3. UPDATE - CẬP NHẬT DỮ LIỆU
// ────────────────────────────────────────────────────────────────────────────

const basicUpdate = `
-- BASIC UPDATE
UPDATE users SET status = 'inactive' WHERE id = 1;

-- UPDATE MULTIPLE COLUMNS
UPDATE users 
SET status = 'active', updated_at = NOW()
WHERE id = 1;

-- UPDATE WITH CALCULATION
UPDATE employees 
SET salary = salary * 1.1
WHERE department = 'IT';

-- UPDATE WITH CASE
UPDATE users
SET status = CASE
  WHEN age < 18 THEN 'minor'
  WHEN age >= 18 AND age < 65 THEN 'adult'
  ELSE 'senior'
END;

-- UPDATE WITH JOIN
UPDATE users u
JOIN orders o ON u.id = o.user_id
SET u.total_orders = u.total_orders + 1
WHERE o.created_at = CURDATE();

-- UPDATE WITH SUBQUERY
UPDATE users 
SET status = 'vip'
WHERE id IN (
  SELECT user_id FROM orders GROUP BY user_id HAVING SUM(amount) > 10000
);
`;

console.log("\nUPDATE QUERIES:");
console.log(basicUpdate);

// ────────────────────────────────────────────────────────────────────────────
// 1.4. DELETE - XÓA DỮ LIỆU
// ────────────────────────────────────────────────────────────────────────────

const basicDelete = `
-- BASIC DELETE
DELETE FROM users WHERE id = 1;

-- DELETE WITH CONDITION
DELETE FROM users WHERE status = 'inactive' AND created_at < DATE_SUB(NOW(), INTERVAL 1 YEAR);

-- DELETE WITH JOIN
DELETE u FROM users u
LEFT JOIN orders o ON u.id = o.user_id
WHERE o.user_id IS NULL;

-- DELETE WITH SUBQUERY
DELETE FROM users WHERE id IN (
  SELECT user_id FROM orders GROUP BY user_id HAVING COUNT(*) = 0
);

-- SOFT DELETE (không thực sự xóa, chỉ mark deleted)
UPDATE users SET deleted_at = NOW() WHERE id = 1;

-- HARD DELETE (thực sự xóa)
DELETE FROM users WHERE id = 1;

-- TRUNCATE (xóa tất cả, nhanh hơn DELETE)
TRUNCATE TABLE users;  -- Cannot use WHERE, resets AUTO_INCREMENT
`;

console.log("\nDELETE QUERIES:");
console.log(basicDelete);

// ============================================================================
// PHẦN 2: CÁCH SQL THỰC TỊ TRUY VẤN (EXECUTION FLOW)
// ============================================================================

console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║            2. CÁCH SQL THỰC TỊ TRUY VẤN (EXECUTION FLOW)                  ║
╚════════════════════════════════════════════════════════════════════════════╝
`);

const executionFlow = `
SYNTAX VÀ EXECUTION ORDER KHÁC NHAU!

┌─────────────────────────────────────────────────────────────────────────────┐
│ CÁCH BẠN VIẾT (Syntax Order):                                              │
│                                                                             │
│ SELECT   columns           ← Viết trước                                    │
│ FROM     table             ← Viết thứ 2                                    │
│ WHERE    condition         ← Viết thứ 3                                    │
│ GROUP BY columns           ← Viết thứ 4                                    │
│ HAVING   condition         ← Viết thứ 5                                    │
│ ORDER BY columns           ← Viết thứ 6                                    │
│ LIMIT    count             ← Viết thứ 7                                    │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│ CÁCH SQL THỰC TỊ (Execution Order):                                        │
│                                                                             │
│ 1. FROM         ← Bắt đầu từ bảng                                          │
│ 2. WHERE        ← Lọc dòng                                                 │
│ 3. GROUP BY     ← Nhóm dữ liệu                                             │
│ 4. HAVING       ← Lọc nhóm                                                 │
│ 5. SELECT       ← Chọn cột                                                 │
│ 6. ORDER BY     ← Sắp xếp                                                  │
│ 7. LIMIT        ← Giới hạn kết quả                                         │
│ 8. OFFSET       ← Bỏ qua                                                   │
└─────────────────────────────────────────────────────────────────────────────┘

═════════════════════════════════════════════════════════════════════════════
VÍ DỤ CHI TIẾT:

SELECT department, AVG(salary) as avg_salary
FROM employees
WHERE age > 25
GROUP BY department
HAVING AVG(salary) > 50000
ORDER BY avg_salary DESC
LIMIT 5;

THỰC TỊ THEO THỨ TỰ:
├─ 1. FROM employees
│   └─ Đọc tất cả dòng từ bảng employees
│
├─ 2. WHERE age > 25
│   └─ Lọc chỉ những employee có age > 25
│      employees: 100 dòng → sau filter: 75 dòng
│
├─ 3. GROUP BY department
│   └─ Chia 75 dòng thành các nhóm theo department
│      HR: 20 dòng, IT: 30 dòng, Finance: 15 dòng, ...
│
├─ 4. HAVING AVG(salary) > 50000
│   └─ Lọc chỉ những nhóm có avg_salary > 50000
│      Giả sử 3 nhóm thỏa mãn
│
├─ 5. SELECT department, AVG(salary)
│   └─ Tính toán AVG cho mỗi nhóm
│      HR, 52000; IT, 65000; Finance, 48000 (bị lọc)
│      Kết quả: 2 dòng
│
├─ 6. ORDER BY avg_salary DESC
│   └─ Sắp xếp theo avg_salary giảm dần
│      IT: 65000; HR: 52000
│
└─ 7. LIMIT 5
    └─ Lấy 5 dòng đầu (nhưng chỉ có 2 dòng nên trả về 2)
       KẾT QUẢ: IT (65000), HR (52000)

═════════════════════════════════════════════════════════════════════════════
QUAN TRỌNG: WHERE vs HAVING

WHERE      → Lọc DỮ LIỆU TRƯỚC KHI nhóm (row level)
HAVING     → Lọc NHÓM SAU KHI nhóm (group level)

VÍ DỤ:
SELECT department, COUNT(*) as count
FROM employees
WHERE age > 25              ← Chỉ xét employee > 25 tuổi
GROUP BY department
HAVING COUNT(*) > 10;       ← Chỉ lấy department có > 10 employee

Nếu dùng WHERE age > 25:
  Total employees: 100 → Sau WHERE: 75 → Nhóm: HR (20), IT (30), Finance (15)
  
Nếu dùng WHERE age > 25 trong SELECT:
  SELECT * FROM employees WHERE age > 25;
  Kết quả: 75 dòng

Nếu KHÔNG dùng WHERE:
  Total employees: 100 → Nhóm: HR (30), IT (40), Finance (30)
  
═════════════════════════════════════════════════════════════════════════════
JOIN EXECUTION ORDER:

SELECT u.id, u.name, o.amount
FROM users u
INNER JOIN orders o ON u.id = o.user_id
WHERE o.amount > 100
GROUP BY u.id, u.name
ORDER BY o.amount DESC;

THỰC TỊ:
1. FROM users u → Đọc bảng users
2. INNER JOIN orders o → Join với orders (dùng ON condition)
3. WHERE o.amount > 100 → Lọc dòng sau join
4. GROUP BY → Nhóm
5. SELECT → Chọn cột
6. ORDER BY → Sắp xếp
`;

console.log(executionFlow);

// ============================================================================
// PHẦN 3: CHI TIẾT EXECUTION FLOW - VÍ DỤ THỰC TẾ
// ============================================================================

console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║              3. CHI TIẾT EXECUTION FLOW - VÍ DỤ THỰC TẾ                    ║
╚════════════════════════════════════════════════════════════════════════════╝
`);

const detailedFlow = `
BẢNG DỮ LIỆU:

employees:
┌────┬──────┬────────┬──────────┐
│ id │ name │ salary │ dept_id  │
├────┼──────┼────────┼──────────┤
│ 1  │ John │ 50000  │ 1 (IT)   │
│ 2  │ Jane │ 60000  │ 1 (IT)   │
│ 3  │ Bob  │ 45000  │ 2 (HR)   │
│ 4  │ Mary │ 55000  │ 2 (HR)   │
│ 5  │ Mike │ 70000  │ 1 (IT)   │
│ 6  │ Sarah│ 48000  │ 3 (Fin)  │
└────┴──────┴────────┴──────────┘

TRUY VẤN:
SELECT dept_id, AVG(salary) as avg_salary
FROM employees
WHERE salary > 45000
GROUP BY dept_id
HAVING AVG(salary) > 50000
ORDER BY avg_salary DESC;

THỰC TỊ TỪNG BƯỚC:

BƯỚC 1: FROM employees
  ┌────┬──────┬────────┬──────────┐
  │ 1  │ John │ 50000  │ 1        │
  │ 2  │ Jane │ 60000  │ 1        │
  │ 3  │ Bob  │ 45000  │ 2        │
  │ 4  │ Mary │ 55000  │ 2        │
  │ 5  │ Mike │ 70000  │ 1        │
  │ 6  │ Sarah│ 48000  │ 3        │
  └────┴──────┴────────┴──────────┘

BƯỚC 2: WHERE salary > 45000
  ┌────┬──────┬────────┬──────────┐
  │ 1  │ John │ 50000  │ 1        │ ✓ (50000 > 45000)
  │ 2  │ Jane │ 60000  │ 1        │ ✓
  │ 3  │ Bob  │ 45000  │ 2        │ ✗ (45000 NOT > 45000)
  │ 4  │ Mary │ 55000  │ 2        │ ✓
  │ 5  │ Mike │ 70000  │ 1        │ ✓
  │ 6  │ Sarah│ 48000  │ 3        │ ✓
  └────┴──────┴────────┴──────────┘
  
  Kết quả sau WHERE: 5 dòng (loại bỏ Bob)

BƯỚC 3: GROUP BY dept_id
  Chia 5 dòng thành 3 nhóm:
  
  Dept 1 (IT):
    - John: 50000
    - Jane: 60000
    - Mike: 70000
    AVG = (50000 + 60000 + 70000) / 3 = 60000
  
  Dept 2 (HR):
    - Mary: 55000
    AVG = 55000 / 1 = 55000
  
  Dept 3 (Finance):
    - Sarah: 48000
    AVG = 48000 / 1 = 48000

BƯỚC 4: HAVING AVG(salary) > 50000
  ┌────────┬────────────┐
  │ dept_id│ avg_salary │
  ├────────┼────────────┤
  │ 1 (IT) │ 60000      │ ✓ (60000 > 50000)
  │ 2 (HR) │ 55000      │ ✓ (55000 > 50000)
  │ 3 (Fin)│ 48000      │ ✗ (48000 NOT > 50000)
  └────────┴────────────┘
  
  Kết quả: 2 nhóm

BƯỚC 5: SELECT dept_id, AVG(salary) as avg_salary
  Chọn cột để trả về
  ┌────────┬────────────┐
  │ dept_id│ avg_salary │
  ├────────┼────────────┤
  │ 1      │ 60000      │
  │ 2      │ 55000      │
  └────────┴────────────┘

BƯỚC 6: ORDER BY avg_salary DESC
  Sắp xếp theo avg_salary giảm dần
  ┌────────┬────────────┐
  │ dept_id│ avg_salary │
  ├────────┼────────────┤
  │ 1      │ 60000      │ ← Lớn nhất
  │ 2      │ 55000      │
  └────────┴────────────┘

KẾT QUẢ CUỐI:
┌────────┬────────────┐
│ dept_id│ avg_salary │
├────────┼────────────┤
│ 1      │ 60000      │
│ 2      │ 55000      │
└────────┴────────────┘
`;

console.log(detailedFlow);

// ============================================================================
// PHẦN 4: TỐI ƯU HÓA TRUY VẤN
// ============================================================================

console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                    4. TỐI ƯU HÓA TRUY VẤN                                  ║
╚════════════════════════════════════════════════════════════════════════════╝
`);

const optimization = `
═════════════════════════════════════════════════════════════════════════════
4.1. INDEXES - CHỈ MỤC

INDEX là cách để database tìm dữ liệu NHANH hơn (giống mục lục sách)

VÀO MỤC LỤC SÁCH:
  Thay vì đọc từ trang 1 đến 500, bạn tìm mục lục, thấy "Node.js" ở trang 200
  Thì bạn nhảy đến trang 200 ngay

DATABASE INDEX:
  Thay vì quét tất cả 1 triệu dòng, index giúp tìm được trong microseconds

LOẠI INDEX:
┌──────────────────────┬─────────────────┬──────────────────────────────┐
│ Type                 │ Cấu trúc        │ Sử dụng khi                  │
├──────────────────────┼─────────────────┼──────────────────────────────┤
│ PRIMARY KEY          │ B-Tree          │ ID, unique identifier        │
│ UNIQUE               │ B-Tree          │ Email, username (unique)     │
│ REGULAR (Single)     │ B-Tree          │ WHERE clauses (single col)   │
│ COMPOSITE (Multiple) │ B-Tree          │ WHERE (multiple cols)        │
│ FULL-TEXT           │ Inverted Index  │ LIKE 'text%' search          │
│ GEO                 │ R-Tree          │ Geographic queries           │
│ HASH                │ Hash Table      │ Exact match (rare)           │
└──────────────────────┴─────────────────┴──────────────────────────────┘

TẠO INDEX:
-- Single column index
CREATE INDEX idx_email ON users(email);

-- Composite index (multiple columns)
CREATE INDEX idx_dept_salary ON employees(department, salary);

-- Unique index
CREATE UNIQUE INDEX idx_unique_email ON users(email);

-- Full-text index (cho LIKE '%text%')
CREATE FULLTEXT INDEX idx_name ON users(name);

KHI NÀO INDEX ĐƯỢC SỬ DỤNG:
✓ WHERE clause           SELECT * FROM users WHERE email = 'john@example.com';
✓ JOIN condition        SELECT * FROM users u JOIN orders o ON u.id = o.user_id;
✓ ORDER BY              SELECT * FROM users ORDER BY created_at;
✓ GROUP BY              SELECT department, COUNT(*) FROM employees GROUP BY department;
✓ RANGE query           SELECT * FROM users WHERE age BETWEEN 18 AND 65;

KHI NÀO INDEX KHÔNG ĐƯỢC SỬ DỤNG:
✗ LIKE '%text' (% ở đầu) → Phải quét tất cả
✗ Functions in WHERE     → SELECT * FROM users WHERE YEAR(created_at) = 2023;
✗ OR without index       → SELECT * FROM users WHERE name = 'John' OR age = 25;
✗ NOT operator           → SELECT * FROM users WHERE age != 25;
✗ Type conversion        → WHERE user_id = '123'; (string vs number)

═════════════════════════════════════════════════════════════════════════════
4.2. EXECUTION PLAN - XEM QUERY CHẠY NHƯ THẾ NÀO

EXPLAIN giúp bạn thấy database chạy query như thế nào

-- MySQL
EXPLAIN SELECT * FROM users WHERE email = 'john@example.com';

Kết quả:
┌────┬─────────────┬──────┬──────┬────┬──────┬─────────┐
│ id │ select_type │ table│ type │ key│ rows │ Extra   │
├────┼─────────────┼──────┼──────┼────┼──────┼─────────┤
│ 1  │ SIMPLE      │users │ ref  │ idx│ 1    │         │
└────┴─────────────┴──────┴──────┴────┴──────┴─────────┘

KEY METRICS:
- type: const < eq_ref < ref < range < index < ALL (tốt → xấu)
  • const: tìm 1 dòng (best)
  • eq_ref: tìm chính xác (good)
  • ref: tìm range (ok)
  • range: BETWEEN, IN (ok)
  • index: quét toàn bộ index (slow)
  • ALL: quét toàn bộ table (very slow)

- rows: số dòng phải quét (thấp = tốt)
- Extra: "Using index" tốt, "Using where" không tốt

═════════════════════════════════════════════════════════════════════════════
4.3. N+1 QUERY PROBLEM

❌ BAD - N+1 queries:
-- 1 query lấy users
const users = db.query('SELECT * FROM users');

-- N query lấy orders cho mỗi user (N = số users)
users.forEach(user => {
  const orders = db.query('SELECT * FROM orders WHERE user_id = ?', user.id);
});

// Nếu có 1000 users → 1001 queries! (1 + 1000)

✓ GOOD - Join:
SELECT u.*, o.* 
FROM users u
LEFT JOIN orders o ON u.id = o.user_id;

// 1 query duy nhất!

✓ GOOD - Batch query (nếu không thể join):
const userIds = [1, 2, 3, ...];
const orders = db.query('SELECT * FROM orders WHERE user_id IN (?)', userIds);

// Chỉ 2 queries

═════════════════════════════════════════════════════════════════════════════
4.4. QUERY OPTIMIZATION TIPS

1️⃣ SELECT chỉ cột cần thiết
   ❌ SELECT * FROM users;          // Tải toàn bộ cột (slow)
   ✓ SELECT id, name, email FROM users;  // Chỉ cột cần (fast)

2️⃣ Dùng WHERE để lọc sớm
   ❌ SELECT * FROM users ORDER BY created_at LIMIT 10;
      // Database phải sắp xếp 1 triệu dòng
   ✓ SELECT * FROM users WHERE status = 'active' ORDER BY created_at LIMIT 10;
      // Database sắp xếp chỉ 10k active users

3️⃣ Tránh functions trong WHERE (ngăn index)
   ❌ SELECT * FROM users WHERE YEAR(created_at) = 2023;
   ✓ SELECT * FROM users WHERE created_at >= '2023-01-01' AND created_at < '2024-01-01';

4️⃣ Tránh LIKE '%text' (phải quét toàn bộ)
   ❌ SELECT * FROM users WHERE name LIKE '%John%';  // Index không giúp
   ✓ SELECT * FROM users WHERE name LIKE 'John%';   // Index giúp

5️⃣ Dùng LIMIT với OFFSET cẩn thận (slow ở trang cuối)
   ❌ LIMIT 10 OFFSET 1000000;  // Skip 1 triệu dòng (slow!)
   ✓ SELECT * FROM users WHERE id > last_id LIMIT 10;  // Keyset pagination (fast)

6️⃣ Tránh SELECT * với bảng rộng
   ❌ SELECT * FROM users WHERE id = 1;  // 20 cột được tải
   ✓ SELECT id, name, email FROM users WHERE id = 1;  // 3 cột

7️⃣ Join thay vì subquery (thường nhanh hơn)
   ❌ SELECT * FROM users WHERE id IN (SELECT user_id FROM orders);
   ✓ SELECT u.* FROM users u INNER JOIN orders o ON u.id = o.user_id;

8️⃣ Dùng JOIN thay vì multiple queries
   ❌ Loop query (N+1 problem)
   ✓ JOIN 1 lần

9️⃣ Dùng aggregate functions đúng cách
   ❌ SELECT * FROM orders; -- Lấy tất cả rồi COUNT trên app
   ✓ SELECT COUNT(*) FROM orders WHERE status = 'pending'; -- COUNT trên DB

🔟 Denormalization cho read-heavy operations
   ❌ 5 joins để lấy order total
   ✓ Store total trực tiếp trên order table

═════════════════════════════════════════════════════════════════════════════
4.5. COMMON QUERY ANTI-PATTERNS (Tránh)

❌ ANTI-PATTERN 1: SELECT * và chỉ dùng 1-2 cột
   SELECT * FROM users;
   → Lấy toàn bộ cột (lãng phí bandwidth)

❌ ANTI-PATTERN 2: OR mà không có index trên cả 2 cột
   SELECT * FROM users WHERE name = 'John' OR age = 25;
   → Index có thể không được dùng

❌ ANTI-PATTERN 3: NOT IN với subquery trả về NULL
   SELECT * FROM users WHERE id NOT IN (SELECT user_id FROM orders);
   → Nếu subquery có NULL → kết quả rỗng!
   SOLUTION: SELECT * FROM users u LEFT JOIN orders o ON u.id = o.user_id WHERE o.user_id IS NULL;

❌ ANTI-PATTERN 4: Lồng subquery (Correlated subquery)
   SELECT name, (SELECT COUNT(*) FROM orders WHERE user_id = u.id) 
   FROM users u;
   → Chạy subquery 1 triệu lần (nếu 1 triệu users)
   SOLUTION: SELECT u.name, COUNT(o.id) FROM users u LEFT JOIN orders o ON u.id = o.user_id GROUP BY u.id;

❌ ANTI-PATTERN 5: GROUP BY mà không có aggregate
   SELECT name, age FROM users GROUP BY age;
   → Hành vi không xác định (tên nào được return?)

❌ ANTI-PATTERN 6: ORDER BY mà không có index
   SELECT * FROM users ORDER BY created_at LIMIT 10;
   → Database phải sort toàn bộ table (slow!)
   → Tạo index: CREATE INDEX idx_created_at ON users(created_at);
`;

console.log(optimization);

// ============================================================================
// PHẦN 5: THỰC HÀNH - CODE EXAMPLES
// ============================================================================

console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                   5. THỰC HÀNH - CODE EXAMPLES                            ║
╚════════════════════════════════════════════════════════════════════════════╝
`);

// Simulated Query Execution
interface User {
  id: number;
  name: string;
  email: string;
  age: number;
  salary: number;
  department: string;
}

const sampleData: User[] = [
  { id: 1, name: "John", email: "john@example.com", age: 28, salary: 50000, department: "IT" },
  { id: 2, name: "Jane", email: "jane@example.com", age: 32, salary: 60000, department: "IT" },
  { id: 3, name: "Bob", email: "bob@example.com", age: 25, salary: 45000, department: "HR" },
  { id: 4, name: "Mary", email: "mary@example.com", age: 35, salary: 55000, department: "HR" },
  { id: 5, name: "Mike", email: "mike@example.com", age: 29, salary: 70000, department: "IT" },
];

// Example 1: Simple SELECT with WHERE
function example1_SelectWithWhere() {
  console.log("\n--- EXAMPLE 1: SELECT with WHERE ---");
  const sql = "SELECT id, name, email FROM users WHERE age > 25";
  
  // EXECUTION:
  // 1. FROM users → all rows
  // 2. WHERE age > 25 → filter
  // 3. SELECT id, name, email → select columns
  
  const result = sampleData
    .filter(u => u.age > 25)
    .map(u => ({ id: u.id, name: u.name, email: u.email }));
  
  console.log("SQL:", sql);
  console.log("Result:", result);
  console.log(`Rows scanned: ${sampleData.length}, Rows returned: ${result.length}`);
}

// Example 2: GROUP BY with HAVING
function example2_GroupByHaving() {
  console.log("\n--- EXAMPLE 2: GROUP BY with HAVING ---");
  const sql = `
SELECT department, COUNT(*) as count, AVG(salary) as avg_salary
FROM users
WHERE age > 25
GROUP BY department
HAVING AVG(salary) > 50000
  `;
  
  // EXECUTION:
  // 1. FROM users
  // 2. WHERE age > 25 → filter to age > 25 rows
  // 3. GROUP BY department → group
  // 4. HAVING AVG(salary) > 50000 → filter groups
  // 5. SELECT → calculate aggregate
  
  const filtered = sampleData.filter(u => u.age > 25);
  const grouped = filtered.reduce((acc, user) => {
    const dept = user.department;
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(user);
    return acc;
  }, {} as Record<string, User[]>);
  
  const result = Object.entries(grouped)
    .map(([dept, users]) => ({
      department: dept,
      count: users.length,
      avg_salary: Math.round(users.reduce((sum, u) => sum + u.salary, 0) / users.length)
    }))
    .filter(g => g.avg_salary > 50000);
  
  console.log("SQL:", sql.trim());
  console.log("Result:", result);
}

// Example 3: ORDER BY and LIMIT
function example3_OrderByLimit() {
  console.log("\n--- EXAMPLE 3: ORDER BY and LIMIT ---");
  const sql = "SELECT name, salary FROM users ORDER BY salary DESC LIMIT 3";
  
  // EXECUTION:
  // 1. FROM users
  // 2. SELECT name, salary
  // 3. ORDER BY salary DESC
  // 4. LIMIT 3
  
  const result = sampleData
    .map(u => ({ name: u.name, salary: u.salary }))
    .sort((a, b) => b.salary - a.salary)
    .slice(0, 3);
  
  console.log("SQL:", sql);
  console.log("Result:", result);
}

// Example 4: N+1 Problem
function example4_N1Problem() {
  console.log("\n--- EXAMPLE 4: N+1 Problem ---");
  console.log("❌ BAD - Multiple queries:");
  console.log("  Query 1: SELECT * FROM users WHERE department = 'IT';");
  console.log("  Query 2: SELECT salary FROM salaries WHERE user_id = 1;");
  console.log("  Query 3: SELECT salary FROM salaries WHERE user_id = 2;");
  console.log("  Query 5: SELECT salary FROM salaries WHERE user_id = 5;");
  console.log("  Total: 4 queries (1 + 3 IT users)");
  
  console.log("\n✓ GOOD - Single JOIN:");
  console.log("  Query: SELECT u.name, s.salary FROM users u");
  console.log("         LEFT JOIN salaries s ON u.id = s.user_id");
  console.log("         WHERE u.department = 'IT';");
  console.log("  Total: 1 query");
}

// Example 5: Index Impact
function example5_IndexImpact() {
  console.log("\n--- EXAMPLE 5: Index Impact ---");
  
  console.log("WITHOUT INDEX (Full Table Scan):");
  console.log("  SELECT * FROM users WHERE email = 'john@example.com';");
  console.log("  ↳ Database must scan all rows");
  console.log("  ↳ Time: O(n) - Slow with big tables");
  
  console.log("\nWITH INDEX ON email (B-Tree Lookup):");
  console.log("  CREATE INDEX idx_email ON users(email);");
  console.log("  SELECT * FROM users WHERE email = 'john@example.com';");
  console.log("  ↳ Database uses index to find row instantly");
  console.log("  ↳ Time: O(log n) - Fast!");
}

// Run examples
example1_SelectWithWhere();
example2_GroupByHaving();
example3_OrderByLimit();
example4_N1Problem();
example5_IndexImpact();

// ============================================================================
// PHẦN 6: PERFORMANCE COMPARISON
// ============================================================================

console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║            6. PERFORMANCE COMPARISON - TỐT vs XẤU                          ║
╚════════════════════════════════════════════════════════════════════════════╝
`);

const comparison = `
┌─────────────────────────┬──────────────────────┬──────────────────────┐
│ Scenario                │ ❌ Bad Query          │ ✓ Good Query         │
├─────────────────────────┼──────────────────────┼──────────────────────┤
│ SELECT columns          │ SELECT *             │ SELECT id, name      │
│                         │ (load all columns)   │ (only needed cols)   │
│ Time: 100ms             │ Time: 10ms           │                      │
├─────────────────────────┼──────────────────────┼──────────────────────┤
│ WHERE with function     │ WHERE YEAR(created)  │ WHERE created >= ...│
│                         │ = 2023               │ AND created < ...    │
│ (Index ignored)         │ Time: 5000ms         │ Time: 50ms           │
├─────────────────────────┼──────────────────────┼──────────────────────┤
│ LIKE pattern            │ WHERE name LIKE      │ WHERE name LIKE      │
│                         │ '%john%'             │ 'john%'              │
│ (No index)              │ Time: 3000ms         │ Time: 100ms (indexed)│
├─────────────────────────┼──────────────────────┼──────────────────────┤
│ N+1 Problem             │ Loop query 1000x     │ Single JOIN          │
│                         │ Time: 10000ms        │ Time: 100ms          │
├─────────────────────────┼──────────────────────┼──────────────────────┤
│ LIMIT OFFSET big        │ LIMIT 10 OFFSET      │ Keyset pagination    │
│                         │ 1000000              │ WHERE id > last_id   │
│ (Skip all rows)         │ Time: 5000ms         │ Time: 50ms           │
├─────────────────────────┼──────────────────────┼──────────────────────┤
│ Subquery in SELECT      │ SELECT (SELECT       │ SELECT u.*, COUNT(o)│
│                         │ COUNT FROM orders)   │ FROM users u         │
│ (1M queries)            │ Time: 30000ms        │ LEFT JOIN orders o   │
│                         │                      │ Time: 200ms          │
└─────────────────────────┴──────────────────────┴──────────────────────┘

═════════════════════════════════════════════════════════════════════════════
PERFORMANCE TIPS:
1. Indexes on WHERE, JOIN, ORDER BY columns → 10-100x faster
2. SELECT only needed columns → 5-10x faster
3. Use WHERE to filter early → 50-100x faster
4. Avoid N+1 queries → 1000x faster
5. Use keyset pagination → 100x faster than LIMIT OFFSET
6. Denormalize if read-heavy → 2-5x faster
7. Cache frequently accessed data → 1000x faster
`;

console.log(comparison);

// ============================================================================
// PHẦN 7: INTERVIEW Q&A
// ============================================================================

console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                    7. INTERVIEW QUESTIONS & ANSWERS                       ║
╚════════════════════════════════════════════════════════════════════════════╝
`);

const interviewQA = `
Q1: GIẢI THÍCH THỨ TỰ THỰC TỊ CỦA SQL
─────────────────────────────────────────────────────────────────────────────
A: SQL thực thi theo thứ tự:
   1. FROM - Đọc bảng
   2. WHERE - Lọc dòng
   3. GROUP BY - Nhóm dữ liệu
   4. HAVING - Lọc nhóm
   5. SELECT - Chọn cột
   6. ORDER BY - Sắp xếp
   7. LIMIT - Giới hạn kết quả

   Điều quan trọng: Thứ tự thực thi ≠ thứ tự viết!

Q2: KHÁC BIỆT GIỮA WHERE VÀ HAVING
─────────────────────────────────────────────────────────────────────────────
A: WHERE:
   - Lọc TRƯỚC KHI nhóm (row-level filtering)
   - Hoạt động trên dữ liệu gốc
   - Không thể dùng aggregate functions
   
   HAVING:
   - Lọc SAU KHI nhóm (group-level filtering)
   - Hoạt động trên group results
   - Dùng được aggregate functions (COUNT, SUM, AVG)

   VÍ DỤ:
   SELECT dept, COUNT(*) 
   FROM emp
   WHERE salary > 30000      ← Chỉ lấy emp có salary > 30k
   GROUP BY dept
   HAVING COUNT(*) > 5;      ← Chỉ lấy dept có > 5 emp

Q3: N+1 QUERY PROBLEM LÀ GÌ VÀ GIẢI PHÁP
─────────────────────────────────────────────────────────────────────────────
A: N+1 Problem: 
   - 1 query lấy users → N queries lấy orders cho mỗi user
   - Tổng: 1 + N queries (1 triệu users = 1 triệu queries!)

   GIẢI PHÁP:
   1. JOIN 1 lần (Best):
      SELECT u.*, o.* FROM users u JOIN orders o ON u.id = o.user_id;

   2. Batch query:
      Query 1: SELECT * FROM users;
      Query 2: SELECT * FROM orders WHERE user_id IN (user_ids);

   3. Eager loading:
      ORM: User.with('orders').get();

Q4: INDEX HOẠT ĐỘNG NHƯ THẾ NÀO
─────────────────────────────────────────────────────────────────────────────
A: INDEX là cấu trúc dữ liệu (B-Tree, Hash, etc.) giúp tìm dữ liệu nhanh.

   KHÔNG CÓ INDEX (Full table scan):
   - Database phải quét từ dòng 1 đến 1 triệu
   - Time: O(n)

   CÓ INDEX:
   - Database sử dụng B-Tree để nhảy đến dòng cần tìm
   - Time: O(log n)
   - Tốc độ: 10-100x nhanh hơn

   VÍ DỤ:
   CREATE INDEX idx_email ON users(email);
   SELECT * FROM users WHERE email = 'john@example.com';
   ↳ Database tìm được trong microseconds

Q5: KHI NÀO INDEX KHÔNG ĐƯỢC SỬ DỤNG
─────────────────────────────────────────────────────────────────────────────
A: Index KHÔNG được dùng khi:
   1. LIKE '%text' (% ở đầu)
      ❌ SELECT * FROM users WHERE name LIKE '%john%';
      ✓ SELECT * FROM users WHERE name LIKE 'john%';

   2. Functions trong WHERE
      ❌ WHERE YEAR(created_at) = 2023;
      ✓ WHERE created_at >= '2023-01-01' AND created_at < '2024-01-01';

   3. Type conversion
      ❌ WHERE user_id = '123'; (string)
      ✓ WHERE user_id = 123; (number)

   4. OR mà không có index trên cả cột
      ❌ WHERE name = 'John' OR age = 25; (chỉ có index trên name)

   5. NOT IN / NOT EQUAL
      ❌ WHERE age != 25;
      ✓ WHERE age > 25 OR age < 25;

Q6: QUERY OPTIMIZATION TECHNIQUES
─────────────────────────────────────────────────────────────────────────────
A: 1. Dùng indexes trên WHERE, JOIN, ORDER BY, GROUP BY
   2. SELECT chỉ cột cần thiết (không SELECT *)
   3. Dùng WHERE để lọc sớm (trước GROUP BY)
   4. Tránh functions trong WHERE
   5. Dùng JOIN thay vì subquery
   6. Dùng LIMIT với OFFSET cẩn thận
   7. Denormalize cho read-heavy operations
   8. Batch queries thay vì N+1

Q7: EXPLAIN / QUERY PLAN CHO BIẾT ĐIỀU GÌ
─────────────────────────────────────────────────────────────────────────────
A: EXPLAIN cho biết:
   - type: const < eq_ref < ref < range < index < ALL
     ↑ Tốt                                  ↑ Xấu
   
   - rows: Số dòng phải quét (thấp = tốt)
   
   - key: Index nào được dùng
   
   - Extra: 
     "Using index" = Good (tìm dữ liệu từ index)
     "Using where" = OK (lọc dữ liệu)
     "Using temporary" = Bad (tạo temp table)
     "Using filesort" = Bad (sort ngoài memory)

Q8: SUBQUERY VÀ JOIN KHÁC BIỆT GÌ
─────────────────────────────────────────────────────────────────────────────
A: SUBQUERY:
   SELECT * FROM users WHERE id IN (
     SELECT user_id FROM orders WHERE amount > 1000
   );

   JOIN:
   SELECT u.* FROM users u
   INNER JOIN orders o ON u.id = o.user_id
   WHERE o.amount > 1000;

   KHÁC BIỆT:
   - JOIN thường nhanh hơn (optimizer tốt hơn)
   - Subquery dễ đọc hơn
   - Correlated subquery rất chậm (chạy lặp)

Q9: DENORMALIZATION LÀ GÌ VÀ KHI NÀO DÙNG
─────────────────────────────────────────────────────────────────────────────
A: DENORMALIZATION: Duplicate dữ liệu để tối ưu read performance
   
   EXAMPLE:
   Normalized (5 JOINs để lấy order total):
   - orders table, order_items, products, prices
   
   Denormalized (1 query):
   - orders table có sẵn total_amount

   KHI DÙNG:
   - Read-heavy systems (display orders, not update often)
   - Real-time analytics
   - Performance critical

   TRADEOFF:
   + Read nhanh (5x faster)
   - Write chậm (update nhiều table)
   - Data có thể inconsistent

Q10: PAGINATION - LIMIT OFFSET vs KEYSET
─────────────────────────────────────────────────────────────────────────────
A: LIMIT OFFSET:
   SELECT * FROM users ORDER BY id LIMIT 10 OFFSET 990000;
   ❌ Database phải skip 990k dòng (slow!)
   ❌ Người dùng ít khi đến trang cuối

   KEYSET PAGINATION:
   SELECT * FROM users WHERE id > last_id ORDER BY id LIMIT 10;
   ✓ Database nhảy thẳng đến last_id (fast!)
   ✓ Tốc độ không thay đổi bất kể page nào
   
   PERFORMANCE:
   LIMIT 10 OFFSET 1: ~5ms
   LIMIT 10 OFFSET 100000: ~500ms
   Keyset pagination: ~5ms (lúc nào cũng nhanh)
`;

console.log(interviewQA);

console.log(`
╔════════════════════════════════════════════════════════════════════════════╗
║                           CHEAT SHEET                                      ║
╚════════════════════════════════════════════════════════════════════════════╝

BASIC QUERIES:
  SELECT * FROM table WHERE condition;
  INSERT INTO table (col1, col2) VALUES (val1, val2);
  UPDATE table SET col = val WHERE condition;
  DELETE FROM table WHERE condition;

INDEXES:
  CREATE INDEX idx_name ON table(column);
  CREATE COMPOSITE INDEX ON table(col1, col2);
  CREATE UNIQUE INDEX ON table(column);
  CREATE FULLTEXT INDEX ON table(column);

AGGREGATES:
  COUNT(*), SUM(col), AVG(col), MIN(col), MAX(col)

JOINS:
  INNER JOIN - Only matching rows
  LEFT JOIN - All left rows + matching right
  RIGHT JOIN - All right rows + matching left
  FULL OUTER JOIN - All rows from both tables
  CROSS JOIN - Cartesian product

EXECUTION ORDER:
  FROM → WHERE → GROUP BY → HAVING → SELECT → ORDER BY → LIMIT

OPTIMIZATION RULES:
  1. Index on WHERE, JOIN, ORDER BY columns
  2. SELECT only needed columns
  3. WHERE before GROUP BY
  4. JOIN instead of subquery
  5. LIKE 'text%' instead of '%text%'
  6. Avoid functions in WHERE
  7. Keyset pagination instead of LIMIT OFFSET
  8. Batch queries instead of N+1

COMMON MISTAKES:
  ❌ SELECT * (load all columns)
  ❌ LIKE '%text%' (index ignored)
  ❌ Functions in WHERE (index ignored)
  ❌ N+1 queries (1M queries!)
  ❌ LIMIT OFFSET large number (slow)
  ❌ Correlated subquery (runs N times)
  ❌ NOT IN with NULL (returns nothing)
  ❌ OR without index (might not use index)
`);
