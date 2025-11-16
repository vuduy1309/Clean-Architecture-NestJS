/**
 * ============================================================================
 * HÌNH DUNG: NestJS vs Clean Architecture
 * ============================================================================
 * 
 * Cách so sánh dễ hiểu nhất:
 * 
 * NestJS: "Cách tổ chức INFRASTRUCTURE" (auth, validation, logging)
 * Clean Architecture: "Cách tổ chức BUSINESS LOGIC"
 */

// ============================================================================
// HÌNH DUY 1: JUST NestJS (cơ bản)
// ============================================================================

/**
 * Structure:
 * 
 * src/
 * ├── controllers/
 * │   ├── order.controller.ts          ← HTTP endpoints
 * │   ├── user.controller.ts
 * │   └── product.controller.ts
 * ├── services/
 * │   ├── order.service.ts             ← Business logic + Database queries
 * │   ├── user.service.ts
 * │   └── product.service.ts
 * ├── guards/
 * │   └── auth.guard.ts                ← Infrastructure
 * ├── pipes/
 * │   └── validation.pipe.ts           ← Infrastructure
 * ├── interceptors/
 * │   └── logging.interceptor.ts       ← Infrastructure
 * └── app.module.ts
 * 
 * Problem: Service chứa cả business logic + database logic
 * 
 * ❌ order.service.ts (100 dòng):
 *    - Tính giá (business logic)
 *    - SQL query (database logic)
 *    - Gửi email (external service)
 *    - Tất cả lẫn vào 1 file
 */

// ============================================================================
// HÌNH 2: NestJS + Clean Architecture
// ============================================================================

/**
 * Structure:
 * 
 * src/
 * ├── 📁 domain/                        ← Business rules (framework-independent)
 * │   ├── entities/
 * │   │   ├── order.entity.ts           ← Order struct
 * │   │   ├── product.entity.ts
 * │   │   └── user.entity.ts
 * │   ├── services/
 * │   │   ├── order-pricing.service.ts  ← Pure logic: calculate price
 * │   │   ├── inventory.service.ts      ← Pure logic: check stock
 * │   │   └── user-validation.service.ts← Pure logic: validate
 * │   └── errors/
 * │       ├── order-not-found.error.ts
 * │       ├── out-of-stock.error.ts
 * │       └── payment-failed.error.ts
 * │
 * ├── 📁 application/                   ← Orchestrate business logic
 * │   ├── usecases/
 * │   │   ├── create-order.usecase.ts   ← Use case: tạo order
 * │   │   ├── cancel-order.usecase.ts   ← Use case: hủy order
 * │   │   ├── create-user.usecase.ts
 * │   │   └── update-product.usecase.ts
 * │   └── dtos/
 * │       ├── create-order.dto.ts
 * │       └── create-user.dto.ts
 * │
 * ├── 📁 infrastructure/                ← Database, external services
 * │   ├── repositories/
 * │   │   ├── order.repository.ts       ← Database impl
 * │   │   ├── product.repository.ts
 * │   │   └── user.repository.ts
 * │   ├── services/
 * │   │   ├── email.service.ts          ← SMTP email impl
 * │   │   ├── payment.service.ts        ← Stripe payment impl
 * │   │   └── shipping.service.ts
 * │   └── adapters/
 * │       ├── typeorm.adapter.ts        ← Database adapter
 * │       └── stripe.adapter.ts         ← Payment adapter
 * │
 * ├── 📁 interface/                     ← HTTP layer
 * │   ├── controllers/
 * │   │   ├── order.controller.ts       ← Just HTTP handling
 * │   │   ├── user.controller.ts
 * │   │   └── product.controller.ts
 * │   └── presenters/
 * │       ├── order.presenter.ts
 * │       └── user.presenter.ts
 * │
 * ├── 📁 shared/                        ← Infrastructure (NestJS)
 * │   ├── guards/
 * │   │   └── auth.guard.ts
 * │   ├── pipes/
 * │   │   └── validation.pipe.ts
 * │   ├── interceptors/
 * │   │   └── logging.interceptor.ts
 * │   └── filters/
 * │       └── exception.filter.ts
 * │
 * └── app.module.ts
 * 
 * 
 * ✅ Tách biệt rõ ràng:
 * - domain/: Pure business logic (không biết NestJS, database)
 * - application/: Use cases (orchestrate domain services)
 * - infrastructure/: Database, external APIs
 * - interface/: HTTP layer (NestJS)
 * - shared/: NestJS infrastructure (Guard, Pipe, v.v.)
 */

