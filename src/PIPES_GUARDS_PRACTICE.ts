/**
 * ============================================================================
 * THỰC HÀNH: DÙNG PIPES & GUARDS ĐỂ VALIDATION & SECURITY
 * ============================================================================
 * 
 * File này chứa các pipe và guard có thể dùng ngay ở project
 */

import {
  Injectable,
  PipeTransform,
  ArgumentMetadata,
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';

// ============================================================================
// 1️⃣ STRING NORMALIZE PIPE (dùng ở tất cả string field)
// ============================================================================

/**
 * Tác dụng:
 * - Trim whitespace
 * - Lowercase hoặc capitalize
 * - Remove special characters (tùy config)
 * 
 * Dùng ở:
 * - POST /users (name, email, username)
 * - PUT /users/:id (name)
 * - POST /products (title, description)
 * - v.v.
 */

@Injectable()
export class NormalizeStringPipe implements PipeTransform {
  constructor(private lowercase = true) {}

  transform(value: any) {
    if (typeof value === 'string') {
      let normalized = value.trim();
      if (this.lowercase) {
        normalized = normalized.toLowerCase();
      }
      return normalized;
    }
    return value;
  }
}

// ============================================================================
// 2️⃣ PHONE NUMBER VALIDATION PIPE
// ============================================================================

/**
 * Tác dụng:
 * - Validate phone format (10 digits, bắt đầu bằng 0)
 * - Remove dashes, spaces
 * 
 * Dùng ở:
 * - POST /users (phone)
 * - PUT /users/:id (phone)
 * - POST /contacts (phone)
 * 
 * Ví dụ:
 * - "0123 456 789" → "0123456789" ✅
 * - "123456789" → ❌ Error
 * - "0912345678" → "0912345678" ✅
 */

@Injectable()
export class PhoneValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type === 'body' && metadata.data === 'phone') {
      // Remove all non-digits
      const phone = value.phone?.replace(/\D/g, '');

      if (!phone || phone.length !== 10 || !phone.startsWith('0')) {
        throw new BadRequestException(
          '❌ Phone must be 10 digits and start with 0 (e.g., 0912345678)',
        );
      }

      value.phone = phone;
      console.log(`✅ [PhoneValidationPipe] Validated: ${phone}`);
      return value;
    }
    return value;
  }
}

// ============================================================================
// 3️⃣ RANGE VALIDATION PIPE (dùng cho numbers)
// ============================================================================

/**
 * Tác dụng:
 * - Validate number nằm trong range
 * - Ví dụ: age từ 1-120, price > 0, quantity <= 1000
 * 
 * Dùng ở:
 * - POST /products (price >= 0)
 * - PUT /users/:id (age từ 18-80)
 * - POST /orders (quantity <= 1000)
 */

@Injectable()
export class RangeValidationPipe implements PipeTransform {
  constructor(
    private min?: number,
    private max?: number,
    private fieldName?: string,
  ) {}

  transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type === 'body' && this.fieldName) {
      const fieldValue = value[this.fieldName];

      if (
        this.min !== undefined &&
        (fieldValue === undefined || fieldValue < this.min)
      ) {
        throw new BadRequestException(
          `❌ ${this.fieldName} must be >= ${this.min}`,
        );
      }

      if (
        this.max !== undefined &&
        (fieldValue === undefined || fieldValue > this.max)
      ) {
        throw new BadRequestException(
          `❌ ${this.fieldName} must be <= ${this.max}`,
        );
      }

      console.log(
        `✅ [RangeValidationPipe] ${this.fieldName}=${fieldValue} is valid`,
      );
      return value;
    }
    return value;
  }
}

// ============================================================================
// 4️⃣ OWNERSHIP GUARD (dùng ở PUT/DELETE của user)
// ============================================================================

/**
 * Tác dụng:
 * - Check xem user có quyền edit/delete user khác không
 * - Ví dụ: user A không thể edit user B
 * - Trừ khi user A là admin
 * 
 * Dùng ở:
 * - PUT /users/:id (user chỉ có thể edit chính mình)
 * - DELETE /users/:id (user chỉ có thể xóa chính mình)
 * - PUT /posts/:id (author chỉ có thể edit bài post của mình)
 */

@Injectable()
export class OwnershipGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const userId = request.params.id;
    const currentUser = request.user; // Giả sử user từ token

    console.log(
      `🔍 [OwnershipGuard] Checking: currentUser=${currentUser.id}, targetUser=${userId}`,
    );

    // ✅ Admin có thể edit user khác
    if (currentUser.role === 'admin') {
      console.log(`✅ [OwnershipGuard] Admin allowed`);
      return true;
    }

    // ✅ User chỉ có thể edit chính mình
    if (currentUser.id !== parseInt(userId)) {
      console.log(
        `❌ [OwnershipGuard] User ${currentUser.id} cannot edit user ${userId}`,
      );
      throw new ForbiddenException('You can only edit your own profile');
    }

    console.log(`✅ [OwnershipGuard] User can edit their own profile`);
    return true;
  }
}

// ============================================================================
// 5️⃣ ROLE-BASED GUARD (dùng ở admin/manager endpoints)
// ============================================================================

