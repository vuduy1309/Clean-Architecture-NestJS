// /**
//  * ============================================================================
//  * WORKERS - CHI TIẾT TOÀN DIỆN
//  * ============================================================================
//  * 
//  * Worker = Process riêng biệt xử lý công việc nặng (async jobs)
//  * Giúp main app không bị blocking
//  */

// // ============================================================================
// // 1️⃣ WORKER LÀ GÌ?
// // ============================================================================

// /**
//  * 🎯 DEFINITION:
//  * 
//  * Worker = Một background process độc lập
//  *         Xử lý công việc không cần phải chờ
//  *         Không block main application
//  * 
//  * ❓ TẠI SAO CẦN WORKER?
//  * 
//  * Một số công việc RẤTMẤT THỜI GIAN:
//  * - Gửi email: 1-2 giây
//  * - Tạo PDF report: 2-3 giây
//  * - Upload video: 30+ giây
//  * - Xử lý ảnh: 5-10 giây
//  * - Backup database: 5+ phút
//  * - Gọi external API: 1-10 giây
//  * 
//  * ❌ NẾU KHÔNG DÙNG WORKER (BLOCKING):
//  * 
//  * POST /register
//  * ├─ Create user in DB (5ms) ✅
//  * ├─ Send email (2000ms) ⏳ BLOCKING!
//  * │  └─ Request phải chờ 2 giây
//  * │  └─ User thấy loading 2 giây
//  * │  └─ Nếu email fail, request fail
//  * └─ Return response (2000ms+)
//  * 
//  * Vấn đề:
//  * - 1000 req/s × 2s = 2000 concurrent connections (CRASH!)
//  * - User experience tệ (chờ lâu)
//  * - Email fail = request fail (bad UX)
//  * 
//  * ✅ NẾU DÙNG WORKER (NON-BLOCKING):
//  * 
//  * POST /register
//  * ├─ Create user in DB (5ms) ✅
//  * ├─ Queue email job (1ms) ✅ SUPER FAST!
//  * │  └─ Job lưu vào queue (Redis)
//  * │  └─ Return ngay, không chờ
//  * └─ Return response (6ms)
//  * 
//  * Meanwhile (background):
//  * └─ Worker process xử lý email
//  *    └─ Send email (2000ms)
//  *    └─ Nếu fail: auto-retry 3 lần
//  *    └─ Không ảnh hưởng main app
//  * 
//  * Lợi ích:
//  * - Response time: 2000ms → 6ms (333x FASTER!)
//  * - Concurrent connections: 2000 → 10 (200x LESS!)
//  * - Reliability: Email fail không crash request
//  * - User experience: Instant response ✅
//  */

// /**
//  * 📊 WORKER VS NO WORKER COMPARISON
//  */
// const workerComparison = `
// ╔════════════════════════════════════════════════════════════════════╗
// ║                  WITHOUT WORKER       vs       WITH WORKER         ║
// ╠════════════════════════════════════════════════════════════════════╣

// SCENARIO: 1000 register requests/second
// Each registration needs to send email (2 seconds)

// WITHOUT WORKER (Synchronous):
// ├─ Response time: 5ms (DB) + 2000ms (email) = 2005ms
// ├─ Concurrent connections: 1000 × 2s = 2000 connections needed
// ├─ CPU: 100% (wait for network)
// ├─ User experience: Loading for 2 seconds
// ├─ If email fails: Request fails
// └─ Result: CRASH ⛔

// WITH WORKER (Asynchronous):
// ├─ Response time: 5ms (DB) + 1ms (queue) = 6ms
// ├─ Concurrent connections: 1000 × 0.006s = 6 connections needed
// ├─ CPU: 10% (main app), 50% (worker)
// ├─ User experience: Instant response ✅
// ├─ If email fails: Auto-retry, main request unaffected
// └─ Result: PRODUCTION READY ✅

// GAIN: 333x faster response! 100x fewer connections!