// ============================================================================
// HÌNH 3: DATA FLOW
// ============================================================================

/**
 * ❌ NestJS cơ bản:
 * ──────────────
 * 
 * HTTP Request
 *   ↓
 * AuthGuard (infrastructure)
 *   ↓
 * ValidationPipe (infrastructure)
 *   ↓
 * Controller
 *   ↓
 * Service (tất cả logic: business + database + email)  ← ❌ LẪN LỘN
 *   ↓
 * Database / Email Service
 *   ↓
 * HTTP Response
 * 
 * Problem: Service = Business logic + Database queries (khó test, khó tái sử dụng)
 * 
 * 
 * ✅ Clean Architecture:
 * ────────────────────
 * 
 * HTTP Request
 *   ↓
 * AuthGuard (infrastructure)
 *   ↓
 * ValidationPipe (infrastructure)
 *   ↓
 * Controller (nhận request)
 *   ↓
 * UseCase (orchestrate: gọi domain services)
 *   ↓
 * Domain Services (tính toán, validate - pure logic)
 *   ↓
 * Repository/Services (database, email - infrastructure)
 *   ↓
 * HTTP Response (via Presenter)
 * 
 * Benefit: Tách biệt rõ ràng → dễ test, dễ maintain, dễ scale
 */

// ============================================================================
// EXAMPLE: Tạo order từ 3 góc nhìn
// ============================================================================

// ❌ CÁCH 1: Just NestJS (lẫn lộn)
/*
@Injectable()
export class OrderService {
  constructor(private db: Database) {}

  async createOrder(userId: string, productId: string, quantity: number) {
    // 🔴 Business logic lẫn trong service
    
    // 1. Query database để lấy product (business logic + database)
    const product = await this.db.query('SELECT * FROM products WHERE id = ?', [productId]);
    
    // 2. Kiểm tra inventory (business logic)
    if (product.stock < quantity) {
      throw new Error('Out of stock');
    }
    
    // 3. Tính giá (business logic + database access)
    const user = await this.db.query('SELECT * FROM users WHERE id = ?', [userId]);
    let price = product.price * quantity;
    if (user.loyaltyPoints > 100) {
      price *= 0.9;
    }
    
    // 4. Ghi vào database (database logic)
    const order = await this.db.query(
      'INSERT INTO orders (...) VALUES (...)',
      [userId, productId, quantity, price]
    );
    
    return order;
  }
}

❌ Problem:
- Service chứa 100+ dòng
- Business logic (tính giá) = Database queries (lẫn lộn)
- Khó test "tính giá" (phải mock database)
- Khó tái sử dụng (tính giá logic bị khoá trong service)
- Khó thay đổi (muốn đổi database → phải sửa service)
*/

// ✅ CÁCH 2: Clean Architecture (tách biệt)

/**
 * Layer 1: DOMAIN (pure business logic)
 * 
 * // domain/services/order-pricing.service.ts
 * export class OrderPricingService {
 *   calculatePrice(
 *     basePrice: number,
 *     quantity: number,
 *     loyaltyPoints: number
 *   ): number {
 *     // ✅ Pure logic, không phụ thuộc vào database
 *     let total = basePrice * quantity;
 *     if (loyaltyPoints > 100) {
 *       total *= 0.9;
 *     }
 *     return total;
 *   }
 * }
 * 
 * ✅ Benefit: Dễ test (không cần mock)
 * test('calculatePrice', () => {
 *   const service = new OrderPricingService();
 *   const price = service.calculatePrice(100, 2, 200);
 *   expect(price).toBe(180); // (100*2) * 0.9
 * });
 */

