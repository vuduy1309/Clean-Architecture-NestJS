// /**
//  * ============================================================================
//  * WORKER HOẠT ĐỘNG NHƯ THẾ NÀO? - GIẢI THÍCH TỪ A-Z
//  * ============================================================================
//  *
//  * Trong file này, tôi sẽ giải thích chi tiết:
//  * 1. Job là gì
//  * 2. Job process là gì
//  * 3. Worker hoạt động như thế nào (step-by-step)
//  * 4. Ví dụ thực tế với timeline
//  */

// // ============================================================================
// // 1️⃣ JOB LÀ GÌ?
// // ============================================================================

// /**
//  * 🎯 JOB DEFINITION:
//  *
//  * Job = Một công việc cần thực hiện
//  *       Chứa dữ liệu cần thiết
//  *       Lưu trong queue
//  *       Chờ worker xử lý
//  *
//  * ANALOGY (类比):
//  *
//  * Tưởng tượng một nhà hàng:
//  * - Customer gọi món → Order (= Job)
//  * - Order viết trên giấy → Lưu trong queue
//  * - Chef đọc order → Process job
//  * - Chef nấu ăn → Execute job
//  * - Hoàn thành → Job done
//  *
//  * JOB STRUCTURE:
//  *
//  * {
//  *   id: "email-123",           // Unique ID
//  *   data: {                    // Data cần process
//  *     email: "user@example.com",
//  *     subject: "Welcome!",
//  *     body: "Hi there..."
//  *   },
//  *   status: "waiting",         // Current status
//  *   attempts: 0,               // Retry count
//  *   createdAt: 1700000000,     // Timestamp
//  *   ...other metadata
//  * }
//  */

// /**
//  * ✅ VÍ DỤ: Email Job
//  *
//  * const emailJob = {
//  *   id: 'email-001',
//  *   data: {
//  *     email: 'john@example.com',
//  *     subject: 'Welcome to our app!',
//  *     body: 'Hello John, thanks for signing up!'
//  *   },
//  *   status: 'waiting',
//  *   queue: 'email',
//  *   timestamp: 1700000000,
//  *   attempts: 0,
//  *   maxAttempts: 3,
//  *   lastError: null
//  * };
//  */

// // ============================================================================
// // 2️⃣ JOB PROCESS LÀ GÌ?
// // ============================================================================

// /**
//  * 🎯 JOB PROCESS DEFINITION:
//  *
//  * Job Process = Quá trình xử lý một job
//  *              Từ khi worker nhận job
//  *              Cho tới khi hoàn thành hoặc fail
//  *
//  * STEPS (5 bước chính):
//  *
//  * 1️⃣ FETCH: Worker lấy job từ queue
//  * 2️⃣ EXTRACT: Lấy dữ liệu từ job
//  * 3️⃣ EXECUTE: Thực hiện công việc
//  * 4️⃣ RESULT: Trả kết quả (success hoặc error)
//  * 5️⃣ COMPLETE: Hoàn thành hoặc retry
//  */

// const jobProcessSteps = `
// ┌─────────────────────────────────────────────┐
// │         JOB PROCESS - 5 STEPS               │
// └─────────────────────────────────────────────┘

// STEP 1️⃣: FETCH JOB FROM QUEUE
// ┌─────────────────────────────────────────────┐
// │ Redis Queue                                 │
// │ [Job #1: email]  ← Worker fetches this     │
// │ [Job #2: email]                            │
// │ [Job #3: email]                            │
// │                                            │
// │ Job Status: waiting → active               │
// └─────────────────────────────────────────────┘
// Timeline: T=0ms

// STEP 2️⃣: EXTRACT JOB DATA
// ┌─────────────────────────────────────────────┐
// │ Job {                                      │
// │   id: 'email-001',                         │
// │   data: {                                  │
// │     email: 'john@example.com',  ← Extract │
// │     subject: 'Welcome!',        ← Extract │
// │     body: 'Hi John...'          ← Extract │
// │   }                                        │
// │ }                                          │
// └─────────────────────────────────────────────┘
// Timeline: T=0-1ms

// STEP 3️⃣: EXECUTE JOB (Send email)
// ┌─────────────────────────────────────────────┐
// │ await emailService.send({                  │
// │   to: 'john@example.com',                  │
// │   subject: 'Welcome!',                     │
// │   html: 'Hi John...'                       │
// │ });                                        │
// │                                            │
// │ → Network request to email server          │
// │ → Email server processes                   │
// │ → Email sent successfully ✅               │
// └─────────────────────────────────────────────┘
// Timeline: T=1-2000ms (Takes 2 seconds!)

