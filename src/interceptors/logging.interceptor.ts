import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

/**
 * LOGGING INTERCEPTOR
 * 
 * Interceptor chạy TRƯỚC request vào controller và TIẾP THEO khi response trả về.
 * Dùng để log, transform response, handle errors, timing, caching, v.v.
 * 
 * Lifecycle vị trí: REQUEST → GUARD → PIPE → (INTERCEPTOR - before) → CONTROLLER → (INTERCEPTOR - after) → RESPONSE
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const startTime = Date.now();
    
    console.log(`\n🚀 [INTERCEPTOR - Before] ${method} ${url}`);
    console.log(`   Thời gian: ${new Date().toISOString()}`);
    
    return next.handle().pipe(
      tap((data) => {
        const duration = Date.now() - startTime;
        console.log(`✅ [INTERCEPTOR - After] ${method} ${url} - ${duration}ms`);
        console.log(`   Response data:`, data);
      }),
    );
  }
}
