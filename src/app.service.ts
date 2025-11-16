import { Injectable } from '@nestjs/common';

/**
 * SERVICE - Chứa logic nghiệp vụ
 * 
 * Service được inject vào Controller qua Dependency Injection.
 * @Injectable() decorator cho phép NestJS quản lý lifecycle.
 */
export interface User {
  id: number;
  name: string;
  email: string;
}

@Injectable()
export class AppService {
  // Simulated database
  private users: User[] = [
    { id: 1, name: 'JOHN', email: 'john@example.com' },
    { id: 2, name: 'JANE', email: 'jane@example.com' },
    { id: 3, name: 'BOB', email: 'bob@example.com' },
  ];

  private nextId = 4;

  getHello(): string {
    return 'Hello World!';
  }

  /**
   * Lấy tất cả users với tùy chọn search
   */
  getAllUsers(search?: string, limit: number = 10): User[] {
    console.log('🔧 [SERVICE] getAllUsers() - search:', search, 'limit:', limit);
    let result = this.users;

    if (search) {
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(search.toLowerCase()) ||
          u.email.toLowerCase().includes(search.toLowerCase()),
      );
    }

    return result.slice(0, limit);
  }

  /**
   * Lấy user theo ID
   */
  getUserById(id: number): User | { error: string } {
    console.log('🔧 [SERVICE] getUserById() - id:', id);
    const user = this.users.find((u) => u.id === id);
    if (!user) {
      return { error: `User với ID ${id} không tồn tại` };
    }
    return user;
  }

  /**
   * Tạo user mới
   */
  createUser(createUserDto: { name: string; email: string }): User {
    console.log('🔧 [SERVICE] createUser() - data:', createUserDto);
    const newUser: User = {
      id: this.nextId++,
      name: createUserDto.name,
      email: createUserDto.email,
    };
    this.users.push(newUser);
    return newUser;
  }

  /**
   * Update user (PUT - replace toàn bộ)
   */
  updateUser(id: number, updateUserDto: { name?: string; email?: string }): User | { error: string } {
    console.log('🔧 [SERVICE] updateUser() - id:', id, 'data:', updateUserDto);
    const user = this.users.find((u) => u.id === id);
    if (!user) {
      return { error: `User với ID ${id} không tồn tại` };
    }

    if (updateUserDto.name) user.name = updateUserDto.name;
    if (updateUserDto.email) user.email = updateUserDto.email;

    return user;
  }

  /**
   * Update user một phần (PATCH)
   */
  partialUpdateUser(
    id: number,
    partialUpdateDto: Partial<{ name: string; email: string }>,
  ): User | { error: string } {
    console.log('🔧 [SERVICE] partialUpdateUser() - id:', id, 'data:', partialUpdateDto);
    const user = this.users.find((u) => u.id === id);
    if (!user) {
      return { error: `User với ID ${id} không tồn tại` };
    }

    if (partialUpdateDto.name !== undefined) user.name = partialUpdateDto.name;
    if (partialUpdateDto.email !== undefined) user.email = partialUpdateDto.email;

    return user;
  }

  /**
   * Xóa user
   */
  deleteUser(id: number): { message: string; success: boolean } {
    console.log('🔧 [SERVICE] deleteUser() - id:', id);
    const index = this.users.findIndex((u) => u.id === id);
    if (index === -1) {
      return { message: `User với ID ${id} không tồn tại`, success: false };
    }

    const deletedUser = this.users.splice(index, 1)[0];
    return { message: `Đã xóa user: ${deletedUser.name}`, success: true };
  }

  /**
   * Login và trả token (giả lập)
   */
  login(credentials: { username: string; password: string }): { token: string; message: string } {
    console.log('🔧 [SERVICE] login() - username:', credentials.username);
    // Giả lập: nếu username/password == "admin" thì cấp token
    if (credentials.username === 'admin' && credentials.password === 'admin123') {
      const token = `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${Date.now()}`;
      return { token, message: '✅ Đăng nhập thành công' };
    }
    return { token: '', message: '❌ Username hoặc password sai' };
  }
}
