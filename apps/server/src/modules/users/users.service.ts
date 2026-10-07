import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { type Model, Types } from 'mongoose';
import { PhoneSanitizer } from '../../core/utils/phone-sanitizer.util';
import { User, type UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async findById(id: string | Types.ObjectId): Promise<UserDocument | null> {
    return this.userModel.findById(id).exec();
  }

  async findByPhone(phone: string): Promise<UserDocument | null> {
    const sanitized = PhoneSanitizer.toInternationalDigits(phone);
    return this.userModel.findOne({ phoneNumber: sanitized }).exec();
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email: email.trim().toLowerCase() }).exec();
  }

  async findByIdentifier(identifier: string): Promise<UserDocument | null> {
    if (!identifier) return null;
    const trimmed = identifier.trim();

    if (trimmed.includes('@')) {
      return this.findByEmail(trimmed);
    }

    return this.findByPhone(trimmed);
  }

  async create(data: Partial<User>): Promise<UserDocument> {
    const created = new this.userModel(data);
    return created.save();
  }

  async update(
    id: string | Types.ObjectId,
    data: Partial<User>,
  ): Promise<UserDocument | null> {
    return this.userModel.findByIdAndUpdate(id, data, { new: true }).exec();
  }

  async countActivePcsForTown(
    townId: string | Types.ObjectId,
  ): Promise<number> {
    const objectId =
      typeof townId === 'string' ? new Types.ObjectId(townId) : townId;
    return this.userModel.countDocuments({
      homeTownId: objectId,
      isActivePC: true,
      'account.isAccessRevoked': { $ne: true },
    });
  }
}
