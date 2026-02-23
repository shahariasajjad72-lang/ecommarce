/**
 * CREATE ADMIN DTO
 */

import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsEnum,
  IsArray,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role, Permission } from '@prisma/client';

export class CreateAdminDto {
  @ApiProperty({
    description: 'Admin first name',
    example: 'John',
    type: String,
  })
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @ApiProperty({
    description: 'Admin last name',
    example: 'Doe',
    type: String,
  })
  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;

  @ApiProperty({
    description: 'Admin email address (must be unique)',
    example: 'john.doe@company.com',
    type: String,
  })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description:
      'Strong password (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char)',
    example: 'SecurePass@123',
    minLength: 8,
    type: String,
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/, {
    message:
      'Password must contain uppercase, lowercase, number and special character',
  })
  password: string;

  @ApiPropertyOptional({
    description: 'Admin phone number (optional)',
    example: '+8801712345678',
    type: String,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({
    description: 'Admin role (cannot be SUPERADMIN)',
    enum: Role,
    example: Role.ADMIN,
    default: Role.ADMIN,
  })
  @IsOptional()
  @IsEnum(Role, { message: 'Invalid role' })
  role?: Role;

  @ApiPropertyOptional({
    description: 'Array of permissions to grant to the admin',
    enum: Permission,
    isArray: true,
    example: [Permission.MANAGE_PRODUCTS, Permission.MANAGE_ORDERS],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(Permission, { each: true, message: 'Invalid permission' })
  permissions?: Permission[];
}
