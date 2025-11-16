/**
 * ============================================================================
 * HANDS-ON EXAMPLE: NestJS vs Try-Catch
 * ============================================================================
 * 
 * Yêu cầu: Xây dựng hệ thống user với:
 * - 3 routes: GET /users, POST /users, PUT /users/:id
 * - Mỗi route cần auth, validation, logging
 * 
 * So sánh: Nếu dùng Express + try-catch vs NestJS
 */

// ============================================================================
// SCENARIO 1: Sử dụng TRY-CATCH (Express way)
// ============================================================================

/*
// ❌ HANDLER 1: GET /users
app.get('/users', async (req, res) => {
  try {
    // 📝 Dòng 1-10: Auth logic
    const token = req.headers.authorization;
    if (!token || !token.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 📝 Dòng 11-15: Logging logic
    console.log('[GET /users] Auth passed');
    const startTime = Date.now();

    // 📝 Dòng 16-25: Business logic
    const users = await db.getUsers();
    
    // 📝 Dòng 26-30: Logging response
    console.log(`[GET /users] Completed in ${Date.now() - startTime}ms`);
    console.log('Response:', users);

    res.json(users);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ❌ HANDLER 2: POST /users
app.post('/users', async (req, res) => {
  try {
    // 📝 LẶP Dòng 1-10: Auth logic (giống handler 1)
    const token = req.headers.authorization;
    if (!token || !token.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 📝 LẶP Dòng 11-15: Logging logic (giống handler 1)
    console.log('[POST /users] Auth passed');
    const startTime = Date.now();

    // 📝 LẶP Dòng 16-20: Validation logic (lặp trong mỗi handler)
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Missing name or email' });
    }

    // 📝 Dòng 21-30: Business logic
    const newUser = await db.createUser({ name, email });
    
    // 📝 LẶP Dòng 31-35: Logging response (giống handler 1)
    console.log(`[POST /users] Completed in ${Date.now() - startTime}ms`);
    console.log('Response:', newUser);

    res.json(newUser);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ❌ HANDLER 3: PUT /users/:id
app.put('/users/:id', async (req, res) => {
  try {
    // 📝 LẶP Dòng 1-10: Auth logic (giống handler 1 & 2)
    const token = req.headers.authorization;
    if (!token || !token.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // 📝 LẶP Dòng 11-15: Logging logic (giống handler 1 & 2)
    console.log(`[PUT /users/${req.params.id}] Auth passed`);
    const startTime = Date.now();

    // 📝 LẶP Dòng 16-20: Validation logic (lặp trong mỗi handler)
    const id = parseInt(req.params.id, 10);
    if (isNaN(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid ID' });
    }
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Missing name or email' });
    }

    // 📝 Dòng 21-30: Business logic
    const updatedUser = await db.updateUser(id, { name, email });
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // 📝 LẶP Dòng 31-35: Logging response (giống handler 1 & 2)
    console.log(`[PUT /users/${id}] Completed in ${Date.now() - startTime}ms`);
    console.log('Response:', updatedUser);

    res.json(updatedUser);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ❌ RESULT:
// - Handler 1: ~30 dòng
// - Handler 2: ~40 dòng (lặp auth, logging)
// - Handler 3: ~45 dòng (lặp auth, validation, logging)
// - TỔNG CỘNG: ~115 dòng

// ❌ PROBLEM:
// 1. Auth logic lặp 3 lần → nếu thay đổi → phải sửa 3 chỗ
// 2. Logging logic lặp 3 lần
// 3. Validation logic lặp 3 lần
// 4. Khó test auth riêng (auth + validation + business lẫn)
// 5. Nếu có 50 handler → 1500+ dòng code (nhiều!)
// 6. Risk quên auth ở vài handler
*/

// ============================================================================
// SCENARIO 2: Sử dụng NestJS (Guard/Pipe/Interceptor)
// ============================================================================

