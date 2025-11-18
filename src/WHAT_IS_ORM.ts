/**
 * ============================================================================
 * ORM (Object-Relational Mapping) - LÀ GÌ?
 * ============================================================================
 * 
 * ORM = Cách để ánh xạ (mapping) giữa Objects (code) và Database (tables).
 * Thay vì viết SQL trực tiếp, bạn dùng objects & methods.
 */

// ============================================================================
// 1️⃣ ORM LÀ GÌ?
// ============================================================================

/**
 * ĐỊNH NGHĨA:
 * ORM = Object-Relational Mapping
 * 
 * Ý tưởng:
 * - Database table → Class/Object
 * - Database row → Object instance
 * - Database column → Object property
 * 
 * BENEFIT:
 * ✅ Viết code bằng objects thay vì SQL strings
 * ✅ Type-safe (compiler check)
 * ✅ Dễ bảo trì (refactor dễ)
 * ✅ Ít bugs (không phải string concatenation)
 * ✅ Reusable (objects có thể tái sử dụng)
 */

/**
 * VISUAL MAPPING:
 * 
 * DATABASE (PostgreSQL):
 * ┌─────────────────────────────────────────┐
 * │ TABLE: users                            │
 * ├────┬───────────┬──────────┬─────────────┤
 * │ id │ name      │ email    │ created_at  │
 * ├────┼───────────┼──────────┼─────────────┤
 * │ 1  │ Alice     │ a@... │ 2025-01-01  │
 * │ 2  │ Bob       │ b@... │ 2025-01-02  │
 * └────┴───────────┴──────────┴─────────────┘
 *          ↓↑ ORM MAPPING ↑↓
 * CODE (TypeScript):
 * 
 * class User {
 *   id: number;
 *   name: string;
 *   email: string;
 *   created_at: Date;
 * }
 * 
 * const users: User[] = [
 *   { id: 1, name: 'Alice', email: 'a@...', created_at: new Date() },
 *   { id: 2, name: 'Bob', email: 'b@...', created_at: new Date() }
 * ];
 */

// ============================================================================
// 2️⃣ ORM vs RAW SQL COMPARISON
// ============================================================================

/**
 * ❌ RAW SQL (Without ORM):
 * 
 * // database.ts
 * import mysql from 'mysql2/promise';
 * 
 * async function getUsers() {
 *   const connection = await mysql.createConnection({
 *     host: 'localhost',
 *     user: 'root',
 *     password: 'password',
 *     database: 'mydb',
 *   });
 * 
 *   // ❌ Write SQL string directly
 *   const [rows] = await connection.execute(
 *     'SELECT * FROM users'
 *   );
 * 
 *   return rows; // ❌ No type safety! rows is any[]
 * }
 * 
 * async function getUserById(id: number) {
 *   const connection = await mysql.createConnection({...});
 * 
 *   // ❌ String concatenation (SQL injection risk!)
 *   const [rows] = await connection.execute(
 *     `SELECT * FROM users WHERE id = ${id}`
 *   );
 * 
 *   return rows[0]; // ❌ any type
 * }
 * 
 * async function createUser(name: string, email: string) {
 *   const connection = await mysql.createConnection({...});
 * 
 *   // ❌ Manual mapping (error-prone)
 *   const result = await connection.execute(
 *     'INSERT INTO users (name, email) VALUES (?, ?)',
 *     [name, email]
 *   );
 * 
 *   return result; // ❌ Result structure unclear
 * }
 * 
 * ❌ PROBLEMS:
 * 1. No type safety → Any type for rows
 * 2. SQL injection risk (string concatenation)
 * 3. Manual mapping between SQL & objects
 * 4. No validation
 * 5. Database schema mismatch hard to detect
 * 6. Connection management manual
 * 7. Error handling verbose
 * 8. Code duplication (connect, close everywhere)
 */

/**
 * ✅ WITH ORM (Prisma):
 * 
 * // prisma/schema.prisma
 * model User {
 *   id    Int     @id @default(autoincrement())
 *   name  String
 *   email String  @unique
 * }
 * 
 * // user.service.ts
 * import { PrismaClient } from '@prisma/client';
 * 
 * const prisma = new PrismaClient();
 * 
 * // ✅ Type-safe! Return type is User[]
 * async function getUsers(): Promise<User[]> {
 *   return await prisma.user.findMany();
 * }
 * 
 * // ✅ Type-safe! Parameter & return type clear
 * async function getUserById(id: number): Promise<User | null> {
 *   return await prisma.user.findUnique({
 *     where: { id },
 *   });
 * }
 * 
 * // ✅ Auto-generated types! No manual mapping
 * async function createUser(name: string, email: string): Promise<User> {
 *   return await prisma.user.create({
 *     data: { name, email },
 *   });
 * }
 * 
 * ✅ BENEFITS:
 * 1. Full type safety → TypeScript compiler checks
 * 2. No SQL injection risk → ORM handles escaping
 * 3. Auto mapping → Schema → Types
 * 4. Built-in validation
 * 5. Schema changes auto-generate types
 * 6. Connection managed automatically
 * 7. Error handling included
 * 8. No code duplication
 */

