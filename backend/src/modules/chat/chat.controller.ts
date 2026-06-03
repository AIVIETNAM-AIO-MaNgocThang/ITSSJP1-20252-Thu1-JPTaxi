import { Body, Controller, Get, Param, ParseIntPipe, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import type { JwtValidatedUser } from '../auth/jwt.strategy';
import { ChatService } from './chat.service';

type AuthedRequest = Request & { user: JwtValidatedUser };

@Controller('chat')
@UseGuards(AuthGuard('jwt'))
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get('active')
  getActiveChat(@Req() req: AuthedRequest) {
    return this.chat.getActiveChat(
      req.user.id,
      req.user.role === 'driver' ? 'driver' : 'customer',
    );
  }

  @Get('conversations')
  listConversations(@Req() req: AuthedRequest) {
    return this.chat.listConversations(
      req.user.id,
      req.user.role === 'driver' ? 'driver' : 'customer',
    );
  }

  @Get('trips/:tripId')
  getChatByTrip(@Req() req: AuthedRequest, @Param('tripId', ParseIntPipe) tripId: number) {
    return this.chat.getChatByTrip(
      req.user.id,
      req.user.role === 'driver' ? 'driver' : 'customer',
      tripId,
    );
  }

  @Post('messages')
  sendMessage(@Req() req: AuthedRequest, @Body() body: { text?: string }) {
    return this.chat.sendMessage(
      req.user.id,
      req.user.role === 'driver' ? 'driver' : 'customer',
      body.text ?? '',
    );
  }
}
