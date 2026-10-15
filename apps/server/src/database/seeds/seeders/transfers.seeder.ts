import { UserRole } from '@jrs/shared';
import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { type Model, Types } from 'mongoose';
import { PhoneSanitizer } from '../../../core/utils/phone-sanitizer.util';
import {
  Town,
  type TownDocument,
  type TownTransferRecord,
  User,
  type UserDocument,
} from '../../schemas';
import {
  SAMPLE_TRANSFER_INITIATORS,
  SAMPLE_TRANSFER_REASONS,
  SEED_NAMED_MEMBER_TRANSFERS,
  SEED_UNNAMED_MEMBER_TRANSFERS,
  type SeedMemberTransferPlan,
} from '../data/transfers.data';

export interface TransferredMemberSummary {
  fullName: string;
  phoneNumber: string;
  role: string;
  originTownCode: string;
  currentTownCode: string;
  totalTransfers: number;
  lastReason: string;
  transferredBy: string;
}

export interface TransfersSeedResult {
  transferredMembersCount: number;
  totalTransfersCount: number;
  summaries: TransferredMemberSummary[];
}

@Injectable()
export class TransfersSeeder {
  private readonly logger = new Logger(TransfersSeeder.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(Town.name) private readonly townModel: Model<TownDocument>,
  ) {}

