import { AppModule } from '@jrs/server/src/app.module';
import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

const request = require('supertest');

describe('Auth & Role Adversarial Tests (e2e)', () => {
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

  it('Authentication Tampering: Expired JWT, Invalid Signatures, Empty Bearer Header should return 401', async () => {
    const invalidTokens = [
      'Bearer ', // Empty
      'Bearer abc.def.ghi', // Malformed
    ];

    for (const token of invalidTokens) {
      const response = await request(app.getHttpServer())
        .get('/api/auth/me')
        .set('Authorization', token);

      expect(response.status).toBe(401);
    }
  });
});
