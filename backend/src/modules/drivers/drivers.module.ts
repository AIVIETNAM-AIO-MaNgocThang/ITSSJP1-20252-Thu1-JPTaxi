import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Driver } from '../../entities/driver.entity';
import { Vehicle } from '../../entities/vehicle.entity';
import { DriverLicense } from '../../entities/driver-license.entity';
import { DriverBankAccount } from '../../entities/driver-bank-account.entity';
import { Trip } from '../../entities/trip.entity';
import { LoginHistory } from '../../entities/login-history.entity';
import { AuthModule } from '../auth/auth.module';
import { UploadsModule } from '../uploads/uploads.module';
import { DriversController } from './drivers.controller';
import { DriversService } from './drivers.service';
import { DriversAuthService } from './drivers-auth.service';
import { DriversRegistrationService } from './drivers-registration.service';

@Module({
  imports: [
    AuthModule,
    UploadsModule,
    TypeOrmModule.forFeature([
      Driver,
      Vehicle,
      DriverLicense,
      DriverBankAccount,
      Trip,
      LoginHistory,
    ]),
  ],
  controllers: [DriversController],
  providers: [DriversService, DriversAuthService, DriversRegistrationService],
})
export class DriversModule {}