// ════════════════════════════════════════════════════════════════════
// `;

// // ============================================================================
// // 2️⃣ LOẠI WORKERS
// // ============================================================================

// /**
//  * 🎯 CÓ 3 LOẠI WORKER:
//  * 
//  * 1️⃣ IN-PROCESS WORKER (Simple, Single Server)
//  * 2️⃣ SEPARATE PROCESS WORKER (Bull + Redis, Scalable)
//  * 3️⃣ DISTRIBUTED WORKER (RabbitMQ, Kafka, AWS SQS)
//  */

// /**
//  * 1️⃣ IN-PROCESS WORKER
//  * 
//  * Định nghĩa: Worker chạy trong cùng process với main app
//  * Ví dụ: setTimeout, setInterval
//  * 
//  * ✅ Ưu điểm:
//  * - Đơn giản, không cần infrastructure
//  * - Ít dependencies
//  * - Tốc độ: Shared memory
//  * 
//  * ❌ Nhược điểm:
//  * - Nếu app crash → Worker crash
//  * - Khó scale horizontally
//  * - Memory chia sẻ (có thể conflict)
//  * - Không persistent (job mất nếu crash)
//  */

// /**
//  * ❌ IN-PROCESS WORKER EXAMPLE (Không khuyên dùng production)
//  * 
//  * @Injectable()
//  * export class EmailService {
//  *   sendEmailAsync(email: string, subject: string, body: string) {
//  *     // ❌ PROBLEM: Nếu app crash, email không được gửi
//  *     // ❌ PROBLEM: Job không persistent
//  *     // ❌ PROBLEM: Không thể retry
//  *     setTimeout(() => {
//  *       this.sendEmail(email, subject, body);
//  *     }, 0);
//  *   }
//  * 
//  *   private sendEmail(email: string, subject: string, body: string) {
//  *     // Gửi email logic...
//  *   }
//  * }
//  */

// /**
//  * 2️⃣ SEPARATE PROCESS WORKER (Bull + Redis)
//  * 
//  * Định nghĩa: Worker chạy trong process riêng
//  * Sử dụng: Bull job queue + Redis
//  * 
//  * ✅ Ưu điểm:
//  * - Nếu app crash → Worker vẫn chạy
//  * - Job persistent (lưu trong Redis)
//  * - Auto-retry on failure
//  * - Dễ scale (thêm workers)
//  * - Dễ monitor + debug
//  * 
//  * ✅ Khuyên dùng cho: Most applications
//  */

// /**
//  * 3️⃣ DISTRIBUTED WORKER (RabbitMQ, Kafka)
//  * 
//  * Định nghĩa: Workers chạy trên multiple servers
//  * Sử dụng: Message queue (RabbitMQ, Kafka)
//  * 
//  * ✅ Ưu điểm:
//  * - Massive scale (100+ workers)
//  * - Multi-datacenter support
//  * - High availability
//  * - Complex routing
//  * 
//  * ❌ Nhược điểm:
//  * - Complex setup
//  * - More infrastructure
//  * 
//  * ✅ Khuyên dùng cho: Enterprise systems
//  */

// // ============================================================================
// // 3️⃣ BULL WORKER - DETAILED IMPLEMENTATION
// // ============================================================================

// /**
//  * ✅ BULL WORKER (Recommended for most projects)
//  * 
//  * Installation:
//  * npm install @nestjs/bull bull redis
//  */

// /**
//  * 🎯 ARCHITECTURE: BULL WORKER SYSTEM
//  * 
//  *     MAIN APPLICATION
//  *     ┌──────────────────────┐
//  *     │ POST /register       │
//  *     │ ├─ Create user (5ms) │
//  *     │ ├─ Queue job (1ms)   │ ← Producer
//  *     │ └─ Response (6ms)    │
//  *     └──────────────────────┘
//  *              ↓
//  *     REDIS QUEUE (Durable)
//  *     ┌──────────────────────┐
//  *     │ [Job #1: email]      │
//  *     │ [Job #2: email]      │ ← Storage
//  *     │ [Job #3: email]      │
//  *     │ ...                  │
//  *     └──────────────────────┘
//  *              ↓
//  *     WORKER PROCESS
//  *     ┌──────────────────────┐
//  *     │ Get job from queue   │
//  *     │ Process job (2s)     │ ← Consumer
//  *     │ Return result        │
//  *     │ Get next job         │
//  *     └──────────────────────┘
//  */

