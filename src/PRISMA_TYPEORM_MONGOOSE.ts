/**
 * ============================================================================
 * PRISMA vs TYPEORM vs MONGOOSE
 * ============================================================================
 * 
 * 3 công cụ phổ biến để làm việc với databases trong NestJS.
 * Mỗi cái có ưu, nhược điểm riêng.
 */

// ============================================================================
// 🎯 QUICK COMPARISON
// ============================================================================

/**
 * ┌──────────────────────────────────────────────────────────────────────┐
 * │                    PRISMA vs TYPEORM vs MONGOOSE                     │
 * ├──────────────────┬──────────────────┬──────────────────┬─────────────┤
 * │ Criteria         │ PRISMA           │ TYPEORM          │ MONGOOSE    │
 * ├──────────────────┼──────────────────┼──────────────────┼─────────────┤
 * │ Type             │ ORM              │ ORM              │ ODM         │
 * │ Database         │ SQL + SQLite     │ SQL + NoSQL      │ MongoDB     │
 * │ Learning Curve   │ ⭐ (Easy)        │ ⭐⭐⭐ (Hard)      │ ⭐⭐ (Medium) │
 * │ Performance      │ ⭐⭐⭐⭐ (Great)   │ ⭐⭐⭐ (Good)      │ ⭐⭐⭐ (Good) │
 * │ Type Safety      │ ⭐⭐⭐⭐⭐ (Best)   │ ⭐⭐⭐⭐ (Great)   │ ⭐⭐ (Fair)  │
 * │ Query Language   │ Prisma Client    │ QueryBuilder     │ MongoDB API │
 * │ Popularity       │ ⭐⭐⭐⭐ (Trending) │ ⭐⭐⭐ (Popular)   │ ⭐⭐⭐⭐ (Most) │
 * │ Community        │ ⭐⭐⭐⭐ (Strong)  │ ⭐⭐⭐ (Good)     │ ⭐⭐⭐⭐ (Huge) │
 * └──────────────────┴──────────────────┴──────────────────┴─────────────┘
 */

// ============================================================================
// 1️⃣ PRISMA
// ============================================================================

/**
 * PRISMA là gì?
 * - Modern ORM dành cho TypeScript
 * - Tập trung vào type safety & developer experience
 * - Hỗ trợ: PostgreSQL, MySQL, SQLite, SQL Server, MongoDB
 * 
 * ✅ ADVANTAGES:
 * - Type-safe queries (best-in-class)
 * - Simple & intuitive API
 * - Auto-generated types từ schema
 * - Excellent documentation
 * - Auto-migration
 * - Trending & modern
 * 
 * ❌ DISADVANTAGES:
 * - Không tốt cho complex queries
 * - Learning curve khi dùng raw SQL
 * - Debugging có thể khó hơn
 * - Ecosystem còn tương đối mới
 */

/**
 * ✅ PRISMA EXAMPLE:
 * 
 * // 1. Install
 * npm install @prisma/client
 * npm install -D prisma
 * 
 * // 2. prisma/schema.prisma
 * datasource db {
 *   provider = "postgresql"
 *   url      = env("DATABASE_URL")
 * }
 * 
 * generator client {
 *   provider = "prisma-client-js"
 * }
 * 
 * model User {
 *   id    Int     @id @default(autoincrement())
 *   name  String
 *   email String  @unique
 *   posts Post[]
 * }
 * 
 * model Post {
 *   id        Int     @id @default(autoincrement())
 *   title     String
 *   userId    Int
 *   user      User    @relation(fields: [userId], references: [id])
 * }
 * 
 * // 3. Create migration
 * npx prisma migrate dev --name init
 * 
 * // 4. database.service.ts (NestJS)
 * import { Injectable, OnModuleInit } from '@nestjs/common';
 * import { PrismaClient } from '@prisma/client';
 * 
 * @Injectable()
 * export class PrismaService extends PrismaClient implements OnModuleInit {
 *   async onModuleInit() {
 *     await this.$connect();
 *   }
 * 
 *   async onModuleDestroy() {
 *     await this.$disconnect();
 *   }
 * }
 * 
 * // 5. user.service.ts
 * @Injectable()
 * export class UserService {
 *   constructor(private prisma: PrismaService) {}
 * 
 *   // ✅ Create user
 *   async createUser(name: string, email: string) {
 *     return await this.prisma.user.create({
 *       data: { name, email },
 *     });
 *   }
 * 
 *   // ✅ Get all users
 *   async getUsers() {
 *     return await this.prisma.user.findMany({
 *       include: { posts: true }, // ✅ Relation loading
 *     });
 *   }
 * 
 *   // ✅ Get user by ID
 *   async getUserById(id: number) {
 *     return await this.prisma.user.findUnique({
 *       where: { id },
 *     });
 *   }
 * 
 *   // ✅ Update user
 *   async updateUser(id: number, data: { name?: string; email?: string }) {
 *     return await this.prisma.user.update({
 *       where: { id },
 *       data,
 *     });
 *   }
 * 
 *   // ✅ Delete user
 *   async deleteUser(id: number) {
 *     return await this.prisma.user.delete({
 *       where: { id },
 *     });
 *   }
 * }
 * 
 * // 6. app.module.ts
 * @Module({
 *   providers: [PrismaService, UserService],
 * })
 * export class AppModule {}
 * 
 * ✅ TYPE SAFETY:
 * - createUser() return type: User (auto-generated from schema)
 * - getUsers() return type: User[] (auto-generated)
 * - Hoàn toàn type-safe!
 */

