import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';
import { CreateMemberDto } from './create-member.dto';

export class UpdateMemberDto extends PartialType(CreateMemberDto) {
  @ApiPropertyOptional({
    description: 'Whether user is an active PC for their town',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return value;
  })
  @IsBoolean()
  isActivePC?: boolean;
}
