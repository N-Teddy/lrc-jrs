import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class TransferTownDto {
  @ApiProperty({
    example: '60d0fe4f5311236168a109ca',
    description: 'Target destination town hub ID',
  })
  @IsNotEmpty()
  @IsString()
  toTownId: string;

  @ApiPropertyOptional({
    example: 'Relocated for university studies at University of Yaounde I',
    description: 'Pastoral reason or administrative note for town transfer',
  })
  @IsOptional()
  @IsString()
  reason?: string;
}
