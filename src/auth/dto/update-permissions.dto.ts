/**
 * UPDATE PERMISSIONS DTO
 */

import { IsArray, IsEnum, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Permission } from '@prisma/client';

export class UpdatePermissionsDto {
  @ApiProperty({
    description: 'Array of permissions to assign to the admin',
    enum: Permission,
    isArray: true,
    example: [
      Permission.MANAGE_PRODUCTS,
      Permission.MANAGE_ORDERS,
      // Permission.VIEW_ANALYTICS,
    ],
    type: [String],
  })
  @IsArray()
  @IsNotEmpty({ message: 'Permissions array cannot be empty' })
  @IsEnum(Permission, { each: true, message: 'Invalid permission value' })
  permissions: Permission[];
}
