/**
 * ============================================================================
 * INSTANCE, PROVIDERS, MODULES - NestJS Core Concepts
 * ============================================================================
 * 
 * Ba concepts này là nền tảng của NestJS architecture.
 */

// ============================================================================
// 1️⃣ INSTANCE (Thể hiện)
// ============================================================================

/**
 * Instance = Một object cụ thể được tạo từ class
 * 
 * Ví dụ:
 * - Class = Bản thiết kế ngôi nhà
 * - Instance = Một ngôi nhà cụ thể được xây theo thiết kế đó
 */

/**
 * VÍ DỤ:
 * 
 * // Class định nghĩa
 * class User {
 *   constructor(public id: number, public name: string) {}
 * 
 *   getInfo() {
 *     return `User ${this.id}: ${this.name}`;
 *   }
 * }
 * 
 * // Instance 1: user1
 * const user1 = new User(1, 'Alice');
 * console.log(user1.getInfo()); // "User 1: Alice"
 * 
 * // Instance 2: user2
 * const user2 = new User(2, 'Bob');
 * console.log(user2.getInfo()); // "User 2: Bob"
 * 
 * ✅ user1 & user2 là 2 instances khác nhau
 * ✅ Cùng class (User), nhưng data khác nhau
 */

/**
 * SINGLETON INSTANCE (NestJS):
 * 
 * @Injectable()
 * export class DatabaseService {
 *   // ✅ NestJS tạo 1 instance duy nhất (Singleton)
 *   // ✅ Tất cả services dùng cùng 1 instance này
 * }
 * 
 * // NestJS DI Container:
 * // 1. Tạo 1 instance: dbService = new DatabaseService()
 * // 2. Lưu vào memory
 * // 3. Khi có service cần → dùng cùng 1 instance
 * 
 * @Injectable()
 * export class OrderService {
 *   constructor(private db: DatabaseService) {}
 *   // ✅ db = singleton instance từ DI Container
 * }
 * 
 * @Injectable()
 * export class UserService {
 *   constructor(private db: DatabaseService) {}
 *   // ✅ db = cùng instance từ DI Container
 * }
 * 
 * ✅ BENEFIT:
 * - OrderService & UserService dùng cùng DatabaseService instance
 * - Tiết kiệm memory (chỉ 1 instance)
 * - Share state (nếu cần)
 */

// ============================================================================
// 2️⃣ PROVIDERS (Nhà cung cấp)
// ============================================================================

/**
 * Provider = Một service, class, value, factory được đăng ký với NestJS
 * để có thể được inject vào các classes khác.
 * 
 * Ý tưởng:
 * - Provider là bất cứ thứ gì có thể được inject
 * - NestJS DI Container quản lý providers
 * - Khi cần → DI Container sẽ tạo/cấp instance
 */

/**
 * 4 LOẠI PROVIDERS:
 */

/**
 * 1️⃣ CLASS PROVIDER (Loại phổ biến nhất)
 *    Cấp một class instance
 * 
 * // database.service.ts
 * @Injectable()
 * export class DatabaseService {
 *   async query(sql: string) { ... }
 * }
 * 
 * // app.module.ts
 * @Module({
 *   providers: [DatabaseService], // ✅ Register DatabaseService as provider
 * })
 * export class AppModule {}
 * 
 * // order.service.ts
 * @Injectable()
 * export class OrderService {
 *   constructor(private db: DatabaseService) {} // ✅ Inject DatabaseService
 * }
 * 
 * ✅ NestJS sẽ:
 * 1. Tạo DatabaseService instance
 * 2. Inject vào OrderService constructor
 */

/**
 * 2️⃣ VALUE PROVIDER
 *    Cấp một giá trị cụ thể (string, number, object)
 * 
 * // app.module.ts
 * const CONFIG = {
 *   database_url: 'postgresql://localhost:5432/db',
 *   api_key: 'sk_123456789',
 *   port: 3000,
 * };
 * 
 * @Module({
 *   providers: [
 *     {
 *       provide: 'CONFIG', // ✅ Token
 *       useValue: CONFIG,   // ✅ Giá trị
 *     },
 *   ],
 * })
 * export class AppModule {}
 * 
 * // order.service.ts
 * @Injectable()
 * export class OrderService {
 *   constructor(@Inject('CONFIG') private config: any) {}
 * 
 *   async createOrder() {
 *     const dbUrl = this.config.database_url; // ✅ Lấy từ config
 *   }
 * }
 */

