/**
 * ============================================================================
 * REDIS - IN-MEMORY CACHE & DATABASE
 * ============================================================================
 * 
 * Redis là database in-memory siêu nhanh, thường dùng cho caching & session.
 */

// ============================================================================
// 1️⃣ REDIS LÀ GÌ?
// ============================================================================

/**
 * REDIS = Remote Dictionary Server
 * 
 * ĐỊNH NGHĨA:
 * - In-memory data structure store
 * - Key-Value database
 * - Lightning fast (microseconds)
 * - Volatile (data mất khi restart nếu không lưu)
 * 
 * DÙNG ĐỂ:
 * ✅ Cache layer (tăng tốc độ)
 * ✅ Session storage
 * ✅ Real-time analytics
 * ✅ Message queue
 * ✅ Rate limiting
 * ✅ Leaderboards
 * ✅ Temporary data
 */

/**
 * REDIS vs DATABASE:
 * 
 * DATABASE (PostgreSQL, MongoDB):
 * - Persistent storage (data lưu lâu dài)
 * - Slower (milliseconds)
 * - Large capacity (terabytes)
 * - ACID compliance
 * - Dùng cho: Primary data storage
 * 
 * REDIS:
 * - In-memory (data mất khi restart)
 * - Ultra-fast (microseconds)
 * - Limited by RAM (gigabytes)
 * - Minimal durability options
 * - Dùng cho: Cache, sessions, temporary data
 */

/**
 * TYPICAL ARCHITECTURE:
 * 
 * Client Request
 *    ↓
 * Check Redis Cache
 *    ↓ (hit) → Return cached data (fast!)
 *    ↓ (miss)
 * Query Database (slow)
 *    ↓
 * Store in Redis Cache
 *    ↓
 * Return to client
 */

// ============================================================================
// 2️⃣ REDIS DATA TYPES
// ============================================================================

/**
 * Redis support multiple data types:
 */

/**
 * 1️⃣ STRING (Text/Number)
 * 
 * SET mykey "Hello"
 * GET mykey → "Hello"
 * 
 * INCR counter → 1, 2, 3...
 * 
 * ✅ Dùng cho: Cache, counters, flags
 */

/**
 * 2️⃣ LIST (Danh sách)
 * 
 * LPUSH mylist "a" "b" "c"  // Left push
 * RPUSH mylist "d"          // Right push
 * LRANGE mylist 0 -1        → ["c", "b", "a", "d"]
 * 
 * ✅ Dùng cho: Queues, recent items
 */

/**
 * 3️⃣ SET (Tập hợp)
 * 
 * SADD myset "a" "b" "c"
 * SMEMBERS myset → ["a", "b", "c"]
 * SISMEMBER myset "a" → 1 (true)
 * 
 * ✅ Dùng cho: Tags, followers, unique items
 */

/**
 * 4️⃣ SORTED SET (Tập hợp có score)
 * 
 * ZADD leaderboard 100 "Alice" 200 "Bob" 150 "Charlie"
 * ZRANGE leaderboard 0 -1 WITHSCORES
 *   → [["Alice", 100], ["Charlie", 150], ["Bob", 200]]
 * 
 * ✅ Dùng cho: Leaderboards, rankings, scored items
 */

/**
 * 5️⃣ HASH (Object/Dictionary)
 * 
 * HSET user:1 name "Alice" email "alice@ex.com" age 25
 * HGETALL user:1
 *   → {"name": "Alice", "email": "alice@ex.com", "age": 25}
 * 
 * ✅ Dùng cho: Object caching, user sessions
 */

/**
 * 6️⃣ STREAM (Append-only log)
 * 
 * XADD mystream "*" field value
 * XRANGE mystream - +
 * 
 * ✅ Dùng cho: Event logs, message streams
 */

// ============================================================================
// 3️⃣ REDIS WITH NESTJS - BASIC SETUP
// ============================================================================

/**
 * ✅ INSTALLATION:
 * 
 * npm install redis @nestjs/cache-manager cache-manager-redis-store
 */

