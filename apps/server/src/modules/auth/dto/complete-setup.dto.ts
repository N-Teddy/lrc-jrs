import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CompleteSetupDto {
  @ApiProperty({
    example: 'NewPermanentPassword2026!',
    description: 'Permanent password to replace temporary password',
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  newPassword: string;
}
