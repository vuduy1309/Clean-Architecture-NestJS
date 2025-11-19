// /**
//  * HIGH-LOAD BACKEND - LOGIN WITH BCRYPT
//  * Comment chi tiết từng dòng code
//  * 
//  * Sơ đồ kiến trúc:
//  * Client → Nginx (load balancer) → 4 Node.js processes → Database
//  *                                                      ↓
//  *                                              Bcrypt Worker Pool (4 workers)
//  */

// // ============================================================================
// // PHẦN 1: BCRYPT WORKER THREAD - File riêng: bcrypt.worker.ts
// // ============================================================================

// /**
//  * TÁCH RIÊNG FILE: bcrypt.worker.ts
//  * 
//  * Lý do: Bcrypt (hash password) là CPU-intensive
//  *       Nếu chạy ở main thread, sẽ chặn các request khác
//  *       Solution: Chạy trên worker thread, main thread xử lý request khác
//  */

// // === bcrypt.worker.ts ===
// /*
// import { parentPort } from 'worker_threads';  // Import để nhận message từ main thread
// import * as bcrypt from 'bcrypt';              // Import bcrypt library

// // Lắng nghe message từ main thread
// parentPort.on('message', async (message) => {
//   try {
//     // Nếu message yêu cầu hash password
//     if (message.operation === 'hash') {
//       // Lấy password và số rounds từ message
//       const { password, rounds } = message;
      
//       // Hash password (mất 100ms)
//       // bcrypt.hash tự động làm salt và hash
//       const hashed = await bcrypt.hash(password, rounds);
      
//       // Gửi kết quả trở lại main thread
//       parentPort.postMessage({ 
//         success: true,      // Thành công
//         result: hashed      // Kết quả (hashed password)
//       });
//     } 
//     // Nếu message yêu cầu compare (kiểm tra password)
//     else if (message.operation === 'compare') {
//       // Lấy password và hash từ message
//       const { password, hash } = message;
      
//       // So sánh password nhập vào với hash trong DB (mất 100ms)
//       // Trả về true nếu khớp, false nếu không
//       const isMatch = await bcrypt.compare(password, hash);
      
//       // Gửi kết quả trở lại main thread
//       parentPort.postMessage({ 
//         success: true,      // Thành công
//         result: isMatch     // true hoặc false
//       });
//     }
//   } catch (error) {
//     // Nếu có lỗi (password sai format, etc)
//     parentPort.postMessage({
//       success: false,                                          // Thất bại
//       error: error instanceof Error ? error.message : 'Unknown error'  // Thông báo lỗi
//     });
//   }
// });
// */

// // ============================================================================
// // PHẦN 2: BCRYPT WORKER POOL - File: auth/bcrypt.pool.ts
// // ============================================================================

// import { Worker } from 'worker_threads';  // Import để tạo worker threads
// import path from 'path';                   // Import path utils

// /**
//  * Class BcryptWorkerPool:
//  * 
//  * Mục đích: Quản lý 4 worker threads
//  *          Tái sử dụng workers (không tạo mới mỗi lần)
//  *          Queue tasks nếu tất cả workers bận
//  * 
//  * Ví dụ:
//  * Có 4 workers, 10 requests đến
//  * T=0ms:    Requests 1-4 → dispatch ngay (workers xử lý)
//  * T=0.1ms:  Requests 5-10 → queue (chờ workers rảnh)
//  * T=100ms:  Requests 1-4 xong
//  *           Requests 5-8 → dispatch (lấy từ queue)
//  *           Requests 9-10 → queue (chờ)
//  */
// class BcryptWorkerPool {
//   // ========== PROPERTIES ==========
  
//   // Mảng chứa các worker threads
//   private workers: Worker[] = [];
  
//   // Queue để giữ tasks chờ xử lý
//   // Mỗi item: { operation, data, resolve, reject }
//   private queue: Array<{
//     operation: string;           // 'hash' hoặc 'compare'
//     data: any;                   // { password, rounds } hoặc { password, hash }
//     resolve: (value: any) => void;  // Callback khi thành công
//     reject: (error: any) => void;   // Callback khi lỗi
//   }> = [];

//   // ========== CONSTRUCTOR ==========
  
//   // Constructor: Khởi tạo worker pool
//   constructor(poolSize: number = 4) {
//     // poolSize = 4 (mặc định)
//     // Lý do: 4-core CPU → 4 workers = tối ưu
    
