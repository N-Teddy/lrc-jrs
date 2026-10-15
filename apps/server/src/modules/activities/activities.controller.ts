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
  Res,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AnyFilesInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { Public } from '../../core/decorators/public.decorator';
import { TownScope } from '../../core/decorators/town-scope.decorator';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { TownScopeGuard } from '../../core/guards/town-scope.guard';
import { ActivitiesService } from './activities.service';
import {
  ActivityQueryDto,
  CreateActivityDto,
  RecordAttendanceDto,
  UpdateActivityDto,
} from './dto';

@ApiTags('Activities & Attendance')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, TownScopeGuard)
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Get()
  @TownScope('townId')
  @ApiOperation({
    summary: 'List fellowship activities with filters, year/month & pagination',
  })
  @ApiResponse({ status: 200, description: 'Paginated activities' })
  async findAll(
    @Query() query: ActivityQueryDto,
    @Headers('x-town-id') xTownId?: string,
    @CurrentUser() currentUser?: IAuthUser,
  ) {
    return this.activitiesService.findAll(query, xTownId, currentUser);
  }

  @Get('stats')
  @TownScope('townId')
  @ApiOperation({ summary: 'Get aggregate activity and attendance metrics' })
  @ApiResponse({ status: 200, description: 'Activity summary statistics' })
  async getStats(
    @Query('townId') townId?: string,
    @Query('year') year?: number,
    @Query('month') month?: number,
    @Headers('x-town-id') xTownId?: string,
    @CurrentUser() currentUser?: IAuthUser,
  ) {
    return this.activitiesService.findStats(
      townId,
      year ? Number(year) : undefined,
      month ? Number(month) : undefined,
      xTownId,
      currentUser,
    );
  }

  @Get('member/:memberId/history')
  @ApiOperation({
    summary: 'Get attendance history and engagement summary for a member',
  })
  @ApiResponse({
    status: 200,
    description: 'Member attendance history and engagement summary',
  })
  async getMemberAttendanceHistory(@Param('memberId') memberId: string) {
    return this.activitiesService.getMemberAttendanceHistory(memberId);
  }

  @Get('report/folders')
  @ApiOperation({
    summary: 'List available Google Drive destination subfolders',
  })
  @ApiResponse({ status: 200, description: 'Folder list' })
  async getReportFolders() {
    return this.activitiesService.getReportFolders();
  }

  @Get('report/drive-files')
  @ApiOperation({
    summary: 'List files stored in Google Drive optionally filtered by folder',
  })
  @ApiResponse({ status: 200, description: 'Drive files list' })
  async getDriveFiles(@Query('folderId') folderId?: string) {
    return this.activitiesService.getDriveFiles(folderId);
  }

  @Public()
  @Get('report/drive-file/:fileId/stream')
  @ApiOperation({
    summary:
      'Stream a Google Drive file for in-app preview without cookie restrictions',
  })
  async streamDriveFile(@Param('fileId') fileId: string, @Res() res: Response) {
    const fileData = await this.activitiesService.getDriveFileStream(fileId);
    if (!fileData) {
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: 'File not found or unreachable' });
    }

    res.setHeader('Content-Type', fileData.mimeType);
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${encodeURIComponent(fileData.filename)}"`,
    );
    if (fileData.size) {
      res.setHeader('Content-Length', fileData.size);
    }
    fileData.stream.pipe(res);
  }

  @Public()
  @Get('report/drive-file/:fileId/download')
  @ApiOperation({
    summary: 'Download a Google Drive file directly',
  })
  async downloadDriveFile(
    @Param('fileId') fileId: string,
    @Res() res: Response,
  ) {
    const fileData = await this.activitiesService.getDriveFileStream(fileId);
    if (!fileData) {
      return res
        .status(HttpStatus.NOT_FOUND)
        .json({ message: 'File not found or unreachable' });
    }

    res.setHeader('Content-Type', fileData.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(fileData.filename)}"`,
    );
    fileData.stream.pipe(res);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get single activity details' })
  @ApiResponse({ status: 200, description: 'Activity details' })
  async findById(@Param('id') id: string) {
    return this.activitiesService.findById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new fellowship activity' })
  @ApiResponse({ status: 201, description: 'Activity successfully created' })
  async create(
    @Body() dto: CreateActivityDto,
    @CurrentUser() currentUser: IAuthUser,
  ) {
    return this.activitiesService.create(dto, currentUser);
  }

  @Patch(':id')
  @ApiOperation({
    summary:
      'Update activity details with audit history on reschedules/relocations',
  })
  @ApiResponse({ status: 200, description: 'Activity updated' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateActivityDto,
    @CurrentUser() currentUser: IAuthUser,
  ) {
    return this.activitiesService.update(id, dto, currentUser);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete an activity' })
  @ApiResponse({ status: 200, description: 'Activity deleted' })
  async delete(@Param('id') id: string, @CurrentUser() currentUser: IAuthUser) {
    return this.activitiesService.delete(id, currentUser);
  }

  @Get(':id/attendance')
  @ApiOperation({
    summary: 'Get attendance roster and summary for an activity',
  })
  @ApiResponse({ status: 200, description: 'Attendance roster' })
  async getAttendance(@Param('id') id: string) {
    return this.activitiesService.getAttendance(id);
  }

  @Post(':id/attendance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Record or update attendance (forbidden before activity has started)',
  })
  @ApiResponse({ status: 200, description: 'Attendance saved successfully' })
  async recordAttendance(
    @Param('id') id: string,
    @Body() dto: RecordAttendanceDto,
    @CurrentUser() currentUser: IAuthUser,
  ) {
    return this.activitiesService.recordAttendance(id, dto, currentUser);
  }

  @Post(':id/attendance/lock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Finalize and lock attendance for an activity' })
  @ApiResponse({ status: 200, description: 'Attendance locked' })
  async lockAttendance(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() currentUser: IAuthUser,
  ) {
    return this.activitiesService.lockAttendance(id, currentUser, reason);
  }

  @Post(':id/attendance/unlock')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Unlock finalized attendance for an activity (AP only)',
  })
  @ApiResponse({ status: 200, description: 'Attendance unlocked' })
  async unlockAttendance(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() currentUser: IAuthUser,
  ) {
    return this.activitiesService.unlockAttendance(id, currentUser, reason);
  }

  @Post(':id/report')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(AnyFilesInterceptor())
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary:
      'Upload one or multiple activity reports to Google Drive (only available after activity is completed)',
  })
  @ApiResponse({ status: 200, description: 'Reports uploaded successfully' })
  async uploadReport(
    @Param('id') id: string,
    @UploadedFiles() files: Express.Multer.File[],
    @Body('summary') summary: string,
    @Body('folderId') folderId: string,
    @CurrentUser() currentUser: IAuthUser,
  ) {
    return this.activitiesService.uploadReports(
      id,
      files,
      summary,
      currentUser,
      folderId,
    );
  }

  @Delete(':id/report/:fileId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a specific activity report file from Google Drive',
  })
  @ApiResponse({ status: 200, description: 'Report file removed' })
  async deleteReportFile(
    @Param('id') id: string,
    @Param('fileId') fileId: string,
    @CurrentUser() currentUser: IAuthUser,
  ) {
    return this.activitiesService.deleteReport(id, currentUser, fileId);
  }

  @Delete(':id/report')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete activity reports from Google Drive' })
  @ApiResponse({ status: 200, description: 'Reports removed' })
  async deleteReport(
    @Param('id') id: string,
    @Query('fileId') fileId: string | undefined,
    @CurrentUser() currentUser: IAuthUser,
  ) {
    return this.activitiesService.deleteReport(id, currentUser, fileId);
  }
}
