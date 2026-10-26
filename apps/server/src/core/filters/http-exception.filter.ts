import { type ApiErrorResponse, ErrorCode } from '@jrs/shared';
import {
  type ArgumentsHost,
  Catch,
  type ExceptionFilter,
  HttpStatus,
  Logger,
  HttpException as NestHttpException,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Catch(NestHttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpException');

  catch(exception: NestHttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let errorMessage: string | string[] = exception.message;
    let errorName = exception.name;
    let errorCode: string | undefined;
    let details: Record<string, unknown> | undefined;

    if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const resObj = exceptionResponse as Record<string, unknown>;
      if (resObj.message) {
        errorMessage = resObj.message as string | string[];
      }
      if (resObj.error) {
        errorName = String(resObj.error);
      }
      if (resObj.errorCode) {
        errorCode = String(resObj.errorCode);
      }
      if (resObj.params || resObj.details) {
        details = {
          ...(resObj.params as Record<string, unknown>),
          ...(resObj.details as Record<string, unknown>),
        };
      }
    }

    if (!errorCode) {
      switch (status) {
        case HttpStatus.NOT_FOUND:
          errorCode = ErrorCode.NOT_FOUND;
          break;
        case HttpStatus.UNAUTHORIZED:
          errorCode = ErrorCode.UNAUTHORIZED;
          break;
        case HttpStatus.FORBIDDEN:
          errorCode = ErrorCode.FORBIDDEN;
          break;
        case HttpStatus.BAD_REQUEST:
          errorCode = ErrorCode.BAD_REQUEST;
          break;
        default:
          errorCode = ErrorCode.INTERNAL_SERVER_ERROR;
      }
    }

    const errorPayload: ApiErrorResponse = {
      success: false,
      statusCode: status,
      errorCode,
      error: errorName,
      message: errorMessage,
      details,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `[${request.method}] ${request.url} - ${status} (${errorCode})`,
        exception.stack,
      );
    } else {
      this.logger.warn(
        `[${request.method}] ${request.url} - ${status} (${errorCode}): ${JSON.stringify(errorMessage)}`,
      );
    }

    response.status(status).json(errorPayload);
  }
}
