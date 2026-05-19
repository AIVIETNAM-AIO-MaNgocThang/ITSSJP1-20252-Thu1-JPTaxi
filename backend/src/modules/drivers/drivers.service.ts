import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Driver, DriverJapaneseLevelEnum, DriverStatusType } from '../../entities/driver.entity';
import { Vehicle } from '../../entities/vehicle.entity';
import { DriverLicense } from '../../entities/driver-license.entity';
import { DriverBankAccount } from '../../entities/driver-bank-account.entity';
import { Trip, TripStatusType } from '../../entities/trip.entity';
import { UpdateDriverProfileDto } from './dto/update-driver-profile.dto';
import { UpdateBankAccountDto } from './dto/update-bank-account.dto';
import { DriverSearchSort, SearchDriversQueryDto } from './dto/search-drivers.query.dto';
import {
  buildNoDriversNotification,
  DriverSearchNotification,
} from './driver-search.messages';

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ApplyDriverDto } from './dto/apply-driver.dto';

const JAPANESE_LEVEL_RANK: Record<DriverJapaneseLevelEnum, number> = {
  [DriverJapaneseLevelEnum.N5]: 1,
  [DriverJapaneseLevelEnum.N4]: 2,
  [DriverJapaneseLevelEnum.N3]: 3,
  [DriverJapaneseLevelEnum.N2]: 4,
  [DriverJapaneseLevelEnum.N1]: 5,
  [DriverJapaneseLevelEnum.Native]: 6,
};

