import {
  IsString,
  IsNotEmpty,
  IsOptional,
  MaxLength,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * ADD CATEGORY TO LEVEL DTO
 * For level-based category creation
 */
export class AddCategoryToLevelDto {
  @ApiProperty({
    description: 'Target level for new category',
    example: 1,
    minimum: 0,
    maximum: 10,
  })
  @IsInt()
  @Min(0, { message: 'Level cannot be negative' })
  @Max(10, { message: 'Maximum level is 10' })
  level: number;

  @ApiProperty({
    description: 'Category name',
    example: 'Laptop',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty({ message: 'Category name is required' })
  @MaxLength(100, { message: 'Name cannot exceed 100 characters' })
  name: string;

  @ApiPropertyOptional({
    description:
      'Parent category ID (required for level > 0, must be from previous level)',
    example: 'cml0f7lt100012codvw12sm38',
    nullable: true,
  })
  @IsOptional()
  @IsString()
  parentId?: string;

  @ApiPropertyOptional({
    description: 'Category description',
    example: 'All laptop computers',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Category image URL',
    example: 'https://example.com/images/laptop.jpg',
  })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({
    description: 'Category icon URL or class',
    example: 'icon-laptop',
  })
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiPropertyOptional({
    description: 'Sort order for display',
    example: 2,
    default: 0,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;
}
