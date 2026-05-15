import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { join } from 'path';
import { Customer } from './entities/customer.entity';
import { Driver } from './entities/driver.entity';
import { Admin } from './entities/admin.entity';
import { Vehicle } from './entities/vehicle.entity';
import { DriverBankAccount } from './entities/driver-bank-account.entity';
import { DriverLicense } from './entities/driver-license.entity';
import { Trip } from './entities/trip.entity';
import { RideRequest } from './entities/ride-request.entity';
import { LoginHistory } from './entities/login-history.entity';
import { DriverLocationHistory } from './entities/driver-location-history.entity';
import { Rating } from './entities/rating.entity';
import { AuthModule } from './modules/auth/auth.module';
import { RideModule } from './modules/ride/ride.module';
import { AdminModule } from './modules/admin/admin.module';
import { CustomersModule } from './modules/customers/customers.module';
import { DriversModule } from './modules/drivers/drivers.module';
import { UploadsModule } from './modules/uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [
        join(__dirname, '..', '.env'),
        join(__dirname, '..', '.env.local'),
      ],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get<string>('DB_HOST', 'localhost'),
        port: parseInt(config.get<string>('DB_PORT', '5432'), 10),
        username: config.get<string>('DB_USER', 'postgres'),
        password: config.get<string>('DB_PASS', ''),
        database: config.get<string>('DB_NAME', 'JPTaxi'),
        entities: [
          Customer,
          Driver,
          Admin,
          Vehicle,
          DriverBankAccount,
          DriverLicense,
          Trip,
          RideRequest,
          LoginHistory,
          DriverLocationHistory,
          Rating,
        ],
        synchronize: false,
        logging: false,
      }),
    }),
    AuthModule,
    RideModule,
    AdminModule,
    CustomersModule,
    DriversModule,
    UploadsModule,
  ],
})
export class AppModule {}
