export const SAVED_PLACES_KEY = 'jpTaxiSavedPlaces';

const legacyPlaceholderAddresses = new Set(['', '123 Duong ABC', '456 Duong XYZ']);

export const defaultSavedPlaces = {
  work: {
    icon: '🕒',
    title: '職場',
    address: '184 Hoàng Quốc Việt, Hà Nội',
  },
  home: {
    icon: '🏠',
    title: '自宅',
    address: '222 Hoàng Văn Thái, Hà Nội',
  },
  favorite: {
    icon: '⭐',
    title: 'お気に',
    address: 'Đại học Bách khoa Hà Nội',
  },
};

function resolveAddress(storedAddress, fallbackAddress) {
  if (typeof storedAddress !== 'string' || legacyPlaceholderAddresses.has(storedAddress.trim())) {
    return fallbackAddress;
  }

  return storedAddress;
}

export function readSavedPlaces() {
  try {
    const stored = JSON.parse(window.localStorage.getItem(SAVED_PLACES_KEY) || '{}');

    return Object.fromEntries(
      Object.entries(defaultSavedPlaces).map(([key, place]) => [
        key,
        {
          ...place,
          ...(stored[key] ?? {}),
          icon: place.icon,
          title: place.title,
          address: resolveAddress(stored[key]?.address, place.address),
        },
      ]),
    );
  } catch {
    return defaultSavedPlaces;
  }
}

export function writeSavedPlaces(places) {
  window.localStorage.setItem(SAVED_PLACES_KEY, JSON.stringify(places));
}
