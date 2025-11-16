/**
 * ============================================================================
 * NESTJS DEFAULT vs ALTERNATIVES
 * ============================================================================
 * 
 * 1. NestJS default architecture là gì?
 * 2. So sánh với Clean Architecture
 * 3. So sánh với DDD
 * 4. Khi nào dùng cái nào?
 */

// ============================================================================
// 1️⃣ NESTJS DEFAULT (Layered 3 tầng)
// ============================================================================

/**
 * Structure:
 * 
 * src/
 * ├── controllers/          ← HTTP layer
 * │   ├── order.controller.ts
 * │   └── user.controller.ts
 * ├── services/             ← Business logic + Database
 * │   ├── order.service.ts
 * │   └── user.service.ts
 * └── app.module.ts
 * 
 * Data flow:
 * HTTP Request
 *   ↓
 * Controller (nhận request)
 *   ↓
 * Service (tính toán + query database)
 *   ↓
 * Database
 *   ↓
 * HTTP Response
 */

/*
VÍ DỤ CODE:

// order.controller.ts
@Controller('orders')
export class OrderController {
  constructor(private orderService: OrderService) {}
  
  @Post()
  async create(@Body() dto: CreateOrderDto) {
    return this.orderService.createOrder(dto);
  }
}

// order.service.ts
@Injectable()
export class OrderService {
  constructor(private db: Database) {}
  
  async createOrder(dto: CreateOrderDto) {
    // ❌ Business logic + Database lẫn vào 1 chỗ
    
    // Query database
    const product = await this.db.query(
      'SELECT * FROM products WHERE id = ?',
      [dto.productId]
    );
    
    // Business logic
    if (product.stock < dto.quantity) {
      throw new Error('Out of stock');
    }
    
    const totalPrice = product.price * dto.quantity;
    if (dto.loyaltyPoints > 100) {
      totalPrice *= 0.9; // 10% discount
    }
    
    // Query database
    const order = await this.db.query(
      'INSERT INTO orders (...) VALUES (...)',
      [dto.userId, dto.productId, totalPrice]
    );
    
    return order;
  }
}

PROS:
✅ Simple (only 2 files)
✅ Fast to code (no overhead)
✅ Easy to understand (everyone gets it)
✅ Perfect for CRUD/MVP

CONS:
❌ Service gets bloated (100+ lines quickly)
❌ Business logic tight coupled to database
❌ Hard to test (must mock database)
❌ Hard to reuse logic (logic locked in service)
❌ Not scalable (when project grows)

DÙNG KHI:
✅ MVP
✅ CRUD simple
✅ Team < 5 people
✅ Project lifetime < 1 year
✅ No complex business logic

KHÔNG DÙNG KHI:
❌ Complex domain logic
❌ Need high test coverage
❌ Multiple teams
❌ Long-term project
*/

// ============================================================================
// 2️⃣ CLEAN ARCHITECTURE (4-5 tầng)
// ============================================================================

/**
 * Structure (file của bạn - WHY_CLEAN_ARCHITECTURE.ts):
 * 
 * src/
 * ├── domain/                        ← Pure business logic
 * │   ├── entities/
 * │   │   └── order.entity.ts
 * │   ├── services/
 * │   │   └── order-pricing.service.ts
 * │   └── errors/
 * │       └── order-not-found.error.ts
 * ├── application/                   ← Use cases (orchestration)
 * │   ├── usecases/
 * │   │   └── create-order.usecase.ts
 * │   └── dtos/
 * │       └── create-order.dto.ts
 * ├── infrastructure/                ← Database & external services
 * │   ├── repositories/
 * │   │   └── order.repository.ts
 * │   └── services/
 * │       └── email.service.ts
 * ├── interface/                     ← HTTP layer
 * │   └── controllers/
 * │       └── order.controller.ts
 * └── app.module.ts
 * 
 * Data flow:
 * HTTP Request
 *   ↓
 * Controller (nhận request)
 *   ↓
 * UseCase (orchestrate business logic)
 *   ↓
 * Domain Service (pure logic: tính giá, validate)
 *   ↓
 * Repository (access database via interface)
 *   ↓
 * Database
 *   ↓
 * HTTP Response
 */

