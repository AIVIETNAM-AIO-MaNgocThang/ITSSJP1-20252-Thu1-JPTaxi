import { apiRequest } from './client.js';

const DEFAULT_CUSTOMER_ID = 1;
const DEFAULT_DRIVER_ID = 1;
const FALLBACK_RIDE_KEY = 'jpTaxiFallbackRide';

function idFromEmail(prefix, fallback) {
  const email = localStorage.getItem('jpTaxiUserEmail') || '';
  const match = email.match(new RegExp(`^${prefix}(\\d+)@`, 'i'));
  return match ? Number(match[1]) : fallback;
}

export function getCurrentCustomerId() {
  return idFromEmail('customer', DEFAULT_CUSTOMER_ID);
}

export function getCurrentDriverId() {
  return idFromEmail('driver', DEFAULT_DRIVER_ID);
}

export function getCurrentRideForCustomer(customerId = getCurrentCustomerId()) {
  return apiRequest(`/ride/current?customerId=${customerId}`);
}

export function getCurrentRideForDriver(driverId = getCurrentDriverId()) {
  return apiRequest(`/ride/current?driverId=${driverId}`);
}

export function ensureDemoRide(
  customerId = DEFAULT_CUSTOMER_ID,
  driverId = DEFAULT_DRIVER_ID,
) {
  return apiRequest(`/ride/demo?customerId=${customerId}&driverId=${driverId}`, {
    method: 'POST',
  });
}

export function startDemoSearch(
  customerId = DEFAULT_CUSTOMER_ID,
  driverId = DEFAULT_DRIVER_ID,
) {
  return apiRequest(`/ride/search-demo?customerId=${customerId}&driverId=${driverId}`, {
    method: 'POST',
  });
}

export function cancelDemoSearch(customerId = DEFAULT_CUSTOMER_ID) {
  return apiRequest(`/ride/search-demo/cancel?customerId=${customerId}`, {
    method: 'POST',
  });
}

export function cancelRideByDriver(tripId) {
  return apiRequest(`/ride/${tripId}/cancel-by-driver`, {
    method: 'POST',
  });
}

function buildFallbackRide(status = 'ongoing') {
  return {
    tripId: 1,
    requestId: 1,
    status,
    requestStatus: status === 'cancelled' ? 'failed' : 'assigned',
    cancelledBy: status === 'cancelled' ? 'driver' : null,
    route: {
      pickupAddress: 'Hoan Kiem Lake, Hanoi',
      dropoffAddress: 'Lotte Hotel Hanoi',
    },
    passenger: {
      customerId: DEFAULT_CUSTOMER_ID,
      name: 'JPTX-9821',
      phone: '090-1234-5678',
      noteToDriver: null,
    },
    driver: {
      driverId: DEFAULT_DRIVER_ID,
      name: 'JP Taxi Driver',
      phone: '070-0000-0001',
      avatarUrl: null,
    },
    vehicle: {
      brand: 'Toyota',
      color: 'Black',
      licensePlate: '31A-101.01',
      vehicleType: '4',
    },
    trip: {
      startTime: new Date().toISOString(),
      endTime: status === 'cancelled' ? new Date().toISOString() : null,
      distanceKm: 4.8,
      finalFareVnd: 98000,
      finalFareJpy: 608,
    },
  };
}

export function setFallbackAcceptedRide() {
  const ride = buildFallbackRide('ongoing');
  localStorage.setItem(FALLBACK_RIDE_KEY, JSON.stringify(ride));
  return ride;
}

export function getFallbackRide() {
  try {
    const raw = localStorage.getItem(FALLBACK_RIDE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function cancelFallbackRide() {
  const ride = buildFallbackRide('cancelled');
  localStorage.setItem(FALLBACK_RIDE_KEY, JSON.stringify(ride));
  return ride;
}

export function clearFallbackRide() {
  localStorage.removeItem(FALLBACK_RIDE_KEY);
}
