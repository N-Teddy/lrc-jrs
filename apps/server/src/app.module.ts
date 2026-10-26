import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { appConfig } from './config/app.config';
import { databaseConfig } from './config/database.config';
import { validateEnvironment } from './config/env.validation';
import { jwtConfig } from './config/jwt.config';
import { DatabaseModule } from './core/database/database.module';
import { AllExceptionsFilter } from './core/filters/all-exceptions.filter';
import { HttpExceptionFilter } from './core/filters/http-exception.filter';
import { JwtAuthGuard } from './core/guards/jwt-auth.guard';
import { RolesGuard } from './core/guards/roles.guard';
import { TownScopeGuard } from './core/guards/town-scope.guard';
import { LoggingInterceptor } from './core/interceptors/logging.interceptor';
import { TransformResponseInterceptor } from './core/interceptors/transform-response.interceptor';
import { ProductionInitService } from './database/seeds/production-init.service';
import { TownsSeeder } from './database/seeds/seeders/towns.seeder';
import { UsersSeeder } from './database/seeds/seeders/users.seeder';
import { ActivitiesModule } from './modules/activities/activities.module';
import { AuthModule } from './modules/auth/auth.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { RegistrationLinksModule } from './modules/registration-links/registration-links.module';
import { TownsModule } from './modules/towns/towns.module';
import { UsersModule } from './modules/users/users.module';
import { ServicesModule } from './services/services.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig],
      validate: validateEnvironment,
      envFilePath: ['.env', 'apps/server/.env'],
    }),
    DatabaseModule,
    ServicesModule,
    TownsModule,
    UsersModule,
    ActivitiesModule,
    AuthModule,
    RegistrationLinksModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    TownsSeeder,
    UsersSeeder,
    ProductionInitService,
    // Global Exception Filters
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    // Global Interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformResponseInterceptor,
    },
    // Global Guards
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: TownScopeGuard,
    },
  ],
})
export class AppModule {}
