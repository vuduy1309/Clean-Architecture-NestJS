import { Injectable, PipeTransform, ArgumentMetadata, BadRequestException } from '@nestjs/common';

/**
 * VALIDATION PIPE
 * 
 * Pipe chạy sau Guard nhưng TRƯỚC controller method.
 * Dùng để validate, transform dữ liệu từ request (body, params, query).
 * 
 * Lifecycle vị trí: REQUEST → GUARD → (PIPE) → INTERCEPTOR → CONTROLLER → RESPONSE
 */
@Injectable()
export class ValidationPipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    console.log(`🔍 [ValidationPipe] Nhận dữ liệu:`, value);
    console.log(`   Metadata type: ${metadata.type}, data: ${metadata.data}`);
    
    // Ví dụ: nếu là number ID, kiểm tra phải > 0
    if (metadata.type === 'param' && metadata.data === 'id') {
      const id = parseInt(value, 10);
      if (isNaN(id) || id <= 0) {
        throw new BadRequestException('❌ ID phải là số nguyên dương');
      }
      console.log(`✅ [ValidationPipe] ID hợp lệ: ${id}`);
      return id;
    }
    
    // Ví dụ: nếu là body, kiểm tra name không rỗng
    if (metadata.type === 'body') {
      if (value.name && typeof value.name === 'string') {
        value.name = value.name.trim().toUpperCase();
        console.log(`✅ [ValidationPipe] Name normalize: ${value.name}`);
      }
    }
    
    return value;
  }
}
