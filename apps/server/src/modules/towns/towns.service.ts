import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { type Model } from 'mongoose';
import { Town, type TownDocument } from '../../database/schemas';

@Injectable()
export class TownsService {
  constructor(
    @InjectModel(Town.name) private readonly townModel: Model<TownDocument>,
  ) {}

  async findAll() {
    const towns = await this.townModel.find().sort({ name: 1 }).exec();
    return towns.map((t) => ({
      id: t._id.toString(),
      name: t.name,
      code: t.code,
      activePcCount: t.activePcCount || 0,
      createdAt: t.createdAt,
      updatedAt: t.updatedAt,
    }));
  }

  async findById(id: string) {
    return this.townModel.findById(id).exec();
  }
}
