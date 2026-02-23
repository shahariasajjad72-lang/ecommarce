import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsIn, MaxLength } from 'class-validator';
import { VALID_FOLDERS } from '../upload.constants';

export class UploadQueryDto {
  @ApiPropertyOptional({
    description: 'Folder to store image',
    enum: VALID_FOLDERS,
    example: 'product',
  })
  @IsOptional()
  @IsString()
  @IsIn([...VALID_FOLDERS]) // FIX: Spread to regular array
  folder?: string;

  @ApiPropertyOptional({
    description: 'Alt text for SEO',
    example: 'Red Nike Running Shoes',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  alt?: string;
}
