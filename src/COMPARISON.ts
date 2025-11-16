/**
 * ============================================================================
 * SO SÁNH: CODE TRUYỀN THỐNG vs NestJS ARCHITECTURE
 * ============================================================================
 * 
 * Câu hỏi: Có phải Guard/Pipe/Interceptor dễ quản lý hơn try-catch trong 1 hàm?
 * Trả lời: CÓ! Và đây là lý do tại sao.
 */

// ============================================================================
// ❌ CÁCH 1: TRUYỀN THỐNG (1 hàm toàn bộ try-catch)
// ============================================================================

/**
 * Problem: Tất cả logic xử lý trong 1 hàm duy nhất
 * - Auth check
 * - Validation
 * - Logging
 * - Business logic
 * - Error handling
 * 
 * Sau này muốn thay đổi hoặc tái sử dụng → phải copy-paste & modify
 */

// Traditional approach - Express example
/*
app.post('/users/:id', async (req, res) => {
  try {
    // ❌ 1. AUTH CHECK (lẫn vào handler)
    const token = req.headers.authorization;
    if (!token) {
      return res.status(401).json({ error: 'No token' });
    }
    if (!token.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Invalid token format' });
    }
    console.log('Token validated');

    // ❌ 2. VALIDATION (lẫn vào handler)
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'ID must be positive' });
    }
    console.log('ID validated');

    // ❌ 3. LOGGING (lẫn vào handler)
    const startTime = Date.now();
    console.log(`[REQUEST] POST /users/${id}`);

    // ✅ 4. BUSINESS LOGIC (đây mới là cái thực sự cần)
    const body = req.body;
    if (!body.name || !body.email) {
      return res.status(400).json({ error: 'name & email required' });
    }
    
    const user = await database.updateUser(id, body);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // ❌ 5. LOGGING RESPONSE (lẫn vào handler)
    const duration = Date.now() - startTime;
    console.log(`[RESPONSE] POST /users/${id} - ${duration}ms`);
    console.log('Response:', user);

    res.json(user);

  } catch (error) {
    // ❌ 6. ERROR HANDLING (catch cả cái)
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ❌ Vấn đề:
// 1. Handler quá dài, khó đọc
// 2. Auth/validation logic lặp lại ở nhiều handler
// 3. Nếu thay đổi auth logic → phải sửa tất cả handler
// 4. Nếu thêm feature logging → phải thêm code ở tất cả handler
// 5. Khó test từng phần (auth, validation, business logic riêng)
// 6. Try-catch bắt tất cả, khó debug lỗi cụ thể từ đâu
// 7. Không có cách thống nhất để handle error
*/

// ============================================================================
// ✅ CÁCH 2: NestJS (Guard, Pipe, Interceptor)
// ============================================================================

/**
 * Benefit: Tách biệt từng concern (separation of concerns)
 * - Guard: chỉ xử lý AUTH
 * - Pipe: chỉ xử lý VALIDATION
 * - Interceptor: chỉ xử lý LOGGING & MONITORING
 * - Controller: chỉ xử lý BUSINESS LOGIC
 * 
 * Kết quả: Code sạch, dễ bảo trì, dễ test, dễ tái sử dụng
 */