// ============================================================================
// 3️⃣ PRISMA DETAILED EXAMPLES
// ============================================================================

/**
 * ✅ SETUP PRISMA
 * 
 * // 1. Install
 * npm install @prisma/client
 * npm install -D prisma
 * 
 * // 2. npx prisma init
 * // Creates: prisma/schema.prisma, .env
 * 
 * // 3. .env
 * DATABASE_URL="postgresql://user:password@localhost:5432/mydb"
 * 
 * // 4. prisma/schema.prisma
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
 *   id     Int    @id @default(autoincrement())
 *   title  String
 *   userId Int
 *   user   User   @relation(fields: [userId], references: [id])
 * }
 * 
 * // 5. npx prisma migrate dev --name init
 * // Creates database & migrations
 */

/**
 * ✅ PRISMA BASIC OPERATIONS
 * 
 * import { PrismaClient } from '@prisma/client';
 * 
 * const prisma = new PrismaClient();
 * 
 * // CREATE
 * const user = await prisma.user.create({
 *   data: {
 *     name: 'Alice',
 *     email: 'alice@example.com',
 *   },
 * });
 * // ✅ user: User (type-safe)
 * 
 * // READ ONE
 * const user = await prisma.user.findUnique({
 *   where: { id: 1 },
 * });
 * // ✅ user: User | null
 * 
 * // READ MANY
 * const users = await prisma.user.findMany();
 * // ✅ users: User[] (type-safe)
 * 
 * // READ WITH FILTER
 * const users = await prisma.user.findMany({
 *   where: {
 *     email: {
 *       contains: '@gmail.com',
 *     },
 *   },
 * });
 * // ✅ Strongly typed filter!
 * 
 * // READ WITH RELATIONS
 * const user = await prisma.user.findUnique({
 *   where: { id: 1 },
 *   include: {
 *     posts: true, // ✅ Load related posts
 *   },
 * });
 * // ✅ user.posts: Post[]
 * 
 * // UPDATE
 * const user = await prisma.user.update({
 *   where: { id: 1 },
 *   data: {
 *     name: 'Alice Updated',
 *   },
 * });
 * // ✅ user: User (updated)
 * 
 * // DELETE
 * const user = await prisma.user.delete({
 *   where: { id: 1 },
 * });
 * // ✅ Returns deleted user
 * 
 * // TRANSACTIONS
 * await prisma.$transaction(async (tx) => {
 *   const user = await tx.user.create({ data: {...} });
 *   const post = await tx.post.create({ data: {...} });
 *   // ✅ Both succeed or both fail
 * });
 */

// ============================================================================
// 4️⃣ RAW SQL vs PRISMA: DETAILED COMPARISON
// ============================================================================

/**
 * SCENARIO: Get all users with their posts count
 * 
 * ❌ RAW SQL:
 * 
 * const query = `
 *   SELECT 
 *     u.id,
 *     u.name,
 *     u.email,
 *     COUNT(p.id) as post_count
 *   FROM users u
 *   LEFT JOIN posts p ON u.id = p.user_id
 *   GROUP BY u.id, u.name, u.email
 *   ORDER BY post_count DESC;
 * `;
 * 
 * const result = await connection.execute(query);
 * 
 * // ❌ Problems:
 * // 1. result: any (no type safety)
 * // 2. Manual mapping needed
 * // 3. post_count is unknown type (number? string?)
 * // 4. Refactoring column name? Must update string
 * // 5. No validation
 * 
 * // Manual mapping:
 * interface UserWithPostCount {
 *   id: number;
 *   name: string;
 *   email: string;
 *   post_count: number;
 * }
 * 
 * const users: UserWithPostCount[] = result.map((row: any) => ({
 *   id: row.id,
 *   name: row.name,
 *   email: row.email,
 *   post_count: parseInt(row.post_count), // ❌ Manual parsing
 * }));
 * 
 * ❌ 10 LINES OF CODE + manual type mapping
 * ❌ Error-prone
 * ❌ Hard to maintain
 */

