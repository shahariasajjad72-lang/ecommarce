/**
 * CATEGORY FILTER & RESPONSE DTOs
 */

import {
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  Max,
  IsString,
} from 'class-validator';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

// ========================================
// FILTER DTO
// ========================================
export class CategoryFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by parent category ID',
    example: 'clxxxx1234567890',
  })
  @IsOptional()
  parentId?: string;

  @ApiPropertyOptional({
    description: 'Filter by level (0 = root)',
    example: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  level?: number;

  @ApiPropertyOptional({
    description: 'Filter by active status',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Include deleted categories',
    example: false,
    default: false,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeDeleted?: boolean;

  @ApiPropertyOptional({
    description: 'Search by name, slug, or description',
    example: 'electronics',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

// ========================================
// RESPONSE DTOs FOR SWAGGER
// ========================================

export class BreadcrumbItemDto {
  @ApiProperty({ example: 'clxxxx1234567890' })
  id: string;

  @ApiProperty({ example: 'Electronics' })
  name: string;

  @ApiProperty({ example: 'electronics' })
  slug: string;

  @ApiProperty({ example: 0 })
  level: number;
}

export class CategoryTreeDto {
  @ApiProperty({ example: 'clxxxx1234567890' })
  id: string;

  @ApiProperty({ example: 'Electronics' })
  name: string;

  @ApiProperty({ example: 'electronics' })
  slug: string;

  @ApiProperty({ example: 'clxxxx0987654321', nullable: true })
  parentId: string | null;

  @ApiProperty({ example: '/electronics' })
  path: string;

  @ApiProperty({ example: 0 })
  level: number;

  @ApiProperty({ example: false })
  isLeaf: boolean;

  @ApiProperty({ example: 'All electronic items', nullable: true })
  description?: string;

  @ApiProperty({
    example: 'https://example.com/images/electronics.jpg',
    nullable: true,
  })
  image?: string;

  @ApiProperty({ example: 'icon-electronics', nullable: true })
  icon?: string;

  @ApiProperty({ example: 1 })
  sortOrder: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ type: [CategoryTreeDto] })
  children?: CategoryTreeDto[];

  @ApiProperty({ example: '2024-01-28T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-28T10:00:00.000Z' })
  updatedAt: Date;
}

export class CategoryResponseDto {
  @ApiProperty({ example: 'clxxxx1234567890' })
  id: string;

  @ApiProperty({ example: 'Electronics' })
  name: string;

  @ApiProperty({ example: 'electronics' })
  slug: string;

  @ApiProperty({ example: 'clxxxx0987654321', nullable: true })
  parentId: string | null;

  @ApiProperty({ example: '/electronics' })
  path: string;

  @ApiProperty({ example: 0 })
  level: number;

  @ApiProperty({ example: false })
  isLeaf: boolean;

  @ApiProperty({ example: 'All electronic items', nullable: true })
  description?: string;

  @ApiProperty({
    example: 'https://example.com/images/electronics.jpg',
    nullable: true,
  })
  image?: string;

  @ApiProperty({ example: 'icon-electronics', nullable: true })
  icon?: string;

  @ApiProperty({ example: 1 })
  sortOrder: number;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2024-01-28T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2024-01-28T10:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ example: 2, description: 'Number of direct children' })
  childrenCount?: number;
}
