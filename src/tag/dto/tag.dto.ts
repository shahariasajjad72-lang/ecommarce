/**
 * Tag DTOs
 */

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  Matches,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ========================================
// CREATE Tag DTO
// ========================================

export class CreateTagDto {
  @ApiProperty({
    description: 'Tag name',
    example: 'Apple',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'Tag name is required' })
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'URL-friendly slug (auto-generated if not provided)',
    example: 'apple',
    maxLength: 150,
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase with hyphens only',
  })
  slug?: string;

  @ApiPropertyOptional({
    description: 'Tag logo URL',
    example: 'https://example.com/logos/apple.png',
  })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional({
    description: 'Tag description',
    example: 'American multinational technology company',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'SEO meta title',
    example: 'Apple Products - Buy iPhone, iPad, MacBook',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  metaTitle?: string;

  @ApiPropertyOptional({
    description: 'SEO meta description',
    example:
      'Shop the latest Apple products including iPhone, iPad, MacBook, and more. Authorized reseller with warranty.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  metaDescription?: string;
}

// ========================================
// UPDATE Tag DTO
// ========================================

export class UpdateTagDto {
  @ApiPropertyOptional({
    description: 'Tag name',
    example: 'Apple',
    maxLength: 100,
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  name?: string;

  @ApiPropertyOptional({
    description: 'URL-friendly slug',
    example: 'apple',
    maxLength: 150,
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase with hyphens only',
  })
  slug?: string;

  @ApiPropertyOptional({
    description: 'Tag logo URL',
    example: 'https://example.com/logos/apple.png',
  })
  @IsOptional()
  @IsString()
  logo?: string;

  @ApiPropertyOptional({
    description: 'Tag description',
    example: 'American multinational technology company',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'SEO meta title',
    example: 'Apple Products - Buy iPhone, iPad, MacBook',
    maxLength: 255,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  metaTitle?: string;

  @ApiPropertyOptional({
    description: 'SEO meta description',
    example:
      'Shop the latest Apple products including iPhone, iPad, MacBook, and more.',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  metaDescription?: string;

  @ApiPropertyOptional({
    description: 'Active status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
