import { UserRole } from '@jrs/shared';
import { ApiPropertyOptional, IntersectionType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { TownFilterDto } from '../../../common/dto/town-filter.dto';

export class MemberQueryDto extends IntersectionType(
  PaginationQueryDto,
  TownFilterDto,
) {
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
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  isJr?: boolean;

  @ApiPropertyOptional({
    description: 'Filter only members with or without platform app access',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  @IsBoolean()
  hasAppAccess?: boolean;
}