// STEP 4️⃣: GET RESULT
// ┌─────────────────────────────────────────────┐
// │ Success! ✅                                │
// │ Return: { success: true, id: 'email-001' }│
// │                                            │
// │ OR                                         │
// │                                            │
// │ Error! ❌                                  │
// │ Throw: Error('Connection timeout')         │
// └─────────────────────────────────────────────┘
// Timeline: T=2000ms

// STEP 5️⃣: COMPLETE OR RETRY
// ┌─────────────────────────────────────────────┐
// │ SUCCESS:                                   │
// │ ├─ Job Status: completed                  │
// │ ├─ Remove from queue                      │
// │ ├─ Done! ✅                                │
// │                                            │
// │ ERROR (1st attempt):                       │
// │ ├─ Job Status: failed (will retry)        │
// │ ├─ Wait 2 seconds (backoff)               │
// │ ├─ Retry job (attempt 2)                  │
// │                                            │
// │ ERROR (after all retries):                │
// │ ├─ Job Status: failed (permanent)         │
// │ ├─ Move to failed queue                   │
// │ ├─ Manual inspection needed                │
// └─────────────────────────────────────────────┘
// Timeline: T=2000-2002ms
// `;

// // ============================================================================
// // 3️⃣ WORKER HOẠT ĐỘNG BƯỚC-BƯỚC
// // ============================================================================

// /**
//  * 🎯 WORKER LÀ GÌ?
//  *
//  * Worker = Một process độc lập
//  *         Chạy 24/7
//  *         Liên tục lấy job từ queue
//  *         Xử lý job
//  *         Chờ job tiếp theo
//  */

// const workerLifecycle = `
// ┌────────────────────────────────────────────────────┐
// │      WORKER LIFECYCLE - CHI TIẾT                  │
// └────────────────────────────────────────────────────┘

// STARTUP (T=-1000ms):
// ┌────────────────────────────────────────────────────┐
// │ 1. Start worker process                           │
// │ 2. Connect to Redis                               │
// │ 3. Connect to database                            │
// │ 4. Ready to accept jobs                           │
// │ Status: IDLE (waiting for jobs)                   │
// └────────────────────────────────────────────────────┘

// CONTINUOUS LOOP (T=0ms onwards):
// ┌────────────────────────────────────────────────────┐
// │ WHILE WORKER RUNNING:                             │
// │                                                   │
// │ 1️⃣  Check queue: "Any jobs waiting?"             │
// │     └─ Query Redis every 1 second               │
// │                                                   │
// │ 2️⃣  If NO jobs:                                  │
// │     └─ Wait 1 second                             │
// │     └─ Go back to step 1️⃣                        │
// │                                                   │
// │ 3️⃣  If YES, get next job:                        │
// │     ├─ Lock job (prevent other workers taking)  │
// │     ├─ Mark as "active"                         │
// │     └─ Process job (execute function)           │
// │                                                   │
// │ 4️⃣  After processing:                            │
// │     ├─ If success: Mark as "completed"          │
// │     ├─ If error: Mark as "failed"               │
// │     ├─ Unlock job                               │
// │     └─ Go back to step 1️⃣ (repeat)              │
// └────────────────────────────────────────────────────┘

// DETAILED PROCESS:
// `;

// /**
//  * 🎯 STEP-BY-STEP: WORKER PROCESSING A JOB
//  */

// const workerStepByStep = `
// ════════════════════════════════════════════════════
// T=0ms: WORKER IDLE, CHECKING QUEUE
// ════════════════════════════════════════════════════

// Worker loop:
// └─ Check Redis queue for waiting jobs
//    └─ Redis: "Yes! 5 emails waiting"

// Worker: "I found a job! Locking it..."
// └─ Lock job #email-001 (prevent other workers taking it)
// └─ Get job data from Redis
// └─ Mark status: "active"

// ════════════════════════════════════════════════════
// T=1ms: EXTRACT JOB DATA
// ════════════════════════════════════════════════════

// Job data:
// {
//   id: 'email-001',
//   data: {
//     email: 'john@example.com',
//     subject: 'Welcome!',
//     body: 'Hello John...'
//   },
//   attempts: 0,
//   createdAt: 1700000000
// }

