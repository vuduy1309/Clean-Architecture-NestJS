/**
 * FILE: src/auth/auth.service.ts
 * 
 * Auth Service: Xử lý login, register, verify token
 * Sử dụng bcrypt worker pool (non-blocking)
 */

import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import { BcryptPool } from './bcrypt.pool';

// Interface cho user
interface User {
  id: number;
  email: string;
  username: string;
  password: string; // hashed
}

// Mock database (thực tế dùng Prisma + PostgreSQL)
const mockUsers: User[] = [];
let userId = 1;

@Injectable()
export class AuthService {
  private jwtSecret = process.env.JWT_SECRET || 'your-secret-key-min-32-chars';
  private jwtExpire = '24h';

  constructor(private bcryptPool: BcryptPool) {}

  /**
   * Register: Tạo user mới
   * 
   * Timeline:
   * T=0ms:      Nhận request
   * T=0-5ms:    Dispatch hash tới worker thread
   * T=5-100ms:  Main thread FREE! Xử lý requests khác
   * T=100-110ms: Worker xong hash, callback tới main thread
   * T=110-115ms: Create user, return response
   * Total: ~115ms (nhưng main thread KHÔNG bị block!)
   */
  async register(email: string, username: string, password: string) {
    // Kiểm tra email đã tồn tại
    if (mockUsers.some(u => u.email === email)) {
      throw new BadRequestException('Email already exists');
    }

    if (mockUsers.some(u => u.username === username)) {
      throw new BadRequestException('Username already exists');
    }

    // Kiểm tra password strength
    if (password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters');
    }

    try {
      // Hash password (worker thread - non-blocking)
      console.log(`[REGISTER] Hashing password for ${email}...`);
      const hashedPassword = await this.bcryptPool.hash(password, 10);
      console.log(`[REGISTER] Password hashed successfully`);

      // Create user
      const user: User = {
        id: userId++,
        email,
        username,
        password: hashedPassword,
      };

      mockUsers.push(user);
      console.log(`[REGISTER] User created: ${email}`);

      return {
        message: 'User registered successfully',
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
      };
    } catch (error) {
      throw new BadRequestException('Registration failed');
    }
  }

  /**
   * Login: Xác thực user
   * 
   * Timeline:
   * T=0ms:       Nhận request
   * T=0-2ms:     Query user từ DB (mock: O(n))
   * T=2-5ms:     Dispatch compare tới worker thread
   * T=5-100ms:   Main thread FREE! Xử lý requests khác
   * T=100-110ms: Worker xong compare, callback
   * T=110-115ms: Generate JWT, return response
   * Total: ~115ms (main thread KHÔNG block!)
   * 
   * Lợi ích: Có thể xử lý 10+ logins song song!
   */
  async login(email: string, password: string) {
    // Query user
    const user = mockUsers.find(u => u.email === email);

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    try {
      // Compare password (worker thread - non-blocking)
      console.log(`[LOGIN] Comparing password for ${email}...`);
      const isPasswordValid = await this.bcryptPool.compare(password, user.password);
      console.log(`[LOGIN] Password comparison complete: ${isPasswordValid}`);

      if (!isPasswordValid) {
        throw new UnauthorizedException('Invalid password');
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          username: user.username,
        },
        this.jwtSecret as string,
        { expiresIn: '24h' } as any
      );

      console.log(`[LOGIN] Token generated for ${email}`);

      return {
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          username: user.username,
        },
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('Login failed');
    }
  }

  /**
   * Verify JWT token
   */
  verifyToken(token: string) {
    try {
      const payload = jwt.verify(token, this.jwtSecret);
      return {
        valid: true,
        payload,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }

  /**
   * Get all users (for testing)
   */
  getAllUsers() {
    return mockUsers.map(u => ({
      id: u.id,
      email: u.email,
      username: u.username,
      // NOT return password!
    }));
  }

  /**
   * Delete all users (for testing)
   */
  deleteAllUsers() {
    mockUsers.length = 0;
    userId = 1;
    return { message: 'All users deleted' };
  }
}
