/**
 * ============================================================================
 * SOLID PRINCIPLES
 * ============================================================================
 * 
 * SOLID là 5 nguyên lý thiết kế giúp code sạch, dễ bảo trì, dễ test.
 * Được Robert C. Martin (Uncle Bob) định nghĩa.
 * 
 * SOLID = 5 chữ cái đầu của 5 nguyên lý:
 * S - Single Responsibility Principle
 * O - Open/Closed Principle
 * L - Liskov Substitution Principle
 * I - Interface Segregation Principle
 * D - Dependency Inversion Principle
 */

// ============================================================================
// 1️⃣ S - SINGLE RESPONSIBILITY PRINCIPLE (SRP)
// ============================================================================

/**
 * Định nghĩa:
 * "A class should have only ONE reason to change"
 * (Mỗi class chỉ nên có 1 trách nhiệm duy nhất)
 * 
 * Ý tưởng:
 * ✅ Mỗi class/module có 1 trách nhiệm rõ ràng
 * ❌ 1 class không nên làm nhiều việc khác nhau
 */

/**
 * ❌ VÍ DỤ SAI (Violation of SRP):
 * 
 * // order.service.ts (nhảm nấm)
 * @Injectable()
 * export class OrderService {
 *   // Trách nhiệm 1: Handle order business logic
 *   async createOrder(dto: CreateOrderDto) {
 *     const order = { ... };
 *     
 *     // Trách nhiệm 2: Save to database (mixing concerns)
 *     await this.db.query('INSERT INTO orders (...)', [...]);
 *     
 *     // Trách nhiệm 3: Send email (mixing concerns)
 *     await this.emailService.send({
 *       to: dto.email,
 *       subject: 'Order confirmation',
 *       body: '...'
 *     });
 *     
 *     // Trách nhiệm 4: Log to file (mixing concerns)
 *     fs.appendFileSync('orders.log', `Order ${order.id} created`);
 *     
 *     return order;
 *   }
 * }
 * 
 * ❌ PROBLEM:
 * - OrderService có 4 trách nhiệm:
 *   1. Order business logic
 *   2. Database operations
 *   3. Email sending
 *   4. Logging
 * - Nếu thay đổi cách lưu database → phải sửa OrderService
 * - Nếu thay đổi email provider → phải sửa OrderService
 * - Nếu thay đổi logging format → phải sửa OrderService
 * - Khó test (phải mock cả 3 service khác)
 */

/**
 * ✅ VÍ DỤ ĐÚNG (SRP applied):
 * 
 * // domain/services/order-pricing.service.ts
 * @Injectable()
 * export class OrderPricingService {
 *   // Trách nhiệm: Chỉ tính toán giá
 *   calculatePrice(basePrice: number, quantity: number): number {
 *     return basePrice * quantity;
 *   }
 * }
 * 
 * // infrastructure/repositories/order.repository.ts
 * @Injectable()
 * export class OrderRepository {
 *   // Trách nhiệm: Chỉ lưu/lấy từ database
 *   async create(order: Order) {
 *     return this.db.query('INSERT INTO orders (...)', [...]);
 *   }
 * }
 * 
 * // infrastructure/services/email.service.ts
 * @Injectable()
 * export class EmailService {
 *   // Trách nhiệm: Chỉ gửi email
 *   async send(to: string, subject: string, body: string) {
 *     // Gửi email logic
 *   }
 * }
 * 
 * // infrastructure/services/logger.service.ts
 * @Injectable()
 * export class LoggerService {
 *   // Trách nhiệm: Chỉ log
 *   log(message: string) {
 *     fs.appendFileSync('orders.log', message);
 *   }
 * }
 * 
 * // application/usecases/create-order.usecase.ts
 * @Injectable()
 * export class CreateOrderUseCase {
 *   constructor(
 *     private orderRepository: OrderRepository,
 *     private pricingService: OrderPricingService,
 *     private emailService: EmailService,
 *     private logger: LoggerService,
 *   ) {}
 * 
 *   async execute(input: CreateOrderInput) {
 *     // Orchestrate các services
 *     const price = this.pricingService.calculatePrice(input.basePrice, input.quantity);
 *     const order = await this.orderRepository.create({ price });
 *     await this.emailService.send(input.email, 'Order confirmation', '...');
 *     this.logger.log(`Order ${order.id} created`);
 *     return order;
 *   }
 * }
 * 
 * ✅ BENEFIT:
 * - Mỗi class có 1 trách nhiệm duy nhất
 * - Dễ test (test từng service riêng)
 * - Dễ bảo trì (thay đổi 1 chỗ)
 * - Dễ tái sử dụng (service dùng ở nhiều nơi)
 */

// ============================================================================
// 2️⃣ O - OPEN/CLOSED PRINCIPLE (OCP)
// ============================================================================