/**
 * ✅ PRISMA:
 * 
 * const users = await prisma.user.findMany({
 *   include: {
 *     posts: {
 *       select: {}, // ✅ Load posts (for counting)
 *     },
 *   },
 * });
 * 
 * // ✅ Direct property access (no mapping needed)
 * const usersWithPostCount = users.map(user => ({
 *   ...user,
 *   postCount: user.posts.length,
 * }));
 * 
 * ✅ 7 LINES OF CODE
 * ✅ Type-safe
 * ✅ Easy to maintain
 * ✅ Refactor column? Prisma schema handles it
 */

// ============================================================================
// 5️⃣ SQL INJECTION RISK: RAW SQL vs ORM
// ============================================================================

/**
 * ❌ VULNERABLE: RAW SQL (SQL Injection)
 * 
 * // User input from form
 * const userId = req.body.id; // "1 OR 1=1" (malicious)
 * 
 * // ❌ DANGEROUS! String concatenation
 * const query = `SELECT * FROM users WHERE id = ${userId}`;
 * // Result: "SELECT * FROM users WHERE id = 1 OR 1=1"
 * // Returns ALL users! (SQL Injection!)
 * 
 * // Even with parameterized queries, can be forgotten
 * const query = `SELECT * FROM users WHERE id = ${userId}`;
 * // vs
 * const query = 'SELECT * FROM users WHERE id = ?';
 * const result = await connection.execute(query, [userId]);
 */

/**
 * ✅ SAFE: PRISMA (Automatic Escaping)
 * 
 * const userId = req.body.id; // "1 OR 1=1"
 * 
 * // ✅ SAFE! Prisma escapes automatically
 * const user = await prisma.user.findUnique({
 *   where: { id: parseInt(userId) },
 * });
 * 
 * // Prisma generates parameterized SQL internally
 * // No SQL injection possible!
 */

// ============================================================================
// 6️⃣ TYPE SAFETY: RAW SQL vs ORM
// ============================================================================

/**
 * ❌ RAW SQL (No Type Safety):
 * 
 * const result = await connection.execute('SELECT * FROM users');
 * 
 * // ❌ result is any
 * // ❌ Compiler can't check
 * // ❌ Typos go undetected
 * 
 * result.forEach(row => {
 *   console.log(row.namee); // ❌ Typo! "namee" vs "name"
 *   // At runtime: undefined (no compile error!)
 * });
 * 
 * // ❌ Type must be guessed
 * const user: User = result[0]; // ❌ Might not match
 */

/**
 * ✅ PRISMA (Full Type Safety):
 * 
 * const users = await prisma.user.findMany();
 * 
 * // ✅ users: User[] (TypeScript knows)
 * // ✅ Compiler checks everything
 * 
 * users.forEach(user => {
 *   console.log(user.namee); // ❌ Compile ERROR!
 *   // "Property 'namee' does not exist on type 'User'"
 * });
 * 
 * // ✅ user is definitely User type
 * const user: User = users[0]; // ✅ Type-safe
 */

// ============================================================================
// 7️⃣ REFACTORING: RAW SQL vs ORM
// ============================================================================

/**
 * ❌ SCENARIO: Rename column "email" → "email_address"
 * 
 * RAW SQL (Need to update manually):
 * 
 * // Database
 * ALTER TABLE users RENAME COLUMN email TO email_address;
 * 
 * // Code 1
 * const query1 = 'SELECT email FROM users'; // ❌ Must update
 * const query1 = 'SELECT email_address FROM users'; // ✅ Fixed
 * 
 * // Code 2
 * const query2 = 'SELECT * FROM users'; // ✅ Still works (all columns)
 * 
 * // Code 3
 * const query3 = `...WHERE email = '${email}'`; // ❌ Must update
 * const query3 = `...WHERE email_address = '${email}'`; // ✅ Fixed
 * 
 * // ❌ MANUAL REFACTORING EVERYWHERE
 * // ❌ Easy to miss one
 * // ❌ Runtime errors possible
 */

/**
 * ✅ PRISMA (Auto-generated types):
 * 
 * // 1. Update schema
 * model User {
 *   email_address: String // Renamed
 * }
 * 
 * // 2. Generate migration
 * npx prisma migrate dev --name rename_email_column
 * 
 * // 3. Code updates automatically!
 * const user = await prisma.user.findUnique({
 *   where: { id: 1 },
 *   select: { email: true }, // ❌ COMPILE ERROR!
 *   // Property 'email' does not exist on 'User'
 * });
 * 
 * // Fix it
 * const user = await prisma.user.findUnique({
 *   where: { id: 1 },
 *   select: { email_address: true }, // ✅ Correct
 * });
 * 
 * ✅ COMPILER CATCHES ALL USAGES
 * ✅ Refactor safely
 * ✅ No typos possible
 */

