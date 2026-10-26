import type { ErrorCode } from '@jrs/shared';
import { HttpStatus, HttpException as NestHttpException } from '@nestjs/common';

export interface AppExceptionOptions {
  status?: HttpStatus;
  params?: Record<string, string | number | boolean>;
  details?: Record<string, unknown>;
  cause?: Error;
}

export class AppException extends NestHttpException {
  public readonly errorCode: ErrorCode;
  public readonly params?: Record<string, string | number | boolean>;
  public readonly details?: Record<string, unknown>;

  constructor(
    errorCode: ErrorCode,
    options?: AppExceptionOptions | HttpStatus,
  ) {
    const opts: AppExceptionOptions =
      typeof options === 'number' ? { status: options } : options || {};
    const status = opts.status ?? HttpStatus.BAD_REQUEST;

    super(
      {
        errorCode,
        params: opts.params,
        details: opts.details,
      },
      status,
      { cause: opts.cause },
    );

    this.errorCode = errorCode;
    this.params = opts.params;
    this.details = opts.details;
  }
}

export class NotFoundAppException extends AppException {
  constructor(
    errorCode: ErrorCode,
    params?: Record<string, string | number | boolean>,
    details?: Record<string, unknown>,
  ) {
    super(errorCode, { status: HttpStatus.NOT_FOUND, params, details });
  }
}

export class BadRequestAppException extends AppException {
  constructor(
    errorCode: ErrorCode,
    params?: Record<string, string | number | boolean>,
    details?: Record<string, unknown>,
  ) {
    super(errorCode, { status: HttpStatus.BAD_REQUEST, params, details });
  }
}

export class ForbiddenAppException extends AppException {
  constructor(
    errorCode: ErrorCode,
    params?: Record<string, string | number | boolean>,
    details?: Record<string, unknown>,
  ) {
    super(errorCode, { status: HttpStatus.FORBIDDEN, params, details });
  }
}

export class UnauthorizedAppException extends AppException {
  constructor(
    errorCode: ErrorCode,
    params?: Record<string, string | number | boolean>,
    details?: Record<string, unknown>,
  ) {
    super(errorCode, { status: HttpStatus.UNAUTHORIZED, params, details });
  }
}

export class ConflictAppException extends AppException {
  constructor(
    errorCode: ErrorCode,
    params?: Record<string, string | number | boolean>,
    details?: Record<string, unknown>,
  ) {
    super(errorCode, { status: HttpStatus.CONFLICT, params, details });
  }
}

export class GoneAppException extends AppException {
  constructor(
    errorCode: ErrorCode,
    params?: Record<string, string | number | boolean>,
    details?: Record<string, unknown>,
  ) {
    super(errorCode, { status: HttpStatus.GONE, params, details });
  }
}
