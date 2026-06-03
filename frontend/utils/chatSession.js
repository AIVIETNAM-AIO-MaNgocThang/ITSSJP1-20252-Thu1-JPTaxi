const CHAT_SESSION_KEY = 'jpTaxiActiveRide';

export const fallbackChatSession = {
  tripId: '',
  requestId: '',
  customerId: null,
  driverId: null,
};

function numericString(value) {
  const raw = String(value ?? '');
  return /^\d+$/.test(raw) ? raw : '';
}

export function normalizeChatSession(session = {}) {
  return {
    ...fallbackChatSession,
    ...session,
    tripId: numericString(session.tripId ?? session.trip_id ?? fallbackChatSession.tripId),
    requestId: numericString(session.requestId ?? session.request_id ?? fallbackChatSession.requestId),
    customerId: Number(session.customerId ?? session.customer_id) || null,
    driverId: Number(session.driverId ?? session.driver_id) || null,
  };
}

export function getActiveChatSession() {
  try {
    const rawSession = window.sessionStorage.getItem(CHAT_SESSION_KEY);
    if (!rawSession) return fallbackChatSession;
    return normalizeChatSession(JSON.parse(rawSession));
  } catch {
    return fallbackChatSession;
  }
}

export function saveActiveChatSession(session) {
  const nextSession = normalizeChatSession(session);
  window.sessionStorage.setItem(CHAT_SESSION_KEY, JSON.stringify(nextSession));
  return nextSession;
}

export function getChatPath(audience, session = getActiveChatSession()) {
  const nextSession = normalizeChatSession(session);
  const params = new URLSearchParams();
  if (nextSession.tripId) params.set('tripId', nextSession.tripId);
  if (nextSession.requestId) params.set('requestId', nextSession.requestId);
  const query = params.toString();
  return query ? `/messages/${audience}?${query}` : `/messages/${audience}`;
}
