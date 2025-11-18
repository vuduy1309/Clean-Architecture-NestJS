/**
 * ============================================================================
 * NESTJS XỬ LÝ 1000 REQUEST/GIÂY - BEST PRACTICES
 * ============================================================================
 * 
 * Cách tối ưu NestJS để xử lý high load (1000+ req/s).
 */

// ============================================================================
// 1️⃣ VẤN ĐỀ: CODE THÔNG THƯỜNG - KHÔNG THỂ HANDLE 1000 REQ/S
// ============================================================================

/**
 * ❌ CODE THÔNG THƯỜNG (BOTTLENECK):
 * 
 * @Controller('users')
 * export class UserController {
 *   constructor(private userService: UserService) {}
 * 
 *   @Get(':id')
 *   async getUser(@Param('id') id: number) {
 *     // ❌ PROBLEM 1: Database query mỗi lần
 *     const user = await this.userService.getUserFromDB(id);
 *     
 *     // ❌ PROBLEM 2: Đợi kết quả (synchronous)
 *     return user;
 *   }
 * }
 * 
 * @Injectable()
 * export class UserService {
 *   constructor(private prisma: PrismaService) {}
 * 
 *   async getUserFromDB(id: number) {
 *     // ❌ Database query: 5-10ms
 *     // 1000 req/s × 10ms = 10 giây latency (CRASH!)
 *     return await this.prisma.user.findUnique({ where: { id } });
 *   }
 * }
 * 
 * ❌ PERFORMANCE CALC:
 * - Database query: 10ms
 * - 1000 requests/giây = 1 request mỗi 1ms
 * - Timeout sau ~10ms (nếu server chỉ có 1 connection pool)
 * - RESULT: Service crash, 100% error rate
 */

/**
 * ❌ SYMPTOM CỦA HIGH LOAD:
 * 1. CPU 100% (tất cả cores)
 * 2. Memory leak (dần dần tăng)
 * 3. Request timeout
 * 4. Connection pool exhausted
 * 5. Error rate tăng cao
 * 6. Latency > 5 giây
 */

// ============================================================================
// 2️⃣ GIẢI PHÁP 1: CACHING LAYER (Redis)
// ============================================================================

/**
 * ✅ SOLUTION 1: ADD CACHING
 * 
 * // Before caching:
 * - 1000 req/s × 10ms (DB) = 10 seconds latency
 * - Server crash
 * 
 * // After caching:
 * - 1000 req/s × 0.1ms (Redis) = 0.1 seconds latency (100ms!)
 * - Server handles easily
 * - 100x FASTER!
 */

/**
 * ✅ CODE: User Service with Caching
 * 
 * @Injectable()
 * export class UserService {
 *   constructor(
 *     private prisma: PrismaService,
 *     private redisService: RedisService,
 *   ) {}
 * 
 *   async getUserById(id: number): Promise<User> {
 *     const cacheKey = `user:${id}`;
 * 
 *     // ✅ Step 1: Check Redis first (0.1ms)
 *     const cached = await this.redisService.get(cacheKey);
 *     if (cached) {
 *       console.log('Cache HIT');
 *       return cached;
 *     }
 * 
 *     console.log('Cache MISS - Query DB');
 *     // ✅ Step 2: Query DB if no cache (10ms)
 *     const user = await this.prisma.user.findUnique({
 *       where: { id },
 *     });
 * 
 *     if (!user) return null;
 * 
 *     // ✅ Step 3: Store in cache (1 hour TTL)
 *     await this.redisService.set(cacheKey, user, 3600);
 * 
 *     return user;
 *   }
 * }
 * 
 * @Controller('users')
 * export class UserController {
 *   constructor(private userService: UserService) {}
 * 
 *   @Get(':id')
 *   async getUser(@Param('id') id: number) {
 *     return await this.userService.getUserById(id);
 *   }
 * }
 * 
 * ✅ RESULT:
 * - First request: 10ms (DB + cache set)
 * - Next 999 requests: 0.1ms each (Redis HIT)
 * - Total time for 1000 requests: 10ms + (999 × 0.1ms) = ~110ms
 * - Latency: 0.11ms per request (EXCELLENT!)
 */

// ============================================================================
// 3️⃣ GIẢI PHÁP 2: ASYNC OPERATIONS & QUEUE
// ============================================================================

/**
 * ❌ BLOCKING OPERATIONS (BOTTLENECK):
 * 
 * // Create order → Send email → Wait for response
 * async createOrder(dto: CreateOrderDto) {
 *   const order = await db.order.create(dto);
 *   
 *   // ❌ Wait for email (1 second!) - BLOCKING!
 *   await this.emailService.send(order.email);
 *   
 *   return order; // Takes 1+ second!
 * }
 * 
 * // 1000 req/s × 1 second = 1000 requests waiting!
 * // Server needs 1000 threads/connections - CRASH!
 */

