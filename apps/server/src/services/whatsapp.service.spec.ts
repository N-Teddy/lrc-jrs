import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { WhatsAppService } from './whatsapp.service';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('WhatsAppService - Production Guard', () => {
  let service: WhatsAppService;
  let mockConfigService: Partial<ConfigService>;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should suppress and log WhatsApp messages in development mode (NODE_ENV !== production)', async () => {
    mockConfigService = {
      getOrThrow: jest.fn().mockImplementation((key: string) => {
        if (key === 'WHATSAPP_API_BASE_URL')
          return 'https://dash.jifihub.com/api';
        if (key === 'WHATSAPP_API_KEY') return 'Bearer mock_key';
        return '';
      }),
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'development';
        return undefined;
      }),
    };

    service = new WhatsAppService(mockConfigService as ConfigService);

    const result = await service.sendTextMessage(
      '+237670000000',
      'Test message in dev',
    );

    expect(result).toBe(true);
    expect(mockedAxios.post).not.toHaveBeenCalled();
  });

  it('should dispatch WhatsApp messages via axios when in production mode (NODE_ENV === production)', async () => {
    mockConfigService = {
      getOrThrow: jest.fn().mockImplementation((key: string) => {
        if (key === 'WHATSAPP_API_BASE_URL')
          return 'https://dash.jifihub.com/api';
        if (key === 'WHATSAPP_API_KEY') return 'Bearer mock_key';
        return '';
      }),
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'NODE_ENV') return 'production';
        return undefined;
      }),
    };

    mockedAxios.post.mockResolvedValueOnce({
      data: { success: true, messageId: 'msg-123' },
    });

    service = new WhatsAppService(mockConfigService as ConfigService);

    const result = await service.sendTextMessage(
      '+237670000000',
      'Test message in prod',
    );

    expect(result).toBe(true);
    expect(mockedAxios.post).toHaveBeenCalledTimes(1);
    expect(mockedAxios.post).toHaveBeenCalledWith(
      'https://dash.jifihub.com/api/messages/text',
      expect.objectContaining({
        to: '237670000000',
        text: 'Test message in prod',
      }),
      expect.any(Object),
    );
  });
});