/** Khoảng cách (km) từ điểm tìm kiếm tới vị trí mới nhất của tài xế (Haversine). */
const HAVERSINE_KM_SQL = `(
  6371.0088 * acos(
    LEAST(1.0::double precision, GREATEST(-1.0::double precision,
      cos(radians(:searchLat::double precision))
      * cos(radians(latest.lat::double precision))
      * cos(radians(latest.lng::double precision) - radians(:searchLng::double precision))
      + sin(radians(:searchLat::double precision))
      * sin(radians(latest.lat::double precision))
    ))
  )
)`;

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

  private createDriverSearchQuery(
    q: SearchDriversQueryDto,
    radiusKm: number,
    maxAgeMin: number,
    applyOptionalFilters: boolean,
  ) {
    const qb = this.drivers
      .createQueryBuilder('d')
      .innerJoin(
        `(SELECT DISTINCT ON (driver_id) driver_id,
            latitude::double precision AS lat,
            longitude::double precision AS lng,
            recorded_at
          FROM driver_location_history
          ORDER BY driver_id, recorded_at DESC)`,
        'latest',
        'latest.driver_id = d.driver_id',
      )
      .innerJoin('vehicle', 'v', 'v.driver_id = d.driver_id')
      .leftJoin(
        `(SELECT t.driver_id, AVG(r.score)::float AS avg_score, COUNT(*)::int AS rating_cnt
          FROM trip t
          INNER JOIN rating r ON r.trip_id = t.trip_id
          WHERE t.status = 'completed'
          GROUP BY t.driver_id)`,
        'rt',
        'rt.driver_id = d.driver_id',
      )
      .where('d.status = :approved', { approved: DriverStatusType.approved })
      .andWhere(
        `latest.recorded_at >= NOW() - (INTERVAL '1 minute' * CAST(:maxAgeMin AS integer))`,
        { maxAgeMin },
      )
      .andWhere(`${HAVERSINE_KM_SQL} <= :radiusKm`, { radiusKm })
      .setParameters({ searchLat: q.lat, searchLng: q.lng });

    if (applyOptionalFilters) {
      if (q.vehicleType != null) {
        qb.andWhere('v.vehicle_type = :vehicleType', { vehicleType: q.vehicleType });
      }

      if (q.minJapaneseLevel != null) {
        qb.andWhere(
          `(CASE d.driver_japanese_level
            WHEN 'N5' THEN 1 WHEN 'N4' THEN 2 WHEN 'N3' THEN 3
            WHEN 'N2' THEN 4 WHEN 'N1' THEN 5 WHEN 'Native' THEN 6
          END) >= :minJapaneseRank`,
          { minJapaneseRank: JAPANESE_LEVEL_RANK[q.minJapaneseLevel] },
        );
      }

      if (q.minRating != null) {
        qb.andWhere('rt.avg_score IS NOT NULL AND rt.avg_score >= :minRating', {
          minRating: q.minRating,
        });
      }
    }

    return qb;
  }

  /**
   * Tìm tài xế đã duyệt, có phương tiện và có ít nhất một bản ghi vị trí gần đây,
   * trong bán kính km quanh (lat, lng), kèm lọc tùy chọn.
   */
  async searchDrivers(q: SearchDriversQueryDto) {
    const radiusKm = q.radiusKm ?? 10;
    const maxAgeMin = q.maxLocationAgeMinutes ?? 30;
    const limit = Math.min(q.limit ?? 20, 50);
    const sort = q.sort ?? DriverSearchSort.distance;

    const qb = this.createDriverSearchQuery(q, radiusKm, maxAgeMin, true);

    qb.select([
      'd.driver_id AS "driverId"',
      'd.last_name AS "lastName"',
      'd.first_name AS "firstName"',
      'd.avatar_url AS "avatarUrl"',
      'd.driver_japanese_level AS "japaneseLevel"',
      'v.vehicle_type AS "vehicleType"',
      'v.brand AS "vehicleBrand"',
      'v.color AS "vehicleColor"',
      'v.license_plate AS "licensePlate"',
      'latest.lat AS "latitude"',
      'latest.lng AS "longitude"',
      'latest.recorded_at AS "locationRecordedAt"',
      `${HAVERSINE_KM_SQL} AS "distanceKm"`,
      'rt.avg_score AS "averageRating"',
      'rt.rating_cnt AS "ratingCount"',
    ]);

    if (sort === DriverSearchSort.rating) {
      qb.orderBy('rt.avg_score', 'DESC', 'NULLS LAST').addOrderBy(HAVERSINE_KM_SQL, 'ASC');
    } else {
      qb.orderBy(HAVERSINE_KM_SQL, 'ASC');
    }

    qb.limit(limit);

    const rows = await qb.getRawMany<
      Record<string, string | number | Date | null>
    >();

    const drivers = rows.map((row) => ({
      driverId: Number(row.driverId),
      lastName: String(row.lastName ?? ''),
      firstName: String(row.firstName ?? ''),
      avatarUrl: row.avatarUrl != null ? String(row.avatarUrl) : null,
      japaneseLevel: String(row.japaneseLevel ?? ''),
      vehicle: {
        vehicleType: String(row.vehicleType ?? ''),
        brand: String(row.vehicleBrand ?? ''),
        color: String(row.vehicleColor ?? ''),
        licensePlate: String(row.licensePlate ?? ''),
      },
      location: {
        latitude: Number(row.latitude),
        longitude: Number(row.longitude),
        recordedAt: row.locationRecordedAt,
      },
      distanceKm: row.distanceKm != null ? Math.round(Number(row.distanceKm) * 1000) / 1000 : null,
      averageRating:
        row.averageRating != null ? Math.round(Number(row.averageRating) * 100) / 100 : null,
      ratingCount: row.ratingCount != null ? Number(row.ratingCount) : 0,
    }));

    const count = drivers.length;
    const hasResults = count > 0;

    let notification: DriverSearchNotification | null = null;
    if (!hasResults) {
      const driversInArea = await this.createDriverSearchQuery(
        q,
        radiusKm,
        maxAgeMin,
        false,
      ).getCount();
      notification = buildNoDriversNotification(q, driversInArea);
    }

    return {
      drivers,
      count,
      hasResults,
      notification,
    };
  }

  // ==================== LOGIC XÉT DUYỆT TÀI XẾ ====================
  async applyToBeDriver(userId: string, dto: ApplyDriverDto) {
    const driver = await this.drivers.findOne({ 
      where: { userId } 
    });

    if (!driver) {
      throw new NotFoundException('Driver profile not found');
    }

    // Kiểm tra điều kiện bắt buộc
    if (!dto.licenseNumber || !dto.vehiclePlate || !dto.vehicleType) {
      throw new BadRequestException('Missing required fields: licenseNumber, vehiclePlate, vehicleType');
    }

    driver.licenseNumber = dto.licenseNumber;
    driver.licenseType = dto.licenseType || driver.licenseType;
    driver.vehiclePlate = dto.vehiclePlate;
    driver.vehicleType = dto.vehicleType;
    driver.vehicleBrand = dto.vehicleBrand;
    driver.hasInsurance = dto.hasInsurance ?? false;
    driver.status = 'pending';
    driver.applicationDate = new Date();

    return await this.drivers.save(driver);
  }

  async approveDriver(
    driverId: string, 
    status: 'approved' | 'rejected', 
    reason?: string
  ) {
    const driver = await this.drivers.findOne({ 
      where: { id: driverId }   // hoặc driverId tùy theo entity
    });

    if (!driver) {
      throw new NotFoundException('Driver not found');
    }

    driver.status = status;
    driver.reviewedDate = new Date();
    
    if (status === 'rejected' && reason) {
      driver.rejectionReason = reason;
    }

    return await this.drivers.save(driver);
  }
}