/**
 * 3️⃣ FACTORY PROVIDER
 *    Cấp kết quả từ factory function
 * 
 * // app.module.ts
 * @Module({
 *   providers: [
 *     {
 *       provide: 'DATABASE_CONNECTION',
 *       useFactory: async () => {
 *         // ✅ Tính toán/setup khi cần
 *         const connection = await DatabaseService.connect(
 *           'postgresql://localhost:5432/db'
 *         );
 *         return connection;
 *       },
 *       inject: [ConfigService], // ✅ Dependencies của factory
 *     },
 *   ],
 * })
 * export class AppModule {}
 * 
 * // order.service.ts
 * @Injectable()
 * export class OrderService {
 *   constructor(@Inject('DATABASE_CONNECTION') private db: Connection) {}
 * }
 */

/**
 * 4️⃣ ALIAS PROVIDER
 *    Tạo alias cho provider khác
 * 
 * // database.service.ts
 * @Injectable()
 * export class PostgreSQLService {
 *   async query(sql: string) { ... }
 * }
 * 
 * // app.module.ts
 * @Module({
 *   providers: [
 *     PostgreSQLService,
 *     {
 *       provide: 'DATABASE', // ✅ Alias
 *       useExisting: PostgreSQLService, // ✅ Point đến PostgreSQLService
 *     },
 *   ],
 * })
 * export class AppModule {}
 * 
 * // order.service.ts
 * @Injectable()
 * export class OrderService {
 *   constructor(@Inject('DATABASE') private db: PostgreSQLService) {}
 *   // ✅ Inject bằng alias
 * }
 */

/**
 * ✅ PROVIDERS SUMMARY:
 * 
 * Class Provider:
 * providers: [DatabaseService]
 * 
 * Value Provider:
 * providers: [{ provide: 'CONFIG', useValue: {...} }]
 * 
 * Factory Provider:
 * providers: [{ provide: 'DB', useFactory: async () => {...} }]
 * 
 * Alias Provider:
 * providers: [{ provide: 'DB_ALIAS', useExisting: DatabaseService }]
 */

// ============================================================================
// 3️⃣ MODULES (Mô-đun)
// ============================================================================

/**
 * Module = Một container tổ chức các providers, controllers, imports
 * 
 * Ý tưởng:
 * - Chia ứng dụng thành các modules nhỏ
 * - Mỗi module quản lý một feature hoặc layer
 * - Modules có thể import/export để tái sử dụng
 */

/**
 * STRUCTURE CỦA MODULE:
 * 
 * @Module({
 *   imports: [...],      // ✅ Import các modules khác
 *   controllers: [...],  // ✅ Controllers của module này
 *   providers: [...],    // ✅ Services, factories, values
 *   exports: [...],      // ✅ Export để module khác dùng
 * })
 * export class MyModule {}
 */

/**
 * VÍ DỤ: SIMPLE MODULE
 * 
 * // user.service.ts
 * @Injectable()
 * export class UserService {
 *   async getUsers() {
 *     // Get users from database
 *   }
 * }
 * 
 * // user.controller.ts
 * @Controller('users')
 * export class UserController {
 *   constructor(private userService: UserService) {}
 * 
 *   @Get()
 *   async getAllUsers() {
 *     return await this.userService.getUsers();
 *   }
 * }
 * 
 * // user.module.ts
 * @Module({
 *   controllers: [UserController],    // ✅ Register controller
 *   providers: [UserService],         // ✅ Register provider
 * })
 * export class UserModule {}
 * 
 * // app.module.ts
 * @Module({
 *   imports: [UserModule],            // ✅ Import UserModule
 * })
 * export class AppModule {}
 * 
 * ✅ Flow:
 * 1. HTTP GET /users
 * 2. AppModule import UserModule
 * 3. UserModule controller = UserController
 * 4. UserController inject UserService
 * 5. UserService.getUsers()
 */

