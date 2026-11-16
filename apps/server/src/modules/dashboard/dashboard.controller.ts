import type { IAuthUser, IDashboardOverviewDto } from '@jrs/shared';
import { Controller, Get, Headers, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({
    summary: 'Get unified executive dashboard metrics & analytics',
  })
  @ApiQuery({
    name: 'townId',
    required: false,
    description: 'Town hub code or ID',
  })
  @ApiQuery({
    name: 'period',
    required: false,
    enum: ['month', 'quarter', 'year'],
    description: 'Time horizon',
  })
  @ApiQuery({ name: 'year', required: false, type: Number })
  @ApiQuery({ name: 'month', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Dashboard overview statistics' })
  async getOverview(
    @CurrentUser() currentUser: IAuthUser,
    @Headers('x-town-id') xTownId?: string,
    @Query('townId') townId?: string,
    @Query('period') period?: 'month' | 'quarter' | 'year',
    @Query('year') year?: string,
    @Query('month') month?: string,
  ): Promise<IDashboardOverviewDto> {
    const effectiveTown = townId || xTownId || currentUser.homeTownId;
    const parsedYear = year ? Number.parseInt(year, 10) : undefined;
    const parsedMonth = month ? Number.parseInt(month, 10) : undefined;

    return this.dashboardService.getOverview(
      {
        townId: effectiveTown,
        period: period || 'month',
        year: parsedYear,
        month: parsedMonth,
      },
      currentUser.role,
      currentUser.homeTownId,
    );
  }
}
