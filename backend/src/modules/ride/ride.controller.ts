import { Body, Controller, Post } from '@nestjs/common';
import { EstimateDto } from './dto/estimate.dto';
import { RouteDto } from './dto/route.dto';

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



// API MỚI: LẤY TỌA ĐỘ LỘ TRÌNH TỪ ĐIỂM XUẤT PHÁT ĐẾN ĐÍCH
  @Post('route')
  getRoute(@Body() body: RouteDto) {
    const { startLat, startLng, endLat, endLng } = body;

    // Tạo polyline giả lập đơn giản (có thể thay bằng Google/OSRM sau)
    const routeCoordinates = this.generateRouteCoordinates(
      startLat,
      startLng,
      endLat,
      endLng,
    );

    const distance =
      Math.sqrt(
        Math.pow(endLat - startLat, 2) + Math.pow(endLng - startLng, 2),
      ) * 111;

    return {
      distance_km: Number(distance.toFixed(2)),
      duration_minutes: Math.round((distance / 30) * 60),
      route: routeCoordinates,           // array of [lat, lng]
      polyline: this.encodePolyline(routeCoordinates), // optional
    };
  }

  private generateRouteCoordinates(
    startLat: number,
    startLng: number,
    endLat: number,
    endLng: number,
  ): [number, number][] {
    const points: [number, number][] = [];
    const steps = 20;

    for (let i = 0; i <= steps; i++) {
      const lat = startLat + (endLat - startLat) * (i / steps);
      const lng = startLng + (endLng - startLng) * (i / steps);
      points.push([Number(lat.toFixed(6)), Number(lng.toFixed(6))]);
    }
    return points;
  }

  private encodePolyline(points: [number, number][]): string {
    // Simple placeholder - có thể thay bằng thư viện polyline sau
    return 'mock_polyline_' + points.length;
  }
}
