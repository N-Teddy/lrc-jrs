import { Controller, Get, Head } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  HealthCheck,
  HealthCheckService,
  MongooseHealthIndicator,
} from '@nestjs/terminus';
import { Public } from '../../core/decorators/public.decorator';

@ApiTags('Health')
@Controller()
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly mongoose: MongooseHealthIndicator,
  ) {}

  @Public()
  @Get(['health', 'api/health'])
  @Head(['health', 'api/health'])
  @HealthCheck()
  @ApiOperation({
    summary: 'Health check and API / Database connectivity status via Terminus',
  })
  check() {
    return this.health.check([() => this.mongoose.pingCheck('database')]);
  }
}
