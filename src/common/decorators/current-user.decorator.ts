/**
 * CURRENT USER DECORATOR
 *
 * Extracts the logged-in user from the request.
 * After JWT verification, the user data is attached to the request.
 *
 * EXAMPLE:
 *   @Get('profile')
 *   getProfile(@CurrentUser() user: AuthenticatedUser) {
 *     return user;
 *   }
 *
 *   // Get just the user ID
 *   @Get('my-orders')
 *   getOrders(@CurrentUser('id') userId: string) {
 *     return this.orderService.findByUser(userId);
 *   }
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { AuthenticatedUser } from '../interfaces';

export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser;

    // If specific property requested, return just that
    if (data) {
      return user?.[data];
    }

    // Otherwise return full user object
    return user;
  },
);