// Worker: "OK, I need to send email to john@example.com"

// ════════════════════════════════════════════════════
// T=1-2000ms: EXECUTE JOB (SEND EMAIL)
// ════════════════════════════════════════════════════

// Worker code:
// ┌────────────────────────────────────────────────────┐
// │ async handleEmailJob(job) {                       │
// │   const { email, subject, body } = job.data;     │
// │                                                   │
// │   // Call email service (network call!)           │
// │   await this.emailService.send({                 │
// │     to: email,                                   │
// │     subject,                                     │
// │     html: body                                   │
// │   });                                            │
// │                                                   │
// │   return { success: true };                      │
// │ }                                                │
// └────────────────────────────────────────────────────┘

// What happens:
// 1. Worker calls emailService.send()
// 2. Service makes HTTP request to email provider (Gmail, SendGrid, etc.)
// 3. Email provider processes email
// 4. Email sent! Or... fails ❌

// Scenario A - SUCCESS (2000ms later):
// ├─ Email provider: "Email sent successfully!"
// ├─ Function returns: { success: true }
// └─ No error thrown

// Scenario B - ERROR (email provider timeout):
// ├─ Email provider: (no response for 10 seconds)
// ├─ Function throws: Error('Connection timeout')
// └─ Error caught

// ════════════════════════════════════════════════════
// T=2000ms: SCENARIO A - SUCCESS
// ════════════════════════════════════════════════════

// Worker: "Great! Email sent successfully!"

// try {
//   const result = await this.emailService.send(...);
//   // Result: { success: true }
// } catch (error) {
//   // No error, skip this block
// }

// // Execute this:
// console.log('✅ Job completed!');
// job.complete(result); // Mark job as completed

// Redis update:
// └─ Job status: active → completed
// └─ Remove job from queue
// └─ Job done!

// Worker: "Job completed! Moving to next job..."
// └─ Unlock job
// └─ Go back to checking queue

// ════════════════════════════════════════════════════
// T=2000ms: SCENARIO B - ERROR (First attempt)
// ════════════════════════════════════════════════════

// Worker: "Error! Email send failed!"

// try {
//   const result = await this.emailService.send(...);
// } catch (error) {
//   // Caught error: "Connection timeout"
//   console.log('❌ Job failed:', error.message);

//   // Throw error → Bull will handle retry
//   throw error;
// }

// Redis update:
// ├─ Job status: active → failed (temporary)
// ├─ Attempts: 0 → 1
// ├─ Error: "Connection timeout"
// ├─ Re-queue for retry
// └─ Wait 2 seconds (exponential backoff: 2^1)

// Worker: "Job will retry in 2 seconds. Processing next job..."
// └─ Unlock job
// └─ Go back to checking queue

// ════════════════════════════════════════════════════
// T=2002ms: RETRY JOB (Attempt 2)
// ════════════════════════════════════════════════════

// Worker: "2 seconds passed. Retrying job #email-001..."

// Same process as before:
// 1. Lock job
// 2. Extract data
// 3. Send email
// 4. If success: Done ✅
// 5. If error: Retry again (attempt 3)

// ════════════════════════════════════════════════════
// T=2004ms: SECOND RETRY (Attempt 3)
// ════════════════════════════════════════════════════

// If still fails:
// ├─ Wait 4 seconds (exponential: 2^2)
// ├─ One more retry

// ════════════════════════════════════════════════════
// T=2008ms: THIRD RETRY ATTEMPT
// ════════════════════════════════════════════════════

// If fails again:
// ├─ Max attempts reached (3 attempts)
// ├─ Job status: failed (permanent)
// ├─ Move to failed queue
// ├─ Manual inspection needed
// └─ Alert admin: "Email to john@example.com failed!"

// ════════════════════════════════════════════════════
// SUMMARY - ONE JOB PROCESS:
// ════════════════════════════════════════════════════

// SUCCESS CASE:
// T=0ms:    Worker finds job
// T=1ms:    Extract data
// T=1-2000ms: Send email
// T=2000ms: Email sent ✅ → Job completed → Next job

