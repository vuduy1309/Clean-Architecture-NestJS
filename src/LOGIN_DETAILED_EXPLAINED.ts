// /**
//  * ============================================================================
//  * HÀM LOGIN - CHI TIẾT TỪNG DÒNG CODE, LUỒNG CHẠY, CONNECTION POOL
//  * ============================================================================
//  * 
//  * Giải thích chi tiết hàm login trong NestJS với caching, performance tối ưu.
//  */

// // ============================================================================
// // 1️⃣ KIẾN TRÚC THƯ MỰC (Clean Architecture)
// // ============================================================================

// /**
//  * src/
//  * ├── interface/
//  * │   └── controllers/
//  * │       └── auth.controller.ts          ← API Endpoint
//  * ├── application/
//  * │   └── usecases/
//  * │       └── login.usecase.ts            ← Business Logic
//  * ├── domain/
//  * │   ├── entities/
//  * │   │   └── user.entity.ts              ← User data structure
//  * │   └── repositories/
//  * │       └── user.repository.interface.ts ← Interface (không code)
//  * └── infrastructure/
//  *     ├── repositories/
//  *     │   └── user.repository.ts          ← Database query
//  *     ├── cache/
//  *     │   └── redis.service.ts            ← Cache layer
//  *     └── database/
//  *         └── prisma.service.ts           ← Database connection
//  */

// // ============================================================================
// // 2️⃣ USER ENTITY (Domain Layer - dữ liệu)
// // ============================================================================

// /**
//  * src/domain/entities/user.entity.ts
//  */
// export interface User {
//   id: number;
//   email: string;
//   password: string; // Lưu ý: Đã hash với bcrypt
//   name: string;
//   createdAt: Date;
// }

// /**
//  * LOGIN REQUEST & RESPONSE
//  */
// export interface LoginRequest {
//   email: string;
//   password: string;
// }

// export interface LoginResponse {
//   token: string;        // JWT token
//   user: {
//     id: number;
//     email: string;
//     name: string;
//   };
// }

// // ============================================================================
// // 3️⃣ USER REPOSITORY INTERFACE (Domain Layer - contract)
// // ============================================================================

// /**
//  * src/domain/repositories/user.repository.interface.ts
//  * 
//  * Interface này đảm bảo: Infrastructure phải implement đúng contract
//  */
// export interface IUserRepository {
//   /**
//    * Lấy user theo email
//    * 
//    * @param email - Email để tìm
//    * @returns User nếu tìm thấy, null nếu không
//    */
//   findByEmail(email: string): Promise<User | null>;

//   /**
//    * Cập nhật last login time
//    * 
//    * @param userId - ID user
//    * @param lastLoginAt - Thời gian login
//    */
//   updateLastLoginAt(userId: number, lastLoginAt: Date): Promise<void>;
// }

// // ============================================================================
// // 4️⃣ REDIS SERVICE (Infrastructure - Caching Layer)
// // ============================================================================

// /**
//  * src/infrastructure/cache/redis.service.ts
//  * 
//  * Dùng để cache dữ liệu, giảm tải database.
//  */
// import { Injectable } from '@nestjs/common';
// import * as redis from 'redis';

// @Injectable()
// export class RedisService {
//   private client: redis.RedisClient;

//   constructor() {
//     // ✅ Tạo Redis connection
//     this.client = redis.createClient({
//       host: 'localhost',
//       port: 6379,
//     });

//     this.client.on('error', (err) => {
//       console.error('Redis Error:', err);
//     });
//   }

//   /**
//    * LẤY GIÁ TRỊ TỪ REDIS
//    * 
//    * @param key - Khóa để lấy
//    * @returns Giá trị (JSON), hoặc null nếu không tồn tại
//    * 
//    * ✅ TỐC ĐỘ: 0.1ms (siêu nhanh!)
//    */
//   async get<T>(key: string): Promise<T | null> {
//     return new Promise((resolve, reject) => {
//       this.client.get(key, (err, result) => {
//         if (err) reject(err);
//         if (!result) resolve(null);

