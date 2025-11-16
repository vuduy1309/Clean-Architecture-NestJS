/**
 * ============================================================================
 * TẠI SAO CLEAN ARCHITECTURE?
 * ============================================================================
 * 
 * Câu hỏi: NestJS đã tốt rồi (Guard, Pipe, Interceptor), 
 *          tại sao lại cần thêm Clean Architecture?
 * 
 * Trả lời: NestJS giải quyết "MỘT PHẦN" vấn đề.
 *          Clean Architecture giải quyết "CÁC PHẦN KHÁC".
 */

// ============================================================================
// ❌ PROBLEM: NestJS không giải quyết được gì?
// ============================================================================

/**
 * NestJS giải quyết được:
 * ✅ Auth/validation/logging (Guard/Pipe/Interceptor)
 * ✅ Dependency injection
 * ✅ Modular structure
 * 
 * NestJS KHÔNG giải quyết được:
 * ❌ Business logic organization (code sát tight coupling)
 * ❌ Database coupling (code phụ thuộc vào database cụ thể)
 * ❌ External API coupling (code phụ thuộc vào API cụ thể)
 * ❌ Testing (khó test business logic)
 * ❌ Code reuse (logic lẫn lộn trong handler/service)
 * ❌ Long-term maintainability (khi project grow)
 */

// ============================================================================
// SCENARIO: E-Commerce Platform (Đặt hàng)
// ============================================================================

/**
 * Yêu cầu: POST /orders (tạo đơn hàng)
 * 
 * Business logic cần:
 * 1. Kiểm tra sản phẩm còn hàng không
 * 2. Tính tổng giá (với discount nếu có)
 * 3. Kiểm tra shipping address hợp lệ
 * 4. Ghi vào database
 * 5. Gửi email xác nhận
 * 6. Cập nhật inventory
 * 7. Tính toán commission cho seller
 * 8. Ghi log transaction
 * 
 * Mục đích: "User có thể tạo đơn hàng" ← Đây là BUSINESS LOGIC
 */

// ============================================================================
// ❌ CÁCH 1: Viết tất cả trong Controller (NestJS cơ bản)
// ============================================================================

/*
// Problem: Controller + Service lẫn lộn, tight coupling

@Controller('orders')
export class OrdersController {
  constructor(
    private db: Database,           // ← Tight coupling với DB
    private emailService: EmailService,  // ← Tight coupling với Email service
    private paymentGateway: StripeGateway,  // ← Tight coupling với Stripe
  ) {}

  @Post()
  @UseGuards(AuthGuard)
  async createOrder(@Body() dto: CreateOrderDto, @Req() req: Request) {
    try {
      const user = req.user;
      
      // ❌ Business logic lẫn trong controller
      // ❌ Phụ thuộc vào implementation chi tiết (Database, Email, Stripe)
      
      // 1. Kiểm tra product
      const product = await this.db.query(  // ← Tight coupling với database query
        'SELECT * FROM products WHERE id = ?',
        [dto.productId]
      );
      if (!product) {
        throw new NotFoundException('Product not found');
      }

      // 2. Kiểm tra inventory
      if (product.stock < dto.quantity) {
        throw new BadRequestException('Out of stock');
      }

      // 3. Tính giá
      let totalPrice = product.price * dto.quantity;
      if (user.loyaltyPoints > 100) {
        totalPrice *= 0.9; // 10% discount
      }
      
      // 4. Kiểm tra shipping
      const shippingCost = await this.calculateShipping(dto.address);  // ← Tight coupling
      totalPrice += shippingCost;

      // 5. Thanh toán (coupling với Stripe)
      const paymentResult = await this.paymentGateway.charge({
        amount: totalPrice,
        cardToken: dto.cardToken,
      });
      if (!paymentResult.success) {
        throw new BadRequestException('Payment failed');
      }

      // 6. Ghi vào database
      const order = await this.db.query(
        'INSERT INTO orders (...) VALUES (...)',
        [user.id, product.id, dto.quantity, totalPrice]
      );

      // 7. Cập nhật inventory
      await this.db.query(
        'UPDATE products SET stock = stock - ? WHERE id = ?',
        [dto.quantity, product.id]
      );

      // 8. Gửi email
      await this.emailService.send({
        to: user.email,
        subject: 'Order confirmation',
        body: `Your order #${order.id} has been created`,
      });

      // 9. Tính commission
      const commission = totalPrice * 0.1;
      await this.db.query(
        'INSERT INTO commissions (...) VALUES (...)',
        [product.sellerId, commission]
      );

      return order;

    } catch (error) {
      console.error('Error creating order:', error);
      throw new InternalServerErrorException('Order creation failed');
    }
  }
}

// ❌ PROBLEMS:
// 1. Controller quá phức tạp (100+ dòng, khó đọc)
// 2. Business logic lẫn với infrastructure
// 3. Tight coupling:
//    - Coupling với database (SQL queries)
//    - Coupling với email service
//    - Coupling với payment gateway
//    - Coupling với shipping calculation
// 4. Khó test:
//    - Muốn test "tính giá với discount" → phải mock DB, Email, Payment
//    - Muốn test "kiểm tra inventory" → phải mock DB
// 5. Khó tái sử dụng:
//    - Nếu khác controller cũng cần tính giá với discount → phải copy-paste
// 6. Khó thay đổi:
//    - Nếu thay đổi payment gateway (Stripe → PayPal) → phải sửa tất cả controller dùng payment
//    - Nếu thay đổi database → phải sửa tất cả SQL queries
// 7. Khó scale:
//    - Khi project grow (100+ handlers) → code trở nên bất khả control
*/

