/**
 * ============================================================================
 * VALIDATION & SECURITY: VIẾT 1 LẦN, DÙNG NHIỀU HÀM
 * ============================================================================
 * 
 * Khái niệm:
 * - Viết pipe/guard 1 lần → dùng ở 100 handler
 * - Thay đổi logic 1 chỗ → tất cả 100 handler tự động được fix
 * - Bắt lỗi ở 1 chỗ → tất cả 100 handler được bảo vệ
 * - Bảo mật tập trung → dễ quản lý
 */

// ============================================================================
// EXAMPLE 1: EMAIL VALIDATION
// ============================================================================

/**
 * TRUYỀN THỐNG (Try-catch)
 * ────────────────────────
 * 
 * Cần validate email ở: POST /users, PUT /users/:id, POST /verify-email
 */

/*
// ❌ HANDLER 1: POST /users                          
app.post('/users', async (req, res) => {
  try {
    const email = req.body.email;
    
    // 🔴 EMAIL VALIDATION (lặp lại ở handler 1)
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email' });
    }
    
    const user = await db.createUser({ email });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error' });
  }
});

// ❌ HANDLER 2: PUT /users/:id
app.put('/users/:id', async (req, res) => {
  try {
    const email = req.body.email;
    
    // 🔴 EMAIL VALIDATION (lặp lại ở handler 2 - copy-paste)
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email' });
    }
    
    const user = await db.updateUser(id, { email });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error' });
  }
});

// ❌ HANDLER 3: POST /verify-email
app.post('/verify-email', async (req, res) => {
  try {
    const email = req.body.email;
    
    // 🔴 EMAIL VALIDATION (lặp lại ở handler 3 - copy-paste)
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Invalid email' });
    }
    
    const result = await emailService.verify(email);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error' });
  }
});

// ❌ PROBLEM:
// 1. Email validation viết 3 lần (copy-paste)
// 2. Nếu thay đổi: email phải có .com, .org, v.v. → phải sửa 3 chỗ
// 3. Nếu quên sửa 1 handler → bug bảo mật
// 4. Nếu có 50 handler dùng email → 50 lần copy-paste!
*/

/**
 * NestJS (Pipe)
 * ─────────────
 * 
 * Viết 1 lần → dùng ở tất cả handler
 */

/*
// ✅ FILE: email-validation.pipe.ts (viết 1 lần)
import { PipeTransform, BadRequestException } from '@nestjs/common';

@Injectable()
export class EmailValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    // 📌 Email validation logic ở 1 chỗ duy nhất
    if (metadata.type === 'body' && metadata.data === 'email') {
      const email = value.email;
      
      // ✅ Validation rule: phải có @ và .
      if (!email || !email.includes('@') || !email.includes('.')) {
        throw new BadRequestException('Invalid email format');
      }
      
      // ✅ Bổ sung: normalize email (lowercase)
      value.email = email.toLowerCase().trim();
      
      return value;
    }
    return value;
  }
}

// ✅ HANDLER 1: POST /users (dùng pipe)
@Post()
createUser(@Body(EmailValidationPipe) dto: { email: string }) {
  // Email đã được validate & normalize ở pipe
  // Chỉ cần business logic
  return this.db.createUser(dto);
}

// ✅ HANDLER 2: PUT /users/:id (dùng pipe)
@Put(':id')
updateUser(
  @Param('id') id: number,
  @Body(EmailValidationPipe) dto: { email: string }
) {
  // Email đã được validate & normalize ở pipe
  return this.db.updateUser(id, dto);
}

// ✅ HANDLER 3: POST /verify-email (dùng pipe)
@Post('/verify-email')
verifyEmail(@Body(EmailValidationPipe) dto: { email: string }) {
  // Email đã được validate & normalize ở pipe
  return this.emailService.verify(dto.email);
}

// ✅ BENEFIT:
// 1. EmailValidationPipe viết 1 lần (~10 dòng)
// 2. Dùng ở 3+ handler (chỉ cần @Body(EmailValidationPipe))
// 3. Thay đổi logic: sửa 1 chỗ → tất cả 3 handler được fix
// 4. Nếu có 50 handler: EmailValidationPipe vẫn viết 1 lần
// 5. Không thể quên validate (decorator @Body(EmailValidationPipe))
*/

