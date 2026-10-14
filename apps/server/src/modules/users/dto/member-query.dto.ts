import { UserRole } from '@jrs/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class MemberQueryDto {
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
    description: 'Search string matching name, phone, or email',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by home town ID or code',
  })
  @IsOptional()
  @IsString()
  townId?: string;

  @ApiPropertyOptional({
    enum: UserRole,
    description: 'Filter by fellowship role',
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    description:
      'Filter by account status (e.g. ACTIVE, PENDING_ACTIVATION, MUST_CHANGE_PASSWORD, REVOKED)',
  })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({
    description: 'Filter only JR age-eligible youth (18-30)',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isJr?: boolean;

  @ApiPropertyOptional({
    description: 'Filter only members with or without platform app access',
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  hasAppAccess?: boolean;
}