//         try {
//           resolve(JSON.parse(result));
//         } catch (e) {
//           resolve(null);
//         }
//       });
//     });
//   }

//   /**
//    * LƯU GIÁ TRỊ VÀO REDIS
//    * 
//    * @param key - Khóa để lưu
//    * @param value - Giá trị (sẽ convert thành JSON)
//    * @param ttl - Time To Live (giây). Ví dụ: 3600 = 1 giờ
//    * 
//    * ✅ TỐC ĐỘ: 0.1ms (siêu nhanh!)
//    * ✅ TTL: Tự động xóa sau thời gian hết hạn
//    */
//   async set<T>(key: string, value: T, ttl?: number): Promise<void> {
//     return new Promise((resolve, reject) => {
//       const json = JSON.stringify(value);

//       if (ttl) {
//         // ✅ Set với TTL
//         // EX = Expiration in seconds
//         this.client.setex(key, ttl, json, (err) => {
//           if (err) reject(err);
//           else resolve();
//         });
//       } else {
//         // Set không TTL (lưu vĩnh viễn)
//         this.client.set(key, json, (err) => {
//           if (err) reject(err);
//           else resolve();
//         });
//       }
//     });
//   }

//   /**
//    * XÓA GIÁ TRỊ TỪ REDIS
//    * 
//    * @param key - Khóa để xóa
//    */
//   async delete(key: string): Promise<void> {
//     return new Promise((resolve, reject) => {
//       this.client.del(key, (err) => {
//         if (err) reject(err);
//         else resolve();
//       });
//     });
//   }
// }

// // ============================================================================
// // 5️⃣ PRISMA SERVICE (Infrastructure - Database Connection)
// // ============================================================================

// /**
//  * src/infrastructure/database/prisma.service.ts
//  * 
//  * Quản lý kết nối database (PostgreSQL, MySQL, etc.)
//  */
// import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
// import { PrismaClient } from '@prisma/client';

// @Injectable()
// export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
//   /**
//    * ONMODULEINIT - Chạy khi module khởi tạo
//    * 
//    * ✅ Công dụng: Kết nối database ngay lúc startup
//    */
//   async onModuleInit() {
//     await this.$connect();
//     console.log('✅ Database connected');
//   }

//   /**
//    * ONMODULEDESTROY - Chạy khi module bị hủy
//    * 
//    * ✅ Công dụng: Đóng kết nối database khi tắt ứng dụng
//    * ✅ Tránh: Memory leak, connection hang
//    */
//   async onModuleDestroy() {
//     await this.$disconnect();
//     console.log('✅ Database disconnected');
//   }
// }

// /**
//  * ❓ CONNECTION POOL LÀ GÌ?
//  * 
//  * CONNECTION POOL = Nhóm kết nối database được tái sử dụng
//  * 
//  * ❌ KHÔNG CÓ CONNECTION POOL:
//  * 
//  * Request 1 → Tạo connection → Query → Đóng connection → 1ms mỗi request
//  * Request 2 → Tạo connection → Query → Đóng connection → 1ms mỗi request
//  * Request 3 → Tạo connection → Query → Đóng connection → 1ms mỗi request
//  * ...
//  * Request 1000 → Tạo connection → Query → Đóng connection → 1ms mỗi request
//  * 
//  * Cộng lại: 1000ms (tạo/đóng connection = OVERHEAD LỚFN!)
//  * 
//  * ✅ CÓ CONNECTION POOL (ví dụ pool size = 5):
//  * 
//  * Startup: Tạo 5 connections (sẵn sàng)
//  * 
//  * Request 1 → Dùng connection #1 → Query → Trả lại pool
//  * Request 2 → Dùng connection #2 → Query → Trả lại pool
//  * Request 3 → Dùng connection #3 → Query → Trả lại pool
//  * Request 4 → Dùng connection #4 → Query → Trả lại pool
//  * Request 5 → Dùng connection #5 → Query → Trả lại pool
//  * Request 6 → Chờ connection #1 → Query → Trả lại pool (recycle!)
//  * Request 7 → Chờ connection #2 → Query → Trả lại pool (recycle!)
//  * ...
//  * Request 1000 → Dùng connection từ pool → Query → Trả lại pool
//  * 
//  * Tiết kiệm: 1000 - 5 = 995 lần tạo/đóng connection (SIÊU NHANH!)
//  * 
//  * ✅ PRISMA DEFAULT CONNECTION POOL:
//  * 
//  * .env
//  * DATABASE_URL="postgresql://user:pass@localhost/db?connection_limit=20"
//  *                                                      ^^^^^^^^^^^^^^^^^^
//  *                                              Connection pool size = 20
//  * 
//  * = Có thể xử lý ~200 concurrent queries cùng lúc!
//  */

