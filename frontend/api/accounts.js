import { apiRequest, API_BASE } from './client.js';

const DEFAULT_CUSTOMER_ID = 1;
const DEFAULT_DRIVER_ID = 1;

function idFromEmail(prefix, fallback) {
  const activeRole = sessionStorage.getItem('jpTaxiActiveRole') || localStorage.getItem('jpTaxiRole');
  const roleEmail = activeRole === 'driver'
    ? localStorage.getItem('jpTaxiDriverEmail')
    : localStorage.getItem('jpTaxiCustomerEmail');
  const email = roleEmail || localStorage.getItem('jpTaxiUserEmail') || '';
  const match = email.match(new RegExp(`^${prefix}(\\d+)@`, 'i'));
  return match ? Number(match[1]) : fallback;
}

export function getCurrentCustomerId() {
  return Number(localStorage.getItem('jpTaxiCustomerId')) || idFromEmail('customer', DEFAULT_CUSTOMER_ID);
}

export function getCurrentDriverId() {
  return Number(localStorage.getItem('jpTaxiDriverId')) || idFromEmail('driver', DEFAULT_DRIVER_ID);
}

export function getCustomerProfile(customerId = getCurrentCustomerId()) {
  return apiRequest(`/customers/${customerId}/profile`);
}

export function toStoredAssetUrl(url) {
  if (!url) return url;
  const apiOrigin = API_BASE.replace(/\/api$/, '');
  if (url.startsWith(apiOrigin)) return url.slice(apiOrigin.length);
  return url;
}

function normalizeProfilePayload(payload) {
  if (!payload || payload.avatarUrl === undefined) return payload;
  return {
    ...payload,
    avatarUrl: toStoredAssetUrl(payload.avatarUrl),
  };
}

export function updateCustomerProfile(payload, customerId = getCurrentCustomerId()) {
  return apiRequest(`/customers/${customerId}/profile`, {
    method: 'PUT',
    body: JSON.stringify(normalizeProfilePayload(payload)),
  });
}

export function getDriverProfile(driverId = getCurrentDriverId()) {
  return apiRequest(`/drivers/${driverId}/profile`);
}

export function updateDriverProfile(payload, driverId = getCurrentDriverId()) {
  return apiRequest(`/drivers/${driverId}/profile`, {
    method: 'PUT',
    body: JSON.stringify(normalizeProfilePayload(payload)),
  });
}

export function updateDriverBankAccount(payload, driverId = getCurrentDriverId()) {
  return apiRequest(`/drivers/${driverId}/bank-account`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function updateDriverDocuments(payload, driverId = getCurrentDriverId()) {
  return apiRequest(`/drivers/${driverId}/documents`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function resolveAssetUrl(url) {
  if (!url) return '';
  return url.startsWith('http') ? url : `${API_BASE.replace(/\/api$/, '')}${url}`;
}

export async function uploadAvatar(file) {
  const formData = new FormData();
  formData.append('file', file);
  const result = await apiRequest('/uploads/avatar', {
    method: 'POST',
    body: formData,
  });
  if (!result?.url) return null;
  return result.url;
}

export async function uploadDriverDocument(documentType, file) {
  const formData = new FormData();
  formData.append('file', file);
  const result = await apiRequest(`/uploads/drivers/${documentType}`, {
    method: 'POST',
    body: formData,
  });
  return result?.url || null;
}
