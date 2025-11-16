/**
 * ============================================================================
 * CÁC LOẠI CLEAN ARCHITECTURE
 * ============================================================================
 * 
 * Có nhiều cách tổ chức code được gọi là "Clean Architecture".
 * Mỗi cái có ưu/nhược điểm và phù hợp với các tình huống khác nhau.
 */

// ============================================================================
// 1️⃣ LAYERED ARCHITECTURE (3 tầng - NestJS default)
// ============================================================================

/**
 * Structure:
 * ┌─────────────────────────────┐
 * │   PRESENTATION (HTTP)       │  ← Controller (nhận/trả request)
 * ├─────────────────────────────┤
 * │   BUSINESS LOGIC            │  ← Service (tính toán, validate)
 * ├─────────────────────────────┤
 * │   DATA ACCESS (Database)    │  ← Repository/DAO
 * └─────────────────────────────┘
 * 
 * Dependency direction: ↓ (một chiều)
 * Controller → Service → Database
 * 
 * Request flow:
 * HTTP → Controller → Service → DB → Response
 * 
 * VÍ DỤ:
 * 
 * src/
 * ├── controllers/
 * │   └── order.controller.ts     ← HTTP layer
 * ├── services/
 * │   └── order.service.ts        ← Business logic
 * ├── entities/
 * │   └── order.entity.ts         ← Data model
 * └── repositories/
 *     └── order.repository.ts     ← Database access
 */

/*
PROS:
✅ Đơn giản, dễ hiểu
✅ Dễ setup (NestJS default)
✅ Tốt cho CRUD/MVP

CONS:
❌ Business logic lẫn vào Service
❌ Tight coupling với database
❌ Khó test (phải mock DB)
❌ Khó scale (khi project grow)

DÙNG KHI:
- MVP, CRUD simple
- Team nhỏ (< 5 người)
- Project không quá phức tạp
- Timeline gắt (gần deadline)

VÍ DỤ: Todo app, Blog simple, CRUD API

CODE EXAMPLE:
// order.service.ts
@Injectable()
export class OrderService {
  constructor(private db: Database) {}
  
  async createOrder(userId: string, productId: string) {
    // ❌ Business logic + Database query lẫn
    const product = await this.db.query('SELECT * FROM products WHERE id = ?', [productId]);
    const price = product.price * 1.1; // 10% markup
    
    const order = await this.db.query(
      'INSERT INTO orders (...) VALUES (...)',
      [userId, productId, price]
    );
    return order;
  }
}

PROBLEM: Khó test, khó tái sử dụng logic "tính giá"
*/

// ============================================================================
// 2️⃣ CLEAN ARCHITECTURE (4-5 tầng - file của bạn)
// ============================================================================

/**
 * Structure:
 * ┌────────────────────────────────────┐
 * │  INTERFACE LAYER (HTTP)            │  ← Controller, Presenter
 * ├────────────────────────────────────┤
 * │  APPLICATION LAYER (Use Cases)     │  ← Orchestrate business logic
 * ├────────────────────────────────────┤
 * │  DOMAIN LAYER (Entities, Services) │  ← Pure business logic
 * ├────────────────────────────────────┤
 * │  INFRASTRUCTURE LAYER (DB, APIs)   │  ← Repository, External services
 * └────────────────────────────────────┘
 * 
 * Dependency direction: → (theo chiều mũi tên)
 * Interface → Application → Domain ← Infrastructure
 * (Infrastructure phụ thuộc vào Domain, không ngược lại)
 * 
 * Request flow:
 * HTTP → Controller → UseCase → DomainService → Repository → DB → Response
 * 
 * VÍ DỤ:
 * 
 * src/
 * ├── domain/                   ← Pure business logic (framework-independent)
 * │   ├── entities/
 * │   ├── services/
 * │   └── errors/
 * ├── application/              ← Orchestrate use cases
 * │   ├── usecases/
 * │   └── dtos/
 * ├── infrastructure/           ← Database & external services
 * │   ├── repositories/
 * │   └── services/
 * └── interface/                ← HTTP layer
 *     └── controllers/
 */

