import { type IUser } from '@jrs/shared';
import { Types } from 'mongoose';
import type { UserDocument } from '../../database/schemas';

export class UserMapperUtil {
  static mapUser(doc: UserDocument): IUser {
    const rawTown = doc.homeTownId as unknown;
    const hasPopulatedTown =
      rawTown &&
      typeof rawTown === 'object' &&
      'name' in (rawTown as Record<string, unknown>);

    const townObj = hasPopulatedTown
      ? (rawTown as { _id: Types.ObjectId; name: string; code: string })
      : undefined;

    return {
      id: doc._id.toString(),
      fullName: doc.fullName,
      phoneNumber: doc.phoneNumber,
      email: doc.email,
      avatarUrl: doc.avatarUrl,
      gender: doc.gender,
      integrationDate: doc.integrationDate,
      isWhatsappVerified: doc.isWhatsappVerified,
      dateOfBirth: doc.dateOfBirth,
      isJr: doc.isJr,
      homeTownId: townObj
        ? townObj._id.toString()
        : doc.homeTownId?.toString() || '',
      homeTown: townObj
        ? {
            id: townObj._id.toString(),
            name: townObj.name,
            code: townObj.code,
            activePcCount: 0,
          }
        : undefined,
      role: doc.role,
      isActivePC: doc.isActivePC || false,
      account: {
        hasAppAccess: doc.account?.hasAppAccess ?? true,
        isAccessRevoked: doc.account?.isAccessRevoked ?? false,
        allowedReadTownIds: doc.account?.allowedReadTownIds || [],
        invitedBy: doc.account?.invitedBy,
        invitedAt: doc.account?.invitedAt
          ? doc.account.invitedAt.toISOString()
          : undefined,
      },
      transferHistory: (doc.transferHistory || []).map((t: any) => ({
        fromTownId: t.fromTownId,
        toTownId: t.toTownId,
        transferredAt: t.transferredAt,
        transferredBy: t.transferredBy,
        reason: t.reason,
      })),
      intakeStatus: (doc as any).intakeStatus,
      registrationLinkId: (doc as any).registrationLinkId?.toString(),
      intakeNote: (doc as any).intakeNote,
      createdAt: (doc as any).createdAt?.toISOString(),
      updatedAt: (doc as any).updatedAt?.toISOString(),
    };
  }
}
