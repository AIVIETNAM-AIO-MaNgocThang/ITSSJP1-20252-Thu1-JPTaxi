import { authHeaders } from '../utils/session.js';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

export class ApiError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}

function parseErrorMessage(body, status) {
  if (!body) {
    return `リクエストに失敗しました（${status}）`;
  }
  const { message } = body;
  if (Array.isArray(message)) {
    return message.join(' ');
  }
  if (typeof message === 'string') {
    return message;
  }
  return `リクエストに失敗しました（${status}）`;
}

export async function apiRequest(path, options = {}) {
  const { auth, headers, ...rest } = options;
  let response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(auth ? authHeaders() : {}),
        ...headers,
      },
      ...rest,
    });
  } catch {
    throw new ApiError(
      `サーバーに接続できません（${API_BASE}）。バックエンドが起動しているか確認してください。`,
      0,
      null,
    );
  }

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new ApiError(parseErrorMessage(data, response.status), response.status, data);
  }

  if (!isJson) {
    return null;
  }

  return data;
}

/** multipart/form-data — không set Content-Type (browser tự gắn boundary) */
export async function apiFormData(path, formData, options = {}) {
  const { auth, headers: extraHeaders, ...rest } = options;
  const response = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    body: formData,
    headers: { ...(auth ? authHeaders() : {}), ...extraHeaders },
    ...rest,
  });

  const contentType = response.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    throw new ApiError(parseErrorMessage(data, response.status), response.status, data);
  }

  return data;
}

export { API_BASE };