// ============================================================================
// ✅ CÁCH 2: Clean Architecture (Separate concerns properly)
// ============================================================================

/**
 * Clean Architecture giải quyết:
 * 
 * LAYER 1: DOMAIN (Business Logic - không phụ thuộc vào bất kỳ framework)
 * ────────────────────────────────────────────────────────────────────
 * - Order Entity
 * - Order Price Calculation (tính giá)
 * - Order Validation (kiểm tra hợp lệ)
 * - Order Repository Interface (abstract)
 * 
 * LAYER 2: APPLICATION (Use Cases - orchestrate business logic)
 * ────────────────────────────────────────────────────────────────────
 * - CreateOrderUseCase (tạo đơn hàng)
 * - Gọi repository, services, v.v.
 * 
 * LAYER 3: INTERFACE (Controllers, Presenters)
 * ────────────────────────────────────────────────────────────────────
 * - OrderController (HTTP layer)
 * - Nhận request, gọi use case, trả response
 * 
 * LAYER 4: INFRASTRUCTURE (Database, Email, Payment)
 * ────────────────────────────────────────────────────────────────────
 * - OrderRepository (database implementation)
 * - EmailService (email implementation)
 * - StripePaymentGateway (payment implementation)
 */

/*
// 📁 FILE 1: src/domain/entities/order.ts
// ─────────────────────────────────────────

export interface Order {
  id: string;
  userId: string;
  productId: string;
  quantity: number;
  totalPrice: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered';
  createdAt: Date;
}

// 📁 FILE 2: src/domain/services/order-pricing.service.ts
// ─────────────────────────────────────────────────────────
// ✅ Pure business logic, không phụ thuộc vào framework/database

export class OrderPricingService {
  // ✅ Chỉ tính toán giá, không biết về database
  calculateTotalPrice(
    basePrice: number,
    quantity: number,
    discountPercent: number,
    shippingCost: number
  ): number {
    const subtotal = basePrice * quantity;
    const discount = subtotal * (discountPercent / 100);
    const total = subtotal - discount + shippingCost;
    return Math.max(0, total); // Không âm
  }

  // ✅ Kiểm tra nếu user có discount
  hasDiscount(loyaltyPoints: number): boolean {
    return loyaltyPoints > 100;
  }

  getDiscountPercent(loyaltyPoints: number): number {
    if (loyaltyPoints < 100) return 0;
    if (loyaltyPoints < 500) return 10;
    if (loyaltyPoints < 1000) return 15;
    return 20;
  }
}

// ✅ TEST (dễ test vì không phụ thuộc vào gì cả):
test('calculateTotalPrice', () => {
  const service = new OrderPricingService();
  const result = service.calculateTotalPrice(100, 2, 10, 20);
  expect(result).toBe(200 - 20 + 20); // 200
});

// 📁 FILE 3: src/application/usecases/create-order.usecase.ts
// ──────────────────────────────────────────────────────────────
// ✅ Orchestrate business logic, không biết về HTTP/database details

export interface IOrderRepository {
  findProduct(id: string): Promise<Product>;
  createOrder(order: Order): Promise<Order>;
  updateInventory(productId: string, quantity: number): Promise<void>;
  saveCommission(sellerId: string, amount: number): Promise<void>;
}

export interface IEmailService {
  sendOrderConfirmation(email: string, orderId: string): Promise<void>;
}

export interface IPaymentGateway {
  charge(amount: number, token: string): Promise<{ success: boolean }>;
}

export class CreateOrderUseCase {
  constructor(
    private orderRepository: IOrderRepository,
    private emailService: IEmailService,
    private paymentGateway: IPaymentGateway,
    private pricingService: OrderPricingService,
  ) {}

  async execute(input: CreateOrderInput): Promise<Order> {
    // ✅ Orchestrate: gọi các service/repository theo thứ tự
    // ✅ Pure business logic flow (không phụ thuộc vào database cụ thể)

    // 1. Lấy product
    const product = await this.orderRepository.findProduct(input.productId);
    if (!product) {
      throw new ProductNotFoundError();
    }

    // 2. Kiểm tra inventory
    if (product.stock < input.quantity) {
      throw new OutOfStockError();
    }

    // 3. Tính giá
    const discountPercent = this.pricingService.hasDiscount(input.loyaltyPoints)
      ? this.pricingService.getDiscountPercent(input.loyaltyPoints)
      : 0;
    
    const totalPrice = this.pricingService.calculateTotalPrice(
      product.price,
      input.quantity,
      discountPercent,
      input.shippingCost,
    );

    // 4. Thanh toán
    const paymentResult = await this.paymentGateway.charge(totalPrice, input.cardToken);
    if (!paymentResult.success) {
      throw new PaymentFailedError();
    }

    // 5. Tạo order
    const order: Order = {
      id: generateId(),
      userId: input.userId,
      productId: input.productId,
      quantity: input.quantity,
      totalPrice,
      status: 'pending',
      createdAt: new Date(),
    };

    await this.orderRepository.createOrder(order);

    // 6. Cập nhật inventory
    await this.orderRepository.updateInventory(input.productId, input.quantity);

    // 7. Gửi email
    await this.emailService.sendOrderConfirmation(input.email, order.id);

    // 8. Tính commission
    const commission = totalPrice * 0.1;
    await this.orderRepository.saveCommission(product.sellerId, commission);

    return order;
  }
}

// ✅ TEST (dễ test vì chỉ phụ thuộc vào interfaces):
test('createOrder should charge payment', async () => {
  const mockRepository: IOrderRepository = {
    findProduct: async () => ({ id: '1', price: 100, stock: 10 }),
    createOrder: async (order) => order,
    updateInventory: async () => {},
    saveCommission: async () => {},
  };

  const mockEmailService: IEmailService = {
    sendOrderConfirmation: async () => {},
  };

  const mockPaymentGateway: IPaymentGateway = {
    charge: async () => ({ success: true }),
  };

  const useCase = new CreateOrderUseCase(
    mockRepository,
    mockEmailService,
    mockPaymentGateway,
    new OrderPricingService(),
  );

  const result = await useCase.execute({ ... });
  expect(result.totalPrice).toBe(100); // ✅ Easy to test!
});

// 📁 FILE 4: src/interface/controllers/order.controller.ts
// ──────────────────────────────────────────────────────────
// ✅ HTTP layer, gọi use case

@Controller('orders')
export class OrderController {
  constructor(private createOrderUseCase: CreateOrderUseCase) {}

  @Post()
  @UseGuards(AuthGuard)
  async create(@Body() dto: CreateOrderDto, @Req() req: Request) {
    // ✅ Đơn giản: nhận request → gọi use case → trả response
    const result = await this.createOrderUseCase.execute({
      userId: req.user.id,
      productId: dto.productId,
      quantity: dto.quantity,
      cardToken: dto.cardToken,
      email: req.user.email,
      loyaltyPoints: req.user.loyaltyPoints,
      shippingCost: dto.shippingCost,
    });

    return { success: true, orderId: result.id };
  }
}

// 📁 FILE 5: src/infrastructure/repositories/order.repository.ts
// ───────────────────────────────────────────────────────────────
// ✅ Database implementation

@Injectable()
export class OrderRepository implements IOrderRepository {
  constructor(private db: DatabaseService) {}

  async findProduct(id: string): Promise<Product> {
    return this.db.query('SELECT * FROM products WHERE id = ?', [id]);
  }

  async createOrder(order: Order): Promise<Order> {
    return this.db.query(
      'INSERT INTO orders (...) VALUES (...)',
      [order.userId, order.productId, ...]
    );
  }

  // ... implement other methods
}

// ✅ BENEFITS OF CLEAN ARCHITECTURE:
// 
// 1. ✅ Separation of Concerns
//    - Business logic (domain) ≠ Use cases ≠ HTTP ≠ Database
//    - Mỗi layer có 1 trách nhiệm duy nhất
// 
// 2. ✅ Easy to Test
//    - Test OrderPricingService: không cần mock gì
//    - Test CreateOrderUseCase: mock interfaces
//    - Test OrderController: mock use case
// 
// 3. ✅ Easy to Change
//    - Thay đổi payment (Stripe → PayPal): chỉ sửa StripePaymentGateway
//    - Thay đổi database (SQL → NoSQL): chỉ sửa OrderRepository
//    - Thay đổi email (SMTP → Sendgrid): chỉ sửa EmailService
// 
// 4. ✅ Easy to Reuse
//    - OrderPricingService dùng ở Controller, UseCase, v.v. (không duplicate)
//    - CreateOrderUseCase có thể dùng từ HTTP, CLI, Job, Cron, v.v.
// 
// 5. ✅ Scalability
//    - Business logic độc lập → có thể test/maintain riêng
//    - Khi project grow (100+ use cases) → vẫn organized
// 
// 6. ✅ Framework Independence
//    - Business logic không phụ thuộc NestJS
//    - Có thể move to Express/Fastify/Node.js mà không sửa domain logic
*/

