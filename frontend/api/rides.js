import { apiRequest } from './client.js';

export function createRideRequest(payload) {
  return apiRequest('/ride-requests', {
    method: 'POST',
    auth: true,
    body: JSON.stringify(payload),
  });
}

export function getRideRequest(requestId) {
  return apiRequest(`/ride-requests/${requestId}`, { auth: true });
}

export function updateRideRequestStatus(requestId, status) {
  return apiRequest(`/ride-requests/${requestId}/status`, {
    method: 'PATCH',
    auth: true,
    body: JSON.stringify({ status }),
  });
}

export function getPendingDispatch() {
  return apiRequest('/ride-requests/dispatches/me/pending', { auth: true });
}

export function acceptDispatch(dispatchId) {
  return apiRequest(`/ride-requests/dispatches/${dispatchId}/accept`, {
    method: 'POST',
    auth: true,
  });
}

export function rejectDispatch(dispatchId) {
  return apiRequest(`/ride-requests/dispatches/${dispatchId}/reject`, {
    method: 'POST',
    auth: true,
  });
}

export function postEstimate(payload) {
  return apiRequest('/estimate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}