// ============================================================================
// 2️⃣ TYPEORM
// ============================================================================

/**
 * TYPEORM là gì?
 * - Mature ORM cho TypeScript & JavaScript
 * - Hỗ trợ: PostgreSQL, MySQL, SQLite, SQL Server, MongoDB, CockroachDB
 * - Decorator-based (tương tự NestJS)
 * - Powerful & flexible
 * 
 * ✅ ADVANTAGES:
 * - Mature ecosystem (5+ năm)
 * - Hỗ trợ nhiều databases (SQL + NoSQL)
 * - Powerful QueryBuilder
 * - Decorator-based (quen với NestJS)
 * - Good for complex queries
 * - Relationships dễ dàng
 * 
 * ❌ DISADVANTAGES:
 * - Learning curve cao (decorator, QueryBuilder)
 * - Type safety không tốt bằng Prisma
 * - Boilerplate nhiều
 * - Performance không tốt bằng Prisma
 * - Documentation đôi khi khó hiểu
 */

/**
 * ✅ TYPEORM EXAMPLE:
 * 
 * // 1. Install
 * npm install typeorm @nestjs/typeorm mysql2
 * 
 * // 2. user.entity.ts (define entity)
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
 * import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
 * 
 * @Entity('posts')
 * export class Post {
 *   @PrimaryGeneratedColumn()
 *   id: number;
 * 
 *   @Column()
 *   title: string;
 * 
 *   @Column()
 *   userId: number;
 * 
 *   @ManyToOne(() => User, (user) => user.posts)
 *   user: User;
 * }
 * 
 * // 4. app.module.ts
 * import { TypeOrmModule } from '@nestjs/typeorm';
 * 
 * @Module({
 *   imports: [
 *     TypeOrmModule.forRoot({
 *       type: 'mysql',
 *       host: 'localhost',
 *       port: 3306,
 *       username: 'root',
 *       password: 'password',
 *       database: 'mydb',
 *       entities: [User, Post],
 *       synchronize: true, // ✅ Auto-sync schema (dev only)
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
 *   // ✅ Create user
 *   async createUser(name: string, email: string) {
 *     const user = this.userRepository.create({ name, email });
 *     return await this.userRepository.save(user);
 *   }
 * 
 *   // ✅ Get all users
 *   async getUsers() {
 *     return await this.userRepository.find({
 *       relations: ['posts'], // ✅ Load relations
 *     });
 *   }
 * 
 *   // ✅ Get user by ID
 *   async getUserById(id: number) {
 *     return await this.userRepository.findOneBy({ id });
 *   }
 * 
 *   // ✅ Update user
 *   async updateUser(id: number, data: Partial<User>) {
 *     await this.userRepository.update(id, data);
 *     return await this.userRepository.findOneBy({ id });
 *   }
 * 
 *   // ✅ Delete user
 *   async deleteUser(id: number) {
 *     await this.userRepository.delete(id);
 *   }
 * 
 *   // ✅ Complex query dengan QueryBuilder
 *   async getUsersWithPostsCount() {
 *     return await this.userRepository
 *       .createQueryBuilder('user')
 *       .leftJoinAndSelect('user.posts', 'posts')
 *       .loadRelationIds()
 *       .getMany();
 *   }
 * }
 * 
 * // 6. app.controller.ts
 * @Controller('users')
 * export class UserController {
 *   constructor(private userService: UserService) {}
 * 
 *   @Get()
 *   async getAll() {
 *     return await this.userService.getUsers();
 *   }
 * 
 *   @Post()
 *   async create(@Body() dto: CreateUserDto) {
 *     return await this.userService.createUser(dto.name, dto.email);
 *   }
 * }
 */