// ERROR CASE (3 retries):
// T=0ms:      Worker finds job
// T=1-2000ms: Send email (attempt 1, fails)
// T=2000ms:   Wait 2 seconds
// T=2000-4000ms: Send email (attempt 2, fails)
// T=4000ms:   Wait 4 seconds
// T=4000-6000ms: Send email (attempt 3, fails)
// T=6000ms:   Max retries reached → Failed queue
//             Alert admin 🚨

// ════════════════════════════════════════════════════
// `;

// // ============================================================================
// // 4️⃣ CODE EXAMPLE: ACTUAL WORKER IMPLEMENTATION
// // ============================================================================

// /**
//  * ✅ REAL CODE: Email Worker
//  */

// import { Processor, Process } from '@nestjs/bull';
// import { Job } from 'bull';
// import { Injectable } from '@nestjs/common';

// /**
//  * ✅ STEP 1: Define worker class
//  */
// @Processor('email') // Process jobs from 'email' queue
// @Injectable()
// export class EmailWorker {
//   constructor(private emailService: EmailService) {}

//   /**
//    * ✅ STEP 2: Define job handler
//    *
//    * This function is called for EACH job in queue
//    * It's automatically called by Bull when:
//    * - A job arrives in queue
//    * - A retry is needed
//    */
//   @Process() // Handle all jobs in this queue
//   async handleEmailJob(job: Job<{ email: string; subject: string; body: string }>) {
//     /**
//      * ═══════════════════════════════════════════════════════════
//      * PHASE 1: INITIALIZE (0ms)
//      * ═══════════════════════════════════════════════════════════
//      */

//     console.log(`\n${'='.repeat(60)}`);
//     console.log(`📧 PROCESSING EMAIL JOB #${job.id}`);
//     console.log(`${'='.repeat(60)}`);

//     // ✅ Extract job data
//     const { email, subject, body } = job.data;

//     console.log(`📨 Email: ${email}`);
//     console.log(`📌 Subject: ${subject}`);
//     console.log(`📝 Body: ${body.substring(0, 50)}...`);
//     console.log(`🔄 Attempt: ${job.attemptsMade + 1}/${job.opts.attempts}`);

//     /**
//      * ═══════════════════════════════════════════════════════════
//      * PHASE 2: PROGRESS REPORTING (Optional)
//      * ═══════════════════════════════════════════════════════════
//      */

//     // Tell Bull that we're 10% done
//     job.progress(10);
//     console.log('⏳ Progress: 10%');

//     // Simulate some preprocessing
//     await this.sleep(100);

//     job.progress(30);
//     console.log('⏳ Progress: 30%');

//     /**
//      * ═══════════════════════════════════════════════════════════
//      * PHASE 3: EXECUTE JOB (Network call)
//      * ═══════════════════════════════════════════════════════════
//      */

//     try {
//       job.progress(50);
//       console.log('⏳ Progress: 50%');

//       // ✅ THIS IS WHERE THE WORK HAPPENS
//       // This call takes 1-2 seconds (network I/O)
//       const result = await this.emailService.send({
//         to: email,
//         subject,
//         html: body,
//       });

//       console.log(`✅ Email sent! (provider response: ${result.id})`);

//       job.progress(100);
//       console.log('⏳ Progress: 100%');

//       /**
//        * ═══════════════════════════════════════════════════════════
//        * PHASE 4: SUCCESS - RETURN RESULT
//        * ═══════════════════════════════════════════════════════════
//        */

//       // ✅ Job completed successfully!
//       console.log(`✅ JOB #${job.id} COMPLETED`);
//       console.log(`${'='.repeat(60)}\n`);

//       return {
//         success: true,
//         messageId: result.id,
//         email,
//         completedAt: new Date(),
//       };

//       // ❌ This code is NOT executed (early return)
//       // END OF TRY BLOCK

//     } catch (error) {
//       /**
//        * ═══════════════════════════════════════════════════════════
//        * PHASE 5: ERROR - HANDLE FAILURE
//        * ═══════════════════════════════════════════════════════════
//        */

//       console.error(`❌ ERROR sending email: ${error.message}`);
//       console.error(`   Type: ${error.name}`);
//       console.error(`   Stack: ${error.stack}`);

//       // ✅ Check if we should retry
//       const attemptsLeft = job.opts.attempts - job.attemptsMade - 1;
//       console.log(`🔄 Attempts left: ${attemptsLeft}`);

