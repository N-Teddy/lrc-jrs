import { ActivityType } from '@jrs/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateActivityDto {
  @ApiProperty({
    example: 'Youth Monthly Gathering',
    description: 'Title of the activity',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    enum: ActivityType,
    example: ActivityType.MONTHLY_MEETING,
    description: 'Canonical activity type',
  })
  @IsNotEmpty()
  @IsEnum(ActivityType)
  activityType: ActivityType;

  @ApiProperty({
    example: '2026-03-15T15:00:00.000Z',
    description: 'Scheduled start date and time (ISO format, >= 2026)',
  })
  @IsNotEmpty()
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({
    example: '2026-03-15T18:00:00.000Z',
    description:
      'Scheduled end date and time (required for multi-day conferences)',
  })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiProperty({
    example: '60c72b2f9b1d8b001f8e4a1a',
    description: 'Town ID where the activity takes place',
  })
  @IsNotEmpty()
  @IsString()
  townId: string;

  @ApiProperty({
    example: 'Chapelle Mvolyé, Salle Polyvalente',
    description: 'Specific venue description or room',
  })
  @IsNotEmpty()
  @IsString()
  locationVenue: string;

  @ApiPropertyOptional({
    example: 'Monthly planning and review agenda.',
    description: 'Administrative notes, details, and agenda',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    example: '60c72b2f9b1d8b001f8e4a1a',
    description: 'Host town organizing the activity (defaults to active town)',
  })
  @IsOptional()
  @IsString()
  hostTownId?: string;

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