/*
PROS:
✅ Business logic không phụ thuộc infrastructure
✅ Dễ test (mock interfaces)
✅ Dễ swap database/API
✅ Dễ tái sử dụng domain logic
✅ Dễ scale (structure rõ ràng)

CONS:
⚠️ Phức tạp hơn (nhiều file)
⚠️ Overhead cho dự án nhỏ
⚠️ Steep learning curve

DÙNG KHI:
- Business logic phức tạp
- Team 5-20 người
- Project medium-large
- Cần high test coverage

VÍ DỤ: E-commerce, SaaS, Finance app

CODE EXAMPLE:
// domain/services/order-pricing.service.ts
export class OrderPricingService {
  // ✅ Pure logic, không biết về database
  calculatePrice(basePrice: number, markupPercent: number): number {
    return basePrice * (1 + markupPercent / 100);
  }
}

// application/usecases/create-order.usecase.ts
export class CreateOrderUseCase {
  constructor(
    private repository: IOrderRepository,
    private pricing: OrderPricingService
  ) {}
  
  async execute(input: CreateOrderInput) {
    const product = await this.repository.findProduct(input.productId);
    const price = this.pricing.calculatePrice(product.price, 10);
    const order = await this.repository.createOrder({
      userId: input.userId,
      productId: input.productId,
      price
    });
    return order;
  }
}

// interface/controllers/order.controller.ts
@Controller('orders')
export class OrderController {
  constructor(private useCase: CreateOrderUseCase) {}
  
  @Post()
  async create(@Body() dto: CreateOrderDto) {
    return this.useCase.execute(dto);
  }
}

BENEFIT: Dễ test OrderPricingService (không cần mock), dễ tái sử dụng ở nhiều usecase
*/

// ============================================================================
// 3️⃣ HEXAGONAL ARCHITECTURE (Ports & Adapters)
// ============================================================================

/**
 * Structure:
 * 
 *           ┌─────────────────────────────┐
 *           │  CORE (Application Logic)   │
 *           │  (Entities, Use Cases)      │
 *           └─────────────────────────────┘
 *                    ↑           ↑
 *                    │           │
 *             ┌──────┴───────────┴──────┐
 *             │                         │
 *        PORTS (Interfaces)        ADAPTERS (Implementations)
 *             │                         │
 *     - IRepository         - MySQLRepository
 *     - IEmailService       - SmtpEmailService
 *     - IPaymentGateway     - StripePaymentGateway
 * 
 * Core không biết về Database/Email cụ thể
 * Chỉ biết interfaces (Ports)
 * Các implementation (Adapters) có thể swap
 * 
 * VÍ DỤ:
 * 
 * src/
 * ├── core/                    ← Application logic
 * │   ├── usecases/
 * │   └── entities/
 * ├── ports/                   ← Interfaces (contracts)
 * │   ├── repository.port.ts
 * │   ├── email.port.ts
 * │   └── payment.port.ts
 * └── adapters/                ← Implementations
 *     ├── mysql.adapter.ts
 *     ├── smtp.adapter.ts
 *     ├── stripe.adapter.ts
 *     └── memory.adapter.ts    ← For testing
 */

/*
PROS:
✅ Rất dễ swap implementations
✅ Multiple implementations dễ dàng
✅ Perfect cho plugin-based systems
✅ Dễ test (memory adapter)

CONS:
⚠️ Phức tạp hơn Clean Architecture
⚠️ Nhiều adapter files
⚠️ Overhead cho project nhỏ

DÙNG KHI:
- Plugin-based systems
- Multiple payment gateways
- Multiple database support
- Frequent tech stack changes

VÍ DỤ: CMS, Payment processors, Multi-database apps

DIFFERENCE từ Clean Architecture:
- Clean Arch: Layers (Domain → Application → Infrastructure)
- Hexagonal: Core + Ports + Adapters (có thể multiple adapters cùng lúc)
*/

// ============================================================================
// 4️⃣ DOMAIN-DRIVEN DESIGN (DDD) - Enterprise
// ============================================================================