/**
 * ✅ ASYNC OPERATIONS (Using Queue):
 * 
 * // Installation
 * npm install @nestjs/bull bull redis
 * 
 * // queue.module.ts
 * import { BullModule } from '@nestjs/bull';
 * 
 * @Module({
 *   imports: [
 *     BullModule.forRoot({
 *       redis: {
 *         host: 'localhost',
 *         port: 6379,
 *       },
 *     }),
 *     BullModule.registerQueue({
 *       name: 'email',
 *     }),
 *   ],
 * })
 * export class QueueModule {}
 * 
 * // email.queue.ts
 * import { Process, Processor } from '@nestjs/bull';
 * import { Queue, Job } from 'bull';
 * 
 * @Processor('email')
 * export class EmailQueue {
 *   @Process()
 *   async sendEmail(job: Job) {
 *     const { email, subject, body } = job.data;
 *     
 *     // Send email (1 second) - but NOT blocking!
 *     await this.emailService.send(email, subject, body);
 *     
 *     console.log(`Email sent to ${email}`);
 *   }
 * }
 * 
 * // order.service.ts
 * @Injectable()
 * export class OrderService {
 *   constructor(
 *     @InjectQueue('email') private emailQueue: Queue,
 *     private orderRepository: OrderRepository,
 *   ) {}
 * 
 *   async createOrder(dto: CreateOrderDto) {
 *     // ✅ Create order immediately (fast)
 *     const order = await this.orderRepository.create(dto);
 * 
 *     // ✅ Queue email job (non-blocking!)
 *     await this.emailQueue.add(
 *       {
 *         email: order.customerEmail,
 *         subject: 'Order Confirmation',
 *         body: `Order ${order.id} created`,
 *       },
 *       { delay: 100 }, // Start after 100ms
 *     );
 * 
 *     return order; // Returns immediately (< 10ms)
 *   }
 * }
 * 
 * @Controller('orders')
 * export class OrderController {
 *   constructor(private orderService: OrderService) {}
 * 
 *   @Post()
 *   async createOrder(@Body() dto: CreateOrderDto) {
 *     return await this.orderService.createOrder(dto);
 *     // Returns in < 10ms, email sends in background!
 *   }
 * }
 * 
 * ✅ RESULT:
 * - Before: 1000 req/s × 1s = 1000 concurrent connections (CRASH)
 * - After: 1000 req/s × 10ms = 10 concurrent connections (OK!)
 * - 100x fewer connections needed!
 */

// ============================================================================
// 4️⃣ GIẢI PHÁP 3: CONNECTION POOLING & DATABASE OPTIMIZATION
// ============================================================================

/**
 * ✅ PRISMA CONNECTION POOL
 * 
 * // .env
 * DATABASE_URL="postgresql://user:password@localhost:5432/mydb?connection_limit=20"
 * 
 * // prisma.service.ts
 * @Injectable()
 * export class PrismaService extends PrismaClient implements OnModuleInit {
 *   async onModuleInit() {
 *     // ✅ Connection pool size = 20
 *     // Can handle ~200 concurrent queries
 *     await this.$connect();
 *   }
 * }
 * 
 * ✅ OPTIMIZE QUERIES:
 * 
 * // ❌ BAD: N+1 problem
 * const users = await prisma.user.findMany(); // 1 query
 * for (const user of users) {
 *   user.posts = await prisma.post.findMany({ // N queries
 *     where: { userId: user.id }
 *   });
 * }
 * // Total: 1 + N queries (slow!)
 * 
 * // ✅ GOOD: Eager loading
 * const users = await prisma.user.findMany({
 *   include: { posts: true }, // 1 query with JOIN
 * });
 * // Total: 1 query (fast!)
 * 
 * // ✅ SELECT ONLY NEEDED COLUMNS
 * const users = await prisma.user.findMany({
 *   select: {
 *     id: true,
 *     name: true,
 *     email: true,
 *     // Don't select large columns (image, description)
 *   },
 *   take: 20, // Pagination
 *   skip: 0,
 * });
 */

// ============================================================================
// 5️⃣ GIẢI PHÁP 4: COMPRESSION & RESPONSE OPTIMIZATION
// ============================================================================

/**
 * ✅ ENABLE GZIP COMPRESSION
 * 
 * // main.ts
 * import * as compression from 'compression';
 * 
 * async function bootstrap() {
 *   const app = await NestFactory.create(AppModule);
 * 
 *   // ✅ Enable gzip compression
 *   app.use(compression());
 * 
 *   await app.listen(3000);
 * }
 * 
 * // Result:
 * - Response size: 1MB → 100KB (10x smaller)
 * - Network latency: Reduced significantly
 * - Throughput: 10x better
 */