// ============================================================================
// 📊 SO SÁNH: NestJS vs Clean Architecture
// ============================================================================

/*
┌──────────────────────┬──────────────────────┬──────────────────────┐
│ Tiêu chí             │ NestJS cơ bản        │ NestJS + Clean Arch  │
├──────────────────────┼──────────────────────┼──────────────────────┤
│ Validation logic     │ ✅ Pipe (1 nơi)     │ ✅ Pipe (1 nơi)      │
│ Auth logic           │ ✅ Guard (1 nơi)    │ ✅ Guard (1 nơi)     │
│ Logging              │ ✅ Interceptor      │ ✅ Interceptor       │
│                      │                      │                      │
│ Business logic       │ ❌ Lẫn trong        │ ✅ Domain Layer      │
│ organization         │    Controller/Service│    (organized)       │
│                      │                      │                      │
│ Database coupling    │ ❌ Tight coupling   │ ✅ Interface-based   │
│                      │    (SQL in handler) │    (Injectable)      │
│                      │                      │                      │
│ Easy to test         │ ❌ Khó (lẫn lộn)   │ ✅ Dễ (separated)    │
│ business logic       │                      │                      │
│                      │                      │                      │
│ Easy to change       │ ❌ Phải sửa nhiều   │ ✅ Sửa 1 layer      │
│ payment provider     │    handlers          │                      │
│                      │                      │                      │
│ Code reuse           │ ❌ Duplicate code   │ ✅ Service (1 nơi)  │
│                      │                      │                      │
│ Scalability          │ ⚠️ Trung bình       │ ✅ Rất tốt           │
│ (100+ use cases)     │    (khó maintain)   │    (organized)       │
└──────────────────────┴──────────────────────┴──────────────────────┘
*/

