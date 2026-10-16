import { AttendanceStatus, AttendeeType } from '@jrs/shared';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

class GuestInfoDto {
  @ApiProperty({ example: 'Jean-Pierre Foko' })
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @ApiPropertyOptional({ example: '+237699112233' })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiPropertyOptional({ example: 'First-time visitor invited by Paul' })
  @IsOptional()
  @IsString()
  notes?: string;
}

class RecordAttendanceItemDto {
  @ApiProperty({ enum: AttendeeType, example: AttendeeType.MEMBER })
  @IsNotEmpty()
  @IsEnum(AttendeeType)
  attendeeType: AttendeeType;

  @ApiPropertyOptional({
    example: '60c72b2f9b1d8b001f8e4a1a',
    description: 'Member user ID (required if attendeeType is MEMBER)',
  })
  @IsOptional()
  @IsString()
  memberId?: string;

  @ApiPropertyOptional({ type: GuestInfoDto })
  @IsOptional()
  @ValidateNested()
  @Type(() => GuestInfoDto)
  guestInfo?: GuestInfoDto;

  @ApiProperty({ enum: AttendanceStatus, default: AttendanceStatus.PRESENT })
  @IsNotEmpty()
  @IsEnum(AttendanceStatus)
  status: AttendanceStatus;

  @ApiPropertyOptional({
    example: '2026-03-15T15:12:00.000Z',
    description: 'Exact check-in timestamp',
  })
  @IsOptional()
  @IsString()
  checkInTime?: string;
}

export class RecordAttendanceDto {
  @ApiProperty({ type: [RecordAttendanceItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RecordAttendanceItemDto)
  attendees: RecordAttendanceItemDto[];
}