// /**
//  * ============================================================
//  * STEP 1: SETUP BULL IN NESTJS
//  * ============================================================
//  */

// import { Module } from '@nestjs/common';
// import { BullModule } from '@nestjs/bull';

// /**
//  * // src/queue/queue.module.ts
//  * 
//  * @Module({
//  *   imports: [
//  *     BullModule.forRoot({
//  *       redis: {
//  *         host: 'localhost',
//  *         port: 6379,
//  *       },
//  *     }),
//  *     BullModule.registerQueue(
//  *       { name: 'email' },    // Email queue
//  *       { name: 'payment' },  // Payment queue
//  *       { name: 'report' },   // Report generation queue
//  *     ),
//  *   ],
//  * })
//  * export class QueueModule {}
//  */

// /**
//  * ============================================================
//  * STEP 2: PRODUCER - ADD JOBS TO QUEUE
//  * ============================================================
//  * 
//  * Producer = Process chính (NestJS app)
//  * Công dụng: Tạo jobs và thêm vào queue
//  */

// import { Injectable } from '@nestjs/common';
// import { InjectQueue } from '@nestjs/bull';
// import { Queue } from 'bull';

// @Injectable()
// export class RegisterService {
//   constructor(
//     @InjectQueue('email') private emailQueue: Queue,
//   ) {}

//   /**
//    * REGISTER USER
//    * 
//    * Công việc:
//    * 1. Create user in database (synchronous)
//    * 2. Queue email job (asynchronous)
//    * 3. Return immediately (non-blocking)
//    */
//   async registerUser(dto: RegisterDto) {
//     console.log('📝 Registering user...');

//     // ✅ STEP 1: Create user (synchronous - fast)
//     const user = await this.userRepository.create({
//       email: dto.email,
//       password: await bcrypt.hash(dto.password, 10),
//       name: dto.name,
//     });
//     console.log('✅ User created in database');

//     // ✅ STEP 2: Queue email job (asynchronous - super fast!)
//     // Công dụng: Send welcome email in background
//     await this.emailQueue.add(
//       {
//         // Job data
//         email: user.email,
//         subject: 'Welcome to our app!',
//         body: `Hello ${user.name}, thanks for registering!`,
//       },
//       {
//         // Job options
//         jobId: `welcome-email-${user.id}`, // Unique job ID
//         delay: 0, // Start immediately (0ms delay)
//         attempts: 3, // Retry 3 times if fail
//         backoff: {
//           type: 'exponential', // Exponential backoff: 2s, 4s, 8s
//           delay: 2000, // Initial delay: 2 seconds
//         },
//         removeOnComplete: true, // Delete job after success
//         removeOnFail: false, // Keep failed jobs for debugging
//         priority: 1, // 1=highest, 10=lowest (important emails first)
//       },
//     );

//     console.log('✅ Email job queued (will send in background)');
//     console.log('⏱️  Total response time: ~6ms (not 2006ms!)');

//     // ✅ STEP 3: Return immediately
//     return {
//       success: true,
//       message: 'Registration successful! Check your email.',
//       user: {
//         id: user.id,
//         email: user.email,
//         name: user.name,
//       },
//     };
//   }
// }

// /**
//  * TIMELINE:
//  * T=0ms:   Register request arrives
//  * T=5ms:   User created in DB
//  * T=6ms:   Email job queued
//  * T=6ms:   Response sent to client ✅ FAST!
//  * 
//  * Meanwhile (background):
//  * T=6-2006ms: Worker sends email
//  * T=2006ms:   Email sent ✅
//  */