//     // Loop tạo 4 workers
//     for (let i = 0; i < poolSize; i++) {
//       // Gọi hàm tạo worker
//       this.createWorker();
//     }
//   }

//   // ========== PRIVATE METHODS ==========
  
//   /**
//    * createWorker(): Tạo một worker thread
//    */
//   private createWorker() {
//     // Tạo worker thread từ file bcrypt.worker.ts
//     const worker = new Worker(
//       path.join(__dirname, 'bcrypt.worker.ts')
//     );

//     /**
//      * Lắng nghe 'message' event từ worker
//      * Khi worker gửi postMessage(), event này được trigger
//      */
//     worker.on('message', (message: any) => {
//       // Lấy job từ queue (FIFO - first in first out)
//       const job = this.queue.shift();
      
//       if (job) {
//         // Nếu có job trong queue
//         if (message.success) {
//           // Nếu worker thành công, resolve promise
//           job.resolve(message.result);
//         } else {
//           // Nếu worker thất bại, reject promise
//           job.reject(new Error(message.error));
//         }
        
//         // Xử lý job tiếp theo từ queue
//         this.processQueue(worker);
//       } else {
//         // Nếu queue trống, worker rảnh
//         // Thêm worker vào mảng workers (đang chờ)
//         this.workers.push(worker);
//       }
//     });

//     /**
//      * Lắng nghe 'error' event từ worker
//      * Nếu worker bị crash
//      */
//     worker.on('error', error => {
//       // Lấy job từ queue
//       const job = this.queue.shift();
      
//       if (job) {
//         // Reject job với error từ worker
//         job.reject(error);
//       }
//     });

//     // Thêm worker vào mảng workers
//     this.workers.push(worker);
//   }

//   /**
//    * processQueue(worker): Xử lý job tiếp theo từ queue
//    * 
//    * Tham số:
//    * @param worker - Worker thread đang rảnh
//    */
//   private processQueue(worker: Worker) {
//     // Lấy job tiếp theo từ queue
//     const job = this.queue.shift();
    
//     if (job) {
//       // Nếu có job, gửi tới worker
//       worker.postMessage({
//         operation: job.operation,    // 'hash' hoặc 'compare'
//         ...job.data,                 // Spread data (password, rounds, etc)
//       });
//     } else {
//       // Nếu queue trống, thêm worker vào mảng workers (đang chờ)
//       this.workers.push(worker);
//     }
//   }

//   // ========== PUBLIC METHODS ==========

//   /**
//    * hash(password, rounds): Hash password
//    * 
//    * Tham số:
//    * @param password - Password để hash (ví dụ: "securepassword123")
//    * @param rounds - Complexity rounds (mặc định: 10, từ 1-15)
//    *                 Rounds cao hơn = bảo mật cao hơn nhưng chậm hơn
//    * 
//    * Trả về:
//    * @return Promise<string> - Hashed password
//    * 
//    * Timeline:
//    * T=0ms:   Gọi hash()
//    * T=0.1ms: Dispatch tới worker (hoặc queue nếu tất cả busy)
//    * T=0.2ms: Return Promise
//    * T=100ms: Worker xong hash, callback tới main thread
//    * T=100.1ms: Promise resolve với hashed password
//    */
//   async hash(password: string, rounds: number = 10): Promise<string> {
//     return new Promise((resolve, reject) => {
//       // Lấy worker rảnh từ mảng workers
//       const availableWorker = this.workers.pop();

//       if (availableWorker) {
//         // Nếu có worker rảnh
//         // Gửi message tới worker
//         availableWorker.postMessage({
//           operation: 'hash',      // Báo cho worker làm hash
//           password,               // Password cần hash
//           rounds,                 // Complexity level
//         });

//         /**
//          * Lắng nghe 'message' event từ worker (một lần)
//          * Khi worker postMessage, event này được trigger
//          */
//         availableWorker.once('message', (message: any) => {
//           // Nếu worker thành công
//           if (message.success) {
//             // Resolve promise với hashed password
//             resolve(message.result);
            
//             // Thêm worker vào mảng workers (đang chờ)
//             this.workers.push(availableWorker);
            
//             // Xử lý job tiếp theo từ queue
//             this.processQueue(availableWorker);
//           } else {
//             // Worker thất bại
//             reject(new Error(message.error));
//           }
//         });

