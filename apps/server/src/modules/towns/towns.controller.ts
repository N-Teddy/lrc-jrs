import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../../core/decorators/public.decorator';
import { TownsService } from './towns.service';

@ApiTags('Towns')
@Controller('towns')
export class TownsController {
  constructor(private readonly townsService: TownsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get all active community towns' })
  @ApiResponse({ status: 200, description: 'List of all towns' })
  async findAll() {
    return this.townsService.findAll();
  }
}
