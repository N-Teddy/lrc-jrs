import { Logger, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import type { Connection } from 'mongoose';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const logger = new Logger('MongooseConnection');
        const uri = configService.get<string>('database.uri') as string;

        return {
          uri,
          connectionFactory: (connection: Connection) => {
            connection.on('connected', () => {
              logger.log(
                `MongoDB connected successfully to ${connection.host}:${connection.port}/${connection.name}`,
              );
            });
            connection.on('error', (error) => {
              logger.error('MongoDB connection error:', error);
            });
            connection.on('disconnected', () => {
              logger.warn('MongoDB disconnected');
            });
            return connection;
          },
        };
      },
    }),
  ],
})
export class DatabaseModule {}
