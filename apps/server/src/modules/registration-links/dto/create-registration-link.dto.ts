import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateRegistrationLinkDto {
  @ApiProperty({
    example: 'LRC JRS Douala - October Intake',
    description: 'Title or purpose of the registration link',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiPropertyOptional({
    example: '6ac68720ccf60d46db9f8bfe',
    description: 'Target town ID for registering members (defaults to PC town)',
  })
  @IsOptional()
  @IsString()
  homeTownId?: string;

  @ApiPropertyOptional({
    example: 72,
    description:
      'Duration in hours until link expires (e.g. 24, 72, 168). Overridden by expiresAt if provided.',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(2160) // up to 90 days
  expiresInHours?: number;

  @ApiPropertyOptional({
    example: '2026-11-01T23:59:59.000Z',
    description: 'Specific ISO expiration timestamp',
  })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;

  @ApiPropertyOptional({
    example: 100,
    description: 'Optional maximum number of accepted registrations',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  maxUses?: number;

  @ApiPropertyOptional({
    example:
      'Welcome to LRC JRS! Please complete your registration details below.',
    description: 'Custom welcome message shown on the public intake form',
  })
  @IsOptional()
  @IsString()
  customMessage?: string;
}