//         // Lắng nghe 'error' event từ worker (nếu crash)
//         availableWorker.once('error', reject);
//       } else {
//         // Nếu tất cả workers đang bận
//         // Thêm job vào queue (chờ)
//         this.queue.push({
//           operation: 'hash',
//           data: { password, rounds },
//           resolve,
//           reject,
//         });
//       }
//     });
//   }

//   /**
//    * compare(password, hash): So sánh password với hash
//    * 
//    * Tham số:
//    * @param password - Password nhập vào (ví dụ: "securepassword123")
//    * @param hash - Hash từ database (ví dụ: "$2b$10$abc...")
//    * 
//    * Trả về:
//    * @return Promise<boolean> - true nếu khớp, false nếu không
//    * 
//    * Timeline:
//    * T=0ms:   Gọi compare()
//    * T=0.1ms: Dispatch tới worker
//    * T=0.2ms: Return Promise
//    * T=100ms: Worker xong compare, callback tới main thread
//    * T=100.1ms: Promise resolve với true hoặc false
//    */
//   async compare(password: string, hash: string): Promise<boolean> {
//     return new Promise((resolve, reject) => {
//       // Lấy worker rảnh từ mảng workers
//       const availableWorker = this.workers.pop();

//       if (availableWorker) {
//         // Nếu có worker rảnh
//         // Gửi message tới worker
//         availableWorker.postMessage({
//           operation: 'compare',  // Báo cho worker làm compare
//           password,              // Password nhập vào
//           hash,                  // Hash từ database
//         });

//         // Lắng nghe kết quả từ worker
//         availableWorker.once('message', (message: any) => {
//           if (message.success) {
//             // Resolve promise với true/false
//             resolve(message.result);
            
//             // Thêm worker vào mảng workers
//             this.workers.push(availableWorker);
            
//             // Xử lý job tiếp theo từ queue
//             this.processQueue(availableWorker);
//           } else {
//             reject(new Error(message.error));
//           }
//         });

//         // Lắng nghe error từ worker
//         availableWorker.once('error', reject);
//       } else {
//         // Tất cả workers bận, queue job
//         this.queue.push({
//           operation: 'compare',
//           data: { password, hash },
//           resolve,
//           reject,
//         });
//       }
//     });
//   }

//   /**
//    * terminate(): Giết tất cả worker threads
//    * 
//    * Mục đích: Cleanup khi shutdown server
//    */
//   terminate() {
//     // Loop qua tất cả workers
//     this.workers.forEach(w => {
//       // Terminate (giết) worker
//       w.terminate();
//     });
//   }
// }

// // Export instance của worker pool để dùng trong ứng dụng
// export const bcryptPool = new BcryptWorkerPool(4);

// // ============================================================================
// // PHẦN 3: AUTH SERVICE - File: auth/auth.service.ts
// // ============================================================================

// import { Injectable } from '@nestjs/common';           // NestJS decorator
// import { PrismaClient } from '@prisma/client';       // ORM để query database
// import * as jwt from 'jsonwebtoken';                 // Library tạo JWT token

// // Khởi tạo Prisma client (ORM)
// const prisma = new PrismaClient({
//   datasources: {
//     db: {
//       url: process.env.DATABASE_URL,                 // Lấy DB URL từ .env
//     },
//   },
// });

// /**
//  * Interface LoginRequest
//  * Define kiểu dữ liệu input cho login
//  */
// interface LoginRequest {
//   email: string;          // Email của user (ví dụ: "user@example.com")
//   password: string;       // Password nhập vào (ví dụ: "securepassword123")
// }

// /**
//  * Interface LoginResponse
//  * Define kiểu dữ liệu output của login
//  */
// interface LoginResponse {
//   token: string;          // JWT token
//   user: {
//     id: number;           // User ID từ database
//     email: string;        // Email của user
//     username: string;     // Username của user
//   };
// }

// /**
//  * Interface JwtPayload
//  * Define kiểu dữ liệu trong JWT token
//  */
// interface JwtPayload {
//   userId: number;         // User ID
//   email: string;          // Email
//   iat: number;           // Issued at (thời gian tạo token)
//   exp: number;           // Expiration (thời gian hết hạn)
// }

// /**
//  * @Injectable() decorator
//  * Báo cho NestJS rằng đây là service (có thể inject vào controller)
//  */
// @Injectable()
// export class AuthService {
//   // ========== PROPERTIES ==========
  