// /**
//  * ============================================================
//  * STEP 3: CONSUMER - PROCESS JOBS (WORKER)
//  * ============================================================
//  * 
//  * Consumer = Worker process
//  * Công dụng: Lấy jobs từ queue và xử lý
//  */

// import { Process, Processor } from '@nestjs/bull';
// import { Job } from 'bull';

// /**
//  * // src/workers/email.worker.ts
//  * 
//  * @Processor('email') ← Process jobs từ 'email' queue
//  * @Injectable()
//  * export class EmailWorker {
//  *   constructor(private emailService: EmailService) {}
//  * 
//  *   @Process() ← Xử lý mỗi job
//  *   async handleEmailJob(job: Job) {
//  *     // job.data = { email, subject, body }
//  *     const { email, subject, body } = job.data;
//  * 
//  *     console.log(`📧 Processing email job #${job.id} for ${email}`);
//  *     console.log(`   Retry count: ${job.attemptsMade}`);
//  * 
//  *     try {
//  *       // ✅ Send email (this can take 1-2 seconds)
//  *       await this.emailService.send({
//  *         to: email,
//  *         subject,
//  *         html: body,
//  *       });
//  * 
//  *       console.log(`✅ Email sent successfully to ${email}`);
//  *       return { success: true }; // Job completed
//  * 
//  *     } catch (error) {
//  *       console.error(`❌ Failed to send email: ${error.message}`);
//  * 
//  *       // ✅ AUTO-RETRY (handled by Bull)
//  *       // If error thrown → Bull retries automatically
//  *       // Attempt 1: Retry after 2 seconds
//  *       // Attempt 2: Retry after 4 seconds
//  *       // Attempt 3: Retry after 8 seconds
//  *       // If still fail after 3 attempts → Move to failed queue
//  *       throw error;
//  *     }
//  *   }
//  * }
//  */

// /**
//  * JOB LIFECYCLE:
//  * 
//  * 1. Job created (by producer)
//  *    └─ Added to queue with status "waiting"
//  * 
//  * 2. Job picked up by worker
//  *    └─ Status: "active"
//  *    └─ attemptsMade: 0
//  * 
//  * 3a. Job succeeds
//  *    └─ Status: "completed"
//  *    └─ Job removed from queue (if removeOnComplete=true)
//  * 
//  * 3b. Job fails
//  *    └─ Error thrown
//  *    └─ Bull checks: Should retry?
//  *    └─ If yes: Wait for backoff time, retry (attemptsMade++)
//  *    └─ If no more retries: Status: "failed"
//  *    └─ Move to failed queue
//  */

// // ============================================================================
// // 4️⃣ WORKER TYPES & USE CASES
// // ============================================================================

// /**
//  * 📧 EMAIL WORKER
//  * 
//  * Use case: Send emails asynchronously
//  * Time: 1-2 seconds per email
//  * Retry: 3 times (important!)
//  */

// @Processor('email')
// @Injectable()
// export class EmailWorker {
//   constructor(private emailService: EmailService) {}

//   @Process()
//   async sendEmail(job: Job<{ email: string; subject: string; body: string }>) {
//     const { email, subject, body } = job.data;

//     // Report progress (if UI needs real-time update)
//     job.progress(50);

//     try {
//       await this.emailService.send({ to: email, subject, html: body });
//       job.progress(100);
//       return { success: true };
//     } catch (error) {
//       throw error; // Auto-retry
//     }
//   }
// }

// /**
//  * 💳 PAYMENT WORKER
//  * 
//  * Use case: Process payments (Stripe, PayPal)
//  * Time: 2-5 seconds per transaction
//  * Retry: 5 times (money-critical!)
//  */

// @Processor('payment')
// @Injectable()
// export class PaymentWorker {
//   constructor(private paymentService: PaymentService) {}

