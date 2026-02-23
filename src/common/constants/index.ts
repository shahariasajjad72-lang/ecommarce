/**
 * CONSTANTS
 *
 * Centralized place for all constant values.
 * This makes it easy to change messages or config in one place.
 */

// Error messages - consistent across the app
export const ERROR_MESSAGES = {
  // Authentication
  INVALID_CREDENTIALS: 'Invalid email or password',
  UNAUTHORIZED: 'You must be logged in to access this resource',
  FORBIDDEN: 'You do not have permission to perform this action',
  TOKEN_EXPIRED: 'Your session has expired. Please login again',
  TOKEN_INVALID: 'Invalid token',

  // User errors
  USER_NOT_FOUND: 'User not found',
  USER_INACTIVE: 'Your account has been deactivated',
  EMAIL_EXISTS: 'An account with this email already exists',
  PHONE_EXISTS: 'An account with this phone number already exists',

  // Admin errors
  ONLY_SUPERADMIN: 'Only SuperAdmin can perform this action',
  CANNOT_MODIFY_SUPERADMIN: 'Cannot modify SuperAdmin account',
  SUPERADMIN_EXISTS: 'SuperAdmin already exists',
};

// Success messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logged out successfully',
  REGISTER_SUCCESS: 'Account created successfully',
  ADMIN_CREATED: 'Admin created successfully',
  PASSWORD_CHANGED: 'Password changed successfully',
};

// Configuration constants
export const AUTH_CONFIG = {
  SALT_ROUNDS: 12,
  ACCESS_TOKEN_EXPIRY: '15m',
  REFRESH_TOKEN_EXPIRY: '7d',
  MAX_LOGIN_ATTEMPTS: 5,
  LOCK_TIME_MINUTES: 30,
};
