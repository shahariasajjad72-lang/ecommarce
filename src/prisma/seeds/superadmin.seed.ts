/**
 * SUPERADMIN SEED SCRIPT - PRODUCTION READY (Prisma 7 Compatible)
 *
 * Creates the first SuperAdmin account.
 * Run this ONCE after setting up the database.
 *
 * COMMAND: npm run seed:superadmin
 */

import 'dotenv/config';
import { PrismaClient, Role, Permission } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import * as bcrypt from 'bcryptjs';

// Create PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false,
});

// Create Prisma adapter
const adapter = new PrismaPg(pool);

// Create Prisma client with adapter
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding SuperAdmin...\n');

  // Get credentials from environment
  const email = process.env.SUPER_ADMIN_EMAIL || 'superadmin@company.com';
  const password = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123!';
  const firstName = process.env.SUPER_ADMIN_FIRST_NAME || 'Super';
  const lastName = process.env.SUPER_ADMIN_LAST_NAME || 'Admin';

  // Check if SuperAdmin already exists
  const existing = await prisma.admin.findFirst({
    where: { role: Role.SUPERADMIN },
  });

  if (existing) {
    console.log('⚠️  SuperAdmin already exists!');
    console.log(`   Email: ${existing.email}`);
    console.log('\n   Skipping seed...');
    return;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 12);

  // Create SuperAdmin with ALL permissions
  const superAdmin = await prisma.admin.create({
    data: {
      firstName,
      lastName,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: Role.SUPERADMIN,
      permissions: Object.values(Permission), // ALL permissions
      isActive: true,
    },
  });

  console.log('✅ SuperAdmin created successfully!\n');
  console.log('   ┌────────────────────────────────────────┐');
  console.log('   │  SUPERADMIN CREDENTIALS                │');
  console.log('   ├────────────────────────────────────────┤');
  console.log(`   │  Email:     ${superAdmin.email.padEnd(27)}│`);
  console.log(`   │  Password:  ${password.padEnd(27)}│`);
  console.log('   └────────────────────────────────────────┘');
  console.log('\n   ⚠️  IMPORTANT: Change this password after first login!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
