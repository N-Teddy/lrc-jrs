import { SetMetadata } from '@nestjs/common';

export const TOWN_SCOPE_KEY = 'townScopeParam';
export const TownScope = (paramKey = 'townId') =>
  SetMetadata(TOWN_SCOPE_KEY, paramKey);
