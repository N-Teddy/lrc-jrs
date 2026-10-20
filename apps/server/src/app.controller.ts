import { Controller, Get, Head } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';
import { Public } from './core/decorators/public.decorator';

@ApiTags('Health')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  @Head()
  @ApiOperation({ summary: 'Health check and API status' })
  getHello(): {
    status: string;
    service: string;
    version: string;
    minClientVersion: string;
    serverTime: string;
  } {
    return this.appService.getStatus();
  }

  @Public()
  @Get('api')
  @Head('api')
  @ApiOperation({ summary: 'Health check and API status for /api prefix' })
  getApiHello() {
    return this.appService.getStatus();
  }
}