//       if (attemptsLeft > 0) {
//         // ✅ RETRY: Throw error, Bull will retry automatically
//         console.log(`⏳ Will retry in ${Math.pow(2, job.attemptsMade)} seconds...`);
//         console.log(`${'='.repeat(60)}\n`);

//         throw error; // Bull catches this and retries
//       } else {
//         // ❌ NO MORE RETRIES: Job failed permanently
//         console.error(`❌ JOB #${job.id} FAILED (no more retries)`);
//         console.log(`${'='.repeat(60)}\n`);

//         throw error; // Move to failed queue
//       }
//     }
//   }

//   // Helper function
//   private sleep(ms: number): Promise<void> {
//     return new Promise(resolve => setTimeout(resolve, ms));
//   }
// }

// /**
//  * ═══════════════════════════════════════════════════════════
//  * WHAT HAPPENS AFTER JOB PROCESSING:
//  * ═══════════════════════════════════════════════════════════
//  *
//  * SUCCESS:
//  * ├─ Function returns result
//  * ├─ Bull marks job as "completed"
//  * ├─ Job removed from queue
//  * ├─ Worker continues to next job
//  * └─ Result stored (if needed for history)
//  *
//  * ERROR (with retries left):
//  * ├─ Function throws error
//  * ├─ Bull catches error
//  * ├─ Wait for backoff time (2s, 4s, 8s...)
//  * ├─ Re-queue job
//  * ├─ Mark as "waiting" again
//  * ├─ Worker tries again
//  * └─ Repeat
//  *
//  * ERROR (no retries left):
//  * ├─ Function throws error
//  * ├─ Bull catches error (after 3 attempts)
//  * ├─ Move to "failed" queue
//  * ├─ Worker continues to next job
//  * ├─ Alert admin about failure
//  * └─ Manual inspection needed
//  */

// // ============================================================================
// // 5️⃣ TIMELINE EXAMPLE: MULTIPLE WORKERS PROCESSING JOBS
// // ============================================================================

// /**
//  * 🎯 REAL SCENARIO: 10 emails in queue, 2 workers
//  */

// const timelineExample = `
// ╔════════════════════════════════════════════════════════════════════════════╗
// ║      TIMELINE: 10 EMAILS + 2 WORKERS                                      ║
// ╚════════════════════════════════════════════════════════════════════════════╝

// QUEUE STATE: Redis
// ┌────────────────────────────────────────────────────────────────────────────┐
// │ Waiting:                                                                   │
// │ [Email #1 to john@ex.com]                                                 │
// │ [Email #2 to jane@ex.com]                                                 │
// │ [Email #3 to bob@ex.com]                                                  │
// │ [Email #4 to alice@ex.com]                                                │
// │ [Email #5 to charlie@ex.com]                                              │
// │ [Email #6 to david@ex.com]                                                │
// │ [Email #7 to emma@ex.com]                                                 │
// │ [Email #8 to frank@ex.com]                                                │
// │ [Email #9 to grace@ex.com]                                                │
// │ [Email #10 to henry@ex.com]                                               │
// └────────────────────────────────────────────────────────────────────────────┘

// WORKERS: 2 processes running independently

// ════════════════════════════════════════════════════════════════════════════

// T=0ms: BOTH WORKERS START PROCESSING

// Worker #1:                          Worker #2:
// ├─ Check queue                      ├─ Check queue
// ├─ Found: Email #1                  ├─ Found: Email #2
// ├─ Lock Email #1                    ├─ Lock Email #2
// ├─ Mark: active                     ├─ Mark: active
// └─ Processing...                    └─ Processing...

// Queue state:
// Active: [Email #1 - Worker #1], [Email #2 - Worker #2]
// Waiting: [Email #3], [Email #4], [Email #5], ...

// ════════════════════════════════════════════════════════════════════════════

// T=0-2000ms: PARALLEL PROCESSING

// Worker #1:                          Worker #2:
// ├─ Sending Email #1                 ├─ Sending Email #2
// ├─ (network call)                   ├─ (network call)
// ├─ ⏳ Waiting for response...        ├─ ⏳ Waiting for response...
// └─ Takes ~2 seconds                 └─ Takes ~2 seconds

// Both work SIMULTANEOUSLY! 🚀

// ════════════════════════════════════════════════════════════════════════════

// T=2000ms: FIRST BATCH COMPLETES