/*
VÍ DỤ CODE:

// domain/entities/order.entity.ts
export interface Order {
  id: string;
  userId: string;
  productId: string;
  totalPrice: number;
}

// domain/services/order-pricing.service.ts
@Injectable()
export class OrderPricingService {
  // ✅ Pure logic (không biết về database)
  calculatePrice(
    basePrice: number,
    quantity: number,
    loyaltyPoints: number
  ): number {
    let total = basePrice * quantity;
    if (loyaltyPoints > 100) {
      total *= 0.9; // 10% discount
    }
    return total;
  }
}

// infrastructure/repositories/order.repository.ts
@Injectable()
export class OrderRepository {
  constructor(private db: Database) {}
  
  async findProduct(id: string) {
    return this.db.query('SELECT * FROM products WHERE id = ?', [id]);
  }
  
  async createOrder(order: Order) {
    return this.db.query('INSERT INTO orders (...) VALUES (...)', [
      order.userId,
      order.productId,
      order.totalPrice,
    ]);
  }
}

// application/usecases/create-order.usecase.ts
@Injectable()
export class CreateOrderUseCase {
  constructor(
    private repository: OrderRepository,
    private pricing: OrderPricingService,
  ) {}
  
  async execute(input: CreateOrderInput): Promise<Order> {
    // Orchestrate business logic
    const product = await this.repository.findProduct(input.productId);
    
    if (product.stock < input.quantity) {
      throw new OutOfStockError();
    }
    
    const totalPrice = this.pricing.calculatePrice(
      product.price,
      input.quantity,
      input.loyaltyPoints,
    );
    
    const order = await this.repository.createOrder({
      userId: input.userId,
      productId: input.productId,
      totalPrice,
    });
    
    return order;
  }
}

// interface/controllers/order.controller.ts
@Controller('orders')
export class OrderController {
  constructor(private createOrderUseCase: CreateOrderUseCase) {}
  
  @Post()
  async create(@Body() dto: CreateOrderDto) {
    return this.createOrderUseCase.execute(dto);
  }
}

PROS:
✅ Business logic separated from infrastructure
✅ Easy to test (mock interfaces)
✅ Easy to reuse (services in multiple places)
✅ Easy to change (swap repository implementation)
✅ Scalable (clear structure)

CONS:
⚠️ More files (5+ vs 2)
⚠️ More complexity (learning curve)
⚠️ Overhead for simple CRUD
⚠️ Takes longer to code initially

DÙNG KHI:
✅ Business logic phức tạp
✅ Team 5-20 people
✅ Need high test coverage
✅ Long-term project (3+ years)
✅ Frequent requirement changes

KHÔNG DÙNG KHI:
❌ Simple CRUD
❌ MVP (short timeline)
❌ Team < 3 people
❌ No complex domain
*/

// ============================================================================
// 3️⃣ DDD (Domain-Driven Design) - Enterprise
// ============================================================================

/**
 * Structure (phức tạp):
 * 
 * src/
 * ├── order-bounded-context/         ← Separate domain
 * │   ├── domain/
 * │   │   ├── aggregates/
 * │   │   │   ├── order.aggregate.ts  ← Root entity
 * │   │   │   └── order-item.entity.ts ← Child entity
 * │   │   ├── value-objects/
 * │   │   │   ├── money.vo.ts
 * │   │   │   ├── address.vo.ts
 * │   │   │   └── order-status.vo.ts
 * │   │   ├── domain-events/
 * │   │   │   ├── order-created.event.ts
 * │   │   │   └── order-shipped.event.ts
 * │   │   ├── repositories/
 * │   │   │   └── order.repository.interface.ts
 * │   │   └── domain-services/
 * │   │       └── order-validation.service.ts
 * │   ├── application/
 * │   │   ├── command-handlers/
 * │   │   │   ├── create-order.handler.ts
 * │   │   │   └── cancel-order.handler.ts
 * │   │   ├── event-handlers/
 * │   │   │   └── order-created.handler.ts
 * │   │   └── dto/
 * │   ├── infrastructure/
 * │   │   ├── repositories/
 * │   │   │   └── order.repository.ts
 * │   │   └── event-store/
 * │   │       └── order-events.store.ts
 * │   ├── interface/
 * │   │   └── controllers/
 * │   └── order-context.module.ts
 * │
 * ├── payment-bounded-context/       ← Separate domain
 * │   └── (similar structure)
 * │
 * ├── shared/                         ← Shared language
 * │   ├── domain-events/
 * │   ├── specifications/
 * │   └── value-objects/
 * │
 * └── app.module.ts
 */