/**
 * Định nghĩa:
 * "Software entities should be OPEN for extension, CLOSED for modification"
 * (Code nên mở để mở rộng, nhưng đóng để sửa đổi)
 * 
 * Ý tưởng:
 * ✅ Thêm tính năng mới → thêm code mới (không sửa code cũ)
 * ❌ Sửa đổi code cũ → risk bugs
 */

/**
 * ❌ VÍ DỤ SAI (Violation of OCP):
 * 
 * // payment.service.ts
 * @Injectable()
 * export class PaymentService {
 *   async processPayment(amount: number, method: string) {
 *     if (method === 'stripe') {
 *       // Call Stripe API
 *       return await this.stripe.charge(amount);
 *     } else if (method === 'paypal') {
 *       // Call PayPal API
 *       return await this.paypal.charge(amount);
 *     } else if (method === 'square') {
 *       // Call Square API
 *       return await this.square.charge(amount);
 *     }
 *   }
 * }
 * 
 * ❌ PROBLEM:
 * - Muốn thêm payment method mới (e.g., Apple Pay)
 * - Phải sửa PaymentService (thêm else if)
 * - Risk break code cũ
 * - PaymentService luôn phải sửa đổi
 * - CLOSED for modification (violated!)
 */

/**
 * ✅ VÍ DỤ ĐÚNG (OCP applied):
 * 
 * // payment-gateway.interface.ts
 * export interface IPaymentGateway {
 *   charge(amount: number): Promise<{ success: boolean }>;
 * }
 * 
 * // payment-gateways/stripe.gateway.ts
 * @Injectable()
 * export class StripeGateway implements IPaymentGateway {
 *   async charge(amount: number) {
 *     return await this.stripe.charge(amount);
 *   }
 * }
 * 
 * // payment-gateways/paypal.gateway.ts
 * @Injectable()
 * export class PayPalGateway implements IPaymentGateway {
 *   async charge(amount: number) {
 *     return await this.paypal.charge(amount);
 *   }
 * }
 * 
 * // payment-gateways/square.gateway.ts
 * @Injectable()
 * export class SquareGateway implements IPaymentGateway {
 *   async charge(amount: number) {
 *     return await this.square.charge(amount);
 *   }
 * }
 * 
 * // payment.service.ts
 * @Injectable()
 * export class PaymentService {
 *   constructor(private gateway: IPaymentGateway) {} // Depend on interface
 *   
 *   async processPayment(amount: number) {
 *     return await this.gateway.charge(amount); // Use interface
 *   }
 * }
 * 
 * ✅ BENEFIT:
 * - Muốn thêm payment method: Tạo class mới (ApplePayGateway)
 * - PaymentService không cần sửa (CLOSED for modification)
 * - Code mở để mở rộng (thêm gateway mới)
 * - Không risk bugs
 */

// ============================================================================
// 3️⃣ L - LISKOV SUBSTITUTION PRINCIPLE (LSP)
// ============================================================================

/**
 * Định nghĩa:
 * "Derived classes must be substitutable for their base classes"
 * (Subclass phải có thể thay thế superclass mà không break code)
 * 
 * Ý tưóng:
 * ✅ Nếu lớp con (B) kế thừa lớp cha (A), B có thể dùng thay A
 * ❌ B không nên break hành vi của A
 */

/**
 * ❌ VÍ DỤ SAI (Violation of LSP):
 * 
 * // bird.ts
 * export class Bird {
 *   fly() {
 *     console.log('Flying');
 *   }
 * }
 * 
 * // penguin.ts
 * export class Penguin extends Bird {
 *   // ❌ PROBLEM: Penguin extends Bird nhưng không thể fly
 *   fly() {
 *     throw new Error('Penguins cannot fly!');
 *   }
 * }
 * 
 * // main.ts
 * function makeBirdFly(bird: Bird) {
 *   bird.fly(); // ❌ Crash nếu bird là Penguin!
 * }
 * 
 * ❌ PROBLEM:
 * - Penguin là subclass của Bird
 * - Nhưng không thể thay thế Bird (throw error)
 * - Break Liskov principle
 */

/**
 * ✅ VÍ DỤ ĐÚNG (LSP applied):
 * 
 * // bird.ts
 * export abstract class Bird {
 *   abstract move(): void;
 * }
 * 
 * // flying-bird.ts
 * export class FlyingBird extends Bird {
 *   move() {
 *     console.log('Flying');
 *   }
 * }
 * 
 * // penguin.ts
 * export class Penguin extends Bird {
 *   move() {
 *     console.log('Swimming'); // ✅ Thay thế move() legitimately
 *   }
 * }
 * 
 * // main.ts
 * function makeBirdMove(bird: Bird) {
 *   bird.move(); // ✅ Works for all birds
 * }
 * 
 * ✅ BENEFIT:
 * - Bird abstract định nghĩa move()
 * - FlyingBird & Penguin cùng có thể thay thế
 * - Không break hành vi
 */