/*
// 1️⃣ AUTH GUARD (tách riêng)
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization;
    
    if (!token) throw new UnauthorizedException('No token');
    if (!token.startsWith('Bearer ')) {
      throw new UnauthorizedException('Invalid token format');
    }
    
    console.log('✅ [Guard] Token validated');
    return true; // ✅ Nếu OK, tiếp tục
  }
}

// 2️⃣ VALIDATION PIPE (tách riêng)
@Injectable()
export class ValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type === 'param' && metadata.data === 'id') {
      const id = parseInt(value, 10);
      if (isNaN(id) || id <= 0) {
        throw new BadRequestException('ID must be positive');
      }
      console.log('✅ [Pipe] ID validated');
      return id;
    }
    return value;
  }
}

// 3️⃣ LOGGING INTERCEPTOR (tách riêng)
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();
    
    console.log(`📍 [Interceptor-Before] ${request.method} ${request.url}`);
    
    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        console.log(`✅ [Interceptor-After] ${duration}ms`);
        console.log('Response:', data);
      }),
    );
  }
}

// 4️⃣ CONTROLLER (chỉ business logic - SẠCH!)
@Controller()
@UseInterceptors(LoggingInterceptor) // Tự động log
export class AppController {
  @Put('users/:id')
  @UseGuards(AuthGuard)              // Tự động xác thực
  updateUser(
    @Param('id', ValidationPipe) id: number,  // Tự động validate
    @Body() updateUserDto: any
  ) {
    // ✅ Chỉ cần viết business logic!
    if (!updateUserDto.name || !updateUserDto.email) {
      throw new BadRequestException('name & email required');
    }
    return this.userService.updateUser(id, updateUserDto);
  }
}
*/

// ============================================================================
// 📊 SO SÁNH CỤ THỂ
// ============================================================================

/**
 * TRUYỀN THỐNG (try-catch)
 * ────────────────────
 * Handler code:     ~30 dòng (khó đọc, lẫn lộn)
 * Auth logic:       lặp ở 10 handler → 100 dòng code
 * Validation:       lặp ở 10 handler → 100 dòng code
 * Logging:          lặp ở 10 handler → 100 dòng code
 * Business logic:   ~50 dòng
 * ────────────────────
 * Total:            ~380 dòng (nhiều!)
 * 
 * Vấn đề:
 * ❌ Lặp lại (DRY violation)
 * ❌ Khó thay đổi auth logic (phải sửa 10 handler)
 * ❌ Khó test (test auth + validation + business + error handling cùng lúc)
 * ❌ Try-catch bắt tất cả, khó debug
 * ❌ Không có cách thống nhất handle error
 * ❌ Team members có thể quên auth ở vài handler
 */

/**
 * NestJS (Guard/Pipe/Interceptor)
 * ─────────────────────────────────
 * AuthGuard:        ~15 dòng (viết 1 lần, dùng ở tất cả handler)
 * ValidationPipe:   ~15 dòng (viết 1 lần, dùng ở tất cả handler)
 * LoggingInterceptor: ~20 dòng (viết 1 lần, dùng ở tất cả handler)
 * Handler (x10):    ~5 dòng × 10 = 50 dòng (siêu sạch!)
 * ─────────────────────────────────
 * Total:            ~100 dòng (ít hơn!)
 * 
 * Lợi ích:
 * ✅ DRY (Don't Repeat Yourself)
 * ✅ Thay đổi auth logic → sửa 1 chỗ (AuthGuard)
 * ✅ Test riêng: test Guard, test Pipe, test Controller (unit test dễ)
 * ✅ Tái sử dụng: AuthGuard dùng ở 100 handler
 * ✅ Structured error handling (ExceptionFilter)
 * ✅ Team members bắt buộc dùng Guard (Decorator @UseGuards)
 * ✅ Developer experience: rõ ràng handler cần auth (@UseGuards) hay không
 */

// ============================================================================
// 🔍 VÍ DỤ THỰC TẾ: Thay đổi Auth Strategy
// ============================================================================

/**
 * TRƯỜNG HỢP: Công ty yêu cầu thay đổi từ Bearer token → JWT token
 * 
 * TRUYỀN THỐNG:
 * ────────────
 * Phải sửa 50 handler trong project → 50 × 5 dòng = 250 dòng code
 * Risk cao: quên sửa handler nào đó → bug bảo mật
 * 
 * NestJS:
 * ───────
 * Chỉ sửa 1 file: AuthGuard.ts → 15 dòng code
 * Tất cả 50 handler tự động có JWT validation
 * Risk thấp: không thể quên
 */

// ============================================================================
// 🎯 KHI NÀO DÙNG GÌ?
// ============================================================================

