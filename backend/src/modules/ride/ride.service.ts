import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { RideRequest, RideRequestStatusType } from '../../entities/ride-request.entity';
import { Trip, TripStatusType } from '../../entities/trip.entity';
import { Customer } from '../../entities/customer.entity';
import { PaymentTransaction, PaymentStatusType } from '../../entities/payment-transaction.entity';
import { DriverPayout, PayoutStatusType } from '../../entities/driver-payout.entity';
import { CreateRideRequestDto } from './dto/create-ride-request.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import { RideGateway } from './ride.gateway';
import { SelectPickupDto } from './dto/select-pickup.dto';

@Injectable()
export class RideService {
    /**
   *Sprint3_ID13: Chọn / Cập nhật vị trí điểm đón (cho phép chọn khác vị trí hiện tại)
   */
  async selectPickupLocation(customerId: number, dto: SelectPickupDto) {
    const rideRequest = await this.rideRequestRepo.findOne({
      where: { 
        requestId: dto.rideRequestId, 
        customerId 
      },
    });

    if (!rideRequest) {
      throw new NotFoundException('乗車依頼が見つかりません。'); 
      // Không tìm thấy yêu cầu đặt xe
    }

    if (rideRequest.status !== RideRequestStatusType.pending && 
        rideRequest.status !== RideRequestStatusType.searching) {
      throw new BadRequestException('現在の状態では受け取り場所を変更できません。'); 
      // Không thể thay đổi điểm đón ở trạng thái hiện tại
    }

    // Cập nhật vị trí đón mới
    rideRequest.pickupLat = dto.pickupLat.toString();
    rideRequest.pickupLng = dto.pickupLng.toString();
    
    if (dto.pickupAddress) {
      rideRequest.pickupAddress = dto.pickupAddress;
    }

    const updatedRequest = await this.rideRequestRepo.save(rideRequest);

    return {
      success: true,
      message: '受け取り場所を更新しました。', 
      // Đã cập nhật vị trí điểm đón thành công
      pickupLocation: {
        lat: parseFloat(updatedRequest.pickupLat),
        lng: parseFloat(updatedRequest.pickupLng),
        address: updatedRequest.pickupAddress,
      },
    };
  }
  constructor(
    @InjectRepository(RideRequest)
    private readonly rideRequestRepo: Repository<RideRequest>,
    @InjectRepository(Trip)
    private readonly tripRepo: Repository<Trip>,
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
    @InjectRepository(PaymentTransaction)
    private readonly paymentTransactionRepo: Repository<PaymentTransaction>,
    @InjectRepository(DriverPayout)
    private readonly driverPayoutRepo: Repository<DriverPayout>,
    private readonly rideGateway: RideGateway,
  ) {}

  /**
   * Tạo yêu cầu đặt xe mới
   */
  async createRequest(customerId: number, dto: CreateRideRequestDto): Promise<RideRequest> {
    // 1. Kiểm tra xem khách hàng có yêu cầu đặt xe nào đang hoạt động không
    const activeRequest = await this.rideRequestRepo.findOne({
      where: {
        customerId,
        status: In([
          RideRequestStatusType.pending,
          RideRequestStatusType.searching,
          RideRequestStatusType.assigned,
        ]),
      },
    });

    if (activeRequest) {
      throw new BadRequestException('Bạn đang có một yêu cầu đặt xe chưa hoàn thành.');
    }

    // 2. Kiểm tra xem khách hàng có chuyến đi nào đang diễn ra (ongoing) không
    const activeTrip = await this.tripRepo
      .createQueryBuilder('trip')
      .innerJoinAndSelect('trip.rideRequest', 'rideRequest')
      .where('rideRequest.customerId = :customerId', { customerId })
      .andWhere('trip.status = :status', { status: TripStatusType.ongoing })
      .getOne();

    if (activeTrip) {
      throw new BadRequestException('Bạn đang trong một chuyến đi chưa kết thúc.');
    }

    // 3. Khởi tạo yêu cầu mới
    const request = this.rideRequestRepo.create({
      customerId,
      pickupAddress: dto.pickupAddress,
      pickupLat: dto.pickupLat.toString(),
      pickupLng: dto.pickupLng.toString(),
      dropoffAddress: dto.dropoffAddress,
      dropoffLat: dto.dropoffLat.toString(),
      dropoffLng: dto.dropoffLng.toString(),
      vehicleType: dto.vehicleType,
      status: RideRequestStatusType.searching, // Bắt đầu tìm kiếm tài xế lân cận
      actualPassengerName: dto.actualPassengerName || null,
      actualPassengerPhone: dto.actualPassengerPhone || null,
      noteToDriver: dto.noteToDriver || null,
      requestTime: new Date(),
    });

    return this.rideRequestRepo.save(request);
  }