// ============================================================================
// EXAMPLE 2: PASSWORD VALIDATION & HASHING (SECURITY)
// ============================================================================

/**
 * TRUYỀN THỐNG (Try-catch)
 * ────────────────────────
 */

/*
// ❌ HANDLER 1: POST /register
app.post('/register', async (req, res) => {
  try {
    const password = req.body.password;
    
    // 🔴 PASSWORD VALIDATION (lặp ở handler 1)
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be >= 8 chars' });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ error: 'Need uppercase' });
    }
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ error: 'Need number' });
    }
    if (!/[!@#$%]/.test(password)) {
      return res.status(400).json({ error: 'Need special char' });
    }
    
    // 🔴 PASSWORD HASHING (lặp ở handler 1)
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await db.createUser({ password: hashedPassword });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error' });
  }
});

// ❌ HANDLER 2: POST /change-password
app.post('/change-password', async (req, res) => {
  try {
    const password = req.body.password;
    
    // 🔴 PASSWORD VALIDATION (lặp ở handler 2 - copy-paste)
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be >= 8 chars' });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ error: 'Need uppercase' });
    }
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ error: 'Need number' });
    }
    if (!/[!@#$%]/.test(password)) {
      return res.status(400).json({ error: 'Need special char' });
    }
    
    // 🔴 PASSWORD HASHING (lặp ở handler 2)
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await db.updateUser(id, { password: hashedPassword });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error' });
  }
});

// ❌ HANDLER 3: POST /reset-password
app.post('/reset-password', async (req, res) => {
  try {
    const password = req.body.password;
    
    // 🔴 PASSWORD VALIDATION (lặp ở handler 3 - copy-paste)
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'Password must be >= 8 chars' });
    }
    if (!/[A-Z]/.test(password)) {
      return res.status(400).json({ error: 'Need uppercase' });
    }
    if (!/[0-9]/.test(password)) {
      return res.status(400).json({ error: 'Need number' });
    }
    if (!/[!@#$%]/.test(password)) {
      return res.status(400).json({ error: 'Need special char' });
    }
    
    // 🔴 PASSWORD HASHING (lặp ở handler 3)
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = await db.resetPassword(id, { password: hashedPassword });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Error' });
  }
});

// ❌ PROBLEM:
// 1. Password validation viết 3 lần (đầy đủ 20 dòng mỗi lần = 60 dòng!)
// 2. Nếu công ty thay đổi policy: "password >= 12 chars" → phải sửa 3 chỗ
// 3. Nếu quên sửa 1 handler → bug bảo mật!
// 4. Risk rất cao: mỗi 1 sai sót = bảo mật bị phá
*/

/**
 * NestJS (Pipe)
 * ─────────────
 */

