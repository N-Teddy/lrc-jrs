import {
  type CreateNotificationDto,
  ErrorCode,
  type INotification,
  type NotificationQueryDto,
  type NotificationResource,
  type RegisterPushTokenDto,
} from '@jrs/shared';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { type FilterQuery, type Model, Types } from 'mongoose';
import {
  BadRequestAppException,
  NotFoundAppException,
} from '../../core/exceptions/app.exception';
import {
  Notification,
  type NotificationDocument,
} from '../../database/schemas/notification.schema';
import {
  AccountStatus,
  User,
  type UserDocument,
} from '../../database/schemas/user.schema';
import { NotificationsGateway } from './notifications.gateway';
import { PushNotificationService } from './push-notification.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    @InjectModel(Notification.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly notificationsGateway: NotificationsGateway,
    private readonly pushNotificationService: PushNotificationService,
  ) {}

  /**
   * Dispatch a notification to targeted users who have active app access.
   * Excludes the actor so their own inbox is not cluttered.
   */
  async createNotification(
    dto: CreateNotificationDto,
    actorId?: string,
  ): Promise<{ deliveredCount: number }> {
    const query: FilterQuery<UserDocument> = {
      'account.hasAppAccess': true,
      'account.isAccessRevoked': { $ne: true },
      'account.status': AccountStatus.ACTIVE,
    };

    if (dto.target.userIds && dto.target.userIds.length > 0) {
      query._id = {
        $in: dto.target.userIds
          .filter((id) => Types.ObjectId.isValid(id))
          .map((id) => new Types.ObjectId(id)),
      };
    }

    if (dto.target.roles && dto.target.roles.length > 0) {
      query.role = { $in: dto.target.roles };
    }

    if (dto.target.townId) {
      query.homeTownId = dto.target.townId;
    }

    // Exclude actor and any explicitly excluded users
    const excludeIds = new Set<string>();
    if (actorId) excludeIds.add(actorId);
    if (dto.target.excludeUserIds) {
      for (const id of dto.target.excludeUserIds) {
        excludeIds.add(id);
      }
    }

    if (excludeIds.size > 0) {
      const validExcluded = Array.from(excludeIds)
        .filter((id) => Types.ObjectId.isValid(id))
        .map((id) => new Types.ObjectId(id));

      if (query._id) {
        query._id = { ...query._id, $nin: validExcluded };
      } else {
        query._id = { $nin: validExcluded };
      }
    }

    const recipients = await this.userModel.find(query).exec();
    if (recipients.length === 0) {
      return { deliveredCount: 0 };
    }

    const notificationDocs = recipients.map((recipient) => ({
      recipientId: recipient.id || recipient._id.toString(),
      townId: dto.resource?.townId || recipient.homeTownId?.toString(),
      level: dto.level,
      action: dto.action,
      titleKey: dto.titleKey,
      titleParams: dto.titleParams,
      bodyKey: dto.bodyKey,
      bodyParams: dto.bodyParams,
      resource: dto.resource,
      read: false,
    }));

    const inserted = await this.notificationModel.insertMany(notificationDocs);

    // Emit real-time WebSocket events and gather push tokens
    const pushMessages: Array<{
      to: string;
      title?: string;
      body: string;
      data?: Record<string, unknown>;
    }> = [];

    inserted.forEach((doc, idx) => {
      const recipient = recipients[idx];
      const recipientId = recipient.id || recipient._id.toString();

      const mapped: INotification = {
        _id: doc._id.toString(),
        recipientId,
        townId: doc.townId,
        level: doc.level as INotification['level'],
        action: doc.action as INotification['action'],
        titleKey: doc.titleKey,
        titleParams: doc.titleParams,
        bodyKey: doc.bodyKey,
        bodyParams: doc.bodyParams,
        resource: doc.resource,
        read: doc.read,
        readAt: doc.readAt?.toISOString(),
        createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
      };

      // 1. WebSocket real-time delivery
      this.notificationsGateway.emitToUser(recipientId, mapped);

      // 2. Collect device push tokens
      if (dto.sendPush !== false && recipient.pushTokens?.length) {
        recipient.pushTokens.forEach((pt) => {
          if (pt.token) {
            pushMessages.push({
              to: pt.token,
              title: dto.titleKey,
              body: dto.bodyKey,
              data: {
                notificationId: doc._id.toString(),
                resource: dto.resource,
                titleParams: dto.titleParams,
                bodyParams: dto.bodyParams,
              },
            });
          }
        });
      }
    });

    // 3. Dispatch push notifications
    if (pushMessages.length > 0) {
      this.pushNotificationService
        .sendPushNotifications(pushMessages)
        .then(({ invalidTokens }) => {
          if (invalidTokens.length > 0) {
            this.userModel
              .updateMany(
                { 'pushTokens.token': { $in: invalidTokens } },
                { $pull: { pushTokens: { token: { $in: invalidTokens } } } },
              )
              .exec()
              .catch((e) =>
                this.logger.warn(
                  `Failed to prune invalid tokens: ${e.message}`,
                ),
              );
          }
        })
        .catch((e) =>
          this.logger.warn(`Push delivery dispatch failed: ${e.message}`),
        );
    }

    return { deliveredCount: inserted.length };
  }

  /**
   * Get paginated notifications for current user
   */
  async getUserNotifications(
    userId: string,
    queryDto: NotificationQueryDto,
  ): Promise<{
    data: INotification[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = Math.max(1, Number(queryDto.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(queryDto.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: FilterQuery<NotificationDocument> = { recipientId: userId };
    if (queryDto.unreadOnly) {
      filter.read = false;
    }

    const [docs, total] = await Promise.all([
      this.notificationModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.notificationModel.countDocuments(filter).exec(),
    ]);

    const data: INotification[] = docs.map((doc) => ({
      _id: doc._id.toString(),
      recipientId: doc.recipientId,
      townId: doc.townId,
      level: doc.level as INotification['level'],
      action: doc.action as INotification['action'],
      titleKey: doc.titleKey,
      titleParams: doc.titleParams as
        | Record<string, string | number>
        | undefined,
      bodyKey: doc.bodyKey,
      bodyParams: doc.bodyParams as Record<string, string | number> | undefined,
      resource: doc.resource as unknown as NotificationResource | undefined,
      read: doc.read,
      readAt: doc.readAt ? new Date(doc.readAt).toISOString() : undefined,
      createdAt: doc.createdAt
        ? new Date(doc.createdAt).toISOString()
        : new Date().toISOString(),
    }));

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Get unread notification badge counter
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationModel
      .countDocuments({ recipientId: userId, read: false })
      .exec();
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(
    userId: string,
    notificationId: string,
  ): Promise<INotification> {
    if (!Types.ObjectId.isValid(notificationId)) {
      throw new BadRequestAppException(ErrorCode.BAD_REQUEST, {
        id: notificationId,
      });
    }

    const doc = await this.notificationModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(notificationId), recipientId: userId },
        { read: true, readAt: new Date() },
        { new: true },
      )
      .exec();

    if (!doc) {
      throw new NotFoundAppException(ErrorCode.NOTIFICATION_NOT_FOUND, {
        id: notificationId,
      });
    }

    const unreadCount = await this.getUnreadCount(userId);
    this.notificationsGateway.emitUnreadCount(userId, unreadCount);

    return {
      _id: doc._id.toString(),
      recipientId: doc.recipientId,
      townId: doc.townId,
      level: doc.level as INotification['level'],
      action: doc.action as INotification['action'],
      titleKey: doc.titleKey,
      titleParams: doc.titleParams as
        | Record<string, string | number>
        | undefined,
      bodyKey: doc.bodyKey,
      bodyParams: doc.bodyParams as Record<string, string | number> | undefined,
      resource: doc.resource as unknown as NotificationResource | undefined,
      read: doc.read,
      readAt: doc.readAt?.toISOString(),
      createdAt: doc.createdAt?.toISOString() || new Date().toISOString(),
    };
  }

  /**
   * Mark all unread notifications as read for current user
   */
  async markAllAsRead(userId: string): Promise<{ modifiedCount: number }> {
    const res = await this.notificationModel
      .updateMany(
        { recipientId: userId, read: false },
        { read: true, readAt: new Date() },
      )
      .exec();

    this.notificationsGateway.emitUnreadCount(userId, 0);

    return { modifiedCount: res.modifiedCount };
  }

  /**
   * Register push notification token for device
   */
  async registerPushToken(
    userId: string,
    dto: RegisterPushTokenDto,
  ): Promise<{ success: boolean }> {
    if (
      !dto.token ||
      !this.pushNotificationService.isExpoPushToken(dto.token)
    ) {
      throw new BadRequestAppException(ErrorCode.PUSH_TOKEN_INVALID, {
        token: dto.token,
      });
    }

    // Pull any existing identical token across any user to avoid duplicates
    await this.userModel
      .updateMany(
        { 'pushTokens.token': dto.token },
        { $pull: { pushTokens: { token: dto.token } } },
      )
      .exec();

    // Push token to current user
    await this.userModel
      .findByIdAndUpdate(new Types.ObjectId(userId), {
        $push: {
          pushTokens: {
            token: dto.token,
            platform: dto.platform,
            deviceName: dto.deviceName,
            updatedAt: new Date(),
          },
        },
      })
      .exec();

    return { success: true };
  }

  /**
   * Remove push notification token (e.g. on logout)
   */
  async removePushToken(
    userId: string,
    token: string,
  ): Promise<{ success: boolean }> {
    await this.userModel
      .findByIdAndUpdate(new Types.ObjectId(userId), {
        $pull: { pushTokens: { token } },
      })
      .exec();

    return { success: true };
  }
}
