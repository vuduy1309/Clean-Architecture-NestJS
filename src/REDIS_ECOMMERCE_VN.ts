/**
 * ============================================================================
 * REDIS TRONG HỆ THỐNG BÁN HÀNG
 * ============================================================================
 * 
 * Các ứng dụng thực tế của Redis trong một hệ thống e-commerce.
 * Code mẫu với NestJS.
 */

// ============================================================================
// 1️⃣ CACHE GIỎ HÀNG (Shopping Cart)
// ============================================================================

/**
 * VẤN ĐỀ KHÔNG CÓ REDIS:
 * - Mỗi lần lấy giỏ hàng → Query database
 * - User có thể add/remove 50 lần → 50 database queries
 * - Tốc độ chậm, tải database nặng
 * 
 * GIẢI PHÁP DÙNG REDIS:
 * - Lưu giỏ hàng vào Redis (memory)
 * - Chỉ save database khi checkout
 * - Tốc độ cực nhanh
 */

/**
 * ✅ CODE MẪU: Shopping Cart Service
 * 
 * // src/infrastructure/cache/cart-cache.service.ts
 * @Injectable()
 * export class CartCacheService {
 *   constructor(private redisService: RedisService) {}
 * 
 *   // Lưu giỏ hàng vào Redis
 *   async saveCart(userId: number, items: CartItem[]): Promise<void> {
 *     const cacheKey = `cart:${userId}`;
 *     // TTL = 24 giờ (nếu không checkout, giỏ hàng mất)
 *     await this.redisService.set(cacheKey, items, 86400);
 *   }
 * 
 *   // Lấy giỏ hàng từ Redis
 *   async getCart(userId: number): Promise<CartItem[]> {
 *     const cacheKey = `cart:${userId}`;
 *     const cart = await this.redisService.get(cacheKey);
 *     return cart || [];
 *   }
 * 
 *   // Thêm sản phẩm vào giỏ
 *   async addItem(userId: number, item: CartItem): Promise<void> {
 *     const cacheKey = `cart:${userId}`;
 *     const cart = await this.getCart(userId);
 *     
 *     // Kiểm tra sản phẩm đã có chưa
 *     const existingItem = cart.find(i => i.productId === item.productId);
 *     
 *     if (existingItem) {
 *       existingItem.quantity += item.quantity;
 *     } else {
 *       cart.push(item);
 *     }
 *     
 *     await this.saveCart(userId, cart);
 *   }
 * 
 *   // Xóa sản phẩm khỏi giỏ
 *   async removeItem(userId: number, productId: number): Promise<void> {
 *     const cacheKey = `cart:${userId}`;
 *     const cart = await this.getCart(userId);
 *     
 *     // Lọc bỏ sản phẩm
 *     const updatedCart = cart.filter(i => i.productId !== productId);
 *     
 *     if (updatedCart.length === 0) {
 *       // Xóa cache nếu giỏ trống
 *       await this.redisService.delete(cacheKey);
 *     } else {
 *       await this.saveCart(userId, updatedCart);
 *     }
 *   }
 * 
 *   // Xóa toàn bộ giỏ hàng
 *   async clearCart(userId: number): Promise<void> {
 *     const cacheKey = `cart:${userId}`;
 *     await this.redisService.delete(cacheKey);
 *   }
 * }
 * 
 * // src/application/usecases/add-to-cart.usecase.ts
 * @Injectable()
 * export class AddToCartUseCase {
 *   constructor(
 *     private cartCacheService: CartCacheService,
 *     private productRepository: ProductRepository,
 *   ) {}
 * 
 *   async execute(userId: number, productId: number, quantity: number) {
 *     // ✅ Kiểm tra sản phẩm có tồn tại
 *     const product = await this.productRepository.findById(productId);
 *     if (!product) throw new Error('Sản phẩm không tồn tại');
 * 
 *     // ✅ Thêm vào giỏ hàng (lưu Redis)
 *     await this.cartCacheService.addItem(userId, {
 *       productId,
 *       productName: product.name,
 *       price: product.price,
 *       quantity,
 *     });
 * 
 *     return { message: 'Thêm vào giỏ hàng thành công' };
 *   }
 * }
 * 
 * // src/interface/controllers/cart.controller.ts
 * @Controller('cart')
 * export class CartController {
 *   constructor(
 *     private addToCartUseCase: AddToCartUseCase,
 *     private cartCacheService: CartCacheService,
 *   ) {}
 * 
 *   @Get()
 *   async getCart(@Query('userId') userId: number) {
 *     // ✅ Lấy giỏ từ Redis (siêu nhanh!)
 *     return await this.cartCacheService.getCart(userId);
 *   }
 * 
 *   @Post('add')
 *   async addToCart(
 *     @Query('userId') userId: number,
 *     @Body() dto: { productId: number; quantity: number },
 *   ) {
 *     return await this.addToCartUseCase.execute(
 *       userId,
 *       dto.productId,
 *       dto.quantity,
 *     );
 *   }
 * 
 *   @Delete('remove/:productId')
 *   async removeFromCart(
 *     @Query('userId') userId: number,
 *     @Param('productId') productId: number,
 *   ) {
 *     await this.cartCacheService.removeItem(userId, productId);
 *     return { message: 'Xóa khỏi giỏ hàng thành công' };
 *   }
 * }
 * 
 * ✅ BENEFIT:
 * - Giỏ hàng luôn nhanh (không cần query DB)
 * - User thêm/xóa linh hoạt
 * - TTL 24h → tự động xóa nếu không checkout
 * - Giảm tải database 90%
 */

