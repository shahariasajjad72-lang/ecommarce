/**
 * TYPESCRIPT INTERFACES
 *
 * These define the "shape" of data in our application.
 */

import { AuthUserType, Permission, Role } from '@prisma/client';

/**
 * Data stored inside JWT token
 */
export interface JwtPayload {
  sub: string;
  email: string;
  userType: AuthUserType;
  role?: Role;
  permissions?: Permission[];
}

/**
 * User object attached to request after JWT verification
 */
export interface AuthenticatedUser {
  id: string;
  email: string;
  userType: AuthUserType;
  role?: Role;
  permissions?: Permission[];
}

/**
 * Token pair returned after login
 */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/**
 * Standard API response format
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
  timestamp: string;
}