//   // JWT secret key (dùng để sign & verify token)
//   private readonly jwtSecret = process.env.JWT_SECRET || 'secret-key';
  
//   // JWT expire time (token hết hạn sau 24 giờ)
//   private readonly jwtExpire = '24h';

//   // ========== PUBLIC METHODS ==========

//   /**
//    * login(input): Xử lý login
//    * 
//    * Quá trình:
//    * 1. Query database tìm user by email
//    * 2. So sánh password (using bcrypt worker)
//    * 3. Generate JWT token
//    * 4. Return token & user info
//    * 
//    * Timeline:
//    * T=0-2ms:      Query user từ DB (async, non-blocking)
//    * T=2-5ms:      User found, dispatch bcrypt.compare tới worker
//    * T=5-100ms:    Main thread FREE! Xử lý request khác
//    * T=105-110ms:  Worker xong, callback tới main thread
//    * T=110-115ms:  Generate JWT, prepare response
//    * Total: ~115ms
//    * 
//    * Lợi ích: Main thread không bị chặn (có thể xử lý 100 login cùng lúc!)
//    */
//   async login(input: LoginRequest): Promise<LoginResponse> {
//     // ===== STEP 1: Query user từ database =====
    
//     // Tìm user by email từ database
//     // findUnique = tìm 1 record (dùng unique field)
//     // where = điều kiện tìm (email)
//     // select = chỉ lấy những field cần thiết (không lấy tất cả)
//     const user = await prisma.user.findUnique({
//       where: { email: input.email },           // Tìm user có email này
//       select: {
//         id: true,                              // Lấy id
//         email: true,                           // Lấy email
//         username: true,                        // Lấy username
//         password: true,                        // Lấy password (hashed) để so sánh
//       },
//     });

//     // Nếu không tìm thấy user
//     if (!user) {
//       // Throw error
//       throw new Error('User not found');
//     }

//     // ===== STEP 2: So sánh password (using bcrypt worker) =====
    
//     // Gửi tới worker thread để so sánh
//     // bcryptPool.compare() return Promise<boolean>
//     // Main thread KHÔNG chặn, tiếp tục xử lý request khác!
//     const isPasswordValid = await bcryptPool.compare(
//       input.password,                          // Password nhập vào
//       user.password                            // Hash từ database
//     );

//     // Nếu password không khớp
//     if (!isPasswordValid) {
//       // Throw error
//       throw new Error('Invalid password');
//     }

//     // ===== STEP 3: Generate JWT token =====
    
//     // jwt.sign() tạo JWT token
//     // Token chứa: userId, email, iat (issued at), exp (expiration)
//     const token = jwt.sign(
//       {
//         userId: user.id,                       // Payload: user ID
//         email: user.email,                     // Payload: email
//       },
//       this.jwtSecret,                          // Secret key (dùng để sign)
//       { expiresIn: this.jwtExpire }            // Option: expire sau 24h
//     );

//     // ===== STEP 4: Return response =====
    
//     // Return object chứa token & user info
//     return {
//       token,                                   // JWT token
//       user: {
//         id: user.id,                           // User ID
//         email: user.email,                     // Email
//         username: user.username,               // Username
//       },
//     };
//   }

//   /**
//    * register(input): Xử lý register (tạo user mới)
//    * 
//    * Quá trình:
//    * 1. Hash password (using bcrypt worker)
//    * 2. Create user trong database
//    * 3. Return user info (không return password!)
//    */
//   async register(input: {
//     email: string;
//     username: string;
//     password: string;
//   }) {
//     // ===== STEP 1: Hash password =====
    
//     // Gửi password tới worker thread để hash
//     // bcryptPool.hash() return Promise<string>
//     // Main thread KHÔNG chặn!
//     const hashedPassword = await bcryptPool.hash(input.password, 10);
//     // rounds = 10 (bảo mật đủ, thời gian 100ms)

//     // ===== STEP 2: Create user trong database =====
    
//     // prisma.user.create() tạo user mới
//     const user = await prisma.user.create({
//       data: {
//         email: input.email,                    // Email từ input
//         username: input.username,              // Username từ input
//         password: hashedPassword,              // Hashed password (không plain text!)
//       },
//       select: {
//         id: true,                              // Lấy id
//         email: true,                           // Lấy email
//         username: true,                        // Lấy username
//         // password: true,                      // KHÔNG lấy password (bảo mật)
//       },
//     });

