const ACTIVE_REQUEST_STATUSES = new Set(['pending', 'searching']);
const ACCEPTED_RIDE_GRACE_MS = 2 * 60 * 1000;
const PAYMENT_CONFIRMED_GRACE_MS = 2 * 60 * 1000;

export function hasRecentAcceptedRide() {
  try {
    const acceptedRide = JSON.parse(localStorage.getItem('jpTaxiRideAccepted') || 'null');
    const tripId = Number(acceptedRide?.tripId);
    const acceptedAt = Number(acceptedRide?.acceptedAt);
    return Boolean(
      tripId
      && acceptedAt
      && Date.now() - acceptedAt < ACCEPTED_RIDE_GRACE_MS,
    );
  } catch {
    return false;
  }
}

export function clearCompletedRideSession() {
  sessionStorage.removeItem('jpTaxiRideRequestId');
  sessionStorage.removeItem('jpTaxiActiveRequestId');
  localStorage.removeItem('jpTaxiRideAccepted');
  localStorage.removeItem('jpTaxiPaymentRequested');
  localStorage.removeItem('jpTaxiFallbackRide');
}

export function clearCompletedRideBookingState() {
  clearCompletedRideSession();
  sessionStorage.removeItem('jpTaxiSelectedRoute');
  sessionStorage.removeItem('jpTaxiPendingDestination');
}

function pathMatches(pathname, prefixes) {
  return prefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function readPaymentRequestTripId() {
  try {
    const paymentRequest = JSON.parse(localStorage.getItem('jpTaxiPaymentRequested') || 'null');
    return Number(paymentRequest?.tripId) || null;
  } catch {
    return null;
  }
}

function hasRecentlyConfirmedPayment(tripId) {
  try {
    const completedPayment = JSON.parse(localStorage.getItem('jpTaxiPaymentCompleted') || 'null');
    const completedTripId = Number(completedPayment?.tripId);
    const completedAt = Number(completedPayment?.completedAt);
    const isRecent = Boolean(
      tripId
      && completedTripId === Number(tripId)
      && completedAt
      && Date.now() - completedAt < PAYMENT_CONFIRMED_GRACE_MS,
    );
    if (!isRecent && completedAt) {
      localStorage.removeItem('jpTaxiPaymentCompleted');
    }
    return isRecent;
  } catch {
    return false;
  }
}

function buildStoredRoute(activeRide) {
  const trip = activeRide?.data;
  const request = trip?.rideRequest;
  if (!request) return null;

  const pickupPosition = [Number(request.pickupLat), Number(request.pickupLng)];
  const destinationPosition = [Number(request.dropoffLat), Number(request.dropoffLng)];
  if ([...pickupPosition, ...destinationPosition].some((coordinate) => !Number.isFinite(coordinate))) {
    return null;
  }

  const distanceKm = Number(trip.actualDistanceKm);
  const passenger = trip.passenger ?? {};
  const driverLocation = trip.driver?.location
    ? {
        latitude: Number(trip.driver.location.latitude),
        longitude: Number(trip.driver.location.longitude),
        recordedAt: trip.driver.location.recordedAt,
      }
    : null;

  return {
    pickup: {
      name: request.pickupAddress,
      position: pickupPosition,
    },
    destination: {
      name: request.dropoffAddress,
      address: request.dropoffAddress,
      position: destinationPosition,
    },
    routeMetrics: {
      duration: '--',
      distance: Number.isFinite(distanceKm) ? `${distanceKm.toFixed(1)} km` : '-- km',
      fare: trip.finalFareJpy ? `¥${trip.finalFareJpy.toLocaleString()}` : '',
    },
    routePath: [],
    driver: {
      ...(trip.driver || {}),
      location: driverLocation,
    },
    passenger: {
      customerId: passenger.customerId ?? request.customerId,
      name: passenger.name,
      phone: passenger.phone,
      avatarUrl: passenger.avatarUrl,
    },
  };
}

export function hasOutstandingPayment(activeRide) {
  if (activeRide?.type !== 'trip') return false;
  const activeTripId = Number(activeRide.data?.tripId);
  if (hasRecentlyConfirmedPayment(activeTripId)) return false;
  if (activeRide.paymentRequested) return true;

  return Boolean(activeTripId && readPaymentRequestTripId() === activeTripId);
}

export function syncActiveRideSession(activeRide) {
  if (!activeRide?.data) {
    if (hasRecentAcceptedRide()) return;
    clearCompletedRideSession();
    return;
  }

  if (activeRide.type === 'request') {
    if (activeRide.data.requestId) {
      sessionStorage.setItem('jpTaxiRideRequestId', String(activeRide.data.requestId));
    }
    sessionStorage.removeItem('jpTaxiTripId');
    return;
  }

  if (activeRide.type !== 'trip') return;

  const trip = activeRide.data;
  const requestId = trip.rideRequest?.requestId ?? trip.requestId;
  if (requestId) {
    sessionStorage.setItem('jpTaxiRideRequestId', String(requestId));
  }
  if (trip.tripId) {
    sessionStorage.setItem('jpTaxiTripId', String(trip.tripId));
  }
  if (activeRide.paymentRequested && trip.tripId && !hasRecentlyConfirmedPayment(trip.tripId)) {
    localStorage.setItem('jpTaxiPaymentRequested', JSON.stringify({
      tripId: trip.tripId,
      requestedAt: Date.now(),
    }));
  }

  if (!sessionStorage.getItem('jpTaxiSelectedRoute')) {
    const storedRoute = buildStoredRoute(activeRide);
    if (storedRoute) {
      sessionStorage.setItem('jpTaxiSelectedRoute', JSON.stringify(storedRoute));
    }
  }
}

export function getRideContinuationPath(role, activeRide) {
  if (role === 'customer') {
    if (activeRide?.type === 'request' && ACTIVE_REQUEST_STATUSES.has(activeRide.data?.status)) {
      return '/search-car';
    }
    if (activeRide?.type === 'trip') {
      return hasOutstandingPayment(activeRide) ? '/payment' : '/ride-status';
    }
  }

  if (role === 'driver' && activeRide?.type === 'trip') {
    return '/driver-ride-status';
  }

  return null;
}

export function getActiveRideRedirect(role, activeRide, pathname) {
  if (role === 'driver' && !activeRide && pathMatches(pathname, ['/driver-ride-status'])) {
    if (hasRecentAcceptedRide()) return null;
    return '/driver-home';
  }

  if (activeRide?.type !== 'trip') return null;

  if (role === 'customer') {
    const activeTripId = Number(activeRide.data?.tripId);
    if (pathMatches(pathname, ['/driver-review']) && hasRecentlyConfirmedPayment(activeTripId)) {
      return null;
    }
    if (hasOutstandingPayment(activeRide)) {
      return pathMatches(pathname, ['/payment']) ? null : '/payment';
    }
    const allowedPaths = ['/home', '/ride-status', '/messages', '/user-info'];
    return pathMatches(pathname, allowedPaths)
      ? null
      : '/ride-status';
  }

  if (role === 'driver') {
    const allowedPaths = ['/driver-home', '/driver-ride-status', '/driver-invoice', '/messages', '/driver-info'];
    return pathMatches(pathname, allowedPaths) ? null : '/driver-ride-status';
  }

  return null;
}
