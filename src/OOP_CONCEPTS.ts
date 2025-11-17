/**
 * ============================================================================
 * OOP - OBJECT-ORIENTED PROGRAMMING
 * ============================================================================
 * 
 * OOP là mô hình lập trình dựa trên "objects" (đối tượng).
 * Thay vì viết code theo từng hàm riêng lẻ, OOP tổ chức code thành các object.
 * 
 * Lợi ích:
 * ✅ Tổ chức code tốt hơn
 * ✅ Tái sử dụng code dễ dàng
 * ✅ Bảo trì, mở rộng dễ dàng
 * ✅ Nhân viên mới hiểu code dễ hơn
 */

// ============================================================================
// 1️⃣ CLASS & OBJECT
// ============================================================================

/**
 * Class = Bản thiết kế (blueprint)
 * Object = Instance tạo từ class
 * 
 * Tương tự:
 * - Class như "bản vẽ ngôi nhà"
 * - Object như "ngôi nhà thực tế"
 */

/**
 * ❌ VÍ DỤ SAI (Procedural - không OOP):
 * 
 * // Viết code kiểu cũ
 * function getUserName(userId: number) {
 *   const user = db.query(`SELECT * FROM users WHERE id = ${userId}`);
 *   return user.name;
 * }
 * 
 * function getUserEmail(userId: number) {
 *   const user = db.query(`SELECT * FROM users WHERE id = ${userId}`);
 *   return user.email;
 * }
 * 
 * function getUserAge(userId: number) {
 *   const user = db.query(`SELECT * FROM users WHERE id = ${userId}`);
 *   return user.age;
 * }
 * 
 * // Sử dụng
 * const name = getUserName(1);
 * const email = getUserEmail(1);
 * const age = getUserAge(1);
 * 
 * ❌ PROBLEM:
 * - Code lặp lại 3 lần query cùng một user
 * - Khó bảo trì (sửa query ở 3 chỗ)
 * - Không tổ chức
 */

/**
 * ✅ VÍ DỤ ĐÚNG (OOP):
 * 
 * // Tạo class User
 * export class User {
 *   id: number;
 *   name: string;
 *   email: string;
 *   age: number;
 * 
 *   constructor(id: number, name: string, email: string, age: number) {
 *     this.id = id;
 *     this.name = name;
 *     this.email = email;
 *     this.age = age;
 *   }
 * 
 *   // Method để lấy thông tin
 *   getFullInfo(): string {
 *     return `${this.name} (${this.email}), ${this.age} years old`;
 *   }
 * }
 * 
 * // Repository handle database
 * @Injectable()
 * export class UserRepository {
 *   async getUserById(id: number): Promise<User> {
 *     const user = await db.query(`SELECT * FROM users WHERE id = ${id}`);
 *     return new User(user.id, user.name, user.email, user.age);
 *   }
 * }
 * 
 * // Sử dụng
 * const user = await userRepository.getUserById(1);
 * console.log(user.name);    // ✅ Lấy name
 * console.log(user.email);   // ✅ Lấy email
 * console.log(user.age);     // ✅ Lấy age
 * console.log(user.getFullInfo()); // ✅ Method
 * 
 * ✅ BENEFIT:
 * - Code không lặp lại
 * - User là 1 entity tổ chức
 * - Dễ mở rộng (thêm method mới)
 */

// ============================================================================
// 2️⃣ ENCAPSULATION (Đóng gói)
// ============================================================================

/**
 * Encapsulation = Ẩn data bên trong object
 * 
 * Ý tưởng:
 * ✅ Data private (không truy cập trực tiếp)
 * ✅ Truy cập qua methods (getter/setter)
 * ✅ Bảo vệ data khỏi thay đổi sai
 */

/**
 * ❌ VÍ DỤ SAI (No Encapsulation):
 * 
 * export class BankAccount {
 *   balance: number = 1000; // ❌ Public
 * }
 * 
 * // Ai cũng có thể thay đổi balance
 * const account = new BankAccount();
 * account.balance = -999999; // ❌ Sai! Balance không thể âm
 * 
 * ❌ PROBLEM:
 * - Balance public, ai cũng thay đổi được
 * - Không validate giá trị
 * - Logic business bị phá
 */

