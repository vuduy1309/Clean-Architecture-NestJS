/**
 * ============================================================================
 * NestJS REQUEST-RESPONSE LIFECYCLE - HƯỚNG DẪN CHI TIẾT
 * ============================================================================
 * 
 * Khi một HTTP request gửi đến ứng dụng NestJS, nó sẽ đi qua các giai đoạn
 * theo thứ tự sau. Hiểu rõ lifecycle này giúp bạn dùng đúng công cụ
 * (Guard, Pipe, Interceptor) cho từng trường hợp.
 */

/**
 * ============================================================================
 * 1️⃣ REQUEST NHẬN VÀO
 * ============================================================================
 * 
 * Client gửi HTTP request tới server.
 * VD: GET /users/123 HTTP/1.1
 *     Authorization: Bearer token123
 *     Content-Type: application/json
 * 
 * Server nhận request qua Express/Fastify layer.
 */

/**
 * ============================================================================
 * 2️⃣ GLOBAL MIDDLEWARE (nếu có)
 * ============================================================================
 * 
 * Middleware là hàm chạy TRƯỚC controllers.
 * Middleware toàn cục được đăng ký ở app.module.ts hoặc main.ts.
 * 
 * VD: CORS middleware, request logging, body parser
 * 
 * main.ts:
 * --------
 * async function bootstrap() {
 *   const app = await NestFactory.create(AppModule);
 *   
 *   // Middleware toàn cục
 *   app.use((req, res, next) => {
 *     console.log(`[MIDDLEWARE] ${req.method} ${req.path}`);
 *     next();
 *   });
 *   
 *   await app.listen(3000);
 * }
 */

/**
 * ============================================================================
 * 3️⃣ GUARD - Kiểm tra quyền hạn, xác thực
 * ============================================================================
 * 
 * Guard chạy SAU middleware, TRƯỚC pipe.
 * Guard trả về boolean:
 *   - true: tiếp tục request
 *   - false hoặc throw exception: reject request
 * 
 * TIMING: REQUEST → MIDDLEWARE → GUARD → ...
 * 
 * Trường hợp dùng Guard:
 *   1. AuthGuard: Kiểm tra token có hợp lệ không
 *   2. RoleGuard: Kiểm tra user có role cần thiết không
 *   3. PermissionGuard: Kiểm tra quyền cụ thể
 * 
 * VD AuthGuard:
 * --------
 * @Injectable()
 * export class AuthGuard implements CanActivate {
 *   canActivate(context: ExecutionContext): boolean {
 *     const request = context.switchToHttp().getRequest();
 *     const token = request.headers.authorization;
 *     
 *     if (!token) {
 *       throw new UnauthorizedException('Không có token');
 *     }
 *     return true;
 *   }
 * }
 * 
 * Dùng trong controller:
 * @Get('users/:id')
 * @UseGuards(AuthGuard)
 * getUserById(@Param('id') id: number) { ... }
 * 
 * Kết quả:
 *   - Nếu không có token: HTTP 401 Unauthorized
 *   - Nếu có token hợp lệ: tiếp tục
 */

/**
 * ============================================================================
 * 4️⃣ PIPE - Validate & Transform dữ liệu
 * ============================================================================
 * 
 * Pipe chạy SAU guard, TRƯỚC interceptor.
 * Pipe nhận input (body, params, query, ...) và:
 *   - Validate: kiểm tra dữ liệu hợp lệ
 *   - Transform: chuyển đổi dữ liệu
 * 
 * Nếu Pipe reject → throw BadRequestException
 * 
 * TIMING: REQUEST → MIDDLEWARE → GUARD → PIPE → ...
 * 
 * Trường hợp dùng Pipe:
 *   1. Validate ID là số dương
 *   2. Trim/uppercase string
 *   3. Parse query string thành object
 *   4. Validate email format
 * 
 * VD ValidationPipe:
 * --------
 * @Injectable()
 * export class ValidationPipe implements PipeTransform {
 *   transform(value: any, metadata: ArgumentMetadata) {
 *     if (metadata.type === 'param' && metadata.data === 'id') {
 *       const id = parseInt(value, 10);
 *       if (isNaN(id) || id <= 0) {
 *         throw new BadRequestException('ID phải > 0');
 *       }
 *       return id; // Transform string → number
 *     }
 *     return value;
 *   }
 * }
 * 
 * Dùng trong controller:
 * @Get('users/:id')
 * @UseGuards(AuthGuard)
 * getUserById(@Param('id', ValidationPipe) id: number) {
 *   // id đã được validate và transform thành number
 * }
 * 
 * Kết quả:
 *   - /users/123 → id = 123 (number) ✅
 *   - /users/abc → HTTP 400 Bad Request ❌
 *   - /users/0 → HTTP 400 Bad Request ❌
 */