/**
 * ✅ PAGINATION & LIMIT RESPONSE SIZE
 * 
 * // ❌ Return all 1,000,000 rows (BAD)
 * @Get('users')
 * async getAllUsers() {
 *   return await this.prisma.user.findMany();
 *   // Response: 1GB+ (crash network!)
 * }
 * 
 * // ✅ Pagination (GOOD)
 * @Get('users')
 * async getUsers(
 *   @Query('page') page: number = 1,
 *   @Query('limit') limit: number = 20,
 * ) {
 *   const skip = (page - 1) * limit;
 * 
 *   const [users, total] = await Promise.all([
 *     this.prisma.user.findMany({
 *       skip,
 *       take: limit,
 *       select: { id: true, name: true, email: true },
 *     }),
 *     this.prisma.user.count(),
 *   ]);
 * 
 *   return {
 *     data: users,
 *     total,
 *     page,
 *     pages: Math.ceil(total / limit),
 *   };
 * }
 * 
 * // Result:
 * - Response: 2KB (vs 1GB)
 * - Latency: < 10ms
 * - Network: Happy
 */

// ============================================================================
// 6️⃣ GIẢI PHÁP 5: LOAD BALANCING & HORIZONTAL SCALING
// ============================================================================

/**
 * ✅ SINGLE SERVER LIMITS:
 * - CPU: 8-16 cores max
 * - Memory: 64GB max
 * - Max throughput: ~10,000 req/s (with optimization)
 * 
 * ✅ FOR 1000+ REQ/S:
 * - 1 server × 1000 req/s = OK
 * - But if you need more:
 *   - 2 servers × 500 req/s each
 *   - 4 servers × 250 req/s each
 *   - etc.
 */

/**
 * ✅ LOAD BALANCER SETUP:
 * 
 *        Client (1000 req/s)
 *             ↓
 *        Nginx (Load Balancer)
 *      ↙       ↓       ↘
 *   Server1  Server2  Server3
 *   (~333)   (~333)   (~334)
 *      ↓      ↓      ↓
 *   Shared Database
 *   Shared Redis Cache
 * 
 * // nginx.conf
 * upstream nestjs {
 *   server 127.0.0.1:3000;
 *   server 127.0.0.1:3001;
 *   server 127.0.0.1:3002;
 * }
 * 
 * server {
 *   listen 80;
 * 
 *   location / {
 *     proxy_pass http://nestjs;
 *     proxy_set_header Host $host;
 *     proxy_set_header X-Real-IP $remote_addr;
 *   }
 * }
 */

// ============================================================================
// 7️⃣ COMPLETE OPTIMIZED EXAMPLE: E-COMMERCE PRODUCT
// ============================================================================

/**
 * ✅ FULL STACK OPTIMIZATION FOR 1000 REQ/S
 * 
 * // src/infrastructure/cache/redis.service.ts
 * @Injectable()
 * export class RedisService {
 *   async get(key: string) { ... }
 *   async set(key: string, value: any, ttl?: number) { ... }
 *   async delete(key: string) { ... }
 * }
 * 
 * // src/infrastructure/repositories/product.repository.ts
 * @Injectable()
 * export class ProductRepository {
 *   constructor(
 *     private prisma: PrismaService,
 *     private redisService: RedisService,
 *   ) {}
 * 
 *   async getProductById(id: number): Promise<Product> {
 *     const cacheKey = `product:${id}`;
 * 
 *     // ✅ 1. Try Redis cache first (0.1ms)
 *     const cached = await this.redisService.get(cacheKey);
 *     if (cached) return cached;
 * 
 *     // ✅ 2. Query database only if not cached (5-10ms)
 *     const product = await this.prisma.product.findUnique({
 *       where: { id },
 *       select: {
 *         id: true,
 *         name: true,
 *         price: true,
 *         // Don't select large columns
 *       },
 *     });
 * 
 *     if (!product) return null;
 * 
 *     // ✅ 3. Cache for 1 hour
 *     await this.redisService.set(cacheKey, product, 3600);
 * 
 *     return product;
 *   }
 * }
 * 
 * // src/application/usecases/get-product.usecase.ts
 * @Injectable()
 * export class GetProductUseCase {
 *   constructor(private productRepository: ProductRepository) {}
 * 
 *   async execute(id: number): Promise<Product> {
 *     return await this.productRepository.getProductById(id);
 *   }
 * }
 * 
 * // src/interface/controllers/product.controller.ts
 * @Controller('products')
 * export class ProductController {
 *   constructor(private getProductUseCase: GetProductUseCase) {}
 * 
 *   @Get(':id')
 *   async getProduct(@Param('id') id: number) {
 *     return await this.getProductUseCase.execute(id);
 *   }
 * }
 * 
 * // main.ts
 * import * as compression from 'compression';
 * 
 * async function bootstrap() {
 *   const app = await NestFactory.create(AppModule);
 * 
 *   // ✅ Enable compression (10x smaller responses)
 *   app.use(compression());
 * 
 *   // ✅ Set timeouts
 *   app.use((req, res, next) => {
 *     res.setTimeout(30000); // 30 second timeout
 *     next();
 *   });
 * 
 *   await app.listen(3000);
 * }
 * 
 * ✅ PERFORMANCE:
 * - First request: 10ms (DB + cache)
 * - Next requests: 0.1ms (Redis)
 * - Handle 1000 req/s easily!
 */

