import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Customer } from '../../entities/customer.entity';
import { Driver } from '../../entities/driver.entity';
import { RideRequest, RideRequestStatusType } from '../../entities/ride-request.entity';
import { Trip, TripStatusType } from '../../entities/trip.entity';
import { Vehicle, VehicleTypeEnum } from '../../entities/vehicle.entity';

type CurrentRideQuery = {
  customerId?: number;
  driverId?: number;
};

type RideRow = {
  tripId: number | string;
  requestId: number | string;
  tripStatus: TripStatusType;
  requestStatus: RideRequestStatusType;
  pickupAddress: string;
  dropoffAddress: string;
  actualPassengerName: string | null;
  actualPassengerPhone: string | null;
  noteToDriver: string | null;
  startTime: Date;
  endTime: Date | null;
  distanceKm: string;
  finalFareVnd: number | string;
  finalFareJpy: number | string;
  customerId: number | string;
  customerLastName: string;
  customerFirstName: string;
  customerPhone: string;
  driverId: number | string;
  driverLastName: string;
  driverFirstName: string;
  driverPhone: string;
  driverAvatarUrl: string | null;
  vehicleBrand: string | null;
  vehicleColor: string | null;
  licensePlate: string | null;
  vehicleType: string | null;
};

@Injectable()
export class RideService {
  constructor(
    @InjectRepository(Trip)
    private readonly trips: Repository<Trip>,
    @InjectRepository(RideRequest)
    private readonly rideRequests: Repository<RideRequest>,
    @InjectRepository(Customer)
    private readonly customers: Repository<Customer>,
    @InjectRepository(Driver)
    private readonly drivers: Repository<Driver>,
    @InjectRepository(Vehicle)
    private readonly vehicles: Repository<Vehicle>,
    private readonly dataSource: DataSource,
  ) {}

  private mapRide(row: RideRow) {
    const isCancelled = row.tripStatus === TripStatusType.cancelled_by_admin;

    return {
      tripId: Number(row.tripId),
      requestId: Number(row.requestId),
      status: isCancelled ? 'cancelled' : row.tripStatus,
      requestStatus: row.requestStatus,
      cancelledBy: isCancelled ? 'driver' : null,
      route: {
        pickupAddress: row.pickupAddress,
        dropoffAddress: row.dropoffAddress,
      },
      passenger: {
        customerId: Number(row.customerId),
        name:
          row.actualPassengerName ||
          `${row.customerLastName} ${row.customerFirstName}`.trim(),
        phone: row.actualPassengerPhone || row.customerPhone,
        noteToDriver: row.noteToDriver,
      },
      driver: {
        driverId: Number(row.driverId),
        name: `${row.driverLastName} ${row.driverFirstName}`.trim(),
        phone: row.driverPhone,
        avatarUrl: row.driverAvatarUrl,
      },
      vehicle: {
        brand: row.vehicleBrand,
        color: row.vehicleColor,
        licensePlate: row.licensePlate,
        vehicleType: row.vehicleType,
      },
      trip: {
        startTime: row.startTime,
        endTime: row.endTime,
        distanceKm: Number(row.distanceKm),
        finalFareVnd: Number(row.finalFareVnd),
        finalFareJpy: Number(row.finalFareJpy),
      },
    };
  }

  private baseRideQuery() {
    return this.trips
      .createQueryBuilder('t')
      .innerJoin('ride_request', 'rr', 'rr.request_id = t.request_id')
      .innerJoin('customer', 'c', 'c.customer_id = rr.customer_id')
      .innerJoin('driver', 'd', 'd.driver_id = t.driver_id')
      .leftJoin('vehicle', 'v', 'v.driver_id = d.driver_id')
      .select([
        't.trip_id AS "tripId"',
        'rr.request_id AS "requestId"',
        't.status AS "tripStatus"',
        'rr.status AS "requestStatus"',
        'rr.pickup_address AS "pickupAddress"',
        'rr.dropoff_address AS "dropoffAddress"',
        'rr.actual_passenger_name AS "actualPassengerName"',
        'rr.actual_passenger_phone AS "actualPassengerPhone"',
        'rr.note_to_driver AS "noteToDriver"',
        't.start_time AS "startTime"',
        't.end_time AS "endTime"',
        't.actual_distance_km AS "distanceKm"',
        't.final_fare_vnd AS "finalFareVnd"',
        't.final_fare_jpy AS "finalFareJpy"',
        'c.customer_id AS "customerId"',
        'c.last_name AS "customerLastName"',
        'c.first_name AS "customerFirstName"',
        'c.phone AS "customerPhone"',
        'd.driver_id AS "driverId"',
        'd.last_name AS "driverLastName"',
        'd.first_name AS "driverFirstName"',
        'd.phone AS "driverPhone"',
        'd.avatar_url AS "driverAvatarUrl"',
        'v.brand AS "vehicleBrand"',
        'v.color AS "vehicleColor"',
        'v.license_plate AS "licensePlate"',
        'v.vehicle_type AS "vehicleType"',
      ])
      .andWhere('t.status IN (:...statuses)', {
        statuses: [TripStatusType.ongoing, TripStatusType.cancelled_by_admin],
      });
  }