// ============================================================================
// 2️⃣ CACHE SẢN PHẨM (Product Caching)
// ============================================================================

/**
 * VẤN ĐỀ:
 * - Có 10,000 user xem sản phẩm A cùng lúc
 * - 10,000 database queries! (tải nặng)
 * 
 * GIẢI PHÁP:
 * - Cache sản phẩm vào Redis
 * - 10,000 user → 10,000 Redis queries (vô cùng nhanh)
 * - Database chỉ load 1 lần mỗi giờ
 */

/**
 * ✅ CODE MẪU: Product Cache
 * 
 * // src/infrastructure/repositories/product.repository.ts
 * @Injectable()
 * export class ProductRepository {
 *   constructor(
 *     private prisma: PrismaService,
 *     private redisService: RedisService,
 *   ) {}
 * 
 *   // Lấy sản phẩm với cache
 *   async findById(productId: number) {
 *     const cacheKey = `product:${productId}`;
 * 
 *     // ✅ Bước 1: Kiểm tra Redis
 *     const cached = await this.redisService.get(cacheKey);
 *     if (cached) {
 *       console.log('Cache HIT - Product');
 *       return cached;
 *     }
 * 
 *     console.log('Cache MISS - Query Database');
 *     // ✅ Bước 2: Query database nếu không có cache
 *     const product = await this.prisma.product.findUnique({
 *       where: { id: productId },
 *       include: {
 *         category: true,
 *         reviews: true,
 *       },
 *     });
 * 
 *     if (!product) return null;
 * 
 *     // ✅ Bước 3: Lưu vào Redis (TTL = 1 giờ)
 *     await this.redisService.set(cacheKey, product, 3600);
 * 
 *     return product;
 *   }
 * 
 *   // Invalidate cache khi cập nhật sản phẩm
 *   async updateProduct(productId: number, data: any) {
 *     // ✅ Cập nhật database
 *     const product = await this.prisma.product.update({
 *       where: { id: productId },
 *       data,
 *     });
 * 
 *     // ✅ Xóa cache (không còn hợp lệ)
 *     const cacheKey = `product:${productId}`;
 *     await this.redisService.delete(cacheKey);
 * 
 *     return product;
 *   }
 * 
 *   // Lấy danh sách sản phẩm theo category
 *   async findByCategory(categoryId: number) {
 *     const cacheKey = `products:category:${categoryId}`;
 * 
 *     const cached = await this.redisService.get(cacheKey);
 *     if (cached) return cached;
 * 
 *     const products = await this.prisma.product.findMany({
 *       where: { categoryId },
 *       take: 20,
 *     });
 * 
 *     // Cache 2 giờ (vì ít thay đổi)
 *     await this.redisService.set(cacheKey, products, 7200);
 * 
 *     return products;
 *   }
 * }
 * 
 * ✅ BENEFIT:
 * - 10,000 user xem → 1 database query
 * - Tốc độ cực nhanh (0.1ms vs 5-10ms)
 * - Database load giảm 99%
 */

