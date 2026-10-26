import {
  ActivityStatus,
  ActivityType,
  AttendanceStatus,
  AttendeeType,
  ErrorCode,
  type IActivity,
  type IActivityChangeLog,
  type IActivityReport,
  type IActivityStats,
  type IAttendance,
  type IAttendanceItem,
  type IAuthUser,
  type IMemberAttendanceHistoryItem,
  type IMemberAttendanceHistoryResponse,
  type IPaginatedActivitiesResponse,
  type MemberEngagementLevel,
  UserRole,
} from '@jrs/shared';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { type Model, Types } from 'mongoose';
import {
  BadRequestAppException,
  ForbiddenAppException,
  NotFoundAppException,
} from '../../core/exceptions/app.exception';
import {
  Activity,
  type ActivityDocument,
  Attendance,
  type AttendanceDocument,
  Town,
  type TownDocument,
  User,
  type UserDocument,
} from '../../database/schemas';
import { DriveService } from '../../services/drive.service';
import { NotificationsService } from '../notifications/notifications.service';
import type {
  ActivityQueryDto,
  CreateActivityDto,
  RecordAttendanceDto,
  UpdateActivityDto,
} from './dto';

@Injectable()
export class ActivitiesService {
  private readonly logger = new Logger(ActivitiesService.name);

  constructor(
    @InjectModel(Activity.name)
    private readonly activityModel: Model<ActivityDocument>,
    @InjectModel(Attendance.name)
    private readonly attendanceModel: Model<AttendanceDocument>,
    @InjectModel(Town.name)
    private readonly townModel: Model<TownDocument>,
    @InjectModel(User.name) readonly _userModel: Model<UserDocument>,
    private readonly driveService: DriveService,
    private readonly notificationsService: NotificationsService,
  ) {
    void InjectModel;
    void Activity;
    void Attendance;
    void Town;
    void User;
  }

  /**
   * Auto-determine activity status based on date/time schedule
   */
  public determineStatus(startDate: Date, endDate: Date): ActivityStatus {
    const now = new Date();
    if (now < startDate) {
      return ActivityStatus.SCHEDULED;
    }
    if (now >= startDate && now <= endDate) {
      return ActivityStatus.IN_PROGRESS;
    }
    return ActivityStatus.COMPLETED;
  }

  /**
   * Helper to resolve town identifier (ObjectId string or town code like "DLA")
   */
  async resolveTownObjectId(
    identifier?: unknown,
  ): Promise<Types.ObjectId | null> {
    if (!identifier) return null;
    if (identifier instanceof Types.ObjectId) {
      return identifier;
    }
    const str = String(identifier).trim();
    if (!str) return null;

    if (Types.ObjectId.isValid(str) && str.length === 24) {
      return new Types.ObjectId(str);
    }

    const town = await this.townModel
      .findOne({ code: str.toUpperCase() })
      .exec();
    return town ? (town._id as Types.ObjectId) : null;
  }

  /**
   * Helper to validate activityId and fetch active activity or throw appropriate error
   */
  private async findValidActivityById(
    activityId: string,
  ): Promise<ActivityDocument> {
    if (!Types.ObjectId.isValid(activityId)) {
      throw new BadRequestAppException(ErrorCode.ACTIVITY_INVALID_ID);
    }

    const activity = await this.activityModel
      .findOne({ _id: new Types.ObjectId(activityId), isDeleted: false })
      .exec();

    if (!activity) {
      throw new NotFoundAppException(ErrorCode.ACTIVITY_NOT_FOUND, {
        id: activityId,
      });
    }

    return activity;
  }

  /**
   * Maps an Activity document to IActivity interface
   */
  private mapActivity(
    doc: ActivityDocument,
    attendanceCounts?: { members: number; guests: number; total: number },
  ): IActivity {
    const rawTown = doc.townId as unknown;
    const hasTownPopulated =
      rawTown &&
      typeof rawTown === 'object' &&
      'name' in (rawTown as Record<string, unknown>);

    const townObj = hasTownPopulated
      ? (rawTown as { _id: Types.ObjectId; name: string; code: string })
      : undefined;

    const rawHostTown = doc.hostTownId as unknown;
    const hasHostTownPopulated =
      rawHostTown &&
      typeof rawHostTown === 'object' &&
      'name' in (rawHostTown as Record<string, unknown>);

    const hostTownObj = hasHostTownPopulated
      ? (rawHostTown as { _id: Types.ObjectId; name: string; code: string })
      : undefined;

    const changeHistory: IActivityChangeLog[] = (doc.changeHistory || []).map(
      (log, index) => ({
        id: `log-${index}`,
        changeType: log.changeType as
          | 'RESCHEDULED'
          | 'LOCATION_CHANGED'
          | 'STATUS_CHANGED',
        changedBy: log.changedBy?.toString() || '',
        changedByName: log.changedByName || 'System',
        changedAt: log.changedAt
          ? log.changedAt.toISOString()
          : new Date().toISOString(),
        previousValues: log.previousValues || {},
        newValues: log.newValues || {},
        reason: log.reason,
      }),
    );

    const rawReports = (doc as any).reports || [];
    let reports: IActivityReport[] = rawReports.map((r: any) => ({
      fileId: r.fileId,
      filename: r.filename,
      webViewLink: r.webViewLink,
      uploadedBy: r.uploadedBy?.toString() || '',
      uploadedByName: r.uploadedByName,
      uploadedAt: r.uploadedAt
        ? r.uploadedAt instanceof Date
          ? r.uploadedAt.toISOString()
          : new Date(r.uploadedAt).toISOString()
        : new Date().toISOString(),
      summary: r.summary,
      folderId: r.folderId,
      fileSize: r.fileSize,
    }));

    if (reports.length === 0 && doc.report?.fileId) {
      reports = [
        {
          fileId: doc.report.fileId,
          filename: doc.report.filename,
          webViewLink: doc.report.webViewLink,
          uploadedBy: doc.report.uploadedBy?.toString() || '',
          uploadedByName: doc.report.uploadedByName,
          uploadedAt: doc.report.uploadedAt
            ? doc.report.uploadedAt.toISOString()
            : new Date().toISOString(),
          summary: doc.report.summary,
          folderId: (doc.report as any).folderId,
          fileSize: (doc.report as any).fileSize,
        },
      ];
    }

    const latestReport =
      reports.length > 0 ? reports[reports.length - 1] : undefined;

    return {
      id: doc._id.toString(),
      title: doc.title,
      activityType: doc.activityType,
      startDate: doc.startDate.toISOString(),
      endDate: doc.endDate.toISOString(),
      townId: townObj ? townObj._id.toString() : doc.townId?.toString() || '',
      town: townObj
        ? {
            id: townObj._id.toString(),
            name: townObj.name,
            code: townObj.code,
            activePcCount: 0,
          }
        : undefined,
      locationVenue: doc.locationVenue,
      notes: doc.notes,
      hostTownId: hostTownObj
        ? hostTownObj._id.toString()
        : doc.hostTownId?.toString() || '',
      hostTown: hostTownObj
        ? {
            id: hostTownObj._id.toString(),
            name: hostTownObj.name,
            code: hostTownObj.code,
            activePcCount: 0,
          }
        : undefined,
      status:
        doc.status === ActivityStatus.CANCELLED
          ? ActivityStatus.CANCELLED
          : this.determineStatus(doc.startDate, doc.endDate),
      changeHistory,
      attendanceCount: attendanceCounts || { members: 0, guests: 0, total: 0 },
      isAttendanceLocked: Boolean(doc.isAttendanceLocked),
      attendanceLockedAt: doc.attendanceLockedAt?.toISOString(),
      attendanceLockedBy: doc.attendanceLockedBy?.toString(),
      attendanceLockedByName: doc.attendanceLockedByName,
      report: latestReport,
      reports,
      createdBy: doc.createdBy?.toString() || '',
      createdAt: (doc as any).createdAt
        ? (doc as any).createdAt.toISOString()
        : new Date().toISOString(),
      updatedAt: (doc as any).updatedAt
        ? (doc as any).updatedAt.toISOString()
        : new Date().toISOString(),
    };
  }

