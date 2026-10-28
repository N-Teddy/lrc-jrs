import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus(): {
    status: string;
    service: string;
    version: string;
    minClientVersion: string;
    serverTime: string;
  } {
    return {
      status: 'online',
      service: 'LRC Youth Community Platform API',
      version: '1.0.0',
      minClientVersion: '1.0.0',
      serverTime: new Date().toISOString(),
    };
  }
}
