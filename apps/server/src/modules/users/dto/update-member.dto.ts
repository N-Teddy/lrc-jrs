import { UserRole } from '@jrs/shared';
import { ApiPropertyOptional } from '@nestjs/swagger';
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
  @IsBoolean()
  hasAppAccess?: boolean;
}
