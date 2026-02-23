import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty, IsString } from 'class-validator';

export class ReorderImagesDto {
  @ApiProperty({
    description: 'Array of image IDs in desired order',
    example: ['clxxxx2', 'clxxxx1', 'clxxxx3'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  imageIds: string[];
}
