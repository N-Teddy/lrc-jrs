import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '@jrs/server/src/app.module';

describe('Concurrency & Race Conditions (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    const { ValidationPipe } = require('@nestjs/common');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('File Streaming & Drive Integration: GET nonexistent file should return 404, not 500', async () => {
    const request = require('supertest');
    const response = await request(app.getHttpServer())
      .get('/api/activities/report/drive-file/invalid123/stream');

    expect(response.status).toBe(404);
  });
});
