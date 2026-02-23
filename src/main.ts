/**
 * MAIN.TS - Application Entry Point (Swagger Enabled)
 */

import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') ?? 3001;
  const nodeEnv = configService.get<string>('nodeEnv') ?? 'development';

  const logger = new Logger('Bootstrap');

  // ----------------------------------
  // Security & CORS
  // ----------------------------------
  app.use(helmet());

  app.enableCors({
    origin: nodeEnv === 'production' ? ['https://yourfrontend.com'] : true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // ----------------------------------
  // Global Prefix
  // ----------------------------------
  app.setGlobalPrefix('api/v1');

  // ----------------------------------
  // Global Validation Pipe
  // ----------------------------------
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
      disableErrorMessages: false,
    }),
  );

  // ----------------------------------
  // Swagger Setup (DEV ONLY) - FIXED
  // ----------------------------------
  const enableSwagger =
    nodeEnv === 'production' || process.env.ENABLE_SWAGGER === 'true';

  if (enableSwagger) {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('E-commerce API')
      .setDescription('Authentication, Admin & Customer APIs')
      .setVersion('1.0')
      .addBearerAuth(
        {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          name: 'Authorization',
          in: 'header',
        },
        'access-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document);

    logger.log(`📘 Swagger UI enabled`);
  }

  // ----------------------------------
  // Start Server
  // ----------------------------------
  await app.listen(port);

  logger.log(`🚀 Application running on: http://localhost:${port}/api/v1`);
  logger.log(`🌍 Environment: ${nodeEnv}`);
  logger.log(`🔐 Auth endpoints: http://localhost:${port}/api/v1/auth`);

  if (nodeEnv === 'production') {
    logger.log('');
    logger.log('📌 Available Auth Endpoints:');
    logger.log('   POST   /api/v1/auth/admin/login');
    logger.log('   POST   /api/v1/auth/admin/create');
    logger.log('   GET    /api/v1/auth/admin/list');
    logger.log('   PATCH  /api/v1/auth/admin/:id/permissions');
    logger.log('   PATCH  /api/v1/auth/admin/:id/disable');
    logger.log('   PATCH  /api/v1/auth/admin/:id/enable');
    logger.log('   DELETE /api/v1/auth/admin/:id');
    logger.log('   POST   /api/v1/auth/customer/register');
    logger.log('   POST   /api/v1/auth/customer/login');
    logger.log('   POST   /api/v1/auth/refresh');
    logger.log('   POST   /api/v1/auth/logout');
    logger.log('   POST   /api/v1/auth/logout-all');
    logger.log('   GET    /api/v1/auth/me');
    logger.log('');
    logger.log('🔑 How to use Swagger:');
    logger.log('   1. Login via /api/v1/auth/admin/login');
    logger.log('   2. Copy the accessToken from response');
    logger.log('   3. Click "Authorize" button (top right)');
    logger.log('   4. Paste token WITHOUT "Bearer " prefix');
    logger.log('   5. Click "Authorize" then "Close"');
  }
}

bootstrap();