/**
 * ✅ VÍ DỤ ĐÚNG (Encapsulation):
 * 
 * export class BankAccount {
 *   private balance: number = 1000; // ✅ Private
 * 
 *   // Getter: Lấy balance (read-only)
 *   getBalance(): number {
 *     return this.balance;
 *   }
 * 
 *   // Method: Rút tiền (validate logic)
 *   withdraw(amount: number): boolean {
 *     if (amount <= 0) {
 *       throw new Error('Amount must be positive');
 *     }
 *     if (amount > this.balance) {
 *       throw new Error('Insufficient funds');
 *     }
 *     this.balance -= amount; // ✅ Chỉ withdraw có thể sửa balance
 *     return true;
 *   }
 * 
 *   // Method: Gửi tiền
 *   deposit(amount: number): boolean {
 *     if (amount <= 0) {
 *       throw new Error('Amount must be positive');
 *     }
 *     this.balance += amount; // ✅ Chỉ deposit có thể sửa balance
 *     return true;
 *   }
 * }
 * 
 * // Sử dụng
 * const account = new BankAccount();
 * console.log(account.getBalance()); // ✅ 1000
 * account.withdraw(100);
 * console.log(account.getBalance()); // ✅ 900
 * // account.balance = -999999; // ❌ Error! balance is private
 * 
 * ✅ BENEFIT:
 * - Data protected
 * - Logic validate trong methods
 * - Không thể set balance sai
 */

// ============================================================================
// 3️⃣ INHERITANCE (Kế thừa)
// ============================================================================

/**
 * Inheritance = Class con kế thừa từ class cha
 * 
 * Ý tưởng:
 * ✅ Tái sử dụng code từ class cha
 * ✅ Class con có properties & methods của class cha
 * ✅ Class con có thể thêm properties & methods riêng
 */

/**
 * VÍ DỤ ĐÚNG (Inheritance):
 * 
 * // Class cha: Animal
 * export abstract class Animal {
 *   name: string;
 *   age: number;
 * 
 *   constructor(name: string, age: number) {
 *     this.name = name;
 *     this.age = age;
 *   }
 * 
 *   // Method chung
 *   eat(): void {
 *     console.log(`${this.name} is eating`);
 *   }
 * 
 *   // Abstract method: phải implement ở class con
 *   abstract makeSound(): void;
 * }
 * 
 * // Class con: Dog
 * export class Dog extends Animal {
 *   breed: string;
 * 
 *   constructor(name: string, age: number, breed: string) {
 *     super(name, age); // ✅ Gọi constructor cha
 *     this.breed = breed;
 *   }
 * 
 *   // Implement abstract method
 *   makeSound(): void {
 *     console.log('Woof woof!');
 *   }
 * 
 *   // Method riêng của Dog
 *   fetch(): void {
 *     console.log(`${this.name} is fetching the ball`);
 *   }
 * }
 * 
 * // Class con: Cat
 * export class Cat extends Animal {
 *   color: string;
 * 
 *   constructor(name: string, age: number, color: string) {
 *     super(name, age);
 *     this.color = color;
 *   }
 * 
 *   makeSound(): void {
 *     console.log('Meow meow!');
 *   }
 * 
 *   scratch(): void {
 *     console.log(`${this.name} is scratching`);
 *   }
 * }
 * 
 * // Sử dụng
 * const dog = new Dog('Max', 5, 'Labrador');
 * dog.eat();        // ✅ Kế thừa từ Animal
 * dog.makeSound();  // ✅ Woof woof!
 * dog.fetch();      // ✅ Method riêng
 * 
 * const cat = new Cat('Whiskers', 3, 'Orange');
 * cat.eat();        // ✅ Kế thừa từ Animal
 * cat.makeSound();  // ✅ Meow meow!
 * cat.scratch();    // ✅ Method riêng
 * 
 * ✅ BENEFIT:
 * - Dog & Cat tái sử dụng eat() từ Animal
 * - Không lặp lại code
 * - Mỗi class có behavior riêng
 */

// ============================================================================
// 4️⃣ POLYMORPHISM (Đa hình)
// ============================================================================

/**
 * Polymorphism = Cùng interface, khác implementation
 * 
 * Ý tưởng:
 * ✅ Cùng tên method, khác hành động
 * ✅ Tạo code flexible
 */