/*
// ✅ FILE: password-validation.pipe.ts (viết 1 lần ~30 dòng)
import { PipeTransform, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

@Injectable()
export class PasswordValidationPipe implements PipeTransform {
  async transform(value: any, metadata: ArgumentMetadata) {
    if (metadata.type === 'body' && metadata.data === 'password') {
      const password = value.password;
      
      // ✅ Validation rules ở 1 chỗ
      if (!password || password.length < 8) {
        throw new BadRequestException('Password must be >= 8 chars');
      }
      if (!/[A-Z]/.test(password)) {
        throw new BadRequestException('Need uppercase letter');
      }
      if (!/[0-9]/.test(password)) {
        throw new BadRequestException('Need number');
      }
      if (!/[!@#$%]/.test(password)) {
        throw new BadRequestException('Need special char');
      }
      
      // ✅ Hashing ở 1 chỗ
      value.password = await bcrypt.hash(password, 10);
      
      return value;
    }
    return value;
  }
}

// ✅ HANDLER 1: POST /register
@Post('/register')
register(@Body(PasswordValidationPipe) dto: { password: string }) {
  // Password đã được validate & hash ở pipe
  return this.db.createUser(dto);
}

// ✅ HANDLER 2: POST /change-password
@Post('/change-password')
changePassword(@Body(PasswordValidationPipe) dto: { password: string }) {
  // Password đã được validate & hash ở pipe
  return this.db.updatePassword(dto);
}

// ✅ HANDLER 3: POST /reset-password
@Post('/reset-password')
resetPassword(@Body(PasswordValidationPipe) dto: { password: string }) {
  // Password đã được validate & hash ở pipe
  return this.db.resetPassword(dto);
}

// ✅ BENEFIT:
// 1. PasswordValidationPipe viết 1 lần (~30 dòng)
// 2. Dùng ở 3 handler
// 3. Thay đổi security policy: sửa 1 chỗ
// 4. Tất cả 3 handler tự động được bảo vệ
// 5. Không thể quên validate/hash password
// 6. Risk thấp (không có copy-paste = không có sai sót)
*/

// ============================================================================
// EXAMPLE 3: AUTHORIZATION (ROLE CHECK) - GUARD
// ============================================================================

/**
 * TRUYỀN THỐNG (Try-catch)
 * ────────────────────────
 */

/*
// ❌ HANDLER 1: DELETE /users/:id (admin only)
app.delete('/users/:id', async (req, res) => {
  try {
    // 🔴 ROLE CHECK (lặp ở handler 1)
    const user = req.user;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const result = await db.deleteUser(id);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error' });
  }
});

// ❌ HANDLER 2: POST /audit-logs (admin only)
app.post('/audit-logs', async (req, res) => {
  try {
    // 🔴 ROLE CHECK (lặp ở handler 2)
    const user = req.user;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const logs = await db.getAuditLogs();
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: 'Error' });
  }
});

// ❌ HANDLER 3: PUT /settings (admin only)
app.put('/settings', async (req, res) => {
  try {
    // 🔴 ROLE CHECK (lặp ở handler 3)
    const user = req.user;
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden' });
    }
    
    const result = await db.updateSettings(req.body);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: 'Error' });
  }
});

// ❌ PROBLEM:
// 1. Role check viết 3 lần (copy-paste)
// 2. Nếu thay đổi role logic: "admin hoặc superadmin" → phải sửa 3 chỗ
// 3. Nếu quên sửa 1 handler → bảo mật bị phá!
// 4. Nếu có 30 admin-only handler → 30 lần copy-paste = rất dễ sai
*/

/**
 * NestJS (Guard)
 * ──────────────
 */

/*
// ✅ FILE: admin.guard.ts (viết 1 lần)
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    
    // ✅ Role check logic ở 1 chỗ
    if (!user || user.role !== 'admin') {
      throw new ForbiddenException('Only admin allowed');
    }
    
    return true;
  }
}

// ✅ HANDLER 1: DELETE /users/:id
@Delete(':id')
@UseGuards(AdminGuard)  // ← Tự động check role
deleteUser(@Param('id') id: number) {
  return this.db.deleteUser(id);
}

// ✅ HANDLER 2: POST /audit-logs
@Post('/audit-logs')
@UseGuards(AdminGuard)  // ← Tự động check role
getAuditLogs() {
  return this.db.getAuditLogs();
}

// ✅ HANDLER 3: PUT /settings
@Put('/settings')
@UseGuards(AdminGuard)  // ← Tự động check role
updateSettings(@Body() dto: any) {
  return this.db.updateSettings(dto);
}

// ✅ BENEFIT:
// 1. AdminGuard viết 1 lần (~8 dòng)
// 2. Dùng ở 3 handler (chỉ cần @UseGuards(AdminGuard))
// 3. Thay đổi role logic: sửa 1 chỗ → 30 handler được fix
// 4. Không thể quên check role (bắt buộc decorator)
// 5. Developer rõ ràng handler cần admin role (dễ đọc code)
*/