//   @Process()
//   async processPayment(job: Job<{ orderId: number; amount: number }>) {
//     const { orderId, amount } = job.data;

//     job.progress(25); // 25% progress

//     try {
//       // Call payment gateway (Stripe, PayPal, etc.)
//       const result = await this.paymentService.charge({
//         orderId,
//         amount,
//       });

//       job.progress(75);

//       // Update order status
//       await this.orderRepository.update(orderId, {
//         status: 'PAID',
//         paymentId: result.transactionId,
//       });

//       job.progress(100);
//       return { success: true, transactionId: result.transactionId };
//     } catch (error) {
//       throw error; // Auto-retry (very important!)
//     }
//   }
// }

// /**
//  * 📊 REPORT WORKER
//  * 
//  * Use case: Generate PDF/Excel reports
//  * Time: 5-30 seconds
//  * Retry: 2 times
//  */

// @Processor('report')
// @Injectable()
// export class ReportWorker {
//   constructor(private reportService: ReportService) {}

//   @Process()
//   async generateReport(job: Job<{ userId: number; format: 'pdf' | 'excel' }>) {
//     const { userId, format } = job.data;

//     job.progress(10);

//     try {
//       // Get data
//       const data = await this.reportService.getData(userId);
//       job.progress(40);

//       // Generate report
//       const filePath = await this.reportService.generate(data, format);
//       job.progress(80);

//       // Upload to cloud storage
//       const url = await this.reportService.upload(filePath);
//       job.progress(100);

//       return { success: true, reportUrl: url };
//     } catch (error) {
//       throw error;
//     }
//   }
// }

// /**
//  * 🎥 VIDEO PROCESSING WORKER
//  * 
//  * Use case: Transcode videos
//  * Time: 30+ seconds
//  * Retry: 1 time (can be very slow)
//  */

// @Processor('video')
// @Injectable()
// export class VideoWorker {
//   constructor(private videoService: VideoService) {}

//   @Process()
//   async processVideo(job: Job<{ videoId: number }>) {
//     const { videoId } = job.data;

//     job.progress(5);

//     try {
//       // Download video
//       const videoPath = await this.videoService.download(videoId);
//       job.progress(20);

//       // Transcode to multiple formats
//       const output = await this.videoService.transcode(videoPath);
//       job.progress(70);

//       // Upload to CDN
//       const urls = await this.videoService.uploadToCDN(output);
//       job.progress(100);

//       return { success: true, urls };
//     } catch (error) {
//       throw error;
//     }
//   }
// }

// // ============================================================================
// // 5️⃣ ADVANCED WORKER PATTERNS
// // ============================================================================

// /**
//  * 🎯 PATTERN 1: MULTIPLE NAMED PROCESSORS (Different job types in same worker)
//  */

// /**
//  * // src/workers/notification.worker.ts
//  * 
//  * @Processor('notification')
//  * @Injectable()
//  * export class NotificationWorker {
//  *   
//  *   @Process('sms') ← Process only SMS jobs
//  *   async handleSMS(job: Job<{ phone: string; message: string }>) {
//  *     const { phone, message } = job.data;
//  *     await this.smsService.send(phone, message);
//  *   }
//  * 
//  *   @Process('push') ← Process only push notification jobs
//  *   async handlePush(job: Job<{ userId: number; message: string }>) {
//  *     const { userId, message } = job.data;
//  *     await this.pushService.send(userId, message);
//  *   }
//  * 
//  *   @Process('telegram') ← Process only telegram jobs
//  *   async handleTelegram(job: Job<{ chatId: string; message: string }>) {
//  *     const { chatId, message } = job.data;
//  *     await this.telegramService.send(chatId, message);
//  *   }
//  * }
//  * 
//  * // Usage:
//  * await notificationQueue.add('sms', { phone: '...', message: '...' });
//  * await notificationQueue.add('push', { userId: 123, message: '...' });
//  * await notificationQueue.add('telegram', { chatId: '...', message: '...' });
//  */

