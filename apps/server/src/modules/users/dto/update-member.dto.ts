import { UserRole } from '@jrs/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';

export class UpdateMemberDto {
  @ApiPropertyOptional({
    example: 'Samuel Eto',
    description: 'Updated full name',
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({
    example: '+237674440001',
    description: 'Updated phone number',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({
    example: 'samuel.eto@lrcjrs.org',
    description: 'Updated email address',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: '2002-04-15',
    description: 'Updated date of birth',
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({
    enum: UserRole,
    description: 'Updated fellowship role',
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    description: 'Whether user is an active PC for their town',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  isActivePC?: boolean;

  @ApiPropertyOptional({
    description: 'Updated home town ID',
  })
  @IsOptional()
  @IsString()
  homeTownId?: string;

  @ApiPropertyOptional({
    description: 'Whether user has app login access',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  hasAppAccess?: boolean;

  @ApiPropertyOptional({
    example: 'https://example.com/avatar.svg',
    description: 'Direct avatar image URL if already uploaded',
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({
    example: 'MALE',
    enum: ['MALE', 'FEMALE'],
    description: 'Gender of the member',
  })
  @IsOptional()
  @IsEnum(['MALE', 'FEMALE'])
  gender?: 'MALE' | 'FEMALE';

  @ApiPropertyOptional({
    example: '09-2026',
    description: 'Integration date in MM-YYYY or YYYY-MM format',
  })
  @IsOptional()
  @IsString()
  integrationDate?: string;
}
