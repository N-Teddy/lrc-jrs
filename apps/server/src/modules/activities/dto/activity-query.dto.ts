import { ActivityStatus, ActivityType } from '@jrs/shared';
import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { TownFilterDto } from '../../../common/dto/town-filter.dto';

export class ActivityQueryDto extends IntersectionType(
  PaginationQueryDto,
  TownFilterDto,
) {
  @ApiPropertyOptional({
    description: 'Filter by host town ID organizing the activity',
  })
  @IsOptional()
  @IsString()
  hostTownId?: string;

  @ApiPropertyOptional({
    description: 'Filter by scheduled year',
    minimum: 2000,
    example: 2026,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  year?: number;

  @ApiPropertyOptional({
    description: 'Filter by month of year (1-12)',
    minimum: 1,
    maximum: 12,
    example: 3,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month?: number;

  @ApiPropertyOptional({
    enum: ActivityType,
    description: 'Filter by canonical activity type',
  })
  @IsOptional()
  @IsEnum(ActivityType)
  activityType?: ActivityType;

  @ApiPropertyOptional({
    enum: ActivityStatus,
    description: 'Filter by activity status',
  })
  @IsOptional()
  @IsEnum(ActivityStatus)
  status?: ActivityStatus;
}
