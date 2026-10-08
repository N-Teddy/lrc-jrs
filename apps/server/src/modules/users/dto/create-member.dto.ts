import { UserRole } from '@jrs/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateMemberDto {
  @ApiProperty({
    example: 'Samuel Eto',
    description: 'Full name of the member',
  })
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @ApiProperty({
    example: '+237674440001',
    description: 'Phone number of the member',
  })
  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @ApiPropertyOptional({
    example: 'samuel.eto@lrcjrs.org',
    description: 'Email address of the member',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    example: '2002-04-15',
    description: 'Date of birth in YYYY-MM-DD format',
  })
  @IsNotEmpty()
  @IsDateString()
  dateOfBirth: string;

  @ApiPropertyOptional({
    enum: UserRole,
    default: UserRole.MEMBER,
    description: 'Assigned fellowship role',
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiPropertyOptional({
    example: 'dla',
    description: 'Target home town ID or code',
  })
  @IsOptional()
  @IsString()
  homeTownId?: string;

  @ApiPropertyOptional({
    default: true,
    description: 'Whether to create platform login credentials',
  })
  @IsOptional()
  @IsBoolean()
  hasAppAccess?: boolean;
}