/**
 * VÍ DỤ: COMPLEX MODULE (Multi-layer)
 * 
 * // infrastructure/database/database.module.ts
 * @Module({
 *   providers: [
 *     DatabaseService,
 *     {
 *       provide: 'DATABASE_CONNECTION',
 *       useFactory: async (dbService: DatabaseService) => {
 *         return await dbService.connect();
 *       },
 *       inject: [DatabaseService],
 *     },
 *   ],
 *   exports: ['DATABASE_CONNECTION'], // ✅ Export để module khác dùng
 * })
 * export class DatabaseModule {}
 * 
 * // application/orders/order.service.ts
 * @Injectable()
 * export class OrderService {
 *   constructor(@Inject('DATABASE_CONNECTION') private db: Connection) {}
 * 
 *   async createOrder(dto: CreateOrderDto) {
 *     // Use database connection
 *   }
 * }
 * 
 * // application/orders/order.controller.ts
 * @Controller('orders')
 * export class OrderController {
 *   constructor(private orderService: OrderService) {}
 * 
 *   @Post()
 *   async create(@Body() dto: CreateOrderDto) {
 *     return await this.orderService.createOrder(dto);
 *   }
 * }
 * 
 * // application/orders/order.module.ts
 * @Module({
 *   imports: [DatabaseModule],        // ✅ Import DatabaseModule
 *   controllers: [OrderController],
 *   providers: [OrderService],
 *   exports: [OrderService],          // ✅ Export OrderService
 * })
 * export class OrderModule {}
 * 
 * // app.module.ts
 * @Module({
 *   imports: [DatabaseModule, OrderModule], // ✅ Import modules
 * })
 * export class AppModule {}
 */

// ============================================================================
// 4️⃣ GLOBAL MODULES
// ============================================================================

/**
 * Global Module = Module được import tự động ở tất cả modules
 * Không cần phải import lại
 */

/**
 * // config.module.ts
 * @Global()
 * @Module({
 *   providers: [
 *     {
 *       provide: 'CONFIG',
 *       useValue: { port: 3000, api_key: '...' },
 *     },
 *   ],
 *   exports: ['CONFIG'],
 * })
 * export class ConfigModule {}
 * 
 * // app.module.ts
 * @Module({
 *   imports: [ConfigModule], // ✅ Import ConfigModule một lần
 * })
 * export class AppModule {}
 * 
 * // user.service.ts (trong UserModule)
 * @Injectable()
 * export class UserService {
 *   // ✅ Có thể dùng CONFIG mà không cần import ConfigModule
 *   constructor(@Inject('CONFIG') private config: any) {}
 * }
 * 
 * // order.service.ts (trong OrderModule)
 * @Injectable()
 * export class OrderService {
 *   // ✅ Cũng có thể dùng CONFIG
 *   constructor(@Inject('CONFIG') private config: any) {}
 * }
 */

// ============================================================================
// 5️⃣ DYNAMIC MODULES
// ============================================================================

/**
 * Dynamic Module = Module được tạo động với config
 * 
 * // database.module.ts
 * @Module({})
 * export class DatabaseModule {
 *   static forRoot(config: DatabaseConfig): DynamicModule {
 *     return {
 *       module: DatabaseModule,
 *       providers: [
 *         {
 *           provide: 'DATABASE_CONFIG',
 *           useValue: config,
 *         },
 *         DatabaseService,
 *       ],
 *       exports: [DatabaseService],
 *     };
 *   }
 * }
 * 
 * // app.module.ts
 * @Module({
 *   imports: [
 *     DatabaseModule.forRoot({
 *       host: 'localhost',
 *       port: 5432,
 *       database: 'mydb',
 *     }),
 *   ],
 * })
 * export class AppModule {}
 */

// ============================================================================
// 📊 TÓMSÁCHUAT: Instance vs Provider vs Module
// ============================================================================

/**
 * INSTANCE:
 * - Object cụ thể tạo từ class
 * - Ví dụ: dbService = new DatabaseService()
 * - NestJS sử dụng Singleton pattern (1 instance mỗi service)
 * 
 * PROVIDER:
 * - Cách đăng ký một service/value/factory với NestJS
 * - 4 loại: Class, Value, Factory, Alias
 * - Được đăng ký trong Module.providers = [...]
 * - NestJS DI Container quản lý providers
 * 
 * MODULE:
 * - Container tổ chức providers, controllers
 * - Chia ứng dụng thành các modules nhỏ
 * - Modules import/export để tái sử dụng
 * - Có thể Global hoặc Dynamic
 */

