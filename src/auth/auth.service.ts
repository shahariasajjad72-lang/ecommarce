/**
 * AUTH SERVICE - PRODUCTION READY V2
 *
 * Complete authentication service with:
 * - Refactored duplicate code
 * - IP address tracking on all operations
 * - Pagination support
 * - Password change functionality
 * - Enhanced error handling
 * - Comprehensive audit logging
 */

import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  ForbiddenException,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { AuthUserType, Permission, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import {
  AdminLoginDto,
  CreateAdminDto,
  CustomerRegisterDto,
  CustomerLoginDto,
  AdminFilterDto,
  ChangePasswordDto,
} from './dto';
import type { TokenPair, AuthenticatedUser } from '../common/interfaces';
import { ERROR_MESSAGES, SUCCESS_MESSAGES } from '../common/constants';

interface JwtTokenPayload {
  sub: string;
  email: string;
  userType: AuthUserType;
  role?: Role;
  permissions?: Permission[];
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  // =========================================
  // ADMIN AUTHENTICATION
  // =========================================

  /**
   * Admin Login with IP tracking
   */
  async adminLogin(dto: AdminLoginDto, ipAddress?: string) {
    const admin = await this.prisma.admin.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (!admin) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    if (admin.isDeleted || !admin.isActive) {
      throw new UnauthorizedException(ERROR_MESSAGES.USER_INACTIVE);
    }

    const isPasswordValid = await bcrypt.compare(dto.password, admin.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    const tokens = this.generateTokens({
      sub: admin.id,
      email: admin.email,
      userType: AuthUserType.ADMIN,
      role: admin.role,
      permissions: admin.permissions,
    });

    await this.saveRefreshToken(
      admin.id,
      AuthUserType.ADMIN,
      tokens.refreshToken,
      ipAddress,
    );

    await this.prisma.admin.update({
      where: { id: admin.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
      },
    });

    this.logger.log(`Admin logged in: ${admin.email} from ${ipAddress}`);

    return {
      message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: admin.id,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
          role: admin.role,
          permissions: admin.permissions,
        },
      },
    };
  }

  /**
   * Create Admin (SuperAdmin only) with Audit Logging
   */
  async createAdmin(dto: CreateAdminDto, currentUser: AuthenticatedUser) {
    if (currentUser.role !== Role.SUPERADMIN) {
      throw new ForbiddenException(ERROR_MESSAGES.ONLY_SUPERADMIN);
    }

    if (dto.role === Role.SUPERADMIN) {
      throw new ForbiddenException('Cannot create another SuperAdmin');
    }

    const existingAdmin = await this.prisma.admin.findUnique({
      where: { email: dto.email.toLowerCase() },
    });

    if (existingAdmin) {
      throw new ConflictException(ERROR_MESSAGES.EMAIL_EXISTS);
    }

    const saltRounds =
      this.configService.get<number>('security.bcryptRounds') ?? 12;
    const hashedPassword = await bcrypt.hash(dto.password, saltRounds);

    const result = await this.prisma.$transaction(async (tx) => {
      const admin = await tx.admin.create({
        data: {
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email.toLowerCase(),
          password: hashedPassword,
          phone: dto.phone,
          role: dto.role || Role.ADMIN,
          permissions: dto.permissions || [],
          createdBy: currentUser.id,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          permissions: true,
          createdAt: true,
        },
      });

      await this.createAuditLog(tx, {
        actorRole: currentUser.role!,
        actorId: currentUser.id,
        action: 'CREATE_ADMIN',
        model: 'Admin',
        recordId: admin.id,
        newData: {
          email: admin.email,
          role: admin.role,
          permissions: admin.permissions,
        },
      });

      return admin;
    });

    this.logger.log(`Admin created: ${result.email} by ${currentUser.email}`);

    return {
      message: SUCCESS_MESSAGES.ADMIN_CREATED,
      data: result,
    };
  }

  /**
   * Get All Admins with Pagination and Filters
   */
  async getAllAdmins(currentUser: AuthenticatedUser, filters: AdminFilterDto) {
    if (currentUser.role !== Role.SUPERADMIN) {
      throw new ForbiddenException(ERROR_MESSAGES.ONLY_SUPERADMIN);
    }

    const { page = 1, limit = 10, role, search, isActive } = filters;
    const skip = (page - 1) * limit;

    // Build dynamic where clause
    const where: any = { isDeleted: false };

    if (role) {
      where.role = role;
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [admins, total] = await Promise.all([
      this.prisma.admin.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          role: true,
          permissions: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.admin.count({ where }),
    ]);

    return {
      message: 'Admins retrieved successfully',
      data: admins,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update Admin Permissions with Audit Logging
   */
  async updateAdminPermissions(
    adminId: string,
    permissions: Permission[],
    currentUser: AuthenticatedUser,
  ) {
    if (currentUser.role !== Role.SUPERADMIN) {
      throw new ForbiddenException(ERROR_MESSAGES.ONLY_SUPERADMIN);
    }

    const admin = await this.prisma.admin.findFirst({
      where: { id: adminId, isDeleted: false },
    });

    if (!admin) {
      throw new BadRequestException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    if (admin.role === Role.SUPERADMIN) {
      throw new ForbiddenException(ERROR_MESSAGES.CANNOT_MODIFY_SUPERADMIN);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.admin.update({
        where: { id: adminId },
        data: {
          permissions: {
            set: permissions,
          },
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          role: true,
          permissions: true,
        },
      });

      await this.createAuditLog(tx, {
        actorRole: currentUser.role!,
        actorId: currentUser.id,
        action: 'UPDATE_PERMISSIONS',
        model: 'Admin',
        recordId: adminId,
        oldData: { permissions: admin.permissions },
        newData: { permissions },
      });

      return updated;
    });

    await this.revokeAllUserTokens(adminId, AuthUserType.ADMIN);

    this.logger.log(
      `Admin permissions updated: ${admin.email} by ${currentUser.email}`,
    );

    return {
      message: 'Permissions updated successfully',
      data: result,
    };
  }

  /**
   * Disable Admin Account
   */
  async disableAdmin(adminId: string, currentUser: AuthenticatedUser) {
    if (currentUser.role !== Role.SUPERADMIN) {
      throw new ForbiddenException(ERROR_MESSAGES.ONLY_SUPERADMIN);
    }

    if (adminId === currentUser.id) {
      throw new ForbiddenException('Cannot disable your own account');
    }

    const admin = await this.prisma.admin.findFirst({
      where: { id: adminId, isDeleted: false },
    });

    if (!admin) {
      throw new BadRequestException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    if (admin.role === Role.SUPERADMIN) {
      throw new ForbiddenException(ERROR_MESSAGES.CANNOT_MODIFY_SUPERADMIN);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.admin.update({
        where: { id: adminId },
        data: { isActive: false },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          isActive: true,
        },
      });

      await this.createAuditLog(tx, {
        actorRole: currentUser.role!,
        actorId: currentUser.id,
        action: 'DISABLE_ADMIN',
        model: 'Admin',
        recordId: adminId,
        oldData: { isActive: admin.isActive },
        newData: { isActive: false },
      });

      return updated;
    });

    await this.revokeAllUserTokens(adminId, AuthUserType.ADMIN);

    this.logger.log(`Admin disabled: ${admin.email} by ${currentUser.email}`);

    return {
      message: 'Admin disabled successfully',
      data: result,
    };
  }

  /**
   * Enable Admin Account
   */
  async enableAdmin(adminId: string, currentUser: AuthenticatedUser) {
    if (currentUser.role !== Role.SUPERADMIN) {
      throw new ForbiddenException(ERROR_MESSAGES.ONLY_SUPERADMIN);
    }

    const admin = await this.prisma.admin.findFirst({
      where: { id: adminId, isDeleted: false },
    });

    if (!admin) {
      throw new BadRequestException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.admin.update({
        where: { id: adminId },
        data: { isActive: true },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          isActive: true,
        },
      });

      await this.createAuditLog(tx, {
        actorRole: currentUser.role!,
        actorId: currentUser.id,
        action: 'ENABLE_ADMIN',
        model: 'Admin',
        recordId: adminId,
        oldData: { isActive: admin.isActive },
        newData: { isActive: true },
      });

      return updated;
    });

    this.logger.log(`Admin enabled: ${admin.email} by ${currentUser.email}`);

    return {
      message: 'Admin enabled successfully',
      data: result,
    };
  }

  /**
   * Delete Admin Account (Soft Delete)
   */
  async deleteAdmin(adminId: string, currentUser: AuthenticatedUser) {
    if (currentUser.role !== Role.SUPERADMIN) {
      throw new ForbiddenException(ERROR_MESSAGES.ONLY_SUPERADMIN);
    }

    if (adminId === currentUser.id) {
      throw new ForbiddenException('Cannot delete your own account');
    }

    const admin = await this.prisma.admin.findFirst({
      where: { id: adminId, isDeleted: false },
    });

    if (!admin) {
      throw new BadRequestException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    if (admin.role === Role.SUPERADMIN) {
      throw new ForbiddenException(ERROR_MESSAGES.CANNOT_MODIFY_SUPERADMIN);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const deleted = await tx.admin.update({
        where: { id: adminId },
        data: {
          isDeleted: true,
          isActive: false,
          deletedAt: new Date(),
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          isDeleted: true,
        },
      });

      await this.createAuditLog(tx, {
        actorRole: currentUser.role!,
        actorId: currentUser.id,
        action: 'DELETE_ADMIN',
        model: 'Admin',
        recordId: adminId,
        oldData: {
          isDeleted: admin.isDeleted,
          isActive: admin.isActive,
        },
        newData: {
          isDeleted: true,
          isActive: false,
        },
      });

      return deleted;
    });

    await this.revokeAllUserTokens(adminId, AuthUserType.ADMIN);

    this.logger.log(`Admin deleted: ${admin.email} by ${currentUser.email}`);

    return {
      message: 'Admin deleted successfully',
      data: result,
    };
  }

  // =========================================
  // CUSTOMER AUTHENTICATION
  // =========================================

  /**
   * Customer Registration with IP tracking
   */
  async customerRegister(dto: CustomerRegisterDto, ipAddress?: string) {
    const existingByPhone = await this.prisma.customer.findUnique({
      where: { phone: dto.phone },
    });

    if (existingByPhone) {
      throw new ConflictException(ERROR_MESSAGES.PHONE_EXISTS);
    }

    if (dto.email) {
      const existingByEmail = await this.prisma.customer.findUnique({
        where: { email: dto.email.toLowerCase() },
      });

      if (existingByEmail) {
        throw new ConflictException(ERROR_MESSAGES.EMAIL_EXISTS);
      }
    }

    let hashedPassword: string | null = null;
    if (dto.password) {
      const saltRounds =
        this.configService.get<number>('security.bcryptRounds') ?? 12;
      hashedPassword = await bcrypt.hash(dto.password, saltRounds);
    }

    const customer = await this.prisma.customer.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email?.toLowerCase(),
        phone: dto.phone,
        password: hashedPassword,
        lastLoginIp: ipAddress,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        createdAt: true,
      },
    });

    const tokens = this.generateTokens({
      sub: customer.id,
      email: customer.email!,
      userType: AuthUserType.CUSTOMER,
    });

    await this.saveRefreshToken(
      customer.id,
      AuthUserType.CUSTOMER,
      tokens.refreshToken,
      ipAddress,
    );

    this.logger.log(`Customer registered: ${customer.phone} from ${ipAddress}`);

    return {
      message: SUCCESS_MESSAGES.REGISTER_SUCCESS,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: customer,
      },
    };
  }

  /**
   * Customer Login with IP tracking
   */
  async customerLogin(dto: CustomerLoginDto, ipAddress?: string) {
    const customer = await this.prisma.customer.findFirst({
      where: {
        OR: [
          dto.email ? { email: dto.email.toLowerCase() } : {},
          dto.phone ? { phone: dto.phone } : {},
        ],
      },
    });

    if (!customer) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    if (customer.isDeleted || !customer.isActive) {
      throw new UnauthorizedException(ERROR_MESSAGES.USER_INACTIVE);
    }

    if (!customer.password) {
      throw new UnauthorizedException(
        'No password set. Please register or use another login method',
      );
    }

    const isPasswordValid = await bcrypt.compare(
      dto.password,
      customer.password,
    );
    if (!isPasswordValid) {
      throw new UnauthorizedException(ERROR_MESSAGES.INVALID_CREDENTIALS);
    }

    const tokens = this.generateTokens({
      sub: customer.id,
      email: customer.email || customer.phone,
      userType: AuthUserType.CUSTOMER,
    });

    await this.saveRefreshToken(
      customer.id,
      AuthUserType.CUSTOMER,
      tokens.refreshToken,
      ipAddress,
    );

    await this.prisma.customer.update({
      where: { id: customer.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ipAddress,
      },
    });

    this.logger.log(
      `Customer logged in: ${customer.email || customer.phone} from ${ipAddress}`,
    );

    return {
      message: SUCCESS_MESSAGES.LOGIN_SUCCESS,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        user: {
          id: customer.id,
          email: customer.email,
          phone: customer.phone,
          firstName: customer.firstName,
          lastName: customer.lastName,
        },
      },
    };
  }

  // =========================================
  // TOKEN MANAGEMENT
  // =========================================

  /**
   * Refresh Tokens with Hash Verification & Rotation
   */
  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<JwtTokenPayload>(refreshToken, {
        secret: this.configService.get<string>('jwt.secret'),
      });

      const storedTokens = await this.prisma.authToken.findMany({
        where: {
          userType: payload.userType,
          revoked: false,
          expiresAt: { gt: new Date() },
          ...(payload.userType === AuthUserType.ADMIN
            ? { adminId: payload.sub }
            : { customerId: payload.sub }),
        },
        orderBy: { createdAt: 'desc' },
      });

      // FIX 1 & 2: Properly type validToken
      type StoredToken = (typeof storedTokens)[number];
      let validToken: StoredToken | null = null;

      for (const token of storedTokens) {
        const isValid = await bcrypt.compare(refreshToken, token.tokenHash);
        if (isValid) {
          validToken = token;
          break;
        }
      }

      if (!validToken) {
        throw new UnauthorizedException(ERROR_MESSAGES.TOKEN_INVALID);
      }

      // Revoke old token (rotation)
      await this.prisma.authToken.update({
        where: { id: validToken.id },
        data: {
          revoked: true,
          revokedAt: new Date(),
        },
      });

      // Generate new tokens
      const tokens = this.generateTokens({
        sub: payload.sub,
        email: payload.email,
        userType: payload.userType,
        role: payload.role,
        permissions: payload.permissions,
      });

      // Save new refresh token
      await this.saveRefreshToken(
        payload.sub,
        payload.userType,
        tokens.refreshToken,
      );

      return {
        message: 'Tokens refreshed successfully',
        data: tokens,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException(ERROR_MESSAGES.TOKEN_INVALID);
    }
  }

  /**
   * Logout current session
   */
  async logout(userId: string, userType: AuthUserType) {
    await this.prisma.authToken.updateMany({
      where: {
        userType,
        revoked: false,
        ...(userType === AuthUserType.ADMIN
          ? { adminId: userId }
          : { customerId: userId }),
      },
      data: { revoked: true, revokedAt: new Date() },
    });

    this.logger.log(`User logged out: ${userId}`);

    return {
      message: SUCCESS_MESSAGES.LOGOUT_SUCCESS,
    };
  }

  /**
   * Logout all sessions
   */
  async logoutAll(userId: string, userType: AuthUserType) {
    await this.prisma.authToken.updateMany({
      where: {
        userType,
        ...(userType === AuthUserType.ADMIN
          ? { adminId: userId }
          : { customerId: userId }),
      },
      data: { revoked: true, revokedAt: new Date() },
    });

    this.logger.log(`All sessions logged out: ${userId}`);

    return {
      message: 'All sessions logged out successfully',
    };
  }

  /**
   * Change Password (Admin or Customer)
   * FIX 3 & 4: Use explicit type narrowing instead of dynamic access
   */
  async changePassword(
    userId: string,
    userType: AuthUserType,
    dto: ChangePasswordDto,
  ) {
    // Fetch user based on type with proper typing
    const user =
      userType === AuthUserType.ADMIN
        ? await this.prisma.admin.findUnique({ where: { id: userId } })
        : await this.prisma.customer.findUnique({ where: { id: userId } });

    if (!user || user.isDeleted || !user.isActive) {
      throw new BadRequestException(ERROR_MESSAGES.USER_NOT_FOUND);
    }

    if (!user.password) {
      throw new BadRequestException('No password set for this account');
    }

    const isValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        'New password must be different from current password',
      );
    }

    const saltRounds =
      this.configService.get<number>('security.bcryptRounds') ?? 12;
    const hashedPassword = await bcrypt.hash(dto.newPassword, saltRounds);

    await this.prisma.$transaction(async (tx) => {
      // Update password based on user type
      if (userType === AuthUserType.ADMIN) {
        await tx.admin.update({
          where: { id: userId },
          data: { password: hashedPassword },
        });
      } else {
        await tx.customer.update({
          where: { id: userId },
          data: { password: hashedPassword },
        });
      }

      // Revoke all tokens to force re-login
      await tx.authToken.updateMany({
        where: {
          userType,
          ...(userType === AuthUserType.ADMIN
            ? { adminId: userId }
            : { customerId: userId }),
        },
        data: { revoked: true, revokedAt: new Date() },
      });
    });

    this.logger.log(
      `Password changed for ${userType}: ${user.email || user.phone}`,
    );

    return {
      message: SUCCESS_MESSAGES.PASSWORD_CHANGED,
    };
  }

  // =========================================
  // HELPER METHODS
  // =========================================

  /**
   * Generate Access & Refresh Tokens
   */
  private generateTokens(payload: JwtTokenPayload): TokenPair {
    const accessExpiresStr =
      this.configService.get<string>('jwt.accessExpires') ?? '15m';
    const refreshExpiresStr =
      this.configService.get<string>('jwt.refreshExpires') ?? '7d';

    const accessExpiresIn = this.parseTimeToSeconds(accessExpiresStr);
    const refreshExpiresIn = this.parseTimeToSeconds(refreshExpiresStr);

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: accessExpiresIn,
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: refreshExpiresIn,
    });

    return { accessToken, refreshToken };
  }

  /**
   * Parse time string to seconds
   */
  private parseTimeToSeconds(time: string): number {
    const match = time.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 900;
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value;
      case 'm':
        return value * 60;
      case 'h':
        return value * 60 * 60;
      case 'd':
        return value * 60 * 60 * 24;
      default:
        return 900;
    }
  }

  /**
   * Save Refresh Token with proper hashing
   */
  private async saveRefreshToken(
    userId: string,
    userType: AuthUserType,
    refreshToken: string,
    ipAddress?: string,
  ): Promise<void> {
    const saltRounds =
      this.configService.get<number>('security.bcryptRounds') ?? 12;
    const tokenHash = await bcrypt.hash(refreshToken, saltRounds);

    const refreshExpiresDays =
      this.parseTimeToSeconds(
        this.configService.get<string>('jwt.refreshExpires') ?? '7d',
      ) /
      (60 * 60 * 24);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + refreshExpiresDays);

    await this.prisma.authToken.create({
      data: {
        userType,
        tokenHash,
        expiresAt,
        ipAddress,
        ...(userType === AuthUserType.ADMIN
          ? { adminId: userId }
          : { customerId: userId }),
      },
    });
  }

  /**
   * Revoke all tokens for a user
   */
  private async revokeAllUserTokens(
    userId: string,
    userType: AuthUserType,
  ): Promise<void> {
    await this.prisma.authToken.updateMany({
      where: {
        userType,
        ...(userType === AuthUserType.ADMIN
          ? { adminId: userId }
          : { customerId: userId }),
      },
      data: { revoked: true, revokedAt: new Date() },
    });
  }

  /**
   * Create Audit Log Entry
   */
  private async createAuditLog(
    tx: any,
    params: {
      actorRole: Role;
      actorId: string;
      action: string;
      model: string;
      recordId?: string;
      oldData?: any;
      newData?: any;
    },
  ) {
    try {
      await tx.auditLog.create({
        data: {
          actorRole: params.actorRole,
          actorId: params.actorId,
          action: params.action,
          model: params.model,
          recordId: params.recordId,
          oldData: params.oldData,
          newData: params.newData,
        },
      });
    } catch (error) {
      this.logger.error('Failed to create audit log', error);
    }
  }
}
