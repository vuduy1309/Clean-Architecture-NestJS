import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

/**
 * AUTH GUARD
 * 
 * Guard chạy TRƯỚC khi controller method được gọi.
 * Nếu trả về false/throw exception → request bị reject.
 * Dùng để kiểm tra authorization, authentication.
 * 
 * Lifecycle vị trí: REQUEST → (GUARD) → PIPE → (INTERCEPTOR - before) → CONTROLLER → (INTERCEPTOR - after) → RESPONSE
 */
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    
    // Kiểm tra header Authorization
    const token = request.headers.authorization;
    
    if (!token) {
      throw new UnauthorizedException('❌ Token không tồn tại trong header Authorization');
    }
    
    // Ví dụ: token phải bắt đầu bằng "Bearer "
    if (!token.startsWith('Bearer ')) {
      throw new UnauthorizedException('❌ Token phải có format: Bearer <token>');
    }
    
    console.log('✅ [AuthGuard] Đã xác thực token:', token.substring(0, 20) + '...');
    return true;
  }
}
