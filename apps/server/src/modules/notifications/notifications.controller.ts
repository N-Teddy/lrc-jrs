import type {
  IAuthUser,
  INotification,
  NotificationQueryDto,
  NotificationStatsDto,
  RegisterPushTokenDto,
} from '@jrs/shared';
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../core/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../core/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated notifications for current user' })
  async getNotifications(
    @CurrentUser() user: IAuthUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('unreadOnly') unreadOnly?: string,
  ) {
    const query: NotificationQueryDto = {
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
      unreadOnly: unreadOnly === 'true' || unreadOnly === '1',
    };
    return this.notificationsService.getUserNotifications(user.id, query);
  }

  @Get('unread-count')
  @ApiOperation({ summary: 'Get unread notification count' })
  async getUnreadCount(
    @CurrentUser() user: IAuthUser,
  ): Promise<NotificationStatsDto> {
    const unreadCount = await this.notificationsService.getUnreadCount(user.id);
    return { unreadCount };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark single notification as read' })
  async markAsRead(
    @CurrentUser() user: IAuthUser,
    @Param('id') id: string,
  ): Promise<INotification> {
    return this.notificationsService.markAsRead(user.id, id);
  }

  @Patch('mark-all-read')
  @ApiOperation({ summary: 'Mark all unread notifications as read' })
  async markAllAsRead(@CurrentUser() user: IAuthUser) {
    return this.notificationsService.markAllAsRead(user.id);
  }

  @Post('push-token')
  @ApiOperation({ summary: 'Register device push token' })
  async registerPushToken(
    @CurrentUser() user: IAuthUser,
    @Body() dto: RegisterPushTokenDto,
  ) {
    return this.notificationsService.registerPushToken(user.id, dto);
  }

  @Delete('push-token/:token')
  @ApiOperation({ summary: 'Unregister device push token on logout' })
  async removePushToken(
    @CurrentUser() user: IAuthUser,
    @Param('token') token: string,
  ) {
    return this.notificationsService.removePushToken(user.id, token);
  }
}
