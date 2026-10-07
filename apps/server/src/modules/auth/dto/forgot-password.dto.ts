import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class ForgotPasswordDto {
  @ApiProperty({
    example: '237693087159',
    description: 'Email or phone number associated with the account',
  })
  @IsNotEmpty()
  @IsString()
  identifier: string;

  @ApiPropertyOptional({
    example: 'auto',
    enum: ['whatsapp', 'email', 'auto'],
    default: 'auto',
    description: 'Preferred delivery channel for the OTP code',
  })
  @IsOptional()
  @IsIn(['whatsapp', 'email', 'auto'])
  channel?: 'whatsapp' | 'email' | 'auto';
}
