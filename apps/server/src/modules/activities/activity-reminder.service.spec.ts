import { ActivityStatus, ActivityType, UserRole } from '@jrs/shared';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import { ActivityReminderService } from './activity-reminder.service';

describe('ActivityReminderService', () => {
  let service: ActivityReminderService;
  let mockActivityModel: any;
  let mockTemplateModel: any;
  let mockTownModel: any;
  let mockUserModel: any;
  let mockConfigService: any;
  let mockWhatsAppService: any;
  let mockNotificationsService: any;

  const townId = new Types.ObjectId();
  const pcId = new Types.ObjectId();

  beforeEach(() => {
    jest.clearAllMocks();

    mockActivityModel = {
      find: jest.fn(),
      updateOne: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
    };

    mockTemplateModel = {
      exists: jest.fn().mockResolvedValue(true),
      find: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue([]),
        }),
      }),
      findOne: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({
            activityType: ActivityType.MONTHLY_MEETING,
            items: [
              {
                id: '1',
                labelKey: 'opening',
                labelFr: 'Ouverture : Prière',
                labelEn: 'Opening: Prayer',
                isRequired: true,
              },
            ],
            customInstructionsFr: 'Ordre du jour 48h avant',
            customInstructionsEn: 'Agenda 48h before',
          }),
        }),
      }),
      create: jest.fn().mockResolvedValue({}),
      findOneAndUpdate: jest.fn(),
    };

    mockTownModel = {
      find: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([{ _id: townId, name: 'Douala' }]),
      }),
      findById: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({
          _id: townId,
          name: 'Douala',
        }),
      }),
    };

    mockUserModel = {
      find: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([
          {
            _id: pcId,
            fullName: 'Jean PC',
            phoneNumber: '+237670112233',
            preferredLanguage: 'fr',
            role: UserRole.PC,
            isActivePC: true,
            homeTownId: townId,
          },
        ]),
      }),
    };

    mockConfigService = {
      get: jest.fn().mockImplementation((key: string) => {
        if (key === 'APP_FRONTEND_URL') return 'https://lrc-jrs.org';
        return undefined;
      }),
    };

    mockWhatsAppService = {
      sendTextMessage: jest.fn().mockResolvedValue(true),
    };

    mockNotificationsService = {
      createNotification: jest.fn().mockResolvedValue({ deliveredCount: 1 }),
    };

    service = new ActivityReminderService(
      mockActivityModel,
      mockTemplateModel,
      mockTownModel,
      mockUserModel,
      mockConfigService as ConfigService,
      mockWhatsAppService,
      mockNotificationsService,
    );
  });

  it('should process 14-day milestone reminders and record deduplication token', async () => {
    const act14Id = new Types.ObjectId();
    const act14 = {
      _id: act14Id,
      title: 'Réunion Mensuelle de Novembre',
      activityType: ActivityType.MONTHLY_MEETING,
      startDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 7200000),
      hostTownId: townId,
      townId,
      remindersSent: [],
    };

    // First query: 14-day activities
    mockActivityModel.find
      .mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue([act14]),
      })
      // Second query: 7-day activities (empty)
      .mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue([]),
      })
      // Third query: post-activity report check (empty)
      .mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue([]),
      });

    const result = await service.processDailyMilestones();

    expect(result.reminders14d).toBe(1);
    expect(result.reminders7d).toBe(0);
    expect(result.reportWarnings).toBe(0);

    // Verify in-app notification sent
    expect(mockNotificationsService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'ACTIVITY_REMINDER_2_WEEKS',
        resource: expect.objectContaining({
          entityId: act14Id.toString(),
        }),
      }),
    );

    // Verify WhatsApp message rendered and dispatched
    expect(mockWhatsAppService.sendTextMessage).toHaveBeenCalledWith(
      '+237670112233',
      expect.stringContaining('RAPPEL ACTIVITÉ JRS (J-14)'),
    );

    // Verify atomic deduplication record
    expect(mockActivityModel.updateOne).toHaveBeenCalledWith(
      { _id: act14Id },
      { $addToSet: { remindersSent: '2_WEEKS' } },
    );
  });

  it('should process post-activity report upload warnings when report is missing', async () => {
    const endedActId = new Types.ObjectId();
    const endedAct = {
      _id: endedActId,
      title: 'Service Paroissial Passé',
      activityType: ActivityType.SERVICE,
      startDate: new Date(Date.now() - 48 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      hostTownId: townId,
      townId,
      remindersSent: ['2_WEEKS', '1_WEEK'],
      reports: [],
      report: undefined,
    };

    // 14-day: empty, 7-day: empty, past activities: [endedAct]
    mockActivityModel.find
      .mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue([]),
      })
      .mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue([]),
      })
      .mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue([endedAct]),
      });

    const result = await service.processDailyMilestones();

    expect(result.reportWarnings).toBe(1);

    // Verify in-app warning notification sent
    expect(mockNotificationsService.createNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        action: 'REPORT_UPLOAD_WARNING',
        resource: expect.objectContaining({
          entityType: 'REPORT',
          entityId: endedActId.toString(),
          subTab: 'report',
        }),
      }),
    );

    // Verify WhatsApp message rendered and dispatched with warning
    expect(mockWhatsAppService.sendTextMessage).toHaveBeenCalledWith(
      '+237670112233',
      expect.stringContaining("RAPPORT D'ACTIVITÉ EN ATTENTE"),
    );

    // Verify atomic deduplication record for report warning
    expect(mockActivityModel.updateOne).toHaveBeenCalledWith(
      { _id: endedActId },
      { $addToSet: { remindersSent: 'REPORT_UPLOAD_WARNING' } },
    );
  });

  it('should skip report warnings if an activity already has a report uploaded', async () => {
    const actWithReport = {
      _id: new Types.ObjectId(),
      title: 'Activité avec rapport',
      activityType: ActivityType.CAUSERIE,
      startDate: new Date(Date.now() - 48 * 60 * 60 * 1000),
      endDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
      hostTownId: townId,
      townId,
      remindersSent: [],
      report: { fileId: 'drive-file-123', filename: 'rapport.pdf' },
      reports: [{ fileId: 'drive-file-123', filename: 'rapport.pdf' }],
    };

    mockActivityModel.find
      .mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue([]),
      })
      .mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue([]),
      })
      .mockReturnValueOnce({
        exec: jest.fn().mockResolvedValue([actWithReport]),
      });

    const result = await service.processDailyMilestones();

    expect(result.reportWarnings).toBe(0);
    expect(mockNotificationsService.createNotification).not.toHaveBeenCalled();
    expect(mockWhatsAppService.sendTextMessage).not.toHaveBeenCalled();
  });
});