/**
 * VÍ DỤ ĐÚNG (Polymorphism):
 * 
 * // Interface chung
 * export interface IPaymentGateway {
 *   charge(amount: number): Promise<{ success: boolean }>;
 * }
 * 
 * // Implementation 1: Stripe
 * export class StripeGateway implements IPaymentGateway {
 *   async charge(amount: number): Promise<{ success: boolean }> {
 *     console.log(`Charging ${amount} via Stripe`);
 *     // Stripe logic
 *     return { success: true };
 *   }
 * }
 * 
 * // Implementation 2: PayPal
 * export class PayPalGateway implements IPaymentGateway {
 *   async charge(amount: number): Promise<{ success: boolean }> {
 *     console.log(`Charging ${amount} via PayPal`);
 *     // PayPal logic
 *     return { success: true };
 *   }
 * }
 * 
 * // Implementation 3: Square
 * export class SquareGateway implements IPaymentGateway {
 *   async charge(amount: number): Promise<{ success: boolean }> {
 *     console.log(`Charging ${amount} via Square`);
 *     // Square logic
 *     return { success: true };
 *   }
 * }
 * 
 * // Service không cần biết implementation cụ thể
 * @Injectable()
 * export class PaymentService {
 *   constructor(private gateway: IPaymentGateway) {}
 * 
 *   async processPayment(amount: number) {
 *     const result = await this.gateway.charge(amount);
 *     // ✅ charge() được gọi, nhưng implementation khác tùy gateway
 *     return result;
 *   }
 * }
 * 
 * // Sử dụng
 * const stripeService = new PaymentService(new StripeGateway());
 * stripeService.processPayment(100); // ✅ Stripe charge
 * 
 * const paypalService = new PaymentService(new PayPalGateway());
 * paypalService.processPayment(100); // ✅ PayPal charge
 * 
 * const squareService = new PaymentService(new SquareGateway());
 * squareService.processPayment(100); // ✅ Square charge
 * 
 * ✅ BENEFIT:
 * - PaymentService không thay đổi
 * - Cùng interface (charge), khác implementation
 * - Dễ thêm gateway mới (Square, Apple Pay, v.v.)
 */

// ============================================================================
// 5️⃣ ABSTRACTION (Trừu tượng hóa)
// ============================================================================

/**
 * Abstraction = Ẩn complexity, chỉ show cần thiết
 * 
 * Ý tưởng:
 * ✅ User không cần biết chi tiết bên trong
 * ✅ User chỉ cần biết cách dùng
 */

/**
 * VÍ DỤ ĐÚNG (Abstraction):
 * 
 * // Abstraction: Database service
 * @Injectable()
 * export class DatabaseService {
 *   // Người dùng không cần biết bên trong như thế nào
 *   async query(sql: string, params: any[]): Promise<any[]> {
 *     // ✅ Kết nối database
 *     // ✅ Execute query
 *     // ✅ Return results
 *     // Chi tiết ẩn đi
 *   }
 * }
 * 
 * // Repository: Sử dụng DatabaseService
 * @Injectable()
 * export class UserRepository {
 *   constructor(private db: DatabaseService) {}
 * 
 *   async getUserById(id: number): Promise<User> {
 *     const result = await this.db.query(
 *       'SELECT * FROM users WHERE id = $1',
 *       [id]
 *     );
 *     // UserRepository không cần biết db.query bên trong như thế nào
 *     return new User(result[0]);
 *   }
 * }
 * 
 * // Controller: Sử dụng UserRepository
 * @Controller('users')
 * export class UserController {
 *   constructor(private userRepository: UserRepository) {}
 * 
 *   @Get(':id')
 *   async getUser(@Param('id') id: number) {
 *     const user = await this.userRepository.getUserById(id);
 *     // UserController không cần biết repository bên trong như thế nào
 *     return user;
 *   }
 * }
 * 
 * ✅ BENEFIT:
 * - Mỗi layer ẩn complexity
 * - User chỉ cần biết cách dùng interface
 * - Dễ hiểu, dễ bảo trì
 */

// ============================================================================
// 📊 TÓMSÁCHUAT: OOP vs Procedural
// ============================================================================

/**
 * PROCEDURAL (Cũ):
 * 
 * function getUserName(id: number) { ... }
 * function getUserEmail(id: number) { ... }
 * function updateUser(id: number, data: any) { ... }
 * function deleteUser(id: number) { ... }
 * 
 * ❌ Code lặp lại
 * ❌ Không tổ chức
 * ❌ Khó bảo trì
 * ❌ Khó test
 */