  /**
   * Seeds realistic town transfers strictly for non-AP and non-PC members.
   * Ensures that neither APs nor PCs have their hub transferred.
   */
  async seed(
    townMap?: Map<string, Types.ObjectId>,
    options: {
      clean?: boolean;
      targetCount?: number;
    } = {},
  ): Promise<TransfersSeedResult> {
    const targetCount = options.targetCount ?? 13;

    // 1. Resolve towns and code <-> ID mappings
    const resolvedTownMap = townMap || (await this.buildTownMap());
    const idToCodeMap = new Map<string, string>();
    for (const [code, id] of resolvedTownMap.entries()) {
      idToCodeMap.set(id.toString(), code);
    }

    if (options.clean) {
      this.logger.warn(
        'Cleaning / resetting transfer histories for non-AP & non-PC members...',
      );
      await this.resetTransfers(idToCodeMap, resolvedTownMap);
    }

    const summaries: TransferredMemberSummary[] = [];
    const processedUserIds = new Set<string>();

    const allPlans: SeedMemberTransferPlan[] = [
      ...SEED_NAMED_MEMBER_TRANSFERS,
      ...SEED_UNNAMED_MEMBER_TRANSFERS,
    ];

    // 2. Process predefined seed transfer plans
    for (const plan of allPlans) {
      const queryOr: Array<Record<string, any>> = [];
      if (plan.identifier.phoneNumber) {
        const sanitized = PhoneSanitizer.toInternationalDigits(
          plan.identifier.phoneNumber,
        );
        queryOr.push({ phoneNumber: sanitized });
        queryOr.push({ phoneNumber: plan.identifier.phoneNumber });
      }
      if (plan.identifier.email) {
        queryOr.push({ email: plan.identifier.email.toLowerCase().trim() });
      }

      if (!queryOr.length) continue;

      const user = await this.userModel.findOne({ $or: queryOr }).exec();
      if (!user) {
        this.logger.debug(
          `Member for plan "${plan.memberName || plan.identifier.phoneNumber}" not found. Skipping.`,
        );
        continue;
      }

      // CRITICAL: Strictly guard non-AP and non-PC members only
      if (
        user.role === UserRole.AP ||
        user.role === UserRole.PC ||
        user.isActivePC
      ) {
        this.logger.warn(
          `Skipping user ${user.fullName} (${user.phoneNumber}): Role is ${user.role} or isActivePC is true.`,
        );
        continue;
      }

      const transferRecords: TownTransferRecord[] = [];
      let finalDestTownId: Types.ObjectId | null = null;
      let originTownCode = plan.initialTownCode || '—';

      for (const step of plan.transfers) {
        const fromId = resolvedTownMap.get(step.fromTownCode);
        const toId = resolvedTownMap.get(step.toTownCode);

        if (!fromId || !toId) {
          this.logger.warn(
            `Unknown town code '${step.fromTownCode}' or '${step.toTownCode}'. Skipping transfer step.`,
          );
          continue;
        }

        transferRecords.push({
          fromTownId: fromId.toString(),
          toTownId: toId.toString(),
          transferredAt: step.transferredAt,
          transferredBy: step.transferredBy,
          reason: step.reason,
        });

        finalDestTownId = toId;
      }

      if (!transferRecords.length || !finalDestTownId) continue;

      user.transferHistory = transferRecords;
      user.homeTownId = finalDestTownId;
      await user.save();

      processedUserIds.add(user._id.toString());

      const lastTransfer = transferRecords[transferRecords.length - 1];
      const firstTransfer = transferRecords[0];
      originTownCode =
        idToCodeMap.get(firstTransfer.fromTownId) ||
        plan.initialTownCode ||
        '—';
      const destTownCode = idToCodeMap.get(lastTransfer.toTownId) || '—';

      summaries.push({
        fullName: user.fullName,
        phoneNumber: user.phoneNumber,
        role: user.role,
        originTownCode,
        currentTownCode: destTownCode,
        totalTransfers: transferRecords.length,
        lastReason: lastTransfer.reason || 'Regional fellowship relocation',
        transferredBy: lastTransfer.transferredBy,
      });

      this.logger.log(
        `📍 Seeded ${transferRecords.length} transfer(s) for ${user.fullName}: [${originTownCode} ➔ ${destTownCode}]`,
      );
    }

    // 3. Fallback / dynamic transfer initiation if target count not reached
    if (summaries.length < targetCount) {
      const remainingCount = targetCount - summaries.length;
      this.logger.log(
        `Initiating dynamic transfers for ${remainingCount} additional non-AP/non-PC members...`,
      );

      const candidateMembers = await this.userModel
        .find({
          _id: {
            $nin: Array.from(processedUserIds).map(
              (id) => new Types.ObjectId(id),
            ),
          },
          role: UserRole.MEMBER,
          isActivePC: { $ne: true },
        })
        .limit(remainingCount)
        .exec();

      const townCodes = Array.from(resolvedTownMap.keys());

      for (let i = 0; i < candidateMembers.length; i++) {
        const member = candidateMembers[i];
        const currentTownId = member.homeTownId?.toString();
        const currentCode =
          idToCodeMap.get(currentTownId || '') || townCodes[0];

        // Pick a different destination town
        const otherCodes = townCodes.filter((c) => c !== currentCode);
        const destCode = otherCodes[i % otherCodes.length];
        const destId = resolvedTownMap.get(destCode);

        if (!destId) continue;

        const reason =
          SAMPLE_TRANSFER_REASONS[i % SAMPLE_TRANSFER_REASONS.length];
        const initiator =
          SAMPLE_TRANSFER_INITIATORS[i % SAMPLE_TRANSFER_INITIATORS.length];

        // Past timestamp (staggered across late 2025 - early 2026)
        const daysAgo = 15 + ((i * 17) % 180);
        const transferredAt = new Date(
          Date.now() - daysAgo * 24 * 60 * 60 * 1000,
        ).toISOString();

        const transferRecord: TownTransferRecord = {
          fromTownId:
            currentTownId || resolvedTownMap.get(currentCode)?.toString() || '',
          toTownId: destId.toString(),
          transferredAt,
          transferredBy: initiator,
          reason,
        };

        member.transferHistory = [transferRecord];
        member.homeTownId = destId;
        await member.save();

        processedUserIds.add(member._id.toString());

        summaries.push({
          fullName: member.fullName,
          phoneNumber: member.phoneNumber,
          role: member.role,
          originTownCode: currentCode,
          currentTownCode: destCode,
          totalTransfers: 1,
          lastReason: reason,
          transferredBy: initiator,
        });

        this.logger.log(
          `📍 Dynamically initiated transfer for ${member.fullName}: [${currentCode} ➔ ${destCode}]`,
        );
      }
    }

    const totalTransfersCount = summaries.reduce(
      (sum, s) => sum + s.totalTransfers,
      0,
    );

    return {
      transferredMembersCount: summaries.length,
      totalTransfersCount,
      summaries,
    };
  }

  /**
   * Cleans / restores transfer histories and initial hubs.
   */
  private async resetTransfers(
    _idToCodeMap: Map<string, string>,
    _townMap: Map<string, Types.ObjectId>,
  ): Promise<void> {
    const transferredUsers = await this.userModel
      .find({
        role: UserRole.MEMBER,
        isActivePC: false,
        'transferHistory.0': { $exists: true },
      })
      .exec();

    for (const u of transferredUsers) {
      if (u.transferHistory && u.transferHistory.length > 0) {
        // Revert homeTownId to the very first origin hub
        const originTownIdStr = u.transferHistory[0].fromTownId;
        if (Types.ObjectId.isValid(originTownIdStr)) {
          u.homeTownId = new Types.ObjectId(originTownIdStr);
        }
      }
      u.transferHistory = [];
      await u.save();
    }
  }

  /**
   * Helper to fetch all towns and build town code -> ObjectId map.
   */
  async buildTownMap(): Promise<Map<string, Types.ObjectId>> {
    const towns = await this.townModel.find().exec();
    const map = new Map<string, Types.ObjectId>();
    for (const town of towns) {
      map.set(town.code, town._id as Types.ObjectId);
    }
    return map;
  }
}
