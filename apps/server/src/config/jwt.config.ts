import { registerAs } from '@nestjs/config';

export const jwtConfig = registerAs('jwt', () => {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error(
      'FATAL: JWT_SECRET environment variable is missing or empty. Application cannot start.',
    );
  }
  return {
    secret,
    expiresIn: process.env.JWT_EXPIRATION || '15m',
  };
});