  /**
   * Lấy yêu cầu đặt xe hoặc chuyến đi đang hoạt động của khách hàng
   */
  async getActiveRide(customerId: number): Promise<any> {
    // 1. Tìm yêu cầu đặt xe hoạt động
    const activeRequest = await this.rideRequestRepo.findOne({
      where: {
        customerId,
        status: In([
          RideRequestStatusType.pending,
          RideRequestStatusType.searching,
          RideRequestStatusType.assigned,
        ]),
      },
    });

    if (activeRequest) {
      return { type: 'request', data: activeRequest };
    }

    // 2. Tìm chuyến đi đang hoạt động (ongoing)
    const activeTrip = await this.tripRepo
      .createQueryBuilder('trip')
      .innerJoinAndSelect('trip.rideRequest', 'rideRequest')
      .where('rideRequest.customerId = :customerId', { customerId })
      .andWhere('trip.status = :status', { status: TripStatusType.ongoing })
      .getOne();

    if (activeTrip) {
      return { type: 'trip', data: activeTrip };
    }

    return null;
  }

  /**
   * Hủy yêu cầu đặt xe đang hoạt động (khi chưa được tài xế nhận cuốc)
   */
  async cancelRequest(customerId: number, requestId: number): Promise<RideRequest> {
    const request = await this.rideRequestRepo.findOne({
      where: { requestId, customerId },
    });

    if (!request) {
      throw new NotFoundException('Không tìm thấy yêu cầu đặt xe.');
    }

    if (
      request.status !== RideRequestStatusType.pending &&
      request.status !== RideRequestStatusType.searching
    ) {
      throw new BadRequestException('Không thể hủy yêu cầu đặt xe đã được gán hoặc đã hoàn thành.');
    }

    request.status = RideRequestStatusType.failed; // Chuyển trạng thái sang thất bại (đã hủy)
    return this.rideRequestRepo.save(request);
  }

  /**
   * Xử lý thanh toán chuyến đi
   */
  async processPayment(customerId: number, dto: ProcessPaymentDto): Promise<any> {
    // 1. Kiểm tra chuyến đi có tồn tại không và lấy thông tin chi tiết
    const trip = await this.tripRepo
      .createQueryBuilder('trip')
      .innerJoinAndSelect('trip.rideRequest', 'rideRequest')
      .where('trip.trip_id = :tripId', { tripId: dto.tripId })
      .getOne();

    if (!trip) {
      throw new NotFoundException('Không tìm thấy chuyến đi tương ứng.');
    }

    if (trip.rideRequest.customerId !== customerId) {
      throw new ForbiddenException('Bạn không có quyền thanh toán cho chuyến đi này.');
    }

    if (trip.status !== TripStatusType.ongoing) {
      throw new BadRequestException('Chuyến đi này đã được thanh toán hoặc đã hủy.');
    }

    // 2. Xác thực mật khẩu khách hàng ("Check mật khẩu")
    const customer = await this.customerRepo
      .createQueryBuilder('customer')
      .addSelect('customer.passwordHash') // Phải addSelect vì mật khẩu mặc định select: false
      .where('customer.customer_id = :customerId', { customerId })
      .getOne();

    if (!customer) {
      throw new NotFoundException('Không tìm thấy thông tin khách hàng.');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, customer.passwordHash);
    if (!isPasswordValid) {
      throw new BadRequestException('Mật khẩu xác nhận không chính xác.');
    }

    // 3. Cập nhật trạng thái chuyến đi thành hoàn thành
    trip.status = TripStatusType.completed;
    trip.endTime = new Date();
    await this.tripRepo.save(trip);

    // Cập nhật trạng thái yêu cầu đặt xe sang hoàn thành
    const rideRequest = trip.rideRequest;
    rideRequest.status = RideRequestStatusType.completed;
    await this.rideRequestRepo.save(rideRequest);

    // 4. Tạo bản ghi giao dịch trong bảng `payment_transaction`
    const transaction = this.paymentTransactionRepo.create({
      tripId: trip.tripId,
      paymentMethod: dto.paymentMethod,
      amountVnd: trip.finalFareVnd,
      status: PaymentStatusType.success,
      gatewayTransactionId: 'TXN_' + Math.random().toString(36).substring(2, 11).toUpperCase(),
      paidAt: new Date(),
    });
    await this.paymentTransactionRepo.save(transaction);

    // 5. Tạo dòng tiền chi trả tài xế trong bảng `driver_payout`
    const payout = this.driverPayoutRepo.create({
      tripId: trip.tripId,
      driverId: trip.driverId,
      amountVnd: trip.finalFareVnd,
      status: PayoutStatusType.processed,
      processedAt: new Date(),
    });
    await this.driverPayoutRepo.save(payout);

    // 6. Phát tín hiệu real-time qua Socket.io thông báo thanh toán thành công
    // Sự kiện 'tripPaid' sẽ kích hoạt Frontend tự động điều hướng khách hàng sang màn đánh giá tài xế
    this.rideGateway.emitToTrip(trip.tripId, 'tripPaid', {
      tripId: trip.tripId,
      status: 'completed',
      finalFareVnd: trip.finalFareVnd,
      finalFareJpy: trip.finalFareJpy,
      paymentMethod: dto.paymentMethod,
      paidAt: transaction.paidAt,
    });

    return {
      message: 'Thanh toán thành công.',
      tripId: trip.tripId,
      status: 'completed',
      transactionId: transaction.gatewayTransactionId,
      paidAt: transaction.paidAt,
    };
  }
}
