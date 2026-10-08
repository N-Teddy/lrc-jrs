import { ActivityStatus, ActivityType } from '@jrs/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';

export class UpdateActivityDto {
  @ApiPropertyOptional({ example: 'Updated Fellowship Title' })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ enum: ActivityType })
  @IsOptional()
  @IsEnum(ActivityType)
  activityType?: ActivityType;

  @ApiPropertyOptional({ example: '2026-03-20T16:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2026-03-20T19:00:00.000Z' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: '60c72b2f9b1d8b001f8e4a1a' })
  @IsOptional()
  @IsString()
  townId?: string;

  @ApiPropertyOptional({ example: 'Cathedral Hall, Ground Floor' })
  @IsOptional()
  @IsString()
  locationVenue?: string;

  @ApiPropertyOptional({ example: 'Rescheduled due to diocesan retreat.' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ enum: ActivityStatus })
  @IsOptional()
  @IsEnum(ActivityStatus)
  status?: ActivityStatus;

  @ApiPropertyOptional({
    example: 'Heavy rain forced venue change to inner parish hall.',
    description: 'Documented reason for change log history',
  })
  @IsOptional()
  @IsString()
  changeReason?: string;
}
