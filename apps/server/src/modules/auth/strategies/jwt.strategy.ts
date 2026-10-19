import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { UsersService } from '../../users/users.service';

export interface JwtPayload {
  sub: string;
  role: string;
  homeTownId: string;
  isSetup?: boolean;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const secret =
      configService.get<string>('jwt.secret') ||
      configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new Error(
        'FATAL: JWT_SECRET environment variable is missing or empty. Application cannot start.',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (user.account?.isAccessRevoked) {
      throw new UnauthorizedException('Your account access has been revoked');
    }

    if (payload.iat && user.lastLogoutAt) {
      const logoutSec = Math.floor(user.lastLogoutAt.getTime() / 1000);
      if (payload.iat < logoutSec) {
        throw new UnauthorizedException(
          'Session terminated. Token invalidated.',
        );
      }
    }

    return user;
  }
}