  /**
   * List activities with filters, date queries (>= 2026), and pagination
   */
  async findAll(
    query: ActivityQueryDto,
    xTownId?: string,
    currentUser?: IAuthUser,
  ): Promise<IPaginatedActivitiesResponse> {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const filter: Record<string, any> = { isDeleted: false };

    // Resolve town scoping: if a specific town is requested via header or query, prioritize it
    let effectiveTownId: Types.ObjectId | null = null;
    const requestedTown = xTownId || query.townId;
    if (requestedTown) {
      effectiveTownId = await this.resolveTownObjectId(requestedTown);
    } else if (
      currentUser &&
      currentUser.role !== UserRole.AP &&
      currentUser.homeTownId
    ) {
      effectiveTownId = await this.resolveTownObjectId(currentUser.homeTownId);
    }

    if (effectiveTownId) {
      filter.$or = [
        { hostTownId: effectiveTownId },
        { townId: effectiveTownId },
      ];
    } else if (query.townId) {
      const townObjId = await this.resolveTownObjectId(query.townId);
      if (townObjId) filter.townId = townObjId;
    }

    if (query.hostTownId) {
      const hostTownObjId = await this.resolveTownObjectId(query.hostTownId);
      if (hostTownObjId) filter.hostTownId = hostTownObjId;
    }

    // Date range filtering
    if (query.year) {
      const targetYear = Number(query.year);
      if (!Number.isNaN(targetYear) && targetYear > 2000) {
        if (query.month) {
          const targetMonth = Math.min(12, Math.max(1, Number(query.month)));
          const startOfMonth = new Date(
            Date.UTC(targetYear, targetMonth - 1, 1),
          );
          const endOfMonth = new Date(Date.UTC(targetYear, targetMonth, 1));
          filter.startDate = { $gte: startOfMonth, $lt: endOfMonth };
        } else {
          const startOfYear = new Date(Date.UTC(targetYear, 0, 1));
          const endOfYear = new Date(Date.UTC(targetYear + 1, 0, 1));
          filter.startDate = { $gte: startOfYear, $lt: endOfYear };
        }
      }
    }

    if (query.activityType) {
      filter.activityType = query.activityType;
    }

    if (query.status) {
      filter.status = query.status;
    }

    if (query.search?.trim()) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        ...(filter.$or || []),
        { title: searchRegex },
        { locationVenue: searchRegex },
        { notes: searchRegex },
      ];
    }

    const [total, activities] = await Promise.all([
      this.activityModel.countDocuments(filter).exec(),
      this.activityModel
        .find(filter)
        .sort({ startDate: 1 })
        .skip(skip)
        .limit(limit)
        .populate('townId', 'name code')
        .populate('hostTownId', 'name code')
        .exec(),
    ]);

    // Gather attendance counts for returned activities
    const activityIds = activities.map((a) => a._id);
    const attendanceRecords = await this.attendanceModel
      .find({ activityId: { $in: activityIds } })
      .exec();

    const attendanceMap = new Map<
      string,
      { members: number; guests: number; total: number }
    >();

    for (const record of attendanceRecords) {
      let members = 0;
      let guests = 0;
      for (const item of record.attendees || []) {
        if (item.status === AttendanceStatus.PRESENT) {
          if (item.attendeeType === AttendeeType.MEMBER) members++;
          else if (item.attendeeType === AttendeeType.GUEST) guests++;
        }
      }
      attendanceMap.set(record.activityId.toString(), {
        members,
        guests,
        total: members + guests,
      });
    }

    const items = activities.map((doc) =>
      this.mapActivity(doc, attendanceMap.get(doc._id.toString())),
    );

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  /**
   * Aggregate statistics for activities and attendance metrics
   */
  async findStats(
    townId?: string,
    year?: number,
    month?: number,
    xTownId?: string,
    currentUser?: IAuthUser,
  ): Promise<IActivityStats> {
    const filter: Record<string, any> = { isDeleted: false };

    let effectiveTownId: Types.ObjectId | null = null;
    const requestedTown = xTownId || townId;
    if (requestedTown) {
      effectiveTownId = await this.resolveTownObjectId(requestedTown);
    } else if (
      currentUser &&
      currentUser.role !== UserRole.AP &&
      currentUser.homeTownId
    ) {
      effectiveTownId = await this.resolveTownObjectId(currentUser.homeTownId);
    }

    if (effectiveTownId) {
      filter.$or = [
        { hostTownId: effectiveTownId },
        { townId: effectiveTownId },
      ];
    }

    if (year) {
      const targetYear = Number(year);
      if (!Number.isNaN(targetYear) && targetYear > 2000) {
        if (month) {
          const targetMonth = Math.min(12, Math.max(1, Number(month)));
          const startOfMonth = new Date(
            Date.UTC(targetYear, targetMonth - 1, 1),
          );
          const endOfMonth = new Date(Date.UTC(targetYear, targetMonth, 1));
          filter.startDate = { $gte: startOfMonth, $lt: endOfMonth };
        } else {
          const startOfYear = new Date(Date.UTC(targetYear, 0, 1));
          const endOfYear = new Date(Date.UTC(targetYear + 1, 0, 1));
          filter.startDate = { $gte: startOfYear, $lt: endOfYear };
        }
      }
    }

    const activities = await this.activityModel.find(filter).exec();
    const totalActivities = activities.length;

    const now = new Date();
    let upcomingCount = 0;
    let completedCount = 0;

    const typeBreakdown: Record<ActivityType, number> = {
      [ActivityType.MONTHLY_MEETING]: 0,
      [ActivityType.RECREATIONAL]: 0,
      [ActivityType.SERVICE]: 0,
      [ActivityType.CAUSERIE]: 0,
      [ActivityType.CONFERENCE]: 0,
      [ActivityType.JPO]: 0,
    };

    for (const act of activities) {
      if (typeBreakdown[act.activityType] !== undefined) {
        typeBreakdown[act.activityType]++;
      }
      if (act.status === ActivityStatus.SCHEDULED && act.startDate >= now) {
        upcomingCount++;
      } else if (act.status === ActivityStatus.COMPLETED) {
        completedCount++;
      }
    }

    // Attendance stats
    const activityIds = activities.map((a) => a._id);
    const attendanceRecords = await this.attendanceModel
      .find({ activityId: { $in: activityIds } })
      .exec();

    let totalAttendance = 0;
    let totalGuestsReached = 0;

    for (const record of attendanceRecords) {
      for (const item of record.attendees || []) {
        if (item.status === AttendanceStatus.PRESENT) {
          totalAttendance++;
          if (item.attendeeType === AttendeeType.GUEST) {
            totalGuestsReached++;
          }
        }
      }
    }

    const avgAttendanceRate =
      completedCount > 0 ? Math.round(totalAttendance / completedCount) : 0;

    return {
      totalActivities,
      upcomingCount,
      completedCount,
      avgAttendanceRate,
      totalGuestsReached,
      typeBreakdown,
    };
  }

  /**
   * Find single activity by ID
   */
  async findById(id: string): Promise<IActivity> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestAppException(ErrorCode.ACTIVITY_INVALID_ID);
    }

    const doc = await this.activityModel
      .findOne({ _id: new Types.ObjectId(id), isDeleted: false })
      .populate('townId', 'name code')
      .populate('hostTownId', 'name code')
      .exec();

    if (!doc) {
      throw new NotFoundAppException(ErrorCode.ACTIVITY_NOT_FOUND, { id });
    }

    const attendance = await this.attendanceModel
      .findOne({ activityId: doc._id })
      .exec();

    let attendanceCounts = { members: 0, guests: 0, total: 0 };
    if (attendance) {
      let members = 0;
      let guests = 0;
      for (const item of attendance.attendees || []) {
        if (item.status === AttendanceStatus.PRESENT) {
          if (item.attendeeType === AttendeeType.MEMBER) members++;
          else if (item.attendeeType === AttendeeType.GUEST) guests++;
        }
      }
      attendanceCounts = { members, guests, total: members + guests };
    }

    return this.mapActivity(doc, attendanceCounts);
  }

  /**
   * Create a new fellowship activity
   */
  async create(
    dto: CreateActivityDto,
    currentUser: IAuthUser,
  ): Promise<IActivity> {
    const startDate = new Date(dto.startDate);
    if (startDate.getUTCFullYear() < 2026) {
      throw new BadRequestAppException(ErrorCode.ACTIVITY_MIN_YEAR, {
        minYear: 2026,
      });
    }

    const endDate = dto.endDate
      ? new Date(dto.endDate)
      : new Date(startDate.getTime() + 3 * 3600 * 1000); // default +3 hours

    if (endDate < startDate) {
      throw new BadRequestAppException(
        ErrorCode.ACTIVITY_END_DATE_BEFORE_START,
      );
    }

    const townId = await this.resolveTownObjectId(dto.townId);
    if (!townId) {
      throw new BadRequestAppException(ErrorCode.ACTIVITY_LOCATION_REQUIRED);
    }

    let hostTownId: Types.ObjectId | null = null;
    if (dto.hostTownId) {
      hostTownId = await this.resolveTownObjectId(dto.hostTownId);
    } else if (currentUser.homeTownId) {
      hostTownId = await this.resolveTownObjectId(currentUser.homeTownId);
    } else {
      hostTownId = townId;
    }

    const status = this.determineStatus(startDate, endDate);

    const newActivity = new this.activityModel({
      title: dto.title.trim(),
      activityType: dto.activityType,
      startDate,
      endDate,
      townId,
      locationVenue: dto.locationVenue.trim(),
      notes: dto.notes?.trim(),
      hostTownId,
      status,
      changeHistory: [],
      createdBy: new Types.ObjectId(currentUser.id),
      isDeleted: false,
    });

    const saved = await newActivity.save();
    const result = await this.findById(saved._id.toString());

    this.notificationsService
      .createNotification(
        {
          target: {
            townId: townId.toString(),
            excludeUserIds: [currentUser.id],
          },
          level: 'INFO',
          action: 'ACTIVITY_CREATED',
          titleKey: 'notifications:activityCreatedTitle',
          bodyKey: 'notifications:activityCreatedBody',
          bodyParams: {
            name: saved.title,
            date: new Date(saved.startDate).toLocaleDateString(),
          },
          resource: {
            entityType: 'ACTIVITY',
            entityId: saved._id.toString(),
            townId: townId.toString(),
            subTab: 'upcoming',
          },
          sendPush: true,
        },
        currentUser.id,
      )
      .catch((err) =>
        this.logger.warn(
          `Failed to dispatch activity notification: ${err.message}`,
        ),
      );

    return result;
  }

  /**
   * Update an activity with audit trail for reschedules, relocations, or status changes
   */
  async update(
    id: string,
    dto: UpdateActivityDto,
    currentUser: IAuthUser,
  ): Promise<IActivity> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestAppException(ErrorCode.ACTIVITY_INVALID_ID, { id });
    }

    const activity = await this.activityModel
      .findOne({ _id: new Types.ObjectId(id), isDeleted: false })
      .exec();

    if (!activity) {
      throw new NotFoundAppException(ErrorCode.ACTIVITY_NOT_FOUND, { id });
    }

    if (activity.status === ActivityStatus.COMPLETED) {
      throw new BadRequestAppException(ErrorCode.ACTIVITY_ALREADY_COMPLETED);
    }

    // Detect critical changes for audit history
    let dateChanged = false;
    let locationChanged = false;
    let statusChanged = false;

    const previousValues: Record<string, any> = {};
    const newValues: Record<string, any> = {};

    if (dto.startDate) {
      const newStart = new Date(dto.startDate);
      if (newStart.getUTCFullYear() < new Date().getFullYear()) {
        throw new BadRequestAppException(ErrorCode.ACTIVITY_MIN_YEAR, {
          minYear: 2026,
        });
      }
      if (activity.startDate.toISOString() !== newStart.toISOString()) {
        dateChanged = true;
        previousValues.startDate = activity.startDate.toISOString();
        newValues.startDate = newStart.toISOString();
        activity.startDate = newStart;
      }
    }

    if (dto.endDate) {
      const newEnd = new Date(dto.endDate);
      if (activity.endDate.toISOString() !== newEnd.toISOString()) {
        dateChanged = true;
        previousValues.endDate = activity.endDate.toISOString();
        newValues.endDate = newEnd.toISOString();
        activity.endDate = newEnd;
      }
    }

    if (activity.endDate < activity.startDate) {
      throw new BadRequestAppException(
        ErrorCode.ACTIVITY_END_DATE_BEFORE_START,
      );
    }

    if (dto.townId) {
      const newTownId = await this.resolveTownObjectId(dto.townId);
      if (!newTownId) {
        throw new BadRequestAppException(ErrorCode.ACTIVITY_LOCATION_REQUIRED);
      }
      if (activity.townId.toString() !== newTownId.toString()) {
        locationChanged = true;
        previousValues.townId = activity.townId.toString();
        newValues.townId = newTownId.toString();
        activity.townId = newTownId;
      }
    }

    if (
      dto.locationVenue &&
      dto.locationVenue.trim() !== activity.locationVenue
    ) {
      locationChanged = true;
      previousValues.locationVenue = activity.locationVenue;
      newValues.locationVenue = dto.locationVenue.trim();
      activity.locationVenue = dto.locationVenue.trim();
    }

    // Handle activity cancellation and reopening
    if (dto.status === ActivityStatus.CANCELLED) {
      if (activity.status !== ActivityStatus.CANCELLED) {
        statusChanged = true;
        previousValues.status = activity.status;
        newValues.status = ActivityStatus.CANCELLED;
        activity.status = ActivityStatus.CANCELLED;
      }
    } else if (activity.status === ActivityStatus.CANCELLED && dto.status) {
      // Reopen cancelled activity
      const restoredStatus = this.determineStatus(
        activity.startDate,
        activity.endDate,
      );
      statusChanged = true;
      previousValues.status = ActivityStatus.CANCELLED;
      newValues.status = restoredStatus;
      activity.status = restoredStatus;
    } else if (activity.status !== ActivityStatus.CANCELLED) {
      const computedStatus = this.determineStatus(
        activity.startDate,
        activity.endDate,
      );
      if (computedStatus !== activity.status) {
        statusChanged = true;
        previousValues.status = activity.status;
        newValues.status = computedStatus;
        activity.status = computedStatus;
      }
    }

    if (dto.title) activity.title = dto.title.trim();
    if (dto.activityType) activity.activityType = dto.activityType;
    if (dto.notes !== undefined) activity.notes = dto.notes?.trim();

    // Push to change history if audited field changed
    if (dateChanged || locationChanged || statusChanged) {
      let changeType = 'STATUS_CHANGED';
      if (activity.status === ActivityStatus.CANCELLED) {
        changeType = 'CANCELLED';
      } else if (previousValues.status === ActivityStatus.CANCELLED) {
        changeType = 'REOPENED';
      } else if (dateChanged) {
        changeType = 'RESCHEDULED';
      } else if (locationChanged) {
        changeType = 'LOCATION_CHANGED';
      }

      activity.changeHistory.push({
        changeType,
        changedBy: new Types.ObjectId(currentUser.id),
        changedByName: currentUser.fullName,
        changedAt: new Date(),
        previousValues,
        newValues,
        reason:
          dto.changeReason ||
          `Updated ${changeType.toLowerCase().replace('_', ' ')}`,
      });
    }

    await activity.save();

    const townIdStr =
      activity.townId?._id?.toString() || activity.townId?.toString() || '';

    if (activity.status === ActivityStatus.CANCELLED) {
      this.notificationsService
        .createNotification(
          {
            target: {
              townId: townIdStr,
              excludeUserIds: [currentUser.id],
            },
            level: 'WARNING',
            action: 'ACTIVITY_CANCELLED',
            titleKey: 'notifications:activityCancelledTitle',
            bodyKey: 'notifications:activityCancelledBody',
            bodyParams: {
              name: activity.title,
              date: new Date(activity.startDate).toLocaleDateString(),
            },
            resource: {
              entityType: 'ACTIVITY',
              entityId: id,
              townId: townIdStr,
              subTab: 'overview',
            },
            sendPush: true,
          },
          currentUser.id,
        )
        .catch((err) =>
          this.logger.warn(
            `Failed to dispatch activity cancelled notification: ${err.message}`,
          ),
        );
    } else {
      this.notificationsService
        .createNotification(
          {
            target: {
              townId: townIdStr,
              excludeUserIds: [currentUser.id],
            },
            level: 'INFO',
            action: 'ACTIVITY_UPDATED',
            titleKey: 'notifications:activityUpdatedTitle',
            bodyKey: 'notifications:activityUpdatedBody',
            bodyParams: {
              name: activity.title,
            },
            resource: {
              entityType: 'ACTIVITY',
              entityId: id,
              townId: townIdStr,
              subTab: 'overview',
            },
            sendPush: true,
          },
          currentUser.id,
        )
        .catch((err) =>
          this.logger.warn(
            `Failed to dispatch activity updated notification: ${err.message}`,
          ),
        );
    }

    return this.findById(id);
  }

  /**
   * Record or update activity attendance with strict start time guard
   */
  async recordAttendance(
    activityId: string,
    dto: RecordAttendanceDto,
    currentUser: IAuthUser,
  ): Promise<IAttendance> {
    const activity = await this.findValidActivityById(activityId);

    // STRICT LOCK GUARD: Attendance cannot be modified if finalized and locked
    if (activity.isAttendanceLocked) {
      throw new BadRequestAppException(ErrorCode.ACTIVITY_ALREADY_COMPLETED);
    }

    // STRICT TIMING GUARD: Attendance is forbidden before activity start date
    const now = new Date();
    if (now < activity.startDate) {
      throw new BadRequestAppException(ErrorCode.BAD_REQUEST);
    }

    // Validate duplicate members in payload
    const memberIdsSet = new Set<string>();
    for (const item of dto.attendees) {
      if (item.attendeeType === AttendeeType.MEMBER && item.memberId) {
        if (memberIdsSet.has(item.memberId)) {
          throw new BadRequestAppException(ErrorCode.BAD_REQUEST);
        }
        memberIdsSet.add(item.memberId);
      }
    }

    // Process items
    const processedAttendees: any[] = [];
    let _membersPresent = 0;
    let _guestsPresent = 0;

    for (const item of dto.attendees) {
      if (item.attendeeType === AttendeeType.MEMBER) {
        if (!item.memberId || !Types.ObjectId.isValid(item.memberId)) {
          throw new BadRequestAppException(ErrorCode.BAD_REQUEST);
        }
        if (item.status === AttendanceStatus.PRESENT) _membersPresent++;

        processedAttendees.push({
          attendeeType: AttendeeType.MEMBER,
          memberId: new Types.ObjectId(item.memberId),
          checkInTime: item.checkInTime
            ? new Date(item.checkInTime)
            : new Date(),
          status: item.status,
        });
      } else if (item.attendeeType === AttendeeType.GUEST) {
        if (!item.guestInfo?.fullName?.trim()) {
          throw new BadRequestAppException(ErrorCode.BAD_REQUEST);
        }
        if (item.status === AttendanceStatus.PRESENT) _guestsPresent++;

        processedAttendees.push({
          attendeeType: AttendeeType.GUEST,
          guestInfo: {
            fullName: item.guestInfo.fullName.trim(),
            phoneNumber: item.guestInfo.phoneNumber?.trim(),
            notes: item.guestInfo.notes?.trim(),
          },
          checkInTime: item.checkInTime
            ? new Date(item.checkInTime)
            : new Date(),
          status: item.status,
        });
      }
    }

    let attendanceDoc = await this.attendanceModel
      .findOne({ activityId: activity._id })
      .exec();

    if (!attendanceDoc) {
      attendanceDoc = new this.attendanceModel({
        activityId: activity._id,
        recordedBy: new Types.ObjectId(currentUser.id),
        recordedAt: new Date(),
        attendees: processedAttendees,
      });
    } else {
      attendanceDoc.recordedBy = new Types.ObjectId(currentUser.id);
      attendanceDoc.recordedAt = new Date();
      attendanceDoc.attendees = processedAttendees as any;
    }

    await attendanceDoc.save();

    // Auto-update activity status if SCHEDULED
    if (activity.status === ActivityStatus.SCHEDULED) {
      activity.status = ActivityStatus.IN_PROGRESS;
      await activity.save();
    }

    const townIdStr =
      activity.townId?._id?.toString() || activity.townId?.toString() || '';
    this.notificationsService
      .createNotification(
        {
          target: {
            townId: townIdStr,
            roles: [UserRole.AP, UserRole.PC],
            excludeUserIds: [currentUser.id],
          },
          level: 'SUCCESS',
          action: 'ATTENDANCE_RECORDED',
          titleKey: 'notifications:attendanceRecordedTitle',
          bodyKey: 'notifications:attendanceRecordedBody',
          bodyParams: {
            name: activity.title,
          },
          resource: {
            entityType: 'ATTENDANCE',
            entityId: activityId,
            townId: townIdStr,
            subTab: 'history',
          },
          sendPush: true,
        },
        currentUser.id,
      )
      .catch((err) =>
        this.logger.warn(
          `Failed to dispatch attendance notification: ${err.message}`,
        ),
      );

    return this.getAttendance(activityId);
  }

  /**
   * Retrieve attendance record for an activity with populated member details
   */
  async getAttendance(activityId: string): Promise<IAttendance> {
    if (!Types.ObjectId.isValid(activityId)) {
      throw new BadRequestAppException(ErrorCode.ACTIVITY_INVALID_ID);
    }

    const activity = await this.activityModel
      .findOne({ _id: new Types.ObjectId(activityId), isDeleted: false })
      .populate('townId', 'name code')
      .populate('hostTownId', 'name code')
      .exec();

    if (!activity) {
      throw new NotFoundAppException(ErrorCode.ACTIVITY_NOT_FOUND, {
        id: activityId,
      });
    }

    const attendanceDoc = await this.attendanceModel
      .findOne({ activityId: activity._id })
      .populate({
        path: 'attendees.memberId',
        select: 'fullName phoneNumber email role homeTownId avatarUrl',
      })
      .exec();

    const mappedActivity = this.mapActivity(activity);

    if (!attendanceDoc) {
      return {
        id: '',
        activityId: activity._id.toString(),
        activity: mappedActivity,
        recordedBy: '',
        recordedAt: '',
        attendees: [],
        summary: {
          totalPresent: 0,
          membersPresent: 0,
          guestsPresent: 0,
        },
      };
    }

    let membersPresent = 0;
    let guestsPresent = 0;

    const attendees: IAttendanceItem[] = (attendanceDoc.attendees || []).map(
      (item) => {
        const rawMember = item.memberId as any;
        const member =
          rawMember && typeof rawMember === 'object' && rawMember.fullName
            ? {
                id: rawMember._id?.toString() || '',
                fullName: rawMember.fullName,
                phoneNumber: rawMember.phoneNumber,
                email: rawMember.email,
                role: rawMember.role,
                homeTownId: rawMember.homeTownId?.toString() || '',
                avatarUrl: rawMember.avatarUrl,
              }
            : undefined;

        if (item.status === AttendanceStatus.PRESENT) {
          if (item.attendeeType === AttendeeType.MEMBER) membersPresent++;
          else if (item.attendeeType === AttendeeType.GUEST) guestsPresent++;
        }

        return {
          id: (item as any)._id?.toString(),
          attendeeType: item.attendeeType,
          memberId: member ? member.id : item.memberId?.toString(),
          member,
          guestInfo: item.guestInfo
            ? {
                fullName: item.guestInfo.fullName,
                phoneNumber: item.guestInfo.phoneNumber,
                notes: item.guestInfo.notes,
              }
            : undefined,
          checkInTime: item.checkInTime
            ? item.checkInTime.toISOString()
            : new Date().toISOString(),
          status: item.status,
        };
      },
    );

    return {
      id: attendanceDoc._id.toString(),
      activityId: activity._id.toString(),
      activity: mappedActivity,
      recordedBy: attendanceDoc.recordedBy?.toString() || '',
      recordedAt: attendanceDoc.recordedAt
        ? attendanceDoc.recordedAt.toISOString()
        : '',
      isLocked: Boolean(activity.isAttendanceLocked || attendanceDoc.isLocked),
      lockedAt: (
        activity.attendanceLockedAt || attendanceDoc.lockedAt
      )?.toISOString(),
      lockedBy: (
        activity.attendanceLockedBy || attendanceDoc.lockedBy
      )?.toString(),
      lockReason: attendanceDoc.lockReason,
      attendees,
      summary: {
        totalPresent: membersPresent + guestsPresent,
        membersPresent,
        guestsPresent,
      },
    };
  }

  /**
   * Soft delete an activity
   */
  async delete(
    id: string,
    _currentUser: IAuthUser,
  ): Promise<{ success: boolean }> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestAppException(ErrorCode.ACTIVITY_INVALID_ID);
    }

    const activity = await this.activityModel
      .findOne({ _id: new Types.ObjectId(id), isDeleted: false })
      .exec();

    if (!activity) {
      throw new NotFoundAppException(ErrorCode.ACTIVITY_NOT_FOUND, { id });
    }

    activity.isDeleted = true;
    await activity.save();

    return { success: true };
  }

  /**
   * Retrieve member attendance history and gathering-based engagement analytics
   */
  async getMemberAttendanceHistory(
    memberId: string,
  ): Promise<IMemberAttendanceHistoryResponse> {
    if (!Types.ObjectId.isValid(memberId)) {
      throw new BadRequestAppException(ErrorCode.MEMBER_INVALID_ID);
    }

    const memberObjectId = new Types.ObjectId(memberId);
    const member = await this._userModel
      .findById(memberObjectId)
      .populate('homeTownId', 'name code')
      .exec();

    if (!member) {
      throw new NotFoundAppException(ErrorCode.MEMBER_NOT_FOUND, {
        id: memberId,
      });
    }

    const memberHomeTownId =
      (member.homeTownId as any)?._id?.toString() ||
      member.homeTownId?.toString() ||
      '';

    // 1. Find all attendance docs containing this member
    const attendanceDocs = await this.attendanceModel
      .find({ 'attendees.memberId': memberObjectId })
      .populate({
        path: 'activityId',
        match: { isDeleted: false },
        populate: [
          { path: 'townId', select: 'name code' },
          { path: 'hostTownId', select: 'name code' },
        ],
      })
      .exec();

    const items: IMemberAttendanceHistoryItem[] = [];
    const visitedHubsMap = new Map<
      string,
      { townId: string; townName: string; townCode: string; visitCount: number }
    >();

    let totalAttended = 0;
    let totalAbsent = 0;
    let externalVisitsCount = 0;
    let hubAttendedCount = 0;

    for (const doc of attendanceDocs) {
      const activity = doc.activityId as any;
      if (!activity) continue;

      const attendee = doc.attendees.find(
        (a) => a.memberId?.toString() === memberId,
      );
      if (!attendee) continue;

      const activityTownId =
        activity.townId?._id?.toString() || activity.townId?.toString() || '';
      const isExternal = Boolean(
        activityTownId &&
          memberHomeTownId &&
          activityTownId !== memberHomeTownId,
      );

      if (attendee.status === AttendanceStatus.PRESENT) {
        totalAttended++;
        if (isExternal) {
          externalVisitsCount++;
          const hubKey = activityTownId;
          const existingHub = visitedHubsMap.get(hubKey);
          if (existingHub) {
            existingHub.visitCount++;
          } else {
            visitedHubsMap.set(hubKey, {
              townId: activityTownId,
              townName: activity.townId?.name || 'External Hub',
              townCode: activity.townId?.code || 'EXT',
              visitCount: 1,
            });
          }
        } else {
          hubAttendedCount++;
        }
      } else if (attendee.status === AttendanceStatus.ABSENT) {
        totalAbsent++;
      }

      items.push({
        id: (doc as any)._id?.toString() || '',
        activityId: activity._id.toString(),
        activityTitle: activity.title,
        activityType: activity.activityType,
        startDate: activity.startDate.toISOString(),
        endDate: activity.endDate.toISOString(),
        venue: activity.venue,
        townId: activityTownId,
        townName: activity.townId?.name || '',
        townCode: activity.townId?.code || '',
        isExternal,
        status: attendee.status,
        checkInTime: attendee.checkInTime
          ? attendee.checkInTime.toISOString()
          : undefined,
      });
    }

    // Sort items by startDate descending (newest first)
    items.sort(
      (a, b) =>
        new Date(b.startDate).getTime() - new Date(a.startDate).getTime(),
    );

    // 2. Count total activities held in member's home town up to now
    const hubActivitiesCount = memberHomeTownId
      ? await this.activityModel
          .countDocuments({
            townId: new Types.ObjectId(memberHomeTownId),
            isDeleted: false,
            startDate: { $lte: new Date() },
          })
          .exec()
      : 0;

    const hubAttendanceRate =
      hubActivitiesCount > 0
        ? Math.min(
            100,
            Math.round((hubAttendedCount / hubActivitiesCount) * 100),
          )
        : totalAttended > 0
          ? 100
          : 0;

    // 3. Gathering-based streaks and engagement classification
    let consecutiveAttended = 0;
    let consecutiveMissed = 0;

    for (const item of items) {
      if (item.status === AttendanceStatus.PRESENT) {
        if (consecutiveMissed === 0) {
          consecutiveAttended++;
        } else {
          break;
        }
      } else if (item.status === AttendanceStatus.ABSENT) {
        if (consecutiveAttended === 0) {
          consecutiveMissed++;
        } else {
          break;
        }
      }
    }

    // Calculate recent turnout ratio from last 5 gatherings
    const recentSample = items.slice(0, 5);
    const recentPresentCount = recentSample.filter(
      (it) => it.status === AttendanceStatus.PRESENT,
    ).length;
    const recentTotalCount = recentSample.length;
    const recentTurnoutRatio =
      recentTotalCount > 0
        ? `${recentPresentCount}/${recentTotalCount}`
        : '0/0';

    let engagementLevel: MemberEngagementLevel = 'NEW';
    if (items.length === 0) {
      engagementLevel = 'NEW';
    } else if (consecutiveMissed >= 2) {
      engagementLevel = 'NEEDS_FOLLOW_UP';
    } else {
      const recentRate =
        recentTotalCount > 0
          ? (recentPresentCount / recentTotalCount) * 100
          : 0;
      if (recentRate >= 70) {
        engagementLevel = 'COMMITTED';
      } else if (recentRate >= 40) {
        engagementLevel = 'OCCASIONAL';
      } else {
        engagementLevel = 'IRREGULAR';
      }
    }

    return {
      memberId,
      totalAttended,
      totalAbsent,
      hubActivitiesCount,
      hubAttendanceRate,
      externalVisitsCount,
      consecutiveAttended,
      consecutiveMissed,
      engagementLevel,
      recentTurnoutRatio,
      visitedHubs: Array.from(visitedHubsMap.values()),
      items,
    };
  }

  /**
   * Finalize and lock attendance for an activity
   */
  async lockAttendance(
    activityId: string,
    currentUser: IAuthUser,
    reason?: string,
  ): Promise<IActivity> {
    const activity = await this.findValidActivityById(activityId);

    if (currentUser.role !== UserRole.AP && currentUser.role !== UserRole.PC) {
      throw new ForbiddenAppException(ErrorCode.FORBIDDEN);
    }

    const now = new Date();
    activity.isAttendanceLocked = true;
    activity.attendanceLockedAt = now;
    activity.attendanceLockedBy = new Types.ObjectId(currentUser.id);
    activity.attendanceLockedByName = currentUser.fullName;
    await activity.save();

    await this.attendanceModel.updateOne(
      { activityId: activity._id },
      {
        $set: {
          isLocked: true,
          lockedAt: now,
          lockedBy: new Types.ObjectId(currentUser.id),
          lockReason: reason || 'Attendance finalized and locked',
        },
      },
    );

    const lockTownIdStr =
      activity.townId?._id?.toString() || activity.townId?.toString() || '';
    this.notificationsService
      .createNotification(
        {
          target: {
            townId: lockTownIdStr,
            roles: [UserRole.AP, UserRole.PC],
            excludeUserIds: [currentUser.id],
          },
          level: 'INFO',
          action: 'ATTENDANCE_LOCKED',
          titleKey: 'notifications:attendanceLockedTitle',
          bodyKey: 'notifications:attendanceLockedBody',
          bodyParams: {
            name: activity.title,
          },
          resource: {
            entityType: 'ATTENDANCE',
            entityId: activityId,
            townId: lockTownIdStr,
            subTab: 'attendance',
          },
          sendPush: true,
        },
        currentUser.id,
      )
      .catch((err) =>
        this.logger.warn(
          `Failed to dispatch attendance locked notification: ${err.message}`,
        ),
      );

    return this.mapActivity(activity);
  }

  /**
   * Unlock attendance for an activity (AP only administrative override)
   */
  async unlockAttendance(
    activityId: string,
    currentUser: IAuthUser,
    reason?: string,
  ): Promise<IActivity> {
    const activity = await this.findValidActivityById(activityId);

    // Strict AP authority check
    if (currentUser.role !== UserRole.AP) {
      throw new ForbiddenAppException(ErrorCode.FORBIDDEN);
    }

    activity.isAttendanceLocked = false;
    activity.attendanceLockedAt = undefined;
    activity.attendanceLockedBy = undefined;
    activity.attendanceLockedByName = undefined;

    activity.changeHistory.push({
      changeType: 'STATUS_CHANGED',
      changedBy: new Types.ObjectId(currentUser.id),
      changedByName: currentUser.fullName,
      changedAt: new Date(),
      previousValues: { isAttendanceLocked: true },
      newValues: { isAttendanceLocked: false },
      reason: reason || 'Attendance unlocked by AP override',
    } as any);

    await activity.save();

    await this.attendanceModel.updateOne(
      { activityId: activity._id },
      {
        $set: {
          isLocked: false,
          lockedAt: null,
          lockedBy: null,
          lockReason: reason || 'Unlocked by AP',
        },
      },
    );

    const unlockTownIdStr =
      activity.townId?._id?.toString() || activity.townId?.toString() || '';
    this.notificationsService
      .createNotification(
        {
          target: {
            townId: unlockTownIdStr,
            roles: [UserRole.AP, UserRole.PC],
            excludeUserIds: [currentUser.id],
          },
          level: 'WARNING',
          action: 'ATTENDANCE_UNLOCKED',
          titleKey: 'notifications:attendanceUnlockedTitle',
          bodyKey: 'notifications:attendanceUnlockedBody',
          bodyParams: {
            name: activity.title,
          },
          resource: {
            entityType: 'ATTENDANCE',
            entityId: activityId,
            townId: unlockTownIdStr,
            subTab: 'attendance',
          },
          sendPush: true,
        },
        currentUser.id,
      )
      .catch((err) =>
        this.logger.warn(
          `Failed to dispatch attendance unlocked notification: ${err.message}`,
        ),
      );

    return this.mapActivity(activity);
  }

  /**
   * List available Google Drive destination folders
   */
  async getReportFolders() {
    return this.driveService.listFolders();
  }

  /**
   * Retrieves a file stream and metadata from Google Drive for direct preview/download
   */
  async getDriveFileStream(fileId: string) {
    return this.driveService.getFileStream(fileId);
  }

  /**
   * List files from Google Drive and cross-reference with activity records
   */
  async getDriveFiles(folderId?: string) {
    const driveFiles = await this.driveService.listFiles(folderId);

    // Retrieve all activities with reports to enrich file metadata
    const activitiesWithReports = await this.activityModel
      .find({
        isDeleted: false,
        $or: [
          { 'reports.0': { $exists: true } },
          { 'report.fileId': { $exists: true } },
        ],
      })
      .select('title startDate townId reports report')
      .lean()
      .exec();

    // Build lookup by fileId
    const reportMetaMap = new Map<
      string,
      {
        activityId: string;
        activityTitle: string;
        activityDate: string;
        uploadedByName?: string;
        summary?: string;
      }
    >();

    for (const act of activitiesWithReports as any[]) {
      const reps = act.reports || [];
      if (reps.length > 0) {
        for (const r of reps) {
          if (r.fileId) {
            reportMetaMap.set(r.fileId, {
              activityId: act._id.toString(),
              activityTitle: act.title,
              activityDate: act.startDate?.toISOString() || act.startDate,
              uploadedByName: r.uploadedByName,
              summary: r.summary,
            });
          }
        }
      } else if (act.report?.fileId) {
        reportMetaMap.set(act.report.fileId, {
          activityId: act._id.toString(),
          activityTitle: act.title,
          activityDate: act.startDate?.toISOString() || act.startDate,
          uploadedByName: act.report.uploadedByName,
          summary: act.report.summary,
        });
      }
    }

    // Merge drive files with activity metadata
    const mergedList = driveFiles.map((df) => {
      const meta = reportMetaMap.get(df.fileId);
      return {
        ...df,
        activityId: meta?.activityId,
        activityTitle: meta?.activityTitle,
        activityDate: meta?.activityDate,
        uploadedByName: meta?.uploadedByName,
        summary: meta?.summary,
      };
    });

    // Also include any database reports that might not have been returned by Drive API (e.g. mock or different permissions)
    for (const [fileId, meta] of reportMetaMap.entries()) {
      if (!mergedList.some((f) => f.fileId === fileId)) {
        const act = activitiesWithReports.find(
          (a: any) =>
            (a.reports || []).some((r: any) => r.fileId === fileId) ||
            a.report?.fileId === fileId,
        ) as any;
        const rep =
          (act?.reports || []).find((r: any) => r.fileId === fileId) ||
          act?.report;
        if (rep) {
          mergedList.push({
            fileId: rep.fileId,
            filename: rep.filename,
            webViewLink: rep.webViewLink,
            fileSize: rep.fileSize,
            uploadedAt: rep.uploadedAt,
            folderId: rep.folderId,
            activityId: meta.activityId,
            activityTitle: meta.activityTitle,
            activityDate: meta.activityDate,
            uploadedByName: meta.uploadedByName,
            summary: meta.summary,
          });
        }
      }
    }

    return mergedList;
  }

  /**
   * Upload one or multiple activity report files to Google Drive
   * (Strictly only available after the activity and if completed)
   */
  async uploadReports(
    activityId: string,
    files: Express.Multer.File[],
    summary: string | undefined,
    currentUser: IAuthUser,
    folderId?: string,
  ): Promise<IActivity> {
    const activity = await this.findValidActivityById(activityId);

    // Strict timing & status check: Must be past activity date and COMPLETED
    const now = new Date();
    const isPastActivity = now >= activity.endDate;
    const isCompleted = activity.status === ActivityStatus.COMPLETED;

    if (!isCompleted || !isPastActivity) {
      throw new BadRequestAppException(ErrorCode.ACTIVITY_ALREADY_COMPLETED);
    }

    if (currentUser.role !== UserRole.AP && currentUser.role !== UserRole.PC) {
      throw new ForbiddenAppException(ErrorCode.FORBIDDEN);
    }

    const validFiles = (files || []).filter((f) => f?.buffer);
    if (validFiles.length === 0) {
      throw new BadRequestAppException(ErrorCode.ACTIVITY_REPORTS_REQUIRED);
    }

    if (!activity.reports) {
      activity.reports = [];
    }

    // Preserve existing single report if not yet in reports array
    if (
      activity.report?.fileId &&
      !activity.reports.some((r) => r.fileId === activity.report?.fileId)
    ) {
      activity.reports.push(activity.report as any);
    }

    for (const file of validFiles) {
      const sanitizedTitle = activity.title.replace(/[^a-zA-Z0-9_-]/g, '_');
      const uploadResult = await this.driveService.uploadFile({
        filename: `Report_${sanitizedTitle}_${Date.now()}_${file.originalname}`,
        mimeType: file.mimetype,
        content: file.buffer,
        folderId: folderId?.trim() || undefined,
      });

      const reportItem = {
        fileId: uploadResult.fileId,
        filename: file.originalname,
        webViewLink: uploadResult.webViewLink,
        uploadedBy: new Types.ObjectId(currentUser.id),
        uploadedByName: currentUser.fullName,
        uploadedAt: new Date(),
        summary: summary?.trim(),
        folderId: folderId?.trim() || undefined,
        fileSize: file.size,
      };

      activity.reports.push(reportItem as any);
      activity.report = reportItem as any;
    }

    await activity.save();

    const reportTownIdStr =
      activity.townId?._id?.toString() || activity.townId?.toString() || '';
    this.notificationsService
      .createNotification(
        {
          target: {
            townId: reportTownIdStr,
            roles: [UserRole.AP, UserRole.PC],
            excludeUserIds: [currentUser.id],
          },
          level: 'SUCCESS',
          action: 'REPORT_UPLOADED',
          titleKey: 'notifications:reportUploadedTitle',
          bodyKey: 'notifications:reportUploadedBody',
          bodyParams: {
            fileName: validFiles[0]?.originalname || 'Report',
            name: activity.title,
          },
          resource: {
            entityType: 'REPORT',
            entityId: activityId,
            townId: reportTownIdStr,
            subTab: 'reports',
          },
          sendPush: true,
        },
        currentUser.id,
      )
      .catch((err) =>
        this.logger.warn(
          `Failed to dispatch report uploaded notification: ${err.message}`,
        ),
      );

    return this.mapActivity(activity);
  }

  /**
   * Delete an activity report file (or all reports if fileId not specified)
   */
  async deleteReport(
    activityId: string,
    currentUser: IAuthUser,
    fileId?: string,
  ): Promise<IActivity> {
    const activity = await this.findValidActivityById(activityId);

    if (currentUser.role !== UserRole.AP) {
      throw new ForbiddenAppException(ErrorCode.FORBIDDEN);
    }

    if (fileId) {
      // Delete specific file from Google Drive
      await this.driveService.deleteFile(fileId);

      // Remove from reports array
      activity.reports = (activity.reports || []).filter(
        (r) => r.fileId !== fileId,
      );

      // If active single report was this file, update to last report or clear
      if (activity.report?.fileId === fileId) {
        activity.report =
          activity.reports.length > 0
            ? activity.reports[activity.reports.length - 1]
            : undefined;
      }
    } else {
      // Bulk delete all reports for this activity
      if (activity.reports?.length) {
        for (const rep of activity.reports) {
          if (rep.fileId) await this.driveService.deleteFile(rep.fileId);
        }
      } else if (activity.report?.fileId) {
        await this.driveService.deleteFile(activity.report.fileId);
      }
      activity.reports = [];
      activity.report = undefined;
    }

    await activity.save();
    return this.mapActivity(activity);
  }

  /**
   * Upload standalone files directly to Google Drive without an activity
   */
  async uploadStandaloneDriveFiles(
    files: Express.Multer.File[],
    folderId: string | undefined,
    summary: string | undefined,
    currentUser: IAuthUser,
  ) {
    if (currentUser.role !== UserRole.AP && currentUser.role !== UserRole.PC) {
      throw new ForbiddenAppException(ErrorCode.FORBIDDEN);
    }

    if (!files || files.length === 0) {
      throw new BadRequestAppException(ErrorCode.ACTIVITY_FILES_REQUIRED);
    }

    const uploadedResults = [];
    for (const file of files) {
      const sanitizedFilename = file.originalname.replace(
        /[^a-zA-Z0-9._-]/g,
        '_',
      );
      const uploadResult = await this.driveService.uploadFile({
        filename: sanitizedFilename,
        mimeType: file.mimetype,
        content: file.buffer,
        folderId: folderId?.trim() || undefined,
      });

      uploadedResults.push({
        fileId: uploadResult.fileId,
        filename: file.originalname,
        webViewLink: uploadResult.webViewLink,
        uploadedByName: currentUser.fullName,
        uploadedAt: new Date().toISOString(),
        folderId: folderId?.trim() || undefined,
        fileSize: file.size,
        summary: summary?.trim(),
      });
    }

    return uploadedResults;
  }

  /**
   * Delete a file directly from Drive or from activity report if attached
   */
  async deleteDriveFile(fileId: string, currentUser: IAuthUser) {
    if (currentUser.role !== UserRole.AP && currentUser.role !== UserRole.PC) {
      throw new ForbiddenAppException(ErrorCode.FORBIDDEN);
    }

    // 1. Check if linked to any activity
    const activity = await this.activityModel.findOne({
      isDeleted: false,
      $or: [{ 'reports.fileId': fileId }, { 'report.fileId': fileId }],
    });

    if (activity) {
      activity.reports = (activity.reports || []).filter(
        (r) => r.fileId !== fileId,
      );
      if (activity.report?.fileId === fileId) {
        activity.report =
          activity.reports.length > 0
            ? activity.reports[activity.reports.length - 1]
            : undefined;
      }
      await activity.save();
    }

    // 2. Delete from Drive
    await this.driveService.deleteFile(fileId);

    return { success: true, fileId };
  }

  /**
   * Create a folder in Google Drive
   */
  async createDriveFolder(name: string, parentId?: string) {
    if (!name || !name.trim()) {
      throw new BadRequestAppException(ErrorCode.ACTIVITY_FOLDER_NAME_EMPTY);
    }
    return this.driveService.createFolder(name.trim(), parentId);
  }

  /**
   * Rename a folder in Google Drive
   */
  async renameDriveFolder(folderId: string, name: string) {
    if (!name || !name.trim()) {
      throw new BadRequestAppException(ErrorCode.ACTIVITY_FOLDER_NAME_EMPTY);
    }
    return this.driveService.renameFolder(folderId, name.trim());
  }

  /**
   * Delete a folder from Google Drive
   */
  async deleteDriveFolder(folderId: string) {
    return this.driveService.deleteFolder(folderId);
  }
}