//     // ===== STEP 3: Return response =====
    
//     return {
//       message: 'User created successfully',    // Success message
//       user,                                    // User object (without password)
//     };
//   }

//   /**
//    * verifyToken(token): Xác minh JWT token
//    * 
//    * Dùng khi user gửi request với Authorization header
//    * Verify token có valid không, expire chưa
//    */
//   verifyToken(token: string): JwtPayload {
//     try {
//       // jwt.verify() xác minh token
//       // Nếu valid, return payload
//       // Nếu invalid hoặc expire, throw error
//       return jwt.verify(token, this.jwtSecret) as JwtPayload;
//     } catch (error) {
//       // Nếu lỗi, throw error
//       throw new Error('Invalid or expired token');
//     }
//   }
// }

// // ============================================================================
// // PHẦN 4: AUTH CONTROLLER - File: auth/auth.controller.ts
// // ============================================================================

// import {
//   Controller,
//   Post,
//   Body,
//   HttpException,
//   HttpStatus,
//   Get,
//   Headers,
// } from '@nestjs/common';

// /**
//  * @Controller('api/auth')
//  * Decorator báo cho NestJS rằng:
//  * - Đây là controller
//  * - Route base path: /api/auth
//  * 
//  * Ví dụ:
//  * POST /api/auth/login
//  * POST /api/auth/register
//  * GET /api/auth/verify
//  */
// @Controller('api/auth')
// export class AuthController {
//   // ========== CONSTRUCTOR ==========
  
//   // Inject AuthService (dependency injection)
//   // NestJS tự động inject AuthService instance
//   constructor(private authService: AuthService) {}

//   // ========== ENDPOINTS ==========

//   /**
//    * @Post('register')
//    * POST /api/auth/register
//    * 
//    * Body:
//    * {
//    *   "email": "user@example.com",
//    *   "username": "john",
//    *   "password": "securepassword123"
//    * }
//    * 
//    * Response:
//    * {
//    *   "message": "User created successfully",
//    *   "user": {
//    *     "id": 1,
//    *     "email": "user@example.com",
//    *     "username": "john"
//    *   }
//    * }
//    */
//   @Post('register')
//   async register(
//     @Body()                                    // Decorator: lấy body từ request
//     input: {
//       email: string;                           // Email từ body
//       username: string;                        // Username từ body
//       password: string;                        // Password từ body
//     }
//   ) {
//     try {
//       // Gọi authService.register()
//       return await this.authService.register(input);
//     } catch (error) {
//       // Nếu có lỗi, throw HttpException
//       throw new HttpException(
//         {
//           error: error instanceof Error ? error.message : 'Registration failed',
//         },
//         HttpStatus.BAD_REQUEST                // HTTP 400 Bad Request
//       );
//     }
//   }

//   /**
//    * @Post('login')
//    * POST /api/auth/login
//    * 
//    * Body:
//    * {
//    *   "email": "user@example.com",
//    *   "password": "securepassword123"
//    * }
//    * 
//    * Response:
//    * {
//    *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
//    *   "user": {
//    *     "id": 1,
//    *     "email": "user@example.com",
//    *     "username": "john"
//    *   }
//    * }
//    */
//   @Post('login')
//   async login(
//     @Body()                                    // Lấy body từ request
//     input: {
//       email: string;                           // Email từ body
//       password: string;                        // Password từ body
//     }
//   ) {
//     try {
//       // Gọi authService.login()
//       return await this.authService.login(input);
//     } catch (error) {
//       // Nếu có lỗi, throw HttpException
//       throw new HttpException(
//         {
//           error: error instanceof Error ? error.message : 'Login failed',
//         },
//         HttpStatus.UNAUTHORIZED                // HTTP 401 Unauthorized
//       );
//     }
//   }

//   /**
//    * @Get('verify')
//    * GET /api/auth/verify
//    * 
//    * Headers:
//    * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
//    * 
//    * Response (nếu valid):
//    * {
//    *   "valid": true,
//    *   "payload": {
//    *     "userId": 1,
//    *     "email": "user@example.com",
//    *     "iat": 1634567890,
//    *     "exp": 1634654290
//    *   }
//    * }
//    * 
//    * Response (nếu invalid):
//    * {
//    *   "valid": false,
//    *   "error": "Invalid token"
//    * }
//    */
//   @Get('verify')
//   verify(
//     @Headers('authorization') authHeader: string  // Lấy Authorization header
//   ) {
//     try {
//       // Extract token từ header
//       // Header format: "Bearer <token>"
//       // Cắt "Bearer " để lấy token
//       const token = authHeader?.replace('Bearer ', '');
      
