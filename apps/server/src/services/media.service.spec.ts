import * as fs from 'node:fs';
import { MediaService } from './media.service';

describe('MediaService', () => {
  let service: MediaService;

  beforeEach(async () => {
    const mockConfigService = {
      get: (key: string, defaultValue?: any) => {
        if (key === 'NODE_ENV') return 'development';
        if (key === 'MEDIA_STORAGE_DRIVER') return 'local';
        if (key === 'PORT') return 3000;
        if (key === 'APP_URL') return 'http://localhost:3000';
        if (key === 'UPLOAD_DIR') return './uploads';
        return defaultValue;
      },
    };

    service = new MediaService(mockConfigService as any);
    await service.onModuleInit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate an SVG avatar and return accessible URL', async () => {
    const url = await service.generateAndSaveDefaultAvatar(
      'Emmanuel Petit',
      'test-phone',
    );
    expect(url).toContain('http://localhost:3000/uploads/avatars/');
    expect(url.endsWith('.svg')).toBe(true);

    // Extract filename and check that file was written to disk
    const filename = url.split('/').pop() || '';
    const localFilePath = `./uploads/avatars/${filename}`;
    expect(fs.existsSync(localFilePath)).toBe(true);

    const content = fs.readFileSync(localFilePath, 'utf-8');
    expect(content).toContain('<svg');

    // Clean up test file
    fs.unlinkSync(localFilePath);
  });

  it('should upload an in-memory buffer as an avatar', async () => {
    const mockFile: Express.Multer.File = {
      fieldname: 'avatar',
      originalname: 'test-profile.png',
      encoding: '7bit',
      mimetype: 'image/png',
      size: 4,
      buffer: Buffer.from([137, 80, 78, 71]), // PNG magic header
      stream: null as any,
      destination: '',
      filename: '',
      path: '',
    };

    const url = await service.uploadAvatar(mockFile);
    expect(url).toContain('http://localhost:3000/uploads/avatars/');
    expect(url.endsWith('.png')).toBe(true);

    const filename = url.split('/').pop() || '';
    const localFilePath = `./uploads/avatars/${filename}`;
    expect(fs.existsSync(localFilePath)).toBe(true);

    // Clean up
    fs.unlinkSync(localFilePath);
  });
});