/**
 * Structure (phức tạp):
 * 
 * STRATEGIC DESIGN:
 * ├── Bounded Contexts (Microservices-like separation)
 * │   ├── Order Context
 * │   ├── Payment Context
 * │   ├── Inventory Context
 * │   └── Shipping Context
 * └── Ubiquitous Language (Domain vocabulary)
 * 
 * TACTICAL DESIGN:
 * ├── Aggregates (Entity groups with root)
 * ├── Value Objects (Immutable objects)
 * ├── Domain Services (Cross-aggregate logic)
 * ├── Repositories (Aggregate persistence)
 * ├── Domain Events (State changes)
 * └── Specifications (Complex queries)
 * 
 * VÍ DỤ:
 * 
 * src/
 * ├── order-bounded-context/       ← Separate domain
 * │   ├── domain/
 * │   │   ├── aggregates/
 * │   │   │   └── order.aggregate.ts
 * │   │   ├── value-objects/
 * │   │   │   ├── money.value-object.ts
 * │   │   │   └── address.value-object.ts
 * │   │   ├── domain-events/
 * │   │   │   ├── order-created.event.ts
 * │   │   │   └── order-shipped.event.ts
 * │   │   └── repositories/
 * │   ├── application/
 * │   └── infrastructure/
 * │
 * ├── payment-bounded-context/     ← Separate domain
 * │   ├── domain/
 * │   └── ...
 * │
 * └── shared/                       ← Shared language
 *     └── domain-events/
 */

/*
PROS:
✅ Perfect cho enterprise applications
✅ Multiple teams có thể work independently
✅ Very flexible (mỗi context riêng architecture)
✅ Event-driven (loose coupling)

CONS:
❌ Rất phức tạp (steep learning curve)
❌ Overhead lớn cho project nhỏ
❌ Cần domain expertise
❌ Long-term investment

DÙNG KHI:
- Large enterprise systems (1000+ developers)
- Multiple independent teams
- Complex domain logic
- Bounded contexts rõ ràng

VÍ DỤ: Netflix, Amazon, Uber (backend)

CONCEPTS:
- Aggregate: Order + OrderItem (grouped)
- Value Object: Money (100 USD != 200 USD)
- Domain Event: OrderCreated (published to other contexts)
- Ubiquitous Language: Team nói "Aggregate", không nói "Entity"
*/

// ============================================================================
// 5️⃣ CQRS (Command Query Responsibility Segregation)
// ============================================================================

/**
 * Tách biệt Command (write) và Query (read)
 * 
 * Traditional:
 * Request → Service → Database → Response
 * (write và read cùng model)
 * 
 * CQRS:
 * ┌─── WRITE SIDE (Command) ──┐    ┌─── READ SIDE (Query) ──┐
 * │ POST /orders              │    │ GET /orders            │
 * │ → Command Handler         │    │ → Query Handler        │
 * │ → Event Store             │    │ → Read Model (cached)  │
 * │ → Domain Event Published  │    │ (optimized for reads)  │
 * └─────────────────────────────┘    └────────────────────────┘
 *           ↓ (async)
 *    Event Handler updates Read Model
 * 
 * VÍ DỤ:
 * 
 * src/
 * ├── commands/              ← Write operations
 * │   ├── create-order.command.ts
 * │   └── cancel-order.command.ts
 * ├── queries/               ← Read operations
 * │   ├── get-orders.query.ts
 * │   └── get-order-stats.query.ts
 * ├── events/                ← Domain events
 * │   ├── order-created.event.ts
 * │   └── order-cancelled.event.ts
 * └── handlers/              ← Command/Query handlers
 *     ├── create-order.handler.ts
 *     └── order-created.handler.ts
 */

/*
PROS:
✅ Optimize reads independently
✅ Event sourcing friendly
✅ Perfect cho high-traffic systems
✅ Easy to scale (separate read/write)

CONS:
❌ Very complex
❌ Eventually consistent (not immediate)
❌ Hard to debug
❌ Overkill for most projects

DÙNG KHI:
- High-traffic systems (1M+ requests/day)
- Event sourcing needed
- Complex reporting
- Microservices architecture

VÍ DỤ: Analytics dashboards, Real-time notifications, Event log systems

FLOW:
1. User POST /orders (Command)
2. CommandHandler validates → save to event store
3. Event: "OrderCreated" published
4. EventHandler updates ReadModel (materialized view)
5. User GET /orders (Query) → reads from ReadModel (fast)
*/

// ============================================================================
// 6️⃣ MICROSERVICES ARCHITECTURE
// ============================================================================

