import { Types } from 'mongoose';
import { NotificationsService } from './notifications.service';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let mockNotificationModel: any;
  let mockUserModel: any;
  let mockGateway: any;
  let mockPushService: any;

  const actorId = new Types.ObjectId().toString();
  const recipient1Id = new Types.ObjectId().toString();
  const recipient2Id = new Types.ObjectId().toString();

  beforeEach(() => {
    mockNotificationModel = {
      insertMany: jest.fn().mockImplementation((docs) =>
        Promise.resolve(
          docs.map((d: any, idx: number) => ({
            _id: `mock-id-${idx}`,
            ...d,
            createdAt: new Date(),
          })),
        ),
      ),
      countDocuments: jest.fn().mockResolvedValue(1),
      find: jest.fn().mockReturnValue({
        sort: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              lean: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValue([]),
              }),
            }),
          }),
        }),
      }),
      findOneAndUpdate: jest.fn().mockReturnValue({
        lean: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValue({ _id: 'notif-1', read: true }),
        }),
      }),
      updateMany: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
      }),
    };

    mockUserModel = {
      find: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([
          {
            _id: recipient1Id,
            homeTownId: 'bafoussam',
            account: {
              hasAppAccess: true,
              status: 'ACTIVE',
              isAccessRevoked: false,
            },
            pushTokens: [{ token: 'ExponentPushToken[abc]', platform: 'ios' }],
          },
        ]),
      }),
    };

    mockGateway = {
      sendToUser: jest.fn(),
      emitUnreadCount: jest.fn(),
    };

    mockPushService = {
      sendPushNotifications: jest.fn().mockResolvedValue([]),
    };

    service = new NotificationsService(
      mockNotificationModel,
      mockUserModel,
      mockGateway,
      mockPushService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should filter out actor and deliver to active recipients', async () => {
    await service.createNotification(
      {
        target: {
          userIds: [actorId, recipient1Id, recipient2Id],
        },
        level: 'INFO',
        titleKey: 'notifications:testTitle',
        bodyKey: 'notifications:testBody',
        sendPush: true,
      },
      actorId, // Actor performing the action
    );

    // Only recipient1Id should receive persistent notification (actor excluded, inactive filtered)
    expect(mockNotificationModel.insertMany).toHaveBeenCalledTimes(1);
    const insertedDocs = mockNotificationModel.insertMany.mock.calls[0][0];
    expect(insertedDocs.length).toBe(1);
    expect(insertedDocs[0].recipientId).toBe(recipient1Id);

    // WebSocket sent only to recipient1Id
    expect(mockGateway.sendToUser).toHaveBeenCalledTimes(1);
    expect(mockGateway.sendToUser).toHaveBeenCalledWith(
      recipient1Id,
      expect.objectContaining({
        titleKey: 'notifications:testTitle',
      }),
    );

    // Push notification sent only for recipient1Id token
    expect(mockPushService.sendPushNotifications).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          to: 'ExponentPushToken[abc]',
        }),
      ]),
    );
  });
});
