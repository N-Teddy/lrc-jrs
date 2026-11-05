import { type ApiErrorResponse, ErrorCode } from '@jrs/shared';
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { SentryService } from '../sentry/sentry.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('AllExceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorName = 'InternalServerError';
    const message =
      exception instanceof Error
        ? exception.message
        : 'An unexpected internal server error occurred';

    if (exception && typeof exception === 'object' && 'name' in exception) {
      if ((exception as Error).name === 'ValidationError') {
        status = HttpStatus.BAD_REQUEST;
        errorName = 'ValidationError';
      }
    }

    if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `Unhandled error at [${request.method}] ${request.url}`,
        exception instanceof Error
          ? exception.stack
          : JSON.stringify(exception),
      );

      // Report unhandled backend crash to Sentry
      const user = (
        request as unknown as {
          user?: {
            userId?: string;
            role?: string;
            townCode?: string;
            email?: string;
          };
        }
      ).user;
      SentryService.captureException(exception, {
        method: request.method,
        url: request.url,
        ip: request.ip,
        body: request.body,
        params: request.params,
        query: request.query as Record<string, unknown>,
        user: user
          ? {
              userId: user.userId,
              role: user.role,
              townCode: user.townCode,
              email: user.email,
            }
          : undefined,
      });
    } else {
      this.logger.warn(
        `Mongoose validation error at [${request.method}] ${request.url}`,
        exception instanceof Error
          ? exception.message
          : JSON.stringify(exception),
      );
    }

    const errorPayload: ApiErrorResponse = {
      success: false,
      statusCode: status,
      errorCode: ErrorCode.INTERNAL_SERVER_ERROR,
      error: errorName,
      message:
        status === HttpStatus.INTERNAL_SERVER_ERROR &&
        process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : message,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(errorPayload);
  }
}