// ============================================================================
// 3️⃣ STOCK KIỂM KÊ (Inventory Management)
// ============================================================================

/**
 * VẤN ĐỀ:
 * - Sản phẩm hot → nhiều user checkout cùng lúc
 * - Race condition: Cùng 1 sản phẩm, 2 user checkout
 * - Có thể oversell (bán vượt tồn kho)
 * 
 * GIẢI PHÁP:
 * - Lưu stock vào Redis (atomic operations)
 * - Đảm bảo consistency
 */

/**
 * ✅ CODE MẪU: Stock Management
 * 
 * // src/infrastructure/services/stock.service.ts
 * @Injectable()
 * export class StockService {
 *   constructor(
 *     private redisService: RedisService,
 *     private productRepository: ProductRepository,
 *   ) {}
 * 
 *   // Lấy số lượng tồn kho
 *   async getStock(productId: number): Promise<number> {
 *     const cacheKey = `stock:${productId}`;
 * 
 *     // ✅ Từ Redis (siêu nhanh)
 *     const stock = await this.redisService.get(cacheKey);
 * 
 *     if (stock !== null) {
 *       return stock as number;
 *     }
 * 
 *     // ✅ Nếu chưa cache, load từ database
 *     const product = await this.productRepository.findById(productId);
 *     await this.redisService.set(cacheKey, product.stock, 1800); // 30 phút
 * 
 *     return product.stock;
 *   }
 * 
 *   // Kiểm tra có sẵn hàng không
 *   async hasStock(productId: number, quantity: number): Promise<boolean> {
 *     const stock = await this.getStock(productId);
 *     return stock >= quantity;
 *   }
 * 
 *   // ✅ Giảm stock (ATOMIC operation)
 *   async decrementStock(productId: number, quantity: number): Promise<boolean> {
 *     const cacheKey = `stock:${productId}`;
 * 
 *     // ✅ Kiểm tra & giảm trong 1 lệnh (không race condition)
 *     const result = await this.redisService.decrBy(cacheKey, quantity);
 * 
 *     if (result < 0) {
 *       // Rollback nếu không đủ hàng
 *       await this.redisService.incrBy(cacheKey, quantity);
 *       return false;
 *     }
 * 
 *     // ✅ Update database asynchronously
 *     this.updateStockInDatabase(productId, result);
 * 
 *     return true;
 *   }
 * 
 *   // ✅ Tăng stock (hoàn trả)
 *   async incrementStock(productId: number, quantity: number): Promise<void> {
 *     const cacheKey = `stock:${productId}`;
 *     await this.redisService.incrBy(cacheKey, quantity);
 *     this.updateStockInDatabase(productId, quantity);
 *   }
 * 
 *   // Cập nhật database async
 *   private async updateStockInDatabase(
 *     productId: number,
 *     stock: number,
 *   ): Promise<void> {
 *     // Delay để không block user
 *     setTimeout(async () => {
 *       await this.productRepository.updateStock(productId, stock);
 *     }, 1000);
 *   }
 * }
 * 
 * // src/application/usecases/checkout.usecase.ts
 * @Injectable()
 * export class CheckoutUseCase {
 *   constructor(
 *     private stockService: StockService,
 *     private orderRepository: OrderRepository,
 *     private cartCacheService: CartCacheService,
 *   ) {}
 * 
 *   async execute(userId: number) {
 *     // ✅ Lấy giỏ hàng
 *     const cart = await this.cartCacheService.getCart(userId);
 *     if (cart.length === 0) throw new Error('Giỏ hàng trống');
 * 
 *     // ✅ Kiểm tra stock tất cả sản phẩm
 *     for (const item of cart) {
 *       const hasStock = await this.stockService.hasStock(
 *         item.productId,
 *         item.quantity,
 *       );
 *       if (!hasStock) {
 *         throw new Error(`${item.productName} không đủ hàng`);
 *       }
 *     }
 * 
 *     // ✅ Giảm stock tất cả sản phẩm (atomic)
 *     for (const item of cart) {
 *       const ok = await this.stockService.decrementStock(
 *         item.productId,
 *         item.quantity,
 *       );
 *       if (!ok) {
 *         throw new Error(`${item.productName} hết hàng`);
 *       }
 *     }
 * 
 *     // ✅ Tạo đơn hàng
 *     const order = await this.orderRepository.create({
 *       userId,
 *       items: cart,
 *       totalPrice: cart.reduce((sum, i) => sum + i.price * i.quantity, 0),
 *     });
 * 
 *     // ✅ Xóa giỏ hàng
 *     await this.cartCacheService.clearCart(userId);
 * 
 *     return order;
 *   }
 * }
 * 
 * ✅ BENEFIT:
 * - Đảm bảo không oversell
 * - Tốc độ checkout cực nhanh
 * - Không race condition (atomic operations)
 */

