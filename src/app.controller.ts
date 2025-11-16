import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AppService } from './app.service';
import type { User } from './app.service';
import { AuthGuard } from './guards/auth.guard';
import { ValidationPipe } from './pipes/validation.pipe';
import { LoggingInterceptor } from './interceptors/logging.interceptor';

/**
 * CONTROLLER - Xử lý HTTP Requests
 * 
 * ========== LIFECYCLE REQUEST → RESPONSE ==========
 * 
 * 1. REQUEST nhận từ client
 * 2. GLOBAL MIDDLEWARE chạy (nếu có)
 * 3. GUARD kiểm tra quyền hạn (AuthGuard, RoleGuard, v.v.)
 *    - Nếu Guard reject → response lỗi, không tiếp tục
 * 4. PIPE validate/transform dữ liệu (ValidationPipe, ParseIntPipe, v.v.)
 *    - Nếu Pipe reject → response lỗi
 * 5. INTERCEPTOR before - chạy trước controller (logging, transform, caching)
 * 6. CONTROLLER METHOD được gọi
 * 7. SERVICE xử lý logic nghiệp vụ
 * 8. INTERCEPTOR after - chạy sau controller (transform response, error handling)
 * 9. RESPONSE trả lại client
 * 
 * ========== VÍ DỤ FLOW THỰC TẾ ==========
 * GET /users/123 (có header Authorization)
 *   → AuthGuard: kiểm tra token ✅
 *   → ValidationPipe: kiểm tra ID=123 hợp lệ ✅
 *   → LoggingInterceptor before: log "GET /users/123"
 *   → Controller.getUser(123)
 *   → Service.findUserById(123)
 *   → LoggingInterceptor after: log thời gian xử lý
 *   → Response { id: 123, name: "John" }
 */

@Controller()
@UseInterceptors(LoggingInterceptor) // Áp dụng interceptor cho tất cả routes trong controller
export class AppController {
  constructor(private readonly appService: AppService) {}

  /**
   * ========== ROUTE 1: GET / ==========
   * Không cần auth, không cần validation
   * Đơn giản trả "Hello World!"
   */
  @Get()
  getHello(): string {
    console.log('📍 [CONTROLLER] getHello() called');
    return this.appService.getHello();
  }

  /**
   * ========== ROUTE 2: GET /users ==========
   * Query parameters: ?search=John&limit=10
   * Không cần auth, interceptor sẽ log request/response
   */
  @Get('users')
  getAllUsers(
    @Query('search') search?: string,
    @Query('limit') limit?: string,
  ): User[] {
    console.log('📍 [CONTROLLER] getAllUsers() called with:', { search, limit });
    return this.appService.getAllUsers(search, limit ? parseInt(limit) : 10);
  }

  /**
   * ========== ROUTE 3: GET /users/:id ==========
   * Path parameter: /users/123
   * 
   * LIFECYCLE:
   *   1. AuthGuard: kiểm tra Authorization header
   *   2. ValidationPipe: kiểm tra :id phải là số > 0
   *   3. LoggingInterceptor before
   *   4. Controller method
   *   5. LoggingInterceptor after
   */
  @Get('users/:id')
  @UseGuards(AuthGuard) // Chỉ áp dụng cho route này
  getUserById(@Param('id', ValidationPipe) id: number): User | { error: string } {
    console.log('📍 [CONTROLLER] getUserById() called with id:', id);
    return this.appService.getUserById(id);
  }

  /**
   * ========== ROUTE 4: POST /users ==========
   * Body: { name: "John", email: "john@example.com" }
   * 
   * LIFECYCLE:
   *   1. AuthGuard: kiểm tra token
   *   2. ValidationPipe: normalize/validate body data
   *   3. LoggingInterceptor before
   *   4. Controller method
   *   5. Service tạo user mới
   *   6. LoggingInterceptor after: log response
   */
  @Post('users')
  @UseGuards(AuthGuard)
  createUser(@Body(ValidationPipe) createUserDto: { name: string; email: string }): User {
    console.log('📍 [CONTROLLER] createUser() called with:', createUserDto);
    return this.appService.createUser(createUserDto);
  }

  /**
   * ========== ROUTE 5: PUT /users/:id ==========
   * Cập nhật toàn bộ user
   * 
   * Khác biệt PUT vs PATCH:
   *   - PUT: replace toàn bộ resource
   *   - PATCH: update một phần fields
   */
  @Put('users/:id')
  @UseGuards(AuthGuard)
  updateUser(
    @Param('id', ValidationPipe) id: number,
    @Body(ValidationPipe) updateUserDto: { name?: string; email?: string },
  ): User | { error: string } {
    console.log('📍 [CONTROLLER] updateUser() called with id:', id, 'data:', updateUserDto);
    return this.appService.updateUser(id, updateUserDto);
  }

  /**
   * ========== ROUTE 6: PATCH /users/:id ==========
   * Update một phần user (có thể chỉ update name hoặc email)
   */
  @Patch('users/:id')
  @UseGuards(AuthGuard)
  partialUpdateUser(
    @Param('id', ValidationPipe) id: number,
    @Body() partialUpdateDto: Partial<{ name: string; email: string }>,
  ): User | { error: string } {
    console.log('📍 [CONTROLLER] partialUpdateUser() called with id:', id, 'data:', partialUpdateDto);
    return this.appService.partialUpdateUser(id, partialUpdateDto);
  }

  /**
   * ========== ROUTE 7: DELETE /users/:id ==========
   * Xóa user
   * 
   * LIFECYCLE:
   *   1. AuthGuard: xác thực
   *   2. ValidationPipe: kiểm tra ID
   *   3. Interceptor log request
   *   4. Service xóa user
   *   5. Interceptor log response
   */
  @Delete('users/:id')
  @UseGuards(AuthGuard)
  deleteUser(@Param('id', ValidationPipe) id: number): { message: string; success: boolean } {
    console.log('📍 [CONTROLLER] deleteUser() called with id:', id);
    return this.appService.deleteUser(id);
  }

  /**
   * ========== ROUTE 8: POST /login ==========
   * Không cần auth guard (không có token yet)
   * Trả về token
   */
  @Post('login')
  login(@Body() credentials: { username: string; password: string }): { token: string; message: string } {
    console.log('📍 [CONTROLLER] login() called with username:', credentials.username);
    return this.appService.login(credentials);
  }
}
