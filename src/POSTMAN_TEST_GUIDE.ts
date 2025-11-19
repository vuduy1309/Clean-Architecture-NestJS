/**
 * POSTMAN TEST GUIDE
 * 
 * Test API endpoints ngay với Postman
 */

// ============================================================================
// 1. SETUP (chạy trước)
// ============================================================================

/**
 * Install dependencies:
 * npm install bcrypt jsonwebtoken
 * 
 * Compile TypeScript:
 * npm run build
 * 
 * Run server:
 * npm run start
 * 
 * Server chạy trên: http://localhost:3000
 */

// ============================================================================
// 2. POSTMAN TEST REQUESTS
// ============================================================================

/**
 * ========== TEST 1: DELETE ALL USERS (Reset) ==========
 * 
 * Method: DELETE
 * URL: http://localhost:3000/auth/users
 * Headers: (none)
 * Body: (none)
 * 
 * Expected Response (200):
 * {
 *   "message": "All users deleted"
 * }
 */

/**
 * ========== TEST 2: REGISTER USER #1 ==========
 * 
 * Method: POST
 * URL: http://localhost:3000/auth/register
 * Headers:
 *   Content-Type: application/json
 * 
 * Body (JSON):
 * {
 *   "email": "john@example.com",
 *   "username": "john",
 *   "password": "password123"
 * }
 * 
 * Expected Response (201):
 * {
 *   "message": "User registered successfully",
 *   "user": {
 *     "id": 1,
 *     "email": "john@example.com",
 *     "username": "john"
 *   }
 * }
 * 
 * Timeline:
 * T=0ms:    Nhận request
 * T=0-5ms:  Dispatch hash tới worker
 * T=5ms:    Main thread xử lý requests khác (FREE!)
 * T=100ms:  Worker xong hash
 * T=115ms:  User tạo xong, response
 * Total: ~115ms (main thread KHÔNG bị block)
 */

/**
 * ========== TEST 3: REGISTER USER #2 ==========
 * 
 * Method: POST
 * URL: http://localhost:3000/auth/register
 * Headers:
 *   Content-Type: application/json
 * 
 * Body (JSON):
 * {
 *   "email": "jane@example.com",
 *   "username": "jane",
 *   "password": "password456"
 * }
 * 
 * Expected Response (201):
 * {
 *   "message": "User registered successfully",
 *   "user": {
 *     "id": 2,
 *     "email": "jane@example.com",
 *     "username": "jane"
 *   }
 * }
 */

/**
 * ========== TEST 4: LOGIN (Correct Password) ==========
 * 
 * Method: POST
 * URL: http://localhost:3000/auth/login
 * Headers:
 *   Content-Type: application/json
 * 
 * Body (JSON):
 * {
 *   "email": "john@example.com",
 *   "password": "password123"
 * }
 * 
 * Expected Response (200):
 * {
 *   "message": "Login successful",
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiam9obkBleGFtcGxlLmNvbSIsInVzZXJuYW1lIjoiam9obiIsImlhdCI6MTYzNDU2Nzg5MCwiZXhwIjoxNjM0NjU0MjkwfQ.xyz...",
 *   "user": {
 *     "id": 1,
 *     "email": "john@example.com",
 *     "username": "john"
 *   }
 * }
 * 
 * ⚠️ Copy token (từ "eyJ..." tới "...xyz") để dùng ở test 5
 * 
 * Timeline:
 * T=0ms:    Nhận request
 * T=0-2ms:  Query user từ mock DB
 * T=2-5ms:  Dispatch compare tới worker
 * T=5ms:    Main thread FREE!
 * T=100ms:  Worker xong compare
 * T=115ms:  Token tạo xong, response
 * Total: ~115ms (main thread KHÔNG bị block!)
 */

/**
 * ========== TEST 5: LOGIN (Wrong Password) ==========
 * 
 * Method: POST
 * URL: http://localhost:3000/auth/login
 * Headers:
 *   Content-Type: application/json
 * 
 * Body (JSON):
 * {
 *   "email": "john@example.com",
 *   "password": "wrongpassword"
 * }
 * 
 * Expected Response (401):
 * {
 *   "error": "Invalid password"
 * }
 */

/**
 * ========== TEST 6: VERIFY TOKEN ==========
 * 
 * Method: GET
 * URL: http://localhost:3000/auth/verify
 * Headers:
 *   Authorization: Bearer <paste-token-from-test-4-here>
 * 
 * Example:
 * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImVtYWlsIjoiam9obkBleGFtcGxlLmNvbSIsInVzZXJuYW1lIjoiam9obiIsImlhdCI6MTYzNDU2Nzg5MCwiZXhwIjoxNjM0NjU0MjkwfQ.xyz...
 * 
 * Expected Response (200):
 * {
 *   "valid": true,
 *   "payload": {
 *     "userId": 1,
 *     "email": "john@example.com",
 *     "username": "john",
 *     "iat": 1634567890,
 *     "exp": 1634654290
 *   }
 * }
 */

