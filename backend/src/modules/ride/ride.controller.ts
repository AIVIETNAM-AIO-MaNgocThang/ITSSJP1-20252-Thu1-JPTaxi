import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request } from 'express';
import { RideService } from './ride.service';
import { EstimateDto } from './dto/estimate.dto';
import { CreateRideRequestDto } from './dto/create-ride-request.dto';
import { ProcessPaymentDto } from './dto/process-payment.dto';
import type { JwtValidatedUser } from '../auth/jwt.strategy';

type AuthedRequest = Request & { user: JwtValidatedUser };

@Controller()
export class RideController {
  constructor(private readonly rideService: RideService) {}

  @Post('estimate')
  calculateEstimate(@Body() body: EstimateDto) {
    const { startLat, startLng, endLat, endLng, vehicleType } = body;
    const distance =
      Math.sqrt(
        Math.pow(endLat - startLat, 2) + Math.pow(endLng - startLng, 2),
      ) * 111;
    const time = Math.round((distance / 30) * 60);
    const rates: Record<string, number> = { '4': 12000, '7': 15000, '9': 20000 };
    const pricePerKm = rates[vehicleType ?? '4'] ?? 12000;
    const totalPrice = Math.round(distance * pricePerKm);

    return {
      distance_km: distance.toFixed(2),
      estimated_time_minutes: time,
      total_price: totalPrice,
      currency: 'VND',
    };
  }

  /**
   * Khách hàng đặt xe mới (hỗ trợ tự đi hoặc đặt hộ)
   */
  @Post('ride/request')
  @UseGuards(AuthGuard('jwt'))
  createRideRequest(
    @Req() req: AuthedRequest,
    @Body() dto: CreateRideRequestDto,
  ) {
    if (req.user.role !== 'customer') {
      throw new ForbiddenException('Chỉ có khách hàng mới có thể thực hiện đặt xe.');
    }
    return this.rideService.createRequest(req.user.id, dto);
  }

  /**
   * Lấy thông tin cuốc xe/chuyến đi đang hoạt động
   */
  @Get('ride/active')
  @UseGuards(AuthGuard('jwt'))
  getActiveRide(@Req() req: AuthedRequest) {
    if (req.user.role !== 'customer') {
      throw new ForbiddenException('Chỉ có khách hàng mới có thể lấy thông tin chuyến đi của mình.');
    }
    return this.rideService.getActiveRide(req.user.id);
  }

  /**
   * Hủy yêu cầu đặt xe khi đang tìm tài xế
   */
  @Post('ride/cancel/:requestId')
  @UseGuards(AuthGuard('jwt'))
  cancelRideRequest(
    @Req() req: AuthedRequest,
    @Param('requestId', ParseIntPipe) requestId: number,
  ) {
    if (req.user.role !== 'customer') {
      throw new ForbiddenException('Chỉ có khách hàng mới có thể hủy đặt xe.');
    }
    return this.rideService.cancelRequest(req.user.id, requestId);
  }

  /**
   * Khách hàng thực hiện thanh toán chuyến đi
   */
  @Post('ride/pay')
  @UseGuards(AuthGuard('jwt'))
  processRidePayment(
    @Req() req: AuthedRequest,
    @Body() dto: ProcessPaymentDto,
  ) {
    if (req.user.role !== 'customer') {
      throw new ForbiddenException('Chỉ có khách hàng mới có quyền thực hiện thanh toán.');
    }
    return this.rideService.processPayment(req.user.id, dto);
  }
}