// Worker #1:                          Worker #2:
// ├─ ✅ Email #1 sent!                ├─ ✅ Email #2 sent!
// ├─ Mark job: completed              ├─ Mark job: completed
// ├─ Check queue                      ├─ Check queue
// ├─ Found: Email #3                  ├─ Found: Email #4
// ├─ Lock Email #3                    ├─ Lock Email #4
// └─ Processing...                    └─ Processing...

// Queue state:
// Active: [Email #3 - Worker #1], [Email #4 - Worker #2]
// Waiting: [Email #5], [Email #6], [Email #7], ...

// ════════════════════════════════════════════════════════════════════════════

// T=2000-4000ms: SECOND BATCH PROCESSING

// Worker #1:                          Worker #2:
// ├─ Sending Email #3                 ├─ Sending Email #4
// ├─ (network call)                   ├─ (network call)
// └─ Takes ~2 seconds                 └─ Takes ~2 seconds

// ════════════════════════════════════════════════════════════════════════════

// T=4000ms: SECOND BATCH COMPLETES

// Worker #1:                          Worker #2:
// ├─ ✅ Email #3 sent!                ├─ ✅ Email #4 sent!
// ├─ Check queue                      ├─ Check queue
// ├─ Found: Email #5                  ├─ Found: Email #6
// └─ Processing...                    └─ Processing...

// ════════════════════════════════════════════════════════════════════════════

// T=6000ms: THIRD BATCH COMPLETES

// Worker #1:                          Worker #2:
// ├─ ✅ Email #5 sent!                ├─ ✅ Email #6 sent!
// ├─ Check queue                      ├─ Check queue
// ├─ Found: Email #7                  ├─ Found: Email #8
// └─ Processing...                    └─ Processing...

// ════════════════════════════════════════════════════════════════════════════

// T=8000ms: FOURTH BATCH COMPLETES

// Worker #1:                          Worker #2:
// ├─ ✅ Email #7 sent!                ├─ ✅ Email #8 sent!
// ├─ Check queue                      ├─ Check queue
// ├─ Found: Email #9                  ├─ Found: Email #10
// └─ Processing...                    └─ Processing...

// ════════════════════════════════════════════════════════════════════════════

// T=10000ms: LAST BATCH COMPLETES

// Worker #1:                          Worker #2:
// ├─ ✅ Email #9 sent!                ├─ ✅ Email #10 sent!
// ├─ Check queue                      ├─ Check queue
// ├─ No more jobs                     ├─ No more jobs
// ├─ IDLE (waiting)                   ├─ IDLE (waiting)
// └─ Checking queue every 1s...       └─ Checking queue every 1s...

// ════════════════════════════════════════════════════════════════════════════

// SUMMARY:

// • 10 emails processed
// • 2 workers (parallel)
// • Total time: 10 seconds (not 20!)
// • Each email: 2 seconds
// • 5 batches × 2 seconds = 10 seconds total

// If 1 worker: 10 emails × 2 seconds = 20 seconds
// If 2 workers: 10 emails ÷ 2 × 2 seconds = 10 seconds (2x FASTER!)
// If 5 workers: 10 emails ÷ 5 × 2 seconds = 4 seconds (5x FASTER!)

// ════════════════════════════════════════════════════════════════════════════
// `;

// // ============================================================================
// // 6️⃣ PRODUCER: HOW TO CREATE A JOB
// // ============================================================================

// /**
//  * ✅ PRODUCER: Add job to queue
//  */

// import { Injectable } from '@nestjs/common';
// import { InjectQueue } from '@nestjs/bull';
// import { Queue } from 'bull';

// @Injectable()
// export class RegistrationService {
//   constructor(@InjectQueue('email') private emailQueue: Queue) {}

//   async registerUser(dto: RegisterUserDto) {
//     console.log('🎯 User registration started');

//     // ✅ STEP 1: Create user (synchronous)
//     const user = await this.userRepository.create({
//       email: dto.email,
//       password: await bcrypt.hash(dto.password, 10),
//       name: dto.name,
//     });

//     console.log('✅ User created in database');

//     // ✅ STEP 2: Add job to queue (asynchronous)
//     /**
//      * What happens here:
//      * 1. Create job object with data
//      * 2. Add to Redis queue
//      * 3. Return immediately (1-2ms)
//      * 4. Worker will pick it up soon
//      */

