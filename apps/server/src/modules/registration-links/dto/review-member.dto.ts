import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
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
}
