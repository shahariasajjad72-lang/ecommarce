import { ApiProperty } from '@nestjs/swagger';
import { IsArray, ArrayNotEmpty, IsString } from 'class-validator';

export class DeleteImagesDto {
  @ApiProperty({
    description: 'Array of image IDs to delete',
    example: ['clxxxx1', 'clxxxx2'],
  })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  imageIds: string[];
}
