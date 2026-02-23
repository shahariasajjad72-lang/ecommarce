/**
 * GLOBAL EXCEPTION FILTER
 *
 * Catches all exceptions and returns a consistent error response.
 * This ensures your API always returns the same error format.
 *
 * RESPONSE FORMAT:
 * {
 *   success: false,
 *   message: "Error message",
 *   error: "ERROR_CODE",
 *   statusCode: 400,
 *   timestamp: "2024-01-20T10:30:00.000Z",
 *   path: "/api/v1/auth/login"
 * }
 */

import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Determine status code
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Get error message
    let message = 'Internal server error';
    let error = 'INTERNAL_ERROR';

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object') {
        const res = exceptionResponse as any;
        message = res.message || exception.message;
        error = res.error || 'ERROR';
      }
    }

    // Log error (for debugging)
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${message}`,
      exception instanceof Error ? exception.stack : '',
    );

    // Send response
    response.status(status).json({
      success: false,
      message: Array.isArray(message) ? message[0] : message,
      error,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
