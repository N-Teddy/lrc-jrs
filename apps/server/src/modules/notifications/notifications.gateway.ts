import type { INotification } from '@jrs/shared';
import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { type Model, Types } from 'mongoose';
import { Server, Socket } from 'socket.io';
import {
  AccountStatus,
  User,
  type UserDocument,
} from '../../database/schemas/user.schema';

@Injectable()
@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(NotificationsGateway.name);

  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {}

  async handleConnection(@ConnectedSocket() client: Socket) {
    try {
      const authHeader = client.handshake.headers.authorization;
      const authToken = client.handshake.auth?.token;
      let token =
        authToken ||
        (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null);

      if (!token && client.handshake.query?.token) {
        token = String(client.handshake.query.token);
      }

      if (!token) {
        this.logger.warn(
          `Socket connection rejected: No auth token provided (${client.id})`,
        );
        client.disconnect(true);
        return;
      }

      const payload = this.jwtService.verify<{
        sub: string;
        role: string;
        homeTownId: string;
      }>(token);
      if (!payload?.sub || !Types.ObjectId.isValid(payload.sub)) {
        this.logger.warn(
          `Socket connection rejected: Invalid JWT sub (${client.id})`,
        );
        client.disconnect(true);
        return;
      }

      const user = await this.userModel
        .findById(new Types.ObjectId(payload.sub))
        .exec();
      if (!user) {
        this.logger.warn(
          `Socket connection rejected: User ${payload.sub} not found`,
        );
        client.disconnect(true);
        return;
      }

      // Check app access & active status
      const hasAppAccess = user.account?.hasAppAccess ?? true;
      const isRevoked = user.account?.isAccessRevoked ?? false;
      const status = user.account?.status ?? AccountStatus.ACTIVE;

      if (!hasAppAccess || isRevoked || status === AccountStatus.REVOKED) {
        this.logger.warn(
          `Socket connection rejected: User ${user.id} has no app access`,
        );
        client.disconnect(true);
        return;
      }

      // Attach user info to socket data
      client.data.userId = user.id || user._id.toString();
      client.data.role = user.role;
      client.data.homeTownId = user.homeTownId?.toString();

      // Join target rooms
      const userRoom = `user:${client.data.userId}`;
      const townRoom = `town:${client.data.homeTownId}`;
      const roleRoom = `role:${client.data.role}`;

      await client.join([userRoom, townRoom, roleRoom]);

      this.logger.log(
        `Client connected: user ${client.data.userId} on socket ${client.id}`,
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Socket authentication error: ${msg}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(@ConnectedSocket() client: Socket) {
    this.logger.log(`Client disconnected: socket ${client.id}`);
  }

  /**
   * Emit persistent notification to specific user room in real time
   */
  emitToUser(userId: string, notification: INotification): void {
    if (!this.server) return;
    this.server.to(`user:${userId}`).emit('notification:new', notification);
  }

  /**
   * Emit persistent notification to multiple users
   */
  emitToUsers(userIds: string[], notification: INotification): void {
    if (!this.server || userIds.length === 0) return;
    const rooms = userIds.map((id) => `user:${id}`);
    this.server.to(rooms).emit('notification:new', notification);
  }

  /**
   * Emit announcement or notice to a town room
   */
  emitToTown(townId: string, notification: INotification): void {
    if (!this.server) return;
    this.server.to(`town:${townId}`).emit('notification:new', notification);
  }

  /**
   * Emit unread count update to user
   */
  emitUnreadCount(userId: string, unreadCount: number): void {
    if (!this.server) return;
    this.server
      .to(`user:${userId}`)
      .emit('notification:unread_count', { unreadCount });
  }
}
