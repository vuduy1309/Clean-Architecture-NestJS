/**
 * FILE: src/auth/auth.controller.ts
 * 
 * Auth Controller: Define routes để test với Postman
 * 
 * Endpoints:
 * POST   /auth/register     - Tạo user mới
 * POST   /auth/login        - Login & lấy JWT token
 * GET    /auth/verify       - Verify token
 * GET    /auth/users        - Get all users (testing)
 * DELETE /auth/users        - Delete all users (testing)
 */

import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Headers,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  /**
   * POST /auth/register
   * 
   * Body:
   * {
   *   "email": "john@example.com",
   *   "username": "john",
   *   "password": "password123"
   * }
   * 
   * Response:
   * {
   *   "message": "User registered successfully",
   *   "user": {
   *     "id": 1,
   *     "email": "john@example.com",
   *     "username": "john"
   *   }
   * }
   */
  @Post('register')
  async register(
    @Body() body: { email: string; username: string; password: string }
  ) {
    try {
      return await this.authService.register(
        body.email,
        body.username,
        body.password
      );
    } catch (error) {
      throw new HttpException(
        { error: (error as any).message || 'Registration failed' },
        HttpStatus.BAD_REQUEST
      );
    }
  }

  /**
   * POST /auth/login
   * 
   * Body:
   * {
   *   "email": "john@example.com",
   *   "password": "password123"
   * }
   * 
   * Response:
   * {
   *   "message": "Login successful",
   *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
   *   "user": {
   *     "id": 1,
   *     "email": "john@example.com",
   *     "username": "john"
   *   }
   * }
   */
  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    try {
      return await this.authService.login(body.email, body.password);
    } catch (error) {
      throw new HttpException(
        { error: (error as any).message || 'Login failed' },
        HttpStatus.UNAUTHORIZED
      );
    }
  }

  /**
   * GET /auth/verify
   * 
   * Headers:
   * Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   * 
   * Response:
   * {
   *   "valid": true,
   *   "payload": {
   *     "userId": 1,
   *     "email": "john@example.com",
   *     "username": "john",
   *     "iat": 1634567890,
   *     "exp": 1634654290
   *   }
   * }
   */
  @Get('verify')
  verify(@Headers('authorization') authHeader: string) {
    try {
      // Extract token từ "Bearer <token>"
      const token = authHeader?.replace('Bearer ', '');

      if (!token) {
        throw new HttpException(
          { error: 'Token not provided' },
          HttpStatus.UNAUTHORIZED
        );
      }

      return this.authService.verifyToken(token);
    } catch (error) {
      throw new HttpException(
        { error: (error as any).message || 'Token verification failed' },
        HttpStatus.UNAUTHORIZED
      );
    }
  }

  /**
   * GET /auth/users
   * 
   * Get all registered users (for testing)
   * 
   * Response:
   * [
   *   {
   *     "id": 1,
   *     "email": "john@example.com",
   *     "username": "john"
   *   },
   *   {
   *     "id": 2,
   *     "email": "jane@example.com",
   *     "username": "jane"
   *   }
   * ]
   */
  @Get('users')
  getAllUsers() {
    return this.authService.getAllUsers();
  }

  /**
   * DELETE /auth/users
   * 
   * Delete all users (for testing/reset)
   * 
   * Response:
   * {
   *   "message": "All users deleted"
   * }
   */
  @Delete('users')
  deleteAllUsers() {
    return this.authService.deleteAllUsers();
  }
}
