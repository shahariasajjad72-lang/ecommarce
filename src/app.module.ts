/**
 * APP MODULE
 *
 * The root module of the application.
 * Imports all feature modules and configures global providers.
 */

import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

// Configuration
import configuration from './config/configuration';
import { validationSchema } from './config/validation.schema';

// Core modules
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';

// Global providers
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PermissionsGuard } from './common/guards/permissions.guard';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

// App
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CategoryModule } from './category/category.module';
import { AttributeModule } from './attribute/attribute.module';
import { BrandModule } from './brand/brand.module';
import { TagModule } from './tag/tag.module';
import { UploadModule } from './upload/upload.module';
@Module({
  imports: [
    // ================================
    // CONFIGURATION
    // ================================
    ConfigModule.forRoot({
      isGlobal: true, // Available everywhere without importing
      load: [configuration],
      validationSchema, // Validate . env on startup
      validationOptions: {
        abortEarly: true, // Stop on first error
      },
    }),

    // ================================
    // RATE LIMITING (Security)
    // ================================
    ThrottlerModule.forRoot([
      {
        name: 'short',
        ttl: 1000, // 1 second
        limit: 3, // 3 requests per second
      },
      {
        name: 'medium',
        ttl: 10000, // 10 seconds
        limit: 20, // 20 requests per 10 seconds
      },
      {
        name: 'long',
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute
      },
    ]),

    // ================================
    // CORE MODULES
    // ================================
    PrismaModule,
    AuthModule,
    CategoryModule,
    AttributeModule,
    BrandModule,
    TagModule,
    UploadModule,
  ],

  controllers: [AppController],

  providers: [
    AppService,

    // ================================
    // GLOBAL EXCEPTION FILTER
    // Catches all errors and formats them consistently
    // ================================
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },

    // ================================
    // GLOBAL INTERCEPTOR
    // Formats all successful responses consistently
    // ================================
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },

    // ================================
    // GLOBAL GUARDS (Order matters!)
    // 1. Rate Limiter - Prevent abuse
    // 2. JWT Auth - Verify token
    // 3. Roles - Check user role
    // 4. Permissions - Check specific permissions
    // ================================
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionsGuard,
    },
  ],
})
export class AppModule {}