// ============================================================================
// 🎯 WHEN TO USE CLEAN ARCHITECTURE?
// ============================================================================

/*
USE CLEAN ARCHITECTURE WHEN:

✅ Project lớn (100+ endpoints)
   - Code tự organize: domain, application, interface, infrastructure
   - Dễ navigate, dễ maintain

✅ Business logic phức tạp
   - Có nhiều use cases
   - Logic cần reuse ở nhiều nơi
   - Cần test business logic riêng

✅ Third-party dependencies nhiều
   - Multiple payment gateways
   - Multiple databases
   - Multiple external APIs
   - Cần dễ swap implementation

✅ Team lớn
   - Developers cần clear structure
   - Cần decouple để làm việc song song
   - Cần unit test coverage cao

✅ Long-term project
   - Requirements thay đổi
   - Technology stack thay đổi
   - Cần dễ maintain/extend

DON'T USE IF:

❌ Dự án nhỏ (< 10 endpoints, MVP)
   - Overhead không đáng giá
   - Tốn thời gian setup

❌ CRUD simple (tạo, đọc, sửa, xóa)
   - Không cần phức tạp hóa
   - NestJS cơ bản đủ

❌ Protototype/proof-of-concept
   - Focus speed, không maintain
*/

// ============================================================================
// 📈 ARCHITECTURE PROGRESSION
// ============================================================================

