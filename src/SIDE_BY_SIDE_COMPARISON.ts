/**
 * ============================================================================
 * SIDE-BY-SIDE COMPARISON: Express vs NestJS
 * ============================================================================
 * 
 * Cùng 1 yêu cầu: UPDATE user profile
 * - Phải xác thực (token)
 * - Phải validate ID (số dương)
 * - Phải validate body (name, email required)
 * - Phải log request/response
 * - Phải handle error nếu user not found
 */

// ============================================================================
// PHÍA TRÁI: EXPRESS (Truyền thống)
// ============================================================================

/*
// ❌ TÀI NẠN: Auth logic lẫn trong handler
// ❌ TÀI NẠN: Validation logic lẫn trong handler
// ❌ TÀI NẠN: Logging logic lẫn trong handler
// ❌ TÀI NẠN: Khó test từng phần riêng

const express = require('express');
const app = express();

app.put('/users/:id', async (req, res) => {
  try {
    // 🔴 LINE 1-10: AUTH LOGIC (lặp ở tất cả handler cần auth)
    const token = req.headers.authorization;
    if (!token) {
      console.log('❌ [AUTH] No token');
      return res.status(401).json({ error: 'Unauthorized' });
    }
    if (!token.startsWith('Bearer ')) {
      console.log('❌ [AUTH] Invalid token format');
      return res.status(401).json({ error: 'Invalid token format' });
    }
    console.log('✅ [AUTH] Token verified');

    // 🔴 LINE 11-20: VALIDATION LOGIC (lặp ở tất cả handler cần validate ID)
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      console.log('❌ [VALIDATION] Invalid ID');
      return res.status(400).json({ error: 'ID must be positive' });
    }
    console.log('✅ [VALIDATION] ID validated:', id);

    // 🔴 LINE 21-25: LOGGING LOGIC (lặp ở tất cả handler)
    const startTime = Date.now();
    console.log(`📍 [REQUEST] PUT /users/${id}`);

    // 🟢 LINE 26-40: BUSINESS LOGIC (đây mới là cái thực sự quan trọng)
    const { name, email } = req.body;
    if (!name || !email) {
      console.log('❌ [VALIDATION] Missing name or email');
      return res.status(400).json({ error: 'name & email required' });
    }

    const user = await database.updateUser(id, { name, email });
    if (!user) {
      console.log('❌ [DB] User not found');
      return res.status(404).json({ error: 'User not found' });
    }
    console.log('✅ [DB] User updated:', user);

    // 🔴 LINE 41-45: LOGGING RESPONSE (lặp ở tất cả handler)
    const duration = Date.now() - startTime;
    console.log(`📊 [RESPONSE] ${duration}ms`);
    console.log('Response data:', user);

    res.json(user);

  } catch (error) {
    // 🔴 LINE 46-50: ERROR HANDLING (catch-all không rõ ràng)
    console.error('❌ [ERROR]', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ❌ TỔNG CỘNG: ~50 dòng chỉ để handle 1 route
// ❌ Nếu có 10 route PUT/POST → 500 dòng (lặp auth, validation, logging)
// ❌ Nếu thay đổi auth method → phải sửa 50 route
*/

// ============================================================================
// PHÍA PHẢI: NestJS
// ============================================================================

/*
// ✅ AUTH: tách riêng trong AuthGuard
// ✅ VALIDATION: tách riêng trong ValidationPipe
// ✅ LOGGING: tách riêng trong LoggingInterceptor
// ✅ DỄ TEST: test từng phần riêng biệt

// 📁 FILE 1: auth.guard.ts (viết 1 lần, dùng ở 100 handler)
// ─────────────────────────────────────────────────────────
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization;
    
    if (!token) {
      console.log('❌ [AuthGuard] No token');
      throw new UnauthorizedException('Unauthorized');
    }
    if (!token.startsWith('Bearer ')) {
      console.log('❌ [AuthGuard] Invalid format');
      throw new UnauthorizedException('Invalid token format');
    }
    console.log('✅ [AuthGuard] Token verified');
    return true;
  }
}
// ✅ 15 dòng, viết 1 lần → dùng mọi chỗ

// 📁 FILE 2: validation.pipe.ts (viết 1 lần, dùng ở tất cả param)
// ──────────────────────────────────────────────────────────────
@Injectable()
export class ValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type === 'param' && metadata.data === 'id') {
      const id = parseInt(value, 10);
      if (isNaN(id) || id <= 0) {
        console.log('❌ [ValidationPipe] Invalid ID');
        throw new BadRequestException('ID must be positive');
      }
      console.log('✅ [ValidationPipe] ID validated:', id);
      return id;
    }
    return value;
  }
}
// ✅ 15 dòng, viết 1 lần → dùng mọi chỗ

// 📁 FILE 3: logging.interceptor.ts (viết 1 lần, dùng ở tất cả handler)
// ────────────────────────────────────────────────────────────────────
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();
    
    console.log(`📍 [Interceptor-Before] ${request.method} ${request.url}`);
    
    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        console.log(`📊 [Interceptor-After] ${duration}ms`);
        console.log('Response:', data);
      }),
    );
  }
}
// ✅ 20 dòng, viết 1 lần → dùng mọi chỗ

// 📁 FILE 4: app.controller.ts (SẠCH! chỉ business logic)
// ──────────────────────────────────────────────────────
@Controller()
@UseInterceptors(LoggingInterceptor) // Tự động log tất cả route
export class AppController {
  constructor(private userService: UserService) {}

  @Put('users/:id')
  @UseGuards(AuthGuard)  // ← Tự động check token
  updateUser(
    @Param('id', ValidationPipe) id: number,  // ← Tự động validate ID
    @Body() dto: { name: string; email: string }
  ) {
    // ✅ CHỈ business logic!
    if (!dto.name || !dto.email) {
      throw new BadRequestException('name & email required');
    }

    try {
      const user = await this.userService.updateUser(id, dto);
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return user;
    } catch (error) {
      throw new InternalServerErrorException('DB update failed');
    }
  }
}
// ✅ 20 dòng, SẠCH, DỄ ĐỌC, DỄ TEST

// ✅ TỔNG CỘNG: 15+15+20+20 = 70 dòng cho 1 handler
// ✅ Nếu có 10 handler PUT/POST → 70 + (9 × 5) = 115 dòng (không lặp!)
// ✅ Nếu thay đổi auth method → chỉ sửa AuthGuard (1 chỗ)
*/