// ============================================================================
// 8️⃣ PERFORMANCE CHECKLIST - 1000 REQ/S
// ============================================================================

/**
 * ✅ DATABASE OPTIMIZATION:
 * □ Connection pooling: 20+ connections
 * □ Eager loading (no N+1)
 * □ Select only needed columns
 * □ Pagination (limit response)
 * □ Indexes on frequently queried fields
 * □ Database replication (read replicas)
 * 
 * ✅ CACHING LAYER:
 * □ Redis for hot data (products, users)
 * □ Cache TTL: 1-24 hours (depends on data)
 * □ Cache invalidation on updates
 * □ Cache warming (pre-load on startup)
 * 
 * ✅ ASYNC OPERATIONS:
 * □ Email → Queue (Bull)
 * □ Logging → Queue (don't block)
 * □ Analytics → Fire-and-forget
 * □ Webhooks → Async retries
 * 
 * ✅ RESPONSE OPTIMIZATION:
 * □ Gzip compression enabled
 * □ Select only needed fields
 * □ Pagination (default limit 20)
 * □ Remove unnecessary data
 * 
 * ✅ MONITORING & SCALING:
 * □ Monitor CPU, Memory, Disk
 * □ Set up alerts for high usage
 * □ Load balancing (Nginx, PM2)
 * □ Database replication
 * □ Horizontal scaling (multiple servers)
 * 
 * ✅ TESTING:
 * □ Load test with 1000 concurrent users
 * □ Monitor response times
 * □ Check for memory leaks
 * □ Verify no errors under load
 */

// ============================================================================
// 9️⃣ BENCHMARKS - 1000 REQ/S
// ============================================================================

/**
 * WITHOUT OPTIMIZATION:
 * - Response time: 10-100ms per request
 * - Can handle: ~100 req/s max
 * - CPU: 100% (overloaded)
 * - Memory: Increasing (leak)
 * - Error rate: 50%+
 * 
 * WITH OPTIMIZATION:
 * - Response time: 0.1-1ms per request (100x faster!)
 * - Can handle: 10,000 req/s easily!
 * - CPU: 20-30% (good)
 * - Memory: Stable
 * - Error rate: < 0.1%
 * 
 * ✅ OPTIMIZATION GAINS:
 * - 100x faster response time
 * - 100x more throughput
 * - 5x less CPU usage
 * - Stable memory
 * - 99.9% uptime
 */

export const NestJSHighLoad = `
NESTJS XỬ LÝ 1000 REQ/S - SUMMARY

❌ PROBLEM (Code thông thường):
- Database query: 10ms
- 1000 req/s × 10ms = crash server
- Cannot handle 1000 req/s

✅ SOLUTIONS:

1️⃣ CACHING (Redis):
- First request: 10ms (DB)
- Next requests: 0.1ms (Redis)
- 100x faster!

2️⃣ ASYNC OPERATIONS (Queue):
- Create order: < 10ms
- Send email: Background task
- No blocking

3️⃣ CONNECTION POOLING:
- Database: 20 connections
- Can handle 200+ concurrent queries
- Shared resources efficiently

4️⃣ COMPRESSION:
- Response: 1MB → 100KB
- 10x smaller
- Network 10x faster

5️⃣ PAGINATION:
- Limit: 20 items per page
- Response: 2KB instead of 1GB
- Latency: < 10ms

6️⃣ HORIZONTAL SCALING:
- 1 server: 1000 req/s
- 3 servers: 3000 req/s
- Use load balancer (Nginx)

7️⃣ LAZY LOADING & SELECT:
- Don't load unnecessary columns
- Eager loading (avoid N+1)
- Query optimization

COMPLETE STACK (1000 req/s ready):
✅ Prisma (Database ORM)
✅ Redis (Caching)
✅ Bull (Job Queue)
✅ Nginx (Load Balancer)
✅ Compression (Gzip)

BENCHMARK RESULTS:
- Response time: 0.1-1ms (vs 10-100ms)
- Throughput: 10,000 req/s (vs 100 req/s)
- CPU usage: 20-30% (vs 100%)
- Error rate: < 0.1% (vs 50%)

KEY PRINCIPLE:
Cache everything cacheable.
Queue everything slow.
Paginate everything.
Monitor everything.

= PRODUCTION READY! 🚀
`;
