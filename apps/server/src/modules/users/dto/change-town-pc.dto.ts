import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsMongoId, IsOptional, IsString } from 'class-validator';

export class ChangeTownPcDto {
  @ApiProperty({
    description: 'The town ID where PC leadership is being transitioned',
  })
  @IsMongoId()
  townId: string;

  @ApiProperty({
    description: 'User ID of the member being promoted to PC for this town',
  })
  @IsMongoId()
  newPcUserId: string;

  @ApiPropertyOptional({
    description: 'User ID of the outgoing PC being replaced (if any)',
  })
  @IsOptional()
  @IsMongoId()
  outgoingPcUserId?: string;

  @ApiPropertyOptional({
    description:
      'Action for the outgoing PC: demote_to_member (keep app access as regular member) or revoke_access (revoke access completely)',
    enum: ['demote_to_member', 'revoke_access'],
    default: 'demote_to_member',
  })
  @IsOptional()
  @IsEnum(['demote_to_member', 'revoke_access'])
  outgoingPcDisposition?: 'demote_to_member' | 'revoke_access';
}
