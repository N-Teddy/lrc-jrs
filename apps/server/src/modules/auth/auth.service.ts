import * as crypto from 'node:crypto';
import { ErrorCode } from '@jrs/shared';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import type { Model, Types } from 'mongoose';
import {
  BadRequestAppException,
  ForbiddenAppException,
  UnauthorizedAppException,
} from '../../core/exceptions/app.exception';
import { PasswordGeneratorUtil } from '../../core/utils/password-generator.util';
import { PhoneSanitizer } from '../../core/utils/phone-sanitizer.util';
import {
  AccountStatus,
  PasswordResetToken,
  type PasswordResetTokenDocument,
  RefreshToken,
  type RefreshTokenDocument,
  type UserDocument,
} from '../../database/schemas';
import { EmailService } from '../../services/email.service';
import { WhatsAppService } from '../../services/whatsapp.service';
import { UsersService } from '../users/users.service';
import type { ChangePasswordDto } from './dto/change-password.dto';
import type { CompleteSetupDto } from './dto/complete-setup.dto';
import type { ForgotPasswordDto } from './dto/forgot-password.dto';
import type { LoginDto } from './dto/login.dto';
import type { RefreshTokenDto } from './dto/refresh-token.dto';
import type { ResetPasswordDto } from './dto/reset-password.dto';
import type { VerifyResetCodeDto } from './dto/verify-reset-code.dto';

