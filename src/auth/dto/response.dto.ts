/**
 * SWAGGER RESPONSE DTOs
 *
 * These classes document the API response structures in Swagger UI
 */

import { ApiProperty } from '@nestjs/swagger';
import { Role, Permission } from '@prisma/client';

// ============================================
// AUTH RESPONSE DTOs
// ============================================

export class UserResponseDto {
  @ApiProperty({ example: 'clxxxx1234567890' })
  id: string;

  @ApiProperty({ example: 'john.doe@company.com' })
  email: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ enum: Role, example: Role.ADMIN })
  role?: Role;

  @ApiProperty({
    enum: Permission,
    isArray: true,
    example: [Permission.MANAGE_PRODUCTS, Permission.MANAGE_ORDERS],
  })
  permissions?: Permission[];
}

export class TokenDataDto {
  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbHh4eHh4IiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIn0.example',
  })
  accessToken: string;

  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJjbHh4eHh4IiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIn0.refresh',
  })
  refreshToken: string;

  @ApiProperty({ type: UserResponseDto })
  user: UserResponseDto;
}

export class LoginResponseDto {
  @ApiProperty({ example: 'Login successful' })
  message: string;

  @ApiProperty({ type: TokenDataDto })
  data: TokenDataDto;
}

export class AdminResponseDto {
  @ApiProperty({ example: 'clxxxx1234567890' })
  id: string;

  @ApiProperty({ example: 'John' })
  firstName: string;

  @ApiProperty({ example: 'Doe' })
  lastName: string;

  @ApiProperty({ example: 'john.doe@company.com' })
  email: string;

  @ApiProperty({ example: '+8801712345678', required: false })
  phone?: string;

  @ApiProperty({ enum: Role, example: Role.ADMIN })
  role: Role;

  @ApiProperty({
    enum: Permission,
    isArray: true,
    example: [Permission.MANAGE_PRODUCTS],
  })
  permissions: Permission[];

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2024-01-28T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-28T10:00:00.000Z', required: false })
  lastLoginAt?: Date;
}

export class AdminCreatedResponseDto {
  @ApiProperty({ example: 'Admin created successfully' })
  message: string;

  @ApiProperty({ type: AdminResponseDto })
  data: AdminResponseDto;
}

export class AdminListMetaDto {
  @ApiProperty({ example: 25 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;

  @ApiProperty({ example: 3 })
  totalPages: number;
}

export class AdminListResponseDto {
  @ApiProperty({ example: 'Admins retrieved successfully' })
  message: string;

  @ApiProperty({ type: [AdminResponseDto] })
  data: AdminResponseDto[];

  @ApiProperty({ type: AdminListMetaDto })
  meta: AdminListMetaDto;
}

export class MessageResponseDto {
  @ApiProperty({ example: 'Operation successful' })
  message: string;
}

export class AdminUpdatedResponseDto {
  @ApiProperty({ example: 'Admin updated successfully' })
  message: string;

  @ApiProperty({ type: AdminResponseDto })
  data: AdminResponseDto;
}

export class ProfileResponseDto {
  @ApiProperty({ example: 'Profile retrieved successfully' })
  message: string;

  @ApiProperty({ type: UserResponseDto })
  data: UserResponseDto;
}

// ============================================
// ERROR RESPONSE DTOs
// ============================================

export class ErrorResponseDto {
  @ApiProperty({ example: 401 })
  statusCode: number;

  @ApiProperty({ example: 'Invalid credentials' })
  message: string;

  @ApiProperty({ example: 'Unauthorized' })
  error: string;
}

export class ValidationErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({
    example: ['email must be a valid email', 'password is too short'],
    isArray: true,
  })
  message: string[];

  @ApiProperty({ example: 'Bad Request' })
  error: string;
}
