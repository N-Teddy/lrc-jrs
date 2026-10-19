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
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileFieldsInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { TownScope } from '../../core/decorators/town-scope.decorator';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { TownScopeGuard } from '../../core/guards/town-scope.guard';
import {
  ChangeTownPcDto,
  CreateMemberDto,
  MemberQueryDto,
  TransferTownDto,
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
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'avatar', maxCount: 1 },
      { name: 'image', maxCount: 1 },
    ]),
  )
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiOperation({
    summary: 'Register a new fellowship member with optional avatar upload',
  })
  @ApiResponse({ status: 201, description: 'Member registered successfully' })
  @ApiResponse({ status: 400, description: 'Age rule or quota violation' })
  @ApiResponse({ status: 409, description: 'Phone or email already exists' })
  async create(
    @Body() dto: CreateMemberDto,
    @UploadedFiles()
    files: {
      avatar?: Express.Multer.File[];
      image?: Express.Multer.File[];
    },
    @CurrentUser() currentUser: IAuthUser,
    @Headers('x-town-id') xTownId?: string,
  ) {
    const file = files?.avatar?.[0] || files?.image?.[0];
    return this.usersService.createMember(dto, currentUser, xTownId, file);
  }

  @Patch(':id')
  @UseInterceptors(
    FileFieldsInterceptor([
      { name: 'avatar', maxCount: 1 },
      { name: 'image', maxCount: 1 },
    ]),
  )
  @ApiConsumes('multipart/form-data', 'application/json')
  @ApiOperation({
    summary: 'Update member profile information with optional avatar upload',
  })
  @ApiResponse({ status: 200, description: 'Member updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation or quota error' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateMemberDto,
    @UploadedFiles()
    files: {
      avatar?: Express.Multer.File[];
      image?: Express.Multer.File[];
    },
    @CurrentUser() currentUser: IAuthUser,
  ) {
    const file = files?.avatar?.[0] || files?.image?.[0];
    return this.usersService.updateMember(id, dto, currentUser, file);
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

  @Post('change-pc')
  @ApiOperation({
    summary:
      'Transition PC leadership in a town, optionally demoting or revoking outgoing PC access',
  })
  @ApiResponse({ status: 200, description: 'PC leadership transitioned' })
  @ApiResponse({ status: 400, description: 'Validation or quota error' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden (requires AP or Town PC)',
  })
  @ApiResponse({ status: 404, description: 'Member not found' })
  async changeTownPc(
    @Body() dto: ChangeTownPcDto,
    @CurrentUser() currentUser: IAuthUser,
  ) {
    return this.usersService.changeTownPc(dto, currentUser);
  }

  @Post(':id/transfer')
  @ApiOperation({ summary: 'Transfer a fellowship member to another town hub' })
  @ApiResponse({ status: 200, description: 'Member transferred successfully' })
  @ApiResponse({ status: 400, description: 'Invalid transfer parameters' })
  @ApiResponse({ status: 403, description: 'Forbidden transfer' })
  @ApiResponse({ status: 404, description: 'Member or town not found' })
  async transfer(
    @Param('id') id: string,
    @Body() dto: TransferTownDto,
    @CurrentUser() currentUser: IAuthUser,
  ) {
    return this.usersService.transferMember(id, dto, currentUser);
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