// ============================================================================
// 4️⃣ RATE LIMITING (Chống lạm dụng API)
// ============================================================================

/**
 * VẤN ĐỀ:
 * - Bot spam gửi 10,000 requests/giây
 * - Làm crash server
 * 
 * GIẢI PHÁP:
 * - Giới hạn requests bằng Redis
 * - Max 100 requests/phút per user
 */

/**
 * ✅ CODE MẪU: Rate Limiting
 * 
 * // src/infrastructure/services/rate-limit.service.ts
 * @Injectable()
 * export class RateLimitService {
 *   constructor(private redisService: RedisService) {}
 * 
 *   // Kiểm tra rate limit
 *   async checkRateLimit(
 *     userId: number,
 *     action: string,
 *     maxRequests: number = 100,
 *     windowSeconds: number = 60,
 *   ): Promise<{ allowed: boolean; remaining: number }> {
 *     const key = `rate_limit:${userId}:${action}`;
 * 
 *     // ✅ Tăng counter
 *     const count = await this.redisService.incr(key);
 * 
 *     // ✅ Nếu lần đầu, set TTL
 *     if (count === 1) {
 *       await this.redisService.expire(key, windowSeconds);
 *     }
 * 
 *     const remaining = Math.max(0, maxRequests - count);
 * 
 *     return {
 *       allowed: count <= maxRequests,
 *       remaining,
 *     };
 *   }
 * }
 * 
 * // src/interface/middlewares/rate-limit.middleware.ts
 * @Injectable()
 * export class RateLimitMiddleware implements NestMiddleware {
 *   constructor(private rateLimitService: RateLimitService) {}
 * 
 *   async use(req: Request, res: Response, next: NextFunction) {
 *     const userId = req.user?.id || req.ip;
 * 
 *     // ✅ Kiểm tra rate limit
 *     const { allowed, remaining } = await this.rateLimitService.checkRateLimit(
 *       userId,
 *       'api_call',
 *       100,
 *       60,
 *     );
 * 
 *     // ✅ Thêm header cho client
 *     res.setHeader('X-RateLimit-Remaining', remaining);
 * 
 *     if (!allowed) {
 *       return res.status(429).json({
 *         error: 'Quá nhiều request. Vui lòng thử lại sau.',
 *       });
 *     }
 * 
 *     next();
 *   }
 * }
 * 
 * ✅ BENEFIT:
 * - Chặn bot spam
 * - Bảo vệ API
 * - User xấu không thể crush server
 */

// ============================================================================
// 5️⃣ COUPON/PROMOTION (Khuyến mãi)
// ============================================================================

/**
 * VẤN ĐỀ:
 * - Flash sale: 10,000 user dùng 1 mã giảm giá cùng lúc
 * - Database không đủ nhanh để kiểm tra
 * - Có thể dùng coupon quá số lần cho phép
 * 
 * GIẢI PHÁP:
 * - Lưu coupon vào Redis
 * - Tăng counter mỗi lần dùng
 */

