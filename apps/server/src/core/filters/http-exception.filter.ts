import type { ApiErrorResponse } from '@jrs/shared';
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpException');

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let errorMessage: string | string[] = exception.message;
    let errorName = exception.name;

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const resObj = exceptionResponse as Record<string, unknown>;
      if (resObj.message) {
        errorMessage = resObj.message as string | string[];
      }
      if (resObj.error) {
        errorName = String(resObj.error);
      }
    }

    const errorPayload: ApiErrorResponse = {
      success: false,
      statusCode: status,
      error: errorName,
      message: errorMessage,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `[${request.method}] ${request.url} - ${status}`,
        exception.stack,
      );
    } else {
      this.logger.warn(
        `[${request.method}] ${request.url} - ${status}: ${JSON.stringify(errorMessage)}`,
      );
    }

    response.status(status).json(errorPayload);
  }
}
