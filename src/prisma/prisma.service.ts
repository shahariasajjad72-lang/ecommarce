/**
 * PRISMA SERVICE (Prisma 7 Compatible with NeonDB)
 *
 * This is the database connection service.
 * Uses PostgreSQL adapter for Prisma v7 compatibility.
 *
 * USAGE IN OTHER SERVICES:
 *   constructor(private prisma: PrismaService) {}
 *
 *   async findUser(id: string) {
 *     return this.prisma.admin.findUnique({ where: { id } });
 *   }
 */

import {
  Injectable,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);
  private readonly pool: Pool;

  constructor() {
    // Create PostgreSQL connection pool for NeonDB
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      // NeonDB recommended settings
      ssl:
        process.env.NODE_ENV === 'production'
          ? { rejectUnauthorized: false }
          : false,
      max: 20, // Maximum connections
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    });

    // Create Prisma adapter for PostgreSQL
    const adapter = new PrismaPg(pool);

    super({
      adapter,
      // Log database queries in development
      log:
        process.env.NODE_ENV === 'development'
          ? ['query', 'info', 'warn', 'error']
          : ['error'],
    });

    this.pool = pool;
  }

  /**
   * Called when NestJS module initializes
   * Connects to the database
   */
  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Database connected successfully');
    } catch (error) {
      this.logger.error('❌ Failed to connect to database', error);
      throw error;
    }
  }

  /**
   * Called when NestJS module is destroyed
   * Disconnects from the database and closes pool
   */
  async onModuleDestroy() {
    await this.$disconnect();
    await this.pool.end();
    this.logger.log('Database disconnected and pool closed');
  }

  async enableShutdownHooks() {
    await this.$disconnect();
  }
}