/*
VÍ DỰ CODE:

// order-bounded-context/domain/aggregates/order.aggregate.ts
export class OrderAggregate {
  private id: OrderId;
  private items: OrderItem[];
  private status: OrderStatus;
  private domainEvents: DomainEvent[] = [];
  
  // Business rules (không được break)
  addItem(product: Product, quantity: number) {
    if (this.status !== OrderStatus.DRAFT) {
      throw new CannotModifyShippedOrderError();
    }
    this.items.push(new OrderItem(product, quantity));
    this.addDomainEvent(new ItemAddedToOrder(this.id, product.id));
  }
  
  ship() {
    if (this.status !== OrderStatus.CONFIRMED) {
      throw new CannotShipUnconfirmedOrderError();
    }
    this.status = OrderStatus.SHIPPED;
    this.addDomainEvent(new OrderShipped(this.id));
  }
  
  cancel() {
    if (this.status === OrderStatus.SHIPPED) {
      throw new CannotCancelShippedOrderError();
    }
    this.status = OrderStatus.CANCELLED;
    this.addDomainEvent(new OrderCancelled(this.id));
  }
  
  private addDomainEvent(event: DomainEvent) {
    this.domainEvents.push(event);
  }
}

// order-bounded-context/domain/value-objects/money.vo.ts
export class Money {
  constructor(
    public readonly amount: number,
    public readonly currency: string,
  ) {
    if (amount < 0) {
      throw new NegativeMoneyError();
    }
  }
  
  add(other: Money): Money {
    if (this.currency !== other.currency) {
      throw new DifferentCurrencyError();
    }
    return new Money(this.amount + other.amount, this.currency);
  }
}

// order-bounded-context/application/command-handlers/create-order.handler.ts
@Injectable()
export class CreateOrderHandler {
  constructor(private orderRepository: OrderRepository) {}
  
  async execute(command: CreateOrderCommand) {
    // Create aggregate (with business rules enforced)
    const order = OrderAggregate.create(
      command.orderId,
      command.userId,
      command.items,
    );
    
    // Save aggregate
    await this.orderRepository.save(order);
    
    // Publish domain events
    const events = order.getDomainEvents();
    for (const event of events) {
      await this.eventBus.publish(event);
    }
    
    return order;
  }
}

// order-bounded-context/interface/controllers/order.controller.ts
@Controller('orders')
export class OrderController {
  constructor(private commandBus: CommandBus) {}
  
  @Post()
  async create(@Body() dto: CreateOrderDto) {
    const command = new CreateOrderCommand(
      GenerateId(),
      dto.userId,
      dto.items,
    );
    return this.commandBus.execute(command);
  }
}

PROS:
✅ Perfect modeling of complex domains
✅ Business rules protected (aggregates)
✅ Event-driven (loose coupling)
✅ Multiple teams independent
✅ Very scalable

CONS:
❌ Very complex (steep learning curve)
❌ Lots of ceremony (boilerplate)
❌ Overhead for simple projects
❌ Takes time to understand ubiquitous language
❌ Expensive to implement

DÙNG KHI:
✅ Enterprise system (100+ developers)
✅ Multiple teams
✅ Complex domain logic (banking, healthcare)
✅ Event sourcing needed
✅ Very long-term project

KHÔNG DÙNG KHI:
❌ Startup MVP
❌ CRUD simple
❌ Team < 10 people
❌ No complex domain
❌ Short timeline
*/

// ============================================================================
// 📊 SO SÁNH: DEFAULT vs CLEAN vs DDD
// ============================================================================

/*
┌──────────────────┬──────────────────┬──────────────────┬──────────────────┐
│ Criteria         │ NestJS Default   │ Clean Arch       │ DDD              │
├──────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ Files/Layers     │ 2-3              │ 4-5              │ 6-8+             │
│                  │ (Controller,     │ (Controller,     │ (Aggregates,     │
│                  │  Service)        │  UseCase, Domain,│  Value Objects,  │
│                  │                  │  Repository)     │  Events)         │
├──────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ Separation of    │ ❌ Poor          │ ✅ Good          │ ✅✅ Excellent   │
│ Concerns         │ (Service = all)  │ (Layers)         │ (Contexts)       │
├──────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ Database         │ ❌ Tight         │ ✅ Loose         │ ✅✅ Very Loose  │
│ Coupling         │ (SQL in service) │ (Interface)      │ (Event Store)    │
├──────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ Testability      │ ❌ Hard          │ ✅ Easy          │ ✅✅ Very Easy   │
│                  │ (Mock entire DB) │ (Mock interfaces)│ (Pure objects)   │
├──────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ Code Reuse       │ ❌ Hard          │ ✅ Easy          │ ✅✅ Very Easy   │
│                  │ (Logic locked)   │ (Services)       │ (Objects)        │
├──────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ Learning Curve   │ ✅ Easy          │ ⚠️ Medium        │ ❌ Hard          │
│                  │ (1 day)          │ (1-2 weeks)      │ (1-2 months)     │
├──────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ Time to Code     │ ✅ Fast          │ ⚠️ Medium        │ ❌ Slow          │
│ (simple feature) │ (1 hour)         │ (3-4 hours)      │ (1-2 days)       │
├──────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ Scalability      │ ❌ Poor          │ ✅ Good          │ ✅✅ Excellent   │
│ (as project      │ (hard to         │ (organized)      │ (independent     │
│  grows)          │  maintain 100+   │                  │  contexts)       │
│                  │  handlers)       │                  │                  │
├──────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ Team Size        │ 1-3              │ 5-20             │ 20-100+          │
├──────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ Project Type     │ MVP, CRUD        │ Medium business  │ Enterprise       │
├──────────────────┼──────────────────┼──────────────────┼──────────────────┤
│ Best For         │ Startup, Proof   │ Production       │ Large systems    │
│                  │ of Concept       │ app, SaaS        │                  │
└──────────────────┴──────────────────┴──────────────────┴──────────────────┘
*/