/**
 * Tách ứng dụng thành nhiều services độc lập
 * 
 * Monolith:
 * ┌────────────────────────┐
 * │ Controller             │
 * │ Service (Order)        │
 * │ Service (Payment)      │
 * │ Service (Shipping)     │
 * │ Database (shared)      │
 * └────────────────────────┘
 * 
 * Microservices:
 * ┌──────────────┐  ┌──────────────┐  ┌──────────────┐
 * │ Order        │  │ Payment      │  │ Shipping     │
 * │ Service      │  │ Service      │  │ Service      │
 * │ (NestJS)     │  │ (NestJS)     │  │ (NestJS)     │
 * │ DB (SQL)     │  │ DB (SQL)     │  │ DB (NoSQL)   │
 * └──────────────┘  └──────────────┘  └──────────────┘
 *      ↓                  ↓                  ↓
 *   API Gateway connects services
 * 
 * VÍ DỤ:
 * 
 * services/
 * ├── order-service/        ← Separate service
 * │   ├── src/
 * │   └── package.json
 * ├── payment-service/      ← Separate service
 * │   ├── src/
 * │   └── package.json
 * ├── shipping-service/     ← Separate service
 * │   ├── src/
 * │   └── package.json
 * └── api-gateway/
 *     └── Routes to services
 */

/*
PROS:
✅ Independent scaling
✅ Independent deployment
✅ Technology diversity
✅ Team autonomy

CONS:
❌ Very complex
❌ Network latency
❌ Distributed debugging
❌ Data consistency issues
❌ Operational overhead

DÙNG KHI:
- Large teams (50+)
- Services scale differently
- Different tech stacks needed
- Continuous deployment needed

VÍ DỤ: Netflix, Uber, Amazon (họ có 1000+ microservices)

TRADEOFF:
Monolith: Simple, slow to scale
Microservices: Complex, fast to scale
*/

// ============================================================================
// 📊 SO SÁNH TẤT CẢ CÁC ARCHITECTURE
// ============================================================================

/*
┌──────────────────┬──────────┬──────────┬───────────┬────────────┐
│ Architecture     │ Layers   │ Phức tạp │ Dễ test   │ Dễ scale   │
├──────────────────┼──────────┼──────────┼───────────┼────────────┤
│ Layered (NestJS) │ 3        │ ⭐       │ ⭐⭐      │ ⭐         │
│ default          │          │          │           │            │
├──────────────────┼──────────┼──────────┼───────────┼────────────┤
│ Clean Arch       │ 4-5      │ ⭐⭐⭐    │ ⭐⭐⭐⭐   │ ⭐⭐⭐⭐   │
│ (your file)      │          │          │           │            │
├──────────────────┼──────────┼──────────┼───────────┼────────────┤
│ Hexagonal        │ 3-4      │ ⭐⭐⭐    │ ⭐⭐⭐⭐   │ ⭐⭐⭐     │
│ Ports & Adapters │          │          │           │            │
├──────────────────┼──────────┼──────────┼───────────┼────────────┤
│ DDD              │ 5+       │ ⭐⭐⭐⭐  │ ⭐⭐⭐⭐⭐  │ ⭐⭐⭐⭐⭐  │
│ (Enterprise)     │          │          │           │            │
├──────────────────┼──────────┼──────────┼───────────┼────────────┤
│ CQRS             │ 5+       │ ⭐⭐⭐⭐⭐ │ ⭐⭐⭐⭐   │ ⭐⭐⭐⭐⭐  │
│                  │          │          │           │            │
├──────────────────┼──────────┼──────────┼───────────┼────────────┤
│ Microservices    │ 5+       │ ⭐⭐⭐⭐⭐ │ ⭐⭐⭐⭐   │ ⭐⭐⭐⭐⭐  │
│                  │          │          │           │            │
└──────────────────┴──────────┴──────────┴───────────┴────────────┘

Team size progression:
1-5 people     → Layered (NestJS default)
5-20 people    → Clean Architecture
20-50 people   → Clean + DDD
50+ people     → DDD + Microservices + CQRS

Complexity progression:
Small project  → Layered
Medium project → Clean Architecture
Large project  → DDD
Enterprise     → Microservices + CQRS + DDD
*/

// ============================================================================
// 🎯 DECISION TREE: CHỌN KIẾN TRÚC NÀO?
// ============================================================================