/**
 * ============================================================================
 * 5️⃣ INTERCEPTOR BEFORE - Xử lý trước khi vào controller
 * ============================================================================
 * 
 * Interceptor chạy SAU pipe, TRƯỚC controller method.
 * Interceptor nhận ExecutionContext và CallHandler.
 * 
 * TIMING: REQUEST → MIDDLEWARE → GUARD → PIPE → INTERCEPTOR_BEFORE → ...
 * 
 * Trường hợp dùng Interceptor (before phase):
 *   1. Logging request
 *   2. Caching check (return cached data nếu có)
 *   3. Transform request data
 *   4. Add metadata
 * 
 * VD LoggingInterceptor (before):
 * --------
 * @Injectable()
 * export class LoggingInterceptor implements NestInterceptor {
 *   intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
 *     const request = context.switchToHttp().getRequest();
 *     const startTime = Date.now();
 *     
 *     console.log(`[INTERCEPTOR-BEFORE] ${request.method} ${request.url}`);
 *     
 *     // Gọi controller method
 *     return next.handle().pipe(
 *       tap((data) => {
 *         const duration = Date.now() - startTime;
 *         console.log(`[INTERCEPTOR-AFTER] ${duration}ms`);
 *       }),
 *     );
 *   }
 * }
 * 
 * Dùng trong controller:
 * @Get('users')
 * @UseInterceptors(LoggingInterceptor)
 * getAllUsers() { ... }
 */

/**
 * ============================================================================
 * 6️⃣ CONTROLLER METHOD - Xử lý request
 * ============================================================================
 * 
 * TIMING: ... → CONTROLLER_METHOD → ...
 * 
 * Controller method nhận dữ liệu từ request (đã được validate bởi pipe).
 * Gọi service để xử lý logic, sau đó trả về response.
 * 
 * VD:
 * @Get('users/:id')
 * @UseGuards(AuthGuard)
 * getUserById(@Param('id', ValidationPipe) id: number) {
 *   // Tại điểm này:
 *   // - Guard đã xác thực ✅
 *   // - Pipe đã validate id ✅
 *   // - Interceptor before đã log ✅
 *   
 *   const user = this.appService.getUserById(id);
 *   return user; // Trả về object
 * }
 * 
 * NestJS tự động serialize object thành JSON.
 */

/**
 * ============================================================================
 * 7️⃣ SERVICE - Logic nghiệp vụ
 * ============================================================================
 * 
 * Service xử lý logic thực tế.
 * Có thể query database, call external APIs, v.v.
 * 
 * VD:
 * @Injectable()
 * export class AppService {
 *   getUserById(id: number): User {
 *     const user = this.database.find(id);
 *     if (!user) throw new NotFoundException('User not found');
 *     return user;
 *   }
 * }
 */

/**
 * ============================================================================
 * 8️⃣ RESPONSE DATA TRỞ LẠI CONTROLLER
 * ============================================================================
 * 
 * Service trả dữ liệu về controller.
 * Controller return dữ liệu.
 * 
 * VD response:
 * {
 *   "id": 123,
 *   "name": "John",
 *   "email": "john@example.com"
 * }
 */

