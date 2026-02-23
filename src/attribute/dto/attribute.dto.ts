/**
 * ATTRIBUTE DTOs - ALL IN ONE FILE
 */

import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  Matches,
  IsInt,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

// ========================================
// ATTRIBUTE SET DTOs
// ========================================

export class CreateAttributeSetDto {
  @ApiProperty({ example: 'Specifications', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'specifications' })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

// ========================================
// ATTRIBUTE DTOs
// ========================================

export class CreateAttributeDto {
  @ApiProperty({ example: 'RAM', maxLength: 100 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({ example: 'ram' })
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  slug?: string;

  @ApiProperty({ example: 'clxxxx1234567890' })
  @IsNotEmpty()
  @IsString()
  attributeSetId: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}

// ========================================
// ATTRIBUTE VALUE DTOs
// ========================================

export class CreateAttributeValueDto {
  @ApiProperty({ example: '8GB', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  value: string;

  @ApiProperty({ example: 'clxxxx1234567890' })
  @IsNotEmpty()
  @IsString()
  attributeId: string;

  // @ApiPropertyOptional({ example: '#FF0000' })
  // @IsOptional()
  // @IsString()
  // @Matches(/^#[0-9A-F]{6}$/i)
  // colorCode?: string;

  @ApiPropertyOptional({ default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