/**
 * ========== TEST 7: GET ALL USERS ==========
 * 
 * Method: GET
 * URL: http://localhost:3000/auth/users
 * Headers: (none)
 * Body: (none)
 * 
 * Expected Response (200):
 * [
 *   {
 *     "id": 1,
 *     "email": "john@example.com",
 *     "username": "john"
 *   },
 *   {
 *     "id": 2,
 *     "email": "jane@example.com",
 *     "username": "jane"
 *   }
 * ]
 */

/**
 * ========== TEST 8: REGISTER INVALID EMAIL ==========
 * 
 * Method: POST
 * URL: http://localhost:3000/auth/register
 * Headers:
 *   Content-Type: application/json
 * 
 * Body (JSON) - Email đã tồn tại:
 * {
 *   "email": "john@example.com",
 *   "username": "john2",
 *   "password": "password123"
 * }
 * 
 * Expected Response (400):
 * {
 *   "error": "Email already exists"
 * }
 */

/**
 * ========== TEST 9: REGISTER WEAK PASSWORD ==========
 * 
 * Method: POST
 * URL: http://localhost:3000/auth/register
 * Headers:
 *   Content-Type: application/json
 * 
 * Body (JSON) - Password < 6 chars:
 * {
 *   "email": "test@example.com",
 *   "username": "test",
 *   "password": "123"
 * }
 * 
 * Expected Response (400):
 * {
 *   "error": "Password must be at least 6 characters"
 * }
 */

// ============================================================================
// 3. POSTMAN COLLECTION (Import này)
// ============================================================================

/**
 * Nếu muốn import vào Postman:
 * 
 * 1. Cấu trúc folder:
 *    Auth Tests (collection)
 *    ├── 1. Reset (DELETE users)
 *    ├── 2. Register User #1
 *    ├── 3. Register User #2
 *    ├── 4. Login (Correct)
 *    ├── 5. Login (Wrong)
 *    ├── 6. Verify Token
 *    ├── 7. Get All Users
 *    ├── 8. Register Invalid Email
 *    └── 9. Register Weak Password
 * 
 * 2. Chạy tests theo thứ tự (để data consistent)
 * 
 * 3. Dùng {{token}} variable để store JWT token:
 *    - Trong test 4 (login), lấy token
 *    - Gán vào {{token}} variable
 *    - Dùng ở test 6 (verify)
 * 
 * Postman script (nếu setup):
 * 
 * // Test 4 (Login) - Set token variable
 * if (pm.response.code === 200) {
 *   var jsonData = pm.response.json();
 *   pm.environment.set("token", jsonData.token);
 * }
 * 
 * // Test 6 (Verify) - Use token variable
 * Authorization: Bearer {{token}}
 */

// ============================================================================
// 4. PERFORMANCE TESTING
// ============================================================================

/**
 * Concurrent Login Requests (test load)
 * 
 * Cách 1: Dùng Postman Runner
 * - Select test "Login (Correct)" request
 * - Click Runner
 * - Set iterations: 100
 * - Run
 * 
 * Expected:
 * - 100 concurrent logins
 * - ~1-2 seconds total (không 5-10 seconds!)
 * - Throughput: ~50-100 requests/second
 * - CPU usage: moderate (workers handle bcrypt)
 * 
 * Cách 2: Dùng load testing tool (autocannon)
 * 
 * npm install -D autocannon
 * 
 * npx autocannon \
 *   -c 100 \
 *   -d 30 \
 *   -m POST \
 *   -H 'Content-Type: application/json' \
 *   -b '{"email":"john@example.com","password":"password123"}' \
 *   http://localhost:3000/auth/login
 * 
 * Expected output:
 * Throughput: ~100 req/s (4x faster than synchronous)
 * Latency: p50 ~50ms, p99 ~150ms
 */

// ============================================================================
// 5. ARCHITECTURE SUMMARY
// ============================================================================

/**
 * Request Flow:
 * 
 * POST /auth/login
 *   ↓
 * AuthController.login()
 *   ↓
 * AuthService.login()
 *   ├─ Query user từ mock DB (sync, fast)
 *   │
 *   ├─ Dispatch bcrypt.compare tới worker (ASYNC, NON-BLOCKING)
 *   │  ├─ Main thread continues (FREE!)
 *   │  └─ Worker thread: bcrypt.compare (100ms CPU work)
 *   │
 *   └─ Wait for worker result
 *       ├─ Generate JWT token
 *       └─ Return response
 * 
 * Result:
 * ✓ Main thread KHÔNG bị block (có thể xử lý 100+ logins song song)
 * ✓ Worker threads xử lý bcrypt (CPU-intensive) song song
 * ✓ Throughput: 100+ requests/second (vs 10 req/s synchronous)
 */

console.log('✓ Postman test guide created');
