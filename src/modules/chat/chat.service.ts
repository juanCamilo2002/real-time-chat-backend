import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class ChatService {
    constructor(
        @InjectRepository(Message)
        private readonly messageRepo: Repository<Message>,
    ) { }

    async createMessage(content: string, sender: User) {
        const message = this.messageRepo.create({
            content,
            sender
        });

        return this.messageRepo.save(message);
    }

    async getAllMessages() {
        return this.messageRepo.find({
            order: { createdAt: 'ASC' }
        })
    }
}
