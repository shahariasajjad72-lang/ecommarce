/**
 * ============================================
 * PERMISSIONS GUARD
 * ============================================
 *
 * WHAT THIS GUARD DOES:
 * Checks if the authenticated user has specific PERMISSIONS to access a route.
 * More granular than roles - allows fine-grained access control.
 *
 * PERMISSION EXAMPLES:
 * - MANAGE_USERS: Create, update, delete users
 * - MANAGE_PRODUCTS: Full product management
 * - VIEW_PRODUCTS: Read-only product access
 * - MANAGE_ORDERS: Process and update orders
 * - VIEW_ORDERS: Read-only order access
 * - VIEW_REPORTS: Access analytics dashboard
 *
 * PERMISSION LOGIC:
 * If a route requires multiple permissions, user must have ALL of them.
 * @Permissions(Permission.MANAGE_ORDERS, Permission.MANAGE_PAYMENTS)
 * → User needs BOTH permissions to access
 *
 * SUPERADMIN BYPASS:
 * SuperAdmin automatically has ALL permissions.
 *
 * HOW TO USE:
 *
 * // Single permission required
 * @Permissions(Permission.MANAGE_PRODUCTS)
 * @Post('products')
 * createProduct() { ... }
 *
 * // Multiple permissions required (must have ALL)
 * @Permissions(Permission.MANAGE_ORDERS, Permission.MANAGE_PAYMENTS)
 * @Post('orders/:id/refund')
 * processRefund() { ... }
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Permission, Role } from '@prisma/client';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { ERROR_MESSAGES } from '../constants';
import { AuthenticatedUser } from '../interfaces';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  /**
   * Determines if the user can access the route based on their permissions.
   *
   * @param context - Execution context
   * @returns true if allowed, throws ForbiddenException if denied
   */
  canActivate(context: ExecutionContext): boolean {
    // Get required permissions from @Permissions() decorator
    const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no @Permissions() decorator, allow access
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    // Get user from request
    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;

    // No user found
    if (!user) {
      throw new ForbiddenException(ERROR_MESSAGES.FORBIDDEN);
    }

    // SUPERADMIN BYPASS: Has all permissions
    if (user.role === Role.SUPERADMIN) {
      return true;
    }

    // User has no permissions assigned
    if (!user.permissions || user.permissions.length === 0) {
      throw new ForbiddenException(ERROR_MESSAGES.FORBIDDEN);
    }

    // Check if user has ALL required permissions
    // Using . every() means ALL permissions must be present
    const hasAllPermissions = requiredPermissions.every((permission) =>
      user.permissions!.includes(permission),
    );

    if (!hasAllPermissions) {
      throw new ForbiddenException(ERROR_MESSAGES.FORBIDDEN);
    }

    return true;
  }
}
