import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Customer } from '../../entities/customer.entity';
import { Driver } from '../../entities/driver.entity';
import { RideRequest } from '../../entities/ride-request.entity';
import { Trip } from '../../entities/trip.entity';
import { Vehicle } from '../../entities/vehicle.entity';
import { RideController } from './ride.controller';
import { RideService } from './ride.service';

@Module({
  imports: [TypeOrmModule.forFeature([Trip, RideRequest, Customer, Driver, Vehicle])],
  controllers: [RideController],
  providers: [RideService],
})
export class RideModule {}
