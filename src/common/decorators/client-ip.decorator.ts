/**
 * CLIENT IP DECORATOR
 *
 * Extracts the client's IP address from the request.
 * Handles proxies and load balancers by checking headers.
 *
 * EXAMPLE:
 *   @Post('login')
 *   login(@Body() dto: LoginDto, @ClientIp() ipAddress: string) {
 *     return this.authService.login(dto, ipAddress);
 *   }
 */

import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';

export const ClientIp = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request>();

    // Check various headers for the real IP (for proxies/load balancers)
    const ip =
      (request.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
      (request.headers['x-real-ip'] as string) ||
      request.ip ||
      request.socket.remoteAddress ||
      'unknown';

    return ip;
  },
);
