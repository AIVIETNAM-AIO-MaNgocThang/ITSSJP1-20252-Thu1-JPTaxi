import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Put,
} from '@nestjs/common';
import { DriversService } from './drivers.service';
import { UpdateDriverProfileDto } from './dto/update-driver-profile.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';

@Controller('drivers')
export class DriversController {
  constructor(private readonly drivers: DriversService) {}

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
