import { Body, Controller, Get, Param, ParseIntPipe, Post, Query } from '@nestjs/common';
import { EstimateDto } from './dto/estimate.dto';
import { RideService } from './ride.service';

@Controller()
export class RideController {
  constructor(private readonly rides: RideService) {}

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

  @Get('ride/current')
  getCurrentRide(
    @Query('customerId') customerId?: string,
    @Query('driverId') driverId?: string,
  ) {
    return this.rides.getCurrentRide({
      customerId: customerId ? Number(customerId) : undefined,
      driverId: driverId ? Number(driverId) : undefined,
    });
  }

  @Post('ride/demo')
  ensureDemoRide(
    @Query('customerId') customerId?: string,
    @Query('driverId') driverId?: string,
  ) {
    return this.rides.ensureDemoRide(
      customerId ? Number(customerId) : 1,
      driverId ? Number(driverId) : 1,
    );
  }

  @Post('ride/search-demo')
  startDemoSearch(
    @Query('customerId') customerId?: string,
    @Query('driverId') driverId?: string,
  ) {
    return this.rides.startDemoSearch(
      customerId ? Number(customerId) : 1,
      driverId ? Number(driverId) : 1,
    );
  }

  @Post('ride/search-demo/cancel')
  cancelDemoSearch(@Query('customerId') customerId?: string) {
    return this.rides.cancelDemoSearch(customerId ? Number(customerId) : 1);
  }

  @Post('ride/:tripId/cancel-by-driver')
  cancelByDriver(@Param('tripId', ParseIntPipe) tripId: number) {
    return this.rides.cancelByDriver(tripId);
  }
}
