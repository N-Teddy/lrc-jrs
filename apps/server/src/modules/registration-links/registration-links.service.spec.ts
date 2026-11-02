import { ErrorCode, UserRole } from '@jrs/shared';
import { Types } from 'mongoose';
import { ForbiddenAppException } from '../../core/exceptions/app.exception';
import { IntakeStatus } from '../../database/schemas/user.schema';
import { IntakeReviewAction } from './dto/review-member.dto';
import { RegistrationLinksService } from './registration-links.service';

describe('RegistrationLinksService - reviewMember', () => {
  let service: RegistrationLinksService;
  let mockLinkModel: any;
  let mockUserModel: any;
  let mockTownModel: any;
  let mockMediaService: any;
  let mockNotificationsService: any;
  let mockWhatsAppService: any;

  const townObjectId = new Types.ObjectId();
  const townIdStr = townObjectId.toString();
  const memberId = new Types.ObjectId().toString();

  beforeEach(() => {
    mockLinkModel = {};
    mockUserModel = {
      findById: jest.fn(),
      findOne: jest
        .fn()
        .mockReturnValue({ exec: jest.fn().mockResolvedValue(null) }),
    };
    mockTownModel = {
      findOne: jest.fn(),
      findById: jest.fn(),
    };
    mockMediaService = {};
    mockNotificationsService = {
      createNotification: jest.fn().mockResolvedValue({}),
    };
    mockWhatsAppService = {
      sendTextMessage: jest.fn().mockResolvedValue({}),
    };

    service = new RegistrationLinksService(
      mockLinkModel,
      mockUserModel,
      mockTownModel,
      mockMediaService,
      mockNotificationsService,
      mockWhatsAppService,
    );
  });

  it('allows a PC to approve a member in their own town when homeTownId is a Types.ObjectId', async () => {
    const mockMember = {
      _id: new Types.ObjectId(memberId),
      id: memberId,
      fullName: 'John Doe',
      intakeStatus: IntakeStatus.PENDING_REVIEW,
      homeTownId: {
        _id: townObjectId,
        name: 'Douala',
        code: 'DLA',
      },
      account: { hasAppAccess: false },
      save: jest.fn().mockResolvedValue(true),
      populate: jest.fn().mockResolvedValue(true),
    };

    mockUserModel.findById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockMember),
      }),
    });

    const pcUser: any = {
      id: 'pc-1',
      role: UserRole.PC,
      homeTownId: townObjectId, // Types.ObjectId as provided by Mongoose in runtime
    };

    const result = await service.reviewMember(
      memberId,
      { action: IntakeReviewAction.APPROVE, grantAppAccess: false },
      pcUser,
    );

    expect(result.success).toBe(true);
    expect(mockMember.intakeStatus).toBe(IntakeStatus.APPROVED);
    expect(mockMember.save).toHaveBeenCalled();
  });

  it('forbids a PC from approving a member belonging to a different town', async () => {
    const differentTownId = new Types.ObjectId();
    const mockMember = {
      _id: new Types.ObjectId(memberId),
      id: memberId,
      fullName: 'Jane Doe',
      intakeStatus: IntakeStatus.PENDING_REVIEW,
      homeTownId: {
        _id: differentTownId,
        name: 'Yaoundé',
        code: 'YDE',
      },
      account: { hasAppAccess: false },
      save: jest.fn().mockResolvedValue(true),
      populate: jest.fn().mockResolvedValue(true),
    };

    mockUserModel.findById.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        exec: jest.fn().mockResolvedValue(mockMember),
      }),
    });

    const pcUser: any = {
      id: 'pc-1',
      role: UserRole.PC,
      homeTownId: townObjectId,
    };

    await expect(
      service.reviewMember(
        memberId,
        { action: IntakeReviewAction.APPROVE, grantAppAccess: false },
        pcUser,
      ),
    ).rejects.toThrow(ForbiddenAppException);
  });
});
