// Setup file for vitest e2e tests
process.env.MONGODB_URI = 'mongodb://localhost:27017/jrs-e2e-test';
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'e2e-test-secret';
process.env.WHATSAPP_API_BASE_URL = 'https://mock.whatsapp.api/v1';
process.env.WHATSAPP_API_KEY = 'mock-whatsapp-key';
// Important mock for tests to stop nestjs mongoose from trying to connect to a real DB taking 30s
