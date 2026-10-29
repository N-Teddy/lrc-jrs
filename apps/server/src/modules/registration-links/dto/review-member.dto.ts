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

export enum IntakeReviewAction {
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
}

export class ReviewMemberDto {
  @ApiProperty({
    enum: IntakeReviewAction,
    example: IntakeReviewAction.APPROVE,
    description: 'Review decision: APPROVE or REJECT',
  })
  @IsNotEmpty()
  @IsEnum(IntakeReviewAction)
  action: IntakeReviewAction;

  @ApiPropertyOptional({
    example: false,
    description:
      'Whether to grant app login access upon approval (default false)',
  })
  @IsOptional()
  @IsBoolean()
  grantAppAccess?: boolean;

  @ApiPropertyOptional({
    example: 'Verified with local community group and welcomed.',
    description: 'Review notes or reason for decision',
  })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({
    example: 'Jean Paul',
    description: 'Updated candidate full name',
  })
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({
    example: '+237671234567',
    description: 'Updated candidate phone number',
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({
    example: 'jean.paul@gmail.com',
    description: 'Updated candidate email address',
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiPropertyOptional({
    example: '6ac68720ccf60d46db9f8bfe',
    description: 'Updated assigned home town ID',
  })
  @IsOptional()
  @IsString()
  homeTownId?: string;

  @ApiPropertyOptional({
    example: '2004-05-15',
    description: 'Updated date of birth',
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({
    example: 'MALE',
    enum: ['MALE', 'FEMALE'],
    description: 'Updated candidate gender',
  })
  @IsOptional()
  @IsEnum(['MALE', 'FEMALE'])
  gender?: 'MALE' | 'FEMALE';
}
