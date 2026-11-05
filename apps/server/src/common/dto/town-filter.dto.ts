import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class TownFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by home town ID or code',
  })
  @IsOptional()
  @IsString()
  townId?: string;

  @ApiPropertyOptional({
    description: 'Filter by multiple town IDs (comma-separated)',
  })
  @IsOptional()
  @IsString()
  townIds?: string;
}
