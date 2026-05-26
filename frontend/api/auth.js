import { apiRequest } from './client.js';

/** POST /api/login — khách hàng */
export function loginCustomer(email, password, options = {}) {
  return apiRequest('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    ...options,
  });
}

/** POST /api/drivers/login — tài xế */
export function loginDriver(email, password, options = {}) {
  return apiRequest('/drivers/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    ...options,
  });
}

/** POST /api/register — khách hàng */
export function registerCustomer(payload) {
  return apiRequest('/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/** GET /api/profile — khách hàng (JWT) */
export function getCustomerProfile(options = {}) {
  return apiRequest('/profile', { auth: true, ...options });
}

/** GET /api/drivers/me/profile — tài xế (JWT) */
export function getDriverProfile(options = {}) {
  return apiRequest('/drivers/me/profile', { auth: true, ...options });
}
