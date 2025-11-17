/**
 * ============================================================================
 * DEPENDENCY INJECTION (DI)
 * ============================================================================
 * 
 * Dependency Injection = Cách cung cấp các "phụ thuộc" vào class
 * thay vì class tự tạo chúng.
 * 
 * Lợi ích:
 * ✅ Loose coupling (giảm phụ thuộc)
 * ✅ Dễ test (có thể mock)
 * ✅ Dễ bảo trì (thay đổi implementation không ảnh hưởng)
 * ✅ Reusable (tái sử dụng service)
 */

// ============================================================================
// 1️⃣ VẤN ĐỀ: TIGHT COUPLING (không có DI)
// ============================================================================

/**
 * ❌ VÍ DỤ SAI (Tight Coupling):
 * 
 * // database.service.ts
 * export class DatabaseService {
 *   async query(sql: string) {
 *     // Connect & query database
 *   }
 * }
 * 
 * // email.service.ts
 * export class EmailService {
 *   async send(to: string, subject: string, body: string) {
 *     // Send email via SMTP
 *   }
 * }
 * 
 * // order.service.ts
 * export class OrderService {
 *   // ❌ PROBLEM: OrderService tự tạo dependencies
 *   private db = new DatabaseService();
 *   private email = new EmailService();
 * 
 *   async createOrder(dto: CreateOrderDto) {
 *     const order = await this.db.query('INSERT INTO orders...');
 *     await this.email.send(dto.email, 'Order created', '...');
 *     return order;
 *   }
 * }
 * 
 * ❌ PROBLEMS:
 * 1. Tight Coupling:
 *    - OrderService phụ thuộc trực tiếp vào DatabaseService & EmailService
 *    - Nếu thay đổi DatabaseService → phải sửa OrderService
 * 
 * 2. Khó test:
 *    - Muốn test OrderService → phải test cả DatabaseService & EmailService
 *    - Không thể mock dependencies
 * 
 * 3. Tạo multiple instances:
 *    - Mỗi khi new OrderService() → tạo new DatabaseService()
 *    - Lãng phí memory (nhiều instance của cùng service)
 * 
 * 4. Không reusable:
 *    - DatabaseService chỉ dùng bởi OrderService
 *    - Không thể dùng ở service khác
 */

// ============================================================================
// 2️⃣ GIẢI PHÁP: DEPENDENCY INJECTION
// ============================================================================

/**
 * ✅ VÍ DỤ ĐÚNG (With Dependency Injection):
 * 
 * // database.service.ts
 * @Injectable()
 * export class DatabaseService {
 *   async query(sql: string) {
 *     // Connect & query database  
 *   }
 * }
 * 
 * // email.service.ts
 * @Injectable()
 * export class EmailService {
 *   async send(to: string, subject: string, body: string) {
 *     // Send email via SMTP
 *   }
 * }
 * 
 * // order.service.ts
 * @Injectable()
 * export class OrderService {
 *   // ✅ Nhận dependencies qua constructor (Injection)
 *   constructor(
 *     private db: DatabaseService,
 *     private email: EmailService,
 *   ) {}
 * 
 *   async createOrder(dto: CreateOrderDto) {
 *     const order = await this.db.query('INSERT INTO orders...');
 *     await this.email.send(dto.email, 'Order created', '...');
 *     return order;
 *   }
 * }
 * 
 * // app.module.ts (NestJS sẽ tự inject)
 * @Module({
 *   providers: [DatabaseService, EmailService, OrderService],
 * })
 * export class AppModule {}
 * 
 * ✅ BENEFITS:
 * 1. Loose Coupling:
 *    - OrderService không tự tạo DatabaseService & EmailService
 *    - OrderService chỉ depend on interface
 * 
 * 2. Dễ test:
 *    - Mock DatabaseService & EmailService trong test
 *    - Test OrderService riêng lẻ
 * 
 * 3. Reusable instances:
 *    - NestJS tạo 1 instance DatabaseService (Singleton)
 *    - Tất cả services dùng cùng 1 instance
 * 
 * 4. Dễ swap implementations:
 *    - Muốn dùng MongoDB thay MySQL → chỉ thay DatabaseService
 *    - OrderService không cần sửa
 */

// ===================================================================== =======
// 3️⃣ 3 CÁCH INJECT DEPENDENCIES
// ============================================================================

