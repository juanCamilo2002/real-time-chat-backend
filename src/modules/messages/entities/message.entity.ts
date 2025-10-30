import { Room } from "src/modules/rooms/entities/room.entity";
import { User } from "src/modules/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('messages')
export class Message {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('text')
    content: string;

    @ManyToOne(() => User, (user) => user.id, { eager: true })
    sender: User;

    @ManyToOne(() => Room, (room) => room.id, { eager: true })
    room: Room;

    @CreateDateColumn()
    createdAt: Date;
}