/**
 * AUTH CONTROLLER - PRODUCTION READY WITH COMPLETE SWAGGER DOCS
 *
 * All authentication endpoints with proper validation,
 * IP tracking, and comprehensive Swagger documentation.
 */

import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Patch,
  Param,
  Get,
  Delete,
  Query,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { AuthService } from './auth.service';
import {
  AdminLoginDto,
  CreateAdminDto,
  CustomerRegisterDto,
  CustomerLoginDto,
  RefreshTokenDto,
  UpdatePermissionsDto,
  ChangePasswordDto,
  AdminFilterDto,
} from './dto';
import {
  LoginResponseDto,
  AdminCreatedResponseDto,
  AdminListResponseDto,
  AdminUpdatedResponseDto,
  MessageResponseDto,
  ProfileResponseDto,
  ErrorResponseDto,
  ValidationErrorResponseDto,
} from './dto/response.dto';
import { Public } from '../common/decorators/public.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { ClientIp } from '../common/decorators/client-ip.decorator';
import type { AuthenticatedUser } from '../common/interfaces';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // =========================================
  // ADMIN ENDPOINTS
  // =========================================

  @ApiOperation({
    summary: 'Admin Login',
    description:
      'Authenticate admin user with email and password to receive JWT tokens (access + refresh)',
  })
  @ApiBody({ type: AdminLoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful - Returns access token and refresh token',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials or account inactive/deleted',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({
    status: 429,
    description: 'Too many login attempts - Rate limit exceeded',
  })
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 attempts per minute
  @Post('admin/login')
  @HttpCode(HttpStatus.OK)
  adminLogin(@Body() dto: AdminLoginDto, @ClientIp() ipAddress: string) {
    return this.authService.adminLogin(dto, ipAddress);
  }

  @ApiOperation({
    summary: 'Create New Admin',
    description:
      'SuperAdmin can create new admin accounts with specific roles and permissions. Cannot create another SuperAdmin.',
  })
  @ApiBody({ type: CreateAdminDto })
  @ApiResponse({
    status: 201,
    description: 'Admin account created successfully',
    type: AdminCreatedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Only SuperAdmin can create admins',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email already exists',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    type: ValidationErrorResponseDto,
  })
  @ApiBearerAuth('access-token')
  @Roles(Role.SUPERADMIN)
  @Throttle({ default: { limit: 10, ttl: 3600000 } }) // 10 per hour
  @Post('admin/create')
  createAdmin(
    @Body() dto: CreateAdminDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.authService.createAdmin(dto, currentUser);
  }

  @ApiOperation({
    summary: 'List All Admins',
    description:
      'Get paginated list of all admin accounts with optional filters (role, search, active status)',
  })
  @ApiResponse({
    status: 200,
    description: 'Admins retrieved successfully with pagination metadata',
    type: AdminListResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Only SuperAdmin can view admin list',
    type: ErrorResponseDto,
  })
  @ApiBearerAuth('access-token')
  @Roles(Role.SUPERADMIN)
  @Get('admin/list')
  getAllAdmins(
    @Query() filterDto: AdminFilterDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.authService.getAllAdmins(currentUser, filterDto);
  }

  @ApiOperation({
    summary: 'Update Admin Permissions',
    description:
      'SuperAdmin can modify permissions for any admin (except other SuperAdmins). All active tokens will be revoked.',
  })
  @ApiParam({
    name: 'adminId',
    description: 'Target admin ID (cuid format)',
    example: 'clxxxx1234567890',
  })
  @ApiBody({ type: UpdatePermissionsDto })
  @ApiResponse({
    status: 200,
    description: 'Permissions updated successfully',
    type: AdminUpdatedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Cannot modify SuperAdmin permissions',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Admin not found or deleted',
    type: ErrorResponseDto,
  })
  @ApiBearerAuth('access-token')
  @Roles(Role.SUPERADMIN)
  @Patch('admin/:adminId/permissions')
  updateAdminPermissions(
    @Param('adminId') adminId: string,
    @Body() dto: UpdatePermissionsDto,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.authService.updateAdminPermissions(
      adminId,
      dto.permissions,
      currentUser,
    );
  }

  @ApiOperation({
    summary: 'Disable Admin Account',
    description:
      'SuperAdmin can disable admin account (soft disable). All tokens will be revoked. Cannot disable own account or SuperAdmin.',
  })
  @ApiParam({
    name: 'adminId',
    description: 'Target admin ID',
    example: 'clxxxx1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Admin disabled successfully',
    type: AdminUpdatedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Cannot disable own account or SuperAdmin',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Admin not found',
    type: ErrorResponseDto,
  })
  @ApiBearerAuth('access-token')
  @Roles(Role.SUPERADMIN)
  @Patch('admin/:adminId/disable')
  disableAdmin(
    @Param('adminId') adminId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.authService.disableAdmin(adminId, currentUser);
  }

  @ApiOperation({
    summary: 'Enable Admin Account',
    description: 'SuperAdmin can re-enable previously disabled admin account',
  })
  @ApiParam({
    name: 'adminId',
    description: 'Target admin ID',
    example: 'clxxxx1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Admin enabled successfully',
    type: AdminUpdatedResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Admin not found',
    type: ErrorResponseDto,
  })
  @ApiBearerAuth('access-token')
  @Roles(Role.SUPERADMIN)
  @Patch('admin/:adminId/enable')
  enableAdmin(
    @Param('adminId') adminId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.authService.enableAdmin(adminId, currentUser);
  }

  @ApiOperation({
    summary: 'Delete Admin Account',
    description:
      'SuperAdmin can soft delete admin account (sets isDeleted = true, isActive = false). All tokens will be revoked. Cannot delete own account or SuperAdmin.',
  })
  @ApiParam({
    name: 'adminId',
    description: 'Target admin ID',
    example: 'clxxxx1234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Admin deleted successfully',
    type: AdminUpdatedResponseDto,
  })
  @ApiResponse({
    status: 403,
    description: 'Cannot delete own account or SuperAdmin',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Admin not found',
    type: ErrorResponseDto,
  })
  @ApiBearerAuth('access-token')
  @Roles(Role.SUPERADMIN)
  @Delete('admin/:adminId')
  deleteAdmin(
    @Param('adminId') adminId: string,
    @CurrentUser() currentUser: AuthenticatedUser,
  ) {
    return this.authService.deleteAdmin(adminId, currentUser);
  }

  // =========================================
  // CUSTOMER ENDPOINTS
  // =========================================

  @ApiOperation({
    summary: 'Customer Registration',
    description:
      'Create new customer account. Phone is required and must be unique. Email and password are optional for guest checkout.',
  })
  @ApiBody({ type: CustomerRegisterDto })
  @ApiResponse({
    status: 201,
    description: 'Customer account created successfully with tokens',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Phone or email already exists',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    type: ValidationErrorResponseDto,
  })
  @ApiResponse({
    status: 429,
    description: 'Too many registration attempts',
  })
  @Public()
  @Throttle({ default: { limit: 3, ttl: 60000 } }) // 3 per minute
  @Post('customer/register')
  customerRegister(
    @Body() dto: CustomerRegisterDto,
    @ClientIp() ipAddress: string,
  ) {
    return this.authService.customerRegister(dto, ipAddress);
  }

  @ApiOperation({
    summary: 'Customer Login',
    description:
      'Login with email or phone + password. Provide either email or phone.',
  })
  @ApiBody({ type: CustomerLoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials or account inactive',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error',
    type: ValidationErrorResponseDto,
  })
  @Public()
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 per minute
  @Post('customer/login')
  @HttpCode(HttpStatus.OK)
  customerLogin(@Body() dto: CustomerLoginDto, @ClientIp() ipAddress: string) {
    return this.authService.customerLogin(dto, ipAddress);
  }

  // =========================================
  // COMMON ENDPOINTS (Admin & Customer)
  // =========================================

  @ApiOperation({
    summary: 'Refresh Access Token',
    description:
      'Get new access token using valid refresh token. Token rotation is applied - old refresh token will be revoked.',
  })
  @ApiBody({ type: RefreshTokenDto })
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed successfully with new token pair',
    type: LoginResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
    type: ErrorResponseDto,
  })
  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refreshTokens(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @ApiOperation({
    summary: 'Logout Current Session',
    description: 'Revoke current session tokens (requires authentication)',
  })
  @ApiResponse({
    status: 200,
    description: 'Logged out successfully',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  @ApiBearerAuth('access-token')
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  logout(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.logout(user.id, user.userType);
  }

  @ApiOperation({
    summary: 'Logout All Sessions',
    description:
      'Revoke ALL tokens for current user across all devices (requires authentication)',
  })
  @ApiResponse({
    status: 200,
    description: 'All sessions logged out',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  @ApiBearerAuth('access-token')
  @Post('logout-all')
  @HttpCode(HttpStatus.OK)
  logoutAll(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.logoutAll(user.id, user.userType);
  }

  @ApiOperation({
    summary: 'Get Current User Profile',
    description: 'Retrieve authenticated user information (Admin or Customer)',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
    type: ProfileResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Not authenticated',
    type: ErrorResponseDto,
  })
  @ApiBearerAuth('access-token')
  @Get('me')
  getProfile(@CurrentUser() user: AuthenticatedUser) {
    return {
      message: 'Profile retrieved successfully',
      data: user,
    };
  }

  @ApiOperation({
    summary: 'Change Password',
    description:
      'Change current user password. Requires current password for verification. All sessions will be logged out after password change.',
  })
  @ApiBody({ type: ChangePasswordDto })
  @ApiResponse({
    status: 200,
    description: 'Password changed successfully - All sessions logged out',
    type: MessageResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Current password incorrect or not authenticated',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation error or new password same as current',
    type: ValidationErrorResponseDto,
  })
  @ApiBearerAuth('access-token')
  @Patch('change-password')
  @HttpCode(HttpStatus.OK)
  changePassword(
    @Body() dto: ChangePasswordDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.authService.changePassword(user.id, user.userType, dto);
  }
}
