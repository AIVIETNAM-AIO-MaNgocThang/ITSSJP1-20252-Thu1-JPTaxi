const defaultUserLocation = {
  latitude: 21.02878,
  longitude: 105.85204,
};

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

export function getCurrentPosition() {
  if (!navigator.geolocation) {
    return Promise.resolve(defaultUserLocation);
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        });
      },
      () => resolve(defaultUserLocation),
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 7000 },
    );
  });
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

  const displayParts = String(result.display_name ?? '').split(',').map((part) => part.trim()).filter(Boolean);
  const namedetails = result.namedetails ?? {};
  const japaneseName = namedetails['name:ja'] || namedetails['official_name:ja'] || namedetails['alt_name:ja'];

  return {
    name: japaneseName || result.name || displayParts[0] || address,
    address: displayParts.slice(1, 4).join(', ') || result.display_name || address,
    position: [latitude, longitude],
  };
}

export async function buildSelectedRoute(destination, pickup = defaultUserLocation) {
  const [destinationLat, destinationLng] = destination.position;
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

  return {
    destination,
    pickup: {
      name: '現在位置',
      position: [pickup.latitude, pickup.longitude],
    },
    routePath: routePath.length ? routePath : [[pickup.latitude, pickup.longitude], destination.position],
    routeMetrics: {
      distance: formatDistance(distance),
      duration: formatDuration(duration, distance),
      fare: estimateFare(distance),
    },
  };
}