const SALT_ROUNDS = 12;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly whatsAppService: WhatsAppService,
    private readonly emailService: EmailService,
    @InjectModel(RefreshToken.name)
    private readonly refreshTokenModel: Model<RefreshTokenDocument>,
    @InjectModel(PasswordResetToken.name)
    private readonly passwordResetModel: Model<PasswordResetTokenDocument>,
  ) {
    void InjectModel;
    void RefreshToken;
    void PasswordResetToken;
  }

  public formatUserResponse(user: UserDocument) {
    return {
      id: user.id || user._id.toString(),
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      email: user.email,
      role: user.role,
      homeTownId: user.homeTownId.toString(),
      isActivePC: user.isActivePC,
      avatarUrl: user.avatarUrl,
      gender: user.gender,
      account: {
        status: user.account?.status || AccountStatus.ACTIVE,
        hasAppAccess: user.account?.hasAppAccess ?? true,
        isAccessRevoked: user.account?.isAccessRevoked ?? false,
        allowedReadTownIds: user.account?.allowedReadTownIds || [],
      },
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private async generateRefreshToken(userId: Types.ObjectId): Promise<string> {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    await this.refreshTokenModel.create({
      userId,
      tokenHash,
      expiresAt,
      isRevoked: false,
    });

    return rawToken;
  }

  private generateAccessToken(user: UserDocument): string {
    return this.jwtService.sign(
      {
        sub: user._id.toString(),
        role: user.role,
        homeTownId: user.homeTownId.toString(),
      },
      { expiresIn: '15m' },
    );
  }

  /**
   * Universal Login: accepts email or WhatsApp phone number, permanent or temporary password.
   */
  async login(loginDto: LoginDto) {
    const user = await this.usersService.findByIdentifier(loginDto.identifier);
    if (!user) {
      throw new UnauthorizedAppException(ErrorCode.AUTH_INVALID_CREDENTIALS);
    }

    if (user.account?.isAccessRevoked) {
      throw new ForbiddenAppException(ErrorCode.AUTH_ACCOUNT_REVOKED);
    }

    if (user.account?.hasAppAccess === false) {
      throw new ForbiddenAppException(ErrorCode.AUTH_NO_APP_ACCESS);
    }

    // Check temporary password first if user has one
    if (user.isTemporaryPassword && user.tempPasswordHash) {
      const isTempMatch = await bcrypt.compare(
        loginDto.password,
        user.tempPasswordHash,
      );

      if (isTempMatch) {
        // Validate temporary password expiration
        if (
          user.tempPasswordExpiresAt &&
          new Date() > user.tempPasswordExpiresAt
        ) {
          throw new UnauthorizedAppException(
            ErrorCode.AUTH_TEMP_PASSWORD_EXPIRED,
          );
        }

        // Issue short-lived setup token for mandatory password change
        const setupToken = this.jwtService.sign(
          { sub: user._id.toString(), isSetup: true },
          { expiresIn: '15m' },
        );

        return {
          requiresPasswordChange: true,
          setupToken,
          user: this.formatUserResponse(user),
          message:
            'Temporary password verified. Please create your permanent password.',
        };
      }
    }

    // Check permanent password
    if (!user.passwordHash) {
      throw new UnauthorizedAppException(ErrorCode.AUTH_INVALID_CREDENTIALS);
    }

    const isMatch = await bcrypt.compare(loginDto.password, user.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedAppException(ErrorCode.AUTH_INVALID_CREDENTIALS);
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(
      user._id as Types.ObjectId,
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 900, // 15 minutes
      requiresPasswordChange: false,
      user: this.formatUserResponse(user),
    };
  }

  /**
   * Sets permanent password when user logs in with temporary password.
   */
  async completeSetup(userId: string, completeSetupDto: CompleteSetupDto) {
    const user = await this.usersService.findById(userId);
    if (!user) {
      throw new UnauthorizedAppException(ErrorCode.AUTH_USER_NOT_FOUND);
    }

    const passwordHash = await bcrypt.hash(
      completeSetupDto.newPassword,
      SALT_ROUNDS,
    );

    user.passwordHash = passwordHash;
    user.tempPasswordHash = undefined;
    user.tempPasswordExpiresAt = undefined;
    user.isTemporaryPassword = false;
    if (user.account) {
      user.account.status = AccountStatus.ACTIVE;
    }

    await user.save();

    const accessToken = this.generateAccessToken(user);
    const refreshToken = await this.generateRefreshToken(
      user._id as Types.ObjectId,
    );

    return {
      accessToken,
      refreshToken,
      expiresIn: 900,
      user: this.formatUserResponse(user),
      message: 'Your permanent password has been set successfully.',
    };
  }

  /**
   * Refreshes access token and rotates the refresh token.
   */
  async refresh(refreshTokenDto: RefreshTokenDto) {
    const tokenHash = this.hashToken(refreshTokenDto.refreshToken);
    const storedToken = await this.refreshTokenModel.findOne({ tokenHash });

    if (!storedToken) {
      throw new UnauthorizedAppException(ErrorCode.AUTH_INVALID_TOKEN);
    }

    // Reuse detection: If token was already revoked, someone may have compromised it!
    if (storedToken.isRevoked) {
      this.logger.warn(
        `Token reuse detected for user ${storedToken.userId}. Revoking all sessions.`,
      );
      await this.refreshTokenModel.updateMany(
        { userId: storedToken.userId },
        { isRevoked: true },
      );
      throw new UnauthorizedAppException(ErrorCode.AUTH_INVALID_TOKEN);
    }

    if (new Date() > storedToken.expiresAt) {
      throw new UnauthorizedAppException(ErrorCode.AUTH_REFRESH_TOKEN_EXPIRED);
    }

    const user = await this.usersService.findById(storedToken.userId);
    if (!user || user.account?.isAccessRevoked) {
      throw new ForbiddenAppException(ErrorCode.AUTH_ACCOUNT_REVOKED);
    }

    // Rotate token
    const newRawToken = crypto.randomBytes(32).toString('hex');
    const newTokenHash = this.hashToken(newRawToken);
    const newExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    storedToken.isRevoked = true;
    storedToken.replacedByTokenHash = newTokenHash;
    await storedToken.save();

    await this.refreshTokenModel.create({
      userId: user._id,
      tokenHash: newTokenHash,
      expiresAt: newExpiresAt,
      isRevoked: false,
    });

    const accessToken = this.generateAccessToken(user);

    return {
      accessToken,
      refreshToken: newRawToken,
      expiresIn: 900,
    };
  }

  /**
   * Logs out user, invalidates access token sessions by stamping lastLogoutAt,
   * and revokes refresh tokens.
   */
  async logout(refreshTokenDto?: RefreshTokenDto, authHeader?: string) {
    let userId: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const decoded = this.jwtService.decode(token) as any;
        if (decoded?.sub) {
          userId = decoded.sub;
        }
      } catch {
        // ignore decode errors
      }
    }

    if (refreshTokenDto?.refreshToken) {
      const tokenHash = this.hashToken(refreshTokenDto.refreshToken);
      const storedToken = await this.refreshTokenModel.findOne({ tokenHash });
      if (storedToken) {
        storedToken.isRevoked = true;
        await storedToken.save();
        if (!userId) {
          userId = storedToken.userId.toString();
        }
      }
    }

    if (userId) {
      await this.usersService.update(userId, { lastLogoutAt: new Date() });
      await this.refreshTokenModel.updateMany({ userId }, { isRevoked: true });
    }

    return { message: 'Logged out successfully' };
  }

  /**
   * Request password reset code via WhatsApp or Email (with anti-enumeration protection).
   */
  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.usersService.findByIdentifier(
      forgotPasswordDto.identifier,
    );

    // Anti-enumeration: always return generic success if user does not exist
    if (!user) {
      return {
        sent: true,
        channel: 'auto',
        expiresInMinutes: 10,
        message:
          'If an account matches this identifier, a verification code has been sent.',
      };
    }

    // Invalidate existing pending tokens for this user
    await this.passwordResetModel.updateMany(
      { userId: user._id, used: false },
      { used: true },
    );

    const code = PasswordGeneratorUtil.generateNumericOtp();
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.passwordResetModel.create({
      userId: user._id,
      codeHash,
      expiresAt,
      attempts: 0,
      used: false,
    });

    // Deliver via WhatsApp and/or Email
    let channel = 'none';
    let maskedDestination = '';

    if (user.phoneNumber) {
      await this.whatsAppService.sendPasswordResetMessage(user.phoneNumber, {
        fullName: user.fullName,
        code,
        expiresInMinutes: 10,
      });
      channel = 'whatsapp';
      maskedDestination = PhoneSanitizer.maskPhoneNumber(user.phoneNumber);
    }

    if (user.email) {
      await this.emailService.sendPasswordResetEmail(user.email, {
        fullName: user.fullName,
        code,
        expiresInMinutes: 10,
      });
      if (channel === 'none') {
        channel = 'email';
        maskedDestination = user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3');
      }
    }

    return {
      sent: true,
      channel,
      maskedDestination,
      expiresInMinutes: 10,
      message:
        'If an account matches this identifier, a verification code has been sent.',
    };
  }

  /**
   * Verifies 6-digit OTP code and issues a temporary 15-minute reset token.
   */
  async verifyResetCode(verifyResetCodeDto: VerifyResetCodeDto) {
    const user = await this.usersService.findByIdentifier(
      verifyResetCodeDto.identifier,
    );
    if (!user) {
      throw new BadRequestAppException(
        ErrorCode.AUTH_INVALID_VERIFICATION_CODE,
      );
    }

    const resetRecord = await this.passwordResetModel
      .findOne({
        userId: user._id,
        used: false,
        expiresAt: { $gt: new Date() },
      })
      .sort({ createdAt: -1 });

    if (!resetRecord) {
      throw new BadRequestAppException(
        ErrorCode.AUTH_INVALID_VERIFICATION_CODE,
      );
    }

    if (resetRecord.attempts >= 5) {
      resetRecord.used = true;
      await resetRecord.save();
      throw new BadRequestAppException(ErrorCode.AUTH_TOO_MANY_ATTEMPTS);
    }

    resetRecord.attempts += 1;

    const isMatch = await bcrypt.compare(
      verifyResetCodeDto.code,
      resetRecord.codeHash,
    );
    if (!isMatch) {
      await resetRecord.save();
      throw new BadRequestAppException(
        ErrorCode.AUTH_INVALID_VERIFICATION_CODE,
      );
    }

    // Generate high-entropy resetToken
    const resetToken = crypto.randomBytes(32).toString('hex');
    resetRecord.resetToken = resetToken;
    resetRecord.resetTokenExpiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await resetRecord.save();

    return {
      valid: true,
      resetToken,
      expiresInMinutes: 15,
      message: 'Code verified. Please set your new password.',
    };
  }

  /**
   * Finalizes password reset using the verified resetToken.
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const resetRecord = await this.passwordResetModel.findOne({
      resetToken: resetPasswordDto.resetToken,
      used: false,
      resetTokenExpiresAt: { $gt: new Date() },
    });

    if (!resetRecord) {
      throw new BadRequestAppException(ErrorCode.AUTH_RESET_SESSION_INVALID);
    }

    const user = await this.usersService.findById(resetRecord.userId);
    if (!user) {
      throw new BadRequestAppException(ErrorCode.AUTH_USER_NOT_FOUND);
    }

    const newHash = await bcrypt.hash(
      resetPasswordDto.newPassword,
      SALT_ROUNDS,
    );
    user.passwordHash = newHash;
    user.tempPasswordHash = undefined;
    user.tempPasswordExpiresAt = undefined;
    user.isTemporaryPassword = false;
    if (user.account) {
      user.account.status = AccountStatus.ACTIVE;
    }
    await user.save();

    resetRecord.used = true;
    await resetRecord.save();

    // Revoke all existing sessions for security
    await this.refreshTokenModel.updateMany(
      { userId: user._id },
      { isRevoked: true },
    );

    return {
      success: true,
      message: 'Your password has been successfully reset. You can now log in.',
    };
  }

  /**
   * Change password for authenticated users.
   */
  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.usersService.findById(userId);
    if (!user?.passwordHash) {
      throw new UnauthorizedAppException(ErrorCode.AUTH_USER_NOT_FOUND);
    }

    const isMatch = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.passwordHash,
    );
    if (!isMatch) {
      throw new BadRequestAppException(
        ErrorCode.AUTH_CURRENT_PASSWORD_INCORRECT,
      );
    }

    user.passwordHash = await bcrypt.hash(
      changePasswordDto.newPassword,
      SALT_ROUNDS,
    );
    await user.save();

    return {
      success: true,
      message: 'Password changed successfully',
    };
  }
}
