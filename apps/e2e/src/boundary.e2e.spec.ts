import { AppModule } from '@jrs/server/src/app.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

describe('Boundary & Malformed Inputs (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    const { ValidationPipe } = require('@nestjs/common');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('Boundary Inputs: Malformed phone numbers should be rejected with 400', async () => {
    const request = require('supertest');

    // We attempt to trigger validation errors directly via public/semi-public DTO endpoints
    const payloads = [
      { phoneNumber: '123' }, // Too short
      { phoneNumber: 'invalid_chars' },
    ];

    for (const p of payloads) {
      // Trying password reset endpoint which takes phone number
      const response = await request(app.getHttpServer())
        .post('/api/auth/forgot-password')
        .send(p);

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Bad Request');
    }
  });
});