/**
 * ✅ CÁCH 1: Constructor Injection (Phổ biến nhất)
 * 
 * @Injectable()
 * export class OrderService {
 *   constructor(private db: DatabaseService) {}
 * 
 *   async getOrder(id: number) {
 *     return await this.db.query(`SELECT * FROM orders WHERE id = ${id}`);
 *   }
 * }
 */

/**
 * ✅ CÁCH 2: Property Injection
 * 
 * @Injectable()
 * export class OrderService {
 *   @Inject()
 *   private db: DatabaseService;
 * 
 *   async getOrder(id: number) {
 *     return await this.db.query(`SELECT * FROM orders WHERE id = ${id}`);
 *   }
 * }
 */

/**
 * ✅ CÁCH 3: Method Injection
 * 
 * @Injectable()
 * export class OrderService {
 *   async getOrder(id: number, db: DatabaseService) {
 *     return await db.query(`SELECT * FROM orders WHERE id = ${id}`);
 *   }
 * }
 */

// ============================================================================
// 4️⃣ DEPENDENCY INJECTION CONTAINER (DI Container)
// ============================================================================

/**
 * DI Container = Một manager quản lý tất cả instances
 * 
 * NestJS có built-in DI Container:
 * - Tạo instances
 * - Quản lý lifetime (Singleton, Transient, Request-scoped)
 * - Inject vào class khi cần
 */

/**
 * ✅ VÍ DỤ: NestJS DI Container tự động injection
 * 
 * // database.service.ts
 * @Injectable()
 * export class DatabaseService {
 *   query(sql: string) { ... }
 * }
 * 
 * // email.service.ts
 * @Injectable()
 * export class EmailService {
 *   send(to: string, subject: string, body: string) { ... }
 * }
 * 
 * // order.service.ts
 * @Injectable()
 * export class OrderService {
 *   constructor(
 *     private db: DatabaseService,
 *     private email: EmailService,
 *   ) {}
 * }
 * 
 * // app.module.ts
 * @Module({
 *   providers: [DatabaseService, EmailService, OrderService],
 * })
 * export class AppModule {}
 * 
 * // NestJS DI Container tự động:
 * // 1. Tạo DatabaseService instance
 * // 2. Tạo EmailService instance
 * // 3. Inject vào OrderService constructor
 * // 4. Singleton pattern (chỉ tạo 1 instance mỗi service)
 */

// ============================================================================
// 5️⃣ SCOPES (Lifetime quản lý)
// ============================================================================

/**
 * NestJS có 3 Scopes để quản lý lifetime của instance:
 */

/**
 * 1️⃣ SINGLETON (Default)
 *    - Tạo 1 instance duy nhất
 *    - Tái sử dụng cho tất cả requests
 *    - Nhanh nhất, tiết kiệm memory
 * 
 * @Injectable()
 * export class DatabaseService {
 *   // Tạo 1 instance khi app start
 *   // Dùng lại cho tất cả requests
 * }
 * 
 * ✅ Dùng khi: Service không có state riêng (DatabaseService, ConfigService)
 */

/**
 * 2️⃣ TRANSIENT
 *    - Tạo instance mới mỗi lần
 *    - Không shared giữa requests
 *    - Chậm, lãng phí memory
 * 
 * @Injectable({ scope: Scope.TRANSIENT })
 * export class RequestService {
 *   // Tạo instance mới mỗi khi inject
 * }
 * 
 * ✅ Dùng khi: Service có state riêng (RequestContext)
 */

/**
 * 3️⃣ REQUEST
 *    - Tạo instance mới mỗi request
 *    - Shared trong scope của 1 request
 *    - Medium speed, tiết kiệm memory
 * 
 * @Injectable({ scope: Scope.REQUEST })
 * export class RequestContextService {
 *   // Tạo instance mới mỗi HTTP request
 *   // Dùng lại trong scope của request đó
 * }
 * 
 * ✅ Dùng khi: Service có state riêng per request (CurrentUserService)
 */

// ============================================================================
// 6️⃣ INTERFACE vs CONCRETE CLASS
// ============================================================================

