/**
 * IMAGE RESPONSE DTO
 */

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ImageResponseDto {
  @ApiProperty({ example: 'clxxxx1234567890' })
  id: string;

  @ApiProperty({ example: 'product-photo.jpg' })
  originalName: string;

  @ApiProperty({
    example: 'https://yourdomain.com/uploads/product/2026/02/abc123.webp',
  })
  url: string;

  @ApiPropertyOptional({
    example: 'https://yourdomain.com/uploads/product/2026/02/abc123-thumb.webp',
  })
  thumbnailUrl?: string;

  @ApiPropertyOptional({ example: 1200 })
  width?: number;

  @ApiPropertyOptional({ example: 800 })
  height?: number;

  @ApiProperty({ example: 45000 })
  size: number;
}