/**
 * ✅ SIMPLE REDIS CLIENT (Not NestJS):
 * 
 * import * as redis from 'redis';
 * 
 * const client = redis.createClient({
 *   host: 'localhost',
 *   port: 6379,
 * });
 * 
 * client.on('connect', () => console.log('Redis connected'));
 * client.on('error', (err) => console.log('Redis error:', err));
 * 
 * // SET
 * client.set('user:1:name', 'Alice', (err, reply) => {
 *   console.log(reply); // OK
 * });
 * 
 * // GET
 * client.get('user:1:name', (err, reply) => {
 *   console.log(reply); // "Alice"
 * });
 * 
 * // DELETE
 * client.del('user:1:name', (err, reply) => {
 *   console.log(reply); // 1 (deleted)
 * });
 * 
 * // EXPIRATION (TTL)
 * client.setex('temp:data', 60, 'value', (err, reply) => {
 *   // Expires after 60 seconds
 * });
 */

/**
 * ✅ NESTJS REDIS SERVICE:
 * 
 * // redis.service.ts
 * import { Injectable } from '@nestjs/common';
 * import * as redis from 'redis';
 * 
 * @Injectable()
 * export class RedisService {
 *   private client = redis.createClient({
 *     host: 'localhost',
 *     port: 6379,
 *   });
 * 
 *   constructor() {
 *     this.client.on('connect', () => {
 *       console.log('Redis connected');
 *     });
 *   }
 * 
 *   // SET with TTL (Time To Live)
 *   async set(key: string, value: any, ttl?: number) {
 *     if (ttl) {
 *       return new Promise((resolve, reject) => {
 *         this.client.setex(key, ttl, JSON.stringify(value), (err, reply) => {
 *           if (err) reject(err);
 *           resolve(reply);
 *         });
 *       });
 *     }
 *     return new Promise((resolve, reject) => {
 *       this.client.set(key, JSON.stringify(value), (err, reply) => {
 *         if (err) reject(err);
 *         resolve(reply);
 *       });
 *     });
 *   }
 * 
 *   // GET
 *   async get(key: string): Promise<any> {
 *     return new Promise((resolve, reject) => {
 *       this.client.get(key, (err, reply) => {
 *         if (err) reject(err);
 *         resolve(reply ? JSON.parse(reply) : null);
 *       });
 *     });
 *   }
 * 
 *   // DELETE
 *   async delete(key: string): Promise<number> {
 *     return new Promise((resolve, reject) => {
 *       this.client.del(key, (err, reply) => {
 *         if (err) reject(err);
 *         resolve(reply);
 *       });
 *     });
 *   }
 * 
 *   // EXISTS
 *   async exists(key: string): Promise<boolean> {
 *     return new Promise((resolve, reject) => {
 *       this.client.exists(key, (err, reply) => {
 *         if (err) reject(err);
 *         resolve(reply === 1);
 *       });
 *     });
 *   }
 * 
 *   // TTL (Time To Live in seconds)
 *   async ttl(key: string): Promise<number> {
 *     return new Promise((resolve, reject) => {
 *       this.client.ttl(key, (err, reply) => {
 *         if (err) reject(err);
 *         resolve(reply);
 *       });
 *     });
 *   }
 * }
 * 
 * // app.module.ts
 * @Module({
 *   providers: [RedisService],
 * })
 * export class AppModule {}
 */

// ============================================================================
// 4️⃣ REDIS AS CACHE LAYER - NESTJS EXAMPLE
// ============================================================================

