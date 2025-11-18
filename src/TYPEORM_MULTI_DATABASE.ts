/**
 * ============================================================================
 * TYPEORM SUPPORT CHO SQL & NOSQL
 * ============================================================================
 * 
 * TypeORM là ORM duy nhất (trong 3 tools) hỗ trợ cả SQL và NoSQL.
 * Bạn có thể dùng một codebase cho cả databases khác nhau.
 */

// ============================================================================
// 1️⃣ TYPEORM DATABASE SUPPORT
// ============================================================================

/**
 * SQL DATABASES (Relational):
 * ✅ PostgreSQL
 * ✅ MySQL
 * ✅ MariaDB
 * ✅ SQLite
 * ✅ SQL Server
 * ✅ Oracle
 * ✅ CockroachDB
 * 
 * NOSQL DATABASES:
 * ✅ MongoDB
 * ✅ CouchDB (limited)
 * 
 * NOT SUPPORTED:
 * ❌ Redis (TypeORM không hỗ trợ)
 * ❌ DynamoDB
 * ❌ Cassandra
 */

// ============================================================================
// 2️⃣ TYPEORM + SQL (PostgreSQL, MySQL, etc.)
// ============================================================================

/**
 * ✅ EXAMPLE: TYPEORM + POSTGRESQL
 * 
 * // 1. Install
 * npm install typeorm @nestjs/typeorm pg
 * 
 * // 2. user.entity.ts (SQL Entity)
 * import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
 * 
 * @Entity('users')
 * export class User {
 *   @PrimaryGeneratedColumn()
 *   id: number;
 * 
 *   @Column()
 *   name: string;
 * 
 *   @Column({ unique: true })
 *   email: string;
 * 
 *   @OneToMany(() => Post, (post) => post.user)
 *   posts: Post[];
 * }
 * 
 * // 3. post.entity.ts
 * @Entity('posts')
 * export class Post {
 *   @PrimaryGeneratedColumn()
 *   id: number;
 * 
 *   @Column()
 *   title: string;
 * 
 *   @ManyToOne(() => User, (user) => user.posts)
 *   user: User;
 * }
 * 
 * // 4. app.module.ts
 * @Module({
 *   imports: [
 *     TypeOrmModule.forRoot({
 *       type: 'postgres',        // ✅ PostgreSQL
 *       host: 'localhost',
 *       port: 5432,
 *       username: 'postgres',
 *       password: 'password',
 *       database: 'mydb',
 *       entities: [User, Post],
 *       synchronize: true,
 *     }),
 *     TypeOrmModule.forFeature([User, Post]),
 *   ],
 * })
 * export class AppModule {}
 * 
 * // 5. user.service.ts
 * @Injectable()
 * export class UserService {
 *   constructor(
 *     @InjectRepository(User)
 *     private userRepository: Repository<User>,
 *   ) {}
 * 
 *   async getUsers() {
 *     return await this.userRepository.find({
 *       relations: ['posts'],
 *     });
 *   }
 * }
 */

// ============================================================================
// 3️⃣ TYPEORM + NOSQL (MongoDB)
// ============================================================================

