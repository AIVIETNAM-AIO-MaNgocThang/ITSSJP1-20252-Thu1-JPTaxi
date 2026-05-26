const defaultUserLocation = {
  latitude: 21.02878,
  longitude: 105.85204,
};

export const LONG_ROUTE_THRESHOLD_METERS = 30000;
export const MAX_ROUTE_DISTANCE_METERS = 70000;

export function getRouteDistanceStatus(meters = 0) {
  return {
    distanceMeters: meters,
    isLongDistance: meters >= LONG_ROUTE_THRESHOLD_METERS && meters <= MAX_ROUTE_DISTANCE_METERS,
    isTooFar: meters > MAX_ROUTE_DISTANCE_METERS,
  };
}

export function estimateStraightLineDistanceMeters(from, to) {
  const fromLat = Number(from?.latitude ?? from?.[0]);
  const fromLng = Number(from?.longitude ?? from?.[1]);
  const toLat = Number(to?.latitude ?? to?.[0]);
  const toLng = Number(to?.longitude ?? to?.[1]);

  if (![fromLat, fromLng, toLat, toLng].every(Number.isFinite)) {
    return 0;
  }

  const earthRadiusMeters = 6371000;
  const toRadians = (value) => (value * Math.PI) / 180;
  const latDelta = toRadians(toLat - fromLat);
  const lngDelta = toRadians(toLng - fromLng);
  const a = Math.sin(latDelta / 2) ** 2
    + Math.cos(toRadians(fromLat)) * Math.cos(toRadians(toLat)) * Math.sin(lngDelta / 2) ** 2;

  return 2 * earthRadiusMeters * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDuration(seconds, meters = 0) {
  const baseMinutes = Math.max(1, Math.round(seconds / 60));
  const distanceKm = Math.max(0, meters / 1000);
  const trafficBufferMinutes = Math.max(3, Math.round(distanceKm * 1.2));

  return `${baseMinutes + trafficBufferMinutes}分`;
}

function formatDistance(meters) {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }

  return `${Math.round(meters)} m`;
}

function estimateFare(meters) {
  const km = meters / 1000;
  return `¥${Math.max(680, Math.round((420 + km * 85) / 10) * 10)}`;
}

function parseDisplayAddress(result, fallback) {
  const displayParts = String(result?.display_name ?? '').split(',').map((part) => part.trim()).filter(Boolean);

  return {
    name: result?.name || displayParts.slice(0, 2).join(', ') || fallback,
    address: displayParts.slice(0, 5).join(', ') || result?.display_name || fallback,
  };
}

export function getCurrentPosition({ allowFallback = true, maximumAge = 0, timeout = 12000 } = {}) {
  if (!navigator.geolocation) {
    if (allowFallback) return Promise.resolve(defaultUserLocation);
    return Promise.reject(new Error('geolocation unavailable'));
  }

  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      (error) => {
        if (allowFallback) {
          resolve(defaultUserLocation);
          return;
        }

        reject(error);
      },
      { enableHighAccuracy: true, maximumAge, timeout },
    );
  });
}

export async function reverseGeocodePosition(position) {
  const params = new URLSearchParams({
    'accept-language': 'ja,vi;q=0.8,en;q=0.6',
    format: 'json',
    lat: String(position.latitude),
    lon: String(position.longitude),
    zoom: '18',
    addressdetails: '1',
  });
  const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`);

  if (!response.ok) {
    throw new Error('reverse geocode failed');
  }

  const result = await response.json();
  const parsed = parseDisplayAddress(result, '現在位置');

  return {
    ...position,
    name: parsed.name,
    address: parsed.address,
    position: [position.latitude, position.longitude],
  };
}

export async function geocodePlace(address) {
  const params = new URLSearchParams({
    'accept-language': 'ja,vi;q=0.8,en;q=0.6',
    format: 'json',
    limit: '1',
    addressdetails: '1',
    namedetails: '1',
    q: address,
  });
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);

  if (!response.ok) {
    throw new Error('geocode failed');
  }

  const [result] = await response.json();
  const latitude = Number(result?.lat);
  const longitude = Number(result?.lon);

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    throw new Error('place not found');
  }

  const namedetails = result.namedetails ?? {};
  const japaneseName = namedetails['name:ja'] || namedetails['official_name:ja'] || namedetails['alt_name:ja'];
  const parsed = parseDisplayAddress(result, address);

  return {
    name: japaneseName || parsed.name,
    address: parsed.address,
    position: [latitude, longitude],
  };
}

export async function buildSelectedRoute(destination, pickup = defaultUserLocation) {
  const [destinationLat, destinationLng] = destination.position;
  const directDistance = estimateStraightLineDistanceMeters(pickup, destination.position);
  const directDistanceStatus = getRouteDistanceStatus(directDistance);

  if (directDistanceStatus.isTooFar) {
    return {
      destination,
      pickup: {
        name: pickup.address || pickup.name || '現在位置',
        address: pickup.address || pickup.name || '現在位置',
        position: [pickup.latitude, pickup.longitude],
        accuracy: pickup.accuracy,
      },
      routePath: [[pickup.latitude, pickup.longitude], destination.position],
      routeMetrics: {
        distance: formatDistance(directDistance),
        distanceMeters: directDistance,
        duration: '--',
        fare: '--',
        isLongDistance: false,
        isTooFar: true,
      },
    };
  }

  const url = [
    'https://router.project-osrm.org/route/v1/driving',
    `${pickup.longitude},${pickup.latitude};${destinationLng},${destinationLat}`,
  ].join('/');
  const params = new URLSearchParams({
    overview: 'full',
    geometries: 'geojson',
    steps: 'true',
  });
  const response = await fetch(`${url}?${params.toString()}`);

  if (!response.ok) {
    throw new Error('route failed');
  }

  const data = await response.json();
  const route = data?.routes?.[0];
  const coordinates = route?.geometry?.coordinates ?? [];
  const routePath = coordinates.map(([lng, lat]) => [lat, lng]);
  const distance = Number(route?.distance ?? 0);
  const duration = Number(route?.duration ?? 0);
  const routeDistanceStatus = getRouteDistanceStatus(distance);

  return {
    destination,
    pickup: {
      name: pickup.address || pickup.name || '現在位置',
      address: pickup.address || pickup.name || '現在位置',
      position: [pickup.latitude, pickup.longitude],
      accuracy: pickup.accuracy,
    },
    routePath: routePath.length ? routePath : [[pickup.latitude, pickup.longitude], destination.position],
    routeMetrics: {
      distance: formatDistance(distance),
      distanceMeters: routeDistanceStatus.distanceMeters,
      duration: formatDuration(duration, distance),
      fare: estimateFare(distance),
      isLongDistance: routeDistanceStatus.isLongDistance,
      isTooFar: routeDistanceStatus.isTooFar,
    },
  };
}