/**
 * OOP (Hiện tại):
 * 
 * class User {
 *   id: number;
 *   name: string;
 *   email: string;
 * 
 *   getFullName() { ... }
 *   updateEmail(email: string) { ... }
 * }
 * 
 * class UserRepository {
 *   async getUserById(id: number): Promise<User> { ... }
 *   async updateUser(id: number, data: any): Promise<User> { ... }
 *   async deleteUser(id: number): Promise<boolean> { ... }
 * }
 * 
 * ✅ Code tổ chức
 * ✅ Tái sử dụng
 * ✅ Dễ bảo trì
 * ✅ Dễ test
 * ✅ Industry standard
 */

// ============================================================================
// 🔄 OOP TRONG PROJECT NESTJS CỦA BẠN
// ============================================================================

/**
 * Dự án của bạn sử dụng tất cả OOP concepts:
 * 
 * 1️⃣ ENCAPSULATION (app.service.ts):
 *    - Private properties (data của User)
 *    - Public methods (getAllUsers, getUserById, createUser)
 * 
 * 2️⃣ INHERITANCE:
 *    - Guard, Pipe, Interceptor kế thừa từ NestJS base classes
 *    - AuthGuard extends CanActivate
 *    - ValidationPipe extends PipeTransform
 * 
 * 3️⃣ POLYMORPHISM:
 *    - IPaymentGateway interface
 *    - StripeGateway, PayPalGateway implement cùng interface
 *    - Service không cần biết cụ thể là gateway nào
 * 
 * 4️⃣ ABSTRACTION:
 *    - Controller không cần biết Service bên trong
 *    - Service không cần biết Repository bên trong
 *    - Mỗi layer ẩn complexity
 * 
 * ✅ RESULT:
 *    - Code sạch (Clean Architecture)
 *    - Dễ bảo trì
 *    - Dễ test
 *    - Dễ mở rộng
 */

// ============================================================================
// 📚 RELATIONSHIP: OOP → SOLID → CLEAN ARCHITECTURE
// ============================================================================

/**
 * OOP = Paradigm lập trình (cách viết code)
 *   - Dùng classes, objects, inheritance, polymorphism
 * 
 * SOLID = 5 nguyên lý (cách tổ chức classes)
 *   - Single Responsibility
 *   - Open/Closed
 *   - Liskov Substitution
 *   - Interface Segregation
 *   - Dependency Inversion
 * 
 * Clean Architecture = Cách tổ chức toàn bộ project
 *   - Layers: Domain, Application, Infrastructure, Interface
 *   - Áp dụng SOLID trong mỗi layer
 *   - Sử dụng OOP paradigm
 * 
 * Chain của bạn:
 * OOP → SOLID → Clean Architecture → NestJS
 * 
 * Ví dụ:
 * - User class (OOP - class)
 * - UserService có 1 trách nhiệm (SOLID - S)
 * - UserService ở Application layer (Clean Arch)
 * - UserService là @Injectable của NestJS (Framework)
 */

/**
 * ============================================================================
 * KẾT LUẬN
 * ============================================================================
 * 
 * OOP là nền tảng để viết code tốt.
 * SOLID là cách áp dụng OOP tốt.
 * Clean Architecture là cách tổ chức project OOP + SOLID.
 * NestJS là framework giúp implement Clean Architecture dễ dàng.
 * 
 * Dự án của bạn: OOP + SOLID + Clean Architecture + NestJS
 * = Industry-standard, professional code
 * 
 * 4 OOP Concepts:
 * ✅ Encapsulation (ẩn data, expose methods)
 * ✅ Inheritance (kế thừa từ class cha)
 * ✅ Polymorphism (cùng interface, khác implementation)
 * ✅ Abstraction (ẩn complexity, show interface)
 * 
 * 5 SOLID Principles:
 * ✅ Single Responsibility
 * ✅ Open/Closed
 * ✅ Liskov Substitution
 * ✅ Interface Segregation
 * ✅ Dependency Inversion
 * 
 * Clean Architecture Layers:
 * ✅ Domain (entities, value objects)
 * ✅ Application (use cases, orchestration)
 * ✅ Infrastructure (repositories, external services)
 * ✅ Interface (controllers, presenters)
 */

export const OOPConcepts = `
OOP = Object-Oriented Programming

4 Concepts:
1. Encapsulation: Ẩn data, expose qua methods
2. Inheritance: Class con kế thừa từ class cha
3. Polymorphism: Cùng interface, khác implementation
4. Abstraction: Ẩn complexity, show interface

Lợi ích OOP:
✅ Code tổ chức tốt
✅ Tái sử dụng code
✅ Dễ bảo trì
✅ Dễ test
✅ Industry standard

Project của bạn áp dụng OOP đầy đủ!
`;
