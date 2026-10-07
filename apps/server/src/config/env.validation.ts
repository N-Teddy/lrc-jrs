import { plainToInstance, Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  validateSync,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  @IsOptional()
  NODE_ENV: Environment = Environment.Development;

  @Type(() => Number)
  @IsNumber()
  @IsOptional()
  PORT = 3000;

  @IsString()
  @IsNotEmpty({
    message:
      'FATAL: MONGODB_URI environment variable is required and must not be empty.',
  })
  MONGODB_URI: string;

  @IsString()
  @IsNotEmpty({
    message:
      'FATAL: JWT_SECRET environment variable is required and must not be empty.',
  })
  JWT_SECRET: string;

  @IsString()
  @IsOptional()
  JWT_EXPIRATION?: string;

  @IsString()
  @IsOptional()
  API_PREFIX?: string;

  @IsString()
  @IsOptional()
  SMTP_HOST?: string;

  @IsString()
  @IsOptional()
  SMTP_PORT?: string;

  @IsString()
  @IsOptional()
  SMTP_USER?: string;

  @IsString()
  @IsOptional()
  SMTP_PASS?: string;

  @IsString()
  @IsOptional()
  SMTP_FROM?: string;

  @IsString()
  @IsNotEmpty({
    message:
      'FATAL: WHATSAPP_API_BASE_URL environment variable is required and must not be empty.',
  })
  WHATSAPP_API_BASE_URL: string;

  @IsString()
  @IsNotEmpty({
    message:
      'FATAL: WHATSAPP_API_KEY environment variable is required and must not be empty.',
  })
  WHATSAPP_API_KEY: string;

  @IsString()
  @IsOptional()
  GOOGLE_DRIVE_CLIENT_EMAIL?: string;

  @IsString()
  @IsOptional()
  GOOGLE_DRIVE_PRIVATE_KEY?: string;

  @IsString()
  @IsOptional()
  GOOGLE_DRIVE_ROOT_FOLDER_ID?: string;
}

export function validateEnvironment(config: Record<string, unknown>) {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors
      .flatMap((error) => Object.values(error.constraints || {}))
      .join('\n - ');

    throw new Error(
      `\n❌ [ENVIRONMENT CONFIGURATION ERROR]\nThe application cannot start because the following required environment variable(s) are missing or invalid:\n - ${errorMessages}\n`,
    );
  }

  return validatedConfig;
}
