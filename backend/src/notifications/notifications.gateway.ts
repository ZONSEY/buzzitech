import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  // Assigné par le décorateur @WebSocketServer() après la construction.
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);

  constructor(private readonly jwtService: JwtService) {}

  afterInit() {
    this.logger.log('Notifications gateway initialized');
  }

  handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join')
  handleJoinRoom(
    @MessageBody() payload: { token?: string },
    @ConnectedSocket() client: Socket,
  ) {
    // Sécurité : on ne fait plus confiance à un userId envoyé tel
    // quel par le client (n'importe qui pouvait rejoindre la room
    // de n'importe quel autre utilisateur et recevoir ses
    // notifications). On exige désormais le vrai access token JWT
    // et on rejoint la room correspondant à son "sub" vérifié.
    if (!payload?.token) {
      return {
        event: 'error',
        message: 'Un token JWT est requis pour rejoindre les notifications.',
      };
    }

    try {
      const decoded = this.jwtService.verify<{ sub: string }>(payload.token);
      void client.join(decoded.sub);
      this.logger.log(`Client ${client.id} joined room ${decoded.sub}`);

      return {
        event: 'joined',
        room: decoded.sub,
      };
    } catch {
      return {
        event: 'error',
        message: 'Token invalide ou expiré.',
      };
    }
  }

  sendNotification(userId: string, notification: unknown) {
    if (!this.server) {
      return;
    }

    this.server.to(userId).emit('notification:new', notification);
  }
}