  async getCurrentRide(query: CurrentRideQuery) {
    const qb = this.baseRideQuery().orderBy('t.start_time', 'DESC');

    if (query.customerId != null) {
      qb.andWhere('rr.customer_id = :customerId', { customerId: query.customerId });
    }

    if (query.driverId != null) {
      qb.andWhere('t.driver_id = :driverId', { driverId: query.driverId });
    }

    const row = await qb.getRawOne<RideRow>();
    return row ? this.mapRide(row) : null;
  }

  async getRideByTripId(tripId: number) {
    const row = await this.baseRideQuery()
      .andWhere('t.trip_id = :tripId', { tripId })
      .getRawOne<RideRow>();

    if (!row) {
      throw new NotFoundException('Ride not found');
    }

    return this.mapRide(row);
  }

  async cancelByDriver(tripId: number) {
    const trip = await this.trips.findOne({
      where: { tripId },
      relations: ['rideRequest'],
    });

    if (!trip) {
      throw new NotFoundException('Ride not found');
    }

    if (trip.status === TripStatusType.ongoing) {
      trip.status = TripStatusType.cancelled_by_admin;
      trip.endTime = new Date();
      trip.rideRequest.status = RideRequestStatusType.failed;
      await this.rideRequests.save(trip.rideRequest);
      await this.trips.save(trip);
    }

    return this.getRideByTripId(tripId);
  }

  private async findWaitingRequest(customerId: number) {
    return this.rideRequests
      .createQueryBuilder('rr')
      .leftJoin('trip', 't', 't.request_id = rr.request_id')
      .where('rr.customer_id = :customerId', { customerId })
      .andWhere('rr.status IN (:...statuses)', {
        statuses: [
          RideRequestStatusType.pending,
          RideRequestStatusType.searching,
          RideRequestStatusType.assigned,
        ],
      })
      .andWhere('t.trip_id IS NULL')
      .orderBy('rr.request_time', 'DESC')
      .getOne();
  }

  private async createDemoSearchRequest(customerId: number, driverId = 1) {
    const customer = await this.customers.findOne({ where: { customerId } });
    if (!customer) {
      throw new NotFoundException('Demo customer not found');
    }

    const driver = await this.drivers.findOne({ where: { driverId } });
    if (!driver) {
      throw new NotFoundException('Demo driver not found');
    }

    const vehicle = await this.vehicles.findOne({ where: { driverId } });
    const request = await this.rideRequests.save(
      this.rideRequests.create({
        customerId,
        pickupAddress: 'Hoan Kiem Lake, Hanoi',
        pickupLat: '21.02851100',
        pickupLng: '105.85200000',
        dropoffAddress: 'Lotte Hotel Hanoi',
        dropoffLat: '21.03212000',
        dropoffLng: '105.81232000',
        vehicleType: vehicle?.vehicleType ?? VehicleTypeEnum.Four,
        actualPassengerName: null,
        actualPassengerPhone: null,
        requestTime: new Date(),
        status: RideRequestStatusType.searching,
        noteToDriver: 'Demo search flow',
      }),
    );

    await this.dataSource.query(
      `INSERT INTO ride_request_dispatch (
        request_id, driver_id, attempt_number, status, sent_at, responded_at
      ) VALUES ($1, $2, 1, 'pending', CURRENT_TIMESTAMP, NULL)`,
      [request.requestId, driverId],
    );

    return request;
  }

  async startDemoSearch(customerId = 1, driverId = 1) {
    const current = await this.getCurrentRide({ customerId, driverId });
    if (current?.status === TripStatusType.ongoing) {
      return { status: 'accepted', ride: current };
    }

    const waiting = await this.findWaitingRequest(customerId);
    const request = waiting ?? (await this.createDemoSearchRequest(customerId, driverId));

    return {
      status: request.status,
      requestId: request.requestId,
    };
  }

  async cancelDemoSearch(customerId = 1) {
    await this.dataSource.query(
      `UPDATE ride_request rr
      SET status = 'failed'
      WHERE rr.customer_id = $1
        AND rr.status IN ('pending', 'searching', 'assigned')
        AND NOT EXISTS (
          SELECT 1 FROM trip t WHERE t.request_id = rr.request_id
        )`,
      [customerId],
    );

    return { status: 'cancelled' };
  }

  async ensureDemoRide(customerId = 1, driverId = 1) {
    const current = await this.getCurrentRide({ customerId, driverId });
    if (current?.status === TripStatusType.ongoing) {
      return current;
    }

    const customer = await this.customers.findOne({ where: { customerId } });
    const driver = await this.drivers.findOne({ where: { driverId } });
    if (!customer || !driver) {
      throw new NotFoundException('Demo customer or driver not found');
    }

    const request =
      (await this.findWaitingRequest(customerId)) ??
      (await this.createDemoSearchRequest(customerId, driverId));

    request.status = RideRequestStatusType.assigned;
    await this.rideRequests.save(request);

    await this.dataSource.query(
      `UPDATE ride_request_dispatch
      SET status = 'accepted', responded_at = CURRENT_TIMESTAMP
      WHERE request_id = $1 AND driver_id = $2`,
      [request.requestId, driverId],
    );

    const trip = await this.trips.save(
      this.trips.create({
        rideRequest: request,
        driverId,
        startTime: new Date(),
        endTime: null,
        actualDistanceKm: '4.80',
        exchangeRateVndToJpy: '0.0062',
        finalFareVnd: 98000,
        finalFareJpy: 608,
        rawFareVnd: 98000,
        status: TripStatusType.ongoing,
      }),
    );

    return this.getRideByTripId(trip.tripId);
  }
}
