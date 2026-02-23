/**
 * JWT STRATEGY
 *
 * Verifies JWT tokens and attaches user to request
 */

import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUserType, Permission } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../../common/interfaces';
import { ERROR_MESSAGES } from '../../common/constants';

// Define payload interface locally
interface JwtTokenPayload {
  sub: string;
  email: string;
  userType: AuthUserType;
  role?: string;
  permissions?: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private prisma: PrismaService,
  ) {
    const secret = configService.get<string>('jwt.secret');
    if (!secret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtTokenPayload): Promise<AuthenticatedUser> {
    const { sub: userId, userType } = payload;

    if (userType === AuthUserType.ADMIN) {
      const admin = await this.prisma.admin.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          role: true,
          permissions: true,
          isActive: true,
          isDeleted: true,
        },
      });

      if (!admin || admin.isDeleted || !admin.isActive) {
        throw new UnauthorizedException(ERROR_MESSAGES.USER_INACTIVE);
      }

      return {
        id: admin.id,
        email: admin.email,
        userType: AuthUserType.ADMIN,
        role: admin.role,
        permissions: admin.permissions,
      };
    }

    if (userType === AuthUserType.CUSTOMER) {
      const customer = await this.prisma.customer.findUnique({
        where: { id: userId },
        select: {
          id: true,
          email: true,
          phone: true,
          isActive: true,
          isDeleted: true,
        },
      });

      if (!customer || customer.isDeleted || !customer.isActive) {
        throw new UnauthorizedException(ERROR_MESSAGES.USER_INACTIVE);
      }

      return {
        id: customer.id,
        email: customer.email || customer.phone,
        userType: AuthUserType.CUSTOMER,
      };
    }

    throw new UnauthorizedException(ERROR_MESSAGES.UNAUTHORIZED);
  }
}
