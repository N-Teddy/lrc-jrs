import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateAccessDto {
  @ApiPropertyOptional({
    description: 'Enable or disable platform login access',
  })
  @IsOptional()
  @IsBoolean()
  hasAppAccess?: boolean;

  @ApiPropertyOptional({
    description: 'Revoke access (triggers security 403 suspension)',
  })
  @IsOptional()
  @IsBoolean()
  isAccessRevoked?: boolean;

  @ApiPropertyOptional({
    description:
      'Generate fresh temporary credentials and dispatch invite via WhatsApp/Email',
  })
  @IsOptional()
  @IsBoolean()
  resendInvite?: boolean;

  @ApiPropertyOptional({
    description: 'Preferred channel for sending temporary credentials',
    enum: ['email', 'whatsapp'],
  })
  @IsOptional()
  channel?: 'email' | 'whatsapp';

  @ApiPropertyOptional({
    description: 'Permitted external town IDs for cross-hub read access',
    type: [String],
  })
  @IsOptional()
  allowedReadTownIds?: string[];
}
