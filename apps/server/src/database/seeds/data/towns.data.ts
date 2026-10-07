import { DEFAULT_TOWNS } from '@jrs/shared';

export interface SeedTownItem {
  name: string;
  code: string;
}

export const SEED_TOWNS: SeedTownItem[] = [...DEFAULT_TOWNS];
