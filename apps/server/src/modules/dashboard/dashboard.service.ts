import {
  ActivityStatus,
  ActivityType,
  calculateAge,
  type IActivityTypeDistribution,
  type IAttendanceTrendPoint,
  type IDashboardKpis,
  type IDashboardOverviewDto,
  type IDemographicsStats,
  type IOperationalAlerts,
  type IRecentActivitySummary,
  type IRecentTransferItem,
  type IUpcomingActivitySpotlight,
  UserRole,
} from '@jrs/shared';
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { type Model, Types } from 'mongoose';
import {
  Activity,
  type ActivityDocument,
  Attendance,
  type AttendanceDocument,
  IntakeStatus,
  Town,
  type TownDocument,
  User,
  type UserDocument,
} from '../../database/schemas';
import { BirthdayReminderService } from '../users/birthday-reminder.service';

export interface DashboardQueryParams {
  townId?: string;
  period?: 'month' | 'quarter' | 'year';
  year?: number;
  month?: number;
}

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(Town.name)
    private readonly townModel: Model<TownDocument>,
    @InjectModel(Activity.name)
    private readonly activityModel: Model<ActivityDocument>,
    @InjectModel(Attendance.name)
    private readonly attendanceModel: Model<AttendanceDocument>,
    private readonly birthdayReminderService: BirthdayReminderService,
  ) {}

  /**
   * Resolves a town code or ObjectId to a valid MongoDB Types.ObjectId.
   */
  async resolveTownObjectId(
    townIdentifier?: string,
  ): Promise<Types.ObjectId | null> {
    if (
      !townIdentifier ||
      townIdentifier === 'all' ||
      townIdentifier === 'national'
    ) {
      return null;
    }
    const clean = townIdentifier.trim();
    if (Types.ObjectId.isValid(clean) && clean.length === 24) {
      return new Types.ObjectId(clean);
    }
    const found = await this.townModel.findOne({
      code: new RegExp(`^${clean}$`, 'i'),
    });
    return (found?._id as Types.ObjectId) || null;
  }

  /**
   * Computes the date range for the specified period and year.
   */
  private computeDateRange(
    period: 'month' | 'quarter' | 'year' = 'month',
    targetYear?: number,
    targetMonth?: number,
  ): { startDate: Date; endDate: Date } {
    const now = new Date();
    const year = targetYear || now.getFullYear();

    if (period === 'month') {
      const month = targetMonth || now.getMonth() + 1;
      const startDate = new Date(Date.UTC(year, month - 1, 1, 0, 0, 0));
      const endDate = new Date(Date.UTC(year, month, 1, 0, 0, 0));
      return { startDate, endDate };
    }

    if (period === 'quarter') {
      const currentQuarter = Math.floor(now.getMonth() / 3);
      const startMonth = currentQuarter * 3;
      const startDate = new Date(Date.UTC(year, startMonth, 1, 0, 0, 0));
      const endDate = new Date(Date.UTC(year, startMonth + 3, 1, 0, 0, 0));
      return { startDate, endDate };
    }

    // Default: 'year'
    const startDate = new Date(Date.UTC(year, 0, 1, 0, 0, 0));
    const endDate = new Date(Date.UTC(year + 1, 0, 1, 0, 0, 0));
    return { startDate, endDate };
  }

  /**
   * Aggregates executive dashboard metrics for the requested scope and time horizon.
   */
  async getOverview(
    params: DashboardQueryParams,
    userRole: UserRole = UserRole.PC,
    userHomeTownId?: string,
  ): Promise<IDashboardOverviewDto> {
    // 1. Resolve effective town
    const requestedTown =
      params.townId || (userRole === UserRole.AP ? undefined : userHomeTownId);
    const effectiveTownId = await this.resolveTownObjectId(requestedTown);

    // 2. Compute date bounds
    const now = new Date();
    const period = params.period || 'month';
    const { startDate, endDate } = this.computeDateRange(
      period,
      params.year || now.getFullYear(),
      params.month || (period === 'month' ? now.getMonth() + 1 : undefined),
    );

    // 3. User Filter
    const userFilter: Record<string, unknown> = {
      'account.isAccessRevoked': { $ne: true },
    };
    if (effectiveTownId) {
      userFilter.homeTownId = effectiveTownId;
    }

    // 4. Activity Filter
    const activityFilter: Record<string, unknown> = {
      isDeleted: false,
      startDate: { $gte: startDate, $lt: endDate },
    };
    if (effectiveTownId) {
      activityFilter.$or = [
        { hostTownId: effectiveTownId },
        { townId: effectiveTownId },
        { includedTownIds: effectiveTownId },
      ];
    }

    // Parallel query execution
    const [
      totalMembers,
      activeJrCount,
      activePcCount,
      usersForDemographics,
      periodActivities,
      allUpcomingActivities,
      completedActivitiesHistory,
      pendingIntakesCount,
      unsealedAttendanceCount,
      missingReportsCount,
      birthdaysResult,
    ] = await Promise.all([
      this.userModel.countDocuments(userFilter).exec(),
      this.userModel.countDocuments({ ...userFilter, isJr: true }).exec(),
      this.userModel
        .countDocuments({
          ...userFilter,
          role: UserRole.PC,
          isActivePC: true,
        })
        .exec(),
      this.userModel.find(userFilter, 'gender dateOfBirth').exec(),
      this.activityModel
        .find(activityFilter)
        .populate('hostTownId', 'name code')
        .sort({ startDate: 1 })
        .exec(),
      // Future activities from today onwards
      this.activityModel
        .find({
          isDeleted: false,
          startDate: { $gte: now },
          status: { $ne: ActivityStatus.CANCELLED },
          ...(effectiveTownId
            ? {
                $or: [
                  { hostTownId: effectiveTownId },
                  { townId: effectiveTownId },
                  { includedTownIds: effectiveTownId },
                ],
              }
            : {}),
        })
        .populate('hostTownId', 'name code')
        .sort({ startDate: 1 })
        .limit(1)
        .exec(),
      // Last completed activities for attendance trend
      this.activityModel
        .find({
          isDeleted: false,
          endDate: { $lt: now },
          status: { $ne: ActivityStatus.CANCELLED },
          ...(effectiveTownId
            ? {
                $or: [
                  { hostTownId: effectiveTownId },
                  { townId: effectiveTownId },
                  { includedTownIds: effectiveTownId },
                ],
              }
            : {}),
        })
        .populate('hostTownId', 'name code')
        .sort({ startDate: -1 })
        .limit(8)
        .exec(),
      // Operational alerts: Pending Intakes
      this.userModel
        .countDocuments({
          ...(effectiveTownId ? { homeTownId: effectiveTownId } : {}),
          intakeStatus: IntakeStatus.PENDING_REVIEW,
        })
        .exec(),
      // Operational alerts: Unsealed Attendance on completed events
      this.activityModel
        .countDocuments({
          isDeleted: false,
          endDate: { $lt: now },
          status: { $ne: ActivityStatus.CANCELLED },
          isAttendanceLocked: { $ne: true },
          ...(effectiveTownId ? { hostTownId: effectiveTownId } : {}),
        })
        .exec(),
      // Operational alerts: Missing Reports on completed events
      this.activityModel
        .countDocuments({
          isDeleted: false,
          endDate: { $lt: now },
          status: { $ne: ActivityStatus.CANCELLED },
          'report.fileId': { $exists: false },
          reports: { $size: 0 },
          ...(effectiveTownId ? { hostTownId: effectiveTownId } : {}),
        })
        .exec(),
      // Birthdays in the current month
      this.birthdayReminderService.getUpcomingBirthdays(
        effectiveTownId,
        now.getMonth() + 1,
        now,
      ),
    ]);

    // 5. Compute Attendance for Completed Activities
    const completedActivityIds = completedActivitiesHistory.map((a) => a._id);
    const attendanceDocs = await this.attendanceModel
      .find({ activityId: { $in: completedActivityIds } })
      .exec();

    const attendanceMap = new Map<string, AttendanceDocument>();
    for (const doc of attendanceDocs) {
      attendanceMap.set(doc.activityId.toString(), doc);
    }

    let totalAttendanceCount = 0;
    let totalGuestCount = 0;
    let totalAttendeesCount = 0;

    const trendPoints: IAttendanceTrendPoint[] = [];
    const recentActivitiesList: IRecentActivitySummary[] = [];

    for (const act of completedActivitiesHistory) {
      const att = attendanceMap.get(act._id.toString());
      let membersPresent = 0;
      let guestsPresent = 0;

      if (att?.attendees) {
        for (const item of att.attendees) {
          if (item.status === 'PRESENT') {
            if (item.attendeeType === 'GUEST') {
              guestsPresent++;
            } else {
              membersPresent++;
            }
          }
        }
      }

      const totalPresent = membersPresent + guestsPresent;
      const turnoutRate =
        totalMembers > 0
          ? Math.min(100, Math.round((membersPresent / totalMembers) * 100))
          : 0;

      totalAttendanceCount += membersPresent;
      totalGuestCount += guestsPresent;
      totalAttendeesCount += totalPresent;

      const trendPoint: IAttendanceTrendPoint = {
        activityId: act._id.toString(),
        title: act.title,
        date: act.startDate.toISOString(),
        activityType: act.activityType,
        membersPresent,
        guestsPresent,
        totalPresent,
        turnoutRate,
      };
      trendPoints.push(trendPoint);

      if (recentActivitiesList.length < 4) {
        const hasReport = Boolean(
          act.report?.fileId || (act.reports && act.reports.length > 0),
        );
        recentActivitiesList.push({
          id: act._id.toString(),
          title: act.title,
          activityType: act.activityType,
          startDate: act.startDate.toISOString(),
          endDate: act.endDate.toISOString(),
          status: act.status,
          turnoutRate,
          totalPresent,
          hasReport,
          isAttendanceLocked: Boolean(act.isAttendanceLocked),
        });
      }
    }

    // Reverse trend points so they read chronologically (left to right)
    trendPoints.reverse();
    // Keep at most 5 recent activities in the trend chart
    const slicedTrend = trendPoints.slice(-5);

    // Compute Average Attendance Rate % across completed activities
    const completedCountInHistory = completedActivitiesHistory.length;
    const averageAttendanceRate =
      completedCountInHistory > 0 && totalMembers > 0
        ? Math.min(
            100,
            Math.round(
              (totalAttendanceCount / completedCountInHistory / totalMembers) *
                100,
            ),
          )
        : 0;

    const guestAttendanceRate =
      totalAttendeesCount > 0
        ? Math.round((totalGuestCount / totalAttendeesCount) * 100)
        : 0;

    // 6. Upcoming Activities Count in current period
    let upcomingActivitiesCount = 0;
    let completedActivitiesCount = 0;

    // Activity Type Distribution
    const typeCounts: Record<ActivityType, number> = {
      [ActivityType.MONTHLY_MEETING]: 0,
      [ActivityType.RECREATIONAL]: 0,
      [ActivityType.SERVICE]: 0,
      [ActivityType.CAUSERIE]: 0,
      [ActivityType.CONFERENCE]: 0,
      [ActivityType.JPO]: 0,
      [ActivityType.AG]: 0,
    };

    for (const act of periodActivities) {
      if (typeCounts[act.activityType] !== undefined) {
        typeCounts[act.activityType]++;
      }
      if (act.status === ActivityStatus.CANCELLED) continue;

      if (act.startDate > now) {
        upcomingActivitiesCount++;
      } else {
        completedActivitiesCount++;
      }
    }

    const totalPeriodActivities = periodActivities.length;
    const activityTypeDistribution: IActivityTypeDistribution[] = Object.values(
      ActivityType,
    ).map((type) => {
      const count = typeCounts[type] || 0;
      return {
        type,
        count,
        percentage:
          totalPeriodActivities > 0
            ? Math.round((count / totalPeriodActivities) * 100)
            : 0,
      };
    });

    // 7. Upcoming Activity Spotlight (Nearest future event)
    let upcomingSpotlight: IUpcomingActivitySpotlight | undefined;
    if (allUpcomingActivities.length > 0) {
      const nearest = allUpcomingActivities[0];
      const start = new Date(nearest.startDate);
      const diffMs = start.getTime() - now.getTime();
      const diffHours = Math.max(0, Math.round(diffMs / (1000 * 60 * 60)));
      const diffDays = Math.max(0, Math.floor(diffHours / 24));
      const isToday =
        start.getUTCFullYear() === now.getUTCFullYear() &&
        start.getUTCMonth() === now.getUTCMonth() &&
        start.getUTCDate() === now.getUTCDate();

      const hostTownName =
        (nearest.hostTownId as unknown as { name?: string })?.name ||
        'Pôle local';

      upcomingSpotlight = {
        id: nearest._id.toString(),
        title: nearest.title,
        activityType: nearest.activityType,
        startDate: nearest.startDate.toISOString(),
        endDate: nearest.endDate.toISOString(),
        locationVenue: nearest.locationVenue,
        hostTownName,
        daysUntil: diffDays,
        hoursUntil: diffHours,
        isToday,
      };
    }

    // 8. Demographics Analysis
    let maleCount = 0;
    let femaleCount = 0;
    let unspecifiedGenderCount = 0;

    const ageBrackets = {
      junior18to21: 0,
      core22to25: 0,
      senior26to30: 0,
      mentors30Plus: 0,
    };

    for (const u of usersForDemographics) {
      if (u.gender === 'MALE') maleCount++;
      else if (u.gender === 'FEMALE') femaleCount++;
      else unspecifiedGenderCount++;

      if (u.dateOfBirth) {
        const age = calculateAge(u.dateOfBirth);
        if (age < 22) ageBrackets.junior18to21++;
        else if (age <= 25) ageBrackets.core22to25++;
        else if (age <= 30) ageBrackets.senior26to30++;
        else ageBrackets.mentors30Plus++;
      }
    }

    const totalWithGender = maleCount + femaleCount;
    const malePercentage =
      totalWithGender > 0
        ? Math.round((maleCount / totalWithGender) * 100)
        : 50;
    const femalePercentage =
      totalWithGender > 0
        ? Math.round((femaleCount / totalWithGender) * 100)
        : 50;

    const demographics: IDemographicsStats = {
      maleCount,
      femaleCount,
      malePercentage,
      femalePercentage,
      unspecifiedGenderCount,
      ageBrackets,
    };

    // 9. Recent Town Transfers
    const recentTransfers: IRecentTransferItem[] = [];
    try {
      const transferQuery: Record<string, unknown> = {
        'transferHistory.0': { $exists: true },
      };
      if (effectiveTownId) {
        const townIdStr = effectiveTownId.toString();
        transferQuery.$or = [
          { 'transferHistory.fromTownId': townIdStr },
          { 'transferHistory.toTownId': townIdStr },
        ];
      }

      const usersWithTransfers = await this.userModel
        .find(transferQuery, 'fullName transferHistory')
        .sort({ 'transferHistory.transferredAt': -1 })
        .limit(4)
        .exec();

      for (const u of usersWithTransfers) {
        if (u.transferHistory && u.transferHistory.length > 0) {
          const latestTransfer =
            u.transferHistory[u.transferHistory.length - 1];
          recentTransfers.push({
            id: `${u._id}_${latestTransfer.transferredAt}`,
            memberId: u._id.toString(),
            memberName: u.fullName,
            fromTownName: latestTransfer.fromTownId,
            toTownName: latestTransfer.toTownId,
            transferredAt: latestTransfer.transferredAt,
            reason: latestTransfer.reason,
          });
        }
      }
    } catch {}

    const kpis: IDashboardKpis = {
      totalMembers,
      activeJrCount,
      activePcCount,
      averageAttendanceRate,
      totalGuestsReached: totalGuestCount,
      guestAttendanceRate,
      upcomingActivitiesCount,
      completedActivitiesCount,
    };

    const operationalAlerts: IOperationalAlerts = {
      pendingIntakesCount,
      unsealedAttendanceCount,
      missingReportsCount,
      recentTransfersCount: recentTransfers.length,
    };

    return {
      kpis,
      attendanceTrend: slicedTrend,
      upcomingActivity: upcomingSpotlight,
      demographics,
      activityTypeDistribution,
      upcomingBirthdays: birthdaysResult.upcomingBirthdays,
      hasBirthdayToday: birthdaysResult.hasBirthdayToday,
      todayCelebrants: birthdaysResult.todayCelebrants,
      recentActivities: recentActivitiesList,
      operationalAlerts,
      recentTransfers,
    };
  }
}
