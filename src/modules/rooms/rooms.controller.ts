import { Body, Controller, Get, Post } from '@nestjs/common';
import { RoomsService } from './rooms.service';
import { CreateRoomDto } from './dto/create-room.dto';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) { }

  @Post()
  create(@Body() dto: CreateRoomDto, @CurrentUser() user: any) {
    return this.roomsService.create(dto);
  }

  @Get()
  findAll() {
    return this.roomsService.findAll();
  }
}