/**
 * ✅ CODE MẪU: Coupon Management
 * 
 * // src/infrastructure/services/coupon.service.ts
 * @Injectable()
 * export class CouponService {
 *   constructor(
 *     private redisService: RedisService,
 *     private couponRepository: CouponRepository,
 *   ) {}
 * 
 *   // Lấy thông tin coupon
 *   async getCoupon(couponCode: string) {
 *     const cacheKey = `coupon:${couponCode}`;
 * 
 *     let coupon = await this.redisService.get(cacheKey);
 * 
 *     if (!coupon) {
 *       // Load từ database
 *       coupon = await this.couponRepository.findByCode(couponCode);
 *       if (!coupon) throw new Error('Mã khuyến mãi không tồn tại');
 * 
 *       // Cache 1 ngày
 *       await this.redisService.set(cacheKey, coupon, 86400);
 *     }
 * 
 *     return coupon;
 *   }
 * 
 *   // Kiểm tra coupon còn dùng được không
 *   async validateCoupon(couponCode: string): Promise<boolean> {
 *     const coupon = await this.getCoupon(couponCode);
 * 
 *     // ✅ Kiểm tra hạn sử dụng
 *     if (coupon.expiresAt < new Date()) {
 *       return false;
 *     }
 * 
 *     // ✅ Kiểm tra số lần dùng còn lại
 *     const usageKey = `coupon_usage:${couponCode}`;
 *     const usageCount = await this.redisService.get(usageKey);
 *     const usedCount = (usageCount as number) || 0;
 * 
 *     if (usedCount >= coupon.maxUsage) {
 *       return false; // Hết số lần dùng
 *     }
 * 
 *     return true;
 *   }
 * 
 *   // Sử dụng coupon (tăng counter)
 *   async useCoupon(couponCode: string): Promise<void> {
 *     // ✅ Kiểm tra có còn dùng được không
 *     const isValid = await this.validateCoupon(couponCode);
 *     if (!isValid) throw new Error('Không thể dùng mã khuyến mãi này');
 * 
 *     // ✅ Tăng counter (atomic)
 *     const usageKey = `coupon_usage:${couponCode}`;
 *     await this.redisService.incr(usageKey);
 * 
 *     // ✅ Update database asynchronously
 *     this.updateCouponUsageInDatabase(couponCode);
 *   }
 * 
 *   private async updateCouponUsageInDatabase(couponCode: string): Promise<void> {
 *     setTimeout(async () => {
 *       const usageKey = `coupon_usage:${couponCode}`;
 *       const count = await this.redisService.get(usageKey);
 *       await this.couponRepository.updateUsageCount(couponCode, count);
 *     }, 500);
 *   }
 * }
 * 
 * ✅ BENEFIT:
 * - Flash sale: 10,000 user → 10,000 Redis queries (instant)
 * - Không dùng quá số lần
 * - Database không bị tải nặng
 */

// ============================================================================
// 6️⃣ SESSION STORE (Lưu phiên đăng nhập)
// ============================================================================

/**
 * VẤN ĐỀ:
 * - Mỗi API call kiểm tra user có đăng nhập không
 * - Query database mỗi lần = chậm
 * 
 * GIẢI PHÁP:
 * - Lưu session vào Redis
 * - Kiểm tra nhanh tức thì
 */

