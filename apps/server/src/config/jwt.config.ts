import { registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('jwt', () => ({
  secret:
    process.env.JWT_SECRET || 'jrs_fallback_secret_key_not_for_production',
  expiresIn: process.env.JWT_EXPIRATION || '7d',
}));
