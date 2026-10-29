import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  API_BASE_URL: z.string().url(),
  API_PREFIX: z.string().default('api'),
  REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().default(10000),
  HEALTH_PATH: z.string().default('/api/health'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables for api-endpoint-tester:');
  console.error(parsed.error.flatten().fieldErrors);
  throw new Error('Environment validation failed');
}

export const env = parsed.data;
