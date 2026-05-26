const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

export async function apiRequest(path, options = {}) {
  const token = window.localStorage.getItem('jpTaxiToken');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${path}`, {
    headers,
    ...options,
  });

  if (!response.ok) {
    let message = `API request failed: ${response.status}`;
    try {
      const errorBody = await response.json();
      message = errorBody?.message || errorBody?.error || message;
    } catch {
      /* keep the generic message */
    }
    throw new Error(message);
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    return null;
  }

  return response.json();
}

export { API_BASE };
