import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    example: '237693087159',
    description: 'Email or WhatsApp phone number',
  })
  @IsNotEmpty()
  @IsString()
  identifier: string;

  @ApiProperty({
    example: 'SecurePassword123!',
    description: 'Permanent or temporary password',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;
}