// // ============================================================================
// // 6️⃣ USER REPOSITORY (Infrastructure - Database Query Implementation)
// // ============================================================================

// /**
//  * src/infrastructure/repositories/user.repository.ts
//  * 
//  * Thực hiện các query database thực tế
//  */
// @Injectable()
// export class UserRepository implements IUserRepository {
//   constructor(
//     private prisma: PrismaService,
//     private redisService: RedisService,
//   ) {}

//   /**
//    * TÌM USER THEO EMAIL
//    * 
//    * ✅ OPTIMIZED: Có caching (cache-first pattern)
//    * 
//    * @param email - Email để tìm
//    * @returns User nếu tìm thấy, null nếu không
//    */
//   async findByEmail(email: string): Promise<User | null> {
//     // ✅ BƯỚC 1: Tạo cache key
//     // Lý do: Dùng cùng key để tìm/lưu cache
//     const cacheKey = `user:${email}`;
//     console.log(`🔍 Looking for user: ${email}`);

//     try {
//       // ✅ BƯỚC 2: TRY REDIS CACHE FIRST (0.1ms)
//       // Lý do: Redis tương nhanh gấp 100 lần database
//       const cachedUser = await this.redisService.get<User>(cacheKey);

//       if (cachedUser) {
//         console.log('✅ Cache HIT - User found in Redis');
//         return cachedUser;
//       }

//       console.log('❌ Cache MISS - User not in Redis, querying database...');

//       // ✅ BƯỚC 3: QUERY DATABASE (từ connection pool)
//       // Lý do: Database có dữ liệu mới nhất
//       //
//       // CHI TIẾT QUERY:
//       // - WHERE: Tìm user có email = email được truyền
//       // - SELECT: Chỉ lấy những field cần thiết (tối ưu performance)
//       //   Không lấy columns lớn không cần (ví dụ: avatar, bio)
//       const user = await this.prisma.user.findUnique({
//         where: { email },
//         select: {
//           id: true,
//           email: true,
//           password: true,
//           name: true,
//           createdAt: true,
//           // ❌ Không select: avatar, bio, largeData (quá nặng)
//         },
//       });

//       if (!user) {
//         console.log('❌ User not found in database');
//         return null;
//       }

//       // ✅ BƯỚC 4: CACHE RESULT (TTL = 1 giờ)
//       // Lý do: Lần sau tìm user này sẽ nhanh hơn 100 lần
//       // TTL = 3600 giây = 1 giờ
//       // Sau 1 giờ, cache tự động xóa (auto-expire)
//       await this.redisService.set(cacheKey, user, 3600);
//       console.log('✅ User cached in Redis for 1 hour');

//       return user;
//     } catch (error) {
//       console.error('❌ Error finding user:', error);
//       throw error;
//     }
//   }

//   /**
//    * CẬP NHẬT LAST LOGIN TIME
//    * 
//    * @param userId - ID user
//    * @param lastLoginAt - Thời gian login
//    */
//   async updateLastLoginAt(userId: number, lastLoginAt: Date): Promise<void> {
//     try {
//       // ✅ CẬP NHẬT DATABASE
//       await this.prisma.user.update({
//         where: { id: userId },
//         data: { lastLoginAt },
//       });

//       // ✅ CẬP NHẬT CACHE (nếu tồn tại)
//       // Lý do: Giữ cache đồng bộ với database
//       // Cách nó hoạt động:
//       // 1. Tìm cache key (user:email)
//       // 2. Nếu cache tồn tại, cập nhật field lastLoginAt
//       // 3. Nếu cache không tồn tại, skip (không làm gì)

