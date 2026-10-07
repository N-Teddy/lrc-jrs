import {
  type CallHandler,
  type ExecutionContext,
  Injectable,
  Logger,
  type NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import type { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest<Request>();
    const method = req.method;
    const url = req.originalUrl || req.url;
    const ip = req.ip || req.socket.remoteAddress;
    const startTime = Date.now();

    return next.handle().pipe(
      tap(() => {
        const res = ctx.getResponse<Response>();
        const statusCode = res.statusCode;
        const duration = Date.now() - startTime;
        this.logger.log(
          `[${method}] ${url} ${statusCode} - ${duration}ms (IP: ${ip})`,
        );
      }),
    );
  }
}