/**
 * ✅ BEST PRACTICE: Inject interfaces, không concrete classes
 * 
 * // payment-gateway.interface.ts
 * export interface IPaymentGateway {
 *   charge(amount: number): Promise<{ success: boolean }>;
 * }
 * 
 * // stripe.gateway.ts
 * @Injectable()
 * export class StripeGateway implements IPaymentGateway {
 *   async charge(amount: number): Promise<{ success: boolean }> {
 *     // Stripe logic
 *   }
 * }
 * 
 * // order.service.ts
 * @Injectable()
 * export class OrderService {
 *   // ✅ Depend on interface, không concrete class
 *   constructor(private paymentGateway: IPaymentGateway) {}
 * 
 *   async createOrder(dto: CreateOrderDto) {
 *     const result = await this.paymentGateway.charge(100);
 *     // ...
 *   }
 * }
 * 
 * // app.module.ts
 * @Module({
 *   providers: [
 *     OrderService,
 *     {
 *       provide: IPaymentGateway,
 *       useClass: StripeGateway, // ✅ Inject StripeGateway
 *     },
 *   ],
 * })
 * export class AppModule {}
 * 
 * ✅ BENEFIT:
 * - Muốn đổi sang PayPal? Chỉ cần thay useClass: PayPalGateway
 * - OrderService không cần sửa (FOLLOW SOLID Dependency Inversion)
 * - Dễ test (mock IPaymentGateway)
 */

// ============================================================================
// 7️⃣ VÍ DỤ THỰC TẾ: PROJECT CỦA BẠN
// ============================================================================

/**
 * ✅ APP.MODULE.TS:
 * 
 * @Module({
 *   controllers: [AppController],
 *   providers: [AppService],
 * })
 * export class AppModule {}
 * 
 * NestJS DI Container sẽ:
 * 1. Tạo AppService instance (Singleton)
 * 2. Inject vào AppController constructor
 */

/**
 * ✅ APP.CONTROLLER.TS:
 * 
 * @Controller()
 * export class AppController {
 *   constructor(private readonly appService: AppService) {
 *     // ✅ appService được inject bởi NestJS DI Container
 *   }
 * 
 *   @Get()
 *   getHello(): string {
 *     return this.appService.getHello();
 *   }
 * }
 */

/**
 * ✅ APP.SERVICE.TS:
 * 
 * @Injectable()
 * export class AppService {
 *   getHello(): string {
 *     return 'Hello World!';
 *   }
 * }
 * 
 * Flow:
 * 1. HTTP GET / request
 * 2. NestJS Router → AppController.getHello()
 * 3. AppController gọi this.appService.getHello()
 * 4. AppService trả về "Hello World!"
 * 
 * Tất cả dependencies được inject bởi DI Container!
 */

// ============================================================================
// 8️⃣ INJECTION TOKENS
// ============================================================================

/**
 * Đôi khi không thể inject bằng tên class (e.g., primitive values)
 * Dùng Injection Tokens
 */

/**
 * ❌ PROBLEM:
 * 
 * // config.ts
 * export const DATABASE_URL = 'postgresql://localhost:5432/db';
 * 
 * // order.service.ts
 * @Injectable()
 * export class OrderService {
 *   constructor(private dbUrl: string) {} // ❌ Không biết string nào
 * }
 */

/**
 * ✅ SOLUTION: Dùng Token
 * 
 * // config.ts
 * export const DATABASE_URL_TOKEN = 'DATABASE_URL';
 * export const DATABASE_URL = 'postgresql://localhost:5432/db';
 * 
 * // order.service.ts
 * @Injectable()
 * export class OrderService {
 *   constructor(
 *     @Inject(DATABASE_URL_TOKEN) private dbUrl: string
 *   ) {}
 * }
 * 
 * // app.module.ts
 * @Module({
 *   providers: [
 *     OrderService,
 *     {
 *       provide: DATABASE_URL_TOKEN,
 *       useValue: 'postgresql://localhost:5432/db',
 *     },
 *   ],
 * })
 * export class AppModule {}
 */

// ============================================================================
// 9️⃣ LAZY LOADING (Inject async values)
// ============================================================================

/**
 * ✅ useFactory: Inject giá trị được tính toán
 * 
 * // app.module.ts
 * @Module({
 *   providers: [
 *     {
 *       provide: 'CONFIG',
 *       useFactory: async () => {
 *         // Lấy config từ .env hoặc file
 *         const config = await loadConfig();
 *         return config;
 *       },
 *     },
 *   ],
 * })
 * export class AppModule {}
 */

// ============================================================================
// 📊 TÓMSÁCHUAT: Dependency Injection
// ============================================================================

