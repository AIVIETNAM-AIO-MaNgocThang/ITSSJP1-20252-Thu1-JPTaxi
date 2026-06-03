import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChatMessage, ChatSenderRole } from '../../entities/chat-message.entity';
import { Customer } from '../../entities/customer.entity';
import { Driver } from '../../entities/driver.entity';
import { Trip, TripStatusType } from '../../entities/trip.entity';

type ChatRole = 'customer' | 'driver';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(ChatMessage)
    private readonly messages: Repository<ChatMessage>,
    @InjectRepository(Trip)
    private readonly trips: Repository<Trip>,
    @InjectRepository(Customer)
    private readonly customers: Repository<Customer>,
    @InjectRepository(Driver)
    private readonly drivers: Repository<Driver>,
  ) {}

  private serialize(message: ChatMessage) {
    return {
      id: message.messageId,
      tripId: message.tripId,
      senderId: message.senderId,
      senderRole: message.senderRole,
      senderName: message.senderDisplayName,
      text: message.message,
      createdAt: message.createdAt,
    };
  }

  private async findActiveTrip(userId: number, role: ChatRole) {
    const query = this.trips
      .createQueryBuilder('trip')
      .innerJoinAndSelect('trip.rideRequest', 'rideRequest')
      .where('trip.status = :status', { status: TripStatusType.ongoing })
      .orderBy('trip.startTime', 'DESC');

    if (role === 'driver') {
      query.andWhere('trip.driverId = :userId', { userId });
    } else {
      query.andWhere('rideRequest.customerId = :userId', { userId });
    }

    return query.getOne();
  }

  private async findLatestTripWithChat(userId: number, role: ChatRole) {
    const query = this.trips
      .createQueryBuilder('trip')
      .innerJoinAndSelect('trip.rideRequest', 'rideRequest')
      .innerJoin(ChatMessage, 'message', 'message.trip_id = trip.trip_id')
      .where('trip.status IN (:...statuses)', {
        statuses: [TripStatusType.completed, TripStatusType.cancelled_by_admin],
      })
      .orderBy('trip.endTime', 'DESC')
      .addOrderBy('trip.startTime', 'DESC');

    if (role === 'driver') {
      query.andWhere('trip.driverId = :userId', { userId });
    } else {
      query.andWhere('rideRequest.customerId = :userId', { userId });
    }

    return query.getOne();
  }

  private async getPartner(trip: Trip, role: ChatRole) {
    const participants = await this.getParticipants(trip);
    return role === 'customer' ? participants.driver : participants.customer;
  }

  private normalizeAccount(
    account: Customer | Driver | null,
    role: ChatRole,
  ) {
    if (!account) return null;
    const id = role === 'driver'
      ? (account as Driver).driverId
      : (account as Customer).customerId;
    const name = [account.lastName, account.firstName].filter(Boolean).join(' ').trim();

    return {
      id,
      role,
      firstName: account.firstName,
      lastName: account.lastName,
      name,
      email: account.email,
      phone: account.phone,
      avatarUrl: account.avatarUrl,
    };
  }

  private async getParticipants(trip: Trip) {
    const driver = await this.drivers.findOne({ where: { driverId: trip.driverId } });
    const customerId = trip.rideRequest?.customerId;
    const customer = customerId
      ? await this.customers.findOne({ where: { customerId } })
      : null;

    return {
      customer: this.normalizeAccount(customer, 'customer'),
      driver: this.normalizeAccount(driver, 'driver'),
    };
  }

  async getActiveChat(userId: number, role: ChatRole) {
    const activeTrip = await this.findActiveTrip(userId, role);
    const trip = activeTrip ?? await this.findLatestTripWithChat(userId, role);
    if (!trip) {
      return {
        available: false,
        message: 'チャットはドライバーが配車を承認した後に利用できます。',
        trip: null,
        messages: [],
      };
    }

    const messages = await this.messages.find({
      where: { tripId: trip.tripId },
      order: { createdAt: 'ASC', messageId: 'ASC' },
      take: 200,
    });

    return {
      available: trip.status === TripStatusType.ongoing,
      partner: await this.getPartner(trip, role),
      participants: await this.getParticipants(trip),
      trip: {
        tripId: trip.tripId,
        requestId: trip.rideRequest?.requestId,
        customerId: trip.rideRequest?.customerId,
        driverId: trip.driverId,
        pickupAddress: trip.rideRequest?.pickupAddress,
        dropoffAddress: trip.rideRequest?.dropoffAddress,
        status: trip.status,
      },
      messages: messages.map((message) => this.serialize(message)),
      message: trip.status === TripStatusType.ongoing
        ? undefined
        : 'ã“ã®ãƒãƒ£ãƒƒãƒˆã¯çµ‚äº†ã—ãŸä¹—è»Šã®å±¥æ­´ã§ã™ã€‚',
    };
  }

  async sendMessage(userId: number, role: ChatRole, text: string) {
    const body = text.trim();
    if (!body) {
      throw new BadRequestException('メッセージを入力してください。');
    }

    const trip = await this.findActiveTrip(userId, role);
    if (!trip) {
      throw new ForbiddenException('チャットはドライバーが配車を承認した後に利用できます。');
    }

    const participants = await this.getParticipants(trip);
    const sender = role === 'driver' ? participants.driver : participants.customer;

    const message = this.messages.create({
      tripId: trip.tripId,
      senderId: userId,
      senderRole: role === 'driver' ? ChatSenderRole.driver : ChatSenderRole.customer,
      senderDisplayName: sender?.name || null,
      message: body,
      createdAt: new Date(),
    });

    return this.serialize(await this.messages.save(message));
  }
}
