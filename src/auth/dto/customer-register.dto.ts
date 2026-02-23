/**
 * CUSTOMER REGISTRATION DTO
 */

import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  Matches,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CustomerRegisterDto {
  @ApiProperty({
    description: 'Customer first name',
    example: 'Jane',
    type: String,
  })
  @IsString()
  @IsNotEmpty({ message: 'First name is required' })
  firstName: string;

  @ApiProperty({
    description: 'Customer last name',
    example: 'Smith',
    type: String,
  })
  @IsString()
  @IsNotEmpty({ message: 'Last name is required' })
  lastName: string;

  @ApiProperty({
    description: 'Phone number (required, must be unique)',
    example: '+8801712345678',
    type: String,
  })
  @IsString()
  @IsNotEmpty({ message: 'Phone is required' })
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Invalid phone number format',
  })
  phone: string;

  @ApiPropertyOptional({
    description: 'Email address (optional for guest checkout)',
    example: 'jane.smith@email.com',
    type: String,
  })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  email?: string;

  @ApiPropertyOptional({
    description:
      'Password (optional for guest checkout, min 8 chars if provided)',
    example: 'MyPass@123',
    minLength: 8,
    type: String,
  })
  @IsOptional()
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password?: string;

  @ApiPropertyOptional({
    description: 'Delivery address',
    example: '123 Main St, Dhaka, Bangladesh',
    type: String,
  })
  @IsOptional()
  @IsString()
  address?: string;
}
