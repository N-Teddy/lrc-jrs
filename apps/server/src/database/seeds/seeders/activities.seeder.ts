import {
  ActivityStatus,
  AttendanceStatus,
  AttendeeType,
  UserRole,
} from '@jrs/shared';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { type Model, Types } from 'mongoose';
import {
  type ActivityDocument,
  type AttendanceDocument,
  type TownDocument,
  type UserDocument,
} from '../../schemas';
import { SEED_ACTIVITIES } from '../data/activities.data';

@Injectable()
export class ActivitiesSeeder {
  private readonly logger = new Logger(ActivitiesSeeder.name);

  constructor(
    @InjectModel('Activity')
    private readonly activityModel: Model<ActivityDocument>,
    @InjectModel('Attendance')
    private readonly attendanceModel: Model<AttendanceDocument>,
    @InjectModel('User') private readonly userModel: Model<UserDocument>,
    @InjectModel('Town') private readonly townModel: Model<TownDocument>,
  ) {}

  /**
   * Seeds ~50 activities each for 2024, 2025, and 2026, and generates
   * realistic attendance sheets for completed activities.
   */
  async seed(
    townMap: Map<string, Types.ObjectId>,
    options: { clean?: boolean } = {},
  ): Promise<{ totalActivities: number; totalAttendances: number }> {
    if (options.clean) {
      this.logger.warn('Cleaning existing activities & attendances...');
      await this.activityModel.deleteMany({});
      await this.attendanceModel.deleteMany({});
    }

    // Retrieve default creators (AP or town PCs)
    const apUser = await this.userModel.findOne({ role: UserRole.AP }).exec();
    const pcUsers = await this.userModel.find({ role: UserRole.PC }).exec();
    const allMembers = await this.userModel
      .find({ role: UserRole.MEMBER })
      .exec();

    // Group PCs and members by townId string
    const pcsByTown = new Map<string, Types.ObjectId>();
    for (const pc of pcUsers) {
      if (pc.homeTownId) {
        pcsByTown.set(pc.homeTownId.toString(), pc._id as Types.ObjectId);
      }
    }

    const membersByTown = new Map<string, UserDocument[]>();
    for (const member of allMembers) {
      if (member.homeTownId) {
        const key = member.homeTownId.toString();
        const list = membersByTown.get(key) || [];
        list.push(member);
        membersByTown.set(key, list);
      }
    }

    const fallbackCreatorId =
      apUser?._id || pcUsers[0]?._id || new Types.ObjectId();

    let count2024 = 0;
    let count2025 = 0;
    let count2026 = 0;
    let attendanceCount = 0;

    for (const item of SEED_ACTIVITIES) {
      const townId = townMap.get(item.townCode);
      const hostTownId = townMap.get(item.hostTownCode);

      if (!townId || !hostTownId) {
        continue;
      }

      const creatorId =
        pcsByTown.get(townId.toString()) ||
        (fallbackCreatorId as Types.ObjectId);

      const payload = {
        title: item.title,
        activityType: item.activityType,
        startDate: item.startDate,
        endDate: item.endDate,
        townId,
        hostTownId,
        notes: item.notes,
        status: item.status,
        createdBy: creatorId,
        isDeleted: false,
      };

      // Upsert by title and startDate
      const existing = await this.activityModel.findOne({
        title: item.title,
        startDate: item.startDate,
      });

      let activityDoc: ActivityDocument;
      if (existing) {
        await this.activityModel.findByIdAndUpdate(existing._id, payload);
        activityDoc = existing;
      } else {
        activityDoc = await this.activityModel.create(payload);
      }

      const year = item.startDate.getUTCFullYear();
      if (year === 2024) count2024++;
      else if (year === 2025) count2025++;
      else if (year === 2026) count2026++;

      // Seed attendance for COMPLETED activities
      if (item.status === ActivityStatus.COMPLETED) {
        const townMembers = membersByTown.get(townId.toString()) || allMembers;
        const attendees: any[] = [];

        // Sample 15-25 members present
        const sampleSize = Math.min(
          townMembers.length,
          15 + (item.startDate.getDate() % 12),
        );

        for (let i = 0; i < sampleSize; i++) {
          const m = townMembers[i];
          attendees.push({
            attendeeType: AttendeeType.MEMBER,
            memberId: m._id,
            checkInTime: new Date(item.startDate.getTime() + i * 2 * 60 * 1000),
            status: AttendanceStatus.PRESENT,
          });
        }

        // Add 2-4 guests
        const guestCount = 2 + (item.startDate.getDay() % 3);
        for (let g = 1; g <= guestCount; g++) {
          attendees.push({
            attendeeType: AttendeeType.GUEST,
            guestInfo: {
              fullName: `Invité ${g} (${item.title.split(' ')[0]})`,
              phoneNumber: `+2376990000${g}${item.startDate.getMonth()}`,
              notes: 'Invité par un membre JR',
            },
            checkInTime: new Date(item.startDate.getTime() + g * 5 * 60 * 1000),
            status: AttendanceStatus.PRESENT,
          });
        }

        await this.attendanceModel.findOneAndUpdate(
          { activityId: activityDoc._id },
          {
            activityId: activityDoc._id,
            items: attendees,
            takenBy: creatorId,
            takenAt: item.endDate,
          },
          { upsert: true, new: true },
        );
        attendanceCount++;
      }
    }

    this.logger.log(
      `📊 Seeded ${count2024} activities for 2024, ${count2025} for 2025, and ${count2026} for 2026.`,
    );
    this.logger.log(
      `📋 Seeded attendance sheets for ${attendanceCount} completed activities.`,
    );

    return {
      totalActivities: count2024 + count2025 + count2026,
      totalAttendances: attendanceCount,
    };
  }
}