/**
 * ✅ USE CASE: Cache user data
 * 
 * // user.service.ts
 * @Injectable()
 * export class UserService {
 *   constructor(
 *     private userRepository: UserRepository,
 *     private redisService: RedisService,
 *   ) {}
 * 
 *   async getUserById(id: number): Promise<User> {
 *     const cacheKey = `user:${id}`;
 * 
 *     // ✅ Try cache first
 *     const cached = await this.redisService.get(cacheKey);
 *     if (cached) {
 *       console.log('Cache HIT');
 *       return cached; // ✅ Fast (microseconds)
 *     }
 * 
 *     console.log('Cache MISS');
 * 
 *     // ✅ Query database if no cache
 *     const user = await this.userRepository.findById(id);
 * 
 *     // ✅ Store in cache (TTL = 1 hour)
 *     await this.redisService.set(cacheKey, user, 3600);
 * 
 *     return user; // ✅ Slower first time (milliseconds)
 *   }
 * 
 *   async updateUser(id: number, data: Partial<User>): Promise<User> {
 *     // ✅ Update database
 *     const user = await this.userRepository.update(id, data);
 * 
 *     // ✅ Invalidate cache
 *     const cacheKey = `user:${id}`;
 *     await this.redisService.delete(cacheKey);
 * 
 *     return user;
 *   }
 * }
 * 
 * // user.controller.ts
 * @Controller('users')
 * export class UserController {
 *   constructor(private userService: UserService) {}
 * 
 *   @Get(':id')
 *   async getUser(@Param('id') id: number) {
 *     return await this.userService.getUserById(id);
 *     // ✅ First call: DB query + cache set (slow)
 *     // ✅ Subsequent calls: Cache hit (fast!)
 *   }
 * 
 *   @Put(':id')
 *   async updateUser(@Param('id') id: number, @Body() dto: any) {
 *     return await this.userService.updateUser(id, dto);
 *   }
 * }
 */

// ============================================================================
// 5️⃣ REDIS USE CASES
// ============================================================================

/**
 * 1️⃣ CACHING (Most common)
 * 
 * // Cache database queries
 * const user = await this.getUserFromCache(userId);
 * if (!user) {
 *   user = await db.query(...);
 *   await redis.set(`user:${userId}`, user, 3600); // 1 hour TTL
 * }
 * return user;
 * 
 * ✅ Result: 10x faster after first query
 */

/**
 * 2️⃣ SESSION STORAGE
 * 
 * // Store user session
 * await redis.set(`session:${sessionId}`, {
 *   userId: 1,
 *   role: 'admin',
 *   loginTime: new Date(),
 * }, 86400); // 24 hours TTL
 * 
 * ✅ Result: Fast session retrieval
 */

/**
 * 3️⃣ RATE LIMITING
 * 
 * // Allow 100 requests per minute
 * async function checkRateLimit(userId: string) {
 *   const key = `ratelimit:${userId}`;
 *   const count = await redis.incr(key);
 * 
 *   if (count === 1) {
 *     await redis.expire(key, 60); // Expire after 60 seconds
 *   }
 * 
 *   if (count > 100) {
 *     throw new Error('Rate limit exceeded');
 *   }
 * }
 * 
 * ✅ Result: Prevent abuse
 */

/**
 * 4️⃣ LEADERBOARD
 * 
 * // Store game scores
 * await redis.zadd('leaderboard', 100, 'Alice');
 * await redis.zadd('leaderboard', 200, 'Bob');
 * await redis.zadd('leaderboard', 150, 'Charlie');
 * 
 * // Get top 10
 * const top10 = await redis.zrevrange('leaderboard', 0, 9, 'WITHSCORES');
 * // → [["Bob", 200], ["Charlie", 150], ["Alice", 100]]
 * 
 * ✅ Result: Real-time rankings
 */

/**
 * 5️⃣ QUEUE/MESSAGE BROKER
 * 
 * // Push tasks to queue
 * await redis.lpush('job_queue', JSON.stringify({
 *   type: 'send_email',
 *   to: 'user@example.com',
 *   subject: 'Hello',
 * }));
 * 
 * // Pop tasks from queue
 * const job = JSON.parse(await redis.rpop('job_queue'));
 * 
 * ✅ Result: Background job processing
 */

/**
 * 6️⃣ COUNTING/STATISTICS
 * 
 * // Track page views
 * await redis.incr('page_views:homepage');
 * await redis.incr('page_views:homepage');
 * 
 * const count = await redis.get('page_views:homepage'); // 2
 * 
 * ✅ Result: Real-time analytics
 */

/**
 * 7️⃣ REAL-TIME NOTIFICATIONS
 * 
 * // Publish event
 * await redis.publish('notifications', JSON.stringify({
 *   userId: 1,
 *   message: 'You have a new message',
 * }));
 * 
 * // Subscribe to events
 * redis.subscribe('notifications', (err, count) => {
 *   console.log(`Subscribed to ${count} channel(s)`);
 * });
 * 
 * redis.on('message', (channel, message) => {
 *   console.log('Received:', message);
 * });
 * 
 * ✅ Result: Real-time communication
 */