/**
 * Tác dụng:
 * - Check xem user có role được phép không
 * - Có thể config đa role: ['admin', 'manager']
 * 
 * Dùng ở:
 * - DELETE /users/:id (admin only)
 * - POST /audit-logs (admin only)
 * - GET /reports (manager+ hoặc admin)
 */

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private allowedRoles: string[]) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    console.log(
      `🔍 [RoleGuard] Checking roles:`,
      `userRole=${user?.role}, allowed=${this.allowedRoles.join(',')}`,
    );

    if (!user || !this.allowedRoles.includes(user.role)) {
      throw new ForbiddenException(
        `❌ Only ${this.allowedRoles.join(', ')} allowed`,
      );
    }

    console.log(`✅ [RoleGuard] User role ${user.role} is allowed`);
    return true;
  }
}

// ============================================================================
// 📋 CÁCH DÙNG
// ============================================================================

/*
import { Controller, Post, Put, Delete, Body, Param } from '@nestjs/common';

@Controller('users')
export class UsersController {
  // ✅ EXAMPLE 1: POST /users (validate name, phone)
  @Post()
  createUser(
    @Body(new NormalizeStringPipe()) dto: { name: string },
    @Body(new PhoneValidationPipe()) phoneDto: { phone: string }
  ) {
    console.log('✅ [Handler] Name:', dto.name, '| Phone:', phoneDto.phone);
    return { success: true, data: { name: dto.name, phone: phoneDto.phone } };
  }

  // ✅ EXAMPLE 2: PUT /users/:id (user chỉ có thể edit chính mình)
  @Put(':id')
  @UseGuards(OwnershipGuard)  // ← Check xem có quyền edit không
  updateUser(
    @Param('id') id: string,
    @Body(new NormalizeStringPipe()) dto: { name: string }
  ) {
    console.log('✅ [Handler] Updated user', id, 'name:', dto.name);
    return { success: true, data: { id, name: dto.name } };
  }

  // ✅ EXAMPLE 3: DELETE /users/:id (admin only)
  @Delete(':id')
  @UseGuards(new RoleGuard(['admin']))  // ← Admin only
  deleteUser(@Param('id') id: string) {
    console.log('✅ [Handler] Deleted user', id);
    return { success: true, message: 'User deleted' };
  }

  // ✅ EXAMPLE 4: POST /products (validate price range)
  @Post('/products')
  createProduct(
    @Body(new RangeValidationPipe(0, 10000000, 'price')) dto: { price: number }
  ) {
    console.log('✅ [Handler] Price:', dto.price);
    return { success: true, price: dto.price };
  }
}
*/

// ============================================================================
// 📊 BẢNG DÙNG PIPES & GUARDS
// ============================================================================

/*
PIPES (Validation & Transformation):
┌─────────────────────────┬────────────────────────────────┐
│ Pipe                    │ Dùng ở                         │
├─────────────────────────┼────────────────────────────────┤
│ NormalizeStringPipe     │ name, username, title, v.v.    │
│ PhoneValidationPipe     │ phone ở tất cả forms           │
│ RangeValidationPipe     │ price, age, quantity, v.v.     │
│ EmailValidationPipe     │ email ở tất cả forms           │
│ PasswordValidationPipe  │ password ở register/change     │
└─────────────────────────┴────────────────────────────────┘

GUARDS (Authorization):
┌──────────────────────┬──────────────────────────────────┐
│ Guard                │ Dùng ở                           │
├──────────────────────┼──────────────────────────────────┤
│ AuthGuard            │ Tất cả route cần login           │
│ AdminGuard           │ DELETE /users, POST /audit-logs  │
│ OwnershipGuard       │ PUT /users/:id, DELETE /users/:id│
│ RoleGuard(['admin']) │ Admin-only endpoints             │
│ RoleGuard(['manager'])│ Manager+ endpoints              │
└──────────────────────┴──────────────────────────────────┘

FLOW:
User Request → AuthGuard (check token) → OwnershipGuard/RoleGuard (check quyền)
             → NormalizeStringPipe (format data) → RangeValidationPipe (validate)
             → Handler (business logic)
*/

export const PipesGuardsExample = `
PIPES & GUARDS: Viết 1 lần, dùng ở 100 handler

📌 Validation (Pipe):
   - EmailValidationPipe: dùng ở POST /users, PUT /users/:id, POST /verify-email
   - PasswordValidationPipe: dùng ở POST /register, POST /change-password
   - PhoneValidationPipe: dùng ở POST /users, PUT /users/:id, POST /contacts

📌 Security (Guard):
   - AuthGuard: dùng ở tất cả route cần token
   - AdminGuard: dùng ở 30+ admin-only endpoint
   - OwnershipGuard: dùng ở PUT/DELETE user profile
   - RoleGuard: dùng ở role-based endpoints

📌 Benefit:
   ✅ Validation/security logic ở 1 chỗ
   ✅ Dùng ở 100 handler
   ✅ Thay đổi 1 chỗ → fix 100 handler
   ✅ Bảo mật tập trung (dễ audit)
   ✅ Code ít hơn 80%
   ✅ Risk thấp (không copy-paste)
`;