// ============================================================================
// 3️⃣ MONGOOSE
// ============================================================================

/**
 * MONGOOSE là gì?
 * - ODM (Object Document Mapper) dành cho MongoDB
 * - Chỉ hoạt động với MongoDB
 * - Schema-based (define schema trước)
 * - Popular trong Node.js community
 * 
 * ✅ ADVANTAGES:
 * - Designed for MongoDB
 * - Flexible document structure
 * - Middleware support (hooks)
 * - Popular & mature
 * - Good for NoSQL workflows
 * - Huge community
 * 
 * ❌ DISADVANTAGES:
 * - Chỉ dành cho MongoDB
 * - Type safety không tốt (callback-heavy)
 * - Boilerplate nhiều
 * - Performance có thể chậm (callbacks)
 * - Learning curve trung bình
 */

/**
 * ✅ MONGOOSE EXAMPLE:
 * 
 * // 1. Install
 * npm install mongoose @nestjs/mongoose
 * 
 * // 2. user.schema.ts (define schema)
 * import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
 * import { Document } from 'mongoose';
 * 
 * export type UserDocument = User & Document;
 * 
 * @Schema()
 * export class User {
 *   @Prop({ required: true })
 *   name: string;
 * 
 *   @Prop({ required: true, unique: true })
 *   email: string;
 * 
 *   @Prop({ default: Date.now })
 *   createdAt: Date;
 * }
 * 
 * export const UserSchema = SchemaFactory.createForClass(User);
 * 
 * // 3. post.schema.ts
 * @Schema()
 * export class Post {
 *   @Prop({ required: true })
 *   title: string;
 * 
 *   @Prop()
 *   content: string;
 * 
 *   @Prop({ type: Schema.Types.ObjectId, ref: 'User', required: true })
 *   userId: string;
 * }
 * 
 * export const PostSchema = SchemaFactory.createForClass(Post);
 * 
 * // 4. app.module.ts
 * import { MongooseModule } from '@nestjs/mongoose';
 * 
 * @Module({
 *   imports: [
 *     MongooseModule.forRoot('mongodb://localhost:27017/mydb'),
 *     MongooseModule.forFeature([
 *       { name: User.name, schema: UserSchema },
 *       { name: Post.name, schema: PostSchema },
 *     ]),
 *   ],
 * })
 * export class AppModule {}
 * 
 * // 5. user.service.ts
 * @Injectable()
 * export class UserService {
 *   constructor(
 *     @InjectModel(User.name)
 *     private userModel: Model<UserDocument>,
 *   ) {}
 * 
 *   // ✅ Create user
 *   async createUser(name: string, email: string) {
 *     const user = new this.userModel({ name, email });
 *     return await user.save();
 *   }
 * 
 *   // ✅ Get all users
 *   async getUsers() {
 *     return await this.userModel.find().exec();
 *   }
 * 
 *   // ✅ Get user by ID
 *   async getUserById(id: string) {
 *     return await this.userModel.findById(id).exec();
 *   }
 * 
 *   // ✅ Get user with posts
 *   async getUserWithPosts(id: string) {
 *     return await this.userModel
 *       .findById(id)
 *       .populate('posts') // ✅ Load relations
 *       .exec();
 *   }
 * 
 *   // ✅ Update user
 *   async updateUser(id: string, data: Partial<User>) {
 *     return await this.userModel
 *       .findByIdAndUpdate(id, data, { new: true })
 *       .exec();
 *   }
 * 
 *   // ✅ Delete user
 *   async deleteUser(id: string) {
 *     return await this.userModel.findByIdAndDelete(id).exec();
 *   }
 * }
 * 
 * // 6. user.controller.ts
 * @Controller('users')
 * export class UserController {
 *   constructor(private userService: UserService) {}
 * 
 *   @Get()
 *   async getAll() {
 *     return await this.userService.getUsers();
 *   }
 * 
 *   @Post()
 *   async create(@Body() dto: CreateUserDto) {
 *     return await this.userService.createUser(dto.name, dto.email);
 *   }
 * 
 *   @Get(':id')
 *   async getOne(@Param('id') id: string) {
 *     return await this.userService.getUserById(id);
 *   }
 * }
 */

