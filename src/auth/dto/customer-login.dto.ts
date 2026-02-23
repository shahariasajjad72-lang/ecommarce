/**
 * CUSTOMER LOGIN DTO
 */

import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CustomerLoginDto {
  @ApiPropertyOptional({
    description: 'Customer email (provide either email or phone)',
    example: 'customer@email.com',
    type: String,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @ApiPropertyOptional({
    description: 'Customer phone (provide either email or phone)',
    example: '+8801712345678',
    type: String,
  })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({
    description: 'Customer password',
    example: 'MyPass@123',
    type: String,
  })
  @IsString()
  @IsNotEmpty({ message: 'Password is required' })
  password: string;
}