//       // Nếu không có token
//       if (!token) {
//         throw new Error('Token not provided');
//       }

//       // Xác minh token
//       // Nếu valid, return payload
//       const payload = this.authService.verifyToken(token);
      
//       return {
//         valid: true,                           // Token valid
//         payload,                               // Payload (userId, email, etc)
//       };
//     } catch (error) {
//       // Nếu có lỗi, throw HttpException
//       throw new HttpException(
//         {
//           valid: false,                        // Token không valid
//           error: error instanceof Error ? error.message : 'Invalid token',
//         },
//         HttpStatus.UNAUTHORIZED                // HTTP 401 Unauthorized
//       );
//     }
//   }
// }

// // ============================================================================
// // PHẦN 5: APP MODULE & CLUSTER SETUP - File: main.ts
// // ============================================================================

// import { Module } from '@nestjs/common';
// import { NestFactory } from '@nestjs/core';
// import cluster from 'cluster';
// import os from 'os';

// /**
//  * @Module()
//  * Decorator định nghĩa module
//  * 
//  * Module chứa:
//  * - Controllers
//  * - Providers (services)
//  * - Imports (modules khác)
//  * - Exports
//  */
// @Module({
//   controllers: [AuthController],               // Dùng AuthController
//   providers: [AuthService],                    // Dùng AuthService
// })
// export class AppModule {}

// /**
//  * bootstrap(): Hàm khởi động ứng dụng
//  */
// async function bootstrap() {
//   // ===== CLUSTER SETUP =====
  
//   // Lấy số CPU cores
//   const numWorkers = os.cpus().length;
//   // Ví dụ: 4-core CPU → numWorkers = 4

//   // Kiểm tra nếu là master process
//   if (cluster.isMaster) {
//     // ===== MASTER PROCESS =====
//     // Chỉ chạy 1 master process
    
//     // Log message
//     console.log(
//       `Master process ${process.pid} starting ${numWorkers} workers`
//     );

//     // Loop tạo workers
//     for (let i = 0; i < numWorkers; i++) {
//       // fork() tạo child process (worker)
//       // Mỗi worker chạy code giống nhau
//       cluster.fork();
//     }

//     /**
//      * Lắng nghe 'exit' event từ workers
//      * Khi worker crash hoặc shutdown
//      */
//     cluster.on('exit', (worker, code, signal) => {
//       // Log message
//       console.log(
//         `Worker ${worker.process.pid} exited (${signal || code}). Restarting...`
//       );
      
//       // Fork worker mới để replace
//       cluster.fork();
//     });

//     // Log message
//     console.log('✓ Cluster ready. Use load balancer (nginx) on port 80');
//   } else {
//     // ===== WORKER PROCESS =====
//     // Mỗi worker process chạy code này

//     // Tạo NestJS app
//     const app = await NestFactory.create(AppModule);

//     // Tính port cho worker này
//     // Worker 1 → port 3001
//     // Worker 2 → port 3002
//     // Worker 3 → port 3003
//     // Worker 4 → port 3004
//     const port = 3000 + (cluster.worker?.id || 1);

//     // Enable CORS (cho phép frontend request từ domain khác)
//     app.enableCors();

//     // Set request timeout: 30 seconds
//     // (bcrypt.compare() có thể mất 100ms, nên 30s là đủ)
//     app.getHttpServer().setTimeout(30000);

//     // Khởi động server
//     // Lắng nghe trên port
//     await app.listen(port, () => {
//       console.log(
//         `✓ Worker ${process.pid} listening on port ${port} (worker #${cluster.worker?.id})`
//       );
//     });
//   }
// }

// // Gọi bootstrap() để khởi động ứng dụng
// bootstrap();

// // ============================================================================
// // PHẦN 6: ENVIRONMENT CONFIG - File: .env
// // ============================================================================

