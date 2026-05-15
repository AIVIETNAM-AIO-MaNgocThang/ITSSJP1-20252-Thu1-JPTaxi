import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
  Query,
} from '@nestjs/common';
import { DriversService } from './drivers.service';
import { UpdateDriverProfileDto } from './dto/update-driver-profile.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { SearchDriversQueryDto } from './dto/search-drivers.query.dto';

@Controller('drivers')
export class DriversController {
  constructor(private readonly drivers: DriversService) {}

  /** Tìm tài xế theo vị trí (lat/lng) và bộ lọc. Phải khai báo trước route `:driverId`. */
  @Get('search')
  searchDrivers(@Query() query: SearchDriversQueryDto) {
    return this.drivers.searchDrivers(query);
  }

  @Get(':driverId/profile')
  getProfile(@Param('driverId', ParseIntPipe) driverId: number) {
    return this.drivers.getProfile(driverId);
  }

  @Put(':driverId/profile')
  updateProfile(
    @Param('driverId', ParseIntPipe) driverId: number,
    @Body() dto: UpdateDriverProfileDto,
  ) {
    return this.drivers.updateProfile(driverId, dto);
  }

  @Put(':driverId/bank-account')
  updateBank(
    @Param('driverId', ParseIntPipe) driverId: number,
    @Body() dto: UpdateBankAccountDto,
  ) {
    return this.drivers.updateBankAccount(driverId, dto);
  }
}
