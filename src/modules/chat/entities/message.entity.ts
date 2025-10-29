import { User } from "src/modules/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity('messages')
export class Message {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column('text')
    content: string;

    @ManyToOne(() => User, (user) => user.messages, {
        onDelete: 'CASCADE',
        eager: true
    })
    @JoinColumn({ name: 'sender_id'})
    sender: User;

    @CreateDateColumn({ name: 'created_at'})
    createdAt: Date;
}