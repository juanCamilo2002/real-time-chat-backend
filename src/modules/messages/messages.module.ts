import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { RoomsModule } from '../rooms/rooms.module';
import { MessagesGateway } from './messages.gateway';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Message]),
    RoomsModule,
    AuthModule,
    UsersModule,
    RoomsModule
  ],
  providers: [MessagesService, MessagesGateway]
})
export class MessagesModule { }
