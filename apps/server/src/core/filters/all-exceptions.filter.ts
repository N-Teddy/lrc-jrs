import type { ApiErrorResponse } from '@jrs/shared';
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('AllExceptions');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      exception instanceof Error
        ? exception.message
        : 'An unexpected internal server error occurred';

    this.logger.error(
      `Unhandled error at [${request.method}] ${request.url}`,
      exception instanceof Error ? exception.stack : JSON.stringify(exception),
    );

    const errorPayload: ApiErrorResponse = {
      success: false,
      statusCode: status,
      error: 'InternalServerError',
      message:
        process.env.NODE_ENV === 'production'
          ? 'Internal server error'
          : message,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(status).json(errorPayload);
  }
}