/**
 * ✅ EXAMPLE: TYPEORM + MONGODB
 * 
 * // 1. Install
 * npm install typeorm @nestjs/typeorm mongodb
 * 
 * // 2. user.entity.ts (MongoDB Entity)
 * import { Entity, ObjectIdColumn, Column, ObjectId } from 'typeorm';
 * 
 * @Entity('users')
 * export class User {
 *   @ObjectIdColumn()
 *   _id: ObjectId;           // ✅ MongoDB _id
 * 
 *   @Column()
 *   name: string;
 * 
 *   @Column()
 *   email: string;
 * 
 *   @Column(() => Post)      // ✅ Embedded document
 *   posts: Post[];
 * }
 * 
 * // 3. post.entity.ts
 * export class Post {
 *   @Column()
 *   id: string;
 * 
 *   @Column()
 *   title: string;
 * }
 * 
 * // 4. app.module.ts (SWITCH TO MONGODB!)
 * @Module({
 *   imports: [
 *     TypeOrmModule.forRoot({
 *       type: 'mongodb',       // ✅ SWITCH TYPE (chỉ thay 1 dòng!)
 *       url: 'mongodb://localhost:27017/mydb',
 *       entities: [User, Post],
 *       synchronize: true,
 *     }),
 *     TypeOrmModule.forFeature([User, Post]),
 *   ],
 * })
 * export class AppModule {}
 * 
 * // 5. user.service.ts (CODE GẦN NHƯ GIỐNG)
 * @Injectable()
 * export class UserService {
 *   constructor(
 *     @InjectRepository(User)
 *     private userRepository: MongoRepository<User>, // ✅ MongoRepository type
 *   ) {}
 * 
 *   async getUsers() {
 *     return await this.userRepository.find();
 *   }
 * }
 * 
 * ✅ KEY POINT:
 * - Service code gần như không thay đổi!
 * - Chỉ cần thay type: 'mongodb' trong config
 * - Entity syntax hơi khác (@ObjectIdColumn vs @PrimaryGeneratedColumn)
 * - API vẫn tương tự (find, save, delete)
 */

// ============================================================================
// 4️⃣ SWITCHING BETWEEN SQL & NOSQL
// ============================================================================

/**
 * ✅ SCENARIO: Chuyển từ PostgreSQL sang MongoDB
 * 
 * BEFORE (PostgreSQL):
 * 
 * @Module({
 *   imports: [
 *     TypeOrmModule.forRoot({
 *       type: 'postgres',        // ❌ OLD
 *       host: 'localhost',
 *       port: 5432,
 *       username: 'postgres',
 *       password: 'password',
 *       database: 'mydb',
 *       entities: [User, Post],
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * 
 * AFTER (MongoDB):
 * 
 * @Module({
 *   imports: [
 *     TypeOrmModule.forRoot({
 *       type: 'mongodb',         // ✅ CHANGE THIS LINE
 *       url: 'mongodb://localhost:27017/mydb',
 *       entities: [User, Post],
 *     }),
 *   ],
 * })
 * export class AppModule {}
 * 
 * ✅ Service code không thay đổi!
 * ✅ Controller code không thay đổi!
 * ✅ Chỉ entity definition hơi khác
 */

// ============================================================================
// 5️⃣ SQL vs NOSQL ENTITY SYNTAX KHÁC NHAU
// ============================================================================

/**
 * SQL ENTITY (PostgreSQL, MySQL):
 * 
 * @Entity('users')
 * export class User {
 *   @PrimaryGeneratedColumn()    // ✅ Auto-increment ID
 *   id: number;
 * 
 *   @Column()
 *   name: string;
 * 
 *   @Column({ type: 'varchar', length: 255 })
 *   email: string;
 * 
 *   @OneToMany(() => Post, (post) => post.user)
 *   posts: Post[];               // ✅ Relationship (separate table)
 * }
 * 
 * @Entity('posts')
 * export class Post {
 *   @PrimaryGeneratedColumn()
 *   id: number;
 * 
 *   @Column()
 *   title: string;
 * 
 *   @ManyToOne(() => User, (user) => user.posts)
 *   user: User;                  // ✅ Foreign key
 * }
 */

/**
 * NOSQL ENTITY (MongoDB):
 * 
 * @Entity('users')
 * export class User {
 *   @ObjectIdColumn()            // ✅ MongoDB ObjectId
 *   _id: ObjectId;
 * 
 *   @Column()
 *   name: string;
 * 
 *   @Column()
 *   email: string;
 * 
 *   @Column(() => Post)          // ✅ Embedded document (không separate table)
 *   posts: Post[];               // ✅ Document bên trong
 * }
 * 
 * export class Post {
 *   @Column()
 *   id: string;
 * 
 *   @Column()
 *   title: string;
 * }
 * 
 * ✅ KHÁC NHAU:
 * - SQL: Relationships qua foreign keys (separate tables)
 * - MongoDB: Embedded documents (bên trong document)
 */

