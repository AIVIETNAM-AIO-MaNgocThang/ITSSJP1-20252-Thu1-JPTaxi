import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver } from '../../entities/driver.entity';
import { Vehicle } from '../../entities/vehicle.entity';
import { DriverLicense } from '../../entities/driver-license.entity';
import { DriverBankAccount } from '../../entities/driver-bank-account.entity';
import { Trip, TripStatusType } from '../../entities/trip.entity';
import { UpdateDriverProfileDto } from './dto/update-driver-profile.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';

@Injectable()
export class DriversService {
  constructor(
    @InjectRepository(Driver)
    private readonly drivers: Repository<Driver>,
    @InjectRepository(Vehicle)
    private readonly vehicles: Repository<Vehicle>,
    @InjectRepository(DriverLicense)
    private readonly licenses: Repository<DriverLicense>,
    @InjectRepository(DriverBankAccount)
    private readonly banks: Repository<DriverBankAccount>,
    @InjectRepository(Trip)
    private readonly trips: Repository<Trip>,
  ) {}

  private mapTripStatus(s: TripStatusType): string {
    if (s === TripStatusType.completed) return 'completed';
    if (s === TripStatusType.ongoing) return 'ongoing';
    return 'cancelled';
  }

  async getProfile(driverId: number) {
    const d = await this.drivers.findOne({ where: { driverId } });
    if (!d) throw new NotFoundException();

    const vehicle = await this.vehicles.findOne({ where: { driverId } });
    const licenseRows = await this.licenses.find({ where: { driverId } });
    const bank = await this.banks.findOne({ where: { driverId } });
    const tripRows = await this.trips.find({
      where: { driverId },
      relations: ['rideRequest'],
      order: { startTime: 'DESC' },
      take: 20,
    });

    return {
      lastName: d.lastName,
      firstName: d.firstName,
      nationality: d.nationality,
      phone: d.phone,
      email: d.email,
      japaneseLevel: d.driverJapaneseLevel,
      birthDate: d.birthDate,
      gender: d.gender,
      idNumber: d.idNumber,
      avatarUrl: d.avatarUrl,
      vehicle: vehicle
        ? {
            brand: vehicle.brand,
            color: vehicle.color,
            licensePlate: vehicle.licensePlate,
            vehicleType: vehicle.vehicleType,
          }
        : null,
      licenses: licenseRows.map((l) => ({
        licenseType: l.licenseType,
        issueDate: l.issueDate,
        expiryDate: l.expiryDate,
      })),
      bankAccount: bank
        ? {
            bankName: bank.bankName,
            accountNumber: bank.accountNumber,
            accountHolder: bank.accountHolder,
          }
        : null,
      trips: tripRows.map((t) => ({
        status: this.mapTripStatus(t.status),
        pickupAddress: t.rideRequest.pickupAddress,
        dropoffAddress: t.rideRequest.dropoffAddress,
        startTime: t.startTime,
        distanceKm: Number(t.actualDistanceKm),
        finalFareJpy: t.finalFareJpy,
        finalFareVnd: t.finalFareVnd,
      })),
    };
  }

  async updateProfile(driverId: number, dto: UpdateDriverProfileDto) {
    const d = await this.drivers.findOne({ where: { driverId } });
    if (!d) throw new NotFoundException();
    d.lastName = dto.lastName;
    d.firstName = dto.firstName;
    d.gender = dto.gender;
    if (dto.birthDate != null && dto.birthDate !== '') {
      d.birthDate = dto.birthDate.slice(0, 10);
    }
    d.phone = dto.phone;
    d.email = dto.email;
    d.nationality = dto.nationality;
    if (dto.idNumber !== undefined) d.idNumber = dto.idNumber;
    d.driverJapaneseLevel = dto.japaneseLevel;
    if (dto.avatarUrl !== undefined) d.avatarUrl = dto.avatarUrl;
    await this.drivers.save(d);
    return this.getProfile(driverId);
  }

  async updateBankAccount(driverId: number, dto: UpdateBankAccountDto) {
    const d = await this.drivers.findOne({ where: { driverId } });
    if (!d) throw new NotFoundException();
    let row = await this.banks.findOne({ where: { driverId } });
    if (!row) {
      row = this.banks.create({
        driverId,
        bankName: dto.bankName,
        accountNumber: dto.accountNumber,
        accountHolder: dto.accountHolder,
      });
    } else {
      row.bankName = dto.bankName;
      row.accountNumber = dto.accountNumber;
      row.accountHolder = dto.accountHolder;
    }
    await this.banks.save(row);
    return this.getProfile(driverId);
  }
}
