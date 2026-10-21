import { type IAuthUser, UserRole } from '@jrs/shared';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Roles } from '../../core/decorators/roles.decorator';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { RolesGuard } from '../../core/guards/roles.guard';
import { CreateRegistrationLinkDto, ReviewMemberDto } from './dto';
import { RegistrationLinksService } from './registration-links.service';

@ApiTags('Registration Links & Intake')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.AP, UserRole.PC)
@Controller('registration-links')
export class RegistrationLinksController {
  constructor(
    private readonly registrationLinksService: RegistrationLinksService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Generate a new expiring registration link' })
  @ApiResponse({
    status: 201,
    description: 'Registration link created successfully',
  })
  async createLink(
    @Body() dto: CreateRegistrationLinkDto,
    @CurrentUser() currentUser: IAuthUser,
  ) {
    return this.registrationLinksService.createLink(dto, currentUser);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all registration links for current town or leader',
  })
  @ApiResponse({ status: 200, description: 'List of registration links' })
  async getLinks(
    @Query('townId') townId?: string,
    @CurrentUser() currentUser?: IAuthUser,
  ) {
    return this.registrationLinksService.getLinks(townId, currentUser);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Deactivate an active registration link immediately',
  })
  @ApiResponse({ status: 200, description: 'Link deactivated' })
  async deactivateLink(
    @Param('id') id: string,
    @CurrentUser() currentUser: IAuthUser,
  ) {
    return this.registrationLinksService.deactivateLink(id, currentUser);
  }

  @Get('pending-reviews')
  @ApiOperation({
    summary: 'List members submitted via intake awaiting leader review',
  })
  @ApiResponse({ status: 200, description: 'List of members pending review' })
  async getPendingReviews(
    @Query('townId') townId?: string,
    @CurrentUser() currentUser?: IAuthUser,
  ) {
    return this.registrationLinksService.getPendingReviewMembers(
      townId,
      currentUser,
    );
  }

  @Patch('review/:memberId')
  @ApiOperation({ summary: 'Approve or reject a submitted member intake' })
  @ApiResponse({ status: 200, description: 'Review decision processed' })
  async reviewMember(
    @Param('memberId') memberId: string,
    @Body() dto: ReviewMemberDto,
    @CurrentUser() currentUser: IAuthUser,
  ) {
    return this.registrationLinksService.reviewMember(
      memberId,
      dto,
      currentUser,
    );
  }
}