// /**
//  * 🎯 PATTERN 2: DELAYED JOBS (Schedule for later)
//  */

// /**
//  * // Schedule email to send after 24 hours
//  * await emailQueue.add(
//  *   {
//  *     email: 'user@example.com',
//  *     subject: 'Reminder',
//  *     body: 'Your trial expires tomorrow!',
//  *   },
//  *   {
//  *     delay: 86400000, // 24 hours in milliseconds
//  *   }
//  * );
//  * 
//  * // Job won't be processed until 24 hours later
//  */

// /**
//  * 🎯 PATTERN 3: RECURRING JOBS (Cron-like)
//  */

// /**
//  * // Process every hour
//  * await this.reportQueue.add(
//  *   { reportType: 'daily' },
//  *   {
//  *     repeat: {
//  *       cron: '0 * * * *', // Every hour
//  *     },
//  *   }
//  * );
//  * 
//  * // Process every day at 2 AM
//  * await this.backupQueue.add(
//  *   { },
//  *   {
//  *     repeat: {
//  *       cron: '0 2 * * *', // 2 AM daily
//  *     },
//  *   }
//  * );
//  */

// /**
//  * 🎯 PATTERN 4: PRIORITY JOBS
//  */

// /**
//  * // VIP users get priority
//  * await emailQueue.add(
//  *   { email: 'vip@example.com', ... },
//  *   { priority: 1 } // Highest priority (process first)
//  * );
//  * 
//  * // Regular users lower priority
//  * await emailQueue.add(
//  *   { email: 'regular@example.com', ... },
//  *   { priority: 10 } // Lower priority (process later)
//  * );
//  */

// // ============================================================================
// // 6️⃣ WORKER MONITORING & DEBUGGING
// // ============================================================================

// /**
//  * 🔍 MONITOR QUEUE STATUS
//  */

// @Injectable()
// export class QueueMonitorService {
//   constructor(
//     @InjectQueue('email') private emailQueue: Queue,
//     @InjectQueue('payment') private paymentQueue: Queue,
//   ) {}

//   /**
//    * GET QUEUE STATUS
//    */
//   async getQueueStatus() {
//     const emailStatus = await this.getQueueStats(this.emailQueue);
//     const paymentStatus = await this.getQueueStats(this.paymentQueue);

//     return {
//       email: emailStatus,
//       payment: paymentStatus,
//     };
//   }

//   private async getQueueStats(queue: Queue) {
//     const [waiting, active, completed, failed] = await Promise.all([
//       queue.getWaitingCount(),
//       queue.getActiveCount(),
//       queue.getCompletedCount(),
//       queue.getFailedCount(),
//     ]);

//     return {
//       waiting, // Jobs waiting to be processed
//       active, // Jobs currently processing
//       completed, // Jobs completed successfully
//       failed, // Jobs failed
//       total: waiting + active + completed + failed,
//     };
//   }

//   /**
//    * EXAMPLE RETURN:
//    * {
//    *   email: {
//    *     waiting: 1234,   (10 more emails to send)
//    *     active: 5,       (5 emails currently sending)
//    *     completed: 98765,(sent successfully)
//    *     failed: 12,      (failed - need retry or investigation)
//    *     total: 100016
//    *   },
//    *   payment: {
//    *     waiting: 0,
//    *     active: 2,
//    *     completed: 5643,
//    *     failed: 1,
//    *     total: 5646
//    *   }
//    * }
//    */

//   /**
//    * GET FAILED JOBS (for debugging)
//    */
//   async getFailedJobs(queueName: 'email' | 'payment') {
//     const queue = queueName === 'email' ? this.emailQueue : this.paymentQueue;

//     // Get all failed jobs
//     const failedJobs = await queue.getFailed(0, -1);