/**
 * DEPENDENCY INJECTION là:
 * ✅ Cách inject dependencies vào class qua constructor
 * ✅ Thay vì class tự tạo dependencies
 * 
 * 3 CÁCH INJECT:
 * 1. Constructor Injection (phổ biến nhất)
 * 2. Property Injection
 * 3. Method Injection
 * 
 * LỢI ÍCH:
 * ✅ Loose coupling (giảm phụ thuộc)
 * ✅ Dễ test (mock dependencies)
 * ✅ Dễ swap implementations
 * ✅ Reusable services (Singleton)
 * ✅ Follow SOLID principles
 * 
 * DI CONTAINER (NestJS):
 * ✅ Quản lý instances
 * ✅ Tự động inject
 * ✅ Quản lý Scopes (Singleton, Transient, Request)
 * 
 * 3 SCOPES:
 * 1. SINGLETON (default) - 1 instance cho toàn app
 * 2. TRANSIENT - instance mới mỗi lần inject
 * 3. REQUEST - instance mới mỗi HTTP request
 * 
 * BEST PRACTICE:
 * ✅ Inject interfaces, không concrete classes
 * ✅ Sử dụng Constructor Injection
 * ✅ Follow SOLID Dependency Inversion Principle
 */

// ============================================================================
// 🔄 DEPENDENCY INJECTION vs SERVICE LOCATOR
// ============================================================================

/**
 * ❌ SERVICE LOCATOR PATTERN (Anti-pattern):
 * 
 * // service-locator.ts
 * export class ServiceLocator {
 *   private services: Map<string, any> = new Map();
 * 
 *   register(name: string, service: any) {
 *     this.services.set(name, service);
 *   }
 * 
 *   get(name: string) {
 *     return this.services.get(name);
 *   }
 * }
 * 
 * // order.service.ts
 * export class OrderService {
 *   async createOrder(dto: CreateOrderDto) {
 *     const db = ServiceLocator.get('DatabaseService'); // ❌ Service locator
 *     const email = ServiceLocator.get('EmailService');
 *     // ...
 *   }
 * }
 * 
 * ❌ PROBLEMS:
 * - Hidden dependencies (không rõ service dùng gì)
 * - Khó test (ServiceLocator là global)
 * - Khó trace (không biết service từ đâu)
 */

/**
 * ✅ DEPENDENCY INJECTION (Best practice):
 * 
 * @Injectable()
 * export class OrderService {
 *   constructor(
 *     private db: DatabaseService,
 *     private email: EmailService,
 *   ) {}
 * 
 *   async createOrder(dto: CreateOrderDto) {
 *     // ✅ Dependencies rõ ràng
 *     // ✅ Dễ test, trace
 *   }
 * }
 */

// ============================================================================
// 🎯 DEPENDENCY INJECTION TRONG PROJECT CỦA BẠN
// ============================================================================

/**
 * Project Clean Architecture của bạn áp dụng DI tốt:
 * 
 * 1️⃣ Guards (auth.guard.ts):
 *    - Dùng AuthGuard để inject vào routes
 *    - @UseGuards(AuthGuard)
 * 
 * 2️⃣ Pipes (validation.pipe.ts):
 *    - Dùng ValidationPipe để validate input
 *    - @Param('id', ValidationPipe)
 * 
 * 3️⃣ Interceptors (logging.interceptor.ts):
 *    - Dùng LoggingInterceptor để log requests
 *    - @UseInterceptors(LoggingInterceptor)
 * 
 * 4️⃣ Services (app.service.ts):
 *    - @Injectable() → markable for DI
 *    - Dùng ở controller
 * 
 * 5️⃣ Repositories:
 *    - @Injectable() → ở infrastructure layer
 *    - Inject vào services
 * 
 * ✅ RESULT:
 *    - Tất cả dependencies rõ ràng
 *    - Dễ bảo trì, test, mở rộng
 *    - Follow SOLID principles
 *    - Professional architecture
 */

export const DependencyInjection = `
Dependency Injection (DI) là cách inject dependencies vào class
qua constructor, thay vì class tự tạo.

BENEFIT:
✅ Loose coupling (giảm phụ thuộc)
✅ Dễ test (mock dependencies)
✅ Dễ swap implementations
✅ Reusable services
✅ Follow SOLID

NestJS DI Container tự động:
1. Tạo instances
2. Inject vào constructors
3. Quản lý Scopes (Singleton, Transient, Request)

Project của bạn sử dụng DI đầy đủ!
`;