// ============================================================================
// 8️⃣ REAL-WORLD: RAW SQL vs PRISMA LINES OF CODE
// ============================================================================

/**
 * TASK: User CRUD API (Create, Read, Update, Delete)
 * 
 * ❌ RAW SQL (MySQL driver):
 * 
 * const mysql = require('mysql2/promise');
 * 
 * let connection;
 * 
 * async function connect() {
 *   connection = await mysql.createConnection({
 *     host: 'localhost',
 *     user: 'root',
 *     password: 'password',
 *     database: 'mydb',
 *   });
 * }
 * 
 * async function getUsers() {
 *   try {
 *     const [rows] = await connection.execute('SELECT * FROM users');
 *     return rows;
 *   } catch (err) {
 *     console.error('Error:', err);
 *     throw err;
 *   }
 * }
 * 
 * async function getUserById(id) {
 *   try {
 *     const [rows] = await connection.execute(
 *       'SELECT * FROM users WHERE id = ?',
 *       [id]
 *     );
 *     return rows[0] || null;
 *   } catch (err) {
 *     console.error('Error:', err);
 *     throw err;
 *   }
 * }
 * 
 * async function createUser(name, email) {
 *   try {
 *     const [result] = await connection.execute(
 *       'INSERT INTO users (name, email) VALUES (?, ?)',
 *       [name, email]
 *     );
 *     return { id: result.insertId, name, email };
 *   } catch (err) {
 *     console.error('Error:', err);
 *     throw err;
 *   }
 * }
 * 
 * async function updateUser(id, name, email) {
 *   try {
 *     await connection.execute(
 *       'UPDATE users SET name = ?, email = ? WHERE id = ?',
 *       [name, email, id]
 *     );
 *     return await getUserById(id);
 *   } catch (err) {
 *     console.error('Error:', err);
 *     throw err;
 *   }
 * }
 * 
 * async function deleteUser(id) {
 *   try {
 *     await connection.execute('DELETE FROM users WHERE id = ?', [id]);
 *     return { success: true };
 *   } catch (err) {
 *     console.error('Error:', err);
 *     throw err;
 *   }
 * }
 * 
 * ❌ ~60 LINES OF CODE
 * ❌ Manual error handling
 * ❌ Manual connection management
 * ❌ No type safety
 * ❌ Type annotations missing
 */

/**
 * ✅ PRISMA:
 * 
 * import { PrismaClient } from '@prisma/client';
 * 
 * const prisma = new PrismaClient();
 * 
 * async function getUsers() {
 *   return await prisma.user.findMany();
 * }
 * 
 * async function getUserById(id: number) {
 *   return await prisma.user.findUnique({ where: { id } });
 * }
 * 
 * async function createUser(name: string, email: string) {
 *   return await prisma.user.create({ data: { name, email } });
 * }
 * 
 * async function updateUser(id: number, name: string, email: string) {
 *   return await prisma.user.update({
 *     where: { id },
 *     data: { name, email },
 *   });
 * }
 * 
 * async function deleteUser(id: number) {
 *   return await prisma.user.delete({ where: { id } });
 * }
 * 
 * ✅ ~20 LINES OF CODE
 * ✅ Auto error handling
 * ✅ Auto connection management
 * ✅ Full type safety
 * ✅ Types auto-generated
 * ✅ 70% LESS CODE!
 */

// ============================================================================
// 🎯 WHEN TO USE ORM vs RAW SQL
// ============================================================================

/**
 * USE ORM (Prisma, TypeORM, Mongoose):
 * ✅ 80% of use cases
 * ✅ Standard CRUD operations
 * ✅ Type safety matters
 * ✅ Rapid development
 * ✅ Team size > 1 (maintainability)
 * ✅ Long-term project
 * 
 * USE RAW SQL:
 * ✅ Complex analytical queries
 * ✅ Performance-critical operations
 * ✅ Database-specific features
 * ✅ One-off reports
 * ✅ Already have SQL expertise
 * 
 * HYBRID (ORM + Raw SQL):
 * ✅ Use ORM for main operations
 * ✅ Use raw SQL for complex queries
 * ✅ Best of both worlds!
 */