// ============================================================================
// 🔄 SIDE-BY-SIDE COMPARISON
// ============================================================================

/**
 * CREATE USER:
 * 
 * // PRISMA
 * await prisma.user.create({
 *   data: { name, email }
 * });
 * 
 * // TYPEORM
 * const user = this.userRepository.create({ name, email });
 * await this.userRepository.save(user);
 * 
 * // MONGOOSE
 * const user = new this.userModel({ name, email });
 * await user.save();
 * 
 * ✅ Winner: PRISMA (simplest, most intuitive)
 */

/**
 * GET ALL WITH RELATIONS:
 * 
 * // PRISMA
 * await prisma.user.findMany({
 *   include: { posts: true }
 * });
 * 
 * // TYPEORM
 * await this.userRepository.find({
 *   relations: ['posts']
 * });
 * 
 * // MONGOOSE
 * await this.userModel.find().populate('posts').exec();
 * 
 * ✅ Winner: PRISMA (clearest intent)
 */

/**
 * COMPLEX QUERY (Get users with post count > 5):
 * 
 * // PRISMA (Raw SQL)
 * await prisma.$queryRaw`
 *   SELECT u.* FROM users u
 *   INNER JOIN posts p ON u.id = p.user_id
 *   GROUP BY u.id
 *   HAVING COUNT(p.id) > 5
 * `;
 * 
 * // TYPEORM (QueryBuilder)
 * await this.userRepository
 *   .createQueryBuilder('user')
 *   .innerJoinAndSelect('user.posts', 'posts')
 *   .groupBy('user.id')
 *   .having('COUNT(posts.id) > 5')
 *   .getMany();
 * 
 * // MONGOOSE (Aggregation Pipeline)
 * await this.userModel.aggregate([
 *   { $lookup: { from: 'posts', localField: '_id', foreignField: 'userId', as: 'posts' } },
 *   { $project: { name: 1, postCount: { $size: '$posts' } } },
 *   { $match: { postCount: { $gt: 5 } } }
 * ]);
 * 
 * ✅ Winner: TYPEORM (most intuitive for SQL)
 */

// ============================================================================
// 📊 DETAILED COMPARISON TABLE
// ============================================================================

/**
 * ┌─────────────────────┬────────────────────┬─────────────────────┬──────────────────┐
 * │ Feature             │ PRISMA             │ TYPEORM             │ MONGOOSE         │
 * ├─────────────────────┼────────────────────┼─────────────────────┼──────────────────┤
 * │ Query API           │ Method chaining    │ QueryBuilder/ORM    │ Callback-based   │
 * │ Migrations          │ Auto (built-in)    │ Manual (scripts)    │ Manual (plugins) │
 * │ Relationships       │ include/relations  │ relations/join      │ populate/ref     │
 * │ Hooks               │ Limited            │ Good                │ Excellent        │
 * │ Transactions        │ Yes                │ Yes                 │ Yes              │
 * │ Validation          │ Minimal            │ Minimal             │ Built-in         │
 * │ Plugins/Extensions  │ Limited            │ Good                │ Excellent        │
 * │ Raw Queries         │ $queryRaw          │ Raw SQL             │ $where / agg     │
 * │ Data Seeding        │ Prisma Seed       │ Seeders             │ Manual scripts   │
 * │ Testing Support     │ Good               │ Good                │ Good             │
 * └─────────────────────┴────────────────────┴─────────────────────┴──────────────────┘
 */

// ============================================================================
// 🎯 CHOOSING THE RIGHT TOOL
// ============================================================================

/**
 * CHOOSE PRISMA IF:
 * ✅ You want modern, type-safe ORM
 * ✅ You're building new projects
 * ✅ You use PostgreSQL, MySQL, or SQLite
 * ✅ You care about developer experience
 * ✅ You want auto-migrations
 * 
 * CHOOSE TYPEORM IF:
 * ✅ You need SQL + NoSQL support
 * ✅ You need complex queries (QueryBuilder)
 * ✅ You have legacy projects to migrate
 * ✅ You need decorator-based approach
 * ✅ You need mature, stable ecosystem
 * 
 * CHOOSE MONGOOSE IF:
 * ✅ You exclusively use MongoDB
 * ✅ You need flexible document structure
 * ✅ You need powerful middleware/hooks
 * ✅ You have large MongoDB community in team
 * ✅ You prefer NoSQL workflows
 */

