import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { MessagesService } from './messages.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Server, Socket } from 'socket.io';
import { UsersService } from '../users/users.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { RoomsService } from '../rooms/rooms.service';

@WebSocketGateway()
export class MessagesGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly messagesService: MessagesService,
    private readonly roomsService: RoomsService
  ) { }

  async handleConnection(client: Socket) {
    try {
      const token = this.extractToken(client);
      const payload = this.jwtService.verify(token, {
        secret: this.configService.get<string>('JWT_SECRET')
      });

      const user = await this.usersService.findOne(payload.sub);
      if (!user) throw new Error('User not found');

      (client as any).user = user;
      console.log(`✅ Usuario conectado: ${user.username}`);
      this.server.emit('user:connected', user.username);
    } catch (error) {
      console.log('❌ Conexión rechazada:', error.message);
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const user = (client as any).user;
    if (user) {
      console.log(`🚪 Usuario desconectado: ${user.username}`);
      this.server.emit('user:disconect', user.username)
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
    console.log(`👤 ${user.username} joined room ${room.name}`);

    // historial
    const messages = await this.messagesService.findByRoom(room.id);
    client.emit('roomMessages', messages);
  }

  @SubscribeMessage('leaveRoom')
  async handleLeaveRoom(client: Socket, roomId: string) {
    const user = (client as any).user;
    if (!user) return;

    await client.leave(roomId);
    client.emit('leftRoom', { roomId });
    console.log(`👋 ${user.username} left room ${roomId}`);
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(@MessageBody() dto: CreateMessageDto, @ConnectedSocket() client: Socket) {
    const user = (client as any).user;
    if (!user) return;

    const message = await this.messagesService.create(dto, user);
    this.server.to(dto.roomId).emit('newMessage', message);
  }

  private extractToken(client: Socket): string {
    const authHeader = client.handshake.headers.authorization || client.handshake.auth?.token || client.handshake.query?.token;

    if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
      return authHeader.split(' ')[1];
    }

    if (typeof authHeader === 'string') return authHeader;

    throw new Error('Token not provided');
  }
}