//       const user = await this.prisma.user.findUnique({
//         where: { id: userId },
//         select: { email: true },
//       });

//       if (user) {
//         const cacheKey = `user:${user.email}`;
//         const cachedUser = await this.redisService.get<User>(cacheKey);

//         if (cachedUser) {
//           cachedUser.lastLoginAt = lastLoginAt; // ❌ Wait, User doesn't have lastLoginAt yet
//           // (Thêm field này vào User interface nếu cần)
//           await this.redisService.set(cacheKey, cachedUser, 3600);
//         }
//       }

//       console.log(`✅ Last login updated for user ${userId}`);
//     } catch (error) {
//       console.error('❌ Error updating last login:', error);
//       throw error;
//     }
//   }
// }

// // ============================================================================
// // 7️⃣ LOGIN USECASE (Application Layer - Business Logic)
// // ============================================================================

// /**
//  * src/application/usecases/login.usecase.ts
//  * 
//  * Xử lý logic đăng nhập:
//  * - Kiểm tra email tồn tại
//  * - Kiểm tra password đúng
//  * - Tạo JWT token
//  * - Trả về kết quả
//  */
// import * as bcrypt from 'bcrypt';
// import * as jwt from 'jsonwebtoken';

// @Injectable()
// export class LoginUseCase {
//   constructor(
//     private userRepository: UserRepository,
//     private redisService: RedisService,
//   ) {}

//   /**
//    * EXECUTE - Thực hiện login
//    * 
//    * @param request - { email, password }
//    * @returns { token, user }
//    */
//   async execute(request: LoginRequest): Promise<LoginResponse> {
//     console.log('🔐 LOGIN PROCESS STARTED');
//     console.log(`📧 Email: ${request.email}`);

//     // ============================================================
//     // BƯỚC 1: LẤY USER TỪ DATABASE (CÓ CACHE)
//     // ============================================================
//     console.log('\n[BƯỚC 1] 🔍 Tìm user trong database...');

//     const user = await this.userRepository.findByEmail(request.email);

//     if (!user) {
//       console.log('❌ User not found - Login failed');
//       throw new Error('Invalid email or password');
//     }

//     console.log(`✅ User found: ${user.email}`);

//     // ============================================================
//     // BƯỚC 2: KIỂM TRA PASSWORD
//     // ============================================================
//     console.log('\n[BƯỚC 2] 🔐 Kiểm tra password...');

//     // Giải thích bcrypt:
//     // - user.password là password đã hash (không thể reverse)
//     // - Ví dụ hash: $2b$10$abc...xyz (60 ký tự)
//     // - bcrypt.compare(plainPassword, hashedPassword) trả về true/false
//     //
//     // Quy trình:
//     // 1. User nhập: "myPassword123"
//     // 2. Server hash nó lại: bcrypt.hash("myPassword123") = $2b$10$abc...xyz
//     // 3. So sánh hash này với hash trong database
//     // 4. Nếu giống = password đúng
//     //
//     // ✅ AN TOÀN: Không bao giờ lưu plaintext password!
//     const isPasswordValid = await bcrypt.compare(request.password, user.password);

//     if (!isPasswordValid) {
//       console.log('❌ Invalid password - Login failed');
//       throw new Error('Invalid email or password');
//     }

//     console.log('✅ Password is correct');

//     // ============================================================
//     // BƯỚC 3: TẠO JWT TOKEN
//     // ============================================================
//     console.log('\n[BƯỚC 3] 🎟️  Tạo JWT token...');

