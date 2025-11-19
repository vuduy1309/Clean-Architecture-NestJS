/**
 * FILE: src/auth/auth.module.ts
 * 
 * Auth Module: Declare controllers & providers
 */

import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { BcryptPool } from './bcrypt.pool';

@Module({
  controllers: [AuthController],
  providers: [AuthService, BcryptPool],
})
export class AuthModule {}