// ============================================================================
// 4️⃣ I - INTERFACE SEGREGATION PRINCIPLE (ISP)
// ============================================================================

/**
 * Định nghĩa:
 * "Clients should not be forced to depend on interfaces they do not use"
 * (Client không nên phụ thuộc vào interface không cần dùng)
 * 
 * Ý tưởng:
 * ✅ Interface nhỏ, chỉ có methods cần thiết
 * ❌ Interface lớn, chứa methods không cần
 */

/**
 * ❌ VÍ DỤ SAI (Violation of ISP):
 * 
 * // worker.interface.ts
 * export interface IWorker {
 *   work(): void;
 *   eat(): void;
 *   sleep(): void;
 *   writeCode(): void;
 *   manageTeam(): void;
 * }
 * 
 * // robot.ts
 * export class Robot implements IWorker {
 *   work() { console.log('Working'); }
 *   eat() { throw new Error('Robot cannot eat'); } // ❌ Không dùng
 *   sleep() { throw new Error('Robot cannot sleep'); } // ❌ Không dùng
 *   writeCode() { console.log('Writing code'); }
 *   manageTeam() { throw new Error('Robot cannot manage'); } // ❌ Không dùng
 * }
 * 
 * ❌ PROBLEM:
 * - Robot implement IWorker toàn bộ
 * - Nhưng không cần eat(), sleep(), manageTeam()
 * - Bắt buộc implement methods không dùng
 */

/**
 * ✅ VÍ DỤ ĐÚNG (ISP applied):
 * 
 * // worker.interface.ts
 * export interface IWorker {
 *   work(): void;
 * }
 * 
 * // eater.interface.ts
 * export interface IEater {
 *   eat(): void;
 * }
 * 
 * // sleeper.interface.ts
 * export interface ISleeper {
 *   sleep(): void;
 * }
 * 
 * // programmer.ts
 * export class Programmer implements IWorker, IEater, ISleeper {
 *   work() { console.log('Writing code'); }
 *   eat() { console.log('Eating'); }
 *   sleep() { console.log('Sleeping'); }
 * }
 * 
 * // robot.ts
 * export class Robot implements IWorker {
 *   work() { console.log('Working'); }
 *   // ✅ Không cần implement eat(), sleep()
 * }
 * 
 * ✅ BENEFIT:
 * - Interfaces nhỏ, chỉ cần thiết
 * - Robot chỉ implement IWorker
 * - Không bắt buộc implement methods không dùng
 */

// ============================================================================
// 5️⃣ D - DEPENDENCY INVERSION PRINCIPLE (DIP)
// ============================================================================

/**
 * Định nghĩa:
 * "High-level modules should not depend on low-level modules. 
 *  Both should depend on abstractions."
 * (Không nên phụ thuộc vào implementation cụ thể, mà phụ thuộc vào interface)
 * 
 * Ý tưởng:
 * ✅ Depend on interfaces (abstract)
 * ❌ Depend on concrete classes
 */

/**
 * ❌ VÍ DỤ SAI (Violation of DIP):
 * 
 * // stripe.ts
 * export class StripePaymentGateway {
 *   charge(amount: number) {
 *     // Call Stripe API
 *   }
 * }
 * 
 * // order.service.ts
 * @Injectable()
 * export class OrderService {
 *   // ❌ Depend on concrete class StripePaymentGateway
 *   constructor(private stripe: StripePaymentGateway) {}
 *   
 *   async createOrder(dto: CreateOrderDto) {
 *     // ...
 *     await this.stripe.charge(100);
 *   }
 * }
 * 
 * ❌ PROBLEM:
 * - OrderService phụ thuộc vào StripePaymentGateway (concrete)
 * - Nếu đổi sang PayPal → phải sửa OrderService
 * - Tight coupling
 * - Khó test (phải mock Stripe)
 */

/**
 * ✅ VÍ DỤ ĐÚNG (DIP applied):
 * 
 * // payment-gateway.interface.ts
 * export interface IPaymentGateway {
 *   charge(amount: number): Promise<{ success: boolean }>;
 * }
 * 
 * // stripe.ts
 * @Injectable()
 * export class StripePaymentGateway implements IPaymentGateway {
 *   async charge(amount: number) {
 *     // Call Stripe API
 *   }
 * }
 * 
 * // order.service.ts
 * @Injectable()
 * export class OrderService {
 *   // ✅ Depend on interface IPaymentGateway (abstract)
 *   constructor(private paymentGateway: IPaymentGateway) {}
 *   
 *   async createOrder(dto: CreateOrderDto) {
 *     // ...
 *     await this.paymentGateway.charge(100);
 *   }
 * }
 * 
 * // app.module.ts
 * @Module({
 *   providers: [
 *     OrderService,
 *     {
 *       provide: IPaymentGateway,
 *       useClass: StripePaymentGateway, // ✅ Inject Stripe
 *     },
 *   ],
 * })
 * export class AppModule {}
 * 
 * // Muốn đổi sang PayPal? Chỉ cần sửa app.module.ts
 * // OrderService không cần sửa!
 * 
 * ✅ BENEFIT:
 * - Depend on interface (abstract)
 * - Loose coupling
 * - Dễ swap implementations
 * - Dễ test (mock interface)
 */

