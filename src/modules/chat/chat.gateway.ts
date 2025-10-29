import { JwtService } from '@nestjs/jwt';
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { UsersService } from '../users/users.service';
import { ChatService } from './chat.service';
import { ConfigService } from '@nestjs/config';

@WebSocketGateway({
  cors: {
    origin: '*'
  }
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private configService: ConfigService,
    private chatService: ChatService
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

  @SubscribeMessage('message:send')
  async handleMessage(@MessageBody() data: { content: string }, @ConnectedSocket() client: Socket) {
    const user = (client as any).user;
    if (!user) return;

    const savedMessage = await this.chatService.createMessage(data.content, user);

    this.server.emit('message:receive', savedMessage);
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