// ============================================================================
// 6️⃣ SERVICE CODE COMPARISON
// ============================================================================

/**
 * ✅ SQL SERVICE (PostgreSQL):
 * 
 * @Injectable()
 * export class UserService {
 *   constructor(
 *     @InjectRepository(User)
 *     private userRepository: Repository<User>,
 *   ) {}
 * 
 *   async getUsers() {
 *     return await this.userRepository.find({
 *       relations: ['posts'],    // ✅ Load related posts
 *     });
 *   }
 * 
 *   async createUser(name: string, email: string) {
 *     const user = this.userRepository.create({ name, email });
 *     return await this.userRepository.save(user);
 *   }
 * }
 */

/**
 * ✅ NOSQL SERVICE (MongoDB):
 * 
 * @Injectable()
 * export class UserService {
 *   constructor(
 *     @InjectRepository(User)
 *     private userRepository: MongoRepository<User>,
 *   ) {}
 * 
 *   async getUsers() {
 *     return await this.userRepository.find();
 *     // ✅ Không cần relations (embedded documents)
 *   }
 * 
 *   async createUser(name: string, email: string) {
 *     const user = this.userRepository.create({ name, email });
 *     return await this.userRepository.save(user);
 *   }
 * }
 * 
 * ✅ CODE GẦN GIỐNG!
 * - SQL cần: relations: ['posts']
 * - MongoDB không cần (posts đã embedded)
 */

// ============================================================================
// 7️⃣ REDIS VỚI TYPEORM
// ============================================================================

/**
 * TYPEORM KHÔNG HỖ TRỢ REDIS!
 * 
 * Redis là cache store, không phải database chính.
 * 
 * CÁCH DÙNG REDIS VỚI TYPEORM:
 * - TYPEORM: Lưu data chính (PostgreSQL, MongoDB)
 * - REDIS: Lưu cache (tăng tốc độ)
 * 
 * // redis.service.ts
 * import * as redis from 'redis';
 * 
 * @Injectable()
 * export class RedisService {
 *   private client: redis.RedisClient;
 * 
 *   constructor() {
 *     this.client = redis.createClient();
 *   }
 * 
 *   async get(key: string) {
 *     return this.client.get(key);
 *   }
 * 
 *   async set(key: string, value: any) {
 *     this.client.set(key, JSON.stringify(value));
 *   }
 * }
 * 
 * // user.service.ts (TYPEORM + REDIS)
 * @Injectable()
 * export class UserService {
 *   constructor(
 *     @InjectRepository(User)
 *     private userRepository: Repository<User>,
 *     private redisService: RedisService,
 *   ) {}
 * 
 *   async getUsers() {
 *     // ✅ Kiểm tra Redis cache trước
 *     const cached = await this.redisService.get('users');
 *     if (cached) {
 *       return JSON.parse(cached);
 *     }
 * 
 *     // ✅ Nếu không có cache, query database
 *     const users = await this.userRepository.find();
 * 
 *     // ✅ Lưu vào Redis cache
 *     await this.redisService.set('users', users);
 * 
 *     return users;
 *   }
 * }
 * 
 * ✅ USAGE PATTERN:
 * Redis (cache) + TypeORM (database)
 * Không phải thay thế
 */

// ============================================================================
// 📊 TYPEORM DATABASE SUPPORT MATRIX
// ============================================================================