// ============================================================================
// 🔄 RELATIONSHIP: Instance → Provider → Module
// ============================================================================

/**
 * Module.providers = [DatabaseService]
 *                    ↓
 * NestJS DI Container tạo instance
 *                    ↓
 * DatabaseService instance được cache (Singleton)
 *                    ↓
 * Inject vào OrderService constructor
 * 
 * Flow:
 * 1. Module định nghĩa providers
 * 2. NestJS tạo instances từ providers
 * 3. DI Container quản lý instances
 * 4. Inject instances vào constructors
 */

// ============================================================================
// 🎯 PROVIDERS & MODULES TRONG PROJECT CỦA BẠN
// ============================================================================

/**
 * // app.module.ts (của bạn)
 * @Module({
 *   controllers: [AppController],
 *   providers: [AppService],           // ✅ AppService là provider
 * })
 * export class AppModule {}
 * 
 * // app.service.ts (của bạn)
 * @Injectable()
 * export class AppService {           // ✅ Class provider
 *   getHello(): string {
 *     return 'Hello World!';
 *   }
 * }
 * 
 * // app.controller.ts (của bạn)
 * @Controller()
 * export class AppController {
 *   constructor(private readonly appService: AppService) {} // ✅ Inject
 * 
 *   @Get()
 *   getHello(): string {
 *     return this.appService.getHello();
 *   }
 * }
 * 
 * Flow:
 * 1. AppModule định nghĩa providers: [AppService]
 * 2. NestJS tạo AppService instance
 * 3. Inject vào AppController
 * 4. HTTP GET / → AppController.getHello()
 */

/**
 * EXTENDED PROJECT (với Repositories, Guards, Pipes):
 * 
 * // app.module.ts
 * @Module({
 *   controllers: [AppController],
 *   providers: [
 *     AppService,           // ✅ Service provider
 *     AuthGuard,            // ✅ Guard provider
 *     ValidationPipe,       // ✅ Pipe provider
 *     LoggingInterceptor,   // ✅ Interceptor provider
 *     UserRepository,       // ✅ Repository provider
 *   ],
 * })
 * export class AppModule {}
 * 
 * ✅ Tất cả providers được NestJS DI Container quản lý
 * ✅ Tất cả instances được tạo 1 lần (Singleton)
 * ✅ Tất cả dependencies được inject tự động
 */

// ============================================================================
// 🌟 BEST PRACTICES
// ============================================================================

/**
 * 1️⃣ MODULE ORGANIZATION:
 *    - Chia module theo feature (UserModule, OrderModule, ProductModule)
 *    - Hoặc theo layer (DataModule, ServiceModule, ControllerModule)
 * 
 * 2️⃣ PROVIDER TYPES:
 *    - Dùng Class Provider cho services chính
 *    - Dùng Value Provider cho configs
 *    - Dùng Factory Provider cho complex setup
 * 
 * 3️⃣ EXPORTS:
 *    - Export providers cần dùng ở modules khác
 *    - Ẩn những providers chỉ dùng nội bộ
 * 
 * 4️⃣ GLOBAL MODULES:
 *    - Dùng cho ConfigService, LoggerService
 *    - Không dùng quá nhiều (có thể gây confusion)
 * 
 * 5️⃣ SINGLETON PATTERN:
 *    - Default scope là Singleton
 *    - Tiết kiệm memory, nhưng cần thread-safe
 *    - Nếu service có state riêng per-request → dùng REQUEST scope
 */

export const InstanceProvidersModules = `
INSTANCE:
- Object cụ thể từ class
- Ví dụ: new DatabaseService()
- NestJS tạo Singleton instances

PROVIDER:
- Cách đăng ký service/value/factory với NestJS
- 4 loại: Class, Value, Factory, Alias
- Được lưu trong Module.providers = [...]

MODULE:
- Container tổ chức providers, controllers
- Chia app thành feature/layer modules
- Có thể import/export, Global, Dynamic

RELATIONSHIP:
Module.providers → NestJS tạo instances → DI Container quản lý → Inject vào classes

Project của bạn:
- AppModule có providers: [AppService]
- AppService là class provider
- AppService instance được inject vào AppController
`;
