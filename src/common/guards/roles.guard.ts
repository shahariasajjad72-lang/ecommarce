/**
 * ROLES GUARD
 *
 * Checks if the user has the required role(s) to access a route.
 * SUPERADMIN always has access to everything.
 *
 * EXAMPLE:
 *   @Roles(Role.SUPERADMIN)
 *   @Post('create-admin')
 *   createAdmin() { ... }  // Only SUPERADMIN can access
 */

import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';
import { ROLES_KEY } from '../decorators/permissions.decorator';
import { ERROR_MESSAGES } from '../constants';
import { AuthenticatedUser } from '../interfaces';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Get required roles from decorator
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // No roles required - allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Get user from request
    const request = context.switchToHttp().getRequest();
    const user: AuthenticatedUser = request.user;

    // No user or no role - deny access
    if (!user || !user.role) {
      throw new ForbiddenException(ERROR_MESSAGES.FORBIDDEN);
    }

    // SUPERADMIN has access to EVERYTHING
    if (user.role === Role.SUPERADMIN) {
      return true;
    }

    // Check if user has any of the required roles
    const hasRole = requiredRoles.includes(user.role);
    if (!hasRole) {
      throw new ForbiddenException(ERROR_MESSAGES.FORBIDDEN);
    }

    return true;
  }
}
