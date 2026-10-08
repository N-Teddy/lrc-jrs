import { ActivityStatus, ActivityType } from '@jrs/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class ActivityQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Filter by activity location town ID',
  })
  @IsOptional()
  @IsString()
  townId?: string;

  @ApiPropertyOptional({
    description: 'Filter by host town ID organizing the activity',
  })
  @IsOptional()
  @IsString()
  hostTownId?: string;

  @ApiPropertyOptional({
    description: 'Filter by scheduled year (starting from 2026)',
    minimum: 2026,
    example: 2026,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(2026)
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

  @ApiPropertyOptional({
    description: 'Search string matching title, notes, or venue',
  })
  @IsOptional()
  @IsString()
  search?: string;
}
