import { Module } from '@nestjs/common';
import { RideController } from './ride.controller';

@Module({
  controllers: [RideController],
})
export class RideModule {}