/**
 * ┌────────────────┬─────────┬──────────┬─────────────────────┐
 * │ Database       │ Type    │ Supports │ Notes               │
 * ├────────────────┼─────────┼──────────┼─────────────────────┤
 * │ PostgreSQL     │ SQL     │ ✅ ✅    │ Best with TypeORM   │
 * │ MySQL          │ SQL     │ ✅ ✅    │ Full support        │
 * │ MariaDB        │ SQL     │ ✅ ✅    │ MySQL compatible    │
 * │ SQLite         │ SQL     │ ✅ ✅    │ File-based          │
 * │ SQL Server     │ SQL     │ ✅ ✅    │ Enterprise support  │
 * │ Oracle         │ SQL     │ ✅ ✅    │ Enterprise support  │
 * │ CockroachDB    │ SQL     │ ✅ ✅    │ PostgreSQL compat   │
 * │ MongoDB        │ NOSQL   │ ✅ ✅    │ Native support      │
 * │ Redis          │ Cache   │ ❌ ✅*   │ Use separate client │
 * │ DynamoDB       │ NOSQL   │ ❌ ❌    │ Not supported       │
 * │ Cassandra      │ NOSQL   │ ❌ ❌    │ Not supported       │
 * └────────────────┴─────────┴──────────┴─────────────────────┘
 * 
 * * Redis có thể dùng kèm với TypeORM (không thay thế)
 */

// ============================================================================
// 🔄 PRACTICAL EXAMPLE: SWITCHING DATABASES
// ============================================================================

/**
 * ✅ SCENARIO: Company có PostgreSQL, nhưng muốn thêm MongoDB
 * 
 * SOLUTION: Dùng TypeORM cho cả 2!
 * 
 * // 1. Setup multiple databases
 * 
 * @Module({
 *   imports: [
 *     TypeOrmModule.forRoot({
 *       name: 'default',
 *       type: 'postgres',
 *       host: 'localhost',
 *       port: 5432,
 *       username: 'postgres',
 *       password: 'password',
 *       database: 'sql_db',
 *       entities: [User, Post],
 *       synchronize: true,
 *     }),
 *     TypeOrmModule.forRoot({
 *       name: 'mongodb',
 *       type: 'mongodb',
 *       url: 'mongodb://localhost:27017/mongo_db',
 *       entities: [Analytics],
 *       synchronize: true,
 *     }),
 *     TypeOrmModule.forFeature([User, Post], 'default'),
 *     TypeOrmModule.forFeature([Analytics], 'mongodb'),
 *   ],
 * })
 * export class AppModule {}
 * 
 * // 2. Service dùng cả 2 database
 * 
 * @Injectable()
 * export class UserService {
 *   constructor(
 *     @InjectRepository(User, 'default')
 *     private userRepository: Repository<User>,
 *     @InjectRepository(Analytics, 'mongodb')
 *     private analyticsRepository: MongoRepository<Analytics>,
 *   ) {}
 * 
 *   async createUser(name: string, email: string) {
 *     // ✅ Save to PostgreSQL
 *     const user = await this.userRepository.save({ name, email });
 * 
 *     // ✅ Save analytics to MongoDB
 *     await this.analyticsRepository.save({
 *       event: 'user_created',
 *       userId: user.id,
 *       timestamp: new Date(),
 *     });
 * 
 *     return user;
 *   }
 * }
 * 
 * ✅ BENEFIT:
 * - PostgreSQL cho data chính
 * - MongoDB cho analytics/logging
 * - Một codebase, nhiều databases!
 */

// ============================================================================
// 🎯 COMPARISON: TYPEORM + PRISMA + MONGOOSE
// ============================================================================

/**
 * TYPEORM:
 * ✅ SQL databases (7 loại)
 * ✅ MongoDB (NoSQL)
 * ✅ Chuyển đổi dễ dàng (chỉ thay config)
 * ✅ Dùng cùng lúc nhiều databases
 * ❌ Type safety không bằng Prisma
 * ❌ Syntax khác giữa SQL và NoSQL
 * 
 * PRISMA:
 * ✅ SQL databases (3 loại: PostgreSQL, MySQL, SQLite)
 * ❌ Không hỗ trợ MongoDB
 * ✅ Type safety tốt nhất
 * ❌ Nếu cần MongoDB → chỉ có Mongoose
 * 
 * MONGOOSE:
 * ✅ MongoDB only
 * ✅ Powerful hooks
 * ❌ Không hỗ trợ SQL
 * ❌ Type safety không tốt
 */

