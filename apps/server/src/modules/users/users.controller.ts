import type { IAuthUser } from '@jrs/shared';
import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
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
import { TownScope } from '../../core/decorators/town-scope.decorator';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { TownScopeGuard } from '../../core/guards/town-scope.guard';
import {
  CreateMemberDto,
  MemberQueryDto,
  UpdateAccessDto,
  UpdateMemberDto,
} from './dto';
import { UsersService } from './users.service';

@ApiTags('Members & Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TownScopeGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @TownScope('townId')
  @ApiOperation({ summary: 'List fellowship members with pagination & search' })
  @ApiResponse({ status: 200, description: 'Paginated list of members' })
  async findAll(
    @Query() query: MemberQueryDto,
    @Headers('x-town-id') xTownId?: string,
    @CurrentUser() currentUser?: IAuthUser,
  ) {
    return this.usersService.findAll(query, xTownId, currentUser);
  }

  @Get('stats')
  @TownScope('townId')
  @ApiOperation({ summary: 'Get aggregate fellowship metrics for town hub' })
  @ApiResponse({ status: 200, description: 'Member statistics for the hub' })
  async getStats(
    @Query('townId') townId?: string,
    @Headers('x-town-id') xTownId?: string,
    @CurrentUser() currentUser?: IAuthUser,
  ) {
    return this.usersService.getStats(townId || xTownId, currentUser);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get full member profile details' })
  @ApiResponse({ status: 200, description: 'Member profile' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findMemberDetail(id);
  }

  @Post()
  @TownScope('homeTownId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new fellowship member' })
  @ApiResponse({ status: 201, description: 'Member registered successfully' })
  @ApiResponse({ status: 400, description: 'Age rule or quota violation' })
  @ApiResponse({ status: 409, description: 'Phone or email already exists' })
  async create(
    @Body() dto: CreateMemberDto,
    @CurrentUser() currentUser: IAuthUser,
    @Headers('x-town-id') xTownId?: string,
  ) {
    return this.usersService.createMember(dto, currentUser, xTownId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update member profile information' })
  @ApiResponse({ status: 200, description: 'Member updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation or quota error' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateMemberDto,
    @CurrentUser() currentUser: IAuthUser,
  ) {
    return this.usersService.updateMember(id, dto, currentUser);
  }

  @Patch(':id/access')
  @ApiOperation({ summary: 'Update app login access or resend credentials' })
  @ApiResponse({ status: 200, description: 'Access updated successfully' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async updateAccess(
    @Param('id') id: string,
    @Body() dto: UpdateAccessDto,
    @CurrentUser() currentUser: IAuthUser,
  ) {
    return this.usersService.updateAccess(id, dto, currentUser);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove a member (AP only)' })
  @ApiResponse({ status: 204, description: 'Member removed' })
  @ApiResponse({ status: 403, description: 'Forbidden (non-AP)' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async remove(@Param('id') id: string, @CurrentUser() currentUser: IAuthUser) {
    await this.usersService.deleteMember(id, currentUser);
  }
}
