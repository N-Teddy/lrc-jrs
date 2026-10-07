import { registerAs } from '@nestjs/config';

export const databaseConfig = registerAs('database', () => {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error(
      'FATAL: MONGODB_URI environment variable is missing or empty. Application cannot start.',
    );
  }
  return { uri };
});