/*
// ✅ FILE 1: auth.guard.ts (~15 dòng, viết 1 lần dùng 3 handler)
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization;
    
    if (!token || !token.startsWith('Bearer ')) {
      throw new UnauthorizedException('Unauthorized');
    }
    console.log('[AuthGuard] Auth passed');
    return true;
  }
}

// ✅ FILE 2: logging.interceptor.ts (~20 dòng, viết 1 lần dùng 3 handler)
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const method = request.method;
    const path = request.path;
    const startTime = Date.now();
    
    console.log(`[${method} ${path}] Auth passed`);
    
    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        console.log(`[${method} ${path}] Completed in ${duration}ms`);
        console.log('Response:', data);
      }),
    );
  }
}

// ✅ FILE 3: validation.pipe.ts (~15 dòng, viết 1 lần dùng tất cả param)
@Injectable()
export class ValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type === 'param' && metadata.data === 'id') {
      const id = parseInt(value, 10);
      if (isNaN(id) || id <= 0) {
        throw new BadRequestException('Invalid ID');
      }
      return id;
    }
    return value;
  }
}

// ✅ CONTROLLER: ~40 dòng (SẠCH! chỉ business logic)
@Controller('/users')
@UseInterceptors(LoggingInterceptor)  // ← Tự động log tất cả route
export class UsersController {
  constructor(private db: DatabaseService) {}

  // ✅ HANDLER 1: GET /users (~10 dòng, không auth logic, không logging logic)
  @Get()
  @UseGuards(AuthGuard)
  getAllUsers() {
    console.log('Business logic: fetch users');
    return this.db.getUsers();
  }

  // ✅ HANDLER 2: POST /users (~15 dòng, không auth logic, không logging logic)
  @Post()
  @UseGuards(AuthGuard)
  createUser(@Body() dto: { name: string; email: string }) {
    if (!dto.name || !dto.email) {
      throw new BadRequestException('Missing name or email');
    }
    console.log('Business logic: create user');
    return this.db.createUser(dto);
  }

  // ✅ HANDLER 3: PUT /users/:id (~15 dòng, không auth logic, không logging logic, không validation logic)
  @Put('/:id')
  @UseGuards(AuthGuard)
  updateUser(
    @Param('id', ValidationPipe) id: number,
    @Body() dto: { name: string; email: string }
  ) {
    if (!dto.name || !dto.email) {
      throw new BadRequestException('Missing name or email');
    }
    console.log('Business logic: update user');
    const result = this.db.updateUser(id, dto);
    if (!result) {
      throw new NotFoundException('User not found');
    }
    return result;
  }
}

// ✅ RESULT:
// - Pipe: ~15 dòng (viết 1 lần)
// - Interceptor: ~20 dòng (viết 1 lần)
// - Guard: ~15 dòng (viết 1 lần)
// - Handler 1: ~7 dòng (SẠCH!)
// - Handler 2: ~10 dòng (SẠCH!)
// - Handler 3: ~12 dòng (SẠCH!)
// - TỔNG CỘNG: ~79 dòng (ít hơn!)

// ✅ PROBLEM SOLVED:
// 1. Auth logic viết 1 lần → thay đổi 1 chỗ
// 2. Logging logic viết 1 lần → thay đổi 1 chỗ
// 3. Validation logic viết 1 lần → thay đổi 1 chỗ
// 4. Dễ test: test Guard, test Pipe, test Handler riêng
// 5. Handler SẠCH, dễ đọc
// 6. Nếu có 50 handler → ~250 dòng code (lẫn logic)
// 7. Không thể quên auth (bắt buộc @UseGuards)
*/

// ============================================================================
// 💰 COST ANALYSIS: 10 Routes Example
// ============================================================================

/*
┌──────────────────────────┬───────────┬──────────┐
│ Express (try-catch way)  │ Lines     │ Time     │
├──────────────────────────┼───────────┼──────────┤
│ Route 1                  │ 30        │ 2 min    │
│ Route 2                  │ 35        │ 2 min    │
│ Route 3                  │ 40        │ 2 min    │
│ ...                      │ ...       │ ...      │
│ Route 10                 │ 50        │ 3 min    │
├──────────────────────────┼───────────┼──────────┤
│ TOTAL                    │ 390 lines │ 25 min   │
│ (lặp auth 10x, logging   │           │          │
│  10x, validation 10x)    │           │          │
└──────────────────────────┴───────────┴──────────┘

┌──────────────────────────┬───────────┬──────────┐
│ NestJS way               │ Lines     │ Time     │
├──────────────────────────┼───────────┼──────────┤
│ AuthGuard                │ 15        │ 3 min    │
│ LoggingInterceptor       │ 20        │ 3 min    │
│ ValidationPipe           │ 15        │ 3 min    │
│ Route 1 (10 lines)       │ 10        │ 1 min    │
│ Route 2 (10 lines)       │ 10        │ 1 min    │
│ ...                      │ ...       │ ...      │
│ Route 10 (10 lines)      │ 10        │ 1 min    │
├──────────────────────────┼───────────┼──────────┤
│ TOTAL                    │ 130 lines │ 15 min   │
│ (không lặp, SẠCH)        │           │          │
└──────────────────────────┴───────────┴──────────┘

TIẾT KIỆM:
- 260 dòng code (67% ít hơn)
- 10 phút (40% nhanh hơn)
- 0 lần copy-paste (risk thấp hơn)
*/

// ============================================================================
// 🎯 CÂU TRẢ LỜI CUỐI CÙNG
// ============================================================================

/*
Q: Có phải Guard/Pipe/Interceptor dễ quản lý hơn try-catch không?

A: Không phải "thay thế", mà "bổ sung"
   
   Try-catch: Dùng cho BUSINESS LOGIC ERRORS
   Guard/Pipe/Interceptor: Dùng cho INFRASTRUCTURE CONCERNS
   
   ✅ NestJS dễ quản lý hơn vì:
   1. Không lặp lại code (DRY principle)
   2. Dễ thay đổi logic (1 chỗ vs 10 chỗ)
   3. Dễ test (unit test từng phần riêng)
   4. Developer rõ ràng handler cần gì
   5. Không thể quên auth/validation (bắt buộc decorator)
   6. Scaling dễ (thêm 100 handler, logic vẫn như cũ)
   
   ❌ Try-catch có vấn đề vì:
   1. Lặp lại: auth, validation, logging ở mỗi handler
   2. Khó thay đổi: sửa 1 chỗ → phải sửa 50 chỗ
   3. Khó test: logic lẫn lộn
   4. Risk cao: quên auth ở vài handler
   5. Scaling khó: càng nhiều handler càng khó quản lý
   
   TL;DR: Guard/Pipe/Interceptor KHÔNG thay thế try-catch,
          chỉ giúp TỔDUC structured, dễ bảo trì code.
*/

export const HandsOnExample = `
NestJS architecture không phải "không dùng try-catch", mà là:
- TÁCH BIỆT infrastructure concerns (auth, validation, logging)
- ĐỀ LẠI business logic trong handler
- KẾT QUẢ: code sạch, dễ bảo trì, dễ test

Guard/Pipe/Interceptor + try-catch = PERFECT COMBINATION
`;