/*
START
  ↓
1. Project size?
  ├─→ MVP / < 10 endpoints / CRUD → LAYERED (NestJS default) ✅
  │
  ├─→ Small project (20-50 endpoints) → Layered ✅
  │
  └─→ Medium+ (100+ endpoints, complex logic)
      ↓
2. Business logic complexity?
  ├─→ Simple CRUD → LAYERED is OK
  │
  └─→ Complex (many rules, domain logic)
      ↓
3. Team size?
  ├─→ 1-5 people → CLEAN ARCHITECTURE ✅
  │   (Easy to maintain, good for testing)
  │
  ├─→ 5-20 people, multiple domains
  │   → DDD + CLEAN ARCHITECTURE ✅
  │   (Each domain has own context)
  │
  ├─→ 20-50+ people, high traffic
  │   → MICROSERVICES + CQRS + DDD ✅
  │   (Separate teams, independent scaling)
  │
  └─→ Multiple payment gateways, DB types
      → HEXAGONAL ARCHITECTURE ✅
      (Easy to swap adapters)

4. Non-functional requirements?
  ├─→ High traffic (1M+ req/day)
  │   → CQRS + Microservices
  │
  ├─→ Event sourcing needed
  │   → DDD + Event Store + CQRS
  │
  ├─→ Real-time updates
  │   → Event-driven + WebSockets
  │
  └─→ Simple API
      → Layered is enough

5. Deployment?
  ├─→ Single server
  │   → Layered or Clean Architecture
  │
  ├─→ Multiple services
  │   → Microservices (API Gateway)
  │
  └─→ Serverless
      → Layered (keep simple)
*/

// ============================================================================
// 🏆 RECOMMENDATION FOR NESTJS
// ============================================================================

/*
FOR MOST PROJECTS, USE CLEAN ARCHITECTURE + NestJS:

Why?
✅ Sweet spot: Not too complex, not too simple
✅ Testable (mock domain services)
✅ Scalable (organize by features/domains)
✅ Team-friendly (clear structure)
✅ Long-term maintainability

Structure (RECOMMENDED):
src/
├── domain/                    ← Pure business logic
│   ├── entities/              (Order, Product)
│   ├── services/              (OrderPricing, InventoryCheck)
│   ├── repositories/          (interfaces only)
│   └── exceptions/
├── application/               ← Use cases (orchestration)
│   ├── usecases/              (CreateOrder, CancelOrder)
│   ├── dtos/                  (CreateOrderDto, UpdateOrderDto)
│   └── mappers/
├── infrastructure/            ← Database, external services
│   ├── repositories/          (implementations)
│   ├── services/              (Email, Payment, etc.)
│   └── adapters/
├── interface/                 ← HTTP layer
│   ├── controllers/
│   └── presenters/
├── shared/                    ← NestJS infrastructure
│   ├── guards/
│   ├── pipes/
│   ├── interceptors/
│   └── filters/
└── app.module.ts

Layers dependency:
Interface → Application → Domain ← Infrastructure
(Domain không phụ thuộc vào bất kỳ cái khác)

When to go further:
- CQRS: Khi có read-heavy operations
- DDD: Khi domain logic cực phức tạp
- Microservices: Khi scale không còn chứa trong 1 instance
*/

export const ArchitectureTypes = `
LOẠI KIẾN TRÚC (từ đơn giản → phức tạp):

1. LAYERED (NestJS default)
   Controller → Service → Database
   ✅ Simple | ❌ Not scalable

2. CLEAN ARCHITECTURE (file của bạn)
   Controller → UseCase → Domain ← Repository
   ✅ Balanced | ✅ Testable | ✅ Scalable

3. HEXAGONAL (Ports & Adapters)
   Core + Ports + Adapters
   ✅ Very flexible | ❌ Overhead

4. DDD (Domain-Driven Design)
   Bounded Contexts + Aggregates + Value Objects
   ✅ Enterprise | ❌ Very complex

5. CQRS (Command Query Segregation)
   Write Side ≠ Read Side
   ✅ High-traffic | ❌ Eventually consistent

6. MICROSERVICES
   Multiple independent services
   ✅ Independent scaling | ❌ Complex ops

RECOMMENDATION: Use Clean Architecture + NestJS for most projects
`;
