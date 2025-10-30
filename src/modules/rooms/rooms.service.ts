import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Room } from './entities/room.entity';
import { Repository } from 'typeorm';
import { CreateRoomDto } from './dto/create-room.dto';

@Injectable()
export class RoomsService {
    constructor(
        @InjectRepository(Room)
        private readonly roomRepo: Repository<Room>,
    ) { }

    async create(dto: CreateRoomDto) {
        const exists = await this.roomRepo.findOne({ where: { name: dto.name } });
        if (exists) throw new ConflictException('Room already exists');

        const room = this.roomRepo.create(dto);
        return this.roomRepo.save(room);
    }

    async findAll() {
        return this.roomRepo.find();
    }

    async findById(id: string) {
        return this.roomRepo.findOne({ where: { id } });
    }
}