/**
 * ✅ CODE MẪU: Session Store
 * 
 * // src/infrastructure/services/session.service.ts
 * @Injectable()
 * export class SessionService {
 *   constructor(
 *     private redisService: RedisService,
 *     private userRepository: UserRepository,
 *   ) {}
 * 
 *   // Tạo session (đăng nhập)
 *   async createSession(userId: number, token: string): Promise<void> {
 *     const sessionKey = `session:${token}`;
 *     
 *     // ✅ Lưu session data vào Redis
 *     const user = await this.userRepository.findById(userId);
 *     
 *     await this.redisService.set(
 *       sessionKey,
 *       {
 *         userId: user.id,
 *         email: user.email,
 *         role: user.role,
 *         loginTime: new Date(),
 *       },
 *       86400, // 24 giờ
 *     );
 *   }
 * 
 *   // Kiểm tra session (mỗi API call)
 *   async validateSession(token: string): Promise<any> {
 *     const sessionKey = `session:${token}`;
 *     
 *     // ✅ Lấy từ Redis (0.1ms!)
 *     const session = await this.redisService.get(sessionKey);
 *     
 *     if (!session) {
 *       throw new Error('Session hết hạn hoặc không hợp lệ');
 *     }
 * 
 *     return session;
 *   }
 * 
 *   // Xóa session (đăng xuất)
 *   async destroySession(token: string): Promise<void> {
 *     const sessionKey = `session:${token}`;
 *     await this.redisService.delete(sessionKey);
 *   }
 * }
 * 
 * // src/interface/guards/auth.guard.ts
 * @Injectable()
 * export class AuthGuard implements CanActivate {
 *   constructor(private sessionService: SessionService) {}
 * 
 *   async canActivate(context: ExecutionContext): Promise<boolean> {
 *     const request = context.switchToHttp().getRequest();
 *     const token = request.headers.authorization?.split(' ')[1];
 * 
 *     if (!token) {
 *       throw new UnauthorizedException('Không có token');
 *     }
 * 
 *     // ✅ Kiểm tra session (siêu nhanh từ Redis)
 *     const session = await this.sessionService.validateSession(token);
 *     request.user = session;
 * 
 *     return true;
 *   }
 * }
 * 
 * ✅ BENEFIT:
 * - Kiểm tra user đăng nhập cực nhanh (0.1ms)
 * - Database không bị tải
 * - User experience tốt
 */

// ============================================================================
// 7️⃣ THỐNG KÊ THỜI GIAN THỰC (Real-time Analytics)
// ============================================================================

/**
 * VẤN ĐỀ:
 * - Muốn xem số lượng khách xem sản phẩm / giờ
 * - Query database mỗi lần = chậm & tốn resource
 * 
 * GIẢI PHÁP:
 * - Dùng Redis Counter để đếm
 * - Thống kê real-time tức thì
 */

/**
 * ✅ CODE MẪU: Analytics
 * 
 * // src/infrastructure/services/analytics.service.ts
 * @Injectable()
 * export class AnalyticsService {
 *   constructor(private redisService: RedisService) {}
 * 
 *   // Ghi nhận khi user xem sản phẩm
 *   async trackProductView(productId: number): Promise<void> {
 *     const today = new Date().toISOString().split('T')[0];
 *     const viewKey = `product_views:${productId}:${today}`;
 *     
 *     // ✅ Tăng counter
 *     await this.redisService.incr(viewKey);
 * 
 *     // ✅ TTL = 30 ngày (tự động xóa sau 30 ngày)
 *     await this.redisService.expire(viewKey, 2592000);
 *   }
 * 
 *   // Lấy số lần xem hôm nay
 *   async getViewsToday(productId: number): Promise<number> {
 *     const today = new Date().toISOString().split('T')[0];
 *     const viewKey = `product_views:${productId}:${today}`;
 *     
 *     const count = await this.redisService.get(viewKey);
 *     return (count as number) || 0;
 *   }
 * 
 *   // Ghi nhận khi user click mua
 *   async trackCheckout(productId: number): Promise<void> {
 *     const today = new Date().toISOString().split('T')[0];
 *     const checkoutKey = `checkouts:${productId}:${today}`;
 *     
 *     await this.redisService.incr(checkoutKey);
 *     await this.redisService.expire(checkoutKey, 2592000);
 *   }
 * 
 *   // Conversion rate = checkout / view
 *   async getConversionRate(productId: number): Promise<number> {
 *     const views = await this.getViewsToday(productId);
 *     const today = new Date().toISOString().split('T')[0];
 *     const checkoutKey = `checkouts:${productId}:${today}`;
 *     const checkouts = (await this.redisService.get(checkoutKey)) || 0;
 * 
 *     if (views === 0) return 0;
 *     return ((checkouts as number) / views) * 100;
 *   }
  * }
 * 
 * // src/interface/controllers/analytics.controller.ts
 * @Controller('analytics')
 * export class AnalyticsController {
 *   constructor(private analyticsService: AnalyticsService) {}
 * 
 *   @Get('product/:id')
 *   async getProductAnalytics(@Param('id') productId: number) {
 *     return {
 *       views: await this.analyticsService.getViewsToday(productId),
 *       conversionRate: await this.analyticsService.getConversionRate(productId),
 *     };
 *   }
 * }
 * 
 * ✅ BENEFIT:
 * - Thống kê real-time (không cần query DB)
 * - Cực nhanh & chính xác
 * - Dashboard có thể cập nhật liên tục
 */

