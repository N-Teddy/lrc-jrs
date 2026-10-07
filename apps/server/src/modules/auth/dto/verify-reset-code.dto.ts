import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyResetCodeDto {
  @ApiProperty({
    example: '237693087159',
    description: 'Email or phone number associated with the account',
  })
  @IsNotEmpty()
  @IsString()
  identifier: string;

  @ApiProperty({
    example: '849201',
    description: '6-digit numeric OTP code',
  })
  @IsNotEmpty()
  @IsString()
  @Length(6, 6)
  code: string;
}