/**
 * DÙNG GUARD KHI:
 * ✅ Cần check quyền hạn (auth, role, permission)
 * ✅ Logic check này lặp ở nhiều handler
 * ✅ Muốn reject request sớm (trước khi vào handler)
 * VD: AuthGuard, RoleGuard, PermissionGuard
 * 
 * DÙNG PIPE KHI:
 * ✅ Cần validate input
 * ✅ Cần transform data (string → number, normalize, v.v.)
 * ✅ Logic validate này lặp ở nhiều handler
 * VD: ValidationPipe, ParseIntPipe, @Body(new ValidationPipe())
 * 
 * DÙNG INTERCEPTOR KHI:
 * ✅ Cần log request/response
 * ✅ Cần transform response format
 * ✅ Cần monitoring, timing, caching
 * ✅ Cần error handling tập trung
 * VD: LoggingInterceptor, CachingInterceptor, TransformResponseInterceptor
 * 
 * DÙNG TRY-CATCH TRONG HANDLER KHI:
 * ✅ Logic quá phức tạp, không lặp ở handler khác
 * ✅ Cần error handling cụ thể cho handler này
 * ✅ Business logic của handler cần try-catch
 * VD: try { await database.save() } catch { ... }
 */

// ============================================================================
// 💡 BEST PRACTICE
// ============================================================================

/**
 * NestJS không phải là thay thế cho try-catch
 * 
 * Guard/Pipe/Interceptor:
 *   → Xử lý cross-cutting concerns (auth, validation, logging)
 *   → Dễ tái sử dụng, dễ bảo trì
 *   → Không lặp lại code
 * 
 * Try-catch:
 *   → Xử lý business logic exception
 *   → Xử lý async operation errors (database, API calls)
 *   → Xử lý error cụ thể trong handler
 * 
 * HỢP MẠ: Guard/Pipe/Interceptor + try-catch
 * 
 * VD hoàn hảo:
 * @Put('users/:id')
 * @UseGuards(AuthGuard)                    ← Đảm bảo có token
 * updateUser(
 *   @Param('id', ValidationPipe) id: number,  ← Đảm bảo ID hợp lệ
 *   @Body() dto: any
 * ) {
 *   try {
 *     const user = await this.db.updateUser(id, dto);  ← Có thể fail
 *     return user;
 *   } catch (error) {
 *     throw new InternalServerErrorException('DB update failed');
 *   }
 * }
 */

// ============================================================================
// 📈 SCALABILITY
// ============================================================================

/**
 * Dự án nhỏ (5 handlers):
 *   - Truyền thống: OK, chấp được
 *   - NestJS: OK, không quá cần
 * 
 * Dự án vừa (50 handlers):
 *   - Truyền thống: Bắt đầu pain (lặp auth x50, validation x50, logging x50)
 *   - NestJS: Rất tốt (1x AuthGuard + 1x ValidationPipe + 1x LoggingInterceptor)
 * 
 * Dự án lớn (500+ handlers):
 *   - Truyền thống: Nightmare (lặp lại quá nhiều, khó bảo trì)
 *   - NestJS: Tuyệt vời (Guard/Pipe/Interceptor + ExceptionFilter = hoàn hảo)
 */

export const ComparisonSummary = `
NestJS không phải thay thế try-catch, mà là cách tốt hơn để tổ chức code.

📌 Try-catch: dùng cho BUSINESS LOGIC, ASYNC ERRORS
📌 Guard/Pipe/Interceptor: dùng cho CROSS-CUTTING CONCERNS

✅ Lợi ích chính:
  1. DRY (không lặp lại code)
  2. Dễ bảo trì (thay đổi 1 chỗ → áp dụng tất cả handler)
  3. Dễ test (test Guard, Pipe, Controller riêng biệt)
  4. Tái sử dụng (1 AuthGuard dùng ở 100 handler)
  5. Structured error handling
  6. Developer experience (rõ ràng handler cần gì)
`;