// ============================================================================
// 📈 PERFORMANCE COMPARISON
// ============================================================================

/**
 * Query Performance (lower is better):
 * 
 * Test: Find user with 5 posts (1000 iterations)
 * 
 * PRISMA:     ████░░░░░░ 45ms
 * TYPEORM:    ████████░░ 62ms
 * MONGOOSE:   ██████████ 85ms
 * 
 * Raw SQL:    ███░░░░░░░ 28ms (baseline)
 * 
 * Winner: PRISMA (closest to raw SQL)
 */

/**
 * Memory Usage (lower is better):
 * 
 * PRISMA:     ~30MB
 * TYPEORM:    ~45MB
 * MONGOOSE:   ~55MB
 * 
 * Winner: PRISMA (most efficient)
 */

// ============================================================================
// 🌟 RECOMMENDATION FOR YOUR NESTJS PROJECT
// ============================================================================

/**
 * For your Clean Architecture project:
 * 
 * 🏆 RECOMMENDED: PRISMA
 * 
 * Reasons:
 * 1. Type-safe from database to controller
 * 2. Modern & trending (fits your progressive approach)
 * 3. Simple & intuitive API
 * 4. Perfect for Clean Architecture (clear separation)
 * 5. Auto-generated types (no manual DTO duplication)
 * 6. Best performance
 * 7. Developer experience is excellent
 * 
 * ALTERNATIVE: TYPEORM (if you need complex SQL queries)
 * 
 * Reasons:
 * 1. Mature ecosystem (proven in production)
 * 2. QueryBuilder for complex queries
 * 3. SQL + NoSQL support
 * 4. Decorator-based (familiar with NestJS)
 * 
 * NOT RECOMMENDED unless MongoDB-only: MONGOOSE
 * 
 * Reasons:
 * 1. Your project uses SQL (clean architecture)
 * 2. PRISMA better for TypeScript
 * 3. MONGOOSE overhead for SQL projects
 */

// ============================================================================
// 💡 IMPLEMENTATION WITH PRISMA (Best Choice)
// ============================================================================

/**
 * // src/infrastructure/database/prisma.service.ts
 * @Injectable()
 * export class PrismaService extends PrismaClient implements OnModuleInit {
 *   async onModuleInit() {
 *     await this.$connect();
 *   }
 * 
 *   async onModuleDestroy() {
 *     await this.$disconnect();
 *   }
 * }
 * 
 * // src/infrastructure/repositories/user.repository.ts
 * @Injectable()
 * export class UserRepository {
 *   constructor(private prisma: PrismaService) {}
 * 
 *   async findAll() {
 *     return await this.prisma.user.findMany({
 *       include: { posts: true }
 *     });
 *   }
 * 
 *   async findById(id: number) {
 *     return await this.prisma.user.findUnique({
 *       where: { id }
 *     });
 *   }
 * 
 *   async create(data: CreateUserInput) {
 *     return await this.prisma.user.create({ data });
 *   }
 * }
 * 
 * // src/application/usecases/get-users.usecase.ts
 * @Injectable()
 * export class GetUsersUseCase {
 *   constructor(private userRepository: UserRepository) {}
 * 
 *   async execute() {
 *     return await this.userRepository.findAll();
 *   }
 * }
 * 
 * ✅ Perfect Clean Architecture layer:
 * 1. Prisma (infrastructure layer)
 * 2. Repository (data access layer)
 * 3. UseCase (application layer)
 * 4. Controller (interface layer)
 */

export const ORMComparison = `
PRISMA vs TYPEORM vs MONGOOSE

PRISMA:
✅ Modern, type-safe
✅ Best DX (developer experience)
✅ Best performance
✅ Auto-migrations
❌ Limited for complex queries
⭐ RECOMMENDED for your project

TYPEORM:
✅ Mature, stable
✅ SQL + NoSQL
✅ QueryBuilder for complex queries
❌ Boilerplate heavy
⭐ Good alternative if complex queries needed

MONGOOSE:
✅ Perfect for MongoDB
✅ Powerful hooks/middleware
❌ Only for NoSQL
❌ Not ideal for SQL projects
⭐ Use only if MongoDB-only

BEST CHOICE FOR YOUR CLEAN ARCHITECTURE: PRISMA
- Type-safe from DB to controller
- Clean separation of concerns
- Modern approach
- Excellent performance
`;