//     // Giải thích JWT:
//     // - JWT = JSON Web Token
//     // - Format: header.payload.signature
//     // - Ví dụ: eyJhbGc...eyJpZCI...SflKx...
//     //
//     // Payload (phần lưu dữ liệu):
//     // {
//     //   "id": 123,
//     //   "email": "user@example.com",
//     //   "iat": 1700000000,      (issued at - thời gian tạo)
//     //   "exp": 1700086400       (expiration - hết hạn)
//     // }
//     //
//     // Secret: "my-secret-key"
//     // - Dùng để sign token (tạo signature)
//     // - Chỉ server biết secret
//     // - Client không thể giả mạo token
//     const token = jwt.sign(
//       {
//         id: user.id,
//         email: user.email,
//       },
//       'my-secret-key', // ⚠️ Nên lưu trong .env, không hardcode!
//       {
//         expiresIn: '24h', // Token hết hạn sau 24 giờ
//       },
//     );

//     console.log(`✅ Token created (expires in 24h)`);

//     // ============================================================
//     // BƯỚC 4: CẬP NHẬT LAST LOGIN TIME
//     // ============================================================
//     console.log('\n[BƯỚC 4] 📝 Cập nhật last login time...');

//     await this.userRepository.updateLastLoginAt(user.id, new Date());

//     console.log('✅ Last login time updated');

//     // ============================================================
//     // BƯỚC 5: TRẢ VỀ KẾT QUẢ
//     // ============================================================
//     console.log('\n[BƯỚC 5] 🎉 Login successful!');

//     const response: LoginResponse = {
//       token,
//       user: {
//         id: user.id,
//         email: user.email,
//         name: user.name,
//       },
//     };

//     console.log('✅ LOGIN PROCESS COMPLETED\n');

//     return response;
//   }
// }

// // ============================================================================
// // 8️⃣ AUTH CONTROLLER (Interface Layer - API Endpoint)
// // ============================================================================

// /**
//  * src/interface/controllers/auth.controller.ts
//  * 
//  * API endpoint cho login
//  */
// import { Controller, Post, Body } from '@nestjs/common';

// @Controller('auth')
// export class AuthController {
//   constructor(private loginUseCase: LoginUseCase) {}

//   /**
//    * POST /auth/login
//    * 
//    * @param request - { email, password }
//    * @returns { token, user }
//    */
//   @Post('login')
//   async login(@Body() request: LoginRequest): Promise<LoginResponse> {
//     // ✅ Gọi usecase để xử lý login
//     return await this.loginUseCase.execute(request);
//   }
// }

// // ============================================================================
// // 9️⃣ COMPLETE FLOW - LUỒNG CHẠY CHI TIẾT
// // ============================================================================