/*
1️⃣ SIMPLE CRUD API (MVP - 5 endpoints)
   ────────────────────────────────────
   Controller → Service → Database
   
   Đủ cho: Todo app, simple blog, quick prototype
   
2️⃣ MEDIUM PROJECT (50 endpoints)
   ──────────────────────────────
   NestJS + Guard/Pipe/Interceptor
   Controller → Service → Database
   
   Đủ cho: Small business, side project
   
3️⃣ LARGE PROJECT (200+ endpoints, complex logic)
   ─────────────────────────────────────────────
   NestJS + Clean Architecture (Domain, Application, Infrastructure)
   
   Domain Layer: Entities, Value Objects, Domain Services
   Application Layer: Use Cases, DTOs
   Interface Layer: Controllers, Presenters
   Infrastructure Layer: Repositories, External Services
   
   Đủ cho: Enterprise application, startup scaling

4️⃣ COMPLEX ENTERPRISE (microservices, multiple domains)
   ──────────────────────────────────────────────────────
   Clean Architecture + DDD (Domain-Driven Design)
   + Event-Driven + CQRS + API Gateway
   
   Đủ cho: Large-scale systems (Uber, Netflix level)
*/

export const CleanArchitectureExplanation = `
WHY CLEAN ARCHITECTURE?

NestJS xử lý: Infrastructure concerns (auth, validation, logging)
Clean Architecture xử lý: Business logic organization

Nếu KHÔNG dùng Clean Architecture:
❌ Business logic lẫn trong handler
❌ Tight coupling (database, API, v.v.)
❌ Khó test
❌ Khó tái sử dụng
❌ Khó scale (100+ handlers = nightmare)

Nếu dùng Clean Architecture:
✅ Business logic organize rõ ràng
✅ Loose coupling (interface-based)
✅ Dễ test (mock dependencies)
✅ Dễ tái sử dụng (service ở nhiều nơi)
✅ Dễ scale (structure clear)

BOTTOM LINE:
- NestJS: Framework + patterns (Guard, Pipe, DI)
- Clean Architecture: Code organization + design principles

Cả hai cùng nhau = Perfect combo cho production-grade applications
`;