// ============================================================================
// 📊 TÓM TẮT CÁC ỨNG DỤNG REDIS TRONG E-COMMERCE
// ============================================================================

/**
 * 1. GIỎ HÀNG (Shopping Cart)
 *    - Cache giỏ hàng 24h
 *    - Add/remove nhanh tức thì
 *    - Benefit: Database tải nhẹ 90%
 * 
 * 2. SẢN PHẨM (Product Caching)
 *    - Cache thông tin sản phẩm 1 giờ
 *    - 10,000 user xem → 1 database query
 *    - Benefit: Tốc độ siêu nhanh
 * 
 * 3. STOCK (Tồn kho)
 *    - Kiểm tra & giảm stock atomic
 *    - Không oversell
 *    - Benefit: Đảm bảo consistency
 * 
 * 4. RATE LIMITING (Chống spam)
 *    - Max 100 requests/phút per user
 *    - Chặn bot tự động
 *    - Benefit: Bảo vệ server
 * 
 * 5. COUPON (Mã khuyến mãi)
 *    - Flash sale: 10,000 user cùng lúc
 *    - Đếm số lần dùng
 *    - Benefit: Xử lý high concurrency
 * 
 * 6. SESSION (Phiên đăng nhập)
 *    - Lưu user session 24h
 *    - Kiểm tra auth cực nhanh (0.1ms)
 *    - Benefit: User experience tốt
 * 
 * 7. ANALYTICS (Thống kê)
 *    - Đếm lượt xem real-time
 *    - Conversion rate tức thì
 *    - Benefit: Dashboard live updates
 */

// ============================================================================
// 🎯 KHI NÀO DÙNG REDIS
// ============================================================================

/**
 * DÙNG REDIS KHI:
 * ✅ Dữ liệu thay đổi ít (có thể cache lâu)
 * ✅ Cần tốc độ cực nhanh (real-time)
 * ✅ High concurrency (nhiều user cùng lúc)
 * ✅ Temporary data (không cần lâu dài)
 * ✅ Real-time tracking (analytics, counters)
 * 
 * KHÔNG DÙNG REDIS KHI:
 * ❌ Dữ liệu thay đổi thường xuyên
 * ❌ Cần persistence (lưu lâu dài)
 * ❌ Dữ liệu > RAM có sẵn
 * ❌ Không cần tốc độ siêu cao
 */

export const RedisInEcommerce = `
REDIS TRONG HỆ THỐNG BÁN HÀNG

1️⃣ GIỎ HÀNG:
- Cache 24h → User thêm/xóa linh hoạt
- Benefit: Database tải nhẹ, checkout nhanh

2️⃣ SẢN PHẨM:
- Cache 1 giờ → 10,000 user = 1 DB query
- Benefit: Tốc độ 100x nhanh hơn

3️⃣ STOCK:
- Atomic operations → Không oversell
- Benefit: Đảm bảo consistency

4️⃣ RATE LIMITING:
- Max 100 requests/phút
- Benefit: Chặn bot spam tự động

5️⃣ COUPON:
- Flash sale 10,000 user cùng lúc
- Benefit: Xử lý high concurrency

6️⃣ SESSION:
- Auth check cực nhanh (0.1ms)
- Benefit: User experience tốt

7️⃣ ANALYTICS:
- Real-time counters & statistics
- Benefit: Dashboard live updates

KINH NGHIỆM:
✅ Cache = Reduce DB queries → Performance
✅ Counters = Real-time tracking → Analytics
✅ Sessions = Fast auth check → UX
✅ Stock = Atomic operations → Consistency
✅ LUÔN SET TTL → Prevent memory bloat

KẾT LUẬN:
Redis là "bộ não" của hệ thống e-commerce
- Tốc độ siêu nhanh (microseconds)
- Xử lý high concurrency (10,000 concurrent)
- Real-time tracking & notifications
- Giảm tải database 90%+

Combine: Prisma (Database) + Redis (Cache) = Perfect!
`;
