/**
 * PERMISSIONS DECORATOR & GUARD
 */

import { SetMetadata } from '@nestjs/common';
import { Permission } from '@prisma/client';

export const PERMISSIONS_KEY = 'permissions';
export const Permissions = (...permissions: Permission[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);

// Also export ROLES_KEY for guards
export { ROLES_KEY } from './roles.decorator';
