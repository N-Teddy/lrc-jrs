import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({
    example: '7b8e19d4f0a2c349e5d8a9b2...',
    description: 'Current 30-day refresh token to rotate',
  })
  @IsNotEmpty()
  @IsString()
  refreshToken: string;
}