//     return failedJobs.map(job => ({
//       jobId: job.id,
//       data: job.data,
//       error: job.failedReason,
//       attempts: job.attemptsMade,
//       maxAttempts: job.opts.attempts,
//       failedAt: new Date(job.failedTimestamp),
//     }));
//   }

//   /**
//    * RETRY FAILED JOBS
//    */
//   async retryFailedJobs(queueName: 'email' | 'payment') {
//     const queue = queueName === 'email' ? this.emailQueue : this.paymentQueue;

//     const failedJobs = await queue.getFailed(0, -1);

//     for (const job of failedJobs) {
//       await job.retry(); // Retry the job
//     }

//     return { retried: failedJobs.length };
//   }
// }

// /**
//  * 🔍 LISTEN TO JOB EVENTS
//  */

// @Injectable()
// export class JobEventListener {
//   constructor(@InjectQueue('email') private emailQueue: Queue) {}

//   /**
//    * SUBSCRIBE TO JOB EVENTS
//    */
//   async setupEventListeners() {
//     // Job completed successfully
//     this.emailQueue.on('completed', (job) => {
//       console.log(`✅ Job #${job.id} completed`, job.data);
//     });

//     // Job failed
//     this.emailQueue.on('failed', (job, err) => {
//       console.log(`❌ Job #${job.id} failed: ${err.message}`);
//       console.log(`   Attempts: ${job.attemptsMade}/${job.opts.attempts}`);
//     });

//     // Job is being processed
//     this.emailQueue.on('active', (job) => {
//       console.log(`🔄 Job #${job.id} started processing`);
//     });

//     // Job is stuck (timeout)
//     this.emailQueue.on('stalled', (job) => {
//       console.log(`⚠️  Job #${job.id} stalled (taking too long!)`);
//     });
//   }
// }

// // ============================================================================
// // 7️⃣ COMPLETE REAL WORLD EXAMPLE
// // ============================================================================

// /**
//  * 🛍️ E-COMMERCE: ORDER CHECKOUT WITH MULTIPLE WORKERS
//  * 
//  * When user clicks "Place Order":
//  * 1. Create order in database (fast)
//  * 2. Queue payment job (background worker)
//  * 3. Queue email job (background worker)
//  * 4. Queue inventory job (background worker)
//  * 5. Return immediately to user
//  */

// @Injectable()
// export class CheckoutService {
//   constructor(
//     @InjectQueue('payment') private paymentQueue: Queue,
//     @InjectQueue('email') private emailQueue: Queue,
//     @InjectQueue('inventory') private inventoryQueue: Queue,
//     private orderRepository: OrderRepository,
//   ) {}

//   async checkout(dto: CheckoutDto) {
//     console.log('🛒 Checkout started');

//     // ✅ STEP 1: Create order (synchronous - fast!)
//     const order = await this.orderRepository.create({
//       userId: dto.userId,
//       items: dto.items,
//       total: dto.total,
//       status: 'PENDING',
//     });
//     console.log('✅ Order created in database');

//     // ✅ STEP 2: Queue payment job (async)
//     await this.paymentQueue.add(
//       {
//         orderId: order.id,
//         amount: order.total,
//         paymentMethod: dto.paymentMethod,
//       },
//       {
//         attempts: 5, // Very important! Money-critical
//         backoff: { type: 'exponential', delay: 2000 },
//         priority: 1, // High priority
//       },
//     );
//     console.log('✅ Payment job queued');

//     // ✅ STEP 3: Queue email job (async)
//     await this.emailQueue.add(
//       {
//         email: dto.email,
//         orderId: order.id,
//         items: dto.items,
//       },
//       {
//         attempts: 3,
//         backoff: { type: 'exponential', delay: 1000 },
//       },
//     );
//     console.log('✅ Email job queued');

//     // ✅ STEP 4: Queue inventory update (async)
//     await this.inventoryQueue.add(
//       {
//         orderId: order.id,
//         items: dto.items,
//       },
//       {
//         attempts: 3,
//       },
//     );
//     console.log('✅ Inventory job queued');

