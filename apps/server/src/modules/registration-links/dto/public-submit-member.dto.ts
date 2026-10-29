import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class PublicSubmitMemberDto {
  @ApiProperty({
    example: 'Eboa Lotin',
    description: 'Full name of the new member',
  })
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @ApiProperty({
    example: '+237671234567',
    description: 'Cameroon phone number of the member',
  })
  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  @ApiPropertyOptional({
    example: 'eboa.lotin@gmail.com',
    description: 'Optional email address of the member',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    example: '2004-06-20',
    description: 'Date of birth in YYYY-MM-DD format',
  })
  @IsNotEmpty()
  @IsDateString()
  dateOfBirth: string;

  @ApiPropertyOptional({
    example: 'MALE',
    enum: ['MALE', 'FEMALE'],
    description: 'Gender of the member',
  })
  @IsOptional()
  @IsEnum(['MALE', 'FEMALE'])
  gender?: 'MALE' | 'FEMALE';

  @ApiPropertyOptional({
    example: '10-2026',
    description: 'Integration date in MM-YYYY format',
  })
  @IsOptional()
  @IsString()
  integrationDate?: string;

  @ApiPropertyOptional({
    example: 'I joined through the youth community program.',
    description: 'Optional note or testimony from the registrant',
  })
  @IsOptional()
  @IsString()
  intakeNote?: string;

  @ApiPropertyOptional({
    description:
      'Direct avatar image URL or Data URI if custom avatar was picked',
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiPropertyOptional({
    example: '6ac68720ccf60d46db9f8bfe',
    description: 'Optional selected community town ID',
  })
  @IsOptional()
  @IsString()
  homeTownId?: string;
}
