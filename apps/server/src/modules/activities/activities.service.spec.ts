import { ActivityStatus, ActivityType } from '@jrs/shared';
import { Types } from 'mongoose';
import { ActivitiesService } from './activities.service';

describe('ActivitiesService - Status Filtering', () => {
  let service: ActivitiesService;
  let mockActivityModel: any;
  let mockAttendanceModel: any;
  let mockTownModel: any;
  let mockUserModel: any;
  let mockDriveService: any;
  let mockNotificationsService: any;

  beforeEach(() => {
    jest.clearAllMocks();

    mockActivityModel = {
      find: jest.fn(),
      countDocuments: jest.fn(),
      findOne: jest.fn(),
    };

    mockAttendanceModel = {
      find: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue([]),
      }),
    };

    mockTownModel = {
      findOne: jest.fn(),
    };

    mockUserModel = {};
    mockDriveService = {};
    mockNotificationsService = {
      createNotification: jest.fn().mockResolvedValue({}),
    };

    service = new ActivitiesService(
      mockActivityModel,
      mockAttendanceModel,
      mockTownModel,
      mockUserModel,
      mockDriveService,
      mockNotificationsService,
    );
  });

  const setupFindMock = (docs: any[]) => {
    mockActivityModel.countDocuments.mockReturnValue({
      exec: jest.fn().mockResolvedValue(docs.length),
    });
    mockActivityModel.find.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        skip: jest.fn().mockReturnValue({
          limit: jest.fn().mockReturnValue({
            populate: jest.fn().mockReturnValue({
              populate: jest.fn().mockReturnValue({
                populate: jest.fn().mockReturnValue({
                  exec: jest.fn().mockResolvedValue(docs),
                }),
              }),
            }),
          }),
        }),
      }),
    });
  };

  it('filters SCHEDULED activities by non-cancelled status and future startDate', async () => {
    const futureStart = new Date(Date.now() + 86400000);
    const futureEnd = new Date(Date.now() + 90000000);

    const scheduledDoc = {
      _id: new Types.ObjectId(),
      title: 'Upcoming Service',
      activityType: ActivityType.SERVICE,
      startDate: futureStart,
      endDate: futureEnd,
      status: ActivityStatus.SCHEDULED,
      isDeleted: false,
    };

    setupFindMock([scheduledDoc]);

    const result = await service.findAll({ status: ActivityStatus.SCHEDULED });

    expect(mockActivityModel.find).toHaveBeenCalled();
    const filterArg = mockActivityModel.find.mock.calls[0][0];

    // Check that $and conditions contains { status: { $ne: CANCELLED }, startDate: { $gt: now } }
    const andConditions = filterArg.$and || [filterArg];
    const statusCondition = andConditions.find(
      (c: any) => c.status && c.status.$ne === ActivityStatus.CANCELLED,
    );
    expect(statusCondition).toBeDefined();
    expect(statusCondition.startDate.$gt).toBeInstanceOf(Date);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].status).toBe(ActivityStatus.SCHEDULED);
  });

  it('filters COMPLETED activities by non-cancelled status and past endDate', async () => {
    const pastStart = new Date(Date.now() - 90000000);
    const pastEnd = new Date(Date.now() - 86400000);

    const completedDoc = {
      _id: new Types.ObjectId(),
      title: 'Past Meeting',
      activityType: ActivityType.MONTHLY_MEETING,
      startDate: pastStart,
      endDate: pastEnd,
      status: ActivityStatus.SCHEDULED, // In DB it was scheduled, but time passed
      isDeleted: false,
    };

    setupFindMock([completedDoc]);

    const result = await service.findAll({ status: ActivityStatus.COMPLETED });

    expect(mockActivityModel.find).toHaveBeenCalled();
    const filterArg = mockActivityModel.find.mock.calls[0][0];

    const andConditions = filterArg.$and || [filterArg];
    const statusCondition = andConditions.find(
      (c: any) => c.status && c.status.$ne === ActivityStatus.CANCELLED,
    );
    expect(statusCondition).toBeDefined();
    expect(statusCondition.endDate.$lt).toBeInstanceOf(Date);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].status).toBe(ActivityStatus.COMPLETED);
  });

  it('filters IN_PROGRESS activities by current time range', async () => {
    const activeStart = new Date(Date.now() - 3600000);
    const activeEnd = new Date(Date.now() + 3600000);

    const liveDoc = {
      _id: new Types.ObjectId(),
      title: 'Live Conference',
      activityType: ActivityType.CONFERENCE,
      startDate: activeStart,
      endDate: activeEnd,
      status: ActivityStatus.SCHEDULED,
      isDeleted: false,
    };

    setupFindMock([liveDoc]);

    const result = await service.findAll({
      status: ActivityStatus.IN_PROGRESS,
    });

    const filterArg = mockActivityModel.find.mock.calls[0][0];
    const andConditions = filterArg.$and || [filterArg];
    const statusCondition = andConditions.find(
      (c: any) => c.status && c.status.$ne === ActivityStatus.CANCELLED,
    );
    expect(statusCondition).toBeDefined();
    expect(statusCondition.startDate.$lte).toBeInstanceOf(Date);
    expect(statusCondition.endDate.$gte).toBeInstanceOf(Date);

    expect(result.items).toHaveLength(1);
    expect(result.items[0].status).toBe(ActivityStatus.IN_PROGRESS);
  });

  it('filters CANCELLED activities strictly by CANCELLED status', async () => {
    const cancelledDoc = {
      _id: new Types.ObjectId(),
      title: 'Cancelled Gathering',
      activityType: ActivityType.SERVICE,
      startDate: new Date(Date.now() + 86400000),
      endDate: new Date(Date.now() + 90000000),
      status: ActivityStatus.CANCELLED,
      isDeleted: false,
    };

    setupFindMock([cancelledDoc]);

    const result = await service.findAll({ status: ActivityStatus.CANCELLED });

    const filterArg = mockActivityModel.find.mock.calls[0][0];
    const andConditions = filterArg.$and || [filterArg];
    const statusCondition = andConditions.find(
      (c: any) => c.status === ActivityStatus.CANCELLED,
    );
    expect(statusCondition).toBeDefined();

    expect(result.items).toHaveLength(1);
    expect(result.items[0].status).toBe(ActivityStatus.CANCELLED);
  });

  it('computes findStats accurately using effectiveStatus', async () => {
    const pastDoc = {
      _id: new Types.ObjectId(),
      activityType: ActivityType.MONTHLY_MEETING,
      startDate: new Date(Date.now() - 90000000),
      endDate: new Date(Date.now() - 86400000),
      status: ActivityStatus.SCHEDULED, // Stored as SCHEDULED in DB, but actually completed
      isDeleted: false,
    };

    const futureDoc = {
      _id: new Types.ObjectId(),
      activityType: ActivityType.SERVICE,
      startDate: new Date(Date.now() + 86400000),
      endDate: new Date(Date.now() + 90000000),
      status: ActivityStatus.SCHEDULED,
      isDeleted: false,
    };

    mockActivityModel.find.mockReturnValue({
      exec: jest.fn().mockResolvedValue([pastDoc, futureDoc]),
    });

    const stats = await service.findStats();

    expect(stats.totalActivities).toBe(2);
    expect(stats.completedCount).toBe(1);
    expect(stats.upcomingCount).toBe(1);
  });
});
