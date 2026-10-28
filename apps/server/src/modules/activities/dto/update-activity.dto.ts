import { ActivityStatus, ActivityType } from '@jrs/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateActivityDto {
  @ApiPropertyOptional({ example: 'Updated Activity Title' })
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

  @ApiPropertyOptional({ example: 'Conference Hall, Ground Floor' })
  @IsOptional()
  @IsString()
  locationVenue?: string;

  @ApiPropertyOptional({ example: 'Rescheduled due to logistics adjustment.' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ enum: ActivityStatus })
  @IsOptional()
  @IsEnum(ActivityStatus)
  status?: ActivityStatus;

  @ApiPropertyOptional({
    example: 'Logistics constraints forced venue relocation.',
    description: 'Documented reason for change log history',
  })
  @IsOptional()
  @IsString()
  changeReason?: string;

  @ApiPropertyOptional({
    example: ['60c72b2f9b1d8b001f8e4a1b'],
    description: 'IDs of other participating towns included in this activity',
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  includedTownIds?: string[];
}