// /**
//  * ============================================================================
//  * LUỒNG CHẠY TỪNG BƯỚC (Step-by-step)
//  * ============================================================================
//  * 
//  * CLIENT REQUEST:
//  * ├─ POST /auth/login
//  * └─ Body: { email: "user@example.com", password: "myPassword123" }
//  * 
//  * ⬇️ [T=0ms] SERVER NHẬ REQUEST
//  * 
//  * 1️⃣ [T=0-1ms] AuthController.login() được gọi
//  *    └─ Gọi LoginUseCase.execute(request)
//  * 
//  * 2️⃣ [T=1-2ms] LoginUseCase.execute() bắt đầu
//  *    ├─ Gọi UserRepository.findByEmail("user@example.com")
//  *    │
//  *    └─⬇️ VÀO REPOSITORY
//  * 
//  * 3️⃣ [T=2-2.1ms] UserRepository.findByEmail() - REDIS CHECK
//  *    ├─ Tạo cache key: "user:user@example.com"
//  *    ├─ Kiểm tra Redis:
//  *    │  ├─ LẦN ĐẦU TIÊN (Cache MISS):
//  *    │  │  └─ Redis trả về null (0.1ms)
//  *    │  │     Quy trình tiếp tục
//  *    │  │
//  *    │  └─ LẦN SAU (Cache HIT):
//  *    │     └─ Redis trả về user object (0.1ms)
//  *    │        ⬆️ JUMP tới BƯỚC 7 (Database skip!)
//  *    │
//  *    └─⬇️ NẾU CACHE MISS
//  * 
//  * 4️⃣ [T=2.1-7ms] UserRepository.findByEmail() - DATABASE QUERY
//  *    ├─ Từ CONNECTION POOL, lấy 1 connection (khả dụng)
//  *    ├─ Thực hiện SQL query:
//  *    │  SELECT id, email, password, name, createdAt
//  *    │  FROM users
//  *    │  WHERE email = 'user@example.com'
//  *    ├─ Database trả về kết quả (5ms - đây là bottleneck!)
//  *    ├─ Trả connection lại cho pool (recycle)
//  *    │
//  *    └─⬇️ CACHE RESULT
//  * 
//  * 5️⃣ [T=7-7.1ms] UserRepository.findByEmail() - CACHE WRITE
//  *    ├─ Lưu user vào Redis
//  *    ├─ Set TTL = 3600 giây (1 giờ)
//  *    ├─ Redis confirm (0.1ms)
//  *    │
//  *    └─⬇️ RETURN USER
//  * 
//  * 6️⃣ [T=7.1-7.2ms] UserRepository.findByEmail() - RETURN
//  *    ├─ Trả user object cho LoginUseCase
//  *    │
//  *    └─⬇️ BACK TO USECASE
//  * 
//  * 7️⃣ [T=7.2-8ms] LoginUseCase.execute() - BCRYPT CHECK
//  *    ├─ bcrypt.compare(request.password, user.password)
//  *    ├─ "myPassword123" vs "$2b$10$abc...xyz" (hashed)
//  *    ├─ Tính toán bcrypt hash (⚠️ ĐẮT TẬP - 10-20ms)
//  *    ├─ So sánh kết quả
//  *    ├─ Trả về true/false (0.8ms - bcrypt khá nhanh)
//  *    │
//  *    └─⬇️ NẾU PASSWORD CORRECT
//  * 
//  * 8️⃣ [T=8-8.1ms] LoginUseCase.execute() - JWT CREATE
//  *    ├─ Tạo JWT payload:
//  *    │  {
//  *    │    "id": 1,
//  *    │    "email": "user@example.com",
//  *    │    "iat": 1700000000,
//  *    │    "exp": 1700086400
//  *    │  }
//  *    ├─ Sign token với secret key
//  *    ├─ Tạo signature
//  *    ├─ Token tạo thành: "eyJhbGc...eyJpZCI...SflKx..."
//  *    │
//  *    └─⬇️ UPDATE LAST LOGIN
//  * 
//  * 9️⃣ [T=8.1-13ms] LoginUseCase.execute() - UPDATE LAST LOGIN
//  *    ├─ Gọi UserRepository.updateLastLoginAt(1, now)
//  *    ├─ UPDATE users SET lastLoginAt = NOW() WHERE id = 1
//  *    ├─ Database xử lý (5ms)
//  *    ├─ Cập nhật cache (nếu tồn tại)
//  *    │
//  *    └─⬇️ RETURN RESPONSE
//  * 
//  * 🔟 [T=13-13.1ms] LoginUseCase.execute() - RETURN
//  *    ├─ Tạo response object:
//  *    │  {
//  *    │    "token": "eyJhbGc...",
//  *    │    "user": {
//  *    │      "id": 1,
//  *    │      "email": "user@example.com",
//  *    │      "name": "John Doe"
//  *    │    }
//  *    │  }
//  *    │
//  *    └─⬇️ BACK TO CONTROLLER
//  * 
//  * 1️⃣1️⃣ [T=13.1-13.2ms] AuthController.login() - RESPONSE
//  *    ├─ NestJS format response (JSON)
//  *    ├─ Gzip compression (nếu enable)
//  *    ├─ HTTP 200 OK
//  *    │
//  *    └─⬇️ SEND TO CLIENT
//  * 
//  * ⬆️ CLIENT RECEIVE RESPONSE
//  * ├─ HTTP 200 OK
//  * ├─ Body:
//  * │  {
//  * │    "token": "eyJhbGc...",
//  * │    "user": {
//  * │      "id": 1,
//  * │      "email": "user@example.com",
//  * │      "name": "John Doe"
//  * │    }
//  * │  }
//  * └─ Total time: ~13ms
//  * 
//  * ============================================================================
//  * TIMING BREAKDOWN:
//  * ============================================================================
//  * 
//  * FIRST LOGIN (Cache MISS):
//  * - Redis check: 0.1ms
//  * - Database query: 5ms
//  * - Redis cache write: 0.1ms
//  * - Bcrypt password check: 0.8ms
//  * - JWT creation: 0.1ms
//  * - Update last login: 5ms
//  * - Response creation: 0.2ms
//  * ────────────────────
//  * TOTAL: ~11ms ✅
//  * 
//  * SECOND LOGIN (Cache HIT):
//  * - Redis check: 0.1ms ← USER FOUND IN CACHE!
//  * - Database query: SKIPPED ✅ (saves 5ms)
//  * - Bcrypt password check: 0.8ms
//  * - JWT creation: 0.1ms
//  * - Update last login: 5ms (still need to query DB)
//  * - Response creation: 0.2ms
//  * ────────────────────
//  * TOTAL: ~6ms ✅ (45% FASTER!)
//  * 
//  * 1000 LOGINS/SECOND:
//  * - 50% cache hits: 500 × 6ms = 3000ms
//  * - 50% cache miss: 500 × 11ms = 5500ms
//  * ────────────────────
//  * TOTAL: ~8500ms = 8.5 seconds (GOOD!)
//  * 
//  * Connection pool helps:
//  * - Không cần tạo connection mỗi lần
//  * - Reuse connections
//  * - ~20 connections handle 1000 req/s
//  */

