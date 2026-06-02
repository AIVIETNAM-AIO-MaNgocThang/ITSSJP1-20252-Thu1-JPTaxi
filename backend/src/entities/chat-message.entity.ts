import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Trip } from './trip.entity';

export enum ChatSenderRole {
  customer = 'customer',
  driver = 'driver',
}

@Entity({ name: 'chat_message' })
export class ChatMessage {
  @PrimaryGeneratedColumn({ name: 'message_id' })
  messageId: number;

  @Column({ name: 'trip_id' })
  tripId: number;

  @ManyToOne(() => Trip)
  @JoinColumn({ name: 'trip_id' })
  trip: Trip;

  @Column({
    name: 'sender_role',
    type: 'enum',
    enum: ChatSenderRole,
    enumName: 'chat_sender_role_enum',
  })
  senderRole: ChatSenderRole;

  @Column({ name: 'sender_id' })
  senderId: number;

  @Column({ name: 'sender_display_name', type: 'varchar', length: 100, nullable: true })
  senderDisplayName: string | null;

  @Column({ type: 'text' })
  message: string;

  @Column({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;
}