// ============================================================================
// BẢNG SO SÁNH: VALIDATION & SECURITY
// ============================================================================

/*
┌────────────────────────┬──────────────────┬──────────────────┐
│ Use Case               │ Truyền thống     │ NestJS           │
├────────────────────────┼──────────────────┼──────────────────┤
│ Email validation       │ 3x copy-paste    │ 1x Pipe          │
│ (3 handlers)           │ 3x30 dòng = 90   │ 1x10 dòng = 10   │
│                        │                  │                  │
│ Password validation    │ 3x copy-paste    │ 1x Pipe          │
│ (3 handlers)           │ 3x20 dòng = 60   │ 1x30 dòng = 30   │
│                        │                  │                  │
│ Role check (admin)     │ 30x copy-paste   │ 1x Guard         │
│ (30 handlers)          │ 30x8 dòng = 240  │ 1x8 dòng = 8     │
│                        │                  │                  │
│ TOTAL                  │ 390 dòng         │ 48 dòng          │
│                        │ (lặp lại!)       │ (DRY!)           │
│                        │                  │                  │
│ Thay đổi email rule    │ 3 chỗ            │ 1 chỗ            │
│ Thay đổi password rule │ 3 chỗ            │ 1 chỗ            │
│ Thay đổi role rule     │ 30 chỗ           │ 1 chỗ            │
│                        │                  │                  │
│ Risk sai sót           │ Rất cao          │ Rất thấp         │
│ (copy-paste errors)    │ (390 dòng!)      │ (48 dòng!)       │
│                        │                  │                  │
│ Maintenance cost       │ Cao              │ Thấp             │
│ (fix 1 bug)            │ Phải sửa 30 nơi  │ Phải sửa 1 nơi   │
└────────────────────────┴──────────────────┴──────────────────┘
*/

// ============================================================================
// 🎯 KẾT LUẬN
// ============================================================================

/*
ĐÚNG! Đó là ý tưởng cốt lõi của NestJS:

📌 VIẾT 1 LẦN:
   - EmailValidationPipe
   - PasswordValidationPipe
   - AdminGuard
   - RoleGuard
   - v.v.

📌 DÙNG Ở NHIỀU HÀM:
   - @Body(EmailValidationPipe) ← dùng ở POST /users, PUT /users/:id, etc.
   - @UseGuards(AdminGuard) ← dùng ở 30 admin-only handlers

📌 BẮT LỖI Ở 1 CHỖ:
   - Email validation lỗi? Sửa EmailValidationPipe
   - Tất cả handlers dùng email tự động được fix

📌 BẢO MẬT TẬP TRUNG:
   - Password hashing rule: sửa PasswordValidationPipe
   - Tất cả 3 register/change/reset endpoints tự động được bảo vệ
   - Role check: sửa AdminGuard
   - Tất cả 30 admin endpoints tự động được bảo vệ

📌 VẬT LỢI:
   ✅ Code ít hơn 88% (390 → 48 dòng)
   ✅ Bảo mật tập trung (dễ audit)
   ✅ Dễ thay đổi (1 chỗ vs 30 chỗ)
   ✅ Risk thấp (không copy-paste)
   ✅ Dễ test (test guard/pipe riêng)
   ✅ Developer experience (rõ ràng decorator)
*/

export const ValidationSecurityConclusion = `
NestJS: VIẾT 1 LẦN VALIDATION/SECURITY → DÙNG Ở TẤT CẢ HANDLER

Khác với try-catch:
- Try-catch: phải viết ở mỗi handler
- Guard/Pipe: viết 1 lần, dùng ở 100 handler

Kết quả:
- Code ít hơn
- Bảo mật tập trung
- Dễ bảo trì
- Risk thấp
`;