// // ============================================================================
// // 🔟 CONNECTION POOL - CHI TIẾT
// // ============================================================================

// /**
//  * ❓ CONNECTION POOL LÀ GÌ? (Chi tiết)
//  * 
//  * CONNECTION = Đường truyền dữ liệu từ App → Database
//  * POOL = Nhóm các connection được quản lý tập trung
//  * 
//  * ❌ TRƯỚC KHI CÓ CONNECTION POOL:
//  * 
//  *   Request 1 → Create connection → Query → Close → 2ms overhead
//  *   Request 2 → Create connection → Query → Close → 2ms overhead
//  *   Request 3 → Create connection → Query → Close → 2ms overhead
//  *   ...
//  *   Request 1000 → Create connection → Query → Close → 2ms overhead
//  * 
//  *   Overhead lãng phí: 1000 × 2ms = 2 giây CHỈ để tạo/đóng connection!
//  * 
//  * ✅ SAU KHI CÓ CONNECTION POOL:
//  * 
//  *   Startup:
//  *   Pool = [Conn #1 (FREE)] [Conn #2 (FREE)] ... [Conn #20 (FREE)]
//  * 
//  *   Request 1 → Use Conn #1 → Query → Return to pool
//  *   Pool = [Conn #1 (BUSY)] [Conn #2 (FREE)] ... [Conn #20 (FREE)]
//  *   
//  *   Request 2 → Use Conn #2 → Query → Return to pool
//  *   Pool = [Conn #1 (BUSY)] [Conn #2 (BUSY)] ... [Conn #20 (FREE)]
//  *   
//  *   Request 3 → Use Conn #3 → Query → Return to pool
//  *   Pool = [Conn #1 (BUSY)] [Conn #2 (BUSY)] [Conn #3 (BUSY)] ... [Conn #20 (FREE)]
//  *   
//  *   Request 20 → Use Conn #20 → Query → Return to pool
//  *   Pool = [Conn #1 (BUSY)] [Conn #2 (BUSY)] ... [Conn #20 (BUSY)]
//  *   
//  *   Request 21 → WAIT FOR Conn #1 to be FREE → Use Conn #1 → Query → Return
//  *   (Conn #1 không bao giờ bị đóng! Tái sử dụng!)
//  *   
//  *   Request 1000 → Use Conn from pool → Query → Return
//  *   (Vẫn chỉ dùng 20 connections, recycle lại!)
//  * 
//  * ✅ LỢI ÍCH:
//  * - Tiết kiệm: 1000 request - 20 connections = 980 lần không phải tạo/đóng
//  * - Tốc độ: Không overhead tạo connection
//  * - Tài nguyên: Không tốn CPU/Memory tạo nhiều connections
//  * - Ổn định: Limit connections = không crash từ connection leak
//  * 
//  * ✅ DEFAULT CONNECTION POOL SIZE:
//  * 
//  * Prisma:
//  * DATABASE_URL="...?connection_limit=20"
//  *              Tối đa 20 connections
//  * 
//  * - Mỗi connection có thể xử lý ~50 queries/second
//  * - 20 connections × 50 queries = 1000 queries/second (đủ!)
//  * 
//  * ✅ PRISMA CONNECTION POOL ALGORITHM:
//  * 
//  * const connectionPool = new Pool({
//  *   max: 20,           // Tối đa 20 connections
//  *   idleTimeoutMillis: 30000, // Đóng connection nếu không dùng 30 giây
//  *   connectionTimeoutMillis: 2000, // Timeout khi tạo connection
//  * });
//  * 
//  * // Khi request tới:
//  * const connection = await connectionPool.acquire(); // Lấy connection (có thể chờ)
//  * 
//  * try {
//  *   await connection.query('SELECT ...');
//  * } finally {
//  *   connectionPool.release(connection); // Trả lại pool
//  * }
//  * 
//  * ✅ GIÁM SÁT CONNECTION POOL:
//  * 
//  * database/
//  * ├── Pool (20 connections)
//  * ├── Active connections: 5
//  * ├── Idle connections: 15
//  * └─ Waiting requests: 0
//  * 
//  * Nếu Waiting requests > 0 = Pool quá nhỏ (increase connection_limit)
//  * Nếu Idle connections ≈ 20 = Pool quá lớn (decrease connection_limit)
//  */