// ============================================================================
// 🎯 DECISION TREE: CHỌN ARCHITECTURE
// ============================================================================

/*
PROJECT SIZE & TEAM?

┌─────────────────────────────────────────────────────────┐
│ 1. Is this MVP or prototype?                            │
├─────────────────────────────────────────────────────────┤
│ YES → Use NestJS Default (Layered)                      │
│ └─ Focus on speed, not architecture                     │
│ └─ Time to market is critical                           │
│ └─ Can refactor later                                   │
│                                                          │
│ NO → Continue...                                        │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│ 2. What is your team size?                              │
├─────────────────────────────────────────────────────────┤
│ < 3 people → NestJS Default is OK                       │
│ (simple structure, easy for small team)                 │
│                                                          │
│ 3-5 people → NestJS Default                             │
│ (still manageable)                                       │
│                                                          │
│ 5-20 people → CLEAN ARCHITECTURE ✅                     │
│ (need clear structure, multiple teams)                  │
│                                                          │
│ 20+ people → DDD + CLEAN ARCHITECTURE                   │
│ (bounded contexts, independent teams)                   │
│                                                          │
│ 100+ people → MICROSERVICES + DDD                       │
│ (separate services, independent deployment)             │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│ 3. Domain complexity?                                   │
├─────────────────────────────────────────────────────────┤
│ Simple CRUD → NestJS Default ✅                         │
│ (no need for complex architecture)                      │
│                                                          │
│ Medium (few rules) → CLEAN ARCHITECTURE                 │
│ (organized, easy to test)                               │
│                                                          │
│ Complex (many rules, business logic) → DDD              │
│ (model domain, protect invariants)                      │
└─────────────────────────────────────────────────────────┘
         ↓
┌─────────────────────────────────────────────────────────┐
│ 4. Non-functional requirements?                         │
├─────────────────────────────────────────────────────────┤
│ Low traffic → Any architecture OK                       │
│                                                          │
│ Medium traffic (10K-100K req/day) → CLEAN ARCH OK       │
│                                                          │
│ High traffic (1M+ req/day) → CQRS + CLEAN ARCH          │
│ (separate read/write models)                            │
│                                                          │
│ Event sourcing needed → DDD + Event Store               │
│ (need event history)                                    │
└─────────────────────────────────────────────────────────┘

QUICK SUMMARY:

Startup (1-10 people)
  ├─ MVP: NestJS Default (speed first)
  └─ Production: Clean Architecture (when growing)

Scale-up (10-50 people)
  └─ Clean Architecture (organized)

Enterprise (50+ people)
  └─ DDD + Clean Architecture + Microservices
*/

export const NestJSDefault_vs_Alternatives = `
QUICK ANSWER:

1. NestJS DEFAULT (Layered 3-tier):
   Controller → Service → Database
   ✅ Simple | ❌ Not scalable
   👉 Use for: MVP, CRUD, small projects

2. CLEAN ARCHITECTURE (your file):
   Controller → UseCase → Domain → Repository
   ✅ Balanced | ✅ Testable | ✅ Scalable
   👉 Use for: Medium projects (5-20 people)

3. DDD (Domain-Driven Design):
   Bounded Contexts + Aggregates + Events
   ✅ Best for modeling | ❌ Very complex
   👉 Use for: Enterprise (20+ people)

RECOMMENDATION:
- Start with NestJS Default for MVP
- Move to Clean Architecture as team grows (5+ people)
- Adopt DDD only if you have complex domain (finance, healthcare)

For MOST NestJS projects, Clean Architecture is the sweet spot!
`;