//     const job = await this.emailQueue.add(
//       {
//         // Job data (passed to worker)
//         email: user.email,
//         subject: 'Welcome to our app!',
//         body: `Hello ${user.name}, thanks for signing up!`,
//       },
//       {
//         // Job options
//         jobId: `welcome-${user.id}`, // Unique identifier
//         delay: 0, // Process immediately
//         attempts: 3, // Retry 3 times on failure
//         backoff: {
//           type: 'exponential', // 2s, 4s, 8s
//           delay: 2000,
//         },
//       },
//     );

//     console.log(
//       `✅ Email job added to queue (Job ID: ${job.id}, Status: waiting)`,
//     );

//     /**
//      * TIMELINE FROM HERE:
//      * T=0ms:     Job added to Redis queue
//      * T=0-10ms:  Worker picks it up
//      * T=10-2010: Send email
//      * T=2010:    Email sent ✅
//      */

//     // ✅ STEP 3: Return response immediately
//     return {
//       success: true,
//       message: 'Registration successful! Check your email.',
//       user: {
//         id: user.id,
//         email: user.email,
//         name: user.name,
//       },
//     };
//     /**
//      * TOTAL TIME: ~20ms (not 2000ms!)
//      * Email will be sent in background
//      */
//   }
// }

// // ============================================================================
// // 7️⃣ SUMMARY & KEY CONCEPTS
// // ============================================================================

// export const WorkerDetailedExplanationSummary = `
// WORKER & JOB PROCESS - COMPLETE EXPLANATION

// 🎯 KEY CONCEPTS:

// JOB = Data structure containing:
//   - Data to process (email, payment details, etc.)
//   - Metadata (ID, attempts, status, etc.)
//   - Stored in Redis queue

// JOB PROCESS = Steps worker takes:
//   1️⃣  Fetch job from queue
//   2️⃣  Extract data from job
//   3️⃣  Execute function (send email, process payment, etc.)
//   4️⃣  Get result (success or error)
//   5️⃣  Complete job or retry

// WORKER = Process that:
//   - Runs independently
//   - Checks queue continuously
//   - Picks up jobs one by one
//   - Processes each job
//   - Handles failures/retries
//   - Reports completion

// ════════════════════════════════════════════════════════════

// SIMPLE ANALOGY:

// Queue = Restaurant counter with orders
// Job = One customer order (data)
// Worker = Chef processing orders

// Chef workflow:
// 1. Check counter: Any orders?
// 2. If YES: Take order (fetch)
// 3. Read order details (extract)
// 4. Cook the food (execute)
// 5. If dish looks good: Serve it ✅
// 6. If dish bad: Remake it (retry)

// ════════════════════════════════════════════════════════════

// REAL TIMELINE - SEND EMAIL:

// Producer (Main app):
// T=0ms:    Create user
// T=5ms:    Add email job to queue
// T=6ms:    Response sent to user ✅ (fast!)

// Worker (Background):
// T=0-50ms:  Idle, checking queue
// T=50ms:    Found email job
// T=50-2050ms: Send email (network call - 2 seconds)
// T=2050ms:  Email sent ✅

// User gets response: 6ms
// Email sent: 2050ms total
// But user doesn't wait! ✅

// ════════════════════════════════════════════════════════════

// WHY WORKERS ARE AWESOME:

// ❌ Without workers:
//   User waits 2 seconds for email to send
//   1000 users = 2000 concurrent connections
//   Server crashes! 💥

// ✅ With workers:
//   User gets response in 6ms
//   Email sent in background
//   1000 users = 6 concurrent connections
//   Server happy! ✅

// ════════════════════════════════════════════════════════════

// SCALING WITH MULTIPLE WORKERS:

// 1 worker: 10 jobs × 2s/job = 20 seconds
// 2 workers: 10 jobs ÷ 2 × 2s/job = 10 seconds (2x faster)
// 5 workers: 10 jobs ÷ 5 × 2s/job = 4 seconds (5x faster)
// 10 workers: 10 jobs ÷ 10 × 2s/job = 2 seconds (10x faster)

// Just add more workers on more servers! 🚀

// ════════════════════════════════════════════════════════════

// REMEMBER:

// • Producer adds jobs (1-2ms, non-blocking)
// • Worker processes jobs (takes time, runs separately)
// • User never waits for worker to finish
// • If job fails: Auto-retry 3 times
// • Jobs persistent: Won't be lost on crash
// • Multiple workers = More throughput

// ✅ PRODUCTION READY!
// `;