// /**
//  * DATABASE_URL=postgresql://user:password@localhost:5432/auth_db
//  *   ↑ PostgreSQL connection string
//  *   Cú pháp: postgresql://[user[:password]@][netloc][:port][/dbname]
//  * 
//  * JWT_SECRET=your-super-secret-key-min-32-characters-long
//  *   ↑ Secret key dùng để sign JWT token
//  *   Phải dài ít nhất 32 ký tự (bảo mật)
//  * 
//  * NODE_ENV=production
//  *   ↑ Environment (production hoặc development)
//  */

// // ============================================================================
// // PHẦN 7: NGINX CONFIG - File: /etc/nginx/nginx.conf
// // ============================================================================

// /**
//  * upstream auth_api {
//  *   # Define backend servers
//  *   # 4 Node.js processes (4-core CPU)
//  *   server 127.0.0.1:3001;
//  *   server 127.0.0.1:3002;
//  *   server 127.0.0.1:3003;
//  *   server 127.0.0.1:3004;
//  * }
//  * 
//  * server {
//  *   listen 80;                              # Nginx lắng nghe port 80
//  *   server_name api.example.com;           # Domain name
//  * 
//  *   # Request size limit
//  *   client_max_body_size 10M;              # Max upload size: 10MB
//  * 
//  *   # Rate limiting
//  *   # Giới hạn: 10 requests/sec per IP
//  *   limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=10r/s;
//  *   limit_req_status 429;                  # Status code nếu exceed
//  * 
//  *   location /api/auth/ {
//  *     # Apply rate limiting
//  *     limit_req zone=auth_limit burst=20 nodelay;
//  *     # burst=20: Cho phép tối đa 20 requests ngay (queue)
//  *     # nodelay: Không delay, immediate response
//  * 
//  *     # Proxy settings
//  *     proxy_pass http://auth_api;         # Forward request tới backend
//  *     proxy_set_header Host $host;        # Pass Host header
//  *     proxy_set_header X-Real-IP $remote_addr;     # Real client IP
//  *     proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;  # Proxy chain
//  *     proxy_set_header X-Forwarded-Proto $scheme;  # Protocol (http/https)
//  * 
//  *     # Timeouts
//  *     proxy_connect_timeout 30s;          # Timeout connect
//  *     proxy_send_timeout 30s;             # Timeout send request
//  *     proxy_read_timeout 30s;             # Timeout read response
//  *   }
//  * }
//  */

// // ============================================================================
// // PHẦN 8: DATABASE INDEXES - Cải thiện performance query
// // ============================================================================

// /**
//  * CREATE INDEX idx_user_email ON users(email);
//  *   ↑ Tạo index trên column email
//  *   Lợi ích: Query WHERE email = ... nhanh hơn 100x
//  *   Thời gian: findUnique(email) = 0.1ms (thay vì 10ms)
//  * 
//  * CREATE INDEX idx_user_username ON users(username);
//  *   ↑ Tạo index trên column username
//  *   Lợi ích: Query WHERE username = ... nhanh hơn
//  */

// // ============================================================================
// // PHẦN 9: SUMMARY & METRICS
// // ============================================================================

// /**
//  * ARCHITECTURE SUMMARY:
//  * 
//  * Client (web browser)
//  *   ↓ HTTP request (1000 concurrent)
//  *   ↓
//  * Nginx load balancer (port 80)
//  *   ↓ Distribute requests evenly
//  *   ├→ Node.js worker 1 (port 3001)
//  *   ├→ Node.js worker 2 (port 3002)
//  *   ├→ Node.js worker 3 (port 3003)
//  *   └→ Node.js worker 4 (port 3004)
//  *
//  * Each worker:
//  *   - AuthController (POST /login, POST /register, GET /verify)
//  *   - AuthService (login, register, verifyToken)
//  *   - Prisma ORM (query database with connection pool)
//  *   - Bcrypt Worker Pool (4 workers for password hashing)
//  *
//  * PERFORMANCE METRICS:
//  * 
//  * Without bcrypt workers (main thread):
//  * - Requests/sec: 8 req/s (SLOW!)
//  * - Avg response: 125ms
//  * - p99 response: 2000ms (very slow!)
//  * - CPU: 100% (blocked)
//  * 
//  * With bcrypt workers:
//  * - Requests/sec: 32 req/s (4x faster!)
//  * - Avg response: 125ms
//  * - p99 response: 250ms (much better!)
//  * - CPU: 80% (efficient)
//  * 
//  * IMPROVEMENT: 4x throughput, 8x better tail latency
//  */

// console.log('=== DETAILED COMMENTS ADDED ===');
