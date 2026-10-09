import {
  ActivityStatus,
  ActivityType,
  AttendanceStatus,
  AttendeeType,
  type IActivity,
  type IActivityChangeLog,
  type IActivityStats,
  type IAttendance,
  type IAttendanceItem,
  type IAuthUser,
  type IPaginatedActivitiesResponse,
  UserRole,
} from '@jrs/shared';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { type Model, Types } from 'mongoose';
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
import type {
  ActivityQueryDto,
  CreateActivityDto,
  RecordAttendanceDto,
  UpdateActivityDto,
} from './dto';

@Injectable()
export class ActivitiesService {
  constructor(
    @InjectModel(Activity.name)
    private readonly activityModel: Model<ActivityDocument>,
    @InjectModel(Attendance.name)
    private readonly attendanceModel: Model<AttendanceDocument>,
    @InjectModel(Town.name)
    private readonly townModel: Model<TownDocument>,
    @InjectModel(User.name) readonly _userModel: Model<UserDocument>,
  ) {}

  /**
   * Helper to resolve town identifier (ObjectId string or town code like "DLA")
   */
  async resolveTownObjectId(
    identifier?: string,
  ): Promise<Types.ObjectId | null> {
    if (!identifier) return null;
    const trimmed = identifier.trim();

    if (Types.ObjectId.isValid(trimmed) && trimmed.length === 24) {
      return new Types.ObjectId(trimmed);
    }

    const town = await this.townModel
      .findOne({ code: trimmed.toUpperCase() })
      .exec();
    return town ? (town._id as Types.ObjectId) : null;
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
      status: doc.status,
      changeHistory,
      attendanceCount: attendanceCounts || { members: 0, guests: 0, total: 0 },
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

    // Resolve town scoping
    let effectiveTownId: Types.ObjectId | null = null;
    if (currentUser && currentUser.role !== UserRole.AP) {
      effectiveTownId = await this.resolveTownObjectId(currentUser.homeTownId);
    } else if (xTownId) {
      effectiveTownId = await this.resolveTownObjectId(xTownId);
    } else if (query.townId) {
      effectiveTownId = await this.resolveTownObjectId(query.townId);
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

    // Date range filtering (Year >= 2026)
    if (query.year) {
      const targetYear = Math.max(2026, Number(query.year));
      if (query.month) {
        const targetMonth = Math.min(12, Math.max(1, Number(query.month)));
        const startOfMonth = new Date(Date.UTC(targetYear, targetMonth - 1, 1));
        const endOfMonth = new Date(Date.UTC(targetYear, targetMonth, 1));
        filter.startDate = { $gte: startOfMonth, $lt: endOfMonth };
      } else {
        const startOfYear = new Date(Date.UTC(targetYear, 0, 1));
        const endOfYear = new Date(Date.UTC(targetYear + 1, 0, 1));
        filter.startDate = { $gte: startOfYear, $lt: endOfYear };
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
    if (currentUser && currentUser.role !== UserRole.AP) {
      effectiveTownId = await this.resolveTownObjectId(currentUser.homeTownId);
    } else if (xTownId) {
      effectiveTownId = await this.resolveTownObjectId(xTownId);
    } else if (townId) {
      effectiveTownId = await this.resolveTownObjectId(townId);
    }

    if (effectiveTownId) {
      filter.$or = [
        { hostTownId: effectiveTownId },
        { townId: effectiveTownId },
      ];
    }

    if (year) {
      const targetYear = Math.max(2026, Number(year));
      if (month) {
        const targetMonth = Math.min(12, Math.max(1, Number(month)));
        const startOfMonth = new Date(Date.UTC(targetYear, targetMonth - 1, 1));
        const endOfMonth = new Date(Date.UTC(targetYear, targetMonth, 1));
        filter.startDate = { $gte: startOfMonth, $lt: endOfMonth };
      } else {
        const startOfYear = new Date(Date.UTC(targetYear, 0, 1));
        const endOfYear = new Date(Date.UTC(targetYear + 1, 0, 1));
        filter.startDate = { $gte: startOfYear, $lt: endOfYear };
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
      throw new BadRequestException('Invalid activity ID');
    }

    const doc = await this.activityModel
      .findOne({ _id: new Types.ObjectId(id), isDeleted: false })
      .populate('townId', 'name code')
      .populate('hostTownId', 'name code')
      .exec();

    if (!doc) {
      throw new NotFoundException(`Activity with ID ${id} not found`);
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
      throw new BadRequestException(
        'Activities can only be scheduled for the year 2026 or later.',
      );
    }

    const endDate = dto.endDate
      ? new Date(dto.endDate)
      : new Date(startDate.getTime() + 3 * 3600 * 1000); // default +3 hours

    if (endDate < startDate) {
      throw new BadRequestException(
        'End date and time cannot be earlier than start date and time.',
      );
    }

    const townId = await this.resolveTownObjectId(dto.townId);
    if (!townId) {
      throw new BadRequestException('Invalid location town ID');
    }

    let hostTownId: Types.ObjectId | null = null;
    if (dto.hostTownId) {
      hostTownId = await this.resolveTownObjectId(dto.hostTownId);
    } else if (currentUser.homeTownId) {
      hostTownId = await this.resolveTownObjectId(currentUser.homeTownId);
    } else {
      hostTownId = townId;
    }

    const newActivity = new this.activityModel({
      title: dto.title.trim(),
      activityType: dto.activityType,
      startDate,
      endDate,
      townId,
      locationVenue: dto.locationVenue.trim(),
      notes: dto.notes?.trim(),
      hostTownId,
      status: ActivityStatus.SCHEDULED,
      changeHistory: [],
      createdBy: new Types.ObjectId(currentUser.id),
      isDeleted: false,
    });

    const saved = await newActivity.save();
    return this.findById(saved._id.toString());
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
      throw new BadRequestException('Invalid activity ID');
    }

    const activity = await this.activityModel
      .findOne({ _id: new Types.ObjectId(id), isDeleted: false })
      .exec();

    if (!activity) {
      throw new NotFoundException(`Activity with ID ${id} not found`);
    }

    // Detect critical changes for audit history
    let dateChanged = false;
    let locationChanged = false;
    let statusChanged = false;

    const previousValues: Record<string, any> = {};
    const newValues: Record<string, any> = {};

    if (dto.startDate) {
      const newStart = new Date(dto.startDate);
      if (newStart.getUTCFullYear() < 2026) {
        throw new BadRequestException(
          'Activities can only be scheduled for the year 2026 or later.',
        );
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
      throw new BadRequestException(
        'End date cannot be earlier than start date.',
      );
    }

    if (dto.townId) {
      const newTownId = await this.resolveTownObjectId(dto.townId);
      if (!newTownId) {
        throw new BadRequestException('Invalid location town ID');
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

    if (dto.status && dto.status !== activity.status) {
      statusChanged = true;
      previousValues.status = activity.status;
      newValues.status = dto.status;
      activity.status = dto.status;
    }

    if (dto.title) activity.title = dto.title.trim();
    if (dto.activityType) activity.activityType = dto.activityType;
    if (dto.notes !== undefined) activity.notes = dto.notes?.trim();

    // Push to change history if audited field changed
    if (dateChanged || locationChanged || statusChanged) {
      let changeType = 'STATUS_CHANGED';
      if (dateChanged) changeType = 'RESCHEDULED';
      else if (locationChanged) changeType = 'LOCATION_CHANGED';

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
    if (!Types.ObjectId.isValid(activityId)) {
      throw new BadRequestException('Invalid activity ID');
    }

    const activity = await this.activityModel
      .findOne({ _id: new Types.ObjectId(activityId), isDeleted: false })
      .exec();

    if (!activity) {
      throw new NotFoundException(`Activity with ID ${activityId} not found`);
    }

    // STRICT TIMING GUARD: Attendance is forbidden before activity start date
    const now = new Date();
    if (now < activity.startDate) {
      throw new BadRequestException(
        'Attendance cannot be recorded before the activity has officially started.',
      );
    }

    // Validate duplicate members in payload
    const memberIdsSet = new Set<string>();
    for (const item of dto.attendees) {
      if (item.attendeeType === AttendeeType.MEMBER && item.memberId) {
        if (memberIdsSet.has(item.memberId)) {
          throw new BadRequestException(
            `Duplicate attendance entry for member ID ${item.memberId}`,
          );
        }
        memberIdsSet.add(item.memberId);
      }
    }

    // Process items
    const processedAttendees: any[] = [];
    let _membersPresent = 0;
    let _guestsPresent = 0;
    let _totalExcused = 0;

    for (const item of dto.attendees) {
      if (item.attendeeType === AttendeeType.MEMBER) {
        if (!item.memberId || !Types.ObjectId.isValid(item.memberId)) {
          throw new BadRequestException(
            'Member ID is required and must be valid for member attendee',
          );
        }
        if (item.status === AttendanceStatus.PRESENT) _membersPresent++;
        else if (item.status === AttendanceStatus.EXCUSED) _totalExcused++;

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
          throw new BadRequestException(
            'Guest full name is required for guest attendee',
          );
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

    return this.getAttendance(activityId);
  }

  /**
   * Retrieve attendance record for an activity with populated member details
   */
  async getAttendance(activityId: string): Promise<IAttendance> {
    if (!Types.ObjectId.isValid(activityId)) {
      throw new BadRequestException('Invalid activity ID');
    }

    const activity = await this.activityModel
      .findOne({ _id: new Types.ObjectId(activityId), isDeleted: false })
      .populate('townId', 'name code')
      .populate('hostTownId', 'name code')
      .exec();

    if (!activity) {
      throw new NotFoundException(`Activity with ID ${activityId} not found`);
    }

    const attendanceDoc = await this.attendanceModel
      .findOne({ activityId: activity._id })
      .populate({
        path: 'attendees.memberId',
        select: 'fullName phoneNumber email role homeTownId',
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
          totalExcused: 0,
        },
      };
    }

    let membersPresent = 0;
    let guestsPresent = 0;
    let totalExcused = 0;

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
              }
            : undefined;

        if (item.status === AttendanceStatus.PRESENT) {
          if (item.attendeeType === AttendeeType.MEMBER) membersPresent++;
          else if (item.attendeeType === AttendeeType.GUEST) guestsPresent++;
        } else if (item.status === AttendanceStatus.EXCUSED) {
          totalExcused++;
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
      attendees,
      summary: {
        totalPresent: membersPresent + guestsPresent,
        membersPresent,
        guestsPresent,
        totalExcused,
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
      throw new BadRequestException('Invalid activity ID');
    }

    const activity = await this.activityModel
      .findOne({ _id: new Types.ObjectId(id), isDeleted: false })
      .exec();

    if (!activity) {
      throw new NotFoundException(`Activity with ID ${id} not found`);
    }

    activity.isDeleted = true;
    await activity.save();

    return { success: true };
  }
}
