import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @ApiProperty({
    example: 'a3f18e9c4b2d10786e245a98bf310d7a54c8e31289fe5a721d604b9c81e3a987',
    description: 'Verified one-time reset token issued by verify-reset-code',
  })
  @IsNotEmpty()
  @IsString()
  resetToken: string;

  @ApiProperty({
    example: 'MyNewSecurePassword2026!',
    description: 'New permanent password',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  newPassword: string;
}
