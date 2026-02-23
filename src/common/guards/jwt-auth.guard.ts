/**
 * JWT AUTHENTICATION GUARD
 *
 * This guard runs on EVERY request (except @Public routes).
 * It verifies the JWT token and attaches user data to request.
 *
 * HOW IT WORKS:
 * 1. Client sends request with header: Authorization: Bearer <token>
 * 2. Guard extracts and verifies the token
 * 3. If valid, user data is attached to request
 * 4. If invalid, 401 Unauthorized error is thrown
 */

import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { ERROR_MESSAGES } from '../constants';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Determines if the request should be allowed
   */
  canActivate(context: ExecutionContext) {
    // Check if route is marked as @Public()
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Public routes skip authentication
    if (isPublic) {
      return true;
    }

    // Otherwise, verify JWT token
    return super.canActivate(context);
  }

  /**
   * Handles the result of authentication
   */
  handleRequest(err: any, user: any, info: any) {
    // If there was an error or no user found
    if (err || !user) {
      // Check for specific token errors
      if (info?.name === 'TokenExpiredError') {
        throw new UnauthorizedException(ERROR_MESSAGES.TOKEN_EXPIRED);
      }
      if (info?.name === 'JsonWebTokenError') {
        throw new UnauthorizedException(ERROR_MESSAGES.TOKEN_INVALID);
      }
      throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
    }

    return user;
  }
}
