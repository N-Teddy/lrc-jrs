import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { type Model, Types } from 'mongoose';
import { Town, type TownDocument } from '../../schemas';
import { SEED_TOWNS } from '../data/towns.data';

@Injectable()
export class TownsSeeder {
  private readonly logger = new Logger(TownsSeeder.name);

  constructor(
    @InjectModel(Town.name) private readonly townModel: Model<TownDocument>,
  ) {}

  /**
   * Seeds default towns.
   * Returns a map of town code -> Town ObjectId.
   */
  async seed(
    options: { clean?: boolean } = {},
  ): Promise<Map<string, Types.ObjectId>> {
    if (options.clean) {
      this.logger.warn('Cleaning existing towns collection...');
      await this.townModel.deleteMany({});
    }

    const townMap = new Map<string, Types.ObjectId>();

    for (const item of SEED_TOWNS) {
      const existing = await this.townModel.findOne({ code: item.code });
      if (existing) {
        existing.name = item.name;
        await existing.save();
        townMap.set(item.code, existing._id as Types.ObjectId);
        this.logger.log(
          `Updated town: ${item.name} (${item.code}) [${existing._id}]`,
        );
      } else {
        const created = await this.townModel.create({
          name: item.name,
          code: item.code,
          activePcCount: 0,
        });
        townMap.set(item.code, created._id as Types.ObjectId);
        this.logger.log(
          `Created town: ${item.name} (${item.code}) [${created._id}]`,
        );
      }
    }

    return townMap;
  }
}
