import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Public } from '../../core/decorators/public.decorator';
import { PublicSubmitMemberDto } from './dto';
import { RegistrationLinksService } from './registration-links.service';

@ApiTags('Public Member Intake')
@Public()
@Controller('public/registration')
export class PublicRegistrationController {
  constructor(
    private readonly registrationLinksService: RegistrationLinksService,
  ) {}

  @Get(':token')
  @ApiOperation({
    summary: 'Get intake page metadata and validity by link token',
  })
  @ApiResponse({
    status: 200,
    description: 'Registration link metadata and town info',
  })
  async getLinkInfo(@Param('token') token: string) {
    return this.registrationLinksService.getPublicLinkInfo(token);
  }

  @Post(':token')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiOperation({
    summary: 'Submit member intake registration via public link',
  })
  @ApiResponse({ status: 201, description: 'Intake submitted successfully' })
  async submitMember(
    @Param('token') token: string,
    @Body() dto: PublicSubmitMemberDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.registrationLinksService.publicSubmitMember(token, dto, file);
  }
}
