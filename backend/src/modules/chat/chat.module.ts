import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChatMessage } from '../../entities/chat-message.entity';
import { Customer } from '../../entities/customer.entity';
import { Driver } from '../../entities/driver.entity';
import { Trip } from '../../entities/trip.entity';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';

@Module({
  imports: [TypeOrmModule.forFeature([ChatMessage, Trip, Customer, Driver])],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