/**
 * ============================================================================
 * 9️⃣ INTERCEPTOR AFTER - Xử lý sau khi controller return
 * ============================================================================
 * 
 * Interceptor chạy TIẾP THEO khi controller method return.
 * Thường dùng trong tap() của RxJS observable.
 * 
 * TIMING: ... → CONTROLLER_METHOD_RETURN → INTERCEPTOR_AFTER → ...
 * 
 * Trường hợp dùng Interceptor (after phase):
 *   1. Log response data
 *   2. Transform response format
 *   3. Wrap response trong object { data, status }
 *   4. Handle errors
 * 
 * VD:
 * intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
 *   return next.handle().pipe(
 *     tap((data) => {
 *       // Sau khi controller return
 *       console.log('Response:', data);
 *       return { success: true, data };
 *     }),
 *   );
 * }
 * 
 * Response client nhận:
 * {
 *   "success": true,
 *   "data": { "id": 123, "name": "John", ... }
 * }
 */

/**
 * ============================================================================
 * 🔟 EXCEPTION FILTER - Xử lý lỗi
 * ============================================================================
 * 
 * Nếu trong quá trình (guard, pipe, controller, service, interceptor)
 * có exception được throw, ExceptionFilter sẽ bắt.
 * 
 * VD:
 * @Catch(HttpException)
 * export class HttpExceptionFilter implements ExceptionFilter {
 *   catch(exception: HttpException, host: ArgumentsHost) {
 *     const ctx = host.switchToHttp();
 *     const response = ctx.getResponse<Response>();
 *     const status = exception.getStatus();
 *     const message = exception.getResponse();
 *     
 *     response.status(status).json({
 *       statusCode: status,
 *       message,
 *       timestamp: new Date(),
 *     });
 *   }
 * }
 * 
 * VD exception:
 * - Guard throw UnauthorizedException → 401
 * - Pipe throw BadRequestException → 400
 * - Service throw NotFoundException → 404
 * - Service throw ForbiddenException → 403
 */

/**
 * ============================================================================
 * 1️⃣1️⃣ RESPONSE GỬI TỚI CLIENT
 * ============================================================================
 * 
 * NestJS serializes response thành JSON.
 * HTTP Headers được set (Content-Type: application/json, etc.)
 * Response body được gửi.
 * 
 * Client nhận HTTP 200 OK với body:
 * {
 *   "id": 123,
 *   "name": "John",
 *   "email": "john@example.com"
 * }
 */

/**
 * ============================================================================
 * 📊 TIMELINE TỔNG QUÁT
 * ============================================================================
 * 
 * GET /users/123 (với Authorization header)
 * 
 * Time  | Stage
 * ------|--------------------------------------------------
 * 0ms   | Request nhận vào (Express layer)
 * 1ms   | Middleware toàn cục chạy
 * 2ms   | Guard kiểm tra token ✅
 * 3ms   | Pipe validate ID → transform thành number
 * 4ms   | Interceptor before log request
 * 5ms   | ⭐ Controller.getUserById(123) gọi
 * 6ms   | Service.getUserById(123) query DB
 * 10ms  | Service return { id: 123, name: "John" }
 * 11ms  | Interceptor after log response
 * 12ms  | Response JSON được tạo
 * 13ms  | Client nhận 200 OK + JSON body
 * 
 * ✅ Total: 13ms
 */

/**
 * ============================================================================
 * 🎯 QUICK DECISION TREE - DÙNG CÁI NÀO?
 * ============================================================================
 * 
 * 1. Kiểm tra xác thực? → GUARD
 *    VD: Có token không? Có session không?
 * 
 * 2. Validate dữ liệu input? → PIPE
 *    VD: ID phải là số? Email format đúng?
 * 
 * 3. Logging, monitoring, timing? → INTERCEPTOR
 *    VD: Log request/response, đo thời gian xử lý
 * 
 * 4. Caching response? → INTERCEPTOR
 *    VD: Nếu có cached data, return luôn không cần gọi controller
 * 
 * 5. Transform response format? → INTERCEPTOR
 *    VD: Wrap trong { data, status, timestamp }
 * 
 * 6. Handle exception globally? → EXCEPTION FILTER
 *    VD: Catch tất cả UnauthorizedException, format error response
 */

export const LifecycleExplanation = 'Xem comments trong file này để hiểu lifecycle';