// ============================================================================
// 6️⃣ REDIS vs DATABASE
// ============================================================================

/**
 * SCENARIO: Get user data (10,000 queries)
 * 
 * WITHOUT REDIS (Database only):
 * 
 * const user = await db.query('SELECT * FROM users WHERE id = 1');
 * // Time: 10ms
 * // 10,000 queries × 10ms = 100 seconds
 * 
 * WITH REDIS (Cache layer):
 * 
 * First query: Database + Redis set = 10ms
 * Next 9,999 queries: Redis get = 0.1ms each
 * Total: 10ms + (9,999 × 0.1ms) = ~1.1 seconds
 * 
 * ✅ 100x FASTER!
 */

/**
 * PERFORMANCE COMPARISON:
 * 
 * Operation           | Database | Redis
 * ────────────────────┼──────────┼───────
 * Read (1 item)       | 5-10ms   | 0.1ms
 * Write (1 item)      | 5-10ms   | 0.1ms
 * Read (100 items)    | 50-100ms | 1-10ms
 * Complex query       | 100-1000ms | N/A
 * ────────────────────┼──────────┼───────
 * Persistent          | ✅ Yes   | ❌ No
 * Query capability    | ✅ Rich  | ⭐ Limited
 * Memory              | ✅ Large | ❌ Limited
 * Relationships       | ✅ Yes   | ❌ Manual
 */

// ============================================================================
// 7️⃣ REDIS KEYS BEST PRACTICES
// ============================================================================

/**
 * KEY NAMING CONVENTION:
 * 
 * ✅ Good: namespace:entity:id:field
 * 
 * user:1                      // User with id=1
 * user:1:profile              // User profile
 * user:1:posts:recent         // User recent posts
 * cache:user:1                // Cached user
 * session:abc123              // Session
 * queue:email                 // Email queue
 * leaderboard:game:2024       // Game leaderboard 2024
 * rate_limit:ip:192.168.1.1   // Rate limit per IP
 * 
 * ❌ Bad: user, userData, data, temp, cache
 */

/**
 * EXPIRATION (TTL - Time To Live):
 * 
 * // Short-lived (seconds to minutes)
 * SET temp_code "123456" EX 300      // 5 minutes
 * 
 * // Medium-lived (hours)
 * SET cache:data value EX 3600       // 1 hour
 * 
 * // Long-lived (days)
 * SET session:id value EX 86400      // 24 hours
 * 
 * ✅ ALWAYS SET TTL to prevent memory bloat!
 */

// ============================================================================
// 8️⃣ REDIS IN CLEAN ARCHITECTURE PROJECT
// ============================================================================

/**
 * // src/infrastructure/cache/redis.service.ts
 * @Injectable()
 * export class RedisService {
 *   // Encapsulates all Redis operations
 * }
 * 
 * // src/infrastructure/repositories/user.repository.ts
 * @Injectable()
 * export class UserRepository {
 *   constructor(
 *     private prisma: PrismaService,
 *     private redisService: RedisService,
 *   ) {}
 * 
 *   async findById(id: number): Promise<User | null> {
 *     const cacheKey = `user:${id}`;
 *     
 *     // Try cache
 *     const cached = await this.redisService.get(cacheKey);
 *     if (cached) return cached;
 * 
 *     // Query DB
 *     const user = await this.prisma.user.findUnique({ where: { id } });
 * 
 *     // Cache for 1 hour
 *     if (user) {
 *       await this.redisService.set(cacheKey, user, 3600);
 *     }
 * 
 *     return user;
 *   }
 * }
 * 
 * // src/application/usecases/get-user.usecase.ts
 * @Injectable()
 * export class GetUserUseCase {
 *   constructor(private userRepository: UserRepository) {}
 * 
 *   async execute(id: number): Promise<User> {
 *     return await this.userRepository.findById(id);
 *     // ✅ Transparent caching (user doesn't need to know)
 *   }
 * }
 * 
 * ✅ Clean Architecture + Caching = Perfect!
 */

// ============================================================================
// 📊 REDIS COMMANDS SUMMARY
// ============================================================================

