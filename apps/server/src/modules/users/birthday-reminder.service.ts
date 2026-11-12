import { type IUpcomingBirthday, UserRole } from '@jrs/shared';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron } from '@nestjs/schedule';
import { type Model, Types } from 'mongoose';
import { User, type UserDocument } from '../../database/schemas';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class BirthdayReminderService {
  private readonly logger = new Logger(BirthdayReminderService.name);

  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly notificationsService: NotificationsService,
  ) {}

  /**
   * Daily Birthday Cron Job running at 08:00 AM UTC (09:00 AM Cameroon/WAT time).
   * Dispatches alerts to town coordinators (PC & AP):
   * 1. One week before member's birthday (7 days milestone).
   * 2. On the exact day of the member's birthday.
   */
  @Cron('0 8 * * *')
  async handleDailyBirthdayCheck(): Promise<{
    reminders7d: number;
    remindersToday: number;
  }> {
    this.logger.log('Executing daily birthday milestone checks...');
    return this.processBirthdayReminders();
  }

  async processBirthdayReminders(
    referenceDate = new Date(),
  ): Promise<{ reminders7d: number; remindersToday: number }> {
    let reminders7d = 0;
    let remindersToday = 0;

    const todayMonth = referenceDate.getMonth() + 1; // 1-12
    const todayDay = referenceDate.getDate();

    const in7Days = new Date(referenceDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const in7DaysMonth = in7Days.getMonth() + 1;
    const in7DaysDay = in7Days.getDate();

    // Fetch active users with dateOfBirth populated
    const users = await this.userModel
      .find({
        dateOfBirth: { $exists: true, $ne: '' },
        'account.isAccessRevoked': { $ne: true },
      })
      .populate('homeTownId', 'name code')
      .exec();

    for (const user of users) {
      if (!user.dateOfBirth) continue;
      const parsed = this.parseDateOfBirth(user.dateOfBirth);
      if (!parsed) continue;

      const { birthYear, birthMonth, birthDay } = parsed;
      const townId = user.homeTownId
        ? (
            user.homeTownId as unknown as { _id?: Types.ObjectId; id?: string }
          )._id?.toString() ||
          (user.homeTownId as unknown as { id?: string }).id ||
          user.homeTownId.toString()
        : undefined;

      const townName =
        (user.homeTownId as unknown as { name?: string })?.name ||
        'la communauté';

      // 1. Day-of Birthday Milestone
      if (birthMonth === todayMonth && birthDay === todayDay) {
        const ageTurning = referenceDate.getFullYear() - birthYear;
        try {
          await this.notificationsService.createNotification({
            titleKey: 'notifications:birthday.todayTitle',
            titleParams: { name: user.fullName, age: ageTurning },
            bodyKey: 'notifications:birthday.todayBody',
            bodyParams: {
              name: user.fullName,
              age: ageTurning,
              town: townName,
            },
            level: 'INFO',
            action: 'MEMBER_BIRTHDAY_TODAY',
            resource: {
              entityType: 'BIRTHDAY',
              entityId: user._id.toString(),
              townId,
            },
            target: {
              roles: [UserRole.PC, UserRole.AP],
              townId,
            },
          });
          remindersToday++;
        } catch (err) {
          this.logger.error(
            `Failed to send day-of birthday notification for ${user.fullName}:`,
            err,
          );
        }
      }

      // 2. 7-Days Before Milestone (1 Week Notice)
      if (birthMonth === in7DaysMonth && birthDay === in7DaysDay) {
        const ageTurning = in7Days.getFullYear() - birthYear;
        const formattedDate = `${String(birthDay).padStart(2, '0')}/${String(birthMonth).padStart(2, '0')}`;
        try {
          await this.notificationsService.createNotification({
            titleKey: 'notifications:birthday.upcoming7dTitle',
            titleParams: { name: user.fullName, age: ageTurning },
            bodyKey: 'notifications:birthday.upcoming7dBody',
            bodyParams: {
              name: user.fullName,
              age: ageTurning,
              date: formattedDate,
              town: townName,
            },
            level: 'INFO',
            action: 'MEMBER_BIRTHDAY_UPCOMING_7D',
            resource: {
              entityType: 'BIRTHDAY',
              entityId: user._id.toString(),
              townId,
            },
            target: {
              roles: [UserRole.PC, UserRole.AP],
              townId,
            },
          });
          reminders7d++;
        } catch (err) {
          this.logger.error(
            `Failed to send 7-day birthday reminder for ${user.fullName}:`,
            err,
          );
        }
      }
    }

    this.logger.log(
      `Birthday reminders dispatched: ${remindersToday} day-of alerts, ${reminders7d} 7-day notices.`,
    );

    return { reminders7d, remindersToday };
  }

  /**
   * Retrieves upcoming birthdays for the specified month and optional town.
   * Defaults to current month and current date.
   */
  async getUpcomingBirthdays(
    townObjectId?: Types.ObjectId | null,
    targetMonth?: number,
    referenceDate = new Date(),
  ): Promise<{
    upcomingBirthdays: IUpcomingBirthday[];
    hasBirthdayToday: boolean;
    todayCelebrants: IUpcomingBirthday[];
  }> {
    const currentMonth = targetMonth || referenceDate.getMonth() + 1;
    const currentDay = referenceDate.getDate();

    const query: Record<string, unknown> = {
      dateOfBirth: { $exists: true, $ne: '' },
      'account.isAccessRevoked': { $ne: true },
    };

    if (townObjectId) {
      query.homeTownId = townObjectId;
    }

    const users = await this.userModel
      .find(query)
      .populate('homeTownId', 'name code')
      .exec();

    const list: IUpcomingBirthday[] = [];
    const todayCelebrants: IUpcomingBirthday[] = [];

    for (const u of users) {
      if (!u.dateOfBirth) continue;
      const parsed = this.parseDateOfBirth(u.dateOfBirth);
      if (!parsed) continue;

      const { birthYear, birthMonth, birthDay } = parsed;
      if (birthMonth !== currentMonth) continue;

      const isToday = birthMonth === currentMonth && birthDay === currentDay;
      const ageTurning = referenceDate.getFullYear() - birthYear;
      const daysUntil = birthDay - currentDay;

      const birthdayItem: IUpcomingBirthday = {
        id: u._id.toString(),
        fullName: u.fullName,
        avatarUrl: u.avatarUrl,
        dateOfBirth: u.dateOfBirth,
        birthMonth,
        birthDay,
        ageTurning: ageTurning > 0 ? ageTurning : 0,
        isToday,
        daysUntil,
        phoneNumber: u.phoneNumber,
        homeTownName:
          (u.homeTownId as unknown as { name?: string })?.name || undefined,
      };

      list.push(birthdayItem);
      if (isToday) {
        todayCelebrants.push(birthdayItem);
      }
    }

    // Sort order:
    // 1. Today's birthdays first (daysUntil === 0)
    // 2. Upcoming birthdays in the rest of this month (daysUntil > 0, sorted ascending)
    // 3. Past birthdays earlier this month (daysUntil < 0, sorted ascending by day)
    list.sort((a, b) => {
      if (a.isToday && !b.isToday) return -1;
      if (!a.isToday && b.isToday) return 1;

      if (a.daysUntil >= 0 && b.daysUntil >= 0) {
        return a.daysUntil - b.daysUntil;
      }
      if (a.daysUntil >= 0 && b.daysUntil < 0) return -1;
      if (a.daysUntil < 0 && b.daysUntil >= 0) return 1;

      return a.birthDay - b.birthDay;
    });

    return {
      upcomingBirthdays: list,
      hasBirthdayToday: todayCelebrants.length > 0,
      todayCelebrants,
    };
  }

  /**
   * Safely parses YYYY-MM-DD or standard ISO date string to year, month (1-12), and day (1-31).
   */
  private parseDateOfBirth(
    dob: string,
  ): { birthYear: number; birthMonth: number; birthDay: number } | null {
    if (!dob || typeof dob !== 'string') return null;

    // Check simple 'YYYY-MM-DD' format first
    const parts = dob.trim().split(/[-/T ]/);
    if (parts.length >= 3) {
      const year = Number.parseInt(parts[0], 10);
      const month = Number.parseInt(parts[1], 10);
      const day = Number.parseInt(parts[2], 10);

      if (
        !Number.isNaN(year) &&
        !Number.isNaN(month) &&
        !Number.isNaN(day) &&
        month >= 1 &&
        month <= 12 &&
        day >= 1 &&
        day <= 31
      ) {
        return { birthYear: year, birthMonth: month, birthDay: day };
      }
    }

    const d = new Date(dob);
    if (!Number.isNaN(d.getTime())) {
      return {
        birthYear: d.getUTCFullYear(),
        birthMonth: d.getUTCMonth() + 1,
        birthDay: d.getUTCDate(),
      };
    }

    return null;
  }
}