// ============================================================================
// 💡 REDIS vs TYPEORM
// ============================================================================

/**
 * REDIS ≠ Database (thay thế TypeORM)
 * REDIS = Cache layer (kèm theo TypeORM)
 * 
 * REDIS:
 * - In-memory cache
 * - Fast (microseconds)
 * - Data mất khi restart
 * - Giới hạn memory
 * 
 * TYPEORM + DATABASE (PostgreSQL, MongoDB):
 * - Persistent storage
 * - Slower (milliseconds)
 * - Data lưu lâu dài
 * - Unlimited storage
 * 
 * TYPICAL ARCHITECTURE:
 * 
 * Client
 *   ↓
 * Cache Layer (Redis)
 *   ↓ (cache miss)
 * Application (NestJS)
 *   ↓
 * Data Layer (TypeORM)
 *   ↓
 * Database (PostgreSQL, MongoDB)
 * 
 * ✅ REDIS: Tăng tốc độ
 * ✅ TYPEORM: Lưu data
 * ✅ DATABASE: Persistent storage
 */

// ============================================================================
// 🏆 RECOMMENDATION
// ============================================================================

/**
 * Nếu bạn hỏi:
 * "Vậy là TypeORM có thể dùng cho cả NoSQL như Mongo, Redis và SQL à?"
 * 
 * ANSWER:
 * 
 * ✅ TypeORM CÓ THỂ dùng cho:
 * - SQL (PostgreSQL, MySQL, SQLite, SQL Server, Oracle, CockroachDB)
 * - NoSQL (MongoDB)
 * 
 * ❌ TypeORM KHÔNG THỂ thay thế:
 * - Redis (dùng kèm, không thay thế)
 * 
 * ✅ BEST USE CASE:
 * 
 * Situation 1: PostgreSQL only
 * → PRISMA (better type-safety)
 * 
 * Situation 2: SQL + MongoDB
 * → TYPEORM (unified approach)
 * 
 * Situation 3: MongoDB only
 * → MONGOOSE (optimized for MongoDB)
 * 
 * Situation 4: Any DB + Cache
 * → TypeORM/Prisma/Mongoose + Redis
 * 
 * ✅ UNTUK PROJECT CLEAN ARCHITECTURE CỦA BẠN:
 * - Nếu PostgreSQL only: Prisma ✅
 * - Nếu múa databases (SQL + Mongo): TypeORM ✅
 * - Nếu thêm Redis cache: TypeORM/Prisma + Redis ✅
 */

export const TypeORMMultiDatabase = `
TypeORM DATABASE SUPPORT:

SQL (7 types):
✅ PostgreSQL, MySQL, MariaDB, SQLite, SQL Server, Oracle, CockroachDB

NoSQL:
✅ MongoDB

NOT SUPPORTED:
❌ Redis (use as cache layer, not database)
❌ DynamoDB, Cassandra

KEY ADVANTAGE: TypeORM unified approach
- Chuyển từ PostgreSQL → MongoDB (chỉ thay config)
- Service code gần như không đổi
- Hỗ trợ cùng lúc nhiều databases

REDIS: Không phải thay thế database
- Redis = Cache layer (tăng tốc độ)
- TypeORM = Primary database (lưu data)
- Dùng kèm nhau, không thay thế

RECOMMENDATION:
- SQL only: PRISMA (better type-safety)
- SQL + MongoDB: TYPEORM (flexibility)
- MongoDB only: MONGOOSE (optimized)
- Any DB + Cache: + Redis
`;