// ============================================================================
// 📊 TÓMSÁCHUAT: SOLID Principles
// ============================================================================

/**
 * S - Single Responsibility
 *   Mỗi class 1 trách nhiệm
 *   ✅ OrderPricingService: tính giá
 *   ✅ OrderRepository: lưu database
 *   ✅ EmailService: gửi email
 * 
 * O - Open/Closed
 *   Open để mở rộng, Closed để sửa đổi
 *   ✅ Thêm payment gateway mới: tạo class mới (không sửa cũ)
 *   ✅ Phụ thuộc vào interface
 * 
 * L - Liskov Substitution
 *   Subclass có thể thay thế superclass
 *   ✅ Nếu FlyingBird & Penguin extend Bird, cả 2 đều thay thế được
 *   ✅ Không nên throw error trong override method
 * 
 * I - Interface Segregation
 *   Interface nhỏ, chỉ cần thiết
 *   ✅ IWorker: work()
 *   ✅ IEater: eat()
 *   ✅ ISleeper: sleep()
 *   ❌ Không nên 1 interface có tất cả
 * 
 * D - Dependency Inversion
 *   Phụ thuộc vào interface, không phụ thuộc vào concrete class
 *   ✅ OrderService depend on IPaymentGateway (interface)
 *   ✅ Không depend on StripePaymentGateway (concrete)
 */

// ============================================================================
// 🎯 SOLID vs CLEAN ARCHITECTURE
// ============================================================================

/**
 * SOLID = 5 nguyên lý
 * Clean Architecture = Ứng dụng SOLID + thêm layer structure
 * 
 * Mối quan hệ:
 * Clean Architecture = SOLID + Layers
 * 
 * SOLID giúp:
 * ✅ Code trong mỗi layer sạch
 * ✅ Dễ bảo trì, dễ test
 * 
 * Layers giúp:
 * ✅ Tổ chức code theo level
 * ✅ Tách biệt concerns
 */

/**
 * File của bạn (WHY_CLEAN_ARCHITECTURE.ts) sử dụng SOLID:
 * 
 * ✅ S: Domain Service (OrderPricingService) chỉ tính giá
 * ✅ O: PaymentGateway interface mở để thêm Stripe, PayPal, v.v.
 * ✅ L: Subclasses của PaymentGateway có thể thay thế lẫn nhau
 * ✅ I: Interfaces nhỏ (IOrderRepository, IEmailService)
 * ✅ D: OrderService phụ thuộc vào IPaymentGateway (interface)
 * 
 * + Layers:
 * ✅ Domain (business logic)
 * ✅ Application (use cases)
 * ✅ Infrastructure (database, APIs)
 * ✅ Interface (HTTP)
 */

// ============================================================================
// 📈 ADOPTION & IMPORTANCE
// ============================================================================

/**
 * SOLID không phải trend:
 * - Được định nghĩa từ 2000s (25+ năm)
 * - Vẫn còn relevant
 * - Industry standard
 * 
 * Nếu không follow SOLID:
 * ❌ Code lẫn lộn
 * ❌ Khó bảo trì
 * ❌ Khó test
 * ❌ Khó mở rộng
 * 
 * Nếu follow SOLID:
 * ✅ Code sạch
 * ✅ Dễ bảo trì
 * ✅ Dễ test
 * ✅ Dễ mở rộng
 */

export const SOLIDPrinciples = `
SOLID = 5 nguyên lý thiết kế

S - Single Responsibility: Mỗi class 1 trách nhiệm
O - Open/Closed: Open để mở rộng, Closed để sửa đổi
L - Liskov Substitution: Subclass thay thế superclass được
I - Interface Segregation: Interface nhỏ, chỉ cần thiết
D - Dependency Inversion: Phụ thuộc vào interface, không concrete class

SOLID là nền tảng của Clean Architecture.
File WHY_CLEAN_ARCHITECTURE.ts của bạn đã áp dụng tất cả 5 nguyên lý này.

BENEFIT:
✅ Code sạch
✅ Dễ bảo trì
✅ Dễ test
✅ Dễ mở rộng
✅ Industry standard
`;
