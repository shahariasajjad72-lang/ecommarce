/**
 * MAIN.TS - Application Entry Point (Production Ready)
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
  // SECURITY (Helmet Fixed)
  // ----------------------------------
  app.use(
    helmet({
      crossOriginResourcePolicy: false, // 🔥 IMPORTANT for CORS
    }),
  );

  // ----------------------------------
  // CORS CONFIGURATION (FIXED)
  // ----------------------------------
  app.enableCors({
    origin: '*', // allow all origins (public API)
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  });

  // ----------------------------------
  // GLOBAL PREFIX
  // ----------------------------------
  app.setGlobalPrefix('api/v1');

  // ----------------------------------
  // GLOBAL VALIDATION PIPE
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
  // SWAGGER (Enable in Production or via ENV)
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
  // START SERVER
  // ----------------------------------
  await app.listen(port);

  logger.log(`🚀 Application running on port: ${port}`);
  logger.log(`🌍 Environment: ${nodeEnv}`);
  logger.log(`📡 API Base: /api/v1`);
}

bootstrap();