/**
 * Layer 2: APPLICATION (use case)
 * 
 * // application/usecases/create-order.usecase.ts
 * export class CreateOrderUseCase {
 *   constructor(
 *     private orderRepository: IOrderRepository,
 *     private pricingService: OrderPricingService,
 *   ) {}
 * 
 *   async execute(input: CreateOrderInput) {
 *     // 1. Business logic via domain service
 *     const price = this.pricingService.calculatePrice(
 *       input.basePrice,
 *       input.quantity,
 *       input.loyaltyPoints
 *     );
 *     
 *     // 2. Infrastructure via repository (interface)
 *     const order = await this.orderRepository.create({
 *       userId: input.userId,
 *       productId: input.productId,
 *       quantity: input.quantity,
 *       price,
 *     });
 *     
 *     return order;
 *   }
 * }
 * 
 * ✅ Benefit: Dễ test (mock interface)
 * test('CreateOrderUseCase', async () => {
 *   const mockRepository: IOrderRepository = {
 *     create: async (order) => ({ ...order, id: '1' }),
 *   };
 *   const useCase = new CreateOrderUseCase(
 *     mockRepository,
 *     new OrderPricingService()
 *   );
 *   const result = await useCase.execute({ ... });
 *   expect(result.id).toBe('1');
 * });
 */

/**
 * Layer 3: INFRASTRUCTURE (database)
 * 
 * // infrastructure/repositories/order.repository.ts
 * @Injectable()
 * export class OrderRepository implements IOrderRepository {
 *   constructor(private db: Database) {}
 * 
 *   async create(order: Order) {
 *     return this.db.query(
 *       'INSERT INTO orders (...) VALUES (...)',
 *       [order.userId, order.productId, ...]
 *     );
 *   }
 * }
 * 
 * ✅ Benefit: Dễ swap (thay database)
 * // Có thể tạo MockRepository, SqlRepository, MongoRepository
 */

/**
 * Layer 4: INTERFACE (HTTP)
 * 
 * // interface/controllers/order.controller.ts
 * @Controller('orders')
 * export class OrderController {
 *   constructor(private createOrderUseCase: CreateOrderUseCase) {}
 * 
 *   @Post()
 *   async create(@Body() dto: CreateOrderDto) {
 *     const result = await this.createOrderUseCase.execute({
 *       userId: dto.userId,
 *       productId: dto.productId,
 *       quantity: dto.quantity,
 *       basePrice: dto.basePrice,
 *       loyaltyPoints: dto.loyaltyPoints,
 *     });
 *     return result;
 *   }
 * }
 * 
 * ✅ Benefit: Controller chỉ 5 dòng (đơn giản)
 */

// ============================================================================
// BẢNG SO SÁNH: 3 LAYERS
// ============================================================================

/*
┌─────────────────┬──────────────────────┬──────────────────────┐
│ Layer           │ NestJS cơ bản        │ Clean Architecture   │
├─────────────────┼──────────────────────┼──────────────────────┤
│ Business Logic  │ ❌ Trong Service     │ ✅ Domain Layer      │
│                 │                      │                      │
│ Orchestration   │ ❌ Trong Service     │ ✅ UseCase Layer     │
│                 │    (lẫn)            │    (riêng)          │
│                 │                      │                      │
│ Database        │ ❌ Trong Service     │ ✅ Repository Layer  │
│                 │    (tight coupling) │    (interface)      │
│                 │                      │                      │
│ HTTP            │ ✅ Controller        │ ✅ Controller        │
│                 │                      │                      │
│ Testability     │ ❌ Khó (lẫn lộn)     │ ✅ Dễ (tách biệt)   │
│                 │                      │                      │
│ Reusability     │ ❌ Khó (service      │ ✅ Dễ (service ở    │
│                 │    khoá logic)       │    layer riêng)      │
│                 │                      │                      │
│ Maintainability │ ⚠️ Trung bình        │ ✅ Rất tốt           │
│                 │   (khi grow)         │                      │
└─────────────────┴──────────────────────┴──────────────────────┘
*/

export const ArchitectureComparison = `
NestJS: Framework + Infrastructure patterns (Guard, Pipe, DI)
Clean Architecture: Code organization + Design principles

NestJS xử lý: "Làm sao infrastructure sạch?"
              → Guard, Pipe, Interceptor

Clean Architecture xử lý: "Làm sao business logic sạch?"
                         → Domain, Application, Infrastructure layers

Cả hai cùng nhau:
NestJS (framework level) + Clean Architecture (code organization level) = Perfect!
`;
