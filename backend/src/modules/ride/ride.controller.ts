import { Body, Controller, Post } from '@nestjs/common';
import { EstimateDto } from './dto/estimate.dto';

@Controller()
export class RideController {
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
}
