/**
 * PUBLIC DECORATOR
 *
 * By default, all routes require authentication (JWT token).
 * Use @Public() decorator to make a route accessible without login.
 *
 * EXAMPLE:
 *   @Public()
 *   @Post('login')
 *   login() { ... }
 */

import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