// ============================================================================
// 📊 COMPREHENSIVE COMPARISON TABLE
// ============================================================================

/**
 * ┌──────────────────────────┬───────────────────┬─────────────────────┐
 * │ Criteria                 │ Raw SQL           │ ORM (Prisma)        │
 * ├──────────────────────────┼───────────────────┼─────────────────────┤
 * │ Code Length (CRUD)       │ ~60 lines         │ ~20 lines (70% less)│
 * │ Type Safety              │ ❌ None           │ ✅ Full             │
 * │ SQL Injection Risk       │ ❌ High           │ ✅ None             │
 * │ Learning Curve           │ ⭐ (SQL needed)   │ ⭐⭐ (ORM API)       │
 * │ Performance              │ ⭐⭐⭐ (optimal)   │ ⭐⭐⭐ (near optimal)│
 * │ Flexibility              │ ⭐⭐⭐ (highest)  │ ⭐⭐ (good)          │
 * │ Maintainability          │ ⭐ (hard)         │ ⭐⭐⭐ (easy)        │
 * │ Refactoring              │ ❌ Manual         │ ✅ Auto (compiler)  │
 * │ Error Handling           │ ❌ Manual         │ ✅ Built-in         │
 * │ Connection Mgmt          │ ❌ Manual         │ ✅ Automatic        │
 * │ Migrations               │ ❌ Manual scripts │ ✅ Auto-generated   │
 * │ Validation               │ ❌ None           │ ✅ Built-in         │
 * │ Testing                  │ ⭐ (hard to mock) │ ✅ Easy (mocking)   │
 * │ IDE Autocomplete         │ ❌ Limited        │ ✅ Full             │
 * └──────────────────────────┴───────────────────┴─────────────────────┘
 */

// ============================================================================
// 💡 ORM IN YOUR CLEAN ARCHITECTURE
// ============================================================================

/**
 * Layer structure with Prisma ORM:
 * 
 * INTERFACE LAYER (Controllers)
 *   ↓
 * APPLICATION LAYER (Use Cases)
 *   ↓
 * DOMAIN LAYER (Business Logic)
 *   ↓
 * INFRASTRUCTURE LAYER (Repositories)
 *   ↓
 * DATABASE LAYER (Prisma ORM)
 *   ↓
 * DATABASE (PostgreSQL)
 * 
 * // user.repository.ts (Infrastructure)
 * @Injectable()
 * export class UserRepository {
 *   constructor(private prisma: PrismaService) {}
 * 
 *   async findAll(): Promise<User[]> {
 *     return await this.prisma.user.findMany();
 *   }
 * 
 *   async findById(id: number): Promise<User | null> {
 *     return await this.prisma.user.findUnique({ where: { id } });
 *   }
 * }
 * 
 * // user.service.ts (Application)
 * @Injectable()
 * export class UserService {
 *   constructor(private userRepository: UserRepository) {}
 * 
 *   async getUsers(): Promise<User[]> {
 *     return await this.userRepository.findAll();
 *   }
 * }
 * 
 * // user.controller.ts (Interface)
 * @Controller('users')
 * export class UserController {
 *   constructor(private userService: UserService) {}
 * 
 *   @Get()
 *   async getAll(): Promise<User[]> {
 *     return await this.userService.getUsers();
 *   }
 * }
 * 
 * ✅ Perfect separation of concerns
 * ✅ Type-safe end-to-end
 * ✅ Easy testing (mock Repository)
 * ✅ Maintainable & scalable
 */

export const ORMExplanation = `
ORM (Object-Relational Mapping):

LÀ GÌ:
- Ánh xạ giữa Objects (code) và Database (tables)
- Table → Class, Row → Object, Column → Property
- Viết code bằng objects thay vì SQL strings

BENEFITS:
✅ Type-safe (compiler checks)
✅ No SQL injection risk (auto-escaping)
✅ Less code (70% reduction)
✅ Auto migrations
✅ Easy refactoring (compiler catches errors)
✅ Built-in validation & error handling
✅ Better IDE support (autocomplete)

RAW SQL:
❌ No type safety
❌ SQL injection risk
❌ Manual mappings
❌ More code (60+ lines for CRUD)
❌ Hard to maintain
✅ Better for complex queries
✅ Better performance (rarely matters)

RECOMMENDATION:
Use ORM (Prisma) for 80% of cases
Use raw SQL for complex analytical queries
Hybrid approach for best results

For Clean Architecture: Use ORM in Repository layer
- Type-safe end-to-end
- Easy testing
- Clean separation of concerns
`;
