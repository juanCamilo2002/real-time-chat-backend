import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { Repository } from 'typeorm';
import { RoomsService } from '../rooms/rooms.service';
import { CreateMessageDto } from './dto/create-message.dto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class MessagesService {
    constructor(
        @InjectRepository(Message)
        private readonly messageRepo: Repository<Message>,
        private readonly roomsService: RoomsService,
    ) { }

    async create(dto: CreateMessageDto, sender: User) {
        const room = await this.roomsService.findById(dto.roomId);
        if (!room) throw new NotFoundException('Room not found');

        const message = this.messageRepo.create({
            content: dto.content,
            room,
            sender
        });

        return this.messageRepo.save(message);
    }

    async findByRoom(roomId: string) {
        return this.messageRepo.find({
            where: { room: { id: roomId } },
            order: { createdAt: 'ASC' }
        });
    }
}
