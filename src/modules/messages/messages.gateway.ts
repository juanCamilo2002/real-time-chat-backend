import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { UsersService } from '../users/users.service';
import { MessagesService } from './messages.service';
import { RoomsService } from '../rooms/rooms.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { Logger } from '@nestjs/common';

@WebSocketGateway({ cors: { origin: '*' } })
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MessagesGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly messagesService: MessagesService,
    private readonly roomsService: RoomsService,
  ) { }

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const user = await this.usersService.findOne(payload.sub);
      if (!user) throw new Error('User not found');

      (client as any).user = user;

      this.logger.log(`✅ Usuario conectado: ${user.username}`);

      // 🔥 Emitir a todos (sin incluir al usuario)
      client.broadcast.emit('user:connected', user.username);
    } catch (error) {
      this.logger.warn(`❌ Conexión rechazada: ${error.message}`);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const user = (client as any).user;
    if (user) {
      this.logger.log(`🚪 Usuario desconectado: ${user.username}`);
      client.broadcast.emit('user:disconnected', user.username);
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(client: Socket, roomId: string) {
    const user = (client as any).user;
    if (!user) return;

    const room = await this.roomsService.findById(roomId);
    if (!room) return client.emit('error', 'Room not found');

    await client.join(room.id);
    client.emit('joinedRoom', { roomId: room.id, roomName: room.name });
    this.logger.log(`👤 ${user.username} joined room ${room.name}`);

    // 📜 Enviar historial
    const messages = await this.messagesService.findByRoom(room.id);
    client.emit('roomMessages', messages);

    // 🔊 Notificar a otros en la sala
    client.to(room.id).emit('userJoinedRoom', user.username);
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(client: Socket, roomId: string) {
    const user = (client as any).user;
    if (!user) return;

    await client.leave(roomId);
    client.emit('leftRoom', { roomId });
    this.logger.log(`👋 ${user.username} left room ${roomId}`);

    client.to(roomId).emit('userLeftRoom', user.username);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody() dto: CreateMessageDto,
    @ConnectedSocket() client: Socket,
  ) {
    const user = (client as any).user;
    if (!user) return;

    const message = await this.messagesService.create(dto, user);

    // Emitir a todos en la sala (excepto al emisor)
    client.to(dto.roomId).emit('newMessage', message);

    // Emitir de vuelta al remitente (para confirmar envío)
    client.emit('messageSent', message);
  }

  private extractToken(client: Socket): string {
    const authHeader =
      client.handshake.headers.authorization ||
      client.handshake.auth?.token ||
      client.handshake.query?.token;

    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.split(' ')[1];
    }

    if (typeof authHeader === 'string') return authHeader;

    throw new Error('Token not provided');
  }
}