//     // ✅ STEP 5: Return immediately!
//     console.log('✅ Checkout response sent (6ms total)');

//     return {
//       success: true,
//       orderId: order.id,
//       message: 'Order received! Processing payment...',
//     };
//   }
// }

// /**
//  * TIMELINE:
//  * 
//  * User Action:
//  * T=0ms:   Click "Place Order"
//  * 
//  * Main App (Fast):
//  * T=0-5ms:   Create order in DB
//  * T=5-6ms:   Queue 3 jobs
//  * T=6ms:     Response sent to user ✅
//  * User sees: "Order received! Redirecting to confirmation..."
//  * 
//  * Meanwhile (Background Workers):
//  * T=6-2000ms:  Payment worker processes payment
//  * T=2000ms:    Payment done! Order status = PAID
//  * 
//  * T=6-1000ms:  Email worker sends confirmation email
//  * T=1000ms:    Email sent!
//  * 
//  * T=6-1500ms:  Inventory worker updates stock
//  * T=1500ms:    Inventory updated!
//  * 
//  * Result: User gets instant response (6ms) while all work done in background! ✅
//  */

// // ============================================================================
// // 8️⃣ SUMMARY
// // ============================================================================

// export const WorkerDetailedSummary = `
// WORKERS - CHI TIẾT TOÀN DIỆN

// 🎯 WORKER DEFINITION:
//   Worker = Background process xử lý công việc nặng
//   Không block main application
//   Tự động retry on failure

// 📊 WITHOUT WORKER (Blocking):
//   POST /register
//   ├─ Create user (5ms)
//   ├─ Send email (2000ms) ← BLOCKING!
//   └─ Response: 2005ms
  
//   1000 req/s × 2s = 2000 connections (CRASH!)

// ✅ WITH WORKER (Non-blocking):
//   POST /register
//   ├─ Create user (5ms)
//   ├─ Queue email (1ms)
//   └─ Response: 6ms
  
//   1000 req/s × 0.006s = 6 connections (OK!)
//   Email sent in background

// 🎯 3 LOẠI WORKER:

// 1️⃣ IN-PROCESS (Simple, not recommended)
//    └─ Worker chạy trong main process
//    └─ If crash: Worker crash too
//    └─ Not persistent

// 2️⃣ SEPARATE PROCESS (Bull + Redis) ← RECOMMENDED
//    └─ Worker chạy riêng
//    └─ Jobs persistent (Redis)
//    └─ Auto-retry
//    └─ Easy to scale

// 3️⃣ DISTRIBUTED (RabbitMQ, Kafka)
//    └─ Multiple workers on multiple servers
//    └─ Enterprise scale
//    └─ Complex setup

// 💡 BULL QUEUE FLOW:

// Producer (Main App):
//   └─ Create job → Add to queue (1ms)

// Queue (Redis):
//   └─ Store jobs durably

// Consumer (Worker):
//   └─ Get job → Process → Complete or Retry

// 📊 JOB LIFECYCLE:

// 1. waiting  → [Job added to queue]
// 2. active   → [Worker processing]
// 3. completed → [Success!] OR failed → [Error, will retry]
// 4. If retry exhausted → failed queue (for debugging)

// 🎯 COMMON USE CASES:

// 📧 Email Worker:     1-2s per email
// 💳 Payment Worker:   2-5s per transaction
// 📊 Report Worker:    5-30s per report
// 🎥 Video Worker:     30+ seconds per video
// 🔔 Notification:     1-3s per notification
// 📱 SMS:              0.5-2s per SMS

// ⏱️ PERFORMANCE GAIN:

// Response time:       2000ms → 6ms = 333x FASTER!
// Concurrent conns:    2000 → 6 = 333x LESS!
// CPU usage:           Distributed (main + worker)
// System status:       PRODUCTION READY ✅

// ✅ ALWAYS USE WORKERS FOR SLOW OPERATIONS!
// `;