// ============================================================================
// 📊 BẢNG SO SÁNH CHI TIẾT
// ============================================================================

/*
┌────────────────────────┬──────────────┬──────────────┐
│ Tiêu chí              │ Express      │ NestJS       │
├────────────────────────┼──────────────┼──────────────┤
│ Dòng code/handler      │ 50           │ 5            │
│ Auth logic lặp lại     │ ✅ (50 nơi)  │ ❌ (1 nơi)   │
│ Validation lặp lại     │ ✅ (50 nơi)  │ ❌ (1 nơi)   │
│ Logging lặp lại        │ ✅ (50 nơi)  │ ❌ (1 nơi)   │
│ Dễ test auth           │ ❌ (lẫn)     │ ✅ (riêng)   │
│ Dễ test validation     │ ❌ (lẫn)     │ ✅ (riêng)   │
│ Dễ test business logic │ ❌ (lẫn)     │ ✅ (riêng)   │
│ Thay đổi auth logic    │ 50 chỗ       │ 1 chỗ        │
│ Risk quên auth         │ Cao (50%)     │ Thấp (0%)    │
│ Developer experience   │ Rối           │ Rõ ràng      │
│ Scaling (100 handler)  │ Nightmare     │ Tuyệt vời    │
└────────────────────────┴──────────────┴──────────────┘
*/

// ============================================================================
// 🎓 LESSONS LEARNED
// ============================================================================

/*
1. TRY-CATCH là để xử lý BUSINESS LOGIC ERRORS
   - Database error
   - API call error
   - Validation error cụ thể của business logic
   
2. GUARD/PIPE/INTERCEPTOR là để xử lý INFRASTRUCTURE CONCERNS
   - Authentication (guard)
   - Input validation (pipe)
   - Logging, monitoring, caching (interceptor)
   
3. CÁCH DÙNG ĐÚNG:
   @Put('users/:id')
   @UseGuards(AuthGuard)                    ← Infrastructure
   @UseInterceptors(LoggingInterceptor)     ← Infrastructure
   updateUser(
     @Param('id', ValidationPipe) id: number,  ← Infrastructure
     @Body() dto: any
   ) {
     try {
       // ← Business logic + error handling
       const result = await this.service.update(id, dto);
       return result;
     } catch (error) {
       throw new InternalServerErrorException();
     }
   }

4. KHÔNG MỊ NHƯ:
   @Put('users/:id')
   updateUser(@Param('id') id: any, @Body() dto: any) {
     // 🔴 AUTH LOGIC (nên dùng Guard!)
     if (!req.headers.authorization) {
       throw new UnauthorizedException();
     }
     
     // 🔴 VALIDATION LOGIC (nên dùng Pipe!)
     if (isNaN(id) || id <= 0) {
       throw new BadRequestException();
     }
     
     // 🔴 LOGGING LOGIC (nên dùng Interceptor!)
     console.log('Request:', id, dto);
     
     // ✅ BUSINESS LOGIC (đây là chỗ cần try-catch)
     try {
       const result = await this.service.update(id, dto);
       return result;
     } catch (error) {
       throw new InternalServerErrorException();
     }
   }
*/

export const ComparisonSideBySide = `
TÓM LẠI:

❌ Express way: Toàn bộ logic trong 1 handler (khó quản lý)
✅ NestJS way: Tách infrastructure concerns ra Guard/Pipe/Interceptor
              + Chỉ để business logic trong handler (dễ quản lý)

Không phải try-catch bị loại bỏ, mà được dùng ĐỘ (ở đúng vị trí)!
`;