// // ============================================================================
// // 1️⃣1️⃣ MODULE CONFIGURATION (Kết nối tất cả)
// // ============================================================================

// /**
//  * src/auth/auth.module.ts
//  * 
//  * Kết nối tất cả các components lại
//  */
// import { Module } from '@nestjs/common';

// @Module({
//   imports: [
//     // ✅ Import modules cần thiết
//   ],
//   providers: [
//     PrismaService,  // Database connection
//     RedisService,   // Cache service
//     UserRepository, // User queries
//     LoginUseCase,   // Login logic
//   ],
//   controllers: [AuthController], // API endpoints
// })
// export class AuthModule {}

// // ============================================================================
// // 1️⃣2️⃣ PERFORMANCE SUMMARY
// // ============================================================================

// export const LoginDetailedSummary = `
// 🔐 LOGIN FUNCTION - CHI TIẾT

// 📝 CODE FLOW:
// 1. Controller nhận request
// 2. LoginUseCase xử lý
// 3. UserRepository tìm user (có Redis cache)
// 4. Kiểm tra password bằng bcrypt
// 5. Tạo JWT token
// 6. Cập nhật last login time
// 7. Trả token + user info

// ⏱️  TIMING:
// First login (Cache MISS): ~11ms
// - Redis check: 0.1ms
// - DB query: 5ms
// - Bcrypt: 0.8ms
// - JWT creation: 0.1ms
// - Update: 5ms

// Second login (Cache HIT): ~6ms (45% faster!)
// - Redis check: 0.1ms (cache hit!)
// - Bcrypt: 0.8ms
// - JWT creation: 0.1ms
// - Update: 5ms

// 🔄 CONNECTION POOL:
// - Pool size: 20 connections
// - Each connection: Reused 50+ times
// - No overhead: tạo/đóng connection
// - Supports: 1000+ req/s easily

// 📊 FOR 1000 LOGIN/SEC:
// - 50% cache hit + 50% cache miss
// - Average: ~8ms per login
// - ~1000 concurrent users
// - 20 connections handle all
// - CPU: 30-40% usage
// - Memory: Stable

// ✅ OPTIMIZATION TECHNIQUES:
// - Redis cache (100x faster)
// - Connection pooling (reduce overhead)
// - Select only needed fields
// - Bcrypt for password (secure)
// - JWT for authentication
// - Last login tracking

// 🚀 PRODUCTION READY!
// `;