/**
 * STRING:
 * SET key value                    // Set
 * GET key                          // Get
 * INCR counter                     // Increment
 * DECR counter                     // Decrement
 * APPEND key " more"               // Append
 * 
 * HASH:
 * HSET user:1 name Alice age 25   // Set fields
 * HGET user:1 name                // Get field
 * HGETALL user:1                  // Get all fields
 * HDEL user:1 age                 // Delete field
 * 
 * LIST:
 * LPUSH list a b c                // Left push
 * RPUSH list d                    // Right push
 * LPOP list                       // Left pop
 * LRANGE list 0 -1                // Get range
 * 
 * SET:
 * SADD set a b c                  // Add
 * SMEMBERS set                    // Get all
 * SISMEMBER set a                 // Check member
 * SREM set a                      // Remove
 * 
 * SORTED SET:
 * ZADD zset 1 a 2 b 3 c           // Add with score
 * ZRANGE zset 0 -1                // Get range
 * ZREVRANGE zset 0 -1             // Get reverse range
 * 
 * KEY OPERATIONS:
 * DEL key                         // Delete
 * EXISTS key                      // Check exists
 * EXPIRE key 3600                 // Set TTL
 * TTL key                         // Get TTL
 * KEYS pattern                    // Find keys
 * FLUSHDB                         // Clear database
 */

// ============================================================================
// 🎯 WHEN TO USE REDIS
// ============================================================================

/**
 * USE REDIS FOR:
 * ✅ Caching database queries
 * ✅ Session storage
 * ✅ Real-time analytics
 * ✅ Leaderboards
 * ✅ Rate limiting
 * ✅ Message queues
 * ✅ Temporary data
 * ✅ Real-time notifications
 * ✅ Shopping carts
 * ✅ Locks for distributed systems
 * 
 * DON'T USE REDIS FOR:
 * ❌ Primary data storage (use database)
 * ❌ Complex queries (use database)
 * ❌ Large datasets > available RAM
 * ❌ Structured data with relationships
 * ❌ Audit logs (need persistence)
 */

// ============================================================================
// 💡 REDIS WITH YOUR CLEAN ARCHITECTURE
// ============================================================================

/**
 * LAYER INTEGRATION:
 * 
 * INTERFACE LAYER (Controllers)
 *   ↓
 * APPLICATION LAYER (Use Cases)
 *   ↓
 * DOMAIN LAYER (Business Logic)
 *   ↓
 * INFRASTRUCTURE LAYER (Repositories)
 *   ├─ Prisma (Database)
 *   └─ Redis (Cache)
 * 
 * ✅ Redis is part of Infrastructure layer
 * ✅ Transparent to upper layers
 * ✅ Easy to swap cache implementation
 * ✅ Perfect separation of concerns
 */

export const RedisExplanation = `
REDIS - In-Memory Cache & Database

WHAT IS REDIS:
- Ultra-fast key-value store
- In-memory (data mutable, expires)
- Used for: cache, sessions, temporary data

PERFORMANCE:
- Database: 5-10ms per query
- Redis: 0.1ms per query
- Result: 100x FASTER for cached data!

USE CASES:
✅ Caching (prevent DB queries)
✅ Sessions (fast user data)
✅ Rate limiting (track requests)
✅ Leaderboards (real-time rankings)
✅ Queues (background jobs)
✅ Analytics (count views, clicks)
✅ Notifications (real-time pub/sub)

DATA TYPES:
- STRING: Simple values
- HASH: Objects/dictionaries
- LIST: Queues/lists
- SET: Unique items, tags
- SORTED SET: Leaderboards, rankings
- STREAM: Event logs

KEY CONCEPT - TTL (Time To Live):
- Set expiration time (seconds)
- Prevents memory bloat
- Example: Cache for 1 hour, then auto-delete

ARCHITECTURE:
Client → Check Redis (fast)
         If miss → Query DB (slow)
                 → Store in Redis
                 → Return

BEST PRACTICE:
1. Use Prisma/TypeORM for primary data
2. Use Redis for cache/temp data
3. Set TTL on all Redis keys
4. Invalidate cache on data updates
5. Put in Infrastructure layer

In Clean Architecture:
- Transparent caching (upper layers don't know)
- Easy to add/remove caching
- Clear separation of concerns
- Scalable and maintainable
`;
